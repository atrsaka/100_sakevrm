# GeminiVRM Deployment Guide

## Local Development

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、Gemini API key を入力して会話を開始します。

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

## GitHub Pages

このリポジトリは、静的アプリとして GitHub Pages へ配信できるように整備しています。

デプロイ前提は次のとおりです。

- `BASE_PATH` を `/<repo-name>` に設定
- `NEXT_EXPORT=true` で静的 export を有効化して build
- 生成物 `out/` を artifact として upload

Pages workflow は次を対象にしています。

- `main` への push
- 手動 `workflow_dispatch`

## Runtime Configuration

公開側で使う可能性のある環境変数:

- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
- `NEXT_PUBLIC_GEMINI_API_KEY`

ただし公開運用では、クライアント公開前提の secret に実 API key を入れるのは避けてください。本番ではバックエンド中継やサーバー管理トークン方式を推奨します。

## Troubleshooting

- preview model alias が使えない場合は `gemini-2.5-flash-native-audio-preview-12-2025` を使用
- 再生がブロックされる場合はページを一度操作して再試行
- 古い dev chunk を握ったタブはハードリロード
