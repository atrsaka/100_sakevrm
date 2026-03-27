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

## Docs ショートカット

アプリ右上には `Docs` ショートカットがあります。

- ローカルの `dev:all` ではローカル docs サーバーへ移動
- GitHub Pages 配信では `/<repo>/docs/` へ移動

## 検証時に見るポイント

- transcript が turn 完了前から更新される
- chunk/fallback 系のエラーなしで音声が始まる
- 口パクが音声再生と同期する
- voice や model を変えても次の turn が破綻しない
