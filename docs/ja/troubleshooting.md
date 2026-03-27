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
