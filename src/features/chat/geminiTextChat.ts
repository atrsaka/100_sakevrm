import { GoogleGenAI } from "@google/genai";
import type { Message } from "../messages/messages";

/**
 * ElevenLabs 経路用のテキスト生成モデル。
 * Live ではない通常の generateContent 互換モデルを使う。
 * NEXT_PUBLIC_GEMINI_TEXT_MODEL で上書き可能。
 */
const DEFAULT_GEMINI_TEXT_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_TEXT_MODEL || "gemini-2.5-flash";

export type GeminiTextChatParams = {
  apiKey: string;
  messages: Message[];
  systemPrompt: string;
  model?: string;
  onPartialTranscript?: (transcript: string) => void;
};

/**
 * Gemini の通常 generateContent API を叩いてテキストを取得する。
 * Live API の TEXT modality は現行 preview で不安定なため、
 * 非 Live の generateContent を使う。
 */
export async function getGeminiTextChatResponse({
  apiKey,
  messages,
  systemPrompt,
  model = DEFAULT_GEMINI_TEXT_MODEL,
  onPartialTranscript,
}: GeminiTextChatParams): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Live 系モデル名が渡ってきた場合は非 Live 系にフォールバックする。
  // Live 系モデル名が渡ってきた場合は非 Live 系にフォールバック
  const resolvedModel = /-live-?/.test(model) ? DEFAULT_GEMINI_TEXT_MODEL : model;

  const contents = buildContents(messages);

  const stream = await ai.models.generateContentStream({
    model: resolvedModel,
    contents,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  let transcript = "";
  for await (const chunk of stream) {
    const piece = chunk.text ?? "";
    if (piece) {
      transcript += piece;
      onPartialTranscript?.(transcript);
    }
  }

  return transcript.trim();
}

type Content = {
  role: "user" | "model";
  parts: { text: string }[];
};

function buildContents(messages: Message[]): Content[] {
  const conversational = messages.filter(
    (message) => message.role !== "system",
  );

  if (conversational.length === 0) {
    throw new Error("Gemini text chat requires at least one user message.");
  }

  return conversational.map<Content>((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: message.name
          ? `${message.name}: ${message.content}`
          : message.content,
      },
    ],
  }));
}
