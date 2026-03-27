import { useId } from "react";

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

const AUTH_BADGE = {
  idle: { label: "Not connected", tone: "bg-black/5 text-text2" },
  connecting: {
    label: "Connecting",
    tone: "bg-secondary/10 text-secondary",
  },
  authenticated: {
    label: "Connected",
    tone: "bg-primary/10 text-primary",
  },
  error: { label: "Connection error", tone: "bg-rose-100 text-rose-700" },
};

const RECEIVE_BADGE: Record<
  YoutubeLiveReceiveState,
  { label: string; tone: string }
> = {
  idle: { label: "Idle", tone: "bg-black/5 text-text2" },
  listening: {
    label: "Listening",
    tone: "bg-emerald-100 text-emerald-700",
  },
  error: { label: "Receive error", tone: "bg-rose-100 text-rose-700" },
};

const STATE_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-500",
  unknown: "bg-violet-100 text-violet-700",
};

const SWITCH_CLASS_NAME =
  "relative h-6 w-11 cursor-pointer appearance-none rounded-full border border-black/20 bg-black/10 transition before:absolute before:left-0 before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-150 before:content-[''] checked:bg-primary checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-50";

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
  const relaySwitchId = useId();
  const autoReplySwitchId = useId();

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
      ? selectedBroadcast?.title
        ? `Listening to ${selectedBroadcast.title} comments.`
        : "Listening for incoming comments."
      : receiveState === "error"
        ? receiveError || "Unable to receive comments."
        : "Choose a broadcast and enable relay when you are ready.";

  return (
    <section
      className="rounded-24 border border-black/10 bg-white/70 p-16 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
      aria-label="YouTube live chat relay settings"
    >
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-secondary">
            YouTube companion
          </p>
          <h2 className="mt-4 typography-20 font-bold text-text1">
            Live relay settings
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text2">
            Receive live chat comments from YouTube Studio or OBS and route them
            into Gemini. This browser remembers your client ID and restores the
            saved session until the access token expires.
          </p>
        </div>
        <div className="flex flex-wrap gap-8">
          <span
            className={`inline-flex min-w-fit items-center rounded-full px-10 py-4 text-xs font-bold ${AUTH_BADGE[authState].tone}`}
          >
            {AUTH_BADGE[authState].label}
          </span>
          <span
            className={`inline-flex min-w-fit items-center rounded-full px-10 py-4 text-xs font-bold ${RECEIVE_BADGE[receiveState].tone}`}
          >
            {RECEIVE_BADGE[receiveState].label}
          </span>
        </div>
      </div>

      <div className="mt-16 grid gap-16 xl:grid-cols-[1.2fr_0.95fr]">
        <div className="space-y-16">
          <div className="rounded-20 border border-black/10 bg-surface1 p-14">
            <label
              htmlFor={clientIdInputId}
              className="block text-sm font-bold text-text1"
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
              className="mt-6 w-full rounded-12 bg-white px-12 py-10 text-sm shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 disabled:cursor-not-allowed disabled:bg-white/70 disabled:text-text2"
            />
            <p className="mt-4 text-xs leading-relaxed text-text2">
              Use a Web application OAuth client with YouTube Data API enabled.
              Sign out if you need to switch to another client.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              {authState === "authenticated" ? (
                <button
                  onClick={onSignOut}
                  type="button"
                  className="rounded-full border border-black/15 bg-white px-12 py-6 text-sm font-bold text-text1 transition hover:border-black/30 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={onSignIn}
                  type="button"
                  disabled={!canStartSignIn}
                  className="rounded-full bg-secondary px-14 py-6 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authState === "connecting"
                    ? "Connecting..."
                    : "Sign in with Google"}
                </button>
              )}
              <span className="text-xs text-text2">
                Saved locally on this browser until the token expires.
              </span>
            </div>

            {authError ? (
              <p className="mt-12 rounded-12 bg-rose-100 px-12 py-10 text-sm text-rose-700">
                {authError}
              </p>
            ) : !googleClientId.trim() ? (
              <p className="mt-12 rounded-12 bg-black/5 px-12 py-10 text-sm text-text2">
                Enter a Google OAuth client ID to enable YouTube sign-in.
              </p>
            ) : null}
          </div>

          <div className="rounded-20 border border-black/10 bg-surface1 p-14">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div>
                <p className="text-sm font-bold text-text1">Broadcast list</p>
                <p className="mt-2 text-xs text-text2">
                  Select the active or upcoming live stream that should feed the
                  relay.
                </p>
              </div>
              <button
                onClick={onRefreshBroadcasts}
                type="button"
                disabled={
                  authState !== "authenticated" ||
                  broadcastLoadState === "loading"
                }
                className="rounded-full border border-black/15 bg-white px-10 py-4 text-xs font-bold text-text1 transition hover:border-black/30 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {broadcastLoadState === "loading" ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-12 space-y-8">
              {broadcastLoadState === "loading" ? (
                <p className="rounded-12 bg-white px-12 py-10 text-sm text-text2">
                  Loading live broadcasts...
                </p>
              ) : null}

              {broadcastLoadState === "error" ? (
                <p className="rounded-12 bg-rose-100 px-12 py-10 text-sm text-rose-700">
                  {broadcastError ?? "Failed to load broadcasts."}
                </p>
              ) : null}

              {broadcastLoadState === "ready" && broadcasts.length === 0 ? (
                <p className="rounded-12 bg-white px-12 py-10 text-sm text-text2">
                  No active or upcoming live broadcasts were found.
                </p>
              ) : null}

              {broadcastLoadState === "ready" && broadcasts.length > 0 ? (
                <div
                  aria-describedby={summaryId}
                  aria-live="polite"
                  className="max-h-72 space-y-8 overflow-y-auto pr-1"
                >
                  {broadcasts.map((broadcast) => (
                    <button
                      key={broadcast.id}
                      type="button"
                      onClick={() => onSelectBroadcast(broadcast)}
                      aria-pressed={broadcast.id === selectedBroadcastId}
                      className={`w-full rounded-16 border px-12 py-12 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${
                        broadcast.id === selectedBroadcastId
                          ? "border-secondary/60 bg-white"
                          : "border-black/10 bg-white/80 hover:border-secondary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-10">
                        <p className="text-sm font-bold leading-relaxed text-text1">
                          {broadcast.title}
                        </p>
                        <span
                          className={`rounded-full px-8 py-3 text-[0.68rem] font-bold ${STATE_BADGE[broadcast.state]}`}
                        >
                          {broadcast.state}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-text2">
                        {broadcast.scheduledStartTime
                          ? `Scheduled: ${broadcast.scheduledStartTime}`
                          : "No scheduled time"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <p id={summaryId} className="sr-only">
              Select a broadcast from the list to receive live comments.
            </p>
          </div>
        </div>

        <div className="space-y-16">
          <div className="rounded-20 border border-black/10 bg-surface1 p-14">
            <div className="space-y-10">
              <div className="rounded-16 bg-white px-12 py-10">
                <div className="flex items-start justify-between gap-12">
                  <div>
                    <label
                      htmlFor={relaySwitchId}
                      className="text-sm font-bold text-text1"
                    >
                      Enable comment relay listener
                    </label>
                    <p className="mt-2 text-xs leading-relaxed text-text2">
                      Start polling the selected broadcast and forward new chat
                      comments into the main conversation.
                    </p>
                  </div>
                  <input
                    id={relaySwitchId}
                    aria-checked={isRelayModeEnabled}
                    aria-label="Enable YouTube relay mode"
                    checked={isRelayModeEnabled}
                    role="switch"
                    type="checkbox"
                    onChange={(event) =>
                      onToggleRelayMode?.(event.target.checked)
                    }
                    disabled={relayToggleDisabled}
                    className={SWITCH_CLASS_NAME}
                  />
                </div>
              </div>

              <div className="rounded-16 bg-white px-12 py-10">
                <div className="flex items-start justify-between gap-12">
                  <div>
                    <label
                      htmlFor={autoReplySwitchId}
                      className="text-sm font-bold text-text1"
                    >
                      Auto-reply incoming comments
                    </label>
                    <p className="mt-2 text-xs leading-relaxed text-text2">
                      Let Gemini answer newly received YouTube comments through
                      the existing chat flow.
                    </p>
                  </div>
                  <input
                    id={autoReplySwitchId}
                    aria-checked={isAutoReplyEnabled}
                    aria-label="Enable auto-reply"
                    checked={isAutoReplyEnabled}
                    role="switch"
                    type="checkbox"
                    onChange={(event) =>
                      onToggleAutoReply(event.target.checked)
                    }
                    className={SWITCH_CLASS_NAME}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 text-xs font-bold">
              <span
                className={`rounded-full px-10 py-4 ${
                  isRelayModeEnabled
                    ? "bg-secondary/10 text-secondary"
                    : "bg-black/5 text-text2"
                }`}
              >
                {isRelayModeEnabled ? "Relay on" : "Relay off"}
              </span>
              <span
                className={`rounded-full px-10 py-4 ${
                  isAutoReplyEnabled
                    ? "bg-primary/10 text-primary"
                    : "bg-black/5 text-text2"
                }`}
              >
                {isAutoReplyEnabled ? "Auto-reply on" : "Auto-reply off"}
              </span>
            </div>

            <p
              role="status"
              aria-live="polite"
              className={`mt-12 rounded-12 px-12 py-10 text-sm leading-relaxed ${
                receiveState === "listening"
                  ? "bg-emerald-100 text-emerald-700"
                  : receiveState === "error"
                    ? "bg-rose-100 text-rose-700"
                    : canEnableRelayMode
                      ? "bg-secondary/10 text-secondary"
                      : "bg-amber-100 text-amber-800"
              }`}
            >
              {receiveState === "idle" && !canEnableRelayMode
                ? "Sign in and pick a broadcast with live chat before starting the relay."
                : receiveStatusText}
            </p>

            {onOpenStreamingHint ? (
              <button
                type="button"
                onClick={onOpenStreamingHint}
                className="mt-12 w-full rounded-12 border border-black/10 bg-white px-12 py-8 text-left text-sm font-bold text-text1 transition hover:border-black/20 hover:bg-black/5"
              >
                Open YouTube Studio / OBS guidance
              </button>
            ) : null}
          </div>

          <div className="rounded-20 border border-black/10 bg-surface1 p-14">
            <div className="flex items-center justify-between gap-10">
              <div>
                <p className="text-sm font-bold text-text1">
                  Incoming comment preview
                </p>
                <p className="mt-2 text-xs text-text2">
                  New comments appear here before Gemini responds.
                </p>
              </div>
              <span className="rounded-full bg-white px-10 py-4 text-xs font-bold text-text2 shadow-sm">
                {incomingComments.length}
              </span>
            </div>

            {recentComments.length === 0 ? (
              <div className="mt-12 rounded-16 border border-dashed border-black/10 bg-white/70 px-12 py-14 text-sm leading-relaxed text-text2">
                {receiveState === "listening"
                  ? "Listening now. Incoming comments will appear here."
                  : "No comments received yet."}
              </div>
            ) : (
              <ul className="mt-12 max-h-80 space-y-8 overflow-y-auto pr-1">
                {recentComments.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-16 border border-black/10 bg-white px-12 py-12"
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
        </div>
      </div>
    </section>
  );
};
