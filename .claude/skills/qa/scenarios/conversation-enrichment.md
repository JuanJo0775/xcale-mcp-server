# Conversation Enrichment — QA Scenarios

> **Source**: docs/design/conversation-enrichment/api-contract.md (§1.2, §2.3–§2.5, §5) + ship-log.md (dev QA items)
> **Last reviewed**: 2026-06-11

## Setup (read before running)

- **All inbound messages in these scenarios are NON-TEXT** (`type: "audio"` / `"image"`) **on purpose**:
  the Fact layer must handle every type, and non-text never reaches the buffer/agent loop — so no LLM
  turns fire and nothing tries to reply to the synthetic numbers.
- **Synthetic customer numbers**: use `+5730000009xx` variants (never real contacts). QA contacts remain
  in the dev DB afterwards — acceptable (dev only).
- **Webhook target**: `POST https://localhost:3200/api/webhooks/whatsapp` (curl `-k`). Meta-shaped body:

  ```json
  {"entry":[{"changes":[{"field":"messages","value":{
    "metadata":{"phone_number_id":"<PHONE_NUMBER_ID>"},
    "messages":[{"from":"5730000009xx","id":"wamid.QA-<unique>","timestamp":"<unix-seconds>","type":"audio","audio":{"id":"fake"}}]
  }}]}]}
  ```

- **Signature**: header `X-Hub-Signature-256: sha256=<HMAC_SHA256(rawBody, APP_SECRET)>` computed over the
  EXACT raw body bytes sent. Resolve `PHONE_NUMBER_ID` by reading (READ-ONLY) the dev DB collection
  `whatsappconnections` via mongosh with the Doppler `MONGODB_URI` (project xcale, config dev) — take an
  active connection's `phoneNumberId` and `connectionType`. If `connectionType` is EMBEDDED, sign with
  Doppler `META_APP_SECRET`. If MANUAL (per-connection encrypted secret, not externally signable), still
  try `META_APP_SECRET`; on 403 mark scenarios 1–5 + 7 as **SKIP (unsignable connection)** and report it.
- **Asserts**: authenticate (standard api-qa preflight) as the user owning that connection
  (`whatsappconnections.userId` — if the test user differs, note it: contacts are tenant-scoped and reads
  will miss; in that case report SKIP for the assert half). Read contacts via
  `GET /api/v1/crm/contacts` (filter by `externalPhoneNumber` with jq) and events via
  `GET /api/v1/crm/contacts/:id/timeline`.
- Timestamps: `T0 = now − 3 days` (unix seconds), `T1 = T0 + 1h`, `NOW = now`.

## Scenario 1: First inbound (audio, backdated 3d) creates contact + episode event + engagement

**Given**: synthetic number A (`+573000000901`) has no CRM contact (verify first; if present from a prior run, switch to an unused suffix and use it consistently below)
**When**: webhook POST — from=A, id=`wamid.QA-A1`, timestamp=`T0`, type=audio
**Then**:
- Status `200`
- Contact for A exists in `GET /api/v1/crm/contacts` (allow ≤5s propagation; expect <1s)
- Timeline has exactly 1 event with `type == "conversation"`, `externalId` matching `^<threadId>:.*T.*Z$` (episode format, contains `:`), `enrichedBy` absent
- Contact `engagement.messageCount == 1`, `engagement.lastInteractionAt` ≈ T0

## Scenario 2: Second message in the same episode folds engagement, no new event

**Given**: Scenario 1 ran
**When**: webhook POST — from=A, id=`wamid.QA-A2`, timestamp=`T1` (1h after T0 → same episode)
**Then**:
- Status `200`
- Timeline still has exactly 1 `conversation` event
- `engagement.messageCount == 2`, `lastInteractionAt` ≈ T1

## Scenario 3: Meta redelivery is a FULL no-op

**Given**: Scenario 2 ran
**When**: webhook POST with the IDENTICAL body of Scenario 2 (same `wamid.QA-A2`, same timestamp; re-sign)
**Then**:
- Status `200`
- `engagement.messageCount` STILL `2` (no double count)
- Timeline still has exactly 1 `conversation` event

## Scenario 4: >24h silence opens a second episode

**Given**: Scenarios 1–3 ran (thread's lastMessageAt ≈ T1, 3 days ago)
**When**: webhook POST — from=A, id=`wamid.QA-A3`, timestamp=`NOW`
**Then**:
- Status `200`
- Timeline now has exactly 2 `conversation` events (distinct `externalId`s, same `<threadId>:` prefix)
- `engagement.messageCount == 3`

## Scenario 5: A voice-note-only NEW customer becomes a contact (the headline fix)

**Given**: synthetic number B (`+573000000902`) has no CRM contact
**When**: webhook POST — from=B, id=`wamid.QA-B1`, timestamp=`NOW`, type=image (`"image":{"id":"fake"}`)
**Then**:
- Status `200`
- Contact for B exists with `engagement.messageCount == 1`
- Timeline has 1 `conversation` event
- (Before this feature, non-text messages were dropped entirely — this is the regression lock)

## Scenario 6: Retired scheduler surface stays dead

**Given**: server running
**When**: `POST /api/scheduler/` with `{}` and `GET /api/scheduler/`
**Then**:
- Both return `404`
- Control: `GET /api/users` returns `401` (route table alive)

## Scenario 7: Batch enrichment job over the closed episode (REAL Anthropic Batch API — costs cents, takes minutes)

**Given**: Scenarios 1–4 ran. The episode at `T0` is CLOSED (a newer episode exists) and has no `enrichedBy`
→ it is pending. ⚠️ The run also picks up any other pending closed episodes in the dev DB (report how many
it selected).
**When**: trigger the runner from the repo root (give it up to ~10 min; poll output):

```bash
doppler run -- npx ts-node -r tsconfig-paths/register -e "
import('./src/modules/crm/sync/conversation-enrichment.job').then(async (m) => {
  const runner = new m.ConversationEnrichmentRunner();
  const summary = await runner.run();
  console.log('RUN_SUMMARY', JSON.stringify(summary));
  process.exit(0);
});"
```

**Then**:
- `RUN_SUMMARY` line printed with `selected >= 1`, `parseErrors`/`rowErrors` reported (ideally 0)
- The T0 episode event in A's timeline now has `enrichedBy == "batch"` and `enrichedAt` set
- The NOW episodes (still open) remain WITHOUT `enrichedBy`
- Note: with a synthetic audio-only "transcript" the episode may have no `whatsappmessages` rows → it can
  land in `skippedEmpty` instead of `enriched`. **That is a PASS for the selection/skip logic** — report
  which path it took. (Attribute writes additionally require the tenant to have `AttributeDefinition`s;
  if none exist, provenance still stamps on enriched rows.)
