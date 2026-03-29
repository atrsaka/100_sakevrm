const PODCAST_DEBUG_STORAGE_KEY = "podcastDebug";

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

export function logPodcastDebugEvent(
  eventName: string,
  payload: Record<string, unknown>,
): void {
  if (!isPodcastDebugEnabled()) {
    return;
  }

  console.info(`[PodcastDebug] ${eventName}`, {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function buildPodcastRelayFallbackLogPayload({
  relayAudioMimeType,
  relayAudioBytesLength,
  relayTranscript,
  error,
}: {
  relayAudioMimeType: string;
  relayAudioBytesLength: number;
  relayTranscript: string;
  error: string;
}): Record<string, unknown> {
  const basePayload = {
    relayAudioMimeType,
    relayAudioBytesLength,
    hasRelayTranscript: relayTranscript.length > 0,
    error,
  };

  if (!isPodcastDebugEnabled()) {
    return basePayload;
  }

  return {
    ...basePayload,
    relayTranscript,
  };
}

export { PODCAST_DEBUG_STORAGE_KEY };
