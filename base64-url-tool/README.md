# Base64 / URL Encoder-Decoder

Encode or decode text as Base64 or URI components.

## Features
- Toggle between Base64 and URL-component encoding
- Encode or decode direction, with live two-way conversion as you type in either pane
- Correct UTF-8 handling for Base64 (not just Latin1)
- Copy buttons for both panes, inline error display on invalid input

## How it works
Entirely client-side, no storage or network calls. Base64 encoding runs text
through `TextEncoder` to get UTF-8 bytes before `btoa`, and decoding reverses
that with `atob` + `TextDecoder` so non-ASCII text round-trips correctly.
URL-component mode uses the native `encodeURIComponent` / `decodeURIComponent`.
Typing in either textarea re-derives the other; invalid input (malformed
Base64 or a broken `%` escape) shows an inline error instead of throwing.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-05 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
