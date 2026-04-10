# Changelog

## v0.4.0 — 100_sakevrm (2026-04-10)

GeminiVRM をベースに、ElevenLabs Conversational AI (Agents) 対応・UI 日本語化・デザイン刷新を行ったフォーク版。

### 追加機能

#### ElevenLabs Conversational AI 対応
- 音声プロバイダとして **ElevenLabs (ConvAI Agents)** を選択可能に
- ElevenLabs Agent に WebSocket で接続し、system prompt / voice / language を override してランタイムで話者を切り替え
- キャラクターチャット: Agent が LLM 推論 + TTS を一括で返す 1 ホップ方式
- ポッドキャスト: **2 つの持続 WebSocket セッション**を並列に開き、Yukito / Kiyoka それぞれ独立した Agent として交互に発話。接続オーバーヘッドは最初の 1 回のみ
- My Voices API (`/v1/voices`) でユーザーの voice 一覧をドロップダウン表示
- Agent ID / API キー / voice_id は `.env.local` または Settings UI から設定可能

#### ポッドキャスト プレフライト
- テーマ入力 → Gemini 2.5 flash で番組タイトル・世界観・各ホストのキャラ設定を自動生成
- プレビュー & 手動編集モーダル → OK で本番収録に進む
- ポッドキャスト風の話し方スタイルガイド(番組オープニング・エンディング・掛け合い例)を few-shot で system prompt に付与

#### ポッドキャスト VRM 差し替え
- ポッドキャスト設定で Yukito / Kiyoka それぞれに任意の VRM を読み込み可能
- セッション内で即時差し替え、既定に戻すボタン付き

### UI / UX 改善

#### 全面日本語化
- 起動モーダル、設定画面、ポッドキャスト設定、メニューボタン、入力欄、モーション名、チャットログなど全テキストを日本語化
- 各設定項目に「何が起きるか」を明確に説明する補足文を追加

#### デザイン刷新
- カラーテーマを薄い青紫系に変更
- ボタン・入力欄をガラスモーフィズム + ネオングロー調に
- hover / active / disabled で発光アニメーション (`transition-all duration-200`)
- 角丸を `rounded-4` に統一(シャープ寄り)

### その他の変更
- Mixamo .fbx 依存を排除、同梱 VRMA モーションのみで動作するよう builtInMotions.ts を書き換え
- 待機モーションのデフォルトを `sway` に変更
- ポッドキャスト最大ターン数を 12 → 30 に拡大、プリセットに 16/20/30 を追加
- ターンごとに番組冒頭 / 中盤 / 最終の文脈ヒントを `userText` で送り分け
- ドキュメント / ソースコードボタンを一時非表示
- `src/features/tts/` — ElevenLabs 設定・TTS ストリーミングモジュール
- `src/features/elevenlabs/` — ConvAI WebSocket クライアント (持続セッション対応)
- `src/features/chat/geminiTextChat.ts` — Gemini 通常 API テキスト生成 (予備経路)
- `src/features/podcast/podcastPersonaDesigner.ts` — Gemini structured output でキャラ設定生成
- `src/components/podcastPreflight.tsx` — プレフライト モーダル

### 環境変数 (新規)
```
NEXT_PUBLIC_ELEVENLABS_API_KEY=
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=
NEXT_PUBLIC_ELEVENLABS_PODCAST_YUKITO_VOICE_ID=
NEXT_PUBLIC_ELEVENLABS_PODCAST_KIYOKA_VOICE_ID=
NEXT_PUBLIC_ELEVENLABS_MODEL_ID=eleven_flash_v2_5
NEXT_PUBLIC_GEMINI_TEXT_MODEL=gemini-2.5-flash
```

### ベース
- [Sunwood-ai-labs/GeminiVRM](https://github.com/Sunwood-ai-labs/GeminiVRM) v0.3.0 (`e74869c`)
