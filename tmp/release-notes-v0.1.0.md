# v0.1.0

[![Release Notes EN](https://img.shields.io/badge/docs-release%20notes%20en-2F7CF6)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.1.0)
[![Release Notes JA](https://img.shields.io/badge/docs-release%20notes%20ja-ff5d72)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.1.0)
[![Launch Guide EN](https://img.shields.io/badge/docs-launch%20guide%20en-00B894)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.1.0-launch)
[![Launch Guide JA](https://img.shields.io/badge/docs-launch%20guide%20ja-f4a261)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.1.0-launch)

![GeminiVRM v0.1.0 release header](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/release-header-v0.1.0.svg)

This is the first public GeminiVRM release.  
Because there is no earlier tag, `v0.1.0` covers the full shipped history up to this release.

## Highlights

- GeminiVRM now ships as a browser-first VRM chat app powered by Gemini Live native audio, with partial transcript updates and streamed audio in the active turn.
- The playback stack schedules 16-bit PCM chunks early, so lip sync can start before the full response finishes.
- The app includes the bundled `public/Kiyoka.vrm` avatar, local avatar replacement, live model and voice controls, system prompt editing, and idle motion selection.
- `Settings` -> `Streaming` -> `YouTube relay` adds an optional inbound live-chat flow with broadcast selection, incoming-comment preview, and local Gemini auto-replies inside the app chat.
- The public-facing surface now includes bilingual VitePress docs, GitHub Pages output, CI, smoke E2E, and companion launch walkthroughs in English and Japanese.

## Known Constraints

- Gemini API keys are still entered client-side as part of the local-first workflow.
- The microphone path depends on Web Speech API availability and is currently configured for `ja-JP`.
- The YouTube relay receives new inbound comments into GeminiVRM, but it does not post Gemini answers back into YouTube chat and it does not handle video uplink.

## Docs

- Release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.1.0`
- Japanese release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.1.0`
- Launch guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.1.0-launch`
- Japanese launch guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.1.0-launch`

## Validation

- `npm run lint`
- `npm run build`
- `npm run docs:build`
- `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`
- `npm run e2e:smoke`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.1.0.svg`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.1.0`
