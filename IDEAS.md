# Daily App Ideas Backlog

Consumed top-down by the daily app-generation routine (see `CONVENTIONS.md`).
The routine always takes the first entry with `status: pending`. Reorder,
edit, delete, or add entries by hand any time — nothing here is fixed order
for any reason other than "top of the list goes next."

When an idea ships, flip its `status` to `done` and add `shipped:` (date) and
`pr:` (link) fields.

---

1. status: done
   slug: markdown-previewer
   name: Markdown Previewer
   one-liner: Paste Markdown, see a live-rendered preview and copy the generated HTML.
   notes: Hand-roll a small markdown subset (headers, bold/italic, lists, links, code, blockquote, quote). Split-pane layout like jsonFormatter.
   shipped: 2026-09-18

2. status: done
   slug: regex-tester
   name: Regex Tester
   one-liner: Test a regex against sample text with live match highlighting and group breakdown.
   notes: Use native JS RegExp; show flags toggle, match list with capture groups, and common syntax cheatsheet.
   shipped: 2026-09-22

3. status: skipped
   slug: mermaid-viewer
   name: Mermaid Diagram Viewer
   one-liner: Paste Mermaid syntax (flowcharts, sequence diagrams, class diagrams, etc.) and see it rendered live.
   skipped: 2026-09-28
   skipped-reason: The daily routine runs with no network tools (allowedTools is git + file tools only), so it
     can't download mermaid.js to vendor inline. Needs the library fetched by hand first, then flip back to
     `pending`. Left in place rather than deleted so the plan isn't lost.
   notes: EXCEPTION to the usual "hand-roll it" guardrail — Mermaid's parser/layout engine is too large to
     reasonably hand-roll. Vendor the real mermaid.js: download its minified UMD/IIFE build and paste the
     source directly into index.html as an inline <script> (not a CDN <script src> — must still work
     offline/single-file). Split-pane like jsonFormatter (source textarea left, rendered SVG right), live
     re-render on input (debounced), inline error display on invalid syntax, and an export-as-SVG/PNG button.
     Keep a couple of example diagrams (one flowchart, one sequence diagram) pre-filled so it's obviously
     working on first load.

4. status: done
   slug: diff-checker
   name: Text Diff Checker
   one-liner: Compare two blocks of text and highlight line/word-level differences.
   notes: Implement a simple LCS-based diff algorithm inline; side-by-side or unified view toggle.
   shipped: 2026-09-28

5. status: done
   slug: color-tools
   name: Color Converter & Contrast Checker
   one-liner: Convert between HEX/RGB/HSL and check WCAG contrast ratios for a foreground/background pair.
   notes: Include a live swatch preview and pass/fail badges for AA/AAA text sizes.
   shipped: 2026-09-28

6. status: done
   slug: unit-converter
   name: Unit Converter
   one-liner: Convert length, weight, temperature, and volume between common units.
   notes: Static conversion tables, grouped tabs per category, instant two-way conversion as you type.
   shipped: 2026-09-30

7. status: done
   slug: base64-url-tool
   name: Base64 / URL Encoder-Decoder
   one-liner: Encode or decode text as Base64 or URI components.
   notes: Two-way live conversion, handle UTF-8 correctly (not just Latin1), copy buttons.
   shipped: 2026-10-05

8. status: done
   slug: password-generator
   name: Password Generator & Strength Checker
   one-liner: Generate strong random passwords and estimate the strength of a typed one.
   notes: Use crypto.getRandomValues for generation; entropy-based strength meter, no data leaves the browser.
   shipped: 2026-10-13

9. status: pending
   slug: csv-json-converter
   name: CSV ⇄ JSON Converter
   one-liner: Convert CSV to JSON and back, with header detection and type inference.
   notes: Handle quoted fields/commas correctly; pretty-print JSON output; download button for the result.

10. status: pending
    slug: timestamp-converter
    name: Timestamp / Epoch Converter
    one-liner: Convert between Unix epoch, ISO 8601, and human-readable local/UTC time.
    notes: Live "current time" ticker, batch conversion of multiple pasted timestamps.

11. status: pending
    slug: uuid-generator
    name: UUID Generator
    one-liner: Generate v4 (random) and v7 (time-ordered) UUIDs in bulk.
    notes: crypto.getRandomValues-based; adjustable batch count; copy-all button.

12. status: pending
    slug: text-case-converter
    name: Text Case Converter
    one-liner: Convert text between camelCase, snake_case, kebab-case, Title Case, and CONSTANT_CASE.
    notes: Word-boundary tokenizer that handles mixed input case; live preview of all formats at once.

13. status: pending
    slug: jwt-decoder
    name: JWT Decoder
    one-liner: Decode a JWT's header and payload for inspection (no signature verification).
    notes: Clearly label that it does not verify signatures — decode-only, entirely client-side, never send the token anywhere.

14. status: pending
    slug: word-counter
    name: Word Counter & Readability
    one-liner: Count words/characters/sentences and estimate reading time and grade-level readability.
    notes: Implement a simple Flesch-Kincaid style estimate; live stats as you type.

15. status: pending
    slug: pomodoro-timer
    name: Pomodoro Timer
    one-liner: A focus timer with work/break intervals and a running task list.
    notes: localStorage for session history/streaks; browser notification + sound on interval end.

16. status: pending
    slug: habit-tracker
    name: Habit Tracker
    one-liner: Track daily habits with a checklist and streak counters.
    notes: localStorage-backed, calendar-style heatmap view like a mini GitHub contribution graph.

17. status: pending
    slug: cron-explainer
    name: Cron Expression Builder & Explainer
    one-liner: Build a cron expression with a form, or paste one to get a plain-English explanation.
    notes: Hand-roll a small cron parser; show next N run times.

18. status: pending
    slug: gradient-generator
    name: CSS Gradient & Box-Shadow Generator
    one-liner: Visually build a CSS gradient or box-shadow and copy the generated CSS.
    notes: Live preview canvas, multiple color stops, copyable CSS snippet output.

19. status: pending
    slug: qr-code-generator
    name: QR Code Generator
    one-liner: Turn text or a URL into a downloadable QR code.
    notes: Hand-roll a minimal QR encoding implementation (or a compact inlined algorithm) — no external CDN; render to <canvas>, add PNG download.

20. status: pending
    slug: timezone-overlay
    name: Meeting Time Zone Overlay
    one-liner: Pick a time and see it converted across several time zones at once, for scheduling meetings.
    notes: Use Intl.DateTimeFormat with timeZone option; draggable time slider showing working-hours overlap.

21. status: pending
    slug: name-picker
    name: Random Picker & Shuffler
    one-liner: Paste a list of names/items and randomly pick one or shuffle the order.
    notes: Fun spinner-wheel or slot-style animation; useful for standup order, raffle picks, etc.

22. status: pending
    slug: bill-splitter
    name: Bill Splitter & Tip Calculator
    one-liner: Split a bill across people with tip and tax, including uneven splits.
    notes: Support per-person item assignment, not just even split; show per-person owed amount.

23. status: pending
    slug: cipher-toolkit
    name: Cipher Toolkit
    one-liner: Encode/decode text with classic ciphers — Caesar, ROT13, and Morse code.
    notes: Playful/educational utility; live two-way conversion with adjustable Caesar shift.

24. status: pending
    slug: flashcards
    name: Flashcard Study App
    one-liner: Create flashcard decks and study them with a simple spaced-repetition flow.
    notes: localStorage-backed decks; basic Leitner-box style scheduling (a few buckets, not full SM-2).

25. status: pending
    slug: sticky-notes-board
    name: Sticky Notes Board
    one-liner: A freeform corkboard of draggable, resizable sticky notes for quick scratch thoughts.
    notes: localStorage-backed positions/content; simple drag via pointer events, no library.

26. status: pending
    slug: standup-notes
    name: Daily Standup Notes Generator
    one-liner: Fill in yesterday/today/blockers and get a formatted standup message ready to paste into chat.
    notes: localStorage keeps a running history by date; one-click copy of the formatted message.
