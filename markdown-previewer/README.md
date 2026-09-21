# Markdown Previewer

Paste Markdown, see a live-rendered preview and copy the generated HTML.

## Features
- Split-pane editor and live preview
- Headers, bold/italic, ordered and unordered lists
- Links, inline code, and fenced code blocks
- Blockquotes and horizontal rules
- One-click "Copy HTML" for the rendered output

## How it works
Entirely client-side, no storage. A small hand-rolled Markdown subset parser
walks the input line-by-line for block-level elements (headers, lists,
blockquotes, fenced code, hr) and applies regex-based inline substitutions
(bold, italic, links, inline code) within each block. It does not aim for
full CommonMark coverage — nested lists, tables, and reference-style links
are out of scope.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-18 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
