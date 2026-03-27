# v0.1.0 draft release notes

この草案は、まだ `v0.1.0` タグを切る前の初回リリースノートです。  
比較範囲は `991bff6db1f30c8e59d65407f2f14e9f37aebb10..62b77f012f557803c7bb76de787e6ee12d51009f` です。

公開前メモ:

- release header asset: `docs/public/releases/release-header-v0.1.0.svg`
- docs drafts: `docs/releases/v0.1.0.md`, `docs/ja/releases/v0.1.0.md`
- GitHub Release を実際に公開する直前に、live docs URL と最終 tag hash を反映してください

## Highlights

- Gemini Live ネイティブ音声を使う browser-first な VRM チャットを初回リリースとしてまとめました。部分 transcript と streamed audio が同じターン内で動作します。
- 16-bit PCM chunk を先行スケジュールすることで、返答全体を待たずに音声再生と lip sync が始まります。
- `public/Kiyoka.vrm` を同梱し、ローカル VRM 差し替え、live model / voice / system prompt の調整、idle motion 切り替えをアプリ内で操作できます。
- `Settings` -> `Streaming` -> `YouTube relay` から、配信コメントの受信、broadcast 選択、incoming preview、Gemini への自動応答を任意で有効化できます。
- VitePress docs、GitHub Pages 出力、CI、smoke E2E まで含めて、公開向けの配布面をそろえました。

## Known Constraints

- Gemini API key は local-first 方針のままブラウザ側で入力します。
- マイク入力は Web Speech API 依存で、現状は `ja-JP` 固定です。
- YouTube relay は受信した新着コメントをアプリ内の Gemini チャットへ流す機能で、Gemini の返答を YouTube コメントへ投稿したり、映像配信自体を送出したりはしません。
- この草案作成時点では `v0.1.0` タグと GitHub Release をまだ作成していないため、公開日と release URL は未記載です。

## Validation

- `npm run lint`
- `npm run build`
- `npm run docs:build`
- `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`
- `npm run e2e:smoke`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/repo-hero.svg,docs/public/releases/release-header-v0.1.0.svg`
- `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.1.0`
