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

## Podcast Benchmark Reloads Or Never Finishes

Symptoms:

- Playwright fails with `Execution context was destroyed`, `page.reload timeout`, or `ERR_CONNECTION_REFUSED`
- Next.js logs `Fast Refresh had to perform a full reload` while the benchmark is running
- repeated benchmark runs become slower or stop accepting the topic

Cause:

- benchmark artifacts were written into the repository while `next dev` was watching the workspace, so each artifact write could trigger a reload and invalidate the browser session

Prevention:

- run Japanese or UTF-8 topics through `npm run bench:podcast:topic -- <topic-file>`
- keep `E2E_BENCH_OUTPUT_DIR` outside the repository; the benchmark runner now defaults to the system temp directory
- use `E2E_BENCH_MODES=streaming` or `E2E_BENCH_MODES=batch` if you want isolated retries per mode
- if you need many repeated samples under `next dev`, restart the dev server between isolated runs

## Google Blocks YouTube Sign-In

- if the OAuth consent screen is still in testing, add the Google account you use for the relay as a test user
- confirm the authorized JavaScript origin matches the exact app URL, including `127.0.0.1` vs `localhost`
- sign in again from `Settings` -> `Streaming` -> `YouTube relay` after the change propagates

## YouTube Relay Does Not Receive Comments

- confirm the relay listener is enabled from `Settings` -> `Streaming` -> `YouTube relay`
- select the broadcast again and refresh if the stream just went live
- wait a moment and retry if the broadcast has not exposed its live chat yet

## YouTube Comments Appear But Gemini Does Not Answer

- make sure auto-reply is enabled in the YouTube relay page
- test with a new comment sent after relay mode starts; older comments are not replayed into Gemini
- use a separate viewer account for testing because the stream owner's own comments are ignored
