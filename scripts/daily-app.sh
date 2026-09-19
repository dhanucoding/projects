#!/bin/zsh
# Runs headlessly once a day via cron (see ROUTINE_SETUP.md) to ship exactly
# one new mini-app from IDEAS.md onto its own local branch. Never touches
# `main` directly — review and merge by hand.
set -uo pipefail

export PATH="/Users/dchiluv/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

REPO="/Users/dchiluv/dhanucoding/projects"
LOG_DIR="$REPO/.daily-app-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"

cd "$REPO" || exit 1

PROMPT=$(cat <<'EOF'
You're working locally in dhanucoding/projects, a GitHub Pages hub of small
self-contained single-file browser apps. Ship exactly ONE new app today,
following the repo's own conventions. Today's date for naming purposes is
whatever `date +%Y-%m-%d` returns in this shell.

1. Run `git status` on `main`. If it isn't clean (uncommitted changes), stop
   immediately and do nothing else — don't disturb work in progress.
2. Read CONVENTIONS.md, IDEAS.md, and DAILY_LOG.md at the repo root.
3. In IDEAS.md, find the first entry with `status: pending`. If there are
   none, stop and do nothing else (no branch, no commit).
4. Check `git branch --list 'daily-app/*-<today>'` (today's date). If a
   branch for today already exists, stop — this already ran today.
5. Create and check out a new branch named `daily-app/<slug>-<today>` off
   `main`.
6. Scaffold `<slug>/index.html`: a single self-contained HTML file (inline
   CSS/JS, no build step, no external CDN dependencies — hand-roll any small
   algorithm needed). Follow the idea's "notes" field for scope, but keep it
   simple and genuinely useful — do not over-build.
7. Write `<slug>/README.md` using the template in CONVENTIONS.md.
8. Add one new card to the `.grid` in the root `index.html`, matching the
   existing card markup exactly. Don't change anything else about the hub
   page.
9. In IDEAS.md, flip that idea's `status` to `done` and add
   `shipped: <today>`.
10. Add one row to the top of the table in DAILY_LOG.md: date, app name,
    folder, and the branch name (no PR — this is a local-only flow).
11. Commit everything on that branch with a clear message. Do NOT merge into
    main and do NOT push anywhere.
12. Check out `main` again afterward so the working directory is clean and
    ready for tomorrow's run.
13. Print a short final summary: which idea shipped, the folder, the branch
    name, and the exact commands to review (`git diff main..<branch>`) and
    merge (`git checkout main && git merge <branch>`) it.

Do not touch any app folder other than the one you're creating today. If
anything is ambiguous, make the simplest reasonable choice rather than
asking questions — there is no one to answer them right now.
EOF
)

claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --permission-prompts none \
  --allowedTools "Bash(git status:*) Bash(git branch:*) Bash(git checkout:*) Bash(git add:*) Bash(git commit:*) Bash(git log:*) Bash(git diff:*) Bash(date:*) Read Write Edit Glob Grep" \
  --model claude-sonnet-5 \
  --max-budget-usd 3 \
  --output-format text \
  > "$LOG_FILE" 2>&1

echo "Exit code $?" >> "$LOG_FILE"
