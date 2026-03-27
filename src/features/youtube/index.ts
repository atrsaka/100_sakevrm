export { YOUTUBE_LIVE_API_SCOPE } from "./types";
export type {
  YouTubeAuthState,
  YouTubeAuthToken,
  YouTubeBroadcastSummary,
  YouTubeBroadcastsResult,
  YouTubeBroadcastQueryParams,
  YouTubeLiveChatListParams,
  YouTubeLiveChatMessage,
  YouTubeLiveChatMessagesResult,
  YouTubeChatMessageRequestParams,
  YouTubeLiveChatSendResult,
  YouTubeTokenRequestParams,
} from "./types";
export type { YouTubeErrorCode, YouTubeErrorPayload } from "./errors";
export { YouTubeLiveError, userFacingMessage } from "./errors";
export { loadGoogleIdentityScript, requestYouTubeAccessToken } from "./googleOAuth";
export {
  listLiveBroadcasts,
  listLiveChatMessages,
  sendLiveChatMessage,
} from "./youTubeLiveClient";
