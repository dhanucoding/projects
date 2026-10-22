# UUID Generator

Generate v4 (random) and v7 (time-ordered) UUIDs in bulk.

## Features
- v4 and v7 UUIDs, 1–1000 per batch
- Uppercase, hyphen, and brace formatting options
- Copy-all button

## How it works
Entirely client-side. Randomness comes from `crypto.getRandomValues`. v7 follows
RFC 9562: a 48-bit millisecond timestamp plus random bits, with the 12-bit `rand_a`
field used as a counter so UUIDs generated within the same millisecond (or if the
clock steps backwards) still sort in generation order. Tests: `node uuid-generator/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-21 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
