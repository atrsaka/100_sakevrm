---
title: デプロイ
---

# GeminiVRM Deployment Guide

## Local Development

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、Gemini API key を入力して会話を開始します。

app と docs を同時に起動する場合は:

```bash
npm run dev:all
```

起動先は次のとおりです。

- アプリ: `http://127.0.0.1:3100`
- docs: `http://127.0.0.1:4173`

## Local Verification

```bash
npm run verify
```

個別実行する場合:

```bash
npm run lint
npm run build
npm run e2e:smoke
```

smoke E2E は `http://127.0.0.1:3100` にローカルサーバーがある前提です。

## Docs Build And Preview

```bash
npm run docs:build
npm run docs:preview
```

`docs:preview` は生成済み VitePress site を `http://127.0.0.1:4174` で確認します。

## GitHub Pages

このリポジトリは、静的アプリとして GitHub Pages へ配信できるように整備しています。

デプロイ前提は次のとおりです。

- `BASE_PATH` を `/<repo-name>` に設定
- `NEXT_EXPORT=true` で静的 export を有効化して build
- 生成物 `.next-pages/` を artifact として upload
- VitePress docs を `.next-pages/docs/` へコピー

Pages workflow は次を対象にしています。

- `main` への push
- 手動 `workflow_dispatch`

公開 URL は次の形になります。

- app root: `https://<account>.github.io/<repo>/`
- docs root: `https://<account>.github.io/<repo>/docs/`
- Japanese docs root: `https://<account>.github.io/<repo>/docs/ja/`

## Runtime Configuration

公開側で使う可能性のある環境変数:

- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

任意の YouTube relay を公開環境で使う場合は、次も必要です。

- 公開するブラウザ origin と完全一致する Google OAuth Web client の設定
- サインイン情報と relay 用 token が、サインアウトまたは期限切れまでは browser local storage から復元される前提

ただし公開運用では、クライアント公開前提の secret に実 API key を入れるのは避けてください。本番ではバックエンド中継やサーバー管理トークン方式を推奨します。YouTube 認証についても、より厳密な運用が必要ならブラウザ依存だけにしない構成を検討してください。

## Troubleshooting

- preview model alias が使えない場合は `gemini-2.5-flash-native-audio-preview-12-2025` を使用
- 再生がブロックされる場合はページを一度操作して再試行
- 古い dev chunk を握ったタブはハードリロード
- 公開 docs surface まで確認する場合は `npm run build` だけでなく `npm run build:pages` を使う
