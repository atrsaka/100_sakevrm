---
title: Getting Started
---

# Getting Started

## Prerequisites

- Node.js 20 or later
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- A browser with microphone and WebGL support if you want the full chat + avatar flow

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
5. Open `Settings` to tune the model, voice, and system prompt.

## Useful Environment Variables

- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `BASE_PATH`
- `NEXT_PUBLIC_DOCS_URL`
