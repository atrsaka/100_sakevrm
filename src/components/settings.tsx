import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Link } from "./link";
import { Message } from "@/features/messages/messages";
import {
  DEFAULT_GEMINI_VOICE_NAME,
  GEMINI_VOICE_PRESETS,
} from "@/features/chat/geminiLiveConfig";
import {
  BUILT_IN_MOTION_LIST,
  BuiltInMotionId,
} from "@/features/vrmViewer/builtInMotions";

type Props = {
  geminiApiKey: string;
  geminiModel: string;
  geminiVoiceName: string;
  selectedMotionId: BuiltInMotionId;
  systemPrompt: string;
  chatLog: Message[];
  onClickClose: () => void;
  onChangeGeminiApiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGeminiModel: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGeminiVoiceName: (voiceName: string) => void;
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
  selectedMotionId,
  systemPrompt,
  chatLog,
  onClickClose,
  onChangeGeminiApiKey,
  onChangeGeminiModel,
  onChangeGeminiVoiceName,
  onChangeMotion,
  onChangeSystemPrompt,
  onChangeChatLog,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  youtubeSection,
}: Props) => {
  const isPresetVoice = (GEMINI_VOICE_PRESETS as readonly string[]).includes(
    geminiVoiceName,
  );

  return (
    <div className="absolute z-40 h-full w-full bg-white/80 backdrop-blur">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          label="Close settings"
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
          <div id="settings-title" className="my-24 typography-32 font-bold">
            Settings
          </div>

          <div className="my-24">
            <label
              htmlFor="settings-gemini-api-key"
              className="my-16 block typography-20 font-bold"
            >
              Gemini API key
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
            <div id="settings-gemini-api-key-help" className="mt-8">
              Generate a key in{" "}
              <Link
                url="https://aistudio.google.com/apikey"
                label="Google AI Studio"
              />
              .
            </div>
          </div>

          <div className="my-24">
            <label
              htmlFor="settings-gemini-model"
              className="my-16 block typography-20 font-bold"
            >
              Live model
            </label>
            <input
              id="settings-gemini-model"
              className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
              type="text"
              placeholder="gemini-3.1-flash-live-preview"
              value={geminiModel}
              onChange={onChangeGeminiModel}
            />
            <div className="mt-8 text-sm">
              If your account does not expose the default preview alias, try
              `gemini-2.5-flash-native-audio-preview-12-2025`.
            </div>
          </div>

          <div className="my-24">
            <label
              htmlFor="settings-gemini-voice"
              className="my-16 block typography-20 font-bold"
            >
              Voice
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
              <option value="__custom__">Custom voice</option>
              {GEMINI_VOICE_PRESETS.map((voiceName) => (
                <option key={voiceName} value={voiceName}>
                  {voiceName}
                </option>
              ))}
            </select>
            <div className="mt-8 text-sm">
              Pick a preset voice, or switch to Custom voice and enter a
              prebuilt voice name manually. Blank custom input falls back to{" "}
              <code>{DEFAULT_GEMINI_VOICE_NAME}</code>.
            </div>
            {!isPresetVoice && (
              <div className="mt-8">
                <label
                  htmlFor="settings-gemini-voice-custom"
                  className="my-16 block text-sm"
                >
                  Custom voice name
                </label>
                <input
                  id="settings-gemini-voice-custom"
                  className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover"
                  type="text"
                  placeholder="custom voice"
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
              <div className="my-16 typography-20 font-bold">
                YouTube live chat
              </div>
              <div className="mb-12 text-sm text-text2">
                Connect your broadcast, listen for incoming comments, and let
                Gemini answer from the existing chat flow.
              </div>
              {youtubeSection}
            </div>
          ) : null}

          <div className="my-40">
            <div className="my-16 typography-20 font-bold">VRM model</div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>Load VRM</TextButton>
            </div>
          </div>

          <div className="my-40">
            <div className="my-16 typography-20 font-bold">Idle motion</div>
            <div className="grid gap-12 md:grid-cols-3">
              {BUILT_IN_MOTION_LIST.map((motion) => {
                const isSelected = motion.id === selectedMotionId;

                return (
                  <button
                    key={motion.id}
                    type="button"
                    aria-pressed={isSelected}
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
                            ? "bg-white/20 text-white"
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
            <div className="mt-8 text-sm">
              Switches the built-in idle motion immediately for the active VRM.
            </div>
          </div>

          <div className="my-40">
            <div className="my-8">
              <label
                htmlFor="settings-system-prompt"
                className="my-16 block typography-20 font-bold"
              >
                System prompt
              </label>
              <TextButton onClick={onClickResetSystemPrompt}>
                Reset prompt
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
                <div className="my-16 typography-20 font-bold">Chat log</div>
                <TextButton onClick={onClickResetChatLog}>
                  Reset chat log
                </TextButton>
              </div>
              <div className="my-8">
                {chatLog.map((value, index) => (
                  <div
                    key={index}
                    className="my-8 grid grid-flow-col grid-cols-[min-content_1fr] gap-x-fixed"
                  >
                    <div className="w-[80px] py-8">
                      {value.role === "assistant"
                        ? "Assistant"
                        : value.role === "system"
                          ? "System"
                          : (value.name ?? "You")}
                    </div>
                    <input
                      aria-label={`Chat log entry ${index + 1}`}
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
        </div>
      </div>
    </div>
  );
};
