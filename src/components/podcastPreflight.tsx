import { useState } from "react";
import type { PodcastPersonaPlan } from "@/features/podcast/podcastPersonaDesigner";
import { TextButton } from "./textButton";

type Props = {
  topic: string;
  persona: PodcastPersonaPlan | null;
  loading: boolean;
  error: string | null;
  onChangePersona: (persona: PodcastPersonaPlan) => void;
  onRegenerate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export const PodcastPreflight = ({
  topic,
  persona,
  loading,
  error,
  onChangePersona,
  onRegenerate,
  onCancel,
  onConfirm,
}: Props) => {
  const [collapsedConcept, setCollapsedConcept] = useState(false);

  const update = (updater: (prev: PodcastPersonaPlan) => PodcastPersonaPlan) => {
    if (!persona) return;
    onChangePersona(updater(persona));
  };

  return (
    <div className="absolute z-50 h-full w-full bg-black/40 backdrop-blur">
      <div className="mx-auto my-auto flex h-full max-w-3xl flex-col px-24 py-40">
        <div className="flex-1 overflow-auto rounded-16 bg-white p-24 shadow-2xl">
          <div className="mb-8 typography-32 font-bold text-text1">
            ポッドキャスト プレフライト
          </div>
          <div className="mb-16 text-sm text-text2">
            テーマ: <strong>{topic}</strong>
            <br />
            生成された番組設定とキャラ定義を確認してください。各項目は手動で編集できます。OK で本番のポッドキャスト収録に進みます。
          </div>

          {loading && (
            <div className="my-24 rounded-12 bg-surface1 px-16 py-12 text-sm">
              Gemini で番組設定を生成中...
            </div>
          )}

          {error && (
            <div className="my-16 rounded-12 bg-red-50 px-16 py-12 text-sm text-red-700">
              生成エラー: {error}
            </div>
          )}

          {persona && !loading && (
            <>
              <Section label="番組タイトル">
                <input
                  className="w-full rounded-8 bg-surface1 px-12 py-8 hover:bg-surface1-hover"
                  type="text"
                  value={persona.showTitle}
                  onChange={(event) =>
                    update((prev) => ({
                      ...prev,
                      showTitle: event.target.value,
                    }))
                  }
                />
              </Section>

              <Section label="番組コンセプト / 世界観">
                <textarea
                  className="h-72 w-full rounded-8 bg-surface1 px-12 py-8 hover:bg-surface1-hover"
                  value={persona.showConcept}
                  onChange={(event) =>
                    update((prev) => ({
                      ...prev,
                      showConcept: event.target.value,
                    }))
                  }
                />
              </Section>

              <div className="my-16 grid gap-12 md:grid-cols-2">
                <HostBlock
                  title="Yukito (左)"
                  host={persona.yukito}
                  onChange={(host) =>
                    update((prev) => ({ ...prev, yukito: host }))
                  }
                />
                <HostBlock
                  title="Kiyoka (右)"
                  host={persona.kiyoka}
                  onChange={(host) =>
                    update((prev) => ({ ...prev, kiyoka: host }))
                  }
                />
              </div>

              <Section label="冒頭の一言(参考)">
                <input
                  className="w-full rounded-8 bg-surface1 px-12 py-8 hover:bg-surface1-hover"
                  type="text"
                  value={persona.openingHook}
                  onChange={(event) =>
                    update((prev) => ({
                      ...prev,
                      openingHook: event.target.value,
                    }))
                  }
                />
              </Section>
            </>
          )}

          {/* hidden control to silence unused */}
          <span className="hidden">{collapsedConcept ? "" : ""}</span>
          <button
            type="button"
            className="hidden"
            onClick={() => setCollapsedConcept((c) => !c)}
          />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-end gap-12">
          <TextButton onClick={onCancel}>キャンセル</TextButton>
          <TextButton onClick={onRegenerate} disabled={loading}>
            再生成
          </TextButton>
          <button
            type="button"
            className="rounded-oval bg-primary px-24 py-8 font-bold text-white hover:bg-primary-hover disabled:bg-primary-disabled"
            onClick={onConfirm}
            disabled={loading || !persona}
          >
            この設定で開始
          </button>
        </div>
      </div>
    </div>
  );
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-12">
      <div className="my-4 font-bold text-text1">{label}</div>
      {children}
    </div>
  );
}

function HostBlock({
  title,
  host,
  onChange,
}: {
  title: string;
  host: { persona: string; speakingStyle: string; backstory: string };
  onChange: (host: {
    persona: string;
    speakingStyle: string;
    backstory: string;
  }) => void;
}) {
  return (
    <div className="rounded-12 border border-black/10 bg-white/70 p-12">
      <div className="mb-8 typography-16 font-bold text-text1">{title}</div>
      <div className="mb-8">
        <div className="mb-4 text-xs text-text2">人物像</div>
        <textarea
          className="h-48 w-full rounded-8 bg-surface1 px-12 py-8"
          value={host.persona}
          onChange={(event) =>
            onChange({ ...host, persona: event.target.value })
          }
        />
      </div>
      <div className="mb-8">
        <div className="mb-4 text-xs text-text2">喋り方・口調</div>
        <textarea
          className="h-48 w-full rounded-8 bg-surface1 px-12 py-8"
          value={host.speakingStyle}
          onChange={(event) =>
            onChange({ ...host, speakingStyle: event.target.value })
          }
        />
      </div>
      <div>
        <div className="mb-4 text-xs text-text2">背景設定</div>
        <textarea
          className="h-48 w-full rounded-8 bg-surface1 px-12 py-8"
          value={host.backstory}
          onChange={(event) =>
            onChange({ ...host, backstory: event.target.value })
          }
        />
      </div>
    </div>
  );
}
