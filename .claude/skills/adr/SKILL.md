---
name: adr
description: Creates an Architecture Decision Record (ADR). Use when a non-trivial architectural choice is being made (technology selection, pattern, trade-off, constraint) that future engineers will need to understand. ADRs are durable — they outlive feature designs.
argument-hint: "[short slug describing the decision, e.g. 'v2-agent-architecture-invariant']"
---

# Architecture Decision Records (ADRs)

## Purpose

ADRs capture **why** an architectural choice was made — the context, the alternatives considered, and the consequences accepted. They are durable artifacts that explain past decisions to future engineers (human or AI).

ADRs sit alongside feature designs but live longer. A feature design says *what* we are building; an ADR says *why* we chose this technical approach over alternatives. When a feature folder gets archived at the `/git-workflow` Release step (reference: `.claude/skills/git-workflow/references/promote-docs.md`), any ADR it spawned stays in `docs/adr/` indefinitely.

## When to Use

Invoke `/adr` when:

- You're picking between two non-trivial technical alternatives (Mongoose vs native driver, REST vs GraphQL, JWT vs session, BullMQ vs Agenda, Composio vs direct integration).
- You're introducing a pattern that will shape future code (Clean Architecture layering, agent context injection, ePayco DIY recurrence, Composio plugin curation).
- You're locking in a constraint that limits future options (no Redis, V2 invariant "every Conversation has agentConfigId", `iv:authTag:ciphertext` encryption format, single MongoDB driver).
- The user says: "let's document this decision", "ADR for X", "record this trade-off".
- During the `/git-workflow` Release step (post-ship archival), when a feature involved an architectural choice worth preserving.

## When NOT to Use

- The decision is trivial or obvious (using TypeScript, using `npm`, using Fastify).
- The decision is feature-specific, not architectural — that belongs in the feature design's *Architectural Decisions* section.
- The decision is reversible with no migration cost.
- An existing ADR already covers it — update or supersede the existing one instead of duplicating.

## Workflow

### 1. Pick the slug

Short, kebab-case, descriptive. Names the *decision*, not the question:

- ✅ `v2-agent-architecture-invariant`, `epayco-diy-recurrence`, `composio-plugin-curation`
- ❌ `should-we-use-bullmq`, `mongo-decision-final-v2`, `ADR_for_auth_choice`

### 2. Do NOT assign a number yet

**ADRs are created unnumbered, named by slug.** The number is minted exactly once,
at merge time, against the integration branch (`dev`) — see [§ Numbering at merge](#numbering-at-merge).

Why: ADR numbers used to be picked from local `ls docs/adr/` at creation. On a
feature branch that view is stale — two branches forked from the same point both
grab the "next" number and collide when they merge (this happened with the CRM
ADRs vs the connection-rail ADRs). Numbering against `dev` right before merge
serializes it through the integration branch, so it cannot collide.

### 3. Create the file

Path: `docs/adr/<slug>.md` (no number prefix).

- **Title:** `# ADR: <Title>` — no number. The numbering script injects the number at merge.
- **Cross-references to sibling ADRs:** link by **slug**, never by number — e.g.
  `[event model](crm-event-sourced-engagement-layer.md)`, not `ADR-0007`. The slug is
  stable; the number isn't known until merge. The numbering script rewrites these links
  to the numbered filename automatically.

Use this template:

```markdown
# ADR: <Title — a noun phrase, not a question>

- **Status:** Accepted | Proposed | Superseded by [<other-slug>](<other-slug>.md) | Deprecated
- **Date:** YYYY-MM-DD
- **Decision makers:** Mateo
- **Tags:** <area, e.g. agent, billing, auth, database, integrations>

## Context

What is the problem we are solving? What forces are at play (technical, business, customer-facing)? Why are we deciding now?

Be specific. "We need a queue" is not context. "We need to fire trial-end charges across thousands of subscriptions within 5 minutes of expiry, with idempotency and retry semantics, because the ePayco SDK has no subscription primitive and our scanner runs every minute" is context.

## Decision

What did we decide? State it plainly. One paragraph max.

## Alternatives Considered

For each serious alternative:

### Alternative A: <name>
- **Pros:** ...
- **Cons:** ...
- **Why rejected:** ...

### Alternative B: <name>
- **Pros:** ...
- **Cons:** ...
- **Why rejected:** ...

### Alternative C (accepted): <name>
- **Pros:** ...
- **Cons:** ...
- **Why accepted:** ...

## Consequences

### Positive
- What gets easier or better?

### Negative
- What gets harder or constrained? What did we give up?
- What migration cost would reversing this incur?

### Neutral
- What new responsibilities do we now own?

## References

- Related ADRs: [<other-slug>](<other-slug>.md)  ← link by slug; the merge script numbers it
- Related feature design: `docs/design/<slug>/feature-design.md` (or post-ship: `docs/archive/<year>-q<N>/<slug>/`)
- Code anchors: `src/modules/.../foo.ts:42`
- External docs / RFCs / blog posts that informed the decision
```

### Numbering at merge

ADRs stay unnumbered (`<slug>.md`, `# ADR: …`) for the whole life of the branch.
The number is assigned by a script right before the branch merges to `dev`:

```bash
# Dry-run — shows the plan (max number on origin/dev + 1, sequential)
npm run adr:number

# Apply — git mv to NNNN-<slug>.md, injects the number into the heading,
# and rewrites every <slug>.md link across docs/ and src/
npm run adr:number -- --apply
```

The `/git-workflow` ship step runs this for you. If you're
landing an ADR by hand, run `npm run adr:number -- --apply` before opening the PR to `dev`,
then review with `git diff` and commit. Source: `scripts/number-adrs.ts`.

### 4. Validate

Before finalizing:

- [ ] Title is a noun phrase, not a question. ("V2 Agent Architecture invariant", not "Should every conversation have a configId?")
- [ ] Context is specific enough that someone unfamiliar can understand the constraints.
- [ ] At least 2 alternatives considered (otherwise the decision wasn't really a decision).
- [ ] Consequences include negatives — every choice has trade-offs.
- [ ] Status is correctly set (Accepted for adopted decisions).
- [ ] References link to the design folder (current or archived path) and any code anchors.
- [ ] File is **unnumbered** (`<slug>.md`, `# ADR: …`) and sibling ADRs are linked by **slug**, not number.

### 5. Cross-link (optional)

If the ADR was triggered by an in-flight feature, add a line in that feature's `ship-log.md` (the post-build artifact: build notes + operational ship log).
Link by **slug** while in-branch — the merge numbering script rewrites it to the numbered filename:

```markdown
- Architectural decision: see [<slug>](../../../adr/<slug>.md)
```

## Style

- Plain language. No jargon without definition.
- Past-tense for decisions ("We chose X"), present-tense for current implications ("This means new modules must Y").
- Tables for comparing alternatives when the comparison is high-dimensional.
- Link to feature designs and code, not the other way around. Code points to ADRs; ADRs point to context.

## Anti-patterns

- **Don't ADR every decision.** Only architectural ones — choices that constrain or shape future code.
- **Don't write ADRs after the fact for decisions nobody will revisit.** Time-box: if no one would ask "why did we do this?" two years from now, skip it.
- **Don't mix feature requirements into ADRs.** Requirements live in feature designs; ADRs explain technical choices.
- **Don't edit an accepted ADR's decision retroactively.** Supersede it with a new ADR and mark the old one `Superseded by` a link to the new one (by slug in-branch; the merge script numbers it).
- **Don't hand-pick an ADR number at creation.** Numbers are minted at merge against `dev` (see [§ Numbering at merge](#numbering-at-merge)). Picking one yourself is how collisions happen.

## See Also

- **Existing ADRs**: `docs/adr/` — read these first to see if your decision is already covered.
- **Docs lifecycle**: `docs/README.md` — how ADRs fit alongside design folders and archives.
- **Archival**: `.claude/skills/git-workflow/references/promote-docs.md` — the `/git-workflow` Release step that often invokes `/adr` at ship time.
