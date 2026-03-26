# GeminiVRM Deployment Guide

## Local Development

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open `http://127.0.0.1:3100`, enter a Gemini API key, and start chatting.

## Local Verification

```bash
npm run verify
```

or run the steps one by one:

```bash
npm run lint
npm run build
npm run e2e:smoke
```

The smoke test expects a local server on `http://127.0.0.1:3100`.

## GitHub Pages

This repository is prepared to deploy the static app to GitHub Pages.

Deployment assumptions:

- `BASE_PATH` is set to `/<repo-name>`
- `NEXT_EXPORT=true` enables static export during the build
- the generated artifact is uploaded from `out/`

The Pages workflow is designed for:

- pushes to `main`
- manual workflow dispatch

## Runtime Configuration

Optional public environment variables:

- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `NEXT_PUBLIC_GEMINI_API_KEY`

For public deployments, avoid shipping a real Gemini API key in repository secrets intended for client-side exposure. The recommended production path is a backend relay or another server-managed token design.

## Troubleshooting

- If the preview model alias is unavailable, use `gemini-2.5-flash-native-audio-preview-12-2025`.
- If playback is blocked, interact with the page once and retry.
- If a browser tab keeps old dev chunks, perform a hard refresh.
