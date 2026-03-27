import {
  YOUTUBE_LIVE_API_SCOPE,
  YouTubeAuthState,
  YouTubeAuthToken,
  YouTubeTokenRequestParams,
} from "./types";
import { YouTubeLiveError, YouTubeErrorCode } from "./errors";

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-script";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenError = {
  type: string;
  error: string;
};

type GoogleTokenClient = {
  requestAccessToken: (
    options?: { prompt?: "" | "none" | "consent" | "select_account" } & {
      enable_serialized_scope?: boolean;
    },
  ) => void;
};

type GoogleOAuthConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse | GoogleTokenError) => void;
  error_callback?: (error: { type: string }) => void;
};

type GoogleOAuth2 = {
  initTokenClient: (config: GoogleOAuthConfig) => GoogleTokenClient;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function getGoogleOAuthScriptState(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.google?.accounts?.oauth2?.initTokenClient)
  );
}

export async function loadGoogleIdentityScript(): Promise<void> {
  if (getGoogleOAuthScriptState()) {
    return;
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => {
        resolve();
      });
      existingScript.addEventListener("error", () => {
        reject(
          new YouTubeLiveError({
            code: "GOOGLE_OAUTH_SCRIPT_LOAD_FAILED",
            message: "Google OAuth script failed to load.",
            detail: "Google Identity Services script load error.",
          }),
        );
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.async = true;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.addEventListener("load", () => {
      if (getGoogleOAuthScriptState()) {
        script.setAttribute("data-loaded", "true");
        resolve();
        return;
      }

      reject(
        new YouTubeLiveError({
          code: "GOOGLE_OAUTH_SCRIPT_LOAD_FAILED",
          message: "Google OAuth script loaded but API is unavailable.",
          detail: "google.accounts.oauth2 is not available.",
        }),
      );
    });
    script.addEventListener("error", () => {
      reject(
        new YouTubeLiveError({
          code: "GOOGLE_OAUTH_SCRIPT_LOAD_FAILED",
          message: "Google OAuth script failed to load.",
          detail: "The Google Identity Services script could not be loaded.",
        }),
      );
    });
    document.head.appendChild(script);
  });

  try {
    await scriptLoadPromise;
  } catch (error) {
    scriptLoadPromise = null;
    throw error;
  }
}

function buildAuthState(
  clientId: string,
  token: YouTubeAuthToken | null,
): YouTubeAuthState {
  return {
    clientId,
    token,
  };
}

function buildTokenFromResponse(
  clientId: string,
  response: GoogleTokenResponse,
): YouTubeAuthToken {
  if (!response.access_token) {
    throw new YouTubeLiveError({
      code: "GOOGLE_OAUTH_FAILED",
      message: "Google OAuth did not return an access token.",
      detail: "Empty access_token from Google OAuth response.",
    });
  }

  return {
    accessToken: response.access_token,
    tokenType: response.token_type ?? "Bearer",
    scope: response.scope ?? YOUTUBE_LIVE_API_SCOPE,
    expiresAt:
      Date.now() +
      ((response.expires_in ?? 3600) * 1000 - Number.EPSILON * 1000),
  };
}

function isKnownGoogleAuthError(
  response: GoogleTokenResponse | GoogleTokenError,
): response is GoogleTokenError {
  return (
    typeof (response as GoogleTokenError).error === "string" &&
    !("access_token" in response)
  );
}

function mapOAuthError(response: GoogleTokenResponse | GoogleTokenError) {
  const details = (() => {
    if ("error_description" in response && response.error_description) {
      return response.error_description;
    }

    return response.error ?? "Google OAuth returned an error.";
  })();

  const isAbort = response.error === "popup_closed_by_user";
  const code: YouTubeErrorCode = isAbort
    ? "GOOGLE_OAUTH_ABORTED"
    : "GOOGLE_OAUTH_FAILED";

  return new YouTubeLiveError({
    code,
    message: isAbort ? "YouTube login was cancelled." : "Google OAuth failed.",
    detail: `Google OAuth error: ${details}`,
  });
}

export async function requestYouTubeAccessToken({
  clientId,
  scopes,
  prompt = "",
}: YouTubeTokenRequestParams): Promise<YouTubeAuthState> {
  if (!clientId) {
    throw new YouTubeLiveError({
      code: "MISSING_CLIENT_ID",
      message: "Google OAuth client ID is required.",
      detail:
        "Enter a Google OAuth client ID in Settings or set NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
    });
  }

  await loadGoogleIdentityScript();

  if (!getGoogleOAuthScriptState()) {
    throw new YouTubeLiveError({
      code: "GOOGLE_OAUTH_FAILED",
      message: "Google OAuth is not available.",
      detail: "google.accounts.oauth2 is not initialized.",
    });
  }

  return new Promise<YouTubeAuthState>((resolve, reject) => {
    const tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: (scopes ?? [YOUTUBE_LIVE_API_SCOPE]).join(" "),
      callback: (response) => {
        if (isKnownGoogleAuthError(response)) {
          reject(mapOAuthError(response));
          return;
        }

        try {
          const token = buildTokenFromResponse(clientId, response);
          resolve(buildAuthState(clientId, token));
        } catch (error) {
          reject(error);
        }
      },
      error_callback: (error) => {
        reject(
          new YouTubeLiveError({
            code: "GOOGLE_OAUTH_FAILED",
            message: "Google OAuth failed.",
            detail: `Google OAuth error: ${error.type ?? "unknown"}`,
          }),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt });
  });
}
