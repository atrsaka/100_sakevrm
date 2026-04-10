import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { BuiltInMotionId } from "@/features/vrmViewer/builtInMotions";
import { InteractionMode } from "@/features/podcast/podcastConfig";
import type { VoiceProvider } from "@/features/tts/elevenLabsConfig";
import type { DocumentContent } from "@/features/document/documentParser";

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
  assistantMessage: string;
  assistantStatus: string;
  assistantSpeakerName?: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeGeminiApiKey: (key: string) => void;
  onChangeGeminiModel: (model: string) => void;
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
  onChangeChatLog: (index: number, text: string) => void;
  handleClickResetChatLog: () => void;
  handleClickResetSystemPrompt: () => void;
  isDocumentMode: boolean;
  onChangeDocumentMode: (enabled: boolean) => void;
  documentContent: DocumentContent | null;
  onDocumentUpload: (file: File) => void;
  onDocumentClear: () => void;
  youtubeSection?: React.ReactNode;
};

export const Menu = ({
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
  assistantMessage,
  assistantStatus,
  assistantSpeakerName,
  onChangeSystemPrompt,
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
  onChangeChatLog,
  handleClickResetChatLog,
  handleClickResetSystemPrompt,
  isDocumentMode,
  onChangeDocumentMode,
  documentContent,
  onDocumentUpload,
  onDocumentClear,
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
            label="設定"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          />
          {showChatLog ? (
            <IconButton
              iconName="24/CommentOutline"
              label="会話ログ"
              isProcessing={false}
              onClick={() => setShowChatLog(false)}
            />
          ) : (
            <IconButton
              iconName="24/CommentFill"
              label="会話ログ"
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
          interactionMode={interactionMode}
          podcastTurnCount={podcastTurnCount}
          podcastYukitoVoiceName={podcastYukitoVoiceName}
          podcastKiyokaVoiceName={podcastKiyokaVoiceName}
          selectedMotionId={selectedMotionId}
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          onClickClose={() => setShowSettings(false)}
          onChangeGeminiApiKey={handleGeminiApiKeyChange}
          onChangeGeminiModel={handleGeminiModelChange}
          onChangeGeminiVoiceName={handleGeminiVoiceNameChange}
          onChangeInteractionMode={onChangeInteractionMode}
          onChangePodcastTurnCount={onChangePodcastTurnCount}
          onChangePodcastYukitoVoiceName={onChangePodcastYukitoVoiceName}
          onChangePodcastKiyokaVoiceName={onChangePodcastKiyokaVoiceName}
          podcastYukitoVrmLoaded={podcastYukitoVrmLoaded}
          podcastKiyokaVrmLoaded={podcastKiyokaVrmLoaded}
          onLoadPodcastYukitoVrm={onLoadPodcastYukitoVrm}
          onLoadPodcastKiyokaVrm={onLoadPodcastKiyokaVrm}
          onResetPodcastYukitoVrm={onResetPodcastYukitoVrm}
          onResetPodcastKiyokaVrm={onResetPodcastKiyokaVrm}
          voiceProvider={voiceProvider}
          onChangeVoiceProvider={onChangeVoiceProvider}
          elevenLabsApiKey={elevenLabsApiKey}
          onChangeElevenLabsApiKey={onChangeElevenLabsApiKey}
          elevenLabsAgentId={elevenLabsAgentId}
          onChangeElevenLabsAgentId={onChangeElevenLabsAgentId}
          elevenLabsVoiceId={elevenLabsVoiceId}
          onChangeElevenLabsVoiceId={onChangeElevenLabsVoiceId}
          elevenLabsPodcastYukitoVoiceId={elevenLabsPodcastYukitoVoiceId}
          onChangeElevenLabsPodcastYukitoVoiceId={onChangeElevenLabsPodcastYukitoVoiceId}
          elevenLabsPodcastKiyokaVoiceId={elevenLabsPodcastKiyokaVoiceId}
          onChangeElevenLabsPodcastKiyokaVoiceId={onChangeElevenLabsPodcastKiyokaVoiceId}
          onChangeMotion={onChangeMotion}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
          isDocumentMode={isDocumentMode}
          onChangeDocumentMode={onChangeDocumentMode}
          documentContent={documentContent}
          onDocumentUpload={onDocumentUpload}
          onDocumentClear={onDocumentClear}
          youtubeSection={youtubeSection}
        />
      )}
      {!showChatLog && (assistantMessage || assistantStatus) && (
        <AssistantText
          message={assistantMessage || assistantStatus}
          status={assistantStatus || undefined}
          speakerName={assistantSpeakerName}
          interactionMode={interactionMode}
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
