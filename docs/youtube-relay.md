---
title: YouTube Relay Guide
---

# YouTube Relay Guide

Use this optional flow when you want YouTube live chat comments to enter GeminiVRM and trigger Gemini replies from the existing chat pipeline.

## What You Need

- a Google OAuth web client ID for the exact origin where the app runs
- access to the YouTube account or channel that owns the target broadcast
- an active or upcoming broadcast with live chat enabled

## Navigation Path

Open the relay from:

1. `Settings`
2. `Streaming`
3. `YouTube relay`

Those labels match the current app UI and are the fastest way to confirm you are in the correct place.

## Setup Order

1. Prepare `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ahead of time or paste the client ID directly into the YouTube relay page.
2. Sign in with Google.
3. Refresh the broadcast list after authentication succeeds.
4. Choose the active or upcoming broadcast that should feed the relay.
5. Enable the relay listener.
6. Enable auto-reply if you want Gemini to answer incoming comments automatically.
7. Stream this app window through YouTube Live Control Room or OBS.

## Behavior Notes

- relay only forwards new comments received after the listener starts
- comments from the stream owner's own account are ignored to prevent reply loops
- the broadcast list is limited to broadcasts available to the signed-in account
- if a stream has just gone live, refresh again after a short wait so live chat metadata can appear
- auto-reply creates a GeminiVRM chat turn; it does not post messages back into YouTube chat

## Saved Session And Security

- the Google OAuth client ID is stored in browser local storage for convenience
- the short-lived YouTube access token is also restored from browser local storage until sign-out or expiry
- when the token expires or auth fails, sign in again from the YouTube relay page
- for public production deployments, prefer a server-managed token flow instead of long-term browser-only auth assumptions

## Common Failure Cases

### Sign-In Is Blocked

- add your Google account as a test user if the OAuth consent screen is still in testing
- verify the authorized JavaScript origin exactly matches your app URL

### No Broadcasts Appear

- confirm you signed in with the same Google account that owns or manages the target YouTube channel
- refresh after the stream becomes active or upcoming

### Comments Appear But Gemini Does Not Reply

- confirm auto-reply is enabled
- test with a brand-new comment sent after relay starts
- use a separate viewer account because owner comments are ignored

## Related Docs

- [Getting Started](./getting-started.md)
- [Usage Guide](./usage.md)
- [Troubleshooting](./troubleshooting.md)
