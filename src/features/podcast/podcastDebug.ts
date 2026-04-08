const PODCAST_DEBUG_STORAGE_KEY = "podcastDebug";
const PODCAST_RELAY_MODE_STORAGE_KEY = "podcastRelayMode";

export type PodcastRelayMode = "streaming" | "batch";

export type PodcastDebugEventEntry = {
  eventName: string;
  timestamp: string;
  perfNowMs: number;
  [key: string]: unknown;
};

type PodcastDebugWindow = Window & {
  __geminiVrmPodcastDebugEvents?: PodcastDebugEventEntry[];
};

export function isPodcastDebugEnabled(): boolean {
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment || typeof window === "undefined") {
    return isDevelopment;
  }

  try {
    return window.localStorage.getItem(PODCAST_DEBUG_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function clearPodcastDebugEvents(): void {
  if (typeof window === "undefined") {
    return;
  }

  (window as PodcastDebugWindow).__geminiVrmPodcastDebugEvents = [];
}

export function readPodcastDebugEvents(): PodcastDebugEventEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const events = (window as PodcastDebugWindow).__geminiVrmPodcastDebugEvents;
  return Array.isArray(events) ? [...events] : [];
}

export function resolvePodcastRelayMode(): PodcastRelayMode {
  if (typeof window === "undefined") {
    return "streaming";
  }

  try {
    return window.localStorage.getItem(PODCAST_RELAY_MODE_STORAGE_KEY) === "batch"
      ? "batch"
      : "streaming";
  } catch {
    return "streaming";
  }
}

export function logPodcastDebugEvent(
  eventName: string,
  payload: Record<string, unknown>,
): void {
  if (!isPodcastDebugEnabled()) {
    return;
  }

  const eventEntry: PodcastDebugEventEntry = {
    eventName,
    timestamp: new Date().toISOString(),
    perfNowMs: typeof performance !== "undefined" ? performance.now() : Date.now(),
    ...payload,
  };
  const debugWindow = window as PodcastDebugWindow;
  const events = debugWindow.__geminiVrmPodcastDebugEvents ?? [];
  events.push(eventEntry);
  debugWindow.__geminiVrmPodcastDebugEvents = events;

  console.info(`[PodcastDebug] ${eventName}`, eventEntry);
}

export { PODCAST_DEBUG_STORAGE_KEY, PODCAST_RELAY_MODE_STORAGE_KEY };
