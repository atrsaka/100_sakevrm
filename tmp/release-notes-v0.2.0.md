# v0.2.0

[![Release Notes EN](https://img.shields.io/badge/docs-release%20notes%20en-2F7CF6)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.2.0)
[![Release Notes JA](https://img.shields.io/badge/docs-release%20notes%20ja-ff5d72)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.2.0)
[![Podcast Guide EN](https://img.shields.io/badge/docs-podcast%20guide%20en-00B894)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.2.0-podcast-mode)
[![Podcast Guide JA](https://img.shields.io/badge/docs-podcast%20guide%20ja-f4a261)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.2.0-podcast-mode)

![GeminiVRM v0.2.0 release header](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/release-header-v0.2.0.svg)

Published: `2026-03-31 01:43 JST` (`2026-03-30T16:43:53Z`)  
Compare range: `v0.1.0..v0.2.0`

This release turns GeminiVRM into a dual-host VRM stage, adds reusable release collateral, and syncs the public docs around what `v0.2.0` actually ships.

## Highlights

- GeminiVRM now ships a dual-host `Podcast mode` where Yukito and Kiyoka alternate short Gemini Live native-audio turns from one topic.
- Podcast mode adds its own turn cap and per-host voice routing, so the dual-host flow can be tuned independently from single-character chat.
- Later podcast turns relay the previous speaker's audio back into Gemini Live when possible, with transcript fallback if the audio relay cannot be reused.
- The VRM runtime now defaults to rotating bundled Mixamo idle clips, switches into talking motion while speech is active, and stabilizes facing across idle and talking playback.
- Browser automation can now drive the app through `window.geminiVrmControl` and the related `postMessage` control protocol.
- Docs now publish versioned `v0.2.0` release notes, a companion podcast-mode guide, and a dedicated release header asset in both English and Japanese.

## Scope Notes

- Podcast mode is turn-based. It does not overlap both hosts speaking at once.
- Podcast-only voice overrides stay scoped to podcast mode. The regular single-avatar chat voice remains separate.
- External control is enabled by default in development, but production use is gated by local storage and allowed-origin checks.
- The YouTube relay remains inbound-only and does not post Gemini replies back into YouTube chat.
- The `v0.2.0` tag was originally published from committed `HEAD` on `2026-03-31`; docs collateral and release-body links were completed immediately afterward without pulling in the unrelated uncommitted podcast refactor.

## Docs

- Release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.2.0`
- Japanese release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.2.0`
- Podcast guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.2.0-podcast-mode`
- Japanese podcast guide: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.2.0-podcast-mode`

## Validation

- `npm run lint`
- `npm run build`
- `npm run docs:build`
- `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`
- `npm run e2e:smoke`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.2.0.svg`
- `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.2.0.svg`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.2.0`
