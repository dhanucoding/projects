# Text Diff Checker

Compare two blocks of text and highlight line- and word-level differences.

## Features
- Side-by-side or unified diff view, toggled with one click.
- Word-level highlighting inside changed lines, not just whole-line add/remove.
- Swap button to flip original/changed, and a built-in example to try instantly.
- Live stats summary (lines added / removed / modified).

## How it works
Entirely client-side, no build step or dependencies. Line-level diffing uses a
hand-rolled LCS (longest common subsequence) algorithm over the two texts'
lines; consecutive delete/insert runs of matching length are paired up as
"modified" lines and re-diffed at the word/token level (via the same LCS
routine) to highlight exactly what changed within the line. Rendering
re-runs on every keystroke (debounced ~150ms).

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-28 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
