import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, Screenplay } from "@/features/messages/messages";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  DEFAULT_GEMINI_VOICE_NAME,
} from "@/features/chat/geminiLiveConfig";
import { getGeminiLiveChatResponse } from "@/features/chat/geminiLiveChat";
import {
  BUILT_IN_MOTIONS,
  BuiltInMotionId,
  DEFAULT_BUILT_IN_MOTION_ID,
  isBuiltInMotionId,
} from "@/features/vrmViewer/builtInMotions";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [geminiApiKey, setGeminiApiKey] = useState(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ""
  );
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_LIVE_MODEL);
  const [geminiVoiceName, setGeminiVoiceName] = useState(
    DEFAULT_GEMINI_VOICE_NAME
  );
  const [selectedMotionId, setSelectedMotionId] = useState<BuiltInMotionId>(
    DEFAULT_BUILT_IN_MOTION_ID
  );
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantStatus, setAssistantStatus] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setChatLog(params.chatLog ?? []);
      setGeminiModel(params.geminiModel ?? DEFAULT_GEMINI_LIVE_MODEL);
      setGeminiVoiceName(
        params.geminiVoiceName ?? DEFAULT_GEMINI_VOICE_NAME
      );
      if (
        typeof params.selectedMotionId === "string" &&
        isBuiltInMotionId(params.selectedMotionId)
      ) {
        setSelectedMotionId(params.selectedMotionId);
      }
    }
  }, []);

  useEffect(() => {
    const motion = BUILT_IN_MOTIONS[selectedMotionId];
    void viewer.setMotion(motion.path, motion.smoothingWindowSize);
  }, [selectedMotionId, viewer]);

  useEffect(() => {
    window.localStorage.setItem(
      "chatVRMParams",
      JSON.stringify({
        systemPrompt,
        chatLog,
        geminiModel,
        geminiVoiceName,
        selectedMotionId,
      })
    );
  }, [systemPrompt, chatLog, geminiModel, geminiVoiceName, selectedMotionId]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((value: Message, index) =>
        index === targetIndex ? { role: value.role, content: text } : value
      );

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleSendChat = useCallback(
    async (text: string) => {
      if (!geminiApiKey) {
        setAssistantMessage("Enter your Gemini API key first.");
        return;
      }

      if (text == null) {
        return;
      }

      setChatProcessing(true);
      setAssistantMessage("");
      setAssistantStatus("Connecting to Gemini Live...");

      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: text },
      ];
      setChatLog(messageLog);
      const screenplay = createNeutralScreenplay("");
      const activeModel = viewer.model;
      let hasStartedAudio = false;

      try {
        await activeModel?.beginStreamingSpeak(screenplay);

        const response = await getGeminiLiveChatResponse({
          apiKey: geminiApiKey,
          messages: messageLog,
          systemPrompt,
          model: geminiModel,
          voiceName: geminiVoiceName,
          onAudioChunk: (chunk) => {
            if (!hasStartedAudio) {
              hasStartedAudio = true;
              setAssistantStatus("Playing audio...");
            }
            activeModel?.appendPCMChunk(chunk.data, chunk.mimeType);
          },
          onPartialTranscript: (partialTranscript) => {
            if (!hasStartedAudio) {
              setAssistantStatus("Receiving response...");
            }
            setAssistantMessage(partialTranscript);
          },
        });

        const transcript =
          response.transcript.trim() || "Audio response received.";

        setAssistantMessage(transcript);
        setChatLog([
          ...messageLog,
          { role: "assistant", content: transcript },
        ]);

        await activeModel?.finishStreamingSpeak();
        setAssistantStatus("");
      } catch (error) {
        activeModel?.stopSpeaking();
        console.error(error);
        setAssistantStatus("Error");
        setAssistantMessage(
          error instanceof Error
            ? error.message
            : "Gemini Live request failed."
        );
      } finally {
        setChatProcessing(false);
      }
    },
    [
      chatLog,
      geminiApiKey,
      geminiModel,
      geminiVoiceName,
      systemPrompt,
      viewer.model,
    ]
  );

  return (
    <div className="font-M_PLUS_2">
      <Meta />
      <Introduction
        geminiApiKey={geminiApiKey}
        onChangeGeminiApiKey={setGeminiApiKey}
      />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        geminiApiKey={geminiApiKey}
        geminiModel={geminiModel}
        geminiVoiceName={geminiVoiceName}
        selectedMotionId={selectedMotionId}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        assistantMessage={assistantMessage}
        assistantStatus={assistantStatus}
        onChangeGeminiApiKey={setGeminiApiKey}
        onChangeGeminiModel={setGeminiModel}
        onChangeGeminiVoiceName={setGeminiVoiceName}
        onChangeMotion={setSelectedMotionId}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
      />
      <GitHubLink />
    </div>
  );
}

function createNeutralScreenplay(message: string): Screenplay {
  return {
    expression: "neutral",
    talk: {
      style: "talk",
      speakerX: DEFAULT_PARAM.speakerX,
      speakerY: DEFAULT_PARAM.speakerY,
      message,
    },
  };
}
