<div align="center">
  <img src="./public/ogp.jpg" alt="GeminiVRM hero" width="960" />
  <h1>GeminiVRM</h1>
  <p>Gemini Live ネイティブ音声で動く、ブラウザ中心の VRM チャット / ポッドキャスト体験です。</p>
  <p>
    <a href="https://github.com/Sunwood-ai-labs/GeminiVRM/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Sunwood-ai-labs/GeminiVRM/ci.yml?branch=main&label=ci" /></a>
    <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/Sunwood-ai-labs/GeminiVRM" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black" />
    <img alt="Gemini Live" src="https://img.shields.io/badge/Gemini-Live-2F7CF6" />
    <img alt="VRM" src="https://img.shields.io/badge/VRM-Avatar-00B894" />
  </p>
  <p>
    <strong>Languages</strong><br />
    <a href="./README.md">English</a> |
    <a href="./README.ja.md">日本語</a>
  </p>
</div>

## 概要

GeminiVRM は [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM) を土台に、従来の OpenAI + Koeiromap 応答経路を Gemini Live ネイティブ音声へ置き換えつつ、ブラウザ中心の VRM 体験を保った派生アプリです。

現在のビルドは次の体験を中心に整えています。

- 単独アバターのキャラクターチャットを、Gemini Live の transcript と音声ストリーミングでブラウザ上に展開
- `Yukito` と `Kiyoka` が 1 つの話題を交互に話す、上限ターン付きのデュアルホスト podcast mode
- `public/Kiyoka.vrm` と `public/Yukito.vrm` を同梱し、モード別の voice 設定と Mixamo ベースの motion preset を提供
- ローカル中心の運用に加えて、YouTube relay とブラウザ自動化フックを任意で利用可能

## 主な機能

- Gemini Live の transcript と音声をブラウザでストリーミング再生
- `Settings` から `Character chat` と `Podcast mode` を切り替え
- 同梱の `Kiyoka.vrm` / `Yukito.vrm` をそのまま使うか、手元の `.vrm` を読み込み
- live model、単独チャット用 voice、system prompt、podcast のターン数、ホスト別 voice を UI から調整
- VRM lip-sync パイプラインを使いながら、Mixamo の idle / talking motion を自動ローテーション
- `Settings` -> `Streaming` から YouTube Live relay を開き、配信コメントを GeminiVRM に取り込み
- `window.geminiVrmControl` と `postMessage` を使ったローカル自動化 / orchestration に対応
- Playwright による軽量 smoke E2E を実行可能
- アプリ本体と docs を GitHub Pages に公開可能

## 技術スタック

- Next.js 15
- React 18
- `@google/genai`
- `@pixiv/three-vrm`
- TypeScript
- Tailwind CSS
- Playwright

## クイックスタート

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、[Google AI Studio](https://aistudio.google.com/apikey) で発行した Gemini API key を入力して `Start` を押してください。

アプリと docs を同時に動かす場合は次を使います。

```bash
npm run dev:all
```

これでアプリは `http://127.0.0.1:3100`、docs は `http://127.0.0.1:4173` で起動します。

## 環境変数

[.env.example](./.env.example) を参照してください。

- `NEXT_PUBLIC_GEMINI_API_KEY`
  - ブラウザ利用向けの任意のローカル既定 key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - YouTube Live relay 向けの任意の Google OAuth Web client ID
- `BASE_PATH`
  - GitHub Pages やサブパス配信向けの任意プレフィックス
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`
  - UI に初期表示する live model
- `NEXT_PUBLIC_GEMINI_LIVE_VOICE`
  - UI に初期表示する Gemini の prebuilt voice

既定の preview alias が使えない場合は、次の model を試してください。

```text
gemini-2.5-flash-native-audio-preview-12-2025
```

## 使い方

1. アプリを起動し、Gemini API key を入力します。
2. `Settings` を開き、`Character chat` または `Podcast mode` を選びます。
3. Character chat では既定の `Kiyoka.vrm` を使うか別の VRM を読み込み、テキスト送信またはマイク入力を行います。
4. Podcast mode では 1 つの話題を入力し、Yukito と Kiyoka が設定したターン上限まで短い音声ターンを交互に返します。
5. `Settings` -> `Podcast settings` から、最大ループ数と podcast 専用の host 別 voice を調整できます。
6. `Settings` から live model、単独チャット用 voice、system prompt、idle motion などの基本設定を変更できます。
7. 配信連携が必要なら `Settings` -> `Streaming` -> `YouTube relay` を開き、`NEXT_PUBLIC_GOOGLE_CLIENT_ID` または画面入力で client ID を設定し、Google でログインして対象の配信を選び、relay と auto-reply を必要に応じて有効化します。

## プロジェクト構成

```text
public/                       VRM / 画像 / SNS 向けアセット
scripts/                      release / Pages / smoke test 用スクリプト
src/components/               UI コンポーネント
src/features/chat/            Gemini Live 通信と設定
src/features/externalControl/ ブラウザ自動化と postMessage 制御
src/features/lipSync/         音声再生と解析
src/features/podcast/         デュアルホスト podcast orchestration
src/features/vrmViewer/       Viewer と model runtime
src/lib/fbxAnimation/         Mixamo motion の retarget 補助
docs/                         アーキテクチャ / デプロイ / release / QA ドキュメント
```

## ドキュメント

- Live docs (English): [https://sunwood-ai-labs.github.io/GeminiVRM/docs/](https://sunwood-ai-labs.github.io/GeminiVRM/docs/)
- Live docs (Japanese): [https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/](https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/)
- [Getting Started](./docs/ja/getting-started.md)
- [Usage Guide](./docs/ja/usage.md)
- [YouTube Relay Guide](./docs/ja/youtube-relay.md)
- [Release Notes](./docs/ja/releases.md)
- [Release Articles](./docs/ja/articles.md)
- [最新の v0.2.0 リリースノート](./docs/ja/releases/v0.2.0.md)
- [最新の v0.2.0 Podcast Mode ガイド](./docs/ja/articles/v0.2.0-podcast-mode.md)
- [Architecture notes](./docs/ja/architecture.md)
- [Deployment guide](./docs/ja/deployment.md)
- [Troubleshooting](./docs/ja/troubleshooting.md)
- [Repository QA inventory](./docs/ja/repository-qa-inventory.md)

ローカル docs コマンド:

```bash
npm run docs:build
npm run docs:preview
```

## 検証

```bash
npm run verify
```

または個別に:

```bash
npm run lint
npm run build
npm run docs:build
npm run build:pages
npm run e2e:smoke
```

smoke test では、アプリ起動、送信フロー、既知の chunk / icon / fallback 系エラー不在を確認します。Gemini API key がない場合は missing-key エラー経路を正常系として扱います。

## デプロイ

このリポジトリは GitHub Actions 経由の GitHub Pages 配信に対応しています。

- サブパス配信には `BASE_PATH` を使用
- `NEXT_EXPORT=true` で Pages 向け static build を生成
- Pages artifact は `.next-pages` から作成
- push / pull request ごとに lint / build / smoke E2E を検証

詳しい手順は [docs/ja/deployment.md](./docs/ja/deployment.md) を参照してください。

## セキュリティメモ

- Gemini API key は引き続きブラウザから利用します。これは元の ChatVRM と同様のローカル中心構成です。
- YouTube relay は Google OAuth client ID と短命の YouTube access token を local storage に保持し、サインアウトまたは期限切れまで復元します。
- external control の `postMessage` 面は development では既定で有効ですが、production では local storage と許可 origin の両方で制御されます。公開環境で常時有効とはみなさないでください。
- 公開運用では token relay などのサーバー側 key 保護戦略を推奨します。

## 謝辞

- [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM)
- [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)
- [`@google/genai`](https://www.npmjs.com/package/@google/genai)
