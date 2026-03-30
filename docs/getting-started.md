---
title: Getting Started
---

# Getting Started

## Prerequisites

- Node.js 20 or later
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- A browser with microphone and WebGL support if you want the full chat + avatar flow
- A Google OAuth web client ID if you want to use the optional YouTube Live relay

## Install Dependencies

```bash
npm install
```

## Run The App

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open `http://127.0.0.1:3100`, paste your Gemini API key, and press `Start`.

## Run The App And Docs Together

```bash
npm run dev:all
```

This starts:

- the app at `http://127.0.0.1:3100`
- the VitePress docs at `http://127.0.0.1:4173`

## First Successful Session Checklist

1. Confirm the default `Kiyoka.vrm` model loads.
2. Enter a Gemini API key.
3. Send a short prompt from the message box.
4. Wait for the assistant transcript and streamed audio playback.
5. Open `Settings` to tune the model, voice, system prompt, and motion preset.

## Optional Podcast Mode Quick Start

If you want to verify the new dual-host flow right away:

1. Open `Settings` and switch `Conversation mode` to `Podcast mode`.
2. Wait for both `Kiyoka` and `Yukito` viewers to finish loading.
3. Open `Podcast settings` if you want to change the max loop count or assign different prebuilt voices per host.
4. Type a short topic and send it.
5. Confirm the stage alternates speakers and stops automatically when the configured turn count is reached.

## Optional YouTube Relay Setup

If you want live chat comments to flow into Gemini:

1. Create a Google OAuth web client ID that allows the exact origin you use for the app.
2. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` or paste the client ID into `Settings` -> `Streaming` -> `YouTube relay`.
3. Sign in with Google, refresh the broadcast list, and pick the active or upcoming stream you want to monitor.
4. Enable relay mode, then optionally enable auto-reply once the stream is ready.
5. The browser restores the saved client ID and short-lived access token from local storage until you sign out or the token expires.

For the full setup, relay behavior, and troubleshooting flow, see the [YouTube Relay Guide](./youtube-relay.md).

## Useful Environment Variables

- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `BASE_PATH`
- `NEXT_PUBLIC_DOCS_URL`
