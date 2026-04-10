import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  ELEVENLABS_PCM_MIME_TYPE,
  ELEVENLABS_PCM_SAMPLE_RATE,
} from "./elevenLabsConfig";

const ELEVENLABS_BASE = "https://api.elevenlabs.io";

export type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
};

/**
 * ユーザーの ElevenLabs アカウントに紐づく voice 一覧を取得する。
 * "My Voices" (cloned/generated/premade など) が含まれる。
 */
export async function listElevenLabsVoices(
  apiKey: string,
): Promise<ElevenLabsVoice[]> {
  if (!apiKey) {
    throw new Error("ElevenLabs API key is required.");
  }

  const response = await fetch(`${ELEVENLABS_BASE}/v1/voices`, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs voices fetch failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as { voices?: ElevenLabsVoice[] };
  return Array.isArray(json.voices) ? json.voices : [];
}

export type StreamElevenLabsTtsParams = {
  apiKey: string;
  voiceId: string;
  text: string;
  modelId?: string;
  /** PCM16 16kHz mono のチャンクが到着するたびに呼ばれる */
  onChunk: (chunk: Uint8Array, mimeType: string) => void;
  signal?: AbortSignal;
};

/**
 * ElevenLabs のテキスト→音声を streaming エンドポイントで呼び出す。
 * `output_format=pcm_16000` を指定するため、レスポンス body は
 * 生の PCM16 mono 16kHz バイト列として順次到着する。
 */
export async function streamElevenLabsTts({
  apiKey,
  voiceId,
  text,
  modelId = DEFAULT_ELEVENLABS_MODEL_ID,
  onChunk,
  signal,
}: StreamElevenLabsTtsParams): Promise<void> {
  if (!apiKey) {
    throw new Error("ElevenLabs API key is required.");
  }
  if (!voiceId) {
    throw new Error("ElevenLabs voice ID is required.");
  }
  if (!text.trim()) {
    throw new Error("ElevenLabs TTS requires non-empty text.");
  }

  const url =
    `${ELEVENLABS_BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream` +
    `?output_format=pcm_${ELEVENLABS_PCM_SAMPLE_RATE}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json",
      accept: "audio/pcm",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS request failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value && value.byteLength > 0) {
      onChunk(value, ELEVENLABS_PCM_MIME_TYPE);
    }
  }
}
