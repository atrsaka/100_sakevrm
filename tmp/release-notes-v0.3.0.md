# v0.3.0

[![Release Notes EN](https://img.shields.io/badge/docs-release%20notes%20en-2F7CF6)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.3.0)
[![Release Notes JA](https://img.shields.io/badge/docs-release%20notes%20ja-ff5d72)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.3.0)
[![Runtime Guide EN](https://img.shields.io/badge/docs-runtime%20guide%20en-00B894)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.3.0-runtime-and-benchmark-guide)
[![Runtime Guide JA](https://img.shields.io/badge/docs-runtime%20guide%20ja-f4a261)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.3.0-runtime-and-benchmark-guide)

![GeminiVRM v0.3.0 release header](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/release-header-v0.3.0.svg)

Published: `2026-04-09 01:58 JST` (`2026-04-08T16:58:47Z`)  
Compare range: `v0.2.0..v0.3.0`

This release aligns GeminiVRM with Gemini 3.1 realtime input, productizes podcast relay benchmarking, and tightens the release/docs surface around the validated runtime path.

## Highlights

- Character chat and podcast mode now default to `gemini-3.1-flash-live-preview`, send text through the Gemini Live realtime input path, and surface the exact request error instead of silently falling back to older preview models.
- `v0.3.0` also introduces the streaming podcast relay path itself: the app can prewarm the next speaker session, stream live audio into that prepared turn, and record per-turn first-audio and playback timing in the debug log.
- GeminiVRM now ships a reproducible podcast relay benchmark workflow with a dedicated Playwright relay E2E, a repeatable benchmark runner, bilingual chart generation, and tracked JSON/CSV history under `docs/public/benchmarks`.
- The checked-in benchmark snapshot shows the streaming relay path averaging `1.22s` to first audio and `2.30s` of handoff silence versus `10.91s` and `11.91s` for batch mode on the tracked three-topic, six-turn run set.
- Message labels, settings radio groups, speech-recognition typing, and repo tooling were tightened together with the flat ESLint runner and dependency updates for `@google/genai` `1.48.0`, Tailwind `4.2.2`, TypeScript `6.0.2`, and `actions/configure-pages@v6`.

## Scope Notes

- The app no longer auto-falls back to older Gemini Live preview models; invalid 3.1 requests must be fixed on the active runtime path.
- The streaming relay implementation landed in commit `7a5a1c9` on `2026-03-31 JST`, with prepared-session stabilization in `6e2f181` on `2026-04-01 JST`.
- Podcast mode remains turn-based. It does not overlap both hosts speaking at once.
- The checked-in benchmark report still carries one AGI run mean from preserved console logs because the earliest artifact folder was overwritten before the temp-dir safeguard landed.
- The YouTube relay remains inbound-only and does not post Gemini replies back into YouTube chat.

## Docs

- Release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.3.0`
- Japanese release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.3.0`
- Runtime guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.3.0-runtime-and-benchmark-guide`
- Japanese runtime guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.3.0-runtime-and-benchmark-guide`

## Validation

- `npm run lint`
- `npm run build`
- `npm run docs:build`
- `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`
- `npm run e2e:smoke`
- `npm run e2e:podcast`
- `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-en.svg`
- `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-ja.svg`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.3.0.svg`
- `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.3.0.svg`
