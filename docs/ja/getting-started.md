---
title: 開始手順
---

# 開始手順

## 前提条件

- Node.js 20 以上
- [Google AI Studio](https://aistudio.google.com/apikey) で発行した Gemini API key
- マイク入力や VRM 描画を使う場合は、WebGL とマイクが使えるブラウザ

## 依存関係のインストール

```bash
npm install
```

## アプリを起動する

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、Gemini API key を入力して `Start` を押します。

## アプリと docs を同時に起動する

```bash
npm run dev:all
```

起動先は次のとおりです。

- アプリ: `http://127.0.0.1:3100`
- docs: `http://127.0.0.1:4173`

## 最初の確認項目

1. 既定の `Kiyoka.vrm` が表示されることを確認します。
2. Gemini API key を入力します。
3. 短いプロンプトを送信します。
4. transcript と音声ストリーミング再生が始まることを確認します。
5. `Settings` から model、voice、system prompt を調整します。

## 主な環境変数

- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `BASE_PATH`
- `NEXT_PUBLIC_DOCS_URL`
