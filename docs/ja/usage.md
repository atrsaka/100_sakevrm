---
title: Usage Guide
---

# Usage Guide

## Character Chat の基本フロー

1. アプリを起動し、Gemini API key を入力します。
2. 同梱の `Kiyoka.vrm` をそのまま使うか、手元の `.vrm` を読み込みます。
3. テキストを送信するか、マイク入力を使います。
4. 音声が流れるあいだに partial transcript を読みます。
5. きれいな lip sync を優先したい場合は、再生が終わってから次の入力を送ります。

## Podcast Mode

Yukito と Kiyoka に 1 つの話題を交互に話させたい場合は、次の流れを使います。

1. `Settings` を開き、`Conversation mode` を `Podcast mode` に切り替えます。
2. 2 体の podcast viewer が ready になるまで待ちます。
3. 必要なら `Podcast settings` を開き、最大ループ数や host 別の prebuilt voice を調整します。
4. composer に 1 つの話題を入力します。placeholder は `Type a podcast topic` に切り替わります。
5. GeminiVRM が上限ターン付きの交互会話を開始し、設定した回数に達すると自動で停止します。

補足:

- podcast mode は同時発話ではなく、ターン制の掛け合いです
- 後続ターンでは、可能な場合に前の話者の音声を Gemini Live へ relay します
- relay を再利用できない場合でも停止せず、transcript ベースの継続へ fallback します

## 調整できる設定

- conversation mode (`Character chat` / `Podcast mode`)
- live model
- 単独チャット用 voice preset または custom voice name
- system prompt
- podcast のターン上限 (`2..12`)
- podcast 専用の Yukito / Kiyoka voice routing
- idle motion preset
- chat history reset
- ローカル VRM file input
- `Streaming` から開く任意の YouTube relay 設定

## Motion と Viewer Runtime

- `Random Idle` は同梱の Mixamo idle clip をローテーションします
- 音声再生中は talking motion へ自動で切り替わります
- メイン viewer の camera framing はセッション間で保持されます

## 任意の YouTube Live Relay

YouTube の配信コメントを既存の Gemini chat パイプラインへ流したい場合は、次のフローを使います。

1. `Settings` -> `Streaming` -> `YouTube relay` を開きます。
2. Google でログインし、broadcast list を更新します。
3. relay の入力元にしたい active / upcoming broadcast を選びます。
4. relay listener を有効化し、必要なら auto-reply も有効化します。
5. relay 画面を開いたまま、このアプリの画面を YouTube Live Control Room または OBS で配信します。

補足:

- Gemini に渡るのは relay 開始後に届いた新着コメントのみです
- 配信者本人のコメントは reply loop 防止のため無視されます
- 保存した Google client ID と短命の access token は sign-out または期限切れまで local storage から復元されます
- relay は inbound-only で、GeminiVRM から YouTube chat へ書き戻しは行いません

前提条件、設定手順、失敗時の確認は [YouTube Relay Guide](./youtube-relay.md) を参照してください。

## Docs Shortcut

アプリ右上には `Docs` shortcut があります。

- ローカルの `dev:all` ではローカル docs server を開きます
- GitHub Pages 版では `/<repo>/docs/` を開きます

## テスト時に見るポイント

- transcript が full turn 完了前に更新されること
- chunk や fallback 由来のエラーなく音声が始まること
- 口パクが音声再生と同期していること
- podcast mode が 2 体の viewer を待ってから開始し、設定したターン数で止まること
- voice、motion、conversation mode を切り替えても次の実行が壊れないこと
