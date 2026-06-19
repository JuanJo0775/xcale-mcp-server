---
name: handoff
description: Compact the current conversation into a handoff document — or, at the start of a new session, load and consume the last one. Persists to docs/handoff/ (versioned, travels across machines via git). References existing artifacts — feature designs, API contracts, ADRs, CONTEXT.md, roadmaps, branches, PRs, commits, memory — by path/URL instead of duplicating them. Use when wrapping up a session, or when starting a new session that continues prior work.
argument-hint: "[focus for next session]  |  'resume' to load the last handoff"
metadata:
  derived_from: "https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff (MIT, Matt Pocock)"
---

# Handoff

This skill has **two modes**. Pick one by the rule below, then follow that section.

## Mode detection

1. If the argument is a load keyword (`resume`, `load`, `continue`, `start`) → **LOAD mode**.
2. Else if the argument describes what the next session will focus on → **WRITE mode** (use it as the focus).
3. Else (no argument):
   - `docs/handoff/` contains a handoff `*.md` → **LOAD mode** (you're resuming).
   - `docs/handoff/` is empty or absent → **WRITE mode**.

The normal cycle keeps the folder holding **at most one** handoff: you WRITE at the end of a session, and the next session's LOAD consumes (deletes) it. So at the start of a session there's one to load; mid/end-of-session the folder is empty and you write a fresh one.

---

## WRITE mode

Produce a handoff so a fresh agent (this session's continuation, possibly on another machine) can pick up without re-deriving context.

1. `mkdir -p docs/handoff` (the working dir is the repo root).
2. Write the doc to **`docs/handoff/<YYYY-MM-DD>-<short-slug>.md`** (date from `date +%F`; slug = kebab-case of the focus, else `session`).
3. Fill the **Sections** below, honoring **the one rule: reference, don't duplicate**.
4. **Commit + push** so it travels: `git add docs/handoff/ && git commit -m "docs(handoff): <slug>" && git push` on the current branch (normally `dev`). This auto-commit is the point of the skill — persistence across machines — so do it without asking.
5. Tell the user the committed path.

> If WRITE mode runs while a handoff already exists (folder not empty — e.g. you wrote twice without resuming), don't silently stack a second one: tell the user there's an un-consumed handoff and ask whether to replace it or keep both.

## LOAD mode

Resume from the last handoff and leave the folder clean.

1. Read the most recent `docs/handoff/*.md` (by filename date; normally exactly one). If none exists, say so and offer WRITE mode instead.
2. **Reload context**: open the artifacts it references (the roadmap/tracker, branch, key code anchors, ADRs) so you actually hold the state — don't just echo the doc.
3. Summarize to the user where things stand and the immediate next step, and surface any **Open decisions** the doc flagged.
4. **Consume it**: `git rm docs/handoff/<file>` (remove every handoff so the folder stays clean), `git commit -m "docs(handoff): consume <slug>" && git push`. Delete only **after** you've loaded the context.
5. Continue the work.

---

## The one rule: reference, don't duplicate

Do **not** restate content that already lives in a durable artifact. Link to it by path or URL. This repo is full of authoritative sources — point at them:

- **Feature design / API contract** — `docs/design/<slug>/feature-design.md`, `docs/design/<slug>/api-contract.md` (the source of truth while in flight; never copy). Post-ship they move to `docs/archive/<year>-q<N>/<slug>/`.
- **ADRs** — `docs/adr/NNNN-*.md` (durable decisions; cite the number, don't re-explain the rationale).
- **Initiative roadmaps** — e.g. `docs/design/<initiative>/roadmap.md` or a retroactive plan (the cross-session "where are we" tracker; update its status index rather than restating it).
- **Domain glossary** — `CONTEXT.md` (don't re-explain terms; point to them).
- **Architecture** — `docs/architecture-guide.md`, module `README.md` files.
- **Git** — branch name, open PR URL, key commit SHAs (`git log --oneline -10`). Mind the `feat/* → dev → main` model and the dev-branch auto-delete gotcha (see memory).
- **Memory** — relevant files under the auto-memory dir (`…/memory/`), by name.
- **Code anchors** — `src/modules/.../file.ts:line` for the exact spots the next session touches.

Duplication is the exact drift this avoids — a second stale copy of the contract is worse than a link.

## Sections (WRITE mode)

- **Goal of next session** — from the user's argument, or inferred from where the conversation landed.
- **State of play** — what's done, what's in progress, what's blocking. Be concrete.
- **Open decisions** — what the next agent must decide, with options if you have them (don't decide for them).
- **Skills to use** — concrete list (e.g. `/grill` to pressure-test before designing, `/feature-design` → `/api-contract-authoring` → implementation, `/qa <target>`, `/git-workflow` ship → release (archives the design folder after soak; reference: `.claude/skills/git-workflow/references/promote-docs.md`)).
- **Artifacts** — the path/URL list above. No prose duplicating their contents.

Keep it tight. A handoff is a map to the real artifacts, not a transcript.
