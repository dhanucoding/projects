# CSV ⇄ JSON Converter

Convert CSV to JSON and back, with header detection and type inference.

## Features
- CSV → JSON with selectable delimiter (comma, semicolon, tab, pipe)
- Header-row toggle (without one, columns are named `column1`, `column2`, …)
- Optional type inference: numbers, booleans, and empty/`null` cells
- Pretty-print toggle, copy button, and download of the result
- JSON → CSV for an array of objects, with optional flattening of nested objects (`address.city`)

## How it works
Entirely client-side, no storage or network calls. CSV is parsed by a small
hand-rolled RFC 4180-style state machine that handles quoted fields, escaped
`""` quotes, and delimiters or newlines inside quotes. Type inference is
deliberately conservative: numbers with leading zeros (zip codes, `007`) and
integers beyond the safe range stay strings. Duplicate header names are
suffixed (`name_2`) so no column is overwritten. Ragged rows are reported in
the status line (missing cells become `null`, extras are dropped). In
JSON → CSV, columns are the union of all keys; arrays and non-flattened objects
are written as JSON strings. Known limitation: the whole input is processed on
the main thread, so very large files may feel slow.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-19 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
