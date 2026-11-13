# Cron Expression Builder & Explainer

Build a cron expression with a form, or paste one to get a plain-English explanation and its next run times.

## Features
- Paste an expression and read it in plain English, e.g. `*/15 9-17 * * 1-5` → "Every 15 minutes, from 09:00 through 17:59, Monday through Friday"
- Build field by field (minute, hour, day of month, month, day of week) with live per-field error messages; the expression and the fields stay in sync both ways
- Presets for common schedules
- Next 5, 10, or 20 run times with "in 2 h 5 min" countdowns, in your local time zone or UTC
- Supports `*`, lists, ranges, steps (`*/10`, `0-30/10`, `5/20`), month and weekday names, Sunday as 0 or 7, and the `@yearly` `@monthly` `@weekly` `@daily` `@hourly` shortcuts
- Light and dark colors follow the system theme

## How it works
Entirely client-side, with a small hand-rolled parser. Each field becomes a sorted set of allowed values.
Next runs are found by stepping a wall-clock cursor forward: skip a whole month, day, or hour when it can't
match, then step minutes, so even impossible schedules (like February 30) finish quickly and report "no run in
the next 10 years". When both day-of-month and day-of-week are restricted, a day matches if either does (the
classic Vixie cron rule); a `*/n` day field counts as unrestricted, as in Vixie cron.
Known limits: only the standard 5-field format (no seconds, year, or Quartz `L` `W` `#`; `?` is treated as `*`);
no `@reboot`; the explanation is best-effort wording for common shapes and falls back to listing values for
unusual ones; `*/7` is described as "every 7 minutes" although cron restarts the count each hour. In local time,
a time skipped by a clock change does not appear and a repeated hour appears once, which can differ from how a
particular cron daemon handles daylight-saving changes. The server running your job may use a different time
zone than your browser, so check the zone before relying on the times shown.
Tests: `node cron-explainer/test.js` (sets `TZ=America/Los_Angeles` to exercise daylight-saving cases).

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-11-13 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
