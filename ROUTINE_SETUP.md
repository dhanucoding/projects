# Daily App Routine — Manual Trigger (for now)

**Current status: manual only.** There is no cron/launchd job installed —
just ask Claude Code to run `scripts/daily-app.sh` and it'll ship the day's
app. It creates a new branch, scaffolds one app from `IDEAS.md`, and
commits — it never pushes or merges into `main`. You review the branch's
diff and merge it yourself.

## Why manual right now

A `cron` job was tried and removed. `cron` runs outside your logged-in GUI
session, so it can't read the Claude Code login stored in macOS Keychain
(`Claude Code-credentials`) — every cron-triggered run failed immediately
with `Not logged in · Please run /login`, even though the crontab entry
itself was firing correctly. The fix is to switch to a `launchd`
LaunchAgent instead (see below) — that wasn't done yet, so for now the
routine is triggered by hand, which always runs with your already-logged-in
session and works fine.

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

## Triggering it manually

Just ask Claude Code (or run directly):

```
/Users/dchiluv/dhanucoding/projects/scripts/daily-app.sh
```

It auto-guards against re-running the same day (checks for a
`daily-app/<slug>-<today>` branch) and against a dirty `main`, so it's safe
to trigger more than once without double-shipping.

## Re-enabling automatic scheduling later (launchd, not cron)

If you want this automatic again, use a `launchd` LaunchAgent (a `.plist`
in `~/Library/LaunchAgents/`, loaded via `launchctl`), not `cron` — plain
`cron` is what hit the Keychain problem above. A `launchd` **user** agent
runs inside your session and has normal Keychain access, and as a bonus it
also catches up a run that was missed because the Mac was asleep at the
scheduled time (`cron` just silently skips it). Ask Claude Code to set this
up when you're ready; no code changes needed, `scripts/daily-app.sh` stays
the same.

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
