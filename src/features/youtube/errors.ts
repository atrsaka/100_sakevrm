export type YouTubeErrorCode =
  | "MISSING_CLIENT_ID"
  | "MISSING_ACCESS_TOKEN"
  | "MISSING_BROADCAST_ID"
  | "MISSING_LIVE_CHAT_ID"
  | "MISSING_MESSAGE_TEXT"
  | "GOOGLE_OAUTH_SCRIPT_LOAD_FAILED"
  | "GOOGLE_OAUTH_FAILED"
  | "GOOGLE_OAUTH_ABORTED"
  | "YOUTUBE_API_AUTH_ERROR"
  | "YOUTUBE_API_ERROR";

export type YouTubeErrorPayload = {
  code: YouTubeErrorCode;
  message: string;
  detail?: string;
  httpStatus?: number;
};

export class YouTubeLiveError extends Error {
  code: YouTubeErrorCode;
  uiMessage: string;
  httpStatus?: number;

  constructor(payload: YouTubeErrorPayload) {
    super(payload.message);
    this.name = "YouTubeLiveError";
    this.code = payload.code;
    this.uiMessage = payload.detail ?? payload.message;
    this.httpStatus = payload.httpStatus;
  }
}

export function userFacingMessage(error: unknown): string {
  if (error instanceof YouTubeLiveError) {
    return error.uiMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred.";
}
