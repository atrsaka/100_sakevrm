---
title: YouTube リレーガイド
---

# YouTube リレーガイド

YouTube の配信コメントを GeminiVRM に取り込み、既存のチャットフロー経由で Gemini に返答させたいときに使う任意機能です。

## 必要なもの

- アプリを開く URL と完全一致する origin を許可した Google OAuth Web client ID
- 対象配信を所有または管理できる YouTube アカウント
- live chat が有効な active または upcoming の配信

## 画面の開き方

relay 設定は次の順で開きます。

1. `Settings`
2. `Streaming`
3. `YouTube relay`

このラベル順は現在のアプリ UI と一致しています。

## 設定手順

1. 事前に `NEXT_PUBLIC_GOOGLE_CLIENT_ID` を設定するか、YouTube relay ページで client ID を直接入力します。
2. Google でログインします。
3. 認証完了後に broadcast list を更新します。
4. relay 元にしたい active または upcoming の配信を選びます。
5. relay listener を有効化します。
6. Gemini に自動返答させたい場合は auto-reply も有効化します。
7. YouTube Live Control Room または OBS からこのアプリ画面を配信します。

## 挙動の補足

- relay が Gemini に流すのは listener 開始後に受信した新着コメントのみです
- 無限ループ防止のため、配信者本人アカウントのコメントは無視されます
- broadcast list に出るのは、ログイン中アカウントから参照できる配信だけです
- 配信開始直後は live chat 情報がまだ出てこないことがあるため、少し待ってから refresh してください
- auto-reply は GeminiVRM 側で会話ターンを作るだけで、YouTube チャットへ書き戻すわけではありません

## 保存される情報とセキュリティ

- Google OAuth client ID は利便性のため browser local storage に保存されます
- 短命の YouTube access token も、サインアウトまたは期限切れまでは browser local storage から復元されます
- token が期限切れになったり認証に失敗した場合は、YouTube relay ページから再ログインしてください
- 公開本番運用では、ブラウザだけに依存した認証ではなく、サーバー管理のトークン設計を推奨します

## よくある失敗パターン

### ログインがブロックされる

- OAuth 同意画面が testing のままなら、使う Google アカウントを test user に追加します
- authorized JavaScript origin がアプリ URL と完全一致しているか確認します

### 配信一覧が出てこない

- 対象の YouTube チャンネルを所有または管理している Google アカウントでログインしているか確認します
- 配信が active または upcoming になったあとで refresh します

### コメントは見えるのに Gemini が返答しない

- auto-reply が有効か確認します
- relay 開始後に投稿した新しいコメントで試します
- 配信者本人コメントは無視されるため、別の視聴者アカウントでテストします

## 関連ドキュメント

- [開始手順](./getting-started.md)
- [使い方](./usage.md)
- [トラブルシュート](./troubleshooting.md)
