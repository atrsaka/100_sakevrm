import {
  YouTubeBroadcastSummary,
  YouTubeBroadcastsResult,
  YouTubeBroadcastQueryParams,
  YouTubeLiveChatListParams,
  YouTubeLiveChatMessage,
  YouTubeLiveChatMessagesResult,
  YouTubeChatMessageRequestParams,
  YouTubeLiveChatSendResult,
} from "./types";
import { YouTubeLiveError } from "./errors";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

type RawBroadcast = {
  id: string;
  snippet?: {
    title?: string;
    liveChatId?: string;
    channelId?: string;
    scheduledStartTime?: string;
    actualStartTime?: string;
  };
  status?: {
    lifeCycleStatus?: string;
  };
};

type RawBroadcastListResponse = {
  items?: RawBroadcast[];
};

type RawLiveChatInsertResponse = {
  id?: string;
};

type RawLiveChatMessageAuthor = {
  displayName?: string;
  channelId?: string;
};

type RawLiveChatMessageSnippet = {
  publishedAt?: string;
  textMessageDetails?: {
    messageText?: string;
  };
  displayMessage?: string;
  type?: string;
};

type RawLiveChatMessage = {
  id?: string;
  snippet?: RawLiveChatMessageSnippet;
  authorDetails?: RawLiveChatMessageAuthor;
};

type RawLiveChatListResponse = {
  items?: RawLiveChatMessage[];
  nextPageToken?: string;
  pollingIntervalMillis?: number;
};

function ensureYouTubeAuth(accessToken: string): string {
  if (!accessToken) {
    throw new YouTubeLiveError({
      code: "MISSING_ACCESS_TOKEN",
      message: "Access token is missing.",
      detail: "Authenticate with Google first.",
    });
  }

  return accessToken;
}

function normalizeBroadcast(item: RawBroadcast): YouTubeBroadcastSummary {
  return {
    id: item.id,
    title: item.snippet?.title || "Untitled broadcast",
    liveChatId: item.snippet?.liveChatId ?? null,
    channelId: item.snippet?.channelId ?? null,
    scheduledStartTime: item.snippet?.scheduledStartTime ?? null,
    actualStartTime: item.snippet?.actualStartTime ?? null,
    lifecycleStatus: item.status?.lifeCycleStatus ?? null,
  };
}

function normalizeLiveChatMessage(
  item: RawLiveChatMessage,
): YouTubeLiveChatMessage | null {
  if (!item.id) {
    return null;
  }

  const snippet = item.snippet ?? {};

  const messageText = (() => {
    if (snippet.textMessageDetails?.messageText) {
      return snippet.textMessageDetails.messageText;
    }

    if (snippet.displayMessage) {
      return snippet.displayMessage;
    }

    return "";
  })();

  return {
    id: item.id,
    authorDisplayName: item.authorDetails?.displayName ?? "Unknown",
    authorChannelId: item.authorDetails?.channelId ?? null,
    publishedAt: snippet.publishedAt ?? new Date(0).toISOString(),
    text: messageText,
    messageType: snippet.type ?? null,
  };
}

function throwApiError(response: Response, bodyText: string): never {
  throw new YouTubeLiveError({
    code:
      response.status === 401 ? "YOUTUBE_API_AUTH_ERROR" : "YOUTUBE_API_ERROR",
    message: `YouTube API request failed (HTTP ${response.status}).`,
    detail: bodyText || response.statusText,
    httpStatus: response.status,
  });
}

async function fetchJson<T>(
  url: string,
  accessToken: string,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  if (init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${ensureYouTubeAuth(accessToken)}`,
      ...Object.fromEntries(headers.entries()),
    },
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throwApiError(response, bodyText);
  }

  if (!bodyText) {
    return {} as T;
  }

  return JSON.parse(bodyText) as T;
}

async function listOwnedBroadcasts(
  accessToken: string,
  maxResults: number,
): Promise<YouTubeBroadcastSummary[]> {
  const params = new URLSearchParams({
    part: "snippet,status",
    mine: "true",
    broadcastType: "all",
    maxResults: String(maxResults),
  });

  const endpoint = `${YOUTUBE_API_BASE_URL}/liveBroadcasts?${params.toString()}`;
  const response = await fetchJson<RawBroadcastListResponse>(
    endpoint,
    accessToken,
  );

  return (response.items ?? []).map(normalizeBroadcast);
}

export async function listLiveBroadcasts({
  accessToken,
  includeActive = true,
  includeUpcoming = true,
  maxResults = 25,
}: YouTubeBroadcastQueryParams): Promise<YouTubeBroadcastsResult> {
  const token = ensureYouTubeAuth(accessToken);
  const allBroadcasts = await listOwnedBroadcasts(token, maxResults);
  const broadcasts = allBroadcasts.filter((broadcast) => {
    const status = broadcast.lifecycleStatus ?? "";

    if (
      includeActive &&
      (status === "live" || status === "liveStarting" || status === "testing")
    ) {
      return true;
    }

    if (
      includeUpcoming &&
      (status === "ready" || status === "created" || status === "testStarting")
    ) {
      return true;
    }

    return false;
  });

  return { broadcasts };
}

export async function listLiveChatMessages({
  accessToken,
  liveChatId,
  pageToken,
  maxResults = 200,
}: YouTubeLiveChatListParams): Promise<YouTubeLiveChatMessagesResult> {
  const token = ensureYouTubeAuth(accessToken);

  if (!liveChatId) {
    throw new YouTubeLiveError({
      code: "MISSING_LIVE_CHAT_ID",
      message: "Selected broadcast has no live chat id.",
      detail: "Pick another broadcast where live chat is available.",
    });
  }

  const params = new URLSearchParams({
    part: "snippet,authorDetails",
    liveChatId,
    maxResults: String(maxResults),
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const endpoint = `${YOUTUBE_API_BASE_URL}/liveChat/messages?${params.toString()}`;
  const response = await fetchJson<RawLiveChatListResponse>(endpoint, token);

  return {
    messages: (response.items ?? [])
      .map(normalizeLiveChatMessage)
      .filter((message): message is YouTubeLiveChatMessage => message !== null),
    nextPageToken: response.nextPageToken ?? null,
    pollingIntervalMillis:
      response.pollingIntervalMillis && response.pollingIntervalMillis > 0
        ? response.pollingIntervalMillis
        : 5000,
  };
}

export async function sendLiveChatMessage({
  accessToken,
  liveChatId,
  messageText,
}: YouTubeChatMessageRequestParams): Promise<YouTubeLiveChatSendResult> {
  const token = ensureYouTubeAuth(accessToken);
  if (!liveChatId) {
    throw new YouTubeLiveError({
      code: "MISSING_LIVE_CHAT_ID",
      message: "Selected broadcast has no live chat id.",
      detail:
        "Pick another broadcast or wait until the live chat is available.",
    });
  }

  if (!messageText.trim()) {
    throw new YouTubeLiveError({
      code: "MISSING_MESSAGE_TEXT",
      message: "Comment text is empty.",
      detail: "Type a comment before sending.",
    });
  }

  const params = new URLSearchParams({
    part: "snippet",
  });

  const endpoint = `${YOUTUBE_API_BASE_URL}/liveChat/messages?${params.toString()}`;
  const response = await fetchJson<RawLiveChatInsertResponse>(endpoint, token, {
    method: "POST",
    body: JSON.stringify({
      snippet: {
        liveChatId,
        type: "textMessageEvent",
        textMessageDetails: {
          messageText,
        },
      },
    }),
  });

  if (!response.id) {
    throw new YouTubeLiveError({
      code: "YOUTUBE_API_ERROR",
      message: "YouTube returned no message ID.",
      detail: "Could not confirm that the comment was posted.",
    });
  }

  return {
    messageId: response.id,
    liveChatId,
  };
}
