# How to cut a release

This is the checklist for shipping a version of CB Index Analyzer. Follow it in order. The version string must be the same in every place listed below — `npm test` includes a guard that fails the suite if they drift.

Current version lives in `package.json` (`"version"`). That is the source of truth for the number. HTML also has a copy of it so the UI works when `index.html` is opened as a file (no server, no `package.json`).

## 1. Pick the version number

Semver `MAJOR.MINOR.PATCH` (and an optional `-N` suffix for a hot-fix on the same patch, e.g. `2.5.2-1`):

| Bump | When |
|---|---|
| **PATCH** (`2.6.2` → `2.6.3`) | Bug fix, copy, rename, tiny UI tweak. |
| **MINOR** (`2.6.2` → `2.7.0`) | New user-visible feature (new card, new index type, new tab behavior). |
| **MAJOR** (`2.7.0` → `3.0.0`) | Breaking change to saved JSON, URLs, or how users collect stats. |
| **Suffix** (`2.5.2` → `2.5.2-1`) | Emergency fix on a version already shipped that same day / already tagged in notes. |

Do not skip a number. Do not reuse a number that already has a `## vX.Y.Z` heading in `release_notes.md`.

## 2. Finish the code on a branch

Work on `issue/<n>` while implementing. When the feature is ready to ship, create (or rename to) `release-X.Y.Z` from up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b release-X.Y.Z
# or, if you already have a feature branch:
git checkout issue/45-69
git branch -m release-X.Y.Z
git merge origin/main   # if main moved
```

Keep the branch name matching the version you are about to stamp.

## 3. Release testing

Run the automated suite **before** you touch version strings, then again **after**:

```bash
npm test
```

That runs Jest across `tests/*.test.js` (pure parsers, rebalance, estimator, duplicate finder, server, version sync). All tests must pass.

Then smoke the UI the way a user would:

1. `docker compose up --build` (or `npm start`) and open http://localhost:3000.
2. Confirm the navbar badge reads **vX.Y.Z** and click it — the popover must show this release’s date and highlights, plus a working “Full release notes” link.
3. Paste `system:indexes` JSON → System Indexes tab renders.
4. Paste at least two index-node `/api/v1/stats` dumps → Stats API, Analysis, Duplicate Finder, Optimizer all render.
5. Analysis → **Memory Residency by Node** card is present when stats are loaded.
6. If you have a partitioned-index dump: **Part** badge on the name, Unique Only does not drop other nodes’ slices, Optimizer shows the partitioned-index info banner and does not emit an `ALTER INDEX` that changes node count.
7. Open `index.html` directly as a file (no Docker). Badge and popover still work.

If anything fails, fix it on this branch before writing release notes.

## 4. Stamp the version in code

Replace **every** previous version string with the new one. The files:

| File | What to change |
|---|---|
| `package.json` | `"version": "X.Y.Z"` |
| `index.html` | `APP_VERSION`, `APP_RELEASE_DATE`, `APP_RELEASE_HIGHLIGHTS` (near the top of the main `<script>`). Also the fallback text on `#app-version-badge` (`vX.Y.Z`) so the badge is correct before JS runs. |
| `README.md` | The **Current Release** line: `**vX.Y.Z** — See [release notes](release_notes.md)...` |
| `release_notes.md` | New `## vX.Y.Z (YYYY-MM-DD)` section at the **top** (see next step). |
| `server.js` | No hardcoded version — it reads `package.json` at listen time. Do not add a second copy here. |

`APP_RELEASE_HIGHLIGHTS` is the short list that appears when someone clicks the navbar version badge. Keep it to 1–4 bullets, user-facing, no file paths.

After editing, run:

```bash
npm test
```

`tests/version.test.js` asserts `package.json`, the HTML `APP_VERSION` + badge, `README.md`, and the latest `release_notes.md` heading all match. If it fails, a file was missed.

## 5. Write `release_notes.md`

Insert a new section **above** the previous release. Match the existing voice:

```markdown
## vX.Y.Z (YYYY-MM-DD)

### New Features

- **Short title** — What the user can do now. Link issues as `#45`.

### Fixes

- **Short title** — What was wrong and what we did. `#69`.

### Stats

- **Files changed:** N (`file1`, `file2`, ...)
- Updated version badge to vX.Y.Z.
```

Rules:

- Date is the ship date (`YYYY-MM-DD`).
- Every user-visible change that landed since the last `## v…` heading belongs here, even if it shipped on a feature branch first.
- Link GitHub issues with `#N` so the notes are clickable on GitHub.
- Do not rewrite older sections.

## 6. Commit, PR, close tickets

Two commits is the usual shape (feature first, then the version stamp). One commit is fine for a tiny patch.

```bash
git add -A
git status   # confirm no data/*.json or node_modules
git commit -m "release-X.Y.Z"
git push -u origin release-X.Y.Z
```

Open the PR against `main`:

```bash
gh pr create --base main --head release-X.Y.Z \
  --title "Release X.Y.Z" \
  --body "$(cat <<'EOF'
Release vX.Y.Z

- <one-line summary of each highlight>

Closes #N
Closes #M
EOF
)"
```

**Closing tickets:** put `Closes #N` (one per issue) in the PR body. GitHub closes those issues when the PR **merges** into `main`. Do not close them by hand before merge — if the PR is rejected the tickets must stay open.

After merge, optional local cleanup:

```bash
git checkout main
git pull origin main
git branch -d release-X.Y.Z
```

There is no git tag step in this repo today. If you add tags later, tag `vX.Y.Z` on the merge commit on `main`.

## Quick copy-paste

```bash
npm test
# edit package.json, index.html (APP_VERSION + highlights + badge), README.md, release_notes.md
npm test
git checkout -b release-X.Y.Z   # if not already on it
git add package.json index.html README.md release_notes.md
git commit -m "release-X.Y.Z"
git push -u origin release-X.Y.Z
gh pr create --base main --title "Release X.Y.Z" --body "Closes #N"
```
