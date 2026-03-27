import { useId } from "react";
import { TextButton } from "./textButton";

export type YoutubeBroadcastState =
  | "upcoming"
  | "active"
  | "completed"
  | "unknown";

export type YoutubeAuthState =
  | "idle"
  | "connecting"
  | "authenticated"
  | "error";

export type YoutubeBroadcastLoadState = "idle" | "loading" | "ready" | "error";

export type YoutubeLiveReceiveState = "idle" | "listening" | "error";

export type YoutubeBroadcastSummary = {
  id: string;
  title: string;
  state: YoutubeBroadcastState;
  liveChatId?: string | null;
  scheduledStartTime?: string;
  viewerCount?: number;
};

export type YoutubeIncomingComment = {
  id: string;
  author: string;
  comment: string;
  receivedAt: string;
};

type Props = {
  googleClientId: string;
  onGoogleClientIdChange: (value: string) => void;
  authState: YoutubeAuthState;
  authError?: string;
  onSignIn: () => void;
  onSignOut: () => void;
  broadcastLoadState: YoutubeBroadcastLoadState;
  broadcastError?: string;
  broadcasts: YoutubeBroadcastSummary[];
  selectedBroadcastId?: string;
  onSelectBroadcast: (broadcast: YoutubeBroadcastSummary) => void;
  onRefreshBroadcasts: () => void;
  isRelayModeEnabled?: boolean;
  onToggleRelayMode?: (nextEnabled: boolean) => void;
  isAutoReplyEnabled?: boolean;
  onToggleAutoReply?: (nextEnabled: boolean) => void;
  receiveState?: YoutubeLiveReceiveState;
  receiveError?: string;
  incomingComments?: YoutubeIncomingComment[];
  onOpenStreamingHint?: () => void;
};

const STATE_BADGE = {
  active: "bg-emerald-200 text-emerald-900",
  upcoming: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-500",
  unknown: "bg-violet-100 text-violet-700",
};

const formatReceivedTime = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
};

const AUTH_STATE_TEXT: Record<YoutubeAuthState, string> = {
  idle: "Not connected",
  connecting: "Connecting",
  authenticated: "Connected",
  error: "Connection error",
};

const RECEIVE_STATE_TEXT: Record<YoutubeLiveReceiveState, string> = {
  idle: "Idle",
  listening: "Listening",
  error: "Receive error",
};

export const YoutubeLiveControlDeck = ({
  googleClientId,
  onGoogleClientIdChange,
  authState,
  authError,
  onSignIn,
  onSignOut,
  broadcastLoadState,
  broadcastError,
  broadcasts,
  selectedBroadcastId,
  onSelectBroadcast,
  onRefreshBroadcasts,
  isRelayModeEnabled = false,
  onToggleRelayMode,
  isAutoReplyEnabled = false,
  onToggleAutoReply = () => {},
  receiveState = "idle",
  receiveError,
  incomingComments = [],
  onOpenStreamingHint,
}: Props) => {
  const summaryId = useId();
  const clientIdInputId = useId();
  const relayButtonId = useId();
  const relayDescriptionId = useId();
  const relayStatusId = useId();
  const autoReplyButtonId = useId();
  const autoReplyDescriptionId = useId();
  const autoReplyStatusId = useId();

  const selectedBroadcast = broadcasts.find(
    (value) => value.id === selectedBroadcastId,
  );
  const canStartSignIn =
    authState !== "connecting" && googleClientId.trim().length > 0;
  const selectedBroadcastHasLiveChat = !!selectedBroadcast?.liveChatId;
  const canEnableRelayMode =
    authState === "authenticated" &&
    !!selectedBroadcast &&
    selectedBroadcastHasLiveChat;
  const relayToggleDisabled =
    !onToggleRelayMode || (!canEnableRelayMode && !isRelayModeEnabled);
  const recentComments = incomingComments.slice(0, 8);

  const receiveStatusText =
    receiveState === "listening"
      ? "Listening for incoming comments."
      : receiveState === "error"
        ? receiveError || "Unable to receive comments."
        : canEnableRelayMode
          ? "Relay ready. Start listening to receive new comments."
          : "Sign in and pick a broadcast with live chat enabled.";

  return (
    <section
      className="space-y-24"
      aria-label="YouTube live chat relay settings"
    >
      <div className="space-y-8">
        <label
          htmlFor={clientIdInputId}
          className="block typography-20 font-bold text-text1"
        >
          Google OAuth client ID
        </label>
        <input
          id={clientIdInputId}
          type="text"
          value={googleClientId}
          disabled={authState === "authenticated"}
          onChange={(event) => onGoogleClientIdChange(event.target.value)}
          placeholder="12345-abc.apps.googleusercontent.com"
          className="w-full rounded-8 bg-surface1 px-16 py-8 hover:bg-surface1-hover disabled:cursor-not-allowed disabled:bg-white/70 disabled:text-text2"
        />
        <p className="text-sm text-text2">
          Use a Web application OAuth client with YouTube Data API enabled.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-8">
          {authState === "authenticated" ? (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-oval border border-black/10 bg-white px-16 py-8 text-sm font-bold text-text1 transition hover:bg-surface1"
            >
              Sign out
            </button>
          ) : (
            <TextButton onClick={onSignIn} disabled={!canStartSignIn}>
              {authState === "connecting"
                ? "Connecting..."
                : "Sign in with Google"}
            </TextButton>
          )}
          <p className="text-sm text-text2">
            {AUTH_STATE_TEXT[authState]} / {RECEIVE_STATE_TEXT[receiveState]}
          </p>
        </div>
        {authError ? (
          <p className="mt-8 rounded-8 bg-rose-100 px-12 py-10 text-sm text-rose-700">
            {authError}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-8">
          <div>
            <h3 className="text-sm font-bold text-text1">Broadcast list</h3>
            <p className="mt-1 text-xs text-text2">
              Select the active or upcoming live stream for relay.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshBroadcasts}
            disabled={
              authState !== "authenticated" || broadcastLoadState === "loading"
            }
            className="rounded-oval border border-black/10 bg-white px-16 py-8 text-sm font-bold text-text1 transition hover:bg-surface1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {broadcastLoadState === "loading" ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="space-y-8">
          {broadcastLoadState === "loading" ? (
            <p className="rounded-8 bg-surface1 px-16 py-12 text-sm text-text2">
              Loading live broadcasts...
            </p>
          ) : null}

          {broadcastLoadState === "error" ? (
            <p className="rounded-8 bg-rose-100 px-16 py-12 text-sm text-rose-700">
              {broadcastError ?? "Failed to load broadcasts."}
            </p>
          ) : null}

          {broadcastLoadState === "ready" && broadcasts.length === 0 ? (
            <p className="rounded-8 bg-surface1 px-16 py-12 text-sm text-text2">
              No active or upcoming live broadcasts were found.
            </p>
          ) : null}

          {broadcastLoadState === "ready" && broadcasts.length > 0 ? (
            <div
              aria-describedby={summaryId}
              aria-live="polite"
              className="max-h-72 space-y-8 overflow-y-auto pr-1"
            >
              {broadcasts.map((broadcast) => {
                const isSelected = broadcast.id === selectedBroadcastId;
                const isActive = broadcast.state === "active";
                const rowTone = isSelected
                  ? isActive
                    ? "border-emerald-300 border-l-4 border-l-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                    : "border-primary/40 bg-white ring-1 ring-primary/15"
                  : isActive
                    ? "border-emerald-200 border-l-4 border-l-emerald-400 bg-emerald-50/90 hover:bg-emerald-50"
                    : "border-black/5 bg-surface1 hover:bg-surface1-hover";

                return (
                  <button
                    key={broadcast.id}
                    type="button"
                    onClick={() => onSelectBroadcast(broadcast)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-[6px] border px-16 py-14 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${rowTone}`}
                  >
                    <div className="flex items-start justify-between gap-10">
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-relaxed text-text1">
                          {broadcast.title}
                        </p>
                        <p className="mt-3 text-xs text-text2">
                          {broadcast.scheduledStartTime
                            ? `Scheduled: ${broadcast.scheduledStartTime}`
                            : "No scheduled time"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-8 py-3 text-[0.68rem] font-bold ${STATE_BADGE[broadcast.state]}`}
                      >
                        {broadcast.state}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <p id={summaryId} className="sr-only">
          Select a broadcast from the list to receive live comments.
        </p>
      </div>

      <div className="space-y-12">
        <div className="rounded-16 bg-surface1 px-16 py-14">
          <div className="text-sm font-bold text-text1">
            Enable comment relay listener
          </div>
          <p id={relayDescriptionId} className="mt-2 text-xs text-text2">
            Poll the selected broadcast and forward new comments into the chat.
          </p>
          <div className="mt-6 flex items-center justify-between gap-12">
            <p
              id={relayStatusId}
              role="status"
              aria-live="polite"
              className="text-xs text-text2"
            >
              {receiveStatusText}
            </p>
            <button
              id={relayButtonId}
              type="button"
              aria-pressed={isRelayModeEnabled}
              aria-label="Enable YouTube relay mode"
              aria-describedby={`${relayDescriptionId} ${relayStatusId}`}
              onClick={() => onToggleRelayMode?.(!isRelayModeEnabled)}
              disabled={relayToggleDisabled}
              className={`rounded-oval px-16 py-8 text-sm font-bold transition ${
                isRelayModeEnabled
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-white text-text1 hover:bg-surface1-hover"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isRelayModeEnabled ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="rounded-16 bg-surface1 px-16 py-14">
          <div className="text-sm font-bold text-text1">
            Auto-reply incoming comments
          </div>
          <p id={autoReplyDescriptionId} className="mt-2 text-xs text-text2">
            Let Gemini answer newly received YouTube comments.
          </p>
          <div className="mt-6 flex items-center justify-between gap-12">
            <p id={autoReplyStatusId} className="text-xs text-text2">
              {isAutoReplyEnabled
                ? "Auto-reply enabled."
                : "Auto-reply paused."}
            </p>
            <button
              id={autoReplyButtonId}
              type="button"
              aria-pressed={isAutoReplyEnabled}
              aria-label="Enable auto-reply"
              aria-describedby={`${autoReplyDescriptionId} ${autoReplyStatusId}`}
              onClick={() => onToggleAutoReply(!isAutoReplyEnabled)}
              className={`rounded-oval px-16 py-8 text-sm font-bold transition ${
                isAutoReplyEnabled
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-white text-text1 hover:bg-surface1-hover"
              }`}
            >
              {isAutoReplyEnabled ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-8 flex items-center justify-between gap-10">
          <h3 className="text-sm font-bold text-text1">
            Incoming comment preview
          </h3>
          <p className="rounded-full bg-black/10 px-10 py-4 text-xs font-bold text-text2">
            {incomingComments.length}
          </p>
        </div>
        <p className="mb-4 text-xs text-text2">
          New comments appear here before Gemini replies.
        </p>
        {recentComments.length === 0 ? (
          <div className="rounded-8 bg-surface1 px-16 py-14 text-sm leading-relaxed text-text2">
            {receiveState === "listening"
              ? "Listening now. Incoming comments will appear here."
              : "No comments received yet."}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-16 bg-surface1">
            {recentComments.map((comment) => (
              <li
                key={comment.id}
                className="border-b border-black/5 px-16 py-12 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-10">
                  <p className="text-sm font-bold leading-relaxed text-text1">
                    {comment.author}
                  </p>
                  <time className="text-[0.7rem] font-bold text-text2">
                    {formatReceivedTime(comment.receivedAt)}
                  </time>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-text2">
                  {comment.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {onOpenStreamingHint ? (
        <button
          type="button"
          onClick={onOpenStreamingHint}
          className="text-sm font-bold text-primary hover:text-primary-hover"
        >
          Open YouTube Studio / OBS guidance
        </button>
      ) : null}
    </section>
  );
};
