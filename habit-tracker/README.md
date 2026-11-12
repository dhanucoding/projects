# Habit Tracker

Track daily habits with a checklist, streak counters, and a calendar heatmap.

## Features
- Add habits and check them off for today with one click
- Per-habit current streak, best streak, and 30-day completion rate
- Summary tiles: done today, longest current streak, total check-ins
- 26-week heatmap like a mini GitHub contribution graph: "All habits" shows the share of habits done each day, or pick one habit and click any past day to mark or unmark it
- Light and dark colors follow the system theme

## How it works
Entirely client-side. Habits and check-ins are saved in `localStorage` (key `habit-tracker-v1`) and
validated on load, so corrupt or hand-edited data falls back to an empty state instead of breaking the page.
Days are local calendar days, and day arithmetic goes through UTC so daylight-saving changes never skip or
repeat a day. A streak counts consecutive checked days ending today; if today isn't checked yet it still
counts through yesterday, so it only breaks once a whole day is missed. The heatmap is Sunday-first with today
in the last column, and a habit doesn't count against days before it was created. The page rolls over to the
new day on its own if left open past midnight.
Known limits: future days can't be checked; habit names are capped at 60 characters, with at most 50 habits
and about 10 years of check-ins per habit; data lives only in this browser (no sync or export).
Tests: `node habit-tracker/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-11-12 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
