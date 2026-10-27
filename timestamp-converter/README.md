# Timestamp / Epoch Converter

Convert between Unix epoch, ISO 8601, and human-readable local/UTC time.

## Features
- Live "current time" ticker (epoch seconds, epoch milliseconds, ISO 8601, local) with copy buttons
- Single-value converter that auto-detects seconds, milliseconds, microseconds, nanoseconds, ISO 8601, or free-form date strings
- Output in epoch (s/ms), ISO 8601 UTC, UTC string, local time, any IANA timezone, and a relative "x ago / in x" description
- Batch conversion of many pasted timestamps into a table, with Copy as CSV

## How it works
Entirely client-side, no storage or network calls. Numeric input is classified
by magnitude (under 1e11 → seconds, under 1e14 → milliseconds, under 1e17 →
microseconds, otherwise nanoseconds). Other text goes through the native `Date`
parser; date strings without an explicit timezone are interpreted in the
browser's local timezone, and the detected-as label says so. Time zone
formatting uses `Intl.DateTimeFormat`; the zone list comes from
`Intl.supportedValuesOf('timeZone')`. Known limitations: free-form date parsing
is engine-dependent for unusual formats, and sub-millisecond precision from
microsecond/nanosecond inputs is truncated.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-10-20 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
