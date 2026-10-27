# Text Case Converter

Convert text between camelCase, snake_case, kebab-case, Title Case, and more.

## Features
- Eight formats shown live at once: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case, Title Case, Sentence case
- Per-format copy buttons
- Multi-line input: each line is converted separately, blank lines kept

## How it works
Entirely client-side. A tokenizer splits on any non-letter/digit character and on
camelCase boundaries (including acronyms: `parseHTTPResponse` → parse, HTTP, Response),
using Unicode property escapes so accented, Greek, Cyrillic, and combining-mark text works.
Known choices: apostrophes are dropped (`don't` → `dont`), digits stay attached to
neighbouring letters, and emoji/symbols act as separators. Title Case capitalizes every
word (no small-word exceptions). Tests: `node text-case-converter/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-27 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
