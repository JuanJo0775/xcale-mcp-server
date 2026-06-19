# CRM Revamp — QA Scenarios

> **Source**: `docs/design/crm-revamp/api-contract.md` · `implementation-plan.md`
> **ADRs**: 0010 (event model) · 0011 (deterministic mapping) · 0012 (compiled DSL + ledger)
> **Last reviewed**: 2026-06-06
> **Backend base URL**: `https://localhost:3200` (dev, self-signed — use `curl -k`)
> **Frontend base URL**: `https://localhost:3201` (dev — CRM dashboard at `/crm`)
> **Mount**: routes are under `/api/v1/crm` (see `main.ts:339-340`; prefix fixed 2026-06-06).

## Setup (HTTP)

```bash
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')
```

> **Design invariant**: the CRM **write surface is the agent, not REST** (api-contract §4).
> Segments/campaigns/attributes are authored via Agent Tools; the REST surface is read +
> control + suppression + activation only. These scenarios test the read/control surface and
> the end-to-end recall *behavior* (event → summary → segment → ledgered send).

---

# Part 1 — HTTP (api-qa via curl)

## Group A — Auth gate & route mount

### Scenario 1: reads require auth
**When**: `GET /api/v1/crm/contacts` with no `Authorization`.
**Then**: `401`, body `.error` present.

### Scenario 1b: routes are mounted at /api/v1/crm (regression for the prefix fix)
**When**: `GET /api/v1/crm/stats` with a valid `Authorization: Bearer $TOKEN`.
**Then**: `200` (NOT `404`). Guards against a regression to the old `/api/crm` mount.

---

## Group B — Catalog (closed vocabulary)

### Scenario 2: GET /catalog returns the closed type/subtype vocabulary
**When**: `GET /api/v1/crm/catalog`
**Then**: `200`; `.data.items[]` each has `type`, `source`, `subtypeSource`, `subtypes[]`,
`carriesAmount`. Nevatal `appointment` is present with STATIC subtypes
`["scheduled","confirmed","completed","cancelled"]`. `.data.attributes[]` is the tenant's
validated trait schema. **`procedure` subtypes are empty** (IQ-1 — unfed in Phase 1).

---

## Group C — Reads

### Scenario 3: GET /contacts is tenant-scoped & paginated
**When**: `GET /api/v1/crm/contacts?page=1&limit=20`
**Then**: `200`; `.data[]` items expose `externalPhoneNumber` (NOT `phoneNumber`),
`eventSummary`, `attributes`, `suppressedFromCampaigns`. No `metadata`/`notes`/`stats.sentimentScore`.
`.pagination` has `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`.

### Scenario 4: GET /contacts/:id/timeline returns a CRMEvent ARRAY
**Given**: a contact id from Scenario 3.
**When**: `GET /api/v1/crm/contacts/:id/timeline`
**Then**: `200`; **`.data` is an ARRAY** of `CRMEvent`s (NOT a `{ events: [...] }` wrapper — F-14/CR-03),
reverse-chronological (`type`, `subtype`, `occurredAt`, `externalId`). `raw` is NOT returned.
Also carries the offset **`.pagination`** envelope `{page,limit,total,totalPages,hasNext,hasPrev}` (F-20/CR-09).
> Lesson: the original lax assertion missed the `{events}` wrapper that crashed the FE. Pin the shape.

### Scenario 4b: GET /contacts?search= matches name OR phone
**Given**: a contact whose `name` contains a known substring (e.g. seeded "QA Recall MATCH").
**When**: `GET /api/v1/crm/contacts?search=<name substring>`
**Then**: `200`; the contact is in `.data` (search matches `name`, not only `externalPhoneNumber` — F-18/CR-07).

### Scenario 5: GET /stats has no fabricated avgSentiment
**When**: `GET /api/v1/crm/stats`
**Then**: `200`; `.data` has `totalContacts`, `activeContacts`, **`segmentCount`** (NOT `totalSegments`
— F-05), `totalCampaigns`, `activeCampaigns` (per api-contract `ICRMStatsResponse` v2). **No `avgSentiment`** (Q-4: removed).

### Scenario 6: GET /segments/:id/preview compiles with userId forced
**Given**: an existing segment id (from `GET /api/v1/crm/segments`).
**When**: `GET /api/v1/crm/segments/:id/preview`
**Then**: `200`; `.data` has `count`, `sample[]` (each `id`/`name`/`externalPhoneNumber`,
optional `matchedAnchorEventId`), `ruleSummary`. The count never includes another tenant's
contacts (cross-tenant leak closed).

### Scenario 7: GET /campaigns/:id real-or-absent stats
**Given**: an existing campaign id (from `GET /api/v1/crm/campaigns`).
**When**: `GET /api/v1/crm/campaigns/:id`
**Then**: `200`; `.data.campaign.stats` has `sent`/`skipped` as numbers and
`delivered`/`read`/`replied` as **`null`** (Phase 1 — not wired until Phase 2).
`.data.ledgerSummary` has `totalSent`, `distinctContacts`, `lastSentAt?`.

### Scenario 8: GET /sync/status per toolbox
**When**: `GET /api/v1/crm/sync/status`
**Then**: `200`; `.data[]` includes a `nevatal` entry with `transport: "PULL"`,
`enabled`, `lastRunAt?`, `lagSeconds?`.

### Scenario 8b: GET /activation returns onboarding state
**When**: `GET /api/v1/crm/activation`
**Then**: `200` (regression for the original 404). `.data` reflects whether the CRM is
enabled and which toolboxes feed it.

---

## Group D — Control & suppression

### Scenario 9: suppress requires campaignId for campaign scope
**When**: `POST /api/v1/crm/contacts/:id/suppress` body `{ "scope": "campaign" }` (no campaignId).
**Then**: `400`, `.error` = the localized `crm.error.campaign_id_required` message.

### Scenario 10: human suppress → unsuppress round-trip
**When**: `POST /api/v1/crm/contacts/:id/suppress` `{ "scope": "all" }` → `200`.
Then `GET /api/v1/crm/contacts/:id` → `.data.suppressedFromCampaigns === true`.
Then `POST /api/v1/crm/contacts/:id/unsuppress` **with body** `{ "scope": "all" }` → `200`;
contact `suppressedFromCampaigns === false`. (Unsuppress requires the body per `IUnsuppressContactRequest` — F-16.)

### Scenario 11: campaign lifecycle control
- `POST /api/v1/crm/campaigns/:id/pause` on a RUNNING campaign → `200`, status `PAUSED`.
- `POST /api/v1/crm/campaigns/:id/resume` on a PAUSED campaign → `200`.
- `POST /api/v1/crm/campaigns/:id/cancel` → `200`, status `CANCELLED`.
- A control action on a terminal campaign → `409` (api-contract §2 state machine).

---

## Group E — End-to-end recall (the unblock)

> Drives the appointment-recency recall MVP (IQ-1). Segment/campaign authoring is via the
> agent tools (`crm_get_catalog` → `crm_create_segment` → `crm_send_campaign`); verify the
> *effects* through the read surface.

### Scenario 12: appointment → event → summary
**Given**: a Nevatal PULL window ingests a `completed` appointment for a contact.
**Then**: `GET /api/v1/crm/contacts/:id` shows `eventSummary.byKey["appointment:completed"]`
and `eventSummary.byType["appointment"]` with matching `count`/`lastOccurredAt`.

### Scenario 13: recall segment selects the right cohort
**Given**: a segment with rule
`{ op:"all", predicates:[ {kind:"eventAge", key:"appointment:completed", withinDays:[90,120]},
{kind:"noneSince", anchorKey:"appointment:completed", scopeType:"appointment"} ] }`.
**Then**: `GET /api/v1/crm/segments/:id/preview` `count` includes only contacts whose **most
recent appointment is a completed one 90–120 days ago**, and only for THIS tenant.

### Scenario 14: recurring campaign sends once per anchor (Send Ledger)
**Given**: a recurring campaign over the recall segment.
**Then**: across two cadence evaluations with no new appointment, a matched contact is sent
to **exactly once** (`ledgerSummary.totalSent` does not double); `stats.sent` reflects real
sends; `stats.delivered/read/replied` stay `null`. A NEW completed appointment re-qualifies
the contact for one further send.

---

# Part 2 — UI (quala via Playwright)

> Drives the CRM dashboard at `https://localhost:3201/crm`. Log in through the UI (or seed an
> auth cookie/localStorage token) before navigating. Assert what the **user sees**, not the
> wire — HTTP shape is already covered in Part 1. Never assert a fabricated number: real or "—".

## Group F — Dashboard shell & navigation

### Scenario 15: CRM dashboard loads without console/network errors
**When**: navigate to `/crm` as an authenticated tenant.
**Then**: the page renders the stats header + tabs (Contacts / Segments / Campaigns) with **no**
4xx/5xx XHR to `/api/v1/crm/*` in the network panel (regression for the all-404 prefix bug).

### Scenario 16: stats header shows real-or-absent numbers
**Then**: each stat card (total contacts, active contacts, segment count, active campaigns)
shows either a real number or `—`. **No `NaN`, no `0.5` sentiment, no fabricated default.**

### Scenario 17: tab navigation renders each list
**When**: click each tab — Contacts, Segments, Campaigns.
**Then**: each renders its table (or its empty state). Contacts columns include name, phone,
tags, last interaction, top event summary. Segments show name + human-readable rule summary +
live count. Campaigns show segment, mode, cadence, status, and real stats (or "not tracked yet").

### Scenario 18: empty state when no data
**Given**: a tenant/tab with no rows.
**Then**: the documented empty state copy renders (e.g. "No contacts yet. Connect
Nevatal/Shopify and enable sync…") with a link to onboarding — not a blank table or a spinner stuck.

## Group G — Contact detail

### Scenario 19: contact row opens detail with timeline
**When**: click a contact row.
**Then**: the detail view shows header (name, phone, tags, suppression status), Attributes,
Event Timeline (reverse-chron events with date/amount), Engagement, and Campaigns sections.
No raw Mongo / no raw event payload surfaced.

### Scenario 20: suppress toggle round-trip (human override)
**When**: click Suppress on a contact → confirm dialog → confirm.
**Then**: the suppression badge turns to "Suppressed" (danger tone); unsuppress reverts it.
Mirrors HTTP Scenario 10 at the UI layer (do not re-assert the wire — assert the rendered badge).

## Group H — Activation / onboarding (Phase 3)

### Scenario 21: first visit routes to activation
**Given**: a tenant that has not enabled the CRM.
**Then**: visiting `/crm` routes to the activation stepper; finishing requires ≥1 toolbox
enabled; health-data consent is explicit for clinical sources (Nevatal).
