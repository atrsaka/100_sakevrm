<div align="center">
  <img src="./public/ogp.jpg" alt="GeminiVRM hero" width="960" />
  <h1>GeminiVRM</h1>
  <p>Browser-first VRM chat powered by Gemini Live native audio.</p>
  <p>
    <a href="https://github.com/Sunwood-ai-labs/GeminiVRM/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Sunwood-ai-labs/GeminiVRM/ci.yml?branch=main&label=ci" /></a>
    <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/Sunwood-ai-labs/GeminiVRM" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black" />
    <img alt="Gemini Live" src="https://img.shields.io/badge/Gemini-Live-2F7CF6" />
    <img alt="VRM" src="https://img.shields.io/badge/VRM-Avatar-00B894" />
  </p>
  <p>
    <strong>Languages</strong><br />
    <a href="./README.md">English</a> |
    <a href="./README.ja.md">日本語</a>
  </p>
</div>

## ✨ Overview

GeminiVRM is a polished fork of [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM) that replaces the old OpenAI + Koeiromap response path with Gemini Live native audio while keeping the browser-first VRM experience intact.

The current build focuses on:

- streamed Gemini Live audio playback so the avatar starts speaking before the full turn finishes
- a default `public/Kiyoka.vrm` model and configurable Gemini voice presets
- a local-first workflow where you can run everything in the browser with your own Gemini API key

## ✨ Features

- Stream Gemini Live transcript and audio in the browser
- Start with `public/Kiyoka.vrm` or load your own local `.vrm`
- Change the live model, prebuilt voice, and system prompt from the UI
- Configure an optional YouTube Live relay from `Settings` -> `Streaming` and receive live chat comments from a broadcast
- Reuse the existing VRM lip-sync pipeline with chunked PCM scheduling
- Run a lightweight smoke E2E check with Playwright
- Publish the static app to GitHub Pages

## 🧱 Tech Stack

- Next.js 15
- React 18
- `@google/genai`
- `@pixiv/three-vrm`
- TypeScript
- Tailwind CSS
- Playwright

## 🚀 Quick Start

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100), paste a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), and press `Start`.

To run the app and docs together, use:

```bash
npm run dev:all
```

This starts the app at `http://127.0.0.1:3100` and the docs at `http://127.0.0.1:4173`.

## 🔐 Environment Variables

See [.env.example](./.env.example).

- `NEXT_PUBLIC_GEMINI_API_KEY`
  - Optional local default key for browser use
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - Optional Google OAuth web client ID for the YouTube Live relay settings
- `BASE_PATH`
  - Optional prefix for GitHub Pages or subpath deployments
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
  - Optional default model shown in the UI
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
  - Optional default Gemini prebuilt voice name

If the default preview alias is not available for your account, switch the model to:

```text
gemini-2.5-flash-native-audio-preview-12-2025
```

## 🕹️ How To Use

1. Launch the app and enter a Gemini API key.
2. Keep the default `Kiyoka.vrm` model or load another VRM from `Settings`.
3. Send a text prompt or use the microphone button.
4. Adjust the live model, voice preset, and system prompt as needed.
5. Open `Settings` to tune the live model, voice preset, system prompt, and other core chat settings.
6. If you want live streaming support, open `Settings` -> `Streaming` -> `YouTube relay`, use `NEXT_PUBLIC_GOOGLE_CLIENT_ID` or paste a Google OAuth client ID into the page, sign in with Google, pick an active or upcoming broadcast, turn relay on, and toggle auto-reply separately if you want Gemini to answer incoming comments automatically while streaming this app window through YouTube Live Control Room or OBS.

## 🏗️ Project Structure

```text
public/                     Static VRM, images, and social assets
scripts/e2e-smoke.mjs       Lightweight browser smoke test
src/components/             UI components
src/features/chat/          Gemini Live transport and config
src/features/lipSync/       Audio playback and analysis
src/features/vrmViewer/     Viewer and model runtime
docs/                       Architecture, deployment, and QA notes
```

## 📚 Documentation

- Live docs (English): [https://sunwood-ai-labs.github.io/GeminiVRM/docs/](https://sunwood-ai-labs.github.io/GeminiVRM/docs/)
- Live docs (Japanese): [https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/)
- [Getting Started](./docs/getting-started.md)
- [Usage Guide](./docs/usage.md)
- [YouTube Relay Guide](./docs/youtube-relay.md)
- [Architecture notes](./docs/architecture.md)
- [Deployment guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Repository QA inventory](./docs/repository-qa-inventory.md)

Local docs commands:

```bash
npm run docs:build
npm run docs:preview
```

## 🧪 Verification

```bash
npm run verify
```

or run each step manually:

```bash
npm run lint
npm run build
npm run docs:build
npm run build:pages
npm run e2e:smoke
```

The smoke test checks that the app boots, the send flow works, and known chunk/icon/fallback request failures stay absent. When no Gemini API key is present, the missing-key error path is treated as a valid smoke outcome.

## 🌐 Deployment

The repository is prepared for GitHub Pages deployment through GitHub Actions.

- Static export uses `BASE_PATH` for subpath hosting
- `NEXT_EXPORT=true` enables a Pages-ready static build
- Pages artifacts are produced from `.next-pages`
- CI validates lint, build, and smoke E2E on every push and pull request

For step-by-step instructions, see [docs/deployment.md](./docs/deployment.md).

## ⚠️ Security Notes

- This project currently sends the Gemini API key from the browser, matching the original local-first ChatVRM setup style.
- The YouTube relay stores the Google OAuth client ID and short-lived YouTube access token in browser local storage until sign-out or token expiry so the session can be restored after reload.
- For public production deployments, prefer a token relay or another server-side key handling strategy.

## 🙏 Acknowledgements

- [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM)
- [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)
- [`@google/genai`](https://www.npmjs.com/package/@google/genai)
