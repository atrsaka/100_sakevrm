<div align="center">
  <img src="./public/ogp.jpg" alt="100_sakevrm hero" width="960" />
  <h1>100_sakevrm</h1>
  <p>Gemini Live + ElevenLabs ConvAI で動く、ブラウザ中心の VRM チャット / AI ポッドキャスト体験</p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black" />
    <img alt="Gemini Live" src="https://img.shields.io/badge/Gemini-Live-2F7CF6" />
    <img alt="ElevenLabs" src="https://img.shields.io/badge/ElevenLabs-ConvAI-6C47FF" />
    <img alt="VRM" src="https://img.shields.io/badge/VRM-Avatar-00B894" />
  </p>
</div>

## 概要

100_sakevrm は [Sunwood-ai-labs/GeminiVRM](https://github.com/Sunwood-ai-labs/GeminiVRM) (v0.3.0) をベースに、**ElevenLabs Conversational AI (Agents)** 対応・UI 全面日本語化・デザイン刷新を行ったフォーク版です。

2 つの音声プロバイダを切り替えて使えます:

| プロバイダ | LLM | 音声 | 特徴 |
|---|---|---|---|
| **Gemini Live** (既定) | Gemini 3.1 Live | 内蔵 prebuilt voice | 低レイテンシ、1 ホップ |
| **ElevenLabs** | Agent 内蔵 LLM (GPT 等) | ElevenLabs voice (cloning 可) | 自由な声、AI Agent として動作 |

### 主な追加機能

- **ドキュメントモード**: PDF / テキスト / Markdown をアップロードし、ドキュメント内容に基づいたグラウンディング会話が可能（チャット・ポッドキャスト両対応）
- **ElevenLabs ConvAI Agent 連携**: Agent ID を指定し、system prompt / voice / language を override してランタイムに話者を切り替え
- **ConvAI タイムアウト最適化**: 初回音声到着まで最大 8 秒待機 + 音声アイドル検出を 1.2 秒に拡張し、音声途切れ・生成失敗を大幅に低減
- **ポッドキャスト プレフライト**: テーマ入力 → Gemini で番組タイトル・世界観・キャラ設定を自動生成 → 編集 → OK で収録開始
- **持続 WebSocket セッション**: ポッドキャスト時は Yukito / Kiyoka 用に 2 本の WebSocket を並列に開きっぱなしにして接続オーバーヘッドを削減
- **ポッドキャスト VRM 差し替え**: Yukito / Kiyoka それぞれに任意の VRM を読み込み可能
- **高品質 VRM アセット**: Kiyoka / Yukito の VRM モデルを高品質版に差し替え
- **大容量 VRM ロード対応**: fetch + parse 方式に変更し、大きな VRM ファイルでの読み込み失敗を解消
- **UI 全面日本語化**: 設定画面・メニュー・モーション名・起動モーダルなど全テキスト
- **ネオングロー UI**: ガラスモーフィズム + 青紫グラデーション + 発光ボーダーのデザイン
- **ポッドキャスト風スタイルガイド**: 番組オープニング・掛け合い・エンディングの話し方を few-shot で例示

## 技術スタック

- Next.js 15 / React 18 / TypeScript / Tailwind CSS
- `@google/genai` (Gemini Live + text generation)
- `@pixiv/three-vrm` (VRM rendering)
- ElevenLabs Conversational AI (WebSocket)
- Playwright (E2E)

## クイックスタート

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

`http://127.0.0.1:3100` を開き、Gemini API key を入力して「はじめる」を押してください。

### ElevenLabs を使う場合

1. [ElevenLabs](https://elevenlabs.io/) で Conversational AI Agent を作成
2. Agent の Security → Overrides で「エージェント言語 / 最初のメッセージ / システムプロンプト / ボイス」を有効化
3. `.env.local` に設定を追記:

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxxx
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_xxxxx        # My Voices 取得用 (任意)
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=xxxxx           # キャラチャット用
NEXT_PUBLIC_ELEVENLABS_PODCAST_YUKITO_VOICE_ID=xxxxx
NEXT_PUBLIC_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID=xxxxx
```

4. アプリの設定画面 →「音声プロバイダ」→ **ElevenLabs** を選択

## 環境変数

### Gemini (既存)
| 変数 | 説明 |
|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini API key (ローカル既定) |
| `NEXT_PUBLIC_GEMINI_LIVE_MODEL` | Live model 名 (既定: `gemini-3.1-flash-live-preview`) |
| `NEXT_PUBLIC_GEMINI_LIVE_VOICE` | Gemini prebuilt voice (既定: `Charon`) |
| `NEXT_PUBLIC_GEMINI_TEXT_MODEL` | プレフライト用テキスト生成モデル (既定: `gemini-2.5-flash`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | YouTube Live relay 用 OAuth client ID |
| `BASE_PATH` | GitHub Pages サブパス配信用 |

### ElevenLabs (新規)
| 変数 | 説明 |
|---|---|
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ConvAI Agent ID (**必須**) |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | API key (voice 一覧取得・Private agent 用) |
| `NEXT_PUBLIC_ELEVENLABS_VOICE_ID` | キャラチャット既定 voice_id |
| `NEXT_PUBLIC_ELEVENLABS_PODCAST_YUKITO_VOICE_ID` | ポッドキャスト Yukito 用 voice_id |
| `NEXT_PUBLIC_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID` | ポッドキャスト Kiyoka 用 voice_id |
| `NEXT_PUBLIC_ELEVENLABS_MODEL_ID` | TTS モデル (既定: `eleven_flash_v2_5`) |

> **注意**: `NEXT_PUBLIC_` プレフィックスの変数はブラウザに露出します。ローカル開発専用です。

## 使い方

1. アプリを起動し、Gemini API key を入力
2. 設定 →「会話モード」でキャラクターチャット or ポッドキャストを選択
3. 設定 →「音声プロバイダ」で Gemini Live / ElevenLabs を切り替え
4. **ElevenLabs ポッドキャスト**の場合:
   - トピックを入力 → プレフライト画面で番組設定を確認・編集
   - 「この設定で開始」→ 2 体の AI Agent が交互にポッドキャスト収録
5. ポッドキャスト設定から最大ターン数(2〜30)、ホスト別 voice、VRM モデルを調整可能

## プロジェクト構成

```text
public/                            VRM / 画像アセット
src/components/                    UI コンポーネント
src/features/chat/                 Gemini Live / text 通信
src/features/elevenlabs/           ConvAI WebSocket クライアント
src/features/tts/                  ElevenLabs 設定 / TTS ストリーミング
src/features/podcast/              デュアルホスト podcast + persona designer
src/features/vrmViewer/            Viewer と model runtime
src/features/lipSync/              音声再生と解析
src/features/externalControl/      postMessage 制御
src/lib/fbxAnimation/              Mixamo retarget 補助
docs/                              ドキュメント
```

## セキュリティメモ

- Gemini / ElevenLabs の API key はブラウザから直接利用します(ローカル中心構成)
- ElevenLabs ConvAI の Public Agent は agent_id のみで接続可能(API key 不要)
- 公開運用では token relay サーバー経由の key 保護を推奨します

## 謝辞

- [Sunwood-ai-labs/GeminiVRM](https://github.com/Sunwood-ai-labs/GeminiVRM) — ベースアプリ
- [`pixiv/ChatVRM`](https://github.com/pixiv/ChatVRM) — 原型
- [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)
- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai)
