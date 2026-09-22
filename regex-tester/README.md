# Regex Tester

Test a regex against sample text with live match highlighting and group breakdown.

## Features
- Live pattern input with toggleable flags (`g`, `i`, `m`, `s`, `u`)
- Highlighted matches rendered over the sample text
- Match list showing index, full match, and numbered/named capture groups
- Built-in regex syntax cheatsheet
- Inline error banner for invalid patterns

## How it works
Entirely client-side, using native JS `RegExp`. Matching always runs with the
global flag forced on internally so all matches (not just the first) are
found; highlighting is built by walking match indices and escaping text
between them. Zero-length matches are guarded against to avoid infinite loops.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-22 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
