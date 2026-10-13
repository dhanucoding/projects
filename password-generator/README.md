# Password Generator & Strength Checker

Generate strong random passwords and estimate the strength of a typed one.

## Features
- Adjustable length (8–64) and character sets (lowercase, uppercase, digits, symbols)
- Option to exclude look-alike characters (O/0, l/1/I)
- Copy and regenerate buttons, live entropy-based strength meter
- Separate "Check strength" tab with show/hide toggle and improvement tips

## How it works
Entirely client-side, no storage or network calls. Passwords are generated with
`crypto.getRandomValues` using rejection sampling to avoid modulo bias, with one
character guaranteed from each selected set and a Fisher–Yates shuffle. Strength
is estimated as `length × log2(pool size)` bits, with penalties for common words,
repeated characters, easy sequences, and low character variety. This is a rough
heuristic, not a guarantee, and does not check against breach databases.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-13 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
