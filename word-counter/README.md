# Word Counter & Readability

Count words, characters, and sentences live, and estimate reading time and grade-level readability.

## Features
- Live counts: words, characters (with and without spaces), sentences, paragraphs, lines, unique words
- Average and longest word
- Reading time (238 wpm) and speaking time (150 wpm)
- Flesch reading ease and Flesch-Kincaid grade level

## How it works
Entirely client-side. Words and characters use `Intl.Segmenter` when available, so CJK text is
segmented, `don't` and `1,000` count as one word, and an emoji family or a letter plus combining
mark counts as one character; a regex fallback covers older browsers. Sentences end at `. ! ? …`
(or CJK `。！？`) followed by whitespace or end of text; decimals, `e.g.`, and common titles
(Mr, Mrs, Ms, Dr, Prof, St, Jr, Sr, vs) don't split. Readability uses a vowel-group syllable
heuristic and is skipped unless at least half the words are Latin-script.
Known limits: initials like `J. K. Rowling` count as extra sentences, `etc.` ends a sentence,
and syllable counts are approximate (e.g. `created` comes out as 2, not 3), so scores are a rough guide.
Tests: `node word-counter/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-11-10 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
