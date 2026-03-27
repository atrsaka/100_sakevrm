export const YOUTUBE_LIVE_API_SCOPE =
  "https://www.googleapis.com/auth/youtube.force-ssl";

export type YouTubeAuthToken = {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt: number;
};

export type YouTubeAuthState = {
  clientId: string;
  token: YouTubeAuthToken | null;
};

export type YouTubeBroadcastSummary = {
  id: string;
  title: string;
  liveChatId: string | null;
  channelId: string | null;
  scheduledStartTime: string | null;
  actualStartTime: string | null;
  lifecycleStatus: string | null;
};

export type YouTubeBroadcastsResult = {
  broadcasts: YouTubeBroadcastSummary[];
};

export type YouTubeLiveChatSendResult = {
  messageId: string;
  liveChatId: string;
};

export type YouTubeTokenRequestParams = {
  clientId: string;
  scopes?: string[];
  prompt?: "" | "none" | "consent" | "select_account";
};

export type YouTubeBroadcastQueryParams = {
  accessToken: string;
  includeActive?: boolean;
  includeUpcoming?: boolean;
  maxResults?: number;
};

export type YouTubeLiveChatListParams = {
  accessToken: string;
  liveChatId: string;
  pageToken?: string | null;
  maxResults?: number;
};

export type YouTubeChatMessageRequestParams = {
  accessToken: string;
  liveChatId: string;
  messageText: string;
};

export type YouTubeLiveChatMessage = {
  id: string;
  authorDisplayName: string;
  authorChannelId: string | null;
  publishedAt: string;
  text: string;
  messageType?: string | null;
};

export type YouTubeLiveChatMessagesResult = {
  messages: YouTubeLiveChatMessage[];
  nextPageToken: string | null;
  pollingIntervalMillis: number;
};
