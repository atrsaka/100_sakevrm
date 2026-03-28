import {
  GoogleGenAI,
  MediaResolution,
  Modality,
  type Content,
  type LiveServerMessage,
} from "@google/genai";
import type { Message } from "../messages/messages";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  FALLBACK_GEMINI_LIVE_MODEL,
  DEFAULT_GEMINI_VOICE_NAME,
  resolveGeminiVoiceName,
} from "./geminiLiveConfig";

export type GeminiLiveTurnResult = {
  transcript: string;
  audioMimeType: string;
  audioBytes: Uint8Array;
};

export type GeminiLiveChatResponse = GeminiLiveTurnResult;

export type GeminiLiveAudioChunk = {
  data: Uint8Array;
  mimeType: string;
};

type GeminiLiveChatParams = {
  apiKey: string;
  messages: Message[];
  systemPrompt: string;
  model?: string;
  voiceName?: string;
  onPartialTranscript?: (transcript: string) => void;
  onAudioChunk?: (chunk: GeminiLiveAudioChunk) => void;
};

export async function getGeminiLiveChatResponse({
  apiKey,
  messages,
  systemPrompt,
  model = DEFAULT_GEMINI_LIVE_MODEL,
  voiceName = DEFAULT_GEMINI_VOICE_NAME,
  onPartialTranscript,
  onAudioChunk,
}: GeminiLiveChatParams): Promise<GeminiLiveChatResponse> {
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  let primaryStreamStarted = false;
  const handlePrimaryAudioChunk = onAudioChunk
    ? (chunk: GeminiLiveAudioChunk) => {
        primaryStreamStarted = true;
        onAudioChunk(chunk);
      }
    : (chunk: GeminiLiveAudioChunk) => {
        primaryStreamStarted = true;
        void chunk;
      };

  try {
    return await runGeminiLiveChat({
      apiKey,
      messages,
      model,
      onAudioChunk: handlePrimaryAudioChunk,
      onPartialTranscript,
      systemPrompt,
      voiceName,
    });
  } catch (primaryError) {
    if (
      model !== DEFAULT_GEMINI_LIVE_MODEL ||
      model === FALLBACK_GEMINI_LIVE_MODEL ||
      primaryStreamStarted
    ) {
      throw primaryError;
    }

    try {
      return await runGeminiLiveChat({
        apiKey,
        messages,
        model: FALLBACK_GEMINI_LIVE_MODEL,
        onAudioChunk,
        onPartialTranscript,
        systemPrompt,
        voiceName,
      });
    } catch (fallbackError) {
      throw buildFallbackError(primaryError, fallbackError);
    }
  }
}

async function runGeminiLiveChat({
  apiKey,
  messages,
  systemPrompt,
  model,
  voiceName,
  onAudioChunk,
  onPartialTranscript,
}: Required<
  Pick<GeminiLiveChatParams, "apiKey" | "messages" | "systemPrompt" | "model" | "voiceName">
> &
  Pick<GeminiLiveChatParams, "onAudioChunk" | "onPartialTranscript">
): Promise<GeminiLiveChatResponse> {
  const ai = new GoogleGenAI({
    apiKey,
    apiVersion: "v1alpha",
  });

  let audioMimeType = "";
  let transcript = "";
  let turnSettled = false;
  let hasReceivedAudio = false;
  const audioChunks: Uint8Array[] = [];
  const resolvedVoiceName = resolveGeminiVoiceName(voiceName);
  let session: Awaited<ReturnType<typeof ai.live.connect>> | undefined;

  let resolveTurn!: () => void;
  let rejectTurn!: (error: Error) => void;
  const turnFinished = new Promise<void>((resolve, reject) => {
    resolveTurn = resolve;
    rejectTurn = reject;
  });

  const failTurn = (error: unknown) => {
    if (turnSettled) {
      return;
    }

    turnSettled = true;
    try {
      session?.close();
    } catch {
      // Ignore best-effort close failures after a streaming error.
    }

    rejectTurn(
      error instanceof Error
        ? error
        : new Error(String(error ?? "Gemini Live connection failed."))
    );
  };

  session = await ai.live.connect({
    model,
    callbacks: {
      onmessage(message: LiveServerMessage) {
        try {
          collectAudio(message, ({ data, mimeType }) => {
            const resolvedMimeType = mimeType || audioMimeType;

            hasReceivedAudio = true;
            audioChunks.push(data);
            if (!audioMimeType && resolvedMimeType) {
              audioMimeType = resolvedMimeType;
            }

            onAudioChunk?.({
              data,
              mimeType: resolvedMimeType,
            });
          });

          const nextTranscript = getTranscriptChunk(message);
          if (nextTranscript) {
            transcript += nextTranscript;
            onPartialTranscript?.(transcript);
          }

          if (message.serverContent?.turnComplete && !turnSettled) {
            turnSettled = true;
            resolveTurn();
          }
        } catch (error) {
          failTurn(error);
        }
      },
      onerror(event: ErrorEvent) {
        failTurn(new Error(event.message || "Gemini Live connection failed."));
      },
      onclose(event: CloseEvent) {
        failTurn(new Error(event.reason || "Gemini Live connection closed early."));
      },
      onopen() {
        // The session is ready once connect resolves.
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: resolvedVoiceName,
          },
        },
      },
      outputAudioTranscription: {},
      systemInstruction: systemPrompt,
    },
  });

  try {
    session.sendClientContent({
      turns: messagesToGeminiTurns(messages),
      turnComplete: true,
    });

    await turnFinished;
  } finally {
    session.close();
  }

  if (!hasReceivedAudio || !audioMimeType) {
    throw new Error("Gemini Live returned no audio.");
  }

  return {
    transcript: transcript.trim(),
    audioMimeType,
    audioBytes: concatenateAudioChunks(audioChunks),
  };
}

function buildFallbackError(primaryError: unknown, fallbackError: unknown) {
  const primaryMessage =
    primaryError instanceof Error ? primaryError.message : String(primaryError);
  const fallbackMessage =
    fallbackError instanceof Error ? fallbackError.message : String(fallbackError);

  return new Error(
    [
      `Gemini Live failed with default model "${DEFAULT_GEMINI_LIVE_MODEL}".`,
      `Fallback model "${FALLBACK_GEMINI_LIVE_MODEL}" also failed.`,
      `Primary error: ${primaryMessage}`,
      `Fallback error: ${fallbackMessage}`,
    ].join(" ")
  );
}

export function messagesToGeminiTurns(messages: Message[]): Content[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

function collectAudio(
  message: LiveServerMessage,
  onAudioChunk: (chunk: GeminiLiveAudioChunk) => void
) {
  const parts = message.serverContent?.modelTurn?.parts;
  if (!parts?.length) {
    return;
  }

  for (const part of parts) {
    if (!part.inlineData?.data) {
      continue;
    }

    onAudioChunk({
      data: decodeBase64(part.inlineData.data),
      mimeType: part.inlineData.mimeType ?? "",
    });
  }
}

function getTranscriptChunk(message: LiveServerMessage): string {
  return message.serverContent?.outputTranscription?.text ?? "";
}

function decodeBase64(data: string): Uint8Array {
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function concatenateAudioChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}
