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

type WavConversionOptions = {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
};

export type GeminiLiveChatResponse = {
  transcript: string;
  audioBuffer: ArrayBuffer;
  audioMimeType: string;
};

type GeminiLiveChatParams = {
  apiKey: string;
  messages: Message[];
  systemPrompt: string;
  model?: string;
  voiceName?: string;
  onPartialTranscript?: (transcript: string) => void;
};

export async function getGeminiLiveChatResponse({
  apiKey,
  messages,
  systemPrompt,
  model = DEFAULT_GEMINI_LIVE_MODEL,
  voiceName = DEFAULT_GEMINI_VOICE_NAME,
  onPartialTranscript,
}: GeminiLiveChatParams): Promise<GeminiLiveChatResponse> {
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  try {
    return await runGeminiLiveChat({
      apiKey,
      messages,
      model,
      onPartialTranscript,
      systemPrompt,
      voiceName,
    });
  } catch (primaryError) {
    if (
      model !== DEFAULT_GEMINI_LIVE_MODEL ||
      model === FALLBACK_GEMINI_LIVE_MODEL
    ) {
      throw primaryError;
    }

    try {
      return await runGeminiLiveChat({
        apiKey,
        messages,
        model: FALLBACK_GEMINI_LIVE_MODEL,
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
  onPartialTranscript,
}: Required<
  Pick<GeminiLiveChatParams, "apiKey" | "messages" | "systemPrompt" | "model" | "voiceName">
> &
  Pick<GeminiLiveChatParams, "onPartialTranscript">
): Promise<GeminiLiveChatResponse> {
  const ai = new GoogleGenAI({
    apiKey,
    apiVersion: "v1alpha",
  });

  const audioParts: string[] = [];
  let audioMimeType = "";
  let transcript = "";
  let turnSettled = false;
  const resolvedVoiceName = resolveGeminiVoiceName(voiceName);

  let resolveTurn!: () => void;
  let rejectTurn!: (error: Error) => void;
  const turnFinished = new Promise<void>((resolve, reject) => {
    resolveTurn = resolve;
    rejectTurn = reject;
  });

  const session = await ai.live.connect({
    model,
    callbacks: {
      onmessage(message: LiveServerMessage) {
        collectAudio(message, audioParts, (mimeType) => {
          if (!audioMimeType && mimeType) {
            audioMimeType = mimeType;
          }
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
      },
      onerror(event: ErrorEvent) {
        if (!turnSettled) {
          turnSettled = true;
          rejectTurn(new Error(event.message || "Gemini Live connection failed."));
        }
      },
      onclose(event: CloseEvent) {
        if (!turnSettled) {
          turnSettled = true;
          rejectTurn(
            new Error(event.reason || "Gemini Live connection closed early.")
          );
        }
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

  if (!audioParts.length || !audioMimeType) {
    throw new Error("Gemini Live returned no audio.");
  }

  return {
    transcript: transcript.trim(),
    audioBuffer: convertToWav(audioParts, audioMimeType),
    audioMimeType,
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

function messagesToGeminiTurns(messages: Message[]): Content[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

function collectAudio(
  message: LiveServerMessage,
  audioParts: string[],
  onMimeType: (mimeType: string) => void
) {
  const parts = message.serverContent?.modelTurn?.parts;
  if (!parts?.length) {
    return;
  }

  for (const part of parts) {
    if (!part.inlineData?.data) {
      continue;
    }

    audioParts.push(part.inlineData.data);
    onMimeType(part.inlineData.mimeType ?? "");
  }
}

function getTranscriptChunk(message: LiveServerMessage): string {
  return message.serverContent?.outputTranscription?.text ?? "";
}

function convertToWav(rawData: string[], mimeType: string): ArrayBuffer {
  const options = parseMimeType(mimeType);
  const pcmChunks = rawData.map((data) => decodeBase64(data));
  const totalLength = pcmChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const wavHeader = createWavHeader(totalLength, options);
  const wavBytes = new Uint8Array(wavHeader.byteLength + totalLength);

  wavBytes.set(wavHeader, 0);

  let offset = wavHeader.byteLength;
  for (const chunk of pcmChunks) {
    wavBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return wavBytes.buffer;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType = "", ...params] = mimeType.split(";").map((value) => value.trim());
  const [, format = "L16"] = fileType.split("/");

  const options: WavConversionOptions = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16,
  };

  if (format.startsWith("L")) {
    const bitsPerSample = Number.parseInt(format.slice(1), 10);
    if (!Number.isNaN(bitsPerSample)) {
      options.bitsPerSample = bitsPerSample;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((item) => item.trim());
    if (key === "rate") {
      const sampleRate = Number.parseInt(value, 10);
      if (!Number.isNaN(sampleRate)) {
        options.sampleRate = sampleRate;
      }
    }
  }

  return options;
}

function createWavHeader(
  dataLength: number,
  options: WavConversionOptions
): Uint8Array {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function decodeBase64(data: string): Uint8Array {
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
