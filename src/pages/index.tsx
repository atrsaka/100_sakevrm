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
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

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
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "chatVRMParams",
      JSON.stringify({
        systemPrompt,
        chatLog,
        geminiModel,
        geminiVoiceName,
      })
    );
  }, [systemPrompt, chatLog, geminiModel, geminiVoiceName]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((value: Message, index) =>
        index === targetIndex ? { role: value.role, content: text } : value
      );

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleSpeakAi = useCallback(
    async (screenplay: Screenplay, audioBuffer: ArrayBuffer) => {
      await viewer.model?.speak(audioBuffer, screenplay);
    },
    [viewer]
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

      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: text },
      ];
      setChatLog(messageLog);

      try {
        const { getGeminiLiveChatResponse } = await import(
          "@/features/chat/geminiLiveChat"
        );

        const response = await getGeminiLiveChatResponse({
          apiKey: geminiApiKey,
          messages: messageLog,
          systemPrompt,
          model: geminiModel,
          voiceName: geminiVoiceName,
          onPartialTranscript: (partialTranscript) => {
            setAssistantMessage(partialTranscript);
          },
        });

        const transcript =
          response.transcript.trim() || "Audio response received.";
        const screenplay = createNeutralScreenplay(transcript);

        setAssistantMessage(transcript);
        setChatLog([
          ...messageLog,
          { role: "assistant", content: transcript },
        ]);

        await handleSpeakAi(screenplay, response.audioBuffer);
      } catch (error) {
        console.error(error);
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
      handleSpeakAi,
      systemPrompt,
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
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        assistantMessage={assistantMessage}
        isChatProcessing={chatProcessing}
        onChangeGeminiApiKey={setGeminiApiKey}
        onChangeGeminiModel={setGeminiModel}
        onChangeGeminiVoiceName={setGeminiVoiceName}
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
