---
title: 使い方
---

# 使い方

## 基本の会話フロー

1. アプリを起動して Gemini API key を入力します。
2. 同梱の `Kiyoka.vrm` をそのまま使うか、任意の `.vrm` を読み込みます。
3. テキスト送信またはマイク入力で会話します。
4. 応答の途中 transcript を読みつつ、音声ストリーミング再生を待ちます。
5. 口パクの同期をきれいに見たい場合は、再生完了を待ってから次の入力を送ります。

## 調整できる設定

- live model
- voice preset
- system prompt
- chat history のリセット
- ローカル VRM ファイル入力
- `Streaming` から開く任意の YouTube relay ページ

## 任意の YouTube Live relay

YouTube の配信コメントを既存の Gemini チャットフローへ流したい場合は、次の手順を使います。

1. `Settings` -> `Streaming` -> `YouTube relay` を開きます。
2. Google でログインし、broadcast list を更新します。
3. relay 元にしたい active または upcoming の配信を選びます。
4. relay listener を有効化し、必要なら auto-reply も有効化して Gemini が自動返答できるようにします。
5. 配信中は YouTube Live Control Room または OBS からこのアプリ画面を配信します。

補足:

- Gemini に流れるのは relay 開始後に受信した新着コメントのみです
- 無限ループ防止のため、配信者本人アカウントのコメントは無視されます
- 保存済みの Google client ID と短命の access token は、サインアウトまたは期限切れまで local storage から復元されます

前提条件、設定手順、失敗時の確認ポイントは [YouTube リレーガイド](./youtube-relay.md) を参照してください。

## Docs ショートカット

アプリ右上には `Docs` ショートカットがあります。

- ローカルの `dev:all` ではローカル docs サーバーへ移動
- GitHub Pages 配信では `/<repo>/docs/` へ移動

## 検証時に見るポイント

- transcript が turn 完了前から更新される
- chunk/fallback 系のエラーなしで音声が始まる
- 口パクが音声再生と同期する
- voice や model を変えても次の turn が破綻しない
