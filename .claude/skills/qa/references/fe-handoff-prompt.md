# Frontend QA Handoff — Artifact Template

> **Why an artifact, not a "prompt I paste into your session":** Claude Code **cannot start a session
> in another repository**. So the backend agent *writes a handoff artifact* (a committed doc); a
> **human** then opens a Claude Code session in the frontend repo and points it at that artifact — the
> same way the FE repo already consumes the `api-contract.md` today.

## How it works

1. The backend agent fills the template below and **writes it to
   `docs/design/<slug>/fe-qa-handoff.md`** (committed, alongside the api-contract — the shared design
   folder is what both repos read).
2. The **human** opens Claude Code **in the frontend repo** and says, e.g.:
   *"Read `<backend-repo>/docs/design/<slug>/fe-qa-handoff.md` and run the UI QA per it."*
3. The FE session runs its Playwright, **grills** its findings there, writes its own
   `<fe-repo>/docs/qa/<slug>-findings.md`, and returns:
   - a one-line UI pass/fail summary, and
   - the **contract-reconciliation slice** (the rows that touch the shared api-contract).
4. The human brings the reconciliation slice back; the backend agent merges those rows into
   `docs/design/<slug>/qa-findings.md` (same schema, reference the FE IDs e.g. `≡ CR-03`).

Keep the artifact **simple and self-contained** — the FE session should need nothing but this file
plus the paths it points to.

## Template (fill the `<…>` and write to `docs/design/<slug>/fe-qa-handoff.md`)

```markdown
# <Feature> — Frontend QA Handoff

> Post-implementation QA, FE half. Methodology: DISCOVER → REGISTER → GRILL → (fix later).
> Do NOT fix anything yet; the loop closes at zero BLOCKERS, not zero findings. The spec can be
> wrong, not just the code — verify which side before changing either.

## Stack (running locally)
- Backend API: https://localhost:3200  (module under <base path, e.g. /api/v1/crm>)
- Frontend:    https://localhost:3201  (feature at <route>)
- TLS self-signed on both → ignore the cert in Playwright.

## Source of truth (read from the backend repo by path)
- Feature design: <backend-repo>/docs/design/<slug>/feature-design.md
- API contract:   <backend-repo>/docs/design/<slug>/api-contract.md  (§ "Frontend Hooks" = your contract surface)
- UI scenarios:   <backend-repo>/.claude/skills/qa/scenarios/<slug>.md  (Part 2 — UI groups)

## Seeded data (deterministic asserts; tenant <…>)
<list seeded IDs/fixtures and what each should render>

## What to produce
1. `docs/qa/<slug>-findings.md` IN YOUR REPO, schema:
   | ID | Sev | Spec anchor | Expected (per spec) | Observed (QA) | Verdict | Status |
   - Sev: Blocker | Major | Minor | Enhancement
   - Verdict: code-bug | contract-wrong | design-gap | not-a-bug | deferred
2. Split findings into: (a) UI/FE-only → you own them; (b) **contract-reconciliation slice** (API
   response vs contract §endpoints/§hooks, or contract ambiguities from the consumer view) → return
   THIS slice to the backend.
3. One-line summary: UI scenarios X PASS / Y FAIL / Z SKIP.
```

## Why this shape
- The **contract is the seam**; contract-touching findings must converge where the contract lives
  (backend repo) so a single Revision History records the change.
- Most FE findings are **"the API drifted from an already-correct contract"** (code-bugs), not contract
  bugs — the slice lets both sides see which is which before anything changes.
