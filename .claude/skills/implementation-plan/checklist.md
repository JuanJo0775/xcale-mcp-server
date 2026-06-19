# Implementation Plan Review Checklist

Run this **before finalizing** any implementation plan. Every item must pass.

---

## Phase 1: Inputs & Scope

- [ ] `feature-design.md` exists for this slug and was read.
- [ ] `api-contract.md` exists for this slug and was read.
- [ ] All referenced ADRs were read; the plan honors them (does not relitigate).
- [ ] Scope is explicit: a single phase, **or** multiple phases with declared dependencies and a verification gate at each boundary.
- [ ] Output lands at `docs/design/<slug>/implementation-plan.md` (not `docs/`, not `docs/plans/`).

## Phase 2: Codebase Grounding (anti-hallucination)

- [ ] Every change to an **existing** file is anchored to a real `file:line` actually read.
- [ ] No invented file paths — genuinely new files are flagged and justified.
- [ ] The real seams (repository interfaces, route wiring, `main.ts`, tool/scheduler registries, i18n) were inspected.
- [ ] The target file tree follows the module pattern in `docs/architecture-guide.md`.

## Phase 3: Executive Level (not code-in-prose)

- [ ] Per-file changes list **symbols** (function/method/class/interface), not paragraphs.
- [ ] Each symbol has a **signature + one-line intent + the seam** it touches.
- [ ] **No function bodies / no implementation code** anywhere in the plan.
- [ ] Each symbol is marked `NEW` / `MODIFIED` / `REMOVED`.
- [ ] A build agent could execute the plan without re-researching, and without it pre-writing the solution.

## Phase 4: Slices & Delegation

- [ ] Work is broken into **ordered vertical slices**, each sized to one `/tdd` loop.
- [ ] Each slice is tagged with its **phase** and its **band** (`foundation` / `independent` / `integration`).
- [ ] Foundation (shared types/interfaces) is built first by the orchestrator, once.
- [ ] The fan-out **recommendation** is stated, applying the threshold (> 4 independent slices or > ~12 files, counted across all phases).
- [ ] Every `independent` slice has a **delegation brief** (goal, owned files, symbols, foundation seam, DoD). The subagent also receives the full plan + API contract + ADRs and may read files freely.
- [ ] Each slice's **owned (written) files are disjoint** — no two parallel slices write the same seam.
- [ ] If multi-phase: phases are ordered by dependency, and each boundary has a verification gate (prior phase DoD green before the next begins).
- [ ] If multi-phase: the slices (§5) span **all** phases, but per-file detail tapers (rolling-wave) — and the plan **states this explicitly**, so lighter far-phase detail never reads as a gap. Any later phase whose code exists today is fully specified; phases whose code does not exist yet stay at slice level.

## Phase 5: Verification & Tracking

- [ ] Every slice has an objective Definition-of-Done check tied to a **real command** (`tsc` / `lint` / tests / `/qa`).
- [ ] A phase-level Definition of Done is present.
- [ ] Slices and DoD items are **checkboxes** (the plan doubles as the build tracker).
- [ ] Migration (if any) specifies a dry-run-first path (dry-run → dev → prod).
- [ ] Risks/rollback are noted for anything irreversible.
- [ ] Commit checkpoints are defined (one per green gate); the whole plan is **one branch → one PR** with multiple commits. The build runs autonomously to completion — no human-in-loop until the PR; only a failed gate halts it.

## Phase 6: Lifecycle

- [ ] Status field set (`Draft` initially).
- [ ] Plan is marked as a build-time **as-planned snapshot**, not as-built.
- [ ] Ready to commit and to archive via the `/git-workflow` Release step (reference: `.claude/skills/git-workflow/references/promote-docs.md`) with the design folder, at Release (dev→main) after the prod soak window.

---

## Approval Criteria

The plan is **ready to build from** when:

1. ✅ All items above pass.
2. ✅ A build agent (or subagent) can implement each slice from the plan alone, without re-reading the module.
3. ✅ Nothing in the plan is the code itself — it's the map, grounded in real anchors.
4. ✅ The delegation map keeps the orchestrator's context clean for long plans.
