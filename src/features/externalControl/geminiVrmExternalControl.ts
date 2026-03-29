import type { Message } from "../messages/messages";
import {
  type InteractionMode,
  type PodcastSpeakerId,
} from "../podcast/podcastConfig";
import {
  isBuiltInMotionId,
  type BuiltInMotionId,
} from "../vrmViewer/builtInMotions";

export const GEMINI_VRM_EXTERNAL_CONTROL_STORAGE_KEY =
  "geminiVrmExternalControl";
export const GEMINI_VRM_EXTERNAL_CONTROL_ORIGINS_STORAGE_KEY =
  "geminiVrmExternalControlOrigins";
export const GEMINI_VRM_EXTERNAL_CONTROL_MESSAGE_TYPE = "gemini-vrm-control";
export const GEMINI_VRM_EXTERNAL_CONTROL_RESULT_TYPE =
  "gemini-vrm-control:result";

export type GeminiVrmExternalControlLogEntry = {
  role: Message["role"];
  name?: string;
  source?: Message["source"];
  content: string;
};

export type GeminiVrmExternalControlState = {
  interactionMode: InteractionMode;
  chatProcessing: boolean;
  assistantMessage: string;
  assistantStatus: string;
  assistantSpeakerName: string;
  hasGeminiApiKey: boolean;
  geminiModel: string;
  geminiVoiceName: string;
  selectedMotionId: BuiltInMotionId;
  podcastTurnCount: number;
  podcastYukitoVoiceName: string;
  podcastKiyokaVoiceName: string;
  activePodcastSpeakerId: PodcastSpeakerId | null;
  chatViewerReady: boolean;
  podcastViewerReady: Record<PodcastSpeakerId, boolean>;
  chatLog: GeminiVrmExternalControlLogEntry[];
  podcastLog: GeminiVrmExternalControlLogEntry[];
  activeConversationLog: GeminiVrmExternalControlLogEntry[];
  externalControl: {
    postMessageEnabled: boolean;
    messageType: typeof GEMINI_VRM_EXTERNAL_CONTROL_MESSAGE_TYPE;
    resultType: typeof GEMINI_VRM_EXTERNAL_CONTROL_RESULT_TYPE;
  };
};

export type GeminiVrmExternalControlSummary = Pick<
  GeminiVrmExternalControlState,
  | "interactionMode"
  | "chatProcessing"
  | "assistantStatus"
  | "assistantSpeakerName"
  | "hasGeminiApiKey"
  | "selectedMotionId"
  | "podcastTurnCount"
  | "activePodcastSpeakerId"
  | "chatViewerReady"
  | "podcastViewerReady"
  | "externalControl"
>;

export type GeminiVrmExternalControlCommand =
  | {
      type: "getState";
    }
  | {
      type: "setInteractionMode";
      interactionMode: InteractionMode;
    }
  | {
      type: "updatePodcastSettings";
      podcastTurnCount?: number;
      podcastYukitoVoiceName?: string;
      podcastKiyokaVoiceName?: string;
    }
  | {
      type: "setMotion";
      motionId: BuiltInMotionId;
    }
  | {
      type: "sendMessage";
      text: string;
      authorName?: string;
    }
  | {
      type: "resetConversation";
      target?: InteractionMode | "active";
    };

export type GeminiVrmExternalControlCommandResult = {
  state: GeminiVrmExternalControlState;
  detail?: string;
};

export type GeminiVrmExternalControlPostMessageResult = {
  state: GeminiVrmExternalControlSummary;
  detail?: string;
};

export type GeminiVrmExternalControlRequestMessage = {
  type: typeof GEMINI_VRM_EXTERNAL_CONTROL_MESSAGE_TYPE;
  id: string;
  command: GeminiVrmExternalControlCommand;
};

export type GeminiVrmExternalControlResponseMessage =
  | {
      type: typeof GEMINI_VRM_EXTERNAL_CONTROL_RESULT_TYPE;
      id: string;
      ok: true;
      result: GeminiVrmExternalControlPostMessageResult;
    }
  | {
      type: typeof GEMINI_VRM_EXTERNAL_CONTROL_RESULT_TYPE;
      id: string;
      ok: false;
      error: string;
      result?: GeminiVrmExternalControlPostMessageResult;
    };

export type GeminiVrmExternalControlApi = {
  isPostMessageEnabled: () => boolean;
  getState: () => GeminiVrmExternalControlState;
  setInteractionMode: (
    interactionMode: InteractionMode,
  ) => Promise<GeminiVrmExternalControlCommandResult>;
  updatePodcastSettings: (settings: {
    podcastTurnCount?: number;
    podcastYukitoVoiceName?: string;
    podcastKiyokaVoiceName?: string;
  }) => Promise<GeminiVrmExternalControlCommandResult>;
  setMotion: (
    motionId: BuiltInMotionId,
  ) => Promise<GeminiVrmExternalControlCommandResult>;
  sendMessage: (
    text: string,
    authorName?: string,
  ) => Promise<GeminiVrmExternalControlCommandResult>;
  resetConversation: (
    target?: InteractionMode | "active",
  ) => Promise<GeminiVrmExternalControlCommandResult>;
};

export function isExternalControlEnabled(): boolean {
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment || typeof window === "undefined") {
    return isDevelopment;
  }

  try {
    return (
      window.localStorage.getItem(
        GEMINI_VRM_EXTERNAL_CONTROL_STORAGE_KEY,
      ) === "true"
    );
  } catch {
    return false;
  }
}

export function toExternalControlLog(
  messages: Message[],
): GeminiVrmExternalControlLogEntry[] {
  return messages.map((message) => ({
    role: message.role,
    name: message.name,
    source: message.source,
    content: message.displayContent ?? message.content,
  }));
}

export function toExternalControlSummary(
  state: GeminiVrmExternalControlState,
): GeminiVrmExternalControlSummary {
  return {
    interactionMode: state.interactionMode,
    chatProcessing: state.chatProcessing,
    assistantStatus: state.assistantStatus,
    assistantSpeakerName: state.assistantSpeakerName,
    hasGeminiApiKey: state.hasGeminiApiKey,
    selectedMotionId: state.selectedMotionId,
    podcastTurnCount: state.podcastTurnCount,
    activePodcastSpeakerId: state.activePodcastSpeakerId,
    chatViewerReady: state.chatViewerReady,
    podcastViewerReady: state.podcastViewerReady,
    externalControl: state.externalControl,
  };
}

export function isGeminiVrmExternalControlRequestMessage(
  value: unknown,
): value is GeminiVrmExternalControlRequestMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === GEMINI_VRM_EXTERNAL_CONTROL_MESSAGE_TYPE &&
    typeof candidate.id === "string" &&
    isGeminiVrmExternalControlCommand(candidate.command)
  );
}

function isGeminiVrmExternalControlCommand(
  value: unknown,
): value is GeminiVrmExternalControlCommand {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  switch (candidate.type) {
    case "getState":
      return true;
    case "setInteractionMode":
      return (
        candidate.interactionMode === "chat" ||
        candidate.interactionMode === "podcast"
      );
    case "updatePodcastSettings":
      return (
        (candidate.podcastTurnCount == null ||
          typeof candidate.podcastTurnCount === "number") &&
        (candidate.podcastYukitoVoiceName == null ||
          typeof candidate.podcastYukitoVoiceName === "string") &&
        (candidate.podcastKiyokaVoiceName == null ||
          typeof candidate.podcastKiyokaVoiceName === "string")
      );
    case "setMotion":
      return (
        typeof candidate.motionId === "string" &&
        isBuiltInMotionId(candidate.motionId)
      );
    case "sendMessage":
      return (
        typeof candidate.text === "string" &&
        (candidate.authorName == null || typeof candidate.authorName === "string")
      );
    case "resetConversation":
      return (
        candidate.target == null ||
        candidate.target === "active" ||
        candidate.target === "chat" ||
        candidate.target === "podcast"
      );
    default:
      return false;
  }
}

export function isExternalControlOriginAllowed(origin: string): boolean {
  if (!origin || origin === "null" || typeof window === "undefined") {
    return false;
  }

  if (origin === window.location.origin) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  try {
    const rawConfiguredOrigins = window.localStorage.getItem(
      GEMINI_VRM_EXTERNAL_CONTROL_ORIGINS_STORAGE_KEY,
    );
    if (!rawConfiguredOrigins) {
      return false;
    }

    return rawConfiguredOrigins
      .split(/[\s,]+/)
      .filter(Boolean)
      .includes(origin);
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    geminiVrmControl?: GeminiVrmExternalControlApi;
  }
}
