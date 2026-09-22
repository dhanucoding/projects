# Regex Tester

Test a regex against sample text with live match highlighting and group breakdown.

## Features
- Live pattern input with toggleable flags (`g`, `i`, `m`, `s`, `u`)
- Highlighted matches rendered over the sample text
- Match list showing index, full match, and numbered/named capture groups
- Live "What this pattern matches" plain-English breakdown as you type
- Built-in regex syntax cheatsheet
- Inline error banner for invalid patterns

## How it works
Entirely client-side, using native JS `RegExp`. Matching always runs with the
global flag forced on internally so all matches (not just the first) are
found; highlighting is built by walking match indices and escaping text
between them. Zero-length matches are guarded against to avoid infinite loops.

The plain-English explanation is produced by a small hand-rolled
recursive-descent parser (groups, alternation, character classes, escapes,
quantifiers, anchors, look-around) that turns the pattern into a tree and
flattens it into indented description lines. It's a best-effort explainer,
not a validator — the native `RegExp` constructor is still what decides
whether a pattern is actually valid (surfaced via the error banner).

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-22 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
