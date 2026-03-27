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

## Docs Shortcut

The app exposes a `Docs` shortcut in the top-right action area.

- local `dev:all` builds send that shortcut to the local docs server
- GitHub Pages builds send it to `/<repo>/docs/`

## What To Watch During Testing

- transcript updates appear before the full turn completes
- audio starts without chunk/fallback errors
- mouth movement remains synchronized with audio playback
- switching voice or model does not break the next turn
