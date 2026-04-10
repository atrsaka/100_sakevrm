import { useState } from "react";
import { Link } from "./link";

export const Introduction = () => {
  const [opened, setOpened] = useState(true);

  return opened ? (
    <div className="absolute z-40 h-full w-full bg-black/30 px-24 py-40 font-M_PLUS_2">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        aria-describedby="intro-description"
        className="mx-auto my-auto max-h-full max-w-3xl overflow-auto rounded-16 bg-white p-24"
      >
        <div className="my-24">
          <div
            id="intro-title"
            className="my-8 typography-20 font-bold text-secondary"
          >
            おしゃべりVRM へようこそ
          </div>
          <div id="intro-description">
            このアプリは ChatVRM のブラウザビューアと入力フローをそのまま活かしつつ、応答経路を Gemini Live のネイティブ音声に置き換えた派生版です。VRM アバターと日本語で自然に会話したり、2 人のホストによるポッドキャストを自動生成できます。
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 typography-20 font-bold text-secondary">
            使用している技術
          </div>
          <div>
            VRM の描画には{" "}
            <Link url="https://github.com/pixiv/three-vrm" label="@pixiv/three-vrm" />
            を使用しています。ベースアプリは{" "}
            <Link url="https://github.com/pixiv/ChatVRM" label="pixiv/ChatVRM" />
            から派生し、音声応答は公式の{" "}
            <Link
              url="https://ai.google.dev/gemini-api/docs/live-api"
              label="Gemini Live API"
            />
            を{" "}
            <Link
              url="https://www.npmjs.com/package/@google/genai"
              label="@google/genai"
            />
            経由で利用しています。また、音声合成には{" "}
            <Link
              url="https://elevenlabs.io/"
              label="ElevenLabs"
            />
            にも対応しており、より自然な音声での会話が可能です。
          </div>
        </div>

        <div className="my-24">
          <div className="rounded-8 bg-surface3 px-16 py-12 text-sm text-secondary">
            Live モデル名や音声タイプなどの詳細設定は、起動後に左上の「設定」パネルからいつでも変更できます。
          </div>
        </div>

        <div className="my-24">
          <button
            onClick={() => setOpened(false)}
            className="rounded-oval bg-secondary px-24 py-8 font-bold text-white hover:bg-secondary-hover active:bg-secondary-press"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
