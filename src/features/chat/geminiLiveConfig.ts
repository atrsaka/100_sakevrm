export const DEFAULT_GEMINI_LIVE_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ||
  "gemini-3.1-flash-live-preview";
export const FALLBACK_GEMINI_LIVE_MODEL =
  "gemini-2.5-flash-native-audio-preview-12-2025";
export const DEFAULT_GEMINI_VOICE_NAME =
  process.env.NEXT_PUBLIC_GEMINI_LIVE_VOICE || "Charon";

export const GEMINI_VOICE_PRESETS = [
  "Charon",
  "Aoede",
  "Puck",
  "Kore",
  "Leda",
  "Fenrir",
] as const;

export function resolveGeminiVoiceName(voiceName?: string) {
  const trimmedVoiceName = voiceName?.trim();
  return trimmedVoiceName || DEFAULT_GEMINI_VOICE_NAME;
}
