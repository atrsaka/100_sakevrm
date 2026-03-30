---
title: Getting Started
---

# Getting Started

## 前提条件

- Node.js 20 以上
- [Google AI Studio](https://aistudio.google.com/apikey) で発行した Gemini API key
- チャット + avatar を使う場合は、マイク入力と WebGL を使えるブラウザ
- 任意の YouTube Live relay を使う場合は Google OAuth Web client ID

## 依存関係のインストール

```bash
npm install
```

## アプリ起動

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、Gemini API key を入力して `Start` を押します。

## アプリと docs を同時起動

```bash
npm run dev:all
```

起動先:

- app: `http://127.0.0.1:3100`
- docs: `http://127.0.0.1:4173`

## 最初の成功チェック

1. 既定の `Kiyoka.vrm` が読み込まれることを確認します。
2. Gemini API key を入力します。
3. 短い prompt を送ります。
4. assistant transcript と音声ストリーミングが始まることを確認します。
5. `Settings` を開き、model、voice、system prompt、motion preset を確認します。

## Podcast Mode をすぐ試す

新しいデュアルホスト体験を確認したい場合は次を行います。

1. `Settings` を開き、`Conversation mode` を `Podcast mode` に切り替えます。
2. `Kiyoka` と `Yukito` の viewer が両方 ready になるまで待ちます。
3. 必要なら `Podcast settings` から最大ループ数と host 別の prebuilt voice を調整します。
4. 短い話題を入力して送信します。
5. ステージ上で話者が交互に切り替わり、設定したターン数で自動停止することを確認します。

## 任意の YouTube Relay 設定

配信コメントを Gemini に流し込みたい場合は次を使います。

1. アプリで使う origin を許可した Google OAuth Web client ID を作成します。
2. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` を設定するか、`Settings` -> `Streaming` -> `YouTube relay` に client ID を貼り付けます。
3. Google でログインし、broadcast list を更新して、監視したい active / upcoming stream を選びます。
4. relay mode を有効にし、必要なら stream 準備後に auto-reply も有効にします。
5. 保存した client ID と短命の access token は、sign-out または期限切れまで browser の local storage から復元されます。

詳しい設定、relay の挙動、トラブルシュートは [YouTube Relay Guide](./youtube-relay.md) を参照してください。

## 主な環境変数

- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `BASE_PATH`
- `NEXT_PUBLIC_DOCS_URL`
