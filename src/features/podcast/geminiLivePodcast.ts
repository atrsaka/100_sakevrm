import {
  GoogleGenAI,
  type LiveSendRealtimeInputParameters,
  MediaResolution,
  Modality,
  type LiveServerMessage,
} from "@google/genai";
import type { Message } from "../messages/messages";
import { buildPodcastRelayFallbackLogPayload } from "./podcastDebug";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  DEFAULT_GEMINI_VOICE_NAME,
  resolveGeminiVoiceName,
} from "../chat/geminiLiveConfig";
import {
  getGeminiLiveChatResponse,
  type GeminiLiveAudioChunk,
  messagesToGeminiTurns,
  type GeminiLiveTurnResult,
} from "../chat/geminiLiveChat";

export type GeminiLiveAudioRelayResponse = GeminiLiveTurnResult & {
  inputTranscript: string;
  usedFallbackTextInput: boolean;
};

type GeminiLiveAudioRelayParams = {
  apiKey: string;
  historyMessages: Message[];
  systemPrompt: string;
  relayAudioBytes: Uint8Array;
  relayAudioMimeType: string;
  relayTranscript?: string;
  model?: string;
  voiceName?: string;
  onPartialTranscript?: (transcript: string) => void;
  onAudioChunk?: (chunk: GeminiLiveAudioChunk) => void;
};

export async function getGeminiLiveAudioRelayResponse({
  apiKey,
  historyMessages,
  systemPrompt,
  relayAudioBytes,
  relayAudioMimeType,
  relayTranscript,
  model = DEFAULT_GEMINI_LIVE_MODEL,
  voiceName = DEFAULT_GEMINI_VOICE_NAME,
  onPartialTranscript,
  onAudioChunk,
}: GeminiLiveAudioRelayParams): Promise<GeminiLiveAudioRelayResponse> {
  try {
    const response = await runGeminiLiveAudioRelay({
      apiKey,
      historyMessages,
      model,
      systemPrompt,
      voiceName,
      relayAudioBytes,
      relayAudioMimeType,
      onAudioChunk,
      onPartialTranscript,
    });

    return {
      ...response,
      usedFallbackTextInput: false,
    };
  } catch (audioRelayError) {
    const trimmedTranscript = relayTranscript?.trim();
    if (!trimmedTranscript) {
      throw audioRelayError;
    }

    console.warn(
      "Podcast audio relay fell back to transcript input.",
      buildPodcastRelayFallbackLogPayload({
        relayAudioMimeType,
        relayAudioBytesLength: relayAudioBytes.byteLength,
        relayTranscript: trimmedTranscript,
        error:
          audioRelayError instanceof Error
            ? audioRelayError.message
            : String(audioRelayError),
      }),
    );

    const fallbackResponse = await getGeminiLiveChatResponse({
      apiKey,
      messages: [
        ...historyMessages,
        {
          role: "user",
          content: trimmedTranscript,
          name: "PARTNER",
          source: "podcast",
        },
      ],
      systemPrompt,
      model,
      voiceName,
      onAudioChunk,
      onPartialTranscript,
    });

    return {
      ...fallbackResponse,
      inputTranscript: trimmedTranscript,
      usedFallbackTextInput: true,
    };
  }
}

async function runGeminiLiveAudioRelay({
  apiKey,
  historyMessages,
  systemPrompt,
  model,
  voiceName,
  relayAudioBytes,
  relayAudioMimeType,
  onAudioChunk,
  onPartialTranscript,
}: Required<
  Pick<
    GeminiLiveAudioRelayParams,
    | "apiKey"
    | "historyMessages"
    | "systemPrompt"
    | "model"
    | "voiceName"
    | "relayAudioBytes"
    | "relayAudioMimeType"
  >
> &
  Pick<
    GeminiLiveAudioRelayParams,
    "onAudioChunk" | "onPartialTranscript"
  >): Promise<GeminiLiveAudioRelayResponse> {
  const ai = new GoogleGenAI({
    apiKey,
    apiVersion: "v1alpha",
  });

  let audioMimeType = "";
  let outputTranscript = "";
  let inputTranscript = "";
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
        : new Error(String(error ?? "Gemini Live audio relay failed."))
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

          const nextInputTranscript = getInputTranscriptChunk(message);
          if (nextInputTranscript) {
            inputTranscript += nextInputTranscript;
          }

          const nextOutputTranscript = getOutputTranscriptChunk(message);
          if (nextOutputTranscript) {
            outputTranscript += nextOutputTranscript;
            onPartialTranscript?.(outputTranscript);
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
        failTurn(new Error(event.message || "Gemini Live audio relay failed."));
      },
      onclose(event: CloseEvent) {
        failTurn(
          new Error(event.reason || "Gemini Live audio relay closed early.")
        );
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
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemPrompt,
    },
  });

  try {
    if (historyMessages.length > 0) {
      session.sendClientContent({
        turns: messagesToGeminiTurns(historyMessages),
        turnComplete: false,
      });
    }

    const normalizedRelayAudio = normalizeRelayAudio(
      relayAudioBytes,
      relayAudioMimeType,
    );
    const relayAudioBlob =
      {
        data: encodeBase64(normalizedRelayAudio.data),
        mimeType: normalizedRelayAudio.mimeType,
      } as NonNullable<LiveSendRealtimeInputParameters["audio"]>;

    session.sendRealtimeInput({
      audio: relayAudioBlob,
      audioStreamEnd: true,
    });

    await turnFinished;
  } finally {
    session.close();
  }

  if (!hasReceivedAudio || !audioMimeType) {
    throw new Error("Gemini Live returned no audio for the podcast relay.");
  }

  return {
    transcript: outputTranscript.trim(),
    audioMimeType,
    audioBytes: concatenateAudioChunks(audioChunks),
    inputTranscript: inputTranscript.trim(),
    usedFallbackTextInput: false,
  };
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

function getInputTranscriptChunk(message: LiveServerMessage): string {
  return message.serverContent?.inputTranscription?.text ?? "";
}

function getOutputTranscriptChunk(message: LiveServerMessage): string {
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

function encodeBase64(data: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < data.byteLength; index += 1) {
    binary += String.fromCharCode(data[index]);
  }

  return window.btoa(binary);
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

function normalizeRelayAudio(
  data: Uint8Array,
  mimeType: string,
): { data: Uint8Array; mimeType: string } {
  const normalizedMimeType = mimeType || "audio/pcm;rate=24000;channels=1";
  const bytesPerFrame = getBytesPerFrame(normalizedMimeType);
  if (bytesPerFrame <= 0) {
    return { data, mimeType: normalizedMimeType };
  }

  const remainder = data.byteLength % bytesPerFrame;
  const padded =
    remainder === 0
      ? data
      : (() => {
          const next = new Uint8Array(
            data.byteLength + (bytesPerFrame - remainder),
          );
          next.set(data);
          return next;
        })();
  const sampleRate = getSampleRate(normalizedMimeType);
  const channels = getChannels(normalizedMimeType);

  if (sampleRate !== 16000 && channels === 1) {
    return {
      data: resamplePcm16Mono(padded, sampleRate, 16000),
      mimeType: "audio/pcm;rate=16000;channels=1",
    };
  }

  return { data: padded, mimeType: normalizedMimeType };
}

function getBytesPerFrame(mimeType: string): number {
  const normalizedMimeType = mimeType.toLowerCase();
  const channels = getChannels(normalizedMimeType);
  const bitsPerSample = Number.parseInt(
    normalizedMimeType.match(/l(\d+)/)?.[1] ?? "16",
    10,
  );

  return Math.max((bitsPerSample / 8) * channels, 1);
}

function getChannels(mimeType: string): number {
  return Number.parseInt(mimeType.match(/channels=(\d+)/)?.[1] ?? "1", 10);
}

function getSampleRate(mimeType: string): number {
  return Number.parseInt(mimeType.match(/rate=(\d+)/)?.[1] ?? "24000", 10);
}

function resamplePcm16Mono(
  input: Uint8Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Uint8Array {
  if (inputSampleRate <= 0 || inputSampleRate === outputSampleRate) {
    return input;
  }

  const inputSamples = new Int16Array(
    input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength),
  );
  const outputLength = Math.max(
    1,
    Math.round((inputSamples.length * outputSampleRate) / inputSampleRate),
  );
  const outputSamples = new Int16Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = (index * inputSampleRate) / outputSampleRate;
    const leftIndex = Math.floor(sourcePosition);
    const rightIndex = Math.min(leftIndex + 1, inputSamples.length - 1);
    const blend = sourcePosition - leftIndex;
    const leftSample = inputSamples[leftIndex] ?? 0;
    const rightSample = inputSamples[rightIndex] ?? leftSample;
    outputSamples[index] = Math.round(
      leftSample * (1 - blend) + rightSample * blend,
    );
  }

  return new Uint8Array(outputSamples.buffer.slice(0));
}
