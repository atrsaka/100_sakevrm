import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
  type YoutubeAuthState,
  type YoutubeBroadcastLoadState,
  type YoutubeBroadcastSummary as DeckYoutubeBroadcastSummary,
  type YoutubeIncomingComment,
  type YoutubeLiveReceiveState,
  type YoutubeBroadcastState,
  YoutubeLiveControlDeck,
} from "@/components/youtubeLiveControlDeck";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  DEFAULT_GEMINI_VOICE_NAME,
} from "@/features/chat/geminiLiveConfig";
import { getGeminiLiveChatResponse } from "@/features/chat/geminiLiveChat";
import {
  listLiveBroadcasts,
  listLiveChatMessages,
  requestYouTubeAccessToken,
  userFacingMessage,
  YouTubeLiveError,
  type YouTubeAuthToken,
  type YouTubeBroadcastSummary,
  type YouTubeLiveChatMessage,
} from "@/features/youtube";
import {
  BUILT_IN_MOTIONS,
  BuiltInMotionId,
  DEFAULT_BUILT_IN_MOTION_ID,
  isBuiltInMotionId,
} from "@/features/vrmViewer/builtInMotions";

const MAX_YOUTUBE_PREVIEW_COMMENTS = 12;
const MAX_YOUTUBE_PENDING_COMMENTS = 20;
const MAX_YOUTUBE_SEEN_IDS = 400;
const MIN_YOUTUBE_POLL_INTERVAL_MS = 3000;
const FALLBACK_YOUTUBE_POLL_INTERVAL_MS = 5000;
const ERROR_YOUTUBE_POLL_INTERVAL_MS = 10000;
const YOUTUBE_COMMENT_FRESHNESS_MS = 10 * 60 * 1000;
const YOUTUBE_RELAY_PRIME_GRACE_MS = 5000;
const CHAT_VRM_PARAMS_STORAGE_KEY = "chatVRMParams";
const YOUTUBE_AUTH_SESSION_STORAGE_KEY = "youtubeAuthSessionV1";
const YOUTUBE_AUTH_SESSION_LEEWAY_MS = 30000;

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [geminiApiKey, setGeminiApiKey] = useState(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "",
  );
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_LIVE_MODEL);
  const [geminiVoiceName, setGeminiVoiceName] = useState(
    DEFAULT_GEMINI_VOICE_NAME,
  );
  const [selectedMotionId, setSelectedMotionId] = useState<BuiltInMotionId>(
    DEFAULT_BUILT_IN_MOTION_ID,
  );
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantStatus, setAssistantStatus] = useState("");

  const [youtubeClientId, setYoutubeClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  );
  const [youtubeAuthState, setYoutubeAuthState] =
    useState<YoutubeAuthState>("idle");
  const [youtubeAuthError, setYoutubeAuthError] = useState("");
  const [youtubeAuthToken, setYoutubeAuthToken] =
    useState<YouTubeAuthToken | null>(null);
  const [youtubeBroadcastLoadState, setYoutubeBroadcastLoadState] =
    useState<YoutubeBroadcastLoadState>("idle");
  const [youtubeBroadcastError, setYoutubeBroadcastError] = useState("");
  const [youtubeBroadcasts, setYoutubeBroadcasts] = useState<
    YouTubeBroadcastSummary[]
  >([]);
  const [selectedYoutubeBroadcastId, setSelectedYoutubeBroadcastId] =
    useState("");
  const [isYoutubeRelayMode, setIsYoutubeRelayMode] = useState(false);
  const [isYoutubeAutoReplyEnabled, setIsYoutubeAutoReplyEnabled] =
    useState(true);
  const [youtubeReceiveState, setYoutubeReceiveState] =
    useState<YoutubeLiveReceiveState>("idle");
  const [youtubeReceiveError, setYoutubeReceiveError] = useState("");
  const [youtubeIncomingComments, setYoutubeIncomingComments] = useState<
    YoutubeIncomingComment[]
  >([]);
  const [youtubePendingComments, setYoutubePendingComments] = useState<
    YouTubeLiveChatMessage[]
  >([]);

  const chatLogRef = useRef<Message[]>([]);
  const youtubeSeenCommentIdsRef = useRef<Set<string>>(new Set());
  const youtubePollPageTokenRef = useRef<string | null>(null);
  const youtubeRelayPrimedRef = useRef(false);
  const youtubeRelayStartedAtRef = useRef<number>(0);
  const youtubeAutoReplyInFlightRef = useRef(false);
  const isYoutubeAutoReplyEnabledRef = useRef(isYoutubeAutoReplyEnabled);
  const restoredYoutubeAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    chatLogRef.current = chatLog;
  }, [chatLog]);

  useEffect(() => {
    isYoutubeAutoReplyEnabledRef.current = isYoutubeAutoReplyEnabled;
  }, [isYoutubeAutoReplyEnabled]);

  useEffect(() => {
    const rawChatParams = window.localStorage.getItem(
      CHAT_VRM_PARAMS_STORAGE_KEY,
    );
    const defaultYoutubeClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    let restoredYoutubeClientId = defaultYoutubeClientId;
    let restoredRelayMode = false;

    if (rawChatParams) {
      try {
        const params = JSON.parse(rawChatParams);
        setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
        setChatLog(params.chatLog ?? []);
        setGeminiModel(params.geminiModel ?? DEFAULT_GEMINI_LIVE_MODEL);
        setGeminiVoiceName(params.geminiVoiceName ?? DEFAULT_GEMINI_VOICE_NAME);
        if (
          typeof params.selectedMotionId === "string" &&
          isBuiltInMotionId(params.selectedMotionId)
        ) {
          setSelectedMotionId(params.selectedMotionId);
        }
        if (typeof params.youtubeClientId === "string") {
          restoredYoutubeClientId = params.youtubeClientId;
        }
        setSelectedYoutubeBroadcastId(params.selectedYoutubeBroadcastId ?? "");
        restoredRelayMode = Boolean(
          params.isYoutubeRelayMode ?? params.isYoutubeBroadcastMode ?? false,
        );
        setIsYoutubeAutoReplyEnabled(
          Boolean(params.isYoutubeAutoReplyEnabled ?? true),
        );
      } catch {
        window.localStorage.removeItem(CHAT_VRM_PARAMS_STORAGE_KEY);
      }
    }

    setYoutubeClientId(restoredYoutubeClientId);

    const rawYoutubeAuthSession = window.localStorage.getItem(
      YOUTUBE_AUTH_SESSION_STORAGE_KEY,
    );
    if (!rawYoutubeAuthSession) {
      setIsYoutubeRelayMode(false);
      return;
    }

    const restoredAuthSession = parseYoutubeAuthSession(rawYoutubeAuthSession);
    if (!restoredAuthSession) {
      window.localStorage.removeItem(YOUTUBE_AUTH_SESSION_STORAGE_KEY);
      setIsYoutubeRelayMode(false);
      return;
    }

    if (!isYoutubeAuthTokenUsable(restoredAuthSession.token)) {
      window.localStorage.removeItem(YOUTUBE_AUTH_SESSION_STORAGE_KEY);
      setIsYoutubeRelayMode(false);
      return;
    }

    setYoutubeClientId(restoredAuthSession.clientId);
    setYoutubeAuthToken(restoredAuthSession.token);
    setYoutubeAuthState("authenticated");
    setYoutubeAuthError("");
    setIsYoutubeRelayMode(restoredRelayMode);
    restoredYoutubeAccessTokenRef.current =
      restoredAuthSession.token.accessToken;
  }, []);

  useEffect(() => {
    if (
      isYoutubeAuthUsable(youtubeAuthToken) &&
      youtubeClientId &&
      youtubeAuthState === "authenticated"
    ) {
      saveYoutubeAuthSession({
        clientId: youtubeClientId,
        token: youtubeAuthToken,
      });
      return;
    }

    clearYoutubeAuthSession();
  }, [youtubeAuthState, youtubeAuthToken, youtubeClientId]);

  useEffect(() => {
    const motion = BUILT_IN_MOTIONS[selectedMotionId];
    void viewer.setMotion(motion.path, motion.smoothingWindowSize);
  }, [selectedMotionId, viewer]);

  useEffect(() => {
    window.localStorage.setItem(
      CHAT_VRM_PARAMS_STORAGE_KEY,
      JSON.stringify({
        systemPrompt,
        chatLog,
        geminiModel,
        geminiVoiceName,
        selectedMotionId,
        youtubeClientId,
        selectedYoutubeBroadcastId,
        isYoutubeRelayMode,
        isYoutubeAutoReplyEnabled,
      }),
    );
  }, [
    systemPrompt,
    chatLog,
    geminiModel,
    geminiVoiceName,
    selectedMotionId,
    youtubeClientId,
    selectedYoutubeBroadcastId,
    isYoutubeRelayMode,
    isYoutubeAutoReplyEnabled,
  ]);

  useEffect(() => {
    if (youtubeBroadcasts.length === 0) {
      if (selectedYoutubeBroadcastId) {
        setSelectedYoutubeBroadcastId("");
      }
      return;
    }

    const hasSelectedBroadcast = youtubeBroadcasts.some(
      (broadcast) => broadcast.id === selectedYoutubeBroadcastId,
    );

    if (!hasSelectedBroadcast) {
      setSelectedYoutubeBroadcastId(
        youtubeBroadcasts.find((broadcast) => broadcast.liveChatId)?.id ??
          youtubeBroadcasts[0].id,
      );
    }
  }, [selectedYoutubeBroadcastId, youtubeBroadcasts]);

  useEffect(() => {
    if (isYoutubeAutoReplyEnabled) {
      return;
    }

    setYoutubePendingComments([]);
  }, [isYoutubeAutoReplyEnabled]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      setChatLog((currentChatLog) =>
        currentChatLog.map((value: Message, index) =>
          index === targetIndex ? updateEditableMessage(value, text) : value,
        ),
      );
    },
    [],
  );

  const startChatTurn = useCallback(
    async (nextUserMessage: Message) => {
      const trimmedContent = nextUserMessage.content.trim();
      if (!trimmedContent) {
        return false;
      }

      if (!geminiApiKey) {
        setAssistantMessage("Enter your Gemini API key first.");
        return false;
      }

      const preparedUserMessage = {
        ...nextUserMessage,
        content: trimmedContent,
      };

      setChatProcessing(true);
      setAssistantMessage("");
      setAssistantStatus("Connecting to Gemini Live...");

      const messageLog: Message[] = [
        ...chatLogRef.current,
        preparedUserMessage,
      ];
      chatLogRef.current = messageLog;
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
        const updatedChatLog = [
          ...messageLog,
          {
            role: "assistant" as const,
            content: transcript,
            source: "assistant" as const,
            name: "CHARACTER",
          },
        ];

        chatLogRef.current = updatedChatLog;
        setAssistantMessage(transcript);
        setChatLog(updatedChatLog);

        await activeModel?.finishStreamingSpeak();
        setAssistantStatus("");
        return true;
      } catch (error) {
        activeModel?.stopSpeaking();
        console.error(error);
        setAssistantStatus("Error");
        setAssistantMessage(
          error instanceof Error
            ? error.message
            : "Gemini Live request failed.",
        );
        return false;
      } finally {
        setChatProcessing(false);
      }
    },
    [geminiApiKey, geminiModel, geminiVoiceName, systemPrompt, viewer.model],
  );

  const handleSendChat = useCallback(
    async (text: string) => {
      if (text == null || !text.trim()) {
        return;
      }

      await startChatTurn({
        role: "user",
        content: text,
        source: "manual",
        name: "YOU",
      });
    },
    [startChatTurn],
  );

  const resetYoutubeSession = useCallback((message: string) => {
    clearYoutubeAuthSession();
    setYoutubeAuthToken(null);
    setYoutubeAuthState("error");
    setYoutubeAuthError(message);
    setYoutubeBroadcasts([]);
    setYoutubeBroadcastLoadState("error");
    setYoutubeBroadcastError(message);
    setIsYoutubeRelayMode(false);
    setYoutubeReceiveState("error");
    setYoutubeReceiveError(message);
    setYoutubeIncomingComments([]);
    setYoutubePendingComments([]);
    youtubeSeenCommentIdsRef.current.clear();
    youtubePollPageTokenRef.current = null;
    youtubeRelayPrimedRef.current = false;
  }, []);

  const getFreshYoutubeAccessToken = useCallback(
    (accessTokenOverride?: string) => {
      if (accessTokenOverride) {
        return accessTokenOverride;
      }

      if (isYoutubeAuthUsable(youtubeAuthToken)) {
        return youtubeAuthToken.accessToken;
      }

      const expiredMessage =
        "YouTube sign-in expired. Sign in with Google again.";
      if (youtubeAuthToken) {
        resetYoutubeSession(expiredMessage);
      } else {
        setYoutubeAuthError(expiredMessage);
      }
      return "";
    },
    [resetYoutubeSession, youtubeAuthToken],
  );

  const refreshYoutubeBroadcasts = useCallback(
    async (accessTokenOverride?: string) => {
      const accessToken = getFreshYoutubeAccessToken(accessTokenOverride);

      if (!accessToken) {
        setYoutubeBroadcastLoadState("error");
        setYoutubeBroadcastError(
          "Connect Google first to load your active or upcoming broadcasts.",
        );
        return;
      }

      setYoutubeBroadcastLoadState("loading");
      setYoutubeBroadcastError("");

      try {
        const result = await listLiveBroadcasts({
          accessToken,
          includeActive: true,
          includeUpcoming: true,
        });

        const sortedBroadcasts = [...result.broadcasts].sort(
          compareYoutubeBroadcasts,
        );

        setYoutubeBroadcasts(sortedBroadcasts);
        setYoutubeBroadcastLoadState("ready");
      } catch (error) {
        if (isYoutubeAuthRejectedError(error)) {
          resetYoutubeSession(
            "YouTube sign-in expired or was revoked. Sign in with Google again.",
          );
          return;
        }

        setYoutubeBroadcastLoadState("error");
        setYoutubeBroadcastError(userFacingMessage(error));
      }
    },
    [getFreshYoutubeAccessToken, resetYoutubeSession],
  );

  const handleSignInToYoutube = useCallback(async () => {
    setYoutubeAuthState("connecting");
    setYoutubeAuthError("");
    setYoutubeBroadcastError("");
    setYoutubeReceiveError("");

    try {
      const nextAuthState = await requestYouTubeAccessToken({
        clientId: youtubeClientId.trim(),
      });

      if (!nextAuthState.token) {
        throw new Error("YouTube sign-in did not return an access token.");
      }

      setYoutubeClientId(nextAuthState.clientId);
      setYoutubeAuthToken(nextAuthState.token);
      setYoutubeAuthState("authenticated");
      saveYoutubeAuthSession({
        clientId: nextAuthState.clientId,
        token: nextAuthState.token,
      });

      await refreshYoutubeBroadcasts(nextAuthState.token.accessToken);
    } catch (error) {
      clearYoutubeAuthSession();
      setYoutubeAuthToken(null);
      setYoutubeAuthState("error");
      setYoutubeAuthError(userFacingMessage(error));
    }
  }, [refreshYoutubeBroadcasts, youtubeClientId]);

  const handleSignOutFromYoutube = useCallback(() => {
    clearYoutubeAuthSession();
    setYoutubeAuthToken(null);
    setYoutubeAuthState("idle");
    setYoutubeAuthError("");
    setYoutubeBroadcastLoadState("idle");
    setYoutubeBroadcastError("");
    setYoutubeBroadcasts([]);
    setSelectedYoutubeBroadcastId("");
    setIsYoutubeRelayMode(false);
    setIsYoutubeAutoReplyEnabled(true);
    setYoutubeReceiveState("idle");
    setYoutubeReceiveError("");
    setYoutubeIncomingComments([]);
    setYoutubePendingComments([]);
    youtubeSeenCommentIdsRef.current.clear();
    youtubePollPageTokenRef.current = null;
    youtubeRelayPrimedRef.current = false;
  }, []);

  const handleRefreshYoutubeBroadcasts = useCallback(() => {
    void refreshYoutubeBroadcasts();
  }, [refreshYoutubeBroadcasts]);

  useEffect(() => {
    const restoredAccessToken = restoredYoutubeAccessTokenRef.current;
    if (!restoredAccessToken) {
      return;
    }

    restoredYoutubeAccessTokenRef.current = null;
    void refreshYoutubeBroadcasts(restoredAccessToken);
  }, [refreshYoutubeBroadcasts]);

  const handleSelectYoutubeBroadcast = useCallback(
    (broadcast: { id: string }) => {
      setSelectedYoutubeBroadcastId(broadcast.id);
      setYoutubeReceiveError("");
    },
    [],
  );

  const selectedYoutubeBroadcast = youtubeBroadcasts.find(
    (broadcast) => broadcast.id === selectedYoutubeBroadcastId,
  );

  useEffect(() => {
    youtubeAutoReplyInFlightRef.current = false;

    if (
      youtubeAuthState !== "authenticated" ||
      !isYoutubeRelayMode ||
      !selectedYoutubeBroadcast?.liveChatId
    ) {
      setYoutubeReceiveState("idle");
      if (!isYoutubeRelayMode) {
        setYoutubeReceiveError("");
      }
      setYoutubePendingComments([]);
      youtubeSeenCommentIdsRef.current.clear();
      youtubePollPageTokenRef.current = null;
      youtubeRelayPrimedRef.current = false;
      return;
    }

    let isCancelled = false;
    let timeoutId: number | undefined;

    youtubeSeenCommentIdsRef.current.clear();
    youtubePollPageTokenRef.current = null;
    youtubeRelayPrimedRef.current = false;
    youtubeRelayStartedAtRef.current = Date.now();
    setYoutubeIncomingComments([]);
    setYoutubePendingComments([]);
    setYoutubeReceiveState("idle");
    setYoutubeReceiveError("");

    const schedulePoll = (delayMs: number) => {
      if (isCancelled) {
        return;
      }

      timeoutId = window.setTimeout(
        pollLiveComments,
        Math.max(delayMs, MIN_YOUTUBE_POLL_INTERVAL_MS),
      );
    };

    const pollLiveComments = async () => {
      const accessToken = getFreshYoutubeAccessToken();
      if (!accessToken) {
        if (!isCancelled) {
          setYoutubeReceiveState("error");
          setYoutubeReceiveError(
            "YouTube sign-in expired. Sign in with Google again.",
          );
        }
        return;
      }

      try {
        const response = await listLiveChatMessages({
          accessToken,
          liveChatId: selectedYoutubeBroadcast.liveChatId ?? "",
          pageToken: youtubePollPageTokenRef.current,
        });

        if (isCancelled) {
          return;
        }

        youtubePollPageTokenRef.current = response.nextPageToken;
        const relayCandidates = response.messages
          .filter((message) =>
            isRelayCandidateMessage(
              message,
              selectedYoutubeBroadcast.channelId,
            ),
          )
          .sort(compareYouTubeLiveChatMessages);

        setYoutubeReceiveState("listening");
        setYoutubeReceiveError("");

        if (!youtubeRelayPrimedRef.current) {
          youtubeRelayPrimedRef.current = true;
          const relayStartedAt = youtubeRelayStartedAtRef.current;
          const commentsAfterRelayEnabled = relayCandidates.filter((message) =>
            isCommentNewSinceRelayEnabled(message.publishedAt, relayStartedAt),
          );
          relayCandidates.forEach((message) =>
            rememberYouTubeCommentId(
              youtubeSeenCommentIdsRef.current,
              message.id,
            ),
          );
          setYoutubeIncomingComments(
            mergeIncomingComments(
              relayCandidates.map(toYoutubeIncomingComment),
              [],
            ),
          );

          if (
            commentsAfterRelayEnabled.length > 0 &&
            isYoutubeAutoReplyEnabledRef.current
          ) {
            setYoutubePendingComments((currentQueue) =>
              enqueueYouTubeComments(currentQueue, commentsAfterRelayEnabled),
            );
          }
        } else {
          const newMessages = relayCandidates.filter((message) => {
            if (youtubeSeenCommentIdsRef.current.has(message.id)) {
              return false;
            }

            rememberYouTubeCommentId(
              youtubeSeenCommentIdsRef.current,
              message.id,
            );
            return isFreshYouTubeComment(message.publishedAt);
          });

          if (newMessages.length > 0) {
            setYoutubeIncomingComments((currentComments) =>
              mergeIncomingComments(
                newMessages.map(toYoutubeIncomingComment),
                currentComments,
              ),
            );

            if (isYoutubeAutoReplyEnabledRef.current) {
              setYoutubePendingComments((currentQueue) =>
                enqueueYouTubeComments(currentQueue, newMessages),
              );
            }
          }
        }

        schedulePoll(
          response.pollingIntervalMillis || FALLBACK_YOUTUBE_POLL_INTERVAL_MS,
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isYoutubeAuthRejectedError(error)) {
          resetYoutubeSession(
            "YouTube sign-in expired or was revoked. Sign in with Google again.",
          );
          return;
        }

        setYoutubeReceiveState("error");
        setYoutubeReceiveError(userFacingMessage(error));
        schedulePoll(ERROR_YOUTUBE_POLL_INTERVAL_MS);
      }
    };

    void pollLiveComments();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    getFreshYoutubeAccessToken,
    isYoutubeRelayMode,
    resetYoutubeSession,
    selectedYoutubeBroadcast?.channelId,
    selectedYoutubeBroadcast?.id,
    selectedYoutubeBroadcast?.liveChatId,
    youtubeAuthState,
  ]);

  useEffect(() => {
    if (
      !isYoutubeAutoReplyEnabled ||
      chatProcessing ||
      youtubeAutoReplyInFlightRef.current ||
      youtubePendingComments.length === 0
    ) {
      return;
    }

    const nextComment = youtubePendingComments[0];
    youtubeAutoReplyInFlightRef.current = true;

    void startChatTurn(createYouTubeRelayMessage(nextComment)).finally(() => {
      youtubeAutoReplyInFlightRef.current = false;
      setYoutubePendingComments((currentQueue) => currentQueue.slice(1));
    });
  }, [
    chatProcessing,
    isYoutubeAutoReplyEnabled,
    startChatTurn,
    youtubePendingComments,
  ]);

  return (
    <div className="relative min-h-[100svh] font-M_PLUS_2">
      <Meta />
      {isYoutubeRelayMode ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-16">
          <div
            className={`rounded-full border border-white/60 px-16 py-8 text-xs font-bold uppercase tracking-[0.24em] shadow-lg backdrop-blur ${
              youtubeReceiveState === "listening"
                ? "bg-emerald-500/90 text-white"
                : youtubeReceiveState === "error"
                  ? "bg-rose-500/90 text-white"
                  : "bg-white/80 text-[#6a466f]"
            }`}
            role="status"
            aria-live="polite"
          >
            {selectedYoutubeBroadcast
              ? `YouTube Relay - ${selectedYoutubeBroadcast.title}`
              : "YouTube Relay - Waiting for broadcast"}
          </div>
        </div>
      ) : null}
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
        youtubeSection={
          <YoutubeLiveControlDeck
            googleClientId={youtubeClientId}
            onGoogleClientIdChange={setYoutubeClientId}
            authState={youtubeAuthState}
            authError={youtubeAuthError}
            onSignIn={handleSignInToYoutube}
            onSignOut={handleSignOutFromYoutube}
            broadcastLoadState={youtubeBroadcastLoadState}
            broadcastError={youtubeBroadcastError}
            broadcasts={youtubeBroadcasts.map(toDeckYoutubeBroadcastSummary)}
            selectedBroadcastId={selectedYoutubeBroadcastId}
            onSelectBroadcast={(broadcast) =>
              handleSelectYoutubeBroadcast(broadcast)
            }
            onRefreshBroadcasts={handleRefreshYoutubeBroadcasts}
            isRelayModeEnabled={isYoutubeRelayMode}
            onToggleRelayMode={setIsYoutubeRelayMode}
            isAutoReplyEnabled={isYoutubeAutoReplyEnabled}
            onToggleAutoReply={setIsYoutubeAutoReplyEnabled}
            receiveState={youtubeReceiveState}
            receiveError={youtubeReceiveError}
            incomingComments={youtubeIncomingComments}
            onOpenStreamingHint={() =>
              window.open(
                "https://studio.youtube.com/",
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
        }
      />
      <GitHubLink />
    </div>
  );
}

type YoutubeAuthSession = {
  clientId: string;
  token: YouTubeAuthToken;
};

function isYoutubeAuthUsable(
  token: YouTubeAuthToken | null,
): token is YouTubeAuthToken {
  return (
    !!token &&
    typeof token.accessToken === "string" &&
    token.accessToken.length > 0 &&
    typeof token.tokenType === "string" &&
    token.tokenType.length > 0 &&
    typeof token.scope === "string" &&
    token.scope.length > 0 &&
    typeof token.expiresAt === "number" &&
    Number.isFinite(token.expiresAt) &&
    token.expiresAt > Date.now() + YOUTUBE_AUTH_SESSION_LEEWAY_MS
  );
}

function isYoutubeAuthTokenUsable(token: YouTubeAuthToken): boolean {
  return (
    !!token &&
    typeof token.expiresAt === "number" &&
    Number.isFinite(token.expiresAt) &&
    token.expiresAt > Date.now() + YOUTUBE_AUTH_SESSION_LEEWAY_MS
  );
}

function isYoutubeAuthSessionValid(
  session: unknown,
): session is YoutubeAuthSession {
  if (!session || typeof session !== "object") {
    return false;
  }

  const candidate = session as {
    clientId?: unknown;
    token?: unknown;
  };

  if (
    typeof candidate.clientId !== "string" ||
    candidate.clientId.length <= 0
  ) {
    return false;
  }

  return isYoutubeAuthUsable(candidate.token as YouTubeAuthToken);
}

function parseYoutubeAuthSession(raw: string): YoutubeAuthSession | null {
  try {
    const session = JSON.parse(raw);
    return isYoutubeAuthSessionValid(session) ? session : null;
  } catch {
    return null;
  }
}

function saveYoutubeAuthSession(session: YoutubeAuthSession): void {
  window.localStorage.setItem(
    YOUTUBE_AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

function clearYoutubeAuthSession(): void {
  window.localStorage.removeItem(YOUTUBE_AUTH_SESSION_STORAGE_KEY);
}

function isYoutubeAuthRejectedError(error: unknown) {
  return (
    error instanceof YouTubeLiveError &&
    (error.code === "YOUTUBE_API_AUTH_ERROR" || error.httpStatus === 401)
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

function compareYoutubeBroadcasts(
  left: YouTubeBroadcastSummary,
  right: YouTubeBroadcastSummary,
) {
  const rankDifference =
    getYoutubeBroadcastRank(left.lifecycleStatus) -
    getYoutubeBroadcastRank(right.lifecycleStatus);

  if (rankDifference !== 0) {
    return rankDifference;
  }

  const leftTime = Date.parse(
    left.scheduledStartTime ?? left.actualStartTime ?? "",
  );
  const rightTime = Date.parse(
    right.scheduledStartTime ?? right.actualStartTime ?? "",
  );

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return left.title.localeCompare(right.title);
  }

  return leftTime - rightTime;
}

function getYoutubeBroadcastRank(lifecycleStatus: string | null) {
  switch (lifecycleStatus) {
    case "live":
    case "liveStarting":
    case "testing":
      return 0;
    case "ready":
    case "created":
    case "testStarting":
      return 1;
    case "complete":
    case "revoked":
      return 2;
    default:
      return 3;
  }
}

function compareYouTubeLiveChatMessages(
  left: YouTubeLiveChatMessage,
  right: YouTubeLiveChatMessage,
) {
  const leftTime = Date.parse(left.publishedAt);
  const rightTime = Date.parse(right.publishedAt);

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return left.id.localeCompare(right.id);
  }

  return leftTime - rightTime;
}

function toDeckYoutubeBroadcastSummary(
  broadcast: YouTubeBroadcastSummary,
): DeckYoutubeBroadcastSummary {
  return {
    id: broadcast.id,
    title: broadcast.title,
    state: getDeckYoutubeBroadcastState(broadcast.lifecycleStatus),
    liveChatId: broadcast.liveChatId,
    scheduledStartTime: formatYoutubeDate(
      broadcast.scheduledStartTime ?? broadcast.actualStartTime,
    ),
    viewerCount: undefined,
  };
}

function getDeckYoutubeBroadcastState(
  lifecycleStatus: string | null,
): YoutubeBroadcastState {
  switch (lifecycleStatus) {
    case "live":
    case "liveStarting":
    case "testing":
      return "active";
    case "ready":
    case "created":
    case "testStarting":
      return "upcoming";
    case "complete":
    case "revoked":
      return "completed";
    default:
      return "unknown";
  }
}

function formatYoutubeDate(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function isRelayCandidateMessage(
  message: YouTubeLiveChatMessage,
  broadcasterChannelId: string | null | undefined,
) {
  if (!message.text.trim()) {
    return false;
  }

  if (message.messageType && message.messageType !== "textMessageEvent") {
    return false;
  }

  if (
    broadcasterChannelId &&
    message.authorChannelId === broadcasterChannelId
  ) {
    return false;
  }

  return true;
}

function isFreshYouTubeComment(publishedAt: string) {
  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp <= YOUTUBE_COMMENT_FRESHNESS_MS;
}

function isCommentNewSinceRelayEnabled(
  publishedAt: string,
  relayStartedAt: number,
) {
  const publishedTimestamp = Date.parse(publishedAt);
  if (Number.isNaN(publishedTimestamp)) {
    return false;
  }

  return publishedTimestamp >= relayStartedAt - YOUTUBE_RELAY_PRIME_GRACE_MS;
}

function rememberYouTubeCommentId(seenIds: Set<string>, id: string) {
  seenIds.add(id);

  if (seenIds.size <= MAX_YOUTUBE_SEEN_IDS) {
    return;
  }

  const recentIds = Array.from(seenIds).slice(
    -Math.floor(MAX_YOUTUBE_SEEN_IDS / 2),
  );
  seenIds.clear();
  recentIds.forEach((recentId) => seenIds.add(recentId));
}

function mergeIncomingComments(
  nextComments: YoutubeIncomingComment[],
  currentComments: YoutubeIncomingComment[],
) {
  const commentMap = new Map<string, YoutubeIncomingComment>();

  [...nextComments, ...currentComments].forEach((comment) => {
    if (!commentMap.has(comment.id)) {
      commentMap.set(comment.id, comment);
    }
  });

  return Array.from(commentMap.values())
    .sort(
      (left, right) =>
        Date.parse(right.receivedAt || "") - Date.parse(left.receivedAt || ""),
    )
    .slice(0, MAX_YOUTUBE_PREVIEW_COMMENTS);
}

function enqueueYouTubeComments(
  currentQueue: YouTubeLiveChatMessage[],
  nextMessages: YouTubeLiveChatMessage[],
) {
  const queueMap = new Map<string, YouTubeLiveChatMessage>();

  [...currentQueue, ...nextMessages].forEach((message) => {
    if (!queueMap.has(message.id)) {
      queueMap.set(message.id, message);
    }
  });

  return Array.from(queueMap.values())
    .sort(compareYouTubeLiveChatMessages)
    .slice(-MAX_YOUTUBE_PENDING_COMMENTS);
}

function toYoutubeIncomingComment(
  message: YouTubeLiveChatMessage,
): YoutubeIncomingComment {
  return {
    id: message.id,
    author: message.authorDisplayName,
    comment: message.text,
    receivedAt: message.publishedAt,
  };
}

function createYouTubeRelayMessage(message: YouTubeLiveChatMessage): Message {
  return {
    role: "user",
    content: buildYouTubeRelayPrompt(message.authorDisplayName, message.text),
    displayContent: message.text,
    name: message.authorDisplayName,
    source: "youtube",
    externalId: message.id,
    receivedAt: message.publishedAt,
  };
}

function buildYouTubeRelayPrompt(author: string, text: string) {
  return `YouTube live chat comment from ${author}: ${text}`;
}

function updateEditableMessage(message: Message, nextText: string): Message {
  if (message.source === "youtube") {
    return {
      ...message,
      content: buildYouTubeRelayPrompt(message.name ?? "Viewer", nextText),
      displayContent: nextText,
    };
  }

  return {
    ...message,
    content: nextText,
    displayContent: undefined,
  };
}
