# Daily App Routine — Local Cron Setup

The daily app-generation routine runs **locally** via `cron`, invoking Claude
Code headlessly (`claude -p ...`) once a day. It creates a new branch,
scaffolds one app from `IDEAS.md`, and commits — it never pushes or merges
into `main`. You review the branch's diff and merge it yourself.

## How it works

- `scripts/daily-app.sh` is the entry point cron calls.
- It runs `claude -p` non-interactively with:
  - `--permission-mode acceptEdits` + `--permission-prompts none` so the run
    never blocks waiting on a prompt with nobody there to answer it —
    anything not explicitly allowed is auto-denied instead of hanging.
  - `--allowedTools` scoped to just `git status/branch/checkout/add/commit/log/diff`
    plus the file tools (`Read Write Edit Glob Grep`) — no arbitrary shell
    access, no push, no network calls.
  - `--max-budget-usd 3` as a cost cap in case something loops.
- Output is logged to `.daily-app-logs/<date>.log` (git-ignored) so you can
  see what happened even if you don't check in right away.
- The prompt itself (embedded in the script) tells Claude to bail out with no
  changes if `main` isn't clean, if today's branch already exists, or if the
  `IDEAS.md` backlog is exhausted — so it's safe to leave running indefinitely.

## One-time setup: register the cron job

Cron uses your Mac's local system clock, so an 11:30 AM entry stays correct
across the PST/PDT switch automatically (unlike a fixed-UTC cloud schedule).

Add this line to your crontab (`crontab -e`, or ask Claude Code to do it —
it will show you the exact line before touching your crontab, since editing
a user's crontab is a persistent system change):

```
30 11 * * * /Users/dchiluv/dhanucoding/projects/scripts/daily-app.sh
```

Notes:
- This is a plain macOS `cron` job. It will **not** fire if your Mac is
  asleep at 11:30 AM (laptops closed overnight, etc.) — cron just skips that
  run, it doesn't queue it for later. If that turns out to be a problem in
  practice, switch to a `launchd` agent instead (a `.plist` with
  `StartCalendarInterval`), which behaves the same way but can be configured
  to catch up missed runs; ask Claude Code to convert it if needed.
- No special macOS permissions are needed since `/Users/dchiluv/dhanucoding`
  isn't one of the specially protected folders (Desktop/Documents/Downloads/
  iCloud). If you ever move the repo under one of those, cron would need
  "Full Disk Access" granted in System Settings → Privacy & Security.
- Requires you to already be logged into Claude Code on this machine
  (`claude` CLI auth) — the cron job runs as your user and reuses that.

## Reviewing a day's output

```
git branch --list 'daily-app/*'          # see what's pending review
git log daily-app/<slug>-<date> -1 -p    # see the actual diff
git diff main..daily-app/<slug>-<date>   # same, as a diff
git checkout main && git merge daily-app/<slug>-<date>   # accept it
git branch -d daily-app/<slug>-<date>    # clean up after merging
```

If a day's app isn't good enough, just leave the branch unmerged (or delete
it with `git branch -D ...`) — the idea stays marked `done` in `IDEAS.md`
either way, so add a new entry back to the backlog by hand if you want it
retried.

## Cloud alternative (not currently set up)

An earlier draft of this used a scheduled **cloud** routine (via
`/schedule`) that would open a GitHub PR instead of a local branch. That
requires connecting GitHub to your Claude account at
https://claude.ai/connect-github first. If you'd rather have it open PRs
against `dhanucoding/projects` from the cloud instead of running locally,
connect GitHub and ask Claude Code to set that up — the routine prompt is
nearly identical, just add `gh pr create` at the end instead of stopping
after the local commit.
