# Pomodoro Timer

A focus timer with work/break intervals, a running task list, and session streaks.

## Features
- Focus, short-break, and long-break intervals (default 25/5/15, long break every 4th session), all adjustable
- Start / pause / resume, reset, and skip
- Task list: add, check off, delete, and pick a task to credit finished sessions to
- Progress: sessions and focus time today, current and best day streak, all-time sessions
- Browser notification and a short beep when an interval ends; remaining time shown in the tab title

## How it works
Entirely client-side. The timer stores an end timestamp rather than counting ticks, so it stays
accurate when the tab is throttled in the background. Settings, tasks, and history are saved in
`localStorage` (key `pomodoro-timer-v1`) and validated on load, so corrupt or hand-edited data
falls back to defaults instead of breaking the page. The beep uses the Web Audio API (no audio
files). Days are local calendar days; streaks count consecutive days with at least one completed
focus session and still count through yesterday until you finish one today.
Known limits: a session is only recorded when the interval runs to zero (skip and reset never
credit one); closing the tab mid-interval loses that interval; notifications need permission,
which is requested on the first Start; history is capped at 2,000 sessions and tasks at 200.
Tests: `node pomodoro-timer/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-11-11 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
