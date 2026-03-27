---
title: Usage Guide
---

# Usage Guide

## Core Chat Flow

1. Start the app and provide a Gemini API key.
2. Keep the bundled `Kiyoka.vrm` avatar or load your own `.vrm` file.
3. Send a text prompt or use the microphone input.
4. Read the partial transcript while audio streams in.
5. Let the viewer finish playback before sending the next prompt if you want the cleanest lip sync.

## Settings You Can Tune

- live model
- voice preset
- system prompt
- chat history reset
- local VRM file input
- optional `Streaming` entry that opens the YouTube relay page

## Optional YouTube Live Relay

Use this flow when you want YouTube live chat comments to enter the existing Gemini chat pipeline:

1. Open `Settings` -> `Streaming` -> `YouTube relay`.
2. Sign in with Google and refresh the broadcast list.
3. Pick the active or upcoming broadcast that should feed the relay.
4. Turn on the relay listener, then enable auto-reply if you want Gemini to answer incoming comments automatically.
5. Stream this app window through YouTube Live Control Room or OBS while the relay page stays available from Settings.

Important notes:

- only new comments received after relay starts are forwarded into Gemini
- comments posted by the stream owner's own account are ignored to prevent reply loops
- the saved Google client ID and short-lived access token are restored from local storage until sign-out or token expiry

See the [YouTube Relay Guide](./youtube-relay.md) for prerequisites, step-by-step setup, and failure cases.

## Docs Shortcut

The app exposes a `Docs` shortcut in the top-right action area.

- local `dev:all` builds send that shortcut to the local docs server
- GitHub Pages builds send it to `/<repo>/docs/`

## What To Watch During Testing

- transcript updates appear before the full turn completes
- audio starts without chunk/fallback errors
- mouth movement remains synchronized with audio playback
- switching voice or model does not break the next turn
