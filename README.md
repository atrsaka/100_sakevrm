# GeminiVRM

`GeminiVRM` is a `ChatVRM`-based browser app that makes a VRM avatar answer with `Gemini Live` native audio.

## What changed

- Kept the original browser VRM viewer and speech-to-text input flow from [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM).
- Replaced the old `OpenAI + Koeiromap` response path with `Gemini Live`.
- Reused the WAV conversion pattern from the provided `ai_studio_code.ts` so Gemini PCM audio can drive the existing lip sync playback path.

## Features

- Start with the bundled `public/Kiyoka.vrm` avatar, or load a local `.vrm` file in the browser.
- Type a prompt or dictate it with the browser microphone.
- Receive a streamed Gemini Live transcript while the response is being generated.
- Play the final Gemini Live audio through the existing VRM lip sync pipeline.
- Change the live model, Gemini voice preset, and system prompt from the UI.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Leave the default live model as-is first.
3. Start chatting with the default `Kiyoka.vrm` avatar, or load another VRM from the settings panel.
4. Send a text prompt or use the microphone button.

If the default preview alias is not available for your account, switch the model to:

```text
gemini-2.5-flash-native-audio-preview-12-2025
```

## Environment variables

See [.env.example](./.env.example).

- `BASE_PATH`
  - Optional prefix for GitHub Pages or subpath deployment.
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
  - Optional default model shown in the UI.
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
  - Optional default Gemini prebuilt voice name.

## Verification

```bash
npm run build
```

## Notes

- This app currently sends the Gemini API key from the browser, matching the original local-first ChatVRM setup style.
- Old `/api/chat` and `/api/tts` routes were removed because Gemini Live now handles the response audio path directly.
