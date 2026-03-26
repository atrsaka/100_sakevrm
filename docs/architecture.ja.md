# GeminiVRM Architecture

## Goals

GeminiVRM は、ChatVRM のブラウザ完結な VRM 会話体験を保ったまま、応答スタックを Gemini Live ネイティブ音声へ置き換えることを目的にしています。

現在のアーキテクチャは次を重視しています。

- PCM chunk 単位の低遅延再生
- バックエンド必須にしないローカルファースト構成
- VRM の口パクと表情制御との互換性

## Runtime Flow

1. ユーザーがメイン画面からプロンプトを送信します。
2. `src/pages/index.tsx` がアクティブな model に対してストリーミング再生モードを開始します。
3. `src/features/chat/geminiLiveChat.ts` が Gemini Live session を開き、transcript 更新と audio chunk を上流へ流します。
4. `src/features/lipSync/lipSync.ts` が PCM metadata を検証し、chunk を再生キューへ積み、analyser を更新して口パクを駆動します。
5. `src/features/vrmViewer/model.ts` が音声ストリームを VRM ランタイムへ橋渡しします。
6. `src/features/emoteController/*` が毎フレーム表情、視線、まばたき、口パクを更新します。

## Key Files

- `src/pages/index.tsx`
  - ユーザー入力、ストリーミング状態、チャットフロー
- `src/features/chat/geminiLiveChat.ts`
  - Gemini Live 接続、chunk 転送、transcript 組み立て、fallback model 制御
- `src/features/chat/geminiLiveConfig.ts`
  - 既定 model と voice preset 設定
- `src/features/lipSync/lipSync.ts`
  - 音声スケジューリング、PCM 検証、analyser 更新、autoplay 安全策
- `src/features/vrmViewer/model.ts`
  - VRM model への音声橋渡しとストリーミング用フック
- `src/components/*`
  - viewer、settings、chat input、assistant 状態表示 UI

## Streaming Notes

以前の実装は turn 完了を待ってから WAV 化し、decode 後に再生を始めていました。現在は PCM chunk 到着ごとに再生するため、体感レイテンシが下がり、Gemini Live の性質により合った構成になっています。

現在は次の安全策も入っています。

- `onmessage` コールバック内の例外処理
- 未対応または欠落した PCM metadata の検出
- chunk 境界での端数 PCM frame 吸収
- `AudioContext.resume()` がブロックされた場合の明示エラー

## Asset Model

- `public/Kiyoka.vrm`
  - 既定アバター
- `public/bg-d.png`
  - 既定背景
- `public/idle_loop.vrma`
  - アイドルアニメーション

## Limitations

- Gemini API key は現状ブラウザ側で直接扱います。
- 低遅延化はしていますが、再生開始タイミングはブラウザの音声スケジューリングと通信状態に依存します。
- 既定 preview model alias は Gemini アカウントによって使えない場合があります。
