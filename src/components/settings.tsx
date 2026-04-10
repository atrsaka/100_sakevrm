import React, { useEffect, useRef, useState } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Link } from "./link";
import {
  getMessageListLabel,
  Message,
} from "@/features/messages/messages";
import {
  DEFAULT_GEMINI_VOICE_NAME,
  GEMINI_VOICE_PRESETS,
} from "@/features/chat/geminiLiveConfig";
import {
  BUILT_IN_MOTION_LIST,
  BuiltInMotionId,
} from "@/features/vrmViewer/builtInMotions";
import { InteractionMode } from "@/features/podcast/podcastConfig";
import type { VoiceProvider } from "@/features/tts/elevenLabsConfig";
import {
  listElevenLabsVoices,
  type ElevenLabsVoice,
} from "@/features/tts/elevenLabsTts";

type Props = {
  geminiApiKey: string;
  geminiModel: string;
  geminiVoiceName: string;
  interactionMode: InteractionMode;
  podcastTurnCount: number;
  podcastYukitoVoiceName: string;
  podcastKiyokaVoiceName: string;
  selectedMotionId: BuiltInMotionId;
  systemPrompt: string;
  chatLog: Message[];
  onClickClose: () => void;
  onChangeGeminiApiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGeminiModel: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGeminiVoiceName: (voiceName: string) => void;
  onChangeInteractionMode: (mode: InteractionMode) => void;
  onChangePodcastTurnCount: (turnCount: number) => void;
  onChangePodcastYukitoVoiceName: (voiceName: string) => void;
  onChangePodcastKiyokaVoiceName: (voiceName: string) => void;
  podcastYukitoVrmLoaded: boolean;
  podcastKiyokaVrmLoaded: boolean;
  onLoadPodcastYukitoVrm: (file: File) => void;
  onLoadPodcastKiyokaVrm: (file: File) => void;
  onResetPodcastYukitoVrm: () => void;
  onResetPodcastKiyokaVrm: () => void;
  voiceProvider: VoiceProvider;
  onChangeVoiceProvider: (provider: VoiceProvider) => void;
  elevenLabsApiKey: string;
  onChangeElevenLabsApiKey: (key: string) => void;
  elevenLabsAgentId: string;
  onChangeElevenLabsAgentId: (agentId: string) => void;
  elevenLabsVoiceId: string;
  onChangeElevenLabsVoiceId: (voiceId: string) => void;
  elevenLabsPodcastYukitoVoiceId: string;
  onChangeElevenLabsPodcastYukitoVoiceId: (voiceId: string) => void;
  elevenLabsPodcastKiyokaVoiceId: string;
  onChangeElevenLabsPodcastKiyokaVoiceId: (voiceId: string) => void;
  onChangeMotion: (motionId: BuiltInMotionId) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  youtubeSection?: React.ReactNode;
};

export const Settings = ({
  geminiApiKey,
  geminiModel,
  geminiVoiceName,
  interactionMode,
  podcastTurnCount,
  podcastYukitoVoiceName,
  podcastKiyokaVoiceName,
  selectedMotionId,
  systemPrompt,
  chatLog,
  onClickClose,
  onChangeGeminiApiKey,
  onChangeGeminiModel,
  onChangeGeminiVoiceName,
  onChangeInteractionMode,
  onChangePodcastTurnCount,
  onChangePodcastYukitoVoiceName,
  onChangePodcastKiyokaVoiceName,
  podcastYukitoVrmLoaded,
  podcastKiyokaVrmLoaded,
  onLoadPodcastYukitoVrm,
  onLoadPodcastKiyokaVrm,
  onResetPodcastYukitoVrm,
  onResetPodcastKiyokaVrm,
  voiceProvider,
  onChangeVoiceProvider,
  elevenLabsApiKey,
  onChangeElevenLabsApiKey,
  elevenLabsAgentId,
  onChangeElevenLabsAgentId,
  elevenLabsVoiceId,
  onChangeElevenLabsVoiceId,
  elevenLabsPodcastYukitoVoiceId,
  onChangeElevenLabsPodcastYukitoVoiceId,
  elevenLabsPodcastKiyokaVoiceId,
  onChangeElevenLabsPodcastKiyokaVoiceId,
  onChangeMotion,
  onChangeSystemPrompt,
  onChangeChatLog,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  youtubeSection,
}: Props) => {
  const [activePage, setActivePage] = useState<"main" | "podcast" | "youtube">(
    "main",
  );
  const previousPageRef = useRef<"main" | "podcast" | "youtube">("main");
  const podcastEntryButtonRef = useRef<HTMLButtonElement | null>(null);
  const podcastTitleRef = useRef<HTMLDivElement | null>(null);
  const streamingEntryButtonRef = useRef<HTMLButtonElement | null>(null);
  const youtubeTitleRef = useRef<HTMLDivElement | null>(null);
  const isPresetVoice = (GEMINI_VOICE_PRESETS as readonly string[]).includes(
    geminiVoiceName,
  );

  const [elevenVoices, setElevenVoices] = useState<ElevenLabsVoice[]>([]);
  const [elevenVoicesLoading, setElevenVoicesLoading] = useState(false);
  const [elevenVoicesError, setElevenVoicesError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (voiceProvider !== "elevenlabs" || !elevenLabsApiKey) {
      setElevenVoices([]);
      setElevenVoicesError(null);
      return;
    }
    let cancelled = false;
    setElevenVoicesLoading(true);
    setElevenVoicesError(null);
    listElevenLabsVoices(elevenLabsApiKey)
      .then((voices) => {
        if (!cancelled) setElevenVoices(voices);
      })
      .catch((error) => {
        if (!cancelled) {
          setElevenVoicesError(
            error instanceof Error ? error.message : String(error),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setElevenVoicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [voiceProvider, elevenLabsApiKey]);

  const renderElevenVoiceSelect = (
    id: string,
    label: string,
    value: string,
    onChange: (voiceId: string) => void,
  ) => (
    <div className="mt-16">
      <label htmlFor={id} className="my-12 block font-bold">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={elevenVoices.length === 0}
      >
        <option value="">
          {elevenVoicesLoading
            ? "取得中..."
            : elevenVoices.length === 0
              ? "(voice 一覧を取得できません)"
              : "-- 選択してください --"}
        </option>
        {elevenVoices.map((voice) => (
          <option key={voice.voice_id} value={voice.voice_id}>
            {voice.name}
            {voice.category ? ` (${voice.category})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  useEffect(() => {
    if (!youtubeSection && activePage === "youtube") {
      setActivePage("main");
    }
  }, [activePage, youtubeSection]);

  useEffect(() => {
    const previousPage = previousPageRef.current;

    if (activePage === "podcast") {
      podcastTitleRef.current?.focus();
    } else if (activePage === "youtube") {
      youtubeTitleRef.current?.focus();
    } else if (previousPage === "podcast") {
      podcastEntryButtonRef.current?.focus();
    } else if (previousPage === "youtube") {
      streamingEntryButtonRef.current?.focus();
    }

    previousPageRef.current = activePage;
  }, [activePage]);

  return (
    <div className="absolute z-40 h-full w-full bg-white/80 backdrop-blur">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          label="設定を閉じる"
          isProcessing={false}
          onClick={onClickClose}
        />
      </div>
      <div className="max-h-full overflow-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="mx-auto max-w-3xl px-24 py-64 text-text1"
        >
          {activePage === "podcast" ? (
            <>
              <button
                type="button"
                onClick={() => setActivePage("main")}
                aria-label="メイン設定に戻る"
                className="my-16 text-sm font-bold text-primary hover:text-primary-hover"
              >
                ← 設定トップに戻る
              </button>
              <div
                ref={podcastTitleRef}
                id="settings-title"
                tabIndex={-1}
                className="my-12 typography-32 font-bold"
              >
                ポッドキャスト設定
              </div>
              <div className="mb-16 text-sm text-text2">
                Yukito と Kiyoka が交互に話すポッドキャストモードの挙動を調整します。会話ターン数と、ホスト別の音声を個別に指定できます。
              </div>
              <div className="rounded-16 border border-black/10 bg-white/70 px-16 py-16">
                <div className="typography-20 font-bold">再生範囲</div>
                <div className="mt-16">
                  <label
                    htmlFor="settings-podcast-turn-count"
                    id="settings-podcast-turn-count-label"
                    className="my-12 block font-bold"
                  >
                    最大ターン数
                  </label>
                  <input
                    id="settings-podcast-turn-count"
                    className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                    type="number"
                    min={2}
                    max={30}
                    step={1}
                    value={podcastTurnCount}
                    onChange={(event) =>
                      onChangePodcastTurnCount(
                        Number.parseInt(event.target.value, 10),
                      )
                    }
                  />
                  <div className="mt-8 text-sm text-text2">
                    この上限に達すると、ポッドキャストは自動的に停止します。<code>2</code> を指定すると Yukito と Kiyoka が 1 回ずつ話す短い掛け合いになります。数値が大きいほど会話は長くなり、Gemini Live API の消費量も増えます。
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby="settings-podcast-turn-count-label"
                  className="mt-16 flex flex-wrap gap-8"
                >
                  {[2, 4, 6, 8, 12, 16, 20, 30].map((presetCount) => {
                    const isSelected = presetCount === podcastTurnCount;
                    return (
                      <button
                        key={presetCount}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChangePodcastTurnCount(presetCount)}
                        className={`rounded-full px-12 py-6 text-sm font-bold transition ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-surface1 text-text1 hover:bg-surface1-hover"
                        }`}
                      >
                        {presetCount}ターン
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-24 rounded-16 border border-black/10 bg-white/70 px-16 py-16">
                <div className="typography-20 font-bold">ホスト別の音声</div>
                <div className="mt-8 text-sm text-text2">
                  Gemini Live の prebuilt voice 名を入力してください。利用可能: <code>Charon</code> / <code>Aoede</code> / <code>Puck</code> / <code>Kore</code> / <code>Leda</code> / <code>Fenrir</code>。空欄にすると既定の <code>{DEFAULT_GEMINI_VOICE_NAME}</code> が使われます。
                </div>
                <div className="mt-16">
                  <label
                    htmlFor="settings-podcast-yukito-voice"
                    className="my-12 block font-bold"
                  >
                    Yukito の音声
                  </label>
                  <input
                    id="settings-podcast-yukito-voice"
                    className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                    type="text"
                    placeholder="例: Puck"
                    value={podcastYukitoVoiceName}
                    onChange={(event) =>
                      onChangePodcastYukitoVoiceName(event.target.value)
                    }
                  />
                </div>
                <div className="mt-16">
                  <label
                    htmlFor="settings-podcast-kiyoka-voice"
                    className="my-12 block font-bold"
                  >
                    Kiyoka の音声
                  </label>
                  <input
                    id="settings-podcast-kiyoka-voice"
                    className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                    type="text"
                    placeholder="例: Charon"
                    value={podcastKiyokaVoiceName}
                    onChange={(event) =>
                      onChangePodcastKiyokaVoiceName(event.target.value)
                    }
                  />
                </div>
                <div className="mt-8 text-sm text-text2">
                  ここの設定はポッドキャストモード専用です。通常のキャラクターチャット用の音声には影響しません。現在の音声プロバイダは <strong>{voiceProvider === "gemini" ? "Gemini Live" : "ElevenLabs"}</strong> で、上の項目は Gemini Live の prebuilt voice に対応します。
                </div>
              </div>
              {voiceProvider === "elevenlabs" && (
                <div className="mt-24 rounded-16 border border-black/10 bg-white/70 px-16 py-16">
                  <div className="typography-20 font-bold">
                    ElevenLabs ホスト別音声
                  </div>
                  <div className="mt-8 text-sm text-text2">
                    ElevenLabs プロバイダ選択時のポッドキャストでは、Yukito と
                    Kiyoka にそれぞれ ElevenLabs の voice を割り当ててください。両者とも設定する必要があります。
                  </div>
                  {elevenVoicesError && (
                    <div className="mt-8 rounded-8 bg-red-50 px-12 py-8 text-sm text-red-700">
                      voices 取得エラー: {elevenVoicesError}
                    </div>
                  )}
                  {renderElevenVoiceSelect(
                    "settings-elevenlabs-yukito",
                    "Yukito の音声",
                    elevenLabsPodcastYukitoVoiceId,
                    onChangeElevenLabsPodcastYukitoVoiceId,
                  )}
                  {renderElevenVoiceSelect(
                    "settings-elevenlabs-kiyoka",
                    "Kiyoka の音声",
                    elevenLabsPodcastKiyokaVoiceId,
                    onChangeElevenLabsPodcastKiyokaVoiceId,
                  )}
                </div>
              )}
              <div className="mt-24 rounded-16 border border-black/10 bg-white/70 px-16 py-16">
                <div className="typography-20 font-bold">ホスト別の VRM モデル</div>
                <div className="mt-8 text-sm text-text2">
                  Yukito と Kiyoka それぞれのアバター VRM を個別に差し替えられます。未読み込み時は同梱の <code>Yukito.vrm</code> と <code>Kiyoka.vrm</code> が使われます。ブラウザで読み込んだ VRM はセッション内のみ有効で、リロードすると既定に戻ります。
                </div>
                <div className="mt-16 grid gap-12 md:grid-cols-2">
                  <div className="rounded-12 border border-black/5 bg-white/60 p-12">
                    <div className="typography-16 font-bold">Yukito (左)</div>
                    <div className="mt-4 text-xs text-text2">
                      現在: <strong>{podcastYukitoVrmLoaded ? "カスタム VRM" : "Yukito.vrm (既定)"}</strong>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-8">
                      <label className="cursor-pointer rounded-oval bg-primary px-16 py-4 text-sm font-bold text-white hover:bg-primary-hover">
                        VRM を読み込む
                        <input
                          type="file"
                          accept=".vrm"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onLoadPodcastYukitoVrm(file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {podcastYukitoVrmLoaded && (
                        <TextButton onClick={onResetPodcastYukitoVrm}>
                          既定に戻す
                        </TextButton>
                      )}
                    </div>
                  </div>
                  <div className="rounded-12 border border-black/5 bg-white/60 p-12">
                    <div className="typography-16 font-bold">Kiyoka (右)</div>
                    <div className="mt-4 text-xs text-text2">
                      現在: <strong>{podcastKiyokaVrmLoaded ? "カスタム VRM" : "Kiyoka.vrm (既定)"}</strong>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-8">
                      <label className="cursor-pointer rounded-oval bg-primary px-16 py-4 text-sm font-bold text-white hover:bg-primary-hover">
                        VRM を読み込む
                        <input
                          type="file"
                          accept=".vrm"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onLoadPodcastKiyokaVrm(file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {podcastKiyokaVrmLoaded && (
                        <TextButton onClick={onResetPodcastKiyokaVrm}>
                          既定に戻す
                        </TextButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activePage === "youtube" ? (
            <>
              <button
                type="button"
                onClick={() => setActivePage("main")}
                aria-label="メイン設定に戻る"
                className="my-16 text-sm font-bold text-primary hover:text-primary-hover"
              >
                ← 設定トップに戻る
              </button>
              <div
                ref={youtubeTitleRef}
                id="settings-title"
                tabIndex={-1}
                className="my-12 typography-32 font-bold"
              >
                YouTube Live 連携
              </div>
              <div className="mb-16 text-sm text-text2">
                YouTube Live の配信コメントを GeminiVRM に取り込み、アバターに自動応答させるオプション機能です。利用には Google OAuth Web クライアント ID のログインが必要です。
              </div>
              {youtubeSection}
            </>
          ) : (
            <>
              <div
                id="settings-title"
                className="my-24 typography-32 font-bold"
              >
                設定
              </div>

              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  会話モード
                </div>
                <div
                  role="radiogroup"
                  aria-label="会話モード"
                  className="grid gap-12 md:grid-cols-2"
                >
                  {(["chat", "podcast"] as const).map((mode) => {
                    const isSelected = interactionMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChangeInteractionMode(mode)}
                        className={`rounded-16 border px-16 py-16 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-lg"
                            : "border-black/10 bg-white/70 text-text1 hover:border-primary/40 hover:bg-surface1"
                        }`}
                      >
                        <div className="typography-20 font-bold">
                          {mode === "chat" ? "キャラクターチャット" : "ポッドキャストモード"}
                        </div>
                        <p
                          className={`mt-10 text-sm leading-relaxed ${
                            isSelected ? "text-white/90" : "text-text2"
                          }`}
                        >
                          {mode === "chat"
                            ? "1 体のアバターと 1 対 1 で会話します。テキストまたはマイク入力で話しかけると、Gemini Live が音声で応答します。"
                            : "1 つのトピックを元に、Yukito と Kiyoka が自動で短いターンを交互に掛け合います。上限ターン数に達すると停止します。"}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 text-sm">
                  ポッドキャストモードは、直前の話者の音声を次の Gemini Live ターンに渡して会話を繋げます。リレーが失敗した場合は別経路に切り替えず、その時点で Gemini Live のエラーメッセージを表示して停止します。
                </div>
              </div>

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">音声プロバイダ</div>
                <div
                  role="radiogroup"
                  aria-label="音声プロバイダ"
                  className="grid gap-12 md:grid-cols-2"
                >
                  {(["gemini", "elevenlabs"] as const).map((provider) => {
                    const isSelected = voiceProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChangeVoiceProvider(provider)}
                        className={`rounded-16 border px-16 py-16 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-lg"
                            : "border-black/10 bg-white/70 text-text1 hover:border-primary/40 hover:bg-surface1"
                        }`}
                      >
                        <div className="typography-20 font-bold">
                          {provider === "gemini" ? "Gemini Live" : "ElevenLabs"}
                        </div>
                        <p
                          className={`mt-10 text-sm leading-relaxed ${
                            isSelected ? "text-white/90" : "text-text2"
                          }`}
                        >
                          {provider === "gemini"
                            ? "Gemini Live のネイティブ音声を使います。低レイテンシで、prebuilt voice 6 種から選択します。"
                            : "Gemini でテキストのみ生成し、ElevenLabs TTS で音声化します。voice cloning など任意の声を使えますが、2 ホップ分レイテンシが増えます。"}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {voiceProvider === "elevenlabs" && (
                  <div className="mt-16 rounded-16 border border-black/10 bg-white/70 px-16 py-16">
                    <div className="mb-12 text-sm text-text2">
                      ElevenLabs Conversational AI (Agents) を使って、ダッシュボードで作成した Agent に接続します。実行時に system prompt / voice / language を override してキャラクターやポッドキャストホストの発話を切替えます。Agent の Security 設定で override が有効化されている必要があります。
                    </div>
                    <label
                      htmlFor="settings-elevenlabs-agent-id"
                      className="my-8 block font-bold"
                    >
                      Agent ID
                    </label>
                    <input
                      id="settings-elevenlabs-agent-id"
                      type="text"
                      className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                      placeholder="agent_..."
                      value={elevenLabsAgentId}
                      onChange={(event) =>
                        onChangeElevenLabsAgentId(event.target.value)
                      }
                    />
                    <div className="mt-8 text-sm text-text2">
                      <code>.env.local</code> に <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> を設定すれば自動で埋まります。Public agent の場合は API キー不要で接続できます。
                    </div>
                    <label
                      htmlFor="settings-elevenlabs-api-key"
                      className="my-8 mt-16 block font-bold"
                    >
                      API キー(voice 一覧取得・Private agent 用)
                    </label>
                    <input
                      id="settings-elevenlabs-api-key"
                      type="password"
                      className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                      placeholder="sk_..."
                      value={elevenLabsApiKey}
                      onChange={(event) =>
                        onChangeElevenLabsApiKey(event.target.value)
                      }
                    />
                    <div className="mt-8 text-sm text-text2">
                      My Voices 一覧の取得に使います。Private agent を利用する場合は signed URL 生成にも使われます。Public agent のみでドロップダウンから voice を手入力する場合は省略可能です。
                    </div>
                    {elevenVoicesError && (
                      <div className="mt-8 rounded-8 bg-red-50 px-12 py-8 text-sm text-red-700">
                        voices 取得エラー: {elevenVoicesError}
                      </div>
                    )}
                    {renderElevenVoiceSelect(
                      "settings-elevenlabs-voice",
                      "キャラクターチャット音声",
                      elevenLabsVoiceId,
                      onChangeElevenLabsVoiceId,
                    )}
                    <div className="mt-8 text-sm text-text2">
                      選択した voice でキャラクターチャットの発話が生成されます。ポッドキャストモードは下の「ポッドキャスト詳細設定」から Yukito / Kiyoka それぞれに別の voice を設定できます。
                    </div>
                  </div>
                )}
              </div>

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">
                  ポッドキャストモード
                </div>
                <button
                  ref={podcastEntryButtonRef}
                  type="button"
                  onClick={() => setActivePage("podcast")}
                  aria-label="ポッドキャスト設定を開く"
                  className="w-full rounded-16 border border-black/10 bg-white/70 px-16 py-16 text-left transition hover:border-primary/30 hover:bg-surface1"
                >
                  <div className="flex items-start justify-between gap-12">
                    <div>
                      <div className="typography-20 font-bold">
                        ポッドキャスト詳細設定
                      </div>
                      <div className="mt-6 text-sm leading-relaxed text-text2">
                        Yukito と Kiyoka の最大ターン数と、ホスト別の音声(ポッドキャスト専用)を調整します。
                      </div>
                    </div>
                    <div className="rounded-full bg-secondary/10 px-10 py-4 text-xs font-bold text-secondary">
                      任意
                    </div>
                  </div>
                  <div className="mt-10 text-sm text-text2">
                    最大ターン数: <strong>{podcastTurnCount}</strong>
                    {" · "}
                    Yukito: <strong>{podcastYukitoVoiceName || "既定"}</strong>
                    {" · "}
                    Kiyoka: <strong>{podcastKiyokaVoiceName || "既定"}</strong>
                  </div>
                  <div className="mt-10 text-sm font-bold text-primary">
                    ポッドキャスト設定を開く →
                  </div>
                </button>
              </div>

              <div className="my-24">
                <label
                  htmlFor="settings-gemini-api-key"
                  className="my-16 block typography-20 font-bold"
                >
                  Gemini API キー
                </label>
                <input
                  id="settings-gemini-api-key"
                  className="w-col-span-2 rounded-8 bg-surface1 px-16 py-8 text-ellipsis hover:bg-surface1-hover"
                  type="password"
                  placeholder="AIza..."
                  value={geminiApiKey}
                  onChange={onChangeGeminiApiKey}
                  aria-describedby="settings-gemini-api-key-help"
                />
                <div id="settings-gemini-api-key-help" className="mt-8 text-sm text-text2">
                  Gemini Live API にアクセスするための API キーです。{" "}
                  <Link
                    url="https://aistudio.google.com/apikey"
                    label="Google AI Studio"
                  />
                  で発行してください。キーはブラウザのローカルストレージに保存され、サーバーには送信されません。
                </div>
              </div>

              <div className="my-24">
                <label
                  htmlFor="settings-gemini-model"
                  className="my-16 block typography-20 font-bold"
                >
                  Live モデル
                </label>
                <input
                  id="settings-gemini-model"
                  className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                  type="text"
                  placeholder="gemini-3.1-flash-live-preview"
                  value={geminiModel}
                  onChange={onChangeGeminiModel}
                />
                <div className="mt-8 text-sm text-text2">
                  使用する Gemini Live のモデル名を指定します。このアプリは{" "}
                  <code>gemini-3.1-flash-live-preview</code> 向けにチューニングされており、他のモデルへの自動フォールバックは行いません。別モデルを試す場合のみ変更してください。
                </div>
              </div>

              <div className="my-24">
                <label
                  htmlFor="settings-gemini-voice"
                  className="my-16 block typography-20 font-bold"
                >
                  音声(キャラクターチャット)
                </label>
                <select
                  id="settings-gemini-voice"
                  className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                  value={isPresetVoice ? geminiVoiceName : "__custom__"}
                  onChange={(event) => {
                    const selectedVoice = event.target.value;
                    if (selectedVoice === "__custom__") {
                      onChangeGeminiVoiceName("");
                      return;
                    }

                    onChangeGeminiVoiceName(selectedVoice);
                  }}
                >
                  <option value="__custom__">カスタム音声</option>
                  {GEMINI_VOICE_PRESETS.map((voiceName) => (
                    <option key={voiceName} value={voiceName}>
                      {voiceName}
                    </option>
                  ))}
                </select>
                <div className="mt-8 text-sm text-text2">
                  キャラクターチャット時にアバターが話す音声を選びます。プリセットから選ぶか、「カスタム音声」を選んで Gemini Live の prebuilt voice 名を直接入力してください。空欄の場合は既定の <code>{DEFAULT_GEMINI_VOICE_NAME}</code> が使われます。この設定はポッドキャストモードには影響しません。
                </div>
                {!isPresetVoice && (
                  <div className="mt-8">
                    <label
                      htmlFor="settings-gemini-voice-custom"
                      className="my-16 block text-sm"
                    >
                      カスタム音声名
                    </label>
                    <input
                      id="settings-gemini-voice-custom"
                      className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                      type="text"
                      placeholder="例: Charon"
                      value={geminiVoiceName}
                      onChange={(event) =>
                        onChangeGeminiVoiceName(event.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {youtubeSection ? (
                <div className="my-40">
                  <div className="my-16 typography-20 font-bold">配信連携</div>
                  <button
                    ref={streamingEntryButtonRef}
                    type="button"
                    onClick={() => setActivePage("youtube")}
                    aria-label="YouTube Live 連携の設定を開く"
                    className="w-full rounded-16 border border-black/10 bg-white/70 px-16 py-16 text-left transition hover:border-primary/30 hover:bg-surface1"
                  >
                    <div className="flex items-start justify-between gap-12">
                      <div>
                        <div className="typography-20 font-bold">
                          YouTube Live 連携
                        </div>
                        <div className="mt-6 text-sm leading-relaxed text-text2">
                          YouTube Live 配信のコメントを取り込み、アバターに自動応答させるオプション機能です。
                        </div>
                      </div>
                      <div className="rounded-full bg-secondary/10 px-10 py-4 text-xs font-bold text-secondary">
                        任意
                      </div>
                    </div>
                    <div className="mt-10 text-sm font-bold text-primary">
                      配信連携の設定を開く →
                    </div>
                  </button>
                </div>
              ) : null}

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">VRM モデル</div>
                <div className="my-4 text-sm text-text2">
                  アバターに使用する VRM ファイルを読み込みます。未読み込み時は同梱の <code>Kiyoka.vrm</code> が使われます。手元の <code>.vrm</code> ファイルを選択すると即時に差し替わります。
                </div>
                <div className="my-8">
                  <TextButton onClick={onClickOpenVrmFile}>VRM を読み込む</TextButton>
                </div>
              </div>

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">待機モーション</div>
                <div className="mb-12 text-sm text-text2">
                  アバターが何もしていない時に再生するアイドルモーションを選びます。発話中は自動でトーキングモーションに切り替わります。
                </div>
                <div
                  role="radiogroup"
                  aria-describedby="idle-motion-help"
                  className="grid gap-12 md:grid-cols-3"
                >
                  {BUILT_IN_MOTION_LIST.map((motion) => {
                    const isSelected = motion.id === selectedMotionId;

                    return (
                      <button
                        key={motion.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-describedby="idle-motion-help"
                        onClick={() => onChangeMotion(motion.id)}
                        className={`rounded-16 border px-16 py-16 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-lg"
                            : "border-black/10 bg-white/70 text-text1 hover:border-primary/40 hover:bg-surface1"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-12">
                          <div className="typography-20 font-bold">
                            {motion.label}
                          </div>
                          <div
                            className={`rounded-full px-10 py-4 text-xs font-bold ${
                              isSelected
                                ? "bg-white text-primary"
                                : "bg-black/5 text-text2"
                            }`}
                          >
                            {motion.durationLabel}
                          </div>
                        </div>
                        <p
                          className={`mt-10 text-sm leading-relaxed ${
                            isSelected ? "text-white/90" : "text-text2"
                          }`}
                        >
                          {motion.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div id="idle-motion-help" className="mt-8 text-sm text-text2">
                  「Random Idle」は同梱モーションをランダムに切り替えます。他のプリセットは 1 つのモーションをループ再生します。
                </div>
              </div>

              <div className="my-40">
                <div className="my-8">
                  <label
                    htmlFor="settings-system-prompt"
                    className="my-16 block typography-20 font-bold"
                  >
                    システムプロンプト
                  </label>
                  <div className="mb-8 text-sm text-text2">
                    キャラクターチャット時にアバターの性格・話し方・役割を決める指示文です。Gemini Live への各リクエストに毎回付与されます。ポッドキャストモードは別途ホスト用プロンプトを使うためここの内容は適用されません。
                  </div>
                  <TextButton onClick={onClickResetSystemPrompt}>
                    初期値に戻す
                  </TextButton>
                </div>

                <textarea
                  id="settings-system-prompt"
                  value={systemPrompt}
                  onChange={onChangeSystemPrompt}
                  className="h-168 w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                />
              </div>

              {chatLog.length > 0 && (
                <div className="my-40">
                  <div className="my-8 grid-cols-2">
                    <div className="my-16 typography-20 font-bold">
                      会話ログ
                    </div>
                    <div className="mb-8 text-sm text-text2">
                      これまでの会話履歴です。各行をクリックして内容を編集でき、編集結果は次回以降の Gemini Live へのコンテキストにそのまま反映されます。
                    </div>
                    <TextButton onClick={onClickResetChatLog}>
                      会話ログをリセット
                    </TextButton>
                  </div>
                  <div className="my-8">
                    {chatLog.map((value, index) => (
                      <div
                        key={index}
                        className="my-8 grid grid-flow-col grid-cols-[min-content_1fr] gap-x-fixed"
                      >
                        <div className="w-[80px] py-8">
                          {getMessageListLabel(value)}
                        </div>
                        <input
                          aria-label={`会話ログ ${index + 1} 番目`}
                          className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                          type="text"
                          value={value.displayContent ?? value.content}
                          onChange={(event) =>
                            onChangeChatLog(index, event.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
