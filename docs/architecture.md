# GeminiVRM Architecture

## Goals

GeminiVRM keeps the original browser-first avatar experience from ChatVRM while replacing the response stack with Gemini Live native audio.

The current architecture optimizes for:

- low-latency playback from streamed PCM chunks
- simple local-first setup with no required backend
- compatibility with VRM lip sync and expression playback

## Runtime Flow

1. The user sends a prompt from the main page.
2. `src/pages/index.tsx` starts streaming playback mode on the active model.
3. `src/features/chat/geminiLiveChat.ts` opens a Gemini Live session and forwards transcript updates plus audio chunks.
4. `src/features/lipSync/lipSync.ts` validates PCM metadata, queues chunk playback, and keeps the analyser fed for mouth movement.
5. `src/features/vrmViewer/model.ts` bridges the audio stream into the VRM runtime.
6. `src/features/emoteController/*` updates expression, eye, blink, and lip sync state each frame.

## Key Files

- `src/pages/index.tsx`
  - user input, streaming state, and chat flow
- `src/features/chat/geminiLiveChat.ts`
  - Gemini Live connection lifecycle, chunk forwarding, transcript assembly, and fallback model handling
- `src/features/chat/geminiLiveConfig.ts`
  - default model and voice preset configuration
- `src/features/lipSync/lipSync.ts`
  - audio scheduling, PCM validation, analyser updates, and autoplay safety handling
- `src/features/vrmViewer/model.ts`
  - VRM model audio bridge and streaming hooks
- `src/components/*`
  - UI for the viewer, settings, chat input, and assistant status

## Streaming Notes

Earlier revisions waited for a full turn to complete, converted the whole response into WAV, decoded it, and only then started playback. The current path instead plays PCM chunks as they arrive, which reduces perceived latency and better matches the Gemini Live model.

Safety guards now cover:

- `onmessage` callback failures
- unsupported or missing PCM metadata
- partial PCM frames at chunk boundaries
- browser autoplay failures when `AudioContext.resume()` is blocked

## Asset Model

- `public/Kiyoka.vrm`
  - bundled default avatar
- `public/bg-d.png`
  - default background
- `public/idle_loop.vrma`
  - idle animation asset

## Limitations

- The Gemini API key is currently provided directly in the browser.
- Playback is low-latency, but still depends on browser audio scheduling and network conditions.
- The default preview model alias may not be enabled for every Gemini account.
