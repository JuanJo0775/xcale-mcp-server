# [FEATURE_NAME] — Implementation Plan

> **Feature**: [one-line: what this implementation lands]
> **Phases**: [single phase, or all phases for continuous execution — list with effort, e.g. "Phase 1 (XL) → Phase 2 (L) → Phase 3 (L)"]
> **Slug**: `<slug>`
> **Inputs**: [feature-design.md] · [api-contract.md] · [ADR-XXXX, ADR-YYYY]
> **Status**: Draft | Approved | In Progress | Done
> **Last Updated**: [YYYY-MM-DD]

> This is a **build-time, as-planned snapshot**. Checkboxes are ticked as slices land. It is
> committed and archived with the design folder at the `/git-workflow` Release step (Release dev→main,
> after the prod soak window). It is NOT maintained as an
> as-built reflection of the final code.

---

## 1. Meta-Description

[One executive paragraph: what this implementation does, the shape of the change, the seams it
moves, and what "done" looks like for this phase. This is the orientation a build agent reads
first — it should be able to hold the whole plan in its head after this paragraph.]

**Honored decisions**: [ADR-XXXX — one line each on how this plan obeys it.]

### Phase Map *(multi-phase plans)*

> One row per phase. Phases run in dependency order; each boundary is a verification gate
> (prior phase DoD green before the next begins). Omit this subsection for a single-phase plan.

| Phase | Scope | Effort | Depends on | Gate (must be green to proceed) | Commit checkpoint |
|:--|:--|:--|:--|:--|:--|
| Phase 1 | [foundation scope] | XL | — | `tsc` + `lint` + unit + `/qa` | `feat(<module>): phase 1 …` |
| Phase 2 | [scope] | L | Phase 1 | Phase 1 gate green | `feat(<module>): phase 2 …` |
| Phase 3 | [scope] | L | Phase 1 | Phase 1 gate green | `feat(<module>): phase 3 …` |

**Execution**: single continuous autonomous run — **one branch, one PR, a commit at each green
gate**. No human in the loop until the PR is opened. A failed gate halts and surfaces.

---

## 2. Codebase Reality Check

> Every claim below is anchored to code actually read. No invented paths.

| Seam / Anchor | File:line | What's there today | What the plan needs from it |
|:--|:--|:--|:--|
| [e.g. CRM repo interface] | `src/modules/crm/repository.ts:NN` | [current shape] | [new method / change] |
| [e.g. routes wiring] | `src/modules/crm/routes.ts:NN` | [current routes] | [routes to add] |
| [e.g. main.ts registration] | `src/main.ts:NN` | [how module is registered] | [registration change] |

**Genuinely new files** (no existing anchor — justified): [list, with the one-line reason each
is new rather than a modification.]

---

## 3. Target File Tree(s)

> The tree after this plan executes. `NEW` = created, `MOD` = modified, `CTX` = unchanged context.
>
> **Multi-phase:** detail tapers by phase (rolling-wave). Draw one tree per phase you can anchor to
> code that **exists today**; leave far phases whose code does not exist yet at slice level (§5) and
> author their tree at their gate. State this so lighter far-phase detail never reads as a gap.
> Delete this note and the `### 3.x` headings for a single-phase plan.

### 3.1 Phase 1 — full detail

```
src/modules/<module>/
├── entities.ts            # MOD — [what changes]
├── repository.ts          # MOD — [new interface methods]
├── repository.mongo.ts    # MOD — [implementations]
├── usecases/
│   ├── existing.usecase.ts    # CTX
│   └── new-thing.usecase.ts   # NEW — [purpose]
├── controller.ts          # MOD — [new handlers]
└── routes.ts              # MOD — [new routes]
src/main.ts                # MOD — [registration]
```

### 3.2 Phase 2 — full detail *(only if its code exists today; else delete)*

```
[tree for phase 2, anchored to real code]
```

### 3.3 Phase 3+ — slice level only *(deferred)*

> [Intentionally not specified per-file: this phase's code does not exist yet / depends on prior
> phases as-built. Its file tree is authored at the Phase N gate. The §5 slices define its spine.]

---

## 4. Per-File Changes (executive level — symbols, not bodies)

> Signatures + intent + seam. **No function bodies.** The build step writes the code.
> Multi-phase: one `### 4.x Phase N` subsection per phase you specified a tree for in §3.

### 4.1 Phase 1

### `src/modules/<module>/<file>.ts` — [NEW | MODIFIED | REMOVED]

| Symbol | Kind | Signature | Intent | Seam |
|:--|:--|:--|:--|:--|
| `doThing` | NEW method | `doThing(x: T): Promise<R>` | [one line — what + why] | [interface/caller it satisfies] |
| `IThingRepo.append` | NEW iface method | `append(e: Event): Promise<void>` | [one line] | [implemented by repository.mongo.ts] |
| `oldThing` | MODIFIED | `oldThing(x: T, y: U): R` | [what changes in its contract] | `file:line` caller affected |

_(Repeat one block per touched file.)_

**i18n keys to add** (en + es): [`module.error.key`, …] — strings authored at build time.
**Indexes / schema** (Mongoose): [field(s), reason — e.g. unique compound key].

---

## 5. Vertical Slices (ordered, /tdd-ready)

> Each slice is a thin end-to-end cut, sized to one `/tdd` red-green-refactor loop. Tick as built.

| # | Phase | Slice | Owns (writes) | Band | Depends on | DoD check |
|:--|:--|:--|:--|:--|:--|:--|
| 1 | P1 | [Foundation: types/interfaces] | [files] | `foundation` | — | `tsc` clean |
| 2 | P1 | [Slice: append event + summary] | [files] | `independent` | #1 | unit tests + `tsc` |
| 3 | P1 | [Slice: segment compile] | [files] | `independent` | #1 | unit tests |
| 4 | P1 | [Integration: routes + main.ts wiring] | [files] | `integration` | #2, #3 | `/qa` scenario |

- [ ] Slice 1
- [ ] Slice 2
- [ ] Slice 3
- [ ] Slice 4

---

## 6. Subagent Delegation Map

> Keeps the orchestrator's context clean. **Recommendation threshold: > 4 independent slices or
> > ~12 files.** Below it, the main agent builds solo.

**Recommendation for this plan**: [ Solo (under threshold) | Fan out (over threshold — N independent slices, M files) ].

| Band | Owner | Slices | Notes |
|:--|:--|:--|:--|
| Foundation | Orchestrator (main agent), sequential | #1 | Built once; everything depends on it |
| Independent | One subagent each | #2, #3 | Parallelizable; delegation briefs below |
| Integration | Orchestrator, after slices | #4 | Wiring + final verification |

### Delegation briefs (independent slices only)

> Every delegated subagent receives the **full implementation plan + the API contract + the
> relevant ADRs**, and may **read any files it needs**. The brief below is a *focused
> assignment* on top of that context — not an isolation boundary. The only hard rule: a slice
> **owns** (writes) a disjoint set of files; no two parallel slices write the same seam.

**Slice #2 brief** — [title]
- **Goal**: [one line]
- **Files it OWNS (writes)**: [exact paths — must not overlap any other parallel slice]
- **Symbols to implement**: [from §4]
- **Foundation seam it builds on**: [interface/type from slice #1, with signature]
- **May also read** (for context, not to modify): [related files it will likely consult]
- **DoD**: [the check]

_(Repeat per independent slice.)_

---

## 7. Test Strategy

| Layer | What's tested | How | Command |
|:--|:--|:--|:--|
| Entity/use case | [business rules, validation] | Vitest unit (`/tdd`) | `npm test` |
| Repository | [persistence, indexes] | [unit/integration] | `npm test` |
| HTTP | [endpoints, envelope, auth] | `/qa` (api-qa, curl) | scenario file |
| Type/lint | whole change | static | `npx tsc --noEmit` · `npm run lint` |

**Migration** (if any): [script path], dry-run first, then dev, then prod. [What it transforms.]

---

## 8. Definition of Done — phase gates

> Each phase gate must be green before the next phase begins. A failing gate **halts and
> surfaces** — it does not proceed to the next phase. For a single-phase plan, keep only Phase 1.

### Phase 1 gate
- [ ] All Phase 1 slices ticked (§5).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` clean.
- [ ] Unit tests pass.
- [ ] `/qa` scenario(s) green.
- [ ] Migration run on dev (dry-run reviewed) — if applicable.
- [ ] Commit checkpoint pushed (Phase 1 green) — implementation checkpoint, build continues autonomously.

### Phase 2 gate
- [ ] Phase 1 gate green.
- [ ] All Phase 2 slices ticked · `tsc` · `lint` · tests · `/qa`.

### Phase 3 gate
- [ ] Phase 2 gate green.
- [ ] All Phase 3 slices ticked · `tsc` · `lint` · tests · `/qa`.

### Final
- [ ] Docs/README updated where the change touches them.
- [ ] One PR opened with all phase commits (via `/git-workflow`) — the single review surface.
- [ ] Ready for archival at the `/git-workflow` Release step (Release dev→main, after the prod soak window).

---

## 9. Risks & Rollback

| Risk | Impact | Mitigation / Rollback |
|:--|:--|:--|
| [e.g. migration irreversible] | [H/M/L] | [dry-run; backup; feature flag] |

---

## Appendix — Open Implementation Questions

> Genuinely undecided things surfaced during planning that need a call before/during build.
> (Distinct from feature-design open questions — these are HOW-level.)

| # | Question | Blocks | Proposed default |
|:--|:--|:--|:--|
| IQ-1 | [e.g. reuse Agenda job or new one?] | Slice #4 | [your lean] |
