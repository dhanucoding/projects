# Repo Conventions

This repo is a GitHub Pages "hub" of small, self-contained browser apps. `index.html`
at the root is the front door and links out to each app. This file documents the
pattern so every new app (hand-written or auto-generated) stays consistent.

## Folder & file layout

- One folder per app, named in kebab-case (e.g. `markdown-previewer/`).
- The app itself lives at `<slug>/index.html` — a **single self-contained file**:
  inline `<style>` and `<script>`, no build step, no bundler, no external CDN
  dependency (matches `kanban/` and `jsonFormatter/`). If a small algorithm is
  needed (e.g. QR encoding, a markdown parser), hand-roll a minimal version
  inline rather than pulling in a library.
- Each app folder also gets a `README.md` (template below).
- Persisted data (if any) uses `localStorage`/`IndexedDB` client-side — no backend.

## Visual style

- The root `index.html` hub keeps its current warm, light card-grid theme —
  don't change that without being asked.
- Individual apps are free to pick whatever internal theme suits the tool
  (e.g. `jsonFormatter` uses a dark dev-tool palette). Consistency is only
  required at the hub-card level, not inside every app.

## Adding an app to the hub

Add one `<a class="card ...">` entry to the `.grid` in root `index.html`,
following the existing markup: a `tag` (`tag-live` / `tag-alt` / `tag-soon`),
an `<h3>` title, a one-sentence `<p>` description, and a `.meta` row. Use
`card-secondary` for new tools unless told otherwise.

## Per-app README.md template

```markdown
# <App Name>

<One-sentence description.>

## Features
- <bullet per key feature>

## How it works
<Short implementation notes — what's client-side-only, any notable algorithm
or storage choice, and known limitations.>

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated <YYYY-MM-DD> as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
```

## Daily app-generation routine

A local cron job runs `scripts/daily-app.sh` once a day, which invokes Claude
Code headlessly to ship exactly one new app:

1. Read `IDEAS.md`, take the first entry with `status: pending`.
2. Scaffold `<slug>/index.html` + `<slug>/README.md` per the conventions above.
3. Add a hub card for it in root `index.html`.
4. Flip that idea's `status` to `done` in `IDEAS.md` and record the ship date.
5. Log the shipped app in `DAILY_LOG.md`.
6. Commit everything on a new local branch (`daily-app/<slug>-<date>`). It
   does **not** push or merge into `main` — you review the branch's diff and
   merge it yourself whenever you're happy with it.

See `IDEAS.md` for the backlog, `DAILY_LOG.md` for what's already shipped,
and `ROUTINE_SETUP.md` for how the cron job itself is configured.
