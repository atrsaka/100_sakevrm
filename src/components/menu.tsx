import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { BuiltInMotionId } from "@/features/vrmViewer/builtInMotions";

type Props = {
  geminiApiKey: string;
  geminiModel: string;
  geminiVoiceName: string;
  selectedMotionId: BuiltInMotionId;
  systemPrompt: string;
  chatLog: Message[];
  assistantMessage: string;
  assistantStatus: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeGeminiApiKey: (key: string) => void;
  onChangeGeminiModel: (model: string) => void;
  onChangeGeminiVoiceName: (voiceName: string) => void;
  onChangeMotion: (motionId: BuiltInMotionId) => void;
  onChangeChatLog: (index: number, text: string) => void;
  handleClickResetChatLog: () => void;
  handleClickResetSystemPrompt: () => void;
  youtubeSection?: React.ReactNode;
};

export const Menu = ({
  geminiApiKey,
  geminiModel,
  geminiVoiceName,
  selectedMotionId,
  systemPrompt,
  chatLog,
  assistantMessage,
  assistantStatus,
  onChangeSystemPrompt,
  onChangeGeminiApiKey,
  onChangeGeminiModel,
  onChangeGeminiVoiceName,
  onChangeMotion,
  onChangeChatLog,
  handleClickResetChatLog,
  handleClickResetSystemPrompt,
  youtubeSection,
}: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeSystemPrompt(event.target.value);
    },
    [onChangeSystemPrompt],
  );

  const handleGeminiApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiApiKey(event.target.value);
    },
    [onChangeGeminiApiKey],
  );

  const handleGeminiModelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiModel(event.target.value);
    },
    [onChangeGeminiModel],
  );

  const handleGeminiVoiceNameChange = useCallback(
    (voiceName: string) => {
      onChangeGeminiVoiceName(voiceName);
    },
    [onChangeGeminiVoiceName],
  );

  const handleClickOpenVrmFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const fileType = file.name.split(".").pop();

      if (fileType === "vrm") {
        const blob = new Blob([file], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
      }

      event.target.value = "";
    },
    [viewer],
  );

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton
            iconName="24/Menu"
            label="Settings"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          />
          {showChatLog ? (
            <IconButton
              iconName="24/CommentOutline"
              label="Chat Log"
              isProcessing={false}
              onClick={() => setShowChatLog(false)}
            />
          ) : (
            <IconButton
              iconName="24/CommentFill"
              label="Chat Log"
              isProcessing={false}
              disabled={chatLog.length <= 0}
              onClick={() => setShowChatLog(true)}
            />
          )}
        </div>
      </div>
      {showChatLog && <ChatLog messages={chatLog} />}
      {showSettings && (
        <Settings
          geminiApiKey={geminiApiKey}
          geminiModel={geminiModel}
          geminiVoiceName={geminiVoiceName}
          selectedMotionId={selectedMotionId}
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          onClickClose={() => setShowSettings(false)}
          onChangeGeminiApiKey={handleGeminiApiKeyChange}
          onChangeGeminiModel={handleGeminiModelChange}
          onChangeGeminiVoiceName={handleGeminiVoiceNameChange}
          onChangeMotion={onChangeMotion}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
          youtubeSection={youtubeSection}
        />
      )}
      {!showChatLog && (assistantMessage || assistantStatus) && (
        <AssistantText
          message={assistantMessage || assistantStatus}
          status={assistantStatus || undefined}
        />
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={fileInputRef}
        onChange={handleChangeVrmFile}
      />
    </>
  );
};
