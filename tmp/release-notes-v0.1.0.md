# v0.1.0

[![Release Notes EN](https://img.shields.io/badge/docs-release%20notes%20en-2F7CF6)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.1.0)
[![Release Notes JA](https://img.shields.io/badge/docs-release%20notes%20ja-ff5d72)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.1.0)
[![Launch Guide EN](https://img.shields.io/badge/docs-launch%20guide%20en-00B894)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.1.0-launch)
[![Launch Guide JA](https://img.shields.io/badge/docs-launch%20guide%20ja-f4a261)](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.1.0-launch)

![GeminiVRM v0.1.0 release header](https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/release-header-v0.1.0.svg)

GeminiVRM の初回公開版です。  
比較対象は、ルートコミットから `v0.1.0` までの全履歴です。

## Highlights

- Gemini Live ネイティブ音声を使う browser-first な VRM チャットを初回リリースとしてまとめました。部分 transcript と streamed audio が同じターン内で動作します。
- 16-bit PCM chunk を先行スケジュールすることで、返答全体を待たずに音声再生と lip sync が始まります。
- `public/Kiyoka.vrm` を同梱し、ローカル VRM 差し替え、live model / voice / system prompt の調整、idle motion 切り替えをアプリ内で操作できます。
- `Settings` -> `Streaming` -> `YouTube relay` から、配信コメントの受信、broadcast 選択、incoming preview、Gemini への自動応答を任意で有効化できます。
- VitePress docs、GitHub Pages 出力、CI、smoke E2E まで含めて、公開向けの配布面をそろえました。
- companion walkthrough も英語版・日本語版で公開し、構造化された release notes と運用ガイドを分けて読めるようにしました。

## Known Constraints

- Gemini API key は local-first 方針のままブラウザ側で入力します。
- マイク入力は Web Speech API 依存で、現状は `ja-JP` 固定です。
- YouTube relay は受信した新着コメントをアプリ内の Gemini チャットへ流す機能で、Gemini の返答を YouTube コメントへ投稿したり、映像配信自体を送出したりはしません。
- docs release notes: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.1.0`
- docs launch guides: `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.1.0-launch`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.1.0-launch`

## Validation

- `npm run lint`
- `npm run build`
- `npm run docs:build`
- `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`
- `npm run e2e:smoke`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/repo-hero.svg,docs/public/releases/release-header-v0.1.0.svg`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.1.0`
