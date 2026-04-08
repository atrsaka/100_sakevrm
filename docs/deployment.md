# GeminiVRM Deployment Guide

## Local Development

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open `http://127.0.0.1:3100`, enter a Gemini API key, and start chatting.

For the app plus docs together, use:

```bash
npm run dev:all
```

That starts:

- the app at `http://127.0.0.1:3100`
- the docs at `http://127.0.0.1:4173`

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

## Docs Build And Preview

```bash
npm run docs:build
npm run docs:preview
```

`docs:preview` serves the generated VitePress site at `http://127.0.0.1:4174`.

## GitHub Pages

This repository is prepared to deploy the static app to GitHub Pages.

Deployment assumptions:

- `BASE_PATH` is set to `/<repo-name>`
- `NEXT_EXPORT=true` enables static export during the build
- the generated artifact is uploaded from `.next-pages/`
- the VitePress docs are copied into `.next-pages/docs/`

The Pages workflow is designed for:

- pushes to `main`
- manual workflow dispatch

Published URLs follow this pattern:

- app root: `https://<account>.github.io/<repo>/`
- docs root: `https://<account>.github.io/<repo>/docs/`
- Japanese docs root: `https://<account>.github.io/<repo>/docs/ja/`

## Runtime Configuration

Optional public environment variables:

- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

GeminiVRM is tuned for `gemini-3.1-flash-live-preview`, and automatic fallback
to older Gemini Live preview models is disabled.

If you expose the optional YouTube relay in a deployed environment:

- configure the Google OAuth web client for the exact browser origin you publish
- expect sign-in and relay tokens to stay browser-side and to be restored from local storage until sign-out or expiry

For public deployments, avoid shipping a real Gemini API key in repository secrets intended for client-side exposure. The recommended production path is a backend relay or another server-managed token design. The same caution applies if you want tighter control over YouTube auth in production.

## Troubleshooting

- Keep `NEXT_PUBLIC_GEMINI_LIVE_MODEL` on `gemini-3.1-flash-live-preview` unless you are intentionally testing another Live model.
- If playback is blocked, interact with the page once and retry.
- If a browser tab keeps old dev chunks, perform a hard refresh.
- If you switch between `next build` and `next dev`, restart the dev server before validating the browser runtime again.
- If you are validating the published docs surface, use `npm run build:pages` instead of only `npm run build`.
