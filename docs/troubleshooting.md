---
title: Troubleshooting
---

# Troubleshooting

## Gemini Model Alias Is Unavailable

Try:

```text
gemini-2.5-flash-native-audio-preview-12-2025
```

## Audio Playback Does Not Start

- interact with the page once and retry
- confirm the browser has not blocked autoplay
- check the console for PCM metadata or fallback request errors

## Local Docs Link Opens A Missing Page

- use `npm run dev:all` when you want the app shortcut to point at the local docs server
- if you only run `npm run dev`, the app itself still works, but the separate docs server is not running

## Pages Build Behaves Differently From Local Build

- run `npm run build:pages` instead of a plain `next build` when validating Pages output
- let the build script recreate `.next-pages/` from a fresh static export

## Browser Uses Stale Chunks

- hard refresh the tab
- if the issue persists, stop the dev server and restart it
