import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback, useRef } from "react";

type Props = {
  isChatProcessing: boolean;
  placeholder?: string;
  onChatProcessStart: (text: string) => void;
};

type BrowserSpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type BrowserSpeechRecognition = EventTarget & {
  abort: () => void;
  start: () => void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  addEventListener: (
    type: "result" | "end",
    listener: EventListenerOrEventListenerObject
  ) => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  placeholder,
  onChatProcessStart,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<BrowserSpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);
  const hasMountedRef = useRef(false);

  // 音声認識の結果を処理する
  const handleRecognitionResult = useCallback(
    (event: Event) => {
      const recognitionEvent = event as BrowserSpeechRecognitionEvent;
      const text = recognitionEvent.results[0][0].transcript;
      setUserMessage(text);

      // 発言の終了時
      if (recognitionEvent.results[0].isFinal) {
        setUserMessage(text);
        // 返答文の生成を開始
        onChatProcessStart(text);
      }
    },
    [onChatProcessStart]
  );

  // 無音が続いた場合も終了する
  const handleRecognitionEnd = useCallback(() => {
    setIsMicRecording(false);
  }, []);

  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition =
      speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;

    // FirefoxなどSpeechRecognition非対応環境対策
    if (!Recognition) {
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true; // 認識の途中結果を返す
    recognition.continuous = false; // 発言の終了時に認識を終了する

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing}
      isMicRecording={isMicRecording}
      placeholder={placeholder}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
