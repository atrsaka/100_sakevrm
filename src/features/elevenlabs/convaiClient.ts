import { ELEVENLABS_PCM_MIME_TYPE } from "../tts/elevenLabsConfig";

/**
 * ElevenLabs Conversational AI (Agents) の WebSocket クライアント。
 *
 * 2 つの使い方を提供する:
 *
 *   1) `runConvaiTurn(...)` - 1 ターンを 1 ショットで実行(キャラチャット用)
 *   2) `openConvaiSession(...)` - 1 つの WebSocket を開きっぱなしにして
 *      `session.sendTurn(...)` を繰り返し呼べる持続セッション。
 *      ポッドキャストのようにホスト毎のセッションを使い回す用途向け。
 *
 * ConvAI は override (system_prompt / voice / language / first_message) を init 時のみ
 * 適用できるため、ホスト単位で 1 本ずつ WebSocket を張り、交互に sendTurn する構成にする。
 *
 * ターン終了検出について:
 * ConvAI プロトコルには明示的な turn_complete イベントが無い。
 * ここでは「agent_response を受信し、かつ audio chunk が 600ms 以上途切れた」ことで
 * ターン終了とみなすヒューリスティックを使う。
 */

export type ConvaiOverrides = {
  systemPrompt: string;
  voiceId: string;
  language?: string;
  firstMessage?: string;
};

export type ConvaiTurnSinks = {
  onAudioChunk: (pcm: Uint8Array, mimeType: string) => void;
  onPartialTranscript?: (text: string) => void;
};

export type ConvaiTurnResult = {
  transcript: string;
};

export type ConvaiTurnParams = ConvaiTurnSinks & {
  agentId: string;
  apiKey?: string;
  userText: string;
  overrides: ConvaiOverrides;
  signal?: AbortSignal;
};

export type ConvaiSessionParams = {
  agentId: string;
  apiKey?: string;
  overrides: ConvaiOverrides;
  signal?: AbortSignal;
};

export type ConvaiSession = {
  /** 1 ターン分の会話を送る。複数回呼べる */
  sendTurn: (
    params: ConvaiTurnSinks & { userText: string },
  ) => Promise<ConvaiTurnResult>;
  /** セッションを明示的に閉じる */
  close: (reason?: unknown) => void;
  readonly closed: boolean;
};

const WSS_BASE = "wss://api.elevenlabs.io/v1/convai/conversation";
const SIGNED_URL_BASE =
  "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";

// ターン終了検出: agent_response 受信 + audio chunk が N ms 途切れたら done
const TURN_AUDIO_IDLE_MS = 600;

async function resolveSocketUrl(
  agentId: string,
  apiKey?: string,
): Promise<string> {
  const directUrl =
    `${WSS_BASE}?agent_id=${encodeURIComponent(agentId)}` +
    `&output_format=pcm_16000`;

  if (!apiKey) return directUrl;

  try {
    const res = await fetch(
      `${SIGNED_URL_BASE}?agent_id=${encodeURIComponent(agentId)}`,
      {
        method: "GET",
        headers: { "xi-api-key": apiKey, accept: "application/json" },
      },
    );
    if (!res.ok) return directUrl;
    const body = (await res.json()) as { signed_url?: string };
    if (body.signed_url) {
      const sep = body.signed_url.includes("?") ? "&" : "?";
      return `${body.signed_url}${sep}output_format=pcm_16000`;
    }
  } catch {
    // fallthrough
  }
  return directUrl;
}

/**
 * 持続 ConvAI セッションを開く。
 * WebSocket を開いて conversation_initiation_metadata を受け取るまで待機してから resolve する。
 * その後 sendTurn を複数回呼んで使い回せる。
 */
export async function openConvaiSession(
  params: ConvaiSessionParams,
): Promise<ConvaiSession> {
  if (!params.agentId) {
    throw new Error("ElevenLabs agent_id is required.");
  }
  if (!params.overrides.voiceId) {
    throw new Error("ElevenLabs voice_id override is required.");
  }

  const socketUrl = await resolveSocketUrl(params.agentId, params.apiKey);
  const ws = new WebSocket(socketUrl);

  let isReady = false;
  let closedByCaller = false;
  let sessionClosed = false;
  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const readyPromise = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  type TurnState = {
    audioSink: ConvaiTurnSinks["onAudioChunk"];
    partialSink: ConvaiTurnSinks["onPartialTranscript"] | null;
    transcript: string;
    receivedAudio: boolean;
    gotAgentResponse: boolean;
    audioIdleTimer: ReturnType<typeof setTimeout> | null;
    resolve: (result: ConvaiTurnResult) => void;
    reject: (error: Error) => void;
  };
  let activeTurn: TurnState | null = null;

  const clearAudioIdleTimer = (turn: TurnState) => {
    if (turn.audioIdleTimer) {
      clearTimeout(turn.audioIdleTimer);
      turn.audioIdleTimer = null;
    }
  };

  const finishTurn = (turn: TurnState) => {
    if (activeTurn !== turn) return;
    activeTurn = null;
    clearAudioIdleTimer(turn);
    if (!turn.receivedAudio) {
      turn.reject(new Error("ElevenLabs agent returned no audio."));
      return;
    }
    turn.resolve({ transcript: turn.transcript.trim() });
  };

  const startAudioIdleTimer = (turn: TurnState) => {
    clearAudioIdleTimer(turn);
    turn.audioIdleTimer = setTimeout(() => {
      if (turn.gotAgentResponse) {
        finishTurn(turn);
      } else {
        // agent_response が来る前に audio が止まった場合ももう少しだけ待って終える
        turn.audioIdleTimer = setTimeout(() => {
          finishTurn(turn);
        }, TURN_AUDIO_IDLE_MS);
      }
    }, TURN_AUDIO_IDLE_MS);
  };

  const failSession = (error: unknown) => {
    if (sessionClosed) return;
    sessionClosed = true;
    const err =
      error instanceof Error
        ? error
        : new Error(String(error ?? "ElevenLabs ConvAI failed."));
    if (!isReady) rejectReady(err);
    if (activeTurn) {
      const turn = activeTurn;
      activeTurn = null;
      clearAudioIdleTimer(turn);
      turn.reject(err);
    }
    try {
      ws.close();
    } catch {
      // ignore
    }
  };

  ws.addEventListener("open", () => {
    const initPayload = {
      type: "conversation_initiation_client_data",
      conversation_config_override: {
        agent: {
          prompt: { prompt: params.overrides.systemPrompt },
          first_message: params.overrides.firstMessage ?? "",
          language: params.overrides.language ?? "ja",
        },
        tts: {
          voice_id: params.overrides.voiceId,
        },
      },
    };
    ws.send(JSON.stringify(initPayload));
  });

  ws.addEventListener("message", (event) => {
    try {
      const raw =
        typeof event.data === "string" ? event.data : String(event.data);
      const message = JSON.parse(raw) as Record<string, unknown>;
      const type = message.type as string | undefined;

      switch (type) {
        case "conversation_initiation_metadata": {
          if (!isReady) {
            isReady = true;
            resolveReady();
          }
          break;
        }
        case "audio": {
          const audioEvent = (message.audio_event ?? {}) as {
            audio_base_64?: string;
          };
          const base64 = audioEvent.audio_base_64;
          if (!base64) break;
          const pcm = decodeBase64(base64);
          if (pcm.byteLength === 0) break;
          if (activeTurn) {
            activeTurn.receivedAudio = true;
            activeTurn.audioSink(pcm, ELEVENLABS_PCM_MIME_TYPE);
            startAudioIdleTimer(activeTurn);
          }
          break;
        }
        case "agent_response": {
          const agentEvent = (message.agent_response_event ?? {}) as {
            agent_response?: string;
          };
          if (agentEvent.agent_response && activeTurn) {
            activeTurn.transcript = agentEvent.agent_response;
            activeTurn.gotAgentResponse = true;
            activeTurn.partialSink?.(activeTurn.transcript);
            // agent_response が来たら、直ちにではなく audio idle で確定させる
            if (!activeTurn.audioIdleTimer) {
              startAudioIdleTimer(activeTurn);
            }
          }
          break;
        }
        case "agent_response_correction": {
          const correctionEvent = (message.agent_response_correction_event ??
            {}) as { corrected_agent_response?: string };
          if (correctionEvent.corrected_agent_response && activeTurn) {
            activeTurn.transcript = correctionEvent.corrected_agent_response;
            activeTurn.partialSink?.(activeTurn.transcript);
          }
          break;
        }
        case "ping": {
          const pingEvent = (message.ping_event ?? {}) as { event_id?: number };
          try {
            ws.send(
              JSON.stringify({
                type: "pong",
                event_id: pingEvent.event_id ?? 0,
              }),
            );
          } catch {
            // ignore send failures during cleanup
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      failSession(error);
    }
  });

  ws.addEventListener("error", () => {
    failSession(new Error("ElevenLabs ConvAI WebSocket error."));
  });

  ws.addEventListener("close", (event) => {
    if (closedByCaller) return;
    if (sessionClosed) return;
    failSession(
      new Error(
        `ElevenLabs ConvAI session closed unexpectedly (code=${event.code}, reason=${event.reason || "unknown"}).`,
      ),
    );
  });

  if (params.signal) {
    if (params.signal.aborted) {
      failSession(new Error("Aborted before ConvAI session opened."));
    } else {
      params.signal.addEventListener("abort", () => {
        failSession(new Error("ConvAI session aborted."));
      });
    }
  }

  await readyPromise;

  const session: ConvaiSession = {
    sendTurn: ({ userText, onAudioChunk, onPartialTranscript }) => {
      if (sessionClosed) {
        return Promise.reject(
          new Error("ConvAI session is already closed."),
        );
      }
      if (activeTurn) {
        return Promise.reject(
          new Error("Previous ConvAI turn is still in progress."),
        );
      }
      if (!userText.trim()) {
        return Promise.reject(
          new Error("ConvAI turn requires non-empty user text."),
        );
      }

      return new Promise<ConvaiTurnResult>((resolve, reject) => {
        const turn: TurnState = {
          audioSink: onAudioChunk,
          partialSink: onPartialTranscript ?? null,
          transcript: "",
          receivedAudio: false,
          gotAgentResponse: false,
          audioIdleTimer: null,
          resolve,
          reject,
        };
        activeTurn = turn;
        try {
          ws.send(
            JSON.stringify({
              type: "user_message",
              text: userText,
            }),
          );
        } catch (error) {
          activeTurn = null;
          reject(
            error instanceof Error
              ? error
              : new Error("Failed to send user_message."),
          );
        }
      });
    },
    close: (reason) => {
      if (sessionClosed) return;
      closedByCaller = true;
      sessionClosed = true;
      if (activeTurn) {
        const turn = activeTurn;
        activeTurn = null;
        clearAudioIdleTimer(turn);
        turn.reject(
          new Error(
            reason instanceof Error
              ? reason.message
              : String(reason ?? "session closed"),
          ),
        );
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
    },
    get closed() {
      return sessionClosed;
    },
  };

  return session;
}

/**
 * 1 ターンを 1 ショットで実行する。キャラチャット用。
 * 内部的には openConvaiSession → sendTurn → close の流れで処理する。
 */
export async function runConvaiTurn(
  params: ConvaiTurnParams,
): Promise<ConvaiTurnResult> {
  if (!params.userText.trim()) {
    throw new Error("ConvAI turn requires non-empty user text.");
  }
  const session = await openConvaiSession({
    agentId: params.agentId,
    apiKey: params.apiKey,
    overrides: params.overrides,
    signal: params.signal,
  });
  try {
    return await session.sendTurn({
      userText: params.userText,
      onAudioChunk: params.onAudioChunk,
      onPartialTranscript: params.onPartialTranscript,
    });
  } finally {
    session.close("turn finished");
  }
}

function decodeBase64(data: string): Uint8Array {
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
