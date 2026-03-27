---
title: トラブルシュート
---

# トラブルシュート

## Gemini Model Alias が使えない

次を試してください。

```text
gemini-2.5-flash-native-audio-preview-12-2025
```

## 音声再生が始まらない

- 一度ページを操作してから再試行する
- ブラウザの autoplay ブロックを確認する
- console に PCM metadata や fallback request のエラーがないか確認する

## ローカル docs リンクが開けない

- アプリの Docs ショートカットをローカル docs サーバーへ向けたい場合は `npm run dev:all` を使う
- `npm run dev` だけでもアプリ本体は動くが、別プロセスの docs サーバーは起動していない

## Pages build がローカル build と違う

- Pages 出力の検証には `next build` だけでなく `npm run build:pages` を使う
- build script が `.next-pages/` を静的 export から再生成する前提で見る

## ブラウザが古い chunk を使っている

- タブをハードリロードする
- 改善しない場合は dev server を止めて再起動する

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
