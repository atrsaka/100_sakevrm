/**
 * ElevenLabs 設定モジュール
 *
 * このアプリは ElevenLabs Conversational AI (Agents) を使います。
 * 事前にダッシュボードで Agent を作成し、セキュリティ設定の override で
 * 「エージェント言語 / 最初のメッセージ / システムプロンプト / ボイス」を
 * 有効化しておく必要があります。
 *
 * 必要に応じて .env.local に以下を追記してください:
 *
 *   NEXT_PUBLIC_ELEVENLABS_API_KEY=                  # voices 一覧取得で使用(任意)
 *   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=                 # ConvAI の Agent ID (必須)
 *   NEXT_PUBLIC_ELEVENLABS_VOICE_ID=                 # キャラチャット既定音声
 *   NEXT_PUBLIC_ELEVENLABS_PODCAST_YUKITO_VOICE_ID=  # ポッドキャスト Yukito
 *   NEXT_PUBLIC_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID=  # ポッドキャスト Kiyoka
 *
 * 注意: NEXT_PUBLIC_ プレフィックスの env はブラウザに露出します。
 * ローカル開発専用です。公開配信時は token relay サーバー経由に切り替えてください。
 */

export const DEFAULT_ELEVENLABS_MODEL_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

export const DEFAULT_ELEVENLABS_API_KEY =
  process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";

export const DEFAULT_ELEVENLABS_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";

export const DEFAULT_ELEVENLABS_VOICE_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "";

export const DEFAULT_ELEVENLABS_PODCAST_YUKITO_VOICE_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_PODCAST_YUKITO_VOICE_ID || "";

export const DEFAULT_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID || "";

// ElevenLabs streaming の PCM 出力は `pcm_16000` を使用する。
// lipSync の enqueuePCMChunk は任意の rate/channels の PCM に対応しており、
// 16bit mono 16kHz は既存の Gemini Live 経路と同じパイプラインでそのまま再生できる。
export const ELEVENLABS_PCM_SAMPLE_RATE = 16000;
export const ELEVENLABS_PCM_MIME_TYPE =
  `audio/pcm;rate=${ELEVENLABS_PCM_SAMPLE_RATE};channels=1`;

export type VoiceProvider = "gemini" | "elevenlabs";
export const DEFAULT_VOICE_PROVIDER: VoiceProvider = "gemini";
