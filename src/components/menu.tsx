import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";

type Props = {
  geminiApiKey: string;
  geminiModel: string;
  geminiVoiceName: string;
  systemPrompt: string;
  chatLog: Message[];
  assistantMessage: string;
  isChatProcessing: boolean;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeGeminiApiKey: (key: string) => void;
  onChangeGeminiModel: (model: string) => void;
  onChangeGeminiVoiceName: (voiceName: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  handleClickResetChatLog: () => void;
  handleClickResetSystemPrompt: () => void;
};

export const Menu = ({
  geminiApiKey,
  geminiModel,
  geminiVoiceName,
  systemPrompt,
  chatLog,
  assistantMessage,
  isChatProcessing,
  onChangeSystemPrompt,
  onChangeGeminiApiKey,
  onChangeGeminiModel,
  onChangeGeminiVoiceName,
  onChangeChatLog,
  handleClickResetChatLog,
  handleClickResetSystemPrompt,
}: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeSystemPrompt(event.target.value);
    },
    [onChangeSystemPrompt]
  );

  const handleGeminiApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiApiKey(event.target.value);
    },
    [onChangeGeminiApiKey]
  );

  const handleGeminiModelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiModel(event.target.value);
    },
    [onChangeGeminiModel]
  );

  const handleGeminiVoiceNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiVoiceName(event.target.value);
    },
    [onChangeGeminiVoiceName]
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
    [viewer]
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
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          onClickClose={() => setShowSettings(false)}
          onChangeGeminiApiKey={handleGeminiApiKeyChange}
          onChangeGeminiModel={handleGeminiModelChange}
          onChangeGeminiVoiceName={handleGeminiVoiceNameChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
        />
      )}
      {!showChatLog && (assistantMessage || isChatProcessing) && (
        <AssistantText
          message={assistantMessage || "Generating response..."}
          status={isChatProcessing ? "Generating response" : undefined}
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
