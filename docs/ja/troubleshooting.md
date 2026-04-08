---
title: トラブルシュート
---

# トラブルシュート

## Gemini Live で `Request contains an invalid argument` が出る

- live model が `gemini-3.1-flash-live-preview` のままか確認する
- model を変えた直後や runtime の変更を引いた直後は、タブをハードリロードする
- `next build` と `next dev` を行き来した直後なら、dev server を立て直してから再試行する
- このアプリは古い Gemini Live preview model へ自動フォールバックしないため、model を差し替えるより 3.1 の request 内容を直す

## 音声再生が始まらない

- 一度ページを操作してから再試行する
- ブラウザの autoplay ブロックを確認する
- console に PCM metadata や Gemini Live request のエラーがないか確認する

## ローカル docs リンクが開けない

- アプリの Docs ショートカットをローカル docs サーバーへ向けたい場合は `npm run dev:all` を使う
- `npm run dev` だけでもアプリ本体は動くが、別プロセスの docs サーバーは起動していない

## Pages build がローカル build と違う

- Pages 出力の検証には `next build` だけでなく `npm run build:pages` を使う
- build script が `.next-pages/` を静的 export から再生成する前提で見る

## ブラウザが古い chunk を使っている

- タブをハードリロードする
- 改善しない場合は dev server を止めて再起動する

## Podcast Benchmark が再読み込みされたり最後まで終わらない

症状:

- Playwright が `Execution context was destroyed`、`page.reload timeout`、`ERR_CONNECTION_REFUSED` で落ちる
- ベンチ実行中に Next.js が `Fast Refresh had to perform a full reload` を出す
- 反復計測を続けると topic を受け付けなくなったり、途中で止まる

原因:

- `next dev` が監視しているリポジトリ配下へ benchmark artifact を書き出してしまい、artifact の更新がそのまま再読み込みを引き起こして Playwright のセッションを壊していた

再発防止:

- 日本語や UTF-8 の topic は `npm run bench:podcast:topic -- <topic-file>` 経由で流す
- `E2E_BENCH_OUTPUT_DIR` はリポジトリ外に向ける。ベンチランナーは既定で system temp を使う
- mode 単位で取り直したい場合は `E2E_BENCH_MODES=streaming` または `batch` を使う
- `next dev` 上で長い反復計測を続けるときは、isolated run ごとに dev server を立て直す

## Google ログインが YouTube relay でブロックされる

- OAuth 同意画面が testing のままなら、relay に使う Google アカウントを test user に追加する
- `127.0.0.1` と `localhost` の違いも含めて、authorized JavaScript origin がアプリ URL と完全一致しているか確認する
- 反映後に `Settings` -> `Streaming` -> `YouTube relay` から再ログインする

## YouTube relay がコメントを受信しない

- `Settings` -> `Streaming` -> `YouTube relay` で relay listener が有効か確認する
- 配信開始直後なら、broadcast を選び直して refresh する
- live chat の準備がまだ終わっていない場合は、少し待ってから再試行する

## コメントは見えるのに Gemini が返答しない

- YouTube relay ページで auto-reply が有効か確認する
- relay 開始後に送られた新着コメントで試す。古いコメントは Gemini へ再投入されない
- 配信者本人コメントは無限ループ防止で無視されるため、別の視聴者アカウントでテストする
