---
name: git-workflow
description: Governs all git operations — branching, committing, pushing, PRs, and releases. Activates whenever the user asks to work on a feature, ship changes, commit, create a PR, release, or any git-related action. Also activates proactively when code changes are ready to be committed.
argument-hint: "[optional: ticket ID like XCA-74, or action like 'ship', 'release']"
---

# Git Workflow

This skill defines how code moves from local changes to production in xcale-backend. Follow this methodology for every git operation — whether the user explicitly says "ship" or naturally says "let's work on feature X" or "commit this".

## Roles (two-dev model — decided 2026-06-11)

| Role | Who | May do | May NOT do |
|:--|:--|:--|:--|
| **Release owner** | Mateo (`matesjara`) | Everything below + **merge to `dev` and `main`** + Release | — |
| **Contributor** | Juan José (`JuanJo0775`) | Start Working + Ship: branch from `dev` (or from his own branches as a working technique), open PRs **to `dev`**, write + run his feature's QA scenarios | Merge any PR (incl. his own) · push directly to `dev`/`main` · Release |

- **Every PR targets `dev`** — no stacked PRs (PR into another work branch). A big feature ships as ordered vertical slices, each PR'd to `dev`, not as a PR tower.
- **No self-merge, ever.** The PR author never merges their own PR.
- Enforcement is convention + a CI guard (a direct push to `dev` by anyone but the release owner turns CI red — detection, not prevention). If it recurs, escalate to GitHub Pro branch protection.
- Start Working and Ship apply to **both** devs. Review & Merge and Release are **release-owner only**.

## When to Activate

- User asks to work on a feature, task, or bug fix → **start a branch**
- User says "ship", "commit", "push", "done", "send it" → **ship workflow**
- User asks to review an incoming/contributor PR ("revisa el PR de Juan") → **review & merge workflow**
- User asks to deploy, release, or promote to production → **release workflow**
- User asks to create a PR → **ship workflow** (PR is part of shipping)
- User asks to clean up, tidy branches, or after a PR merge → **cleanup workflow**
- You finish implementing a feature and the user hasn't committed yet → **suggest shipping**

## Branch Strategy

```
feat/XCA-74-desc  ──PR──▶  dev  ──PR(release)──▶  main (production)
hotfix/auth-crash  ──PR──────────────────────────▶  main (bypasses dev)
```

| Branch            | Purpose                                                     | Receives PRs from                  |
| ----------------- | ----------------------------------------------------------- | ---------------------------------- |
| **`main`**        | Production. DO App Platform auto-deploys (`xcale-backend`). | `dev` (via release) or `hotfix/*`  |
| **`dev`**         | Integration/staging. Quality gate before production.        | `feat/*`, `fix/*`, `chore/*`, etc. |
| **Work branches** | One per task. Short-lived.                                  | —                                  |
| **`hotfix/*`**    | Critical production fixes. Branch from `main`.              | —                                  |

See [references/branch-strategy.md](references/branch-strategy.md) for naming conventions and detailed flow.

## Five Workflows

### 1. Start Working (`feat`, `fix`, `chore`, etc.)

When the user begins work on a task:

1. **Clean first**: `git fetch --prune` and delete stale local branches (see Cleanup workflow)
2. **Soak sweep**: scan `docs/design/*/ship-log.md` for any with `Status: in-soak` whose
   `Released to prod:` date is past the soak window. For each, surface it: *"`<slug>` has been
   in prod since `<date>` — anything still pending, or are we good to finalize the ship-log and
   archive it?"* This is where post-release follow-up gets closed (don't silently skip it). See
   [references/promote-docs.md](references/promote-docs.md).
3. Ensure `dev` is up to date: `git checkout dev && git pull origin dev`
4. Create a branch: `git checkout -b feat/XCA-74-short-description`
5. Begin implementation

If the user is already on a feature branch, just continue working — no branch creation needed.

### 2. Ship (commit + push + PR)

When changes are ready to ship:

1. **Type check**: `npm run type-check` — **STOP if it fails**
2. **Lint**: `npm run lint` — **STOP if it fails**
3. **Analyze**: `git diff --stat` — understand intent, check for secrets
4. **Ship-log checkpoint (Gate 1)**: if the change ships a feature with a folder in
   `docs/design/<slug>/`, ensure a `docs/design/<slug>/ship-log.md` exists (create it from
   [references/ship-log-template.md](references/ship-log-template.md) if not). Record the
   dev-side ops now — migration on dev (`✅`/`N/A`), and open the manual-QA section. Do **not**
   archive here — archival is a Release step, after the prod soak. Mark items `✅ done (date)` /
   `⬜ pending` / `N/A (reason)`; only `⬜` items are worth flagging. See `docs/README.md`.
5. **ADR numbering checkpoint**: if the branch added any **unnumbered** ADR (`docs/adr/<slug>.md`, no `NNNN-` prefix), run `npm run adr:number -- --apply` so its number is minted against `dev` right before merge — this is the guard against two branches colliding on the same number. (No-op if there are none.) See `.claude/skills/adr/SKILL.md`.
6. **QA evidence (feature PRs)**: if Gate 1 applied (feature with a design folder / new or
   changed API surface), the QA scenarios (`.claude/skills/qa/scenarios/<target>.md`) must exist
   and have run **green on dev** — the author writes and runs them (QA is part of delivering the
   feature, not the reviewer's favor). Attach the result summary to the PR description.
7. **Stage**: `git add <specific files>` — never `git add .`
8. **Commit**: Conventional format with Co-Authored-By footer
9. **Push**: `git push -u origin <branch>`
10. **PR**: `gh pr create --base dev` (or `--base main` for hotfixes)

**Do not merge the PR automatically.** Creating the PR is where Ship ends — for everyone. The PR
author **never** merges their own PR: a contributor's PR waits for the release owner's Review &
Merge workflow (below); the release owner's own PRs still require their explicit "merge it".

See [references/commit-conventions.md](references/commit-conventions.md) for commit format and safety rules.

### 3. Review & Merge (incoming PR) — release owner only

When a PR into `dev` is ready for review (the user says "review Juan's PR", "revisa el PR", or a
contributor PR is pending). The gate has **two levels**:

**Level 1 — every PR, including chores:**
1. **CI green** (differential lint, type-check, tests, build). Never review a red PR — send it back first.
2. **`code-reviewer` agent over the PR diff** (`gh pr diff <n>` as input) — **zero open Blockers**.
   Majors/Minors are judgment calls: request changes or accept-and-roadmap them, explicitly.
3. **The human reads the diff.** The agent advises; the release owner owns the verdict.

**Level 2 — feature PRs** (design folder in `docs/design/<slug>/`, or new/changed API surface), additionally:
4. **Ship-log exists** (`docs/design/<slug>/ship-log.md`) with dev-side ops recorded (Ship Gate 1).
5. **QA scenarios green on dev** — written and run by the PR author, result attached in the PR
   description. The reviewer may re-run them (`/qa <target>`) when in doubt.

**Verdict**: merge (release owner only), or request changes citing the specific gate items that
failed. After merging: run the Cleanup workflow. If anything was accepted-with-debt, park it in
`docs/design/roadmap.md` in the same breath.

### 4. Release (dev → main)

When `dev` is stable and ready for production:

1. **Ship-log gate (Gate 2)**: for each feature shipping in this release, its
   `docs/design/<slug>/ship-log.md` must have the **manual-QA loop closed** (no open
   adjustments) and **dev ops complete**. Surface any `⬜ pending` items before proceeding —
   a feature with an open QA loop is not ready for prod.
2. Generate changelog from commits on `dev` not on `main`
3. Create PR from `dev` to `main` with grouped changelog
4. User merges manually after review
5. **Post-deploy (prod ops)**: after `main` deploys, run prod migrations, smoke-verify, and
   record these in each ship-log; set `Status: in-soak` + `Released to prod: <date>`. The
   design folder **stays** in `docs/design/` through the soak — it is **not** archived now.
6. **Archival (after soak)**: archival happens later, once the feature has soaked with no open
   follow-ups — driven by the **Start Working** soak sweep, not by the merge. Procedure:
   [references/promote-docs.md](references/promote-docs.md).

> **Why archival is decoupled from the merge:** prod ops are only knowable *after* deploy, and a
> released feature needs a soak window before it's truly done. Archiving at merge would freeze
> the ship-log with empty prod facts. See ADR `post-build-ship-log-and-release-archival`.

See [references/release-process.md](references/release-process.md) for full process.

### 5. Cleanup (keep local and remote tidy)

Branches are short-lived. After a PR is merged, the branch should be deleted — both locally and on GitHub. This workflow runs:

- **Proactively** after a successful ship + merge cycle
- **On request** when the user says "clean up", "tidy branches", or similar
- **At the start of a new task** to ensure a clean working state

**Steps:**

1. **Prune remote-tracking refs** that no longer exist on origin:

   ```bash
   git fetch --prune
   ```

2. **Delete local branches** whose remote is gone (merged and deleted on GitHub):

   ```bash
   git branch -vv | grep ': gone]' | awk '{print $1}'
   ```

   For each branch found, delete it: `git branch -d <branch>`

3. **Delete remote branches** for merged PRs (GitHub auto-deletes if configured, but verify):

   ```bash
   gh pr list --state merged --json headRefName --jq '.[].headRefName' | head -20
   ```

4. **Return to `dev`** after cleanup:

   ```bash
   git checkout dev && git pull origin dev
   ```

5. **Report** what was cleaned: "Deleted N local branches, pruned remote refs. On `dev`, up to date."

**Proactive behavior:**

- After shipping (step 7 of Ship workflow), if the PR is later merged, suggest cleanup next time the user starts a new task
- At the start of "Start Working" workflow, run `git fetch --prune` and clean stale local branches automatically before creating the new branch

## Safety Rules (Always Apply)

- **TypeScript first**: Never commit code that fails `npm run type-check`
- **Lint clean**: Never commit code that fails `npm run lint`
- **No secrets**: Scan for `.env`, credentials, API keys, Doppler tokens before staging
- **No force push**: Never to `main` or `dev`. Never without explicit request
- **No hook skipping**: Never `--no-verify` unless explicitly requested
- **No direct commits to `main`**: Always go through `dev` (or hotfix PR)
- **No direct pushes to `dev` by contributors**: `dev` only moves via PRs merged by the release owner (CI guard flags violations)
- **No self-merge**: The PR author never merges their own PR — contributor PRs go through Review & Merge
- **No auto-merge**: Creating the PR ≠ merging it. The release owner authorizes merges explicitly
- **New commits only**: Never amend unless explicitly requested
- **Atomic commits**: Suggest splitting unrelated changes

## Context Detection

When the user asks to ship, detect the current state automatically:

| Current branch                 | Action                              |
| ------------------------------ | ----------------------------------- |
| `main` or `dev` with changes   | Create branch from `dev`, then ship |
| Feature branch with changes    | Ship (commit, push, PR)             |
| Feature branch, already pushed | Update PR (push new commits)        |
| Any branch, no changes         | Nothing to ship — inform user       |
| `hotfix/*` branch              | PR targets `main` instead of `dev`  |
