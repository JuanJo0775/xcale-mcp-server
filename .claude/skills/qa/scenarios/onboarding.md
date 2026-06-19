# Concierge Onboarding — QA Scenarios

> **Source**: `docs/api/concierge-onboarding-agent-api-contract.md`
> **PRD**: `docs/features/concierge-onboarding-agent.md`
> **Last reviewed**: 2026-05-05
> **Base URL**: `https://localhost:3200` (dev, self-signed — use `curl -k`)

## Setup

Auth token expected in `$TOKEN`. Pull dev test creds from Doppler:

```bash
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')
```

Token field is `.token` at top level. Response shape: `{success, token, user}`.

The first authenticated `GET /api/v1/onboarding/state` for a user has **lazy side-effects**:
- Creates a concierge `Conversation` for the user
- Sets `User.onboardingState.startedAt`

For idempotency assertions, the test user's onboardingState may already be seeded from a previous run. Treat scenarios 2 and 3 as "first call returns whatever's there; the next call must equal the first" — don't assert specific timestamps.

---

## Group A — Auth gate

### Scenario 1: GET /state without auth returns 401

**Given**: No `Authorization` header.
**When**: `GET /api/v1/onboarding/state`
**Then**:
- Status is `401`
- Body has `.error` equal to `"Unauthorized"`

### Scenario 2: PATCH /state without auth returns 401

**Given**: No `Authorization` header.
**When**: `PATCH /api/v1/onboarding/state` body `{"dismissedAt": null}`
**Then**:
- Status is `401`
- Body has `.error` equal to `"Unauthorized"`

---

## Group B — GET /state lazy creation + shape

### Scenario 3: GET /state returns the documented response shape

**Given**: `$TOKEN` valid.
**When**: `GET /api/v1/onboarding/state`
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.startedAt` matching ISO 8601 (regex `^\d{4}-\d{2}-\d{2}T`)
- Body has `.data.conciergeConversationId` present and non-empty (UUID-ish: `^[0-9a-f-]{36}$`)
- Body has `.data.recommended.hasAgent` is a boolean
- Body has `.data.recommended.hasApp` is a boolean
- Body has `.data.recommended.hasDoc` is a boolean
- Body has `.data.completedAt` (may be `null`)
- Body has `.data.dismissedAt` (may be `null`)

### Scenario 4: GET /state is idempotent — second call returns same conversationId + startedAt

**Given**: `$TOKEN` valid; Scenario 3 just ran (captured `$STARTED_AT`, `$CONV_ID`).
**When**: `GET /api/v1/onboarding/state` again
**Then**:
- Status is `200`
- `.data.startedAt` equals `$STARTED_AT` (not re-seeded)
- `.data.conciergeConversationId` equals `$CONV_ID` (not re-created)

### Scenario 5: Concierge conversation actually exists in the conversations collection

**Given**: `$TOKEN` valid; `$CONV_ID` from Scenario 3.
**When**: `GET /api/chat/conversations/$CONV_ID`
**Then**:
- Status is `200` (auth implicitly enforces ownership — only the authenticated user can fetch their own conversation)
- Body has `.data.agentType` equal to `"concierge"`
- Body has `.data.isActive` equal to `true`

---

## Group C — PATCH /state — dismiss / un-dismiss

### Scenario 6: PATCH /state with valid ISO string sets dismissedAt

**Given**: `$TOKEN` valid; `$NOW` is a fresh `date -u +%Y-%m-%dT%H:%M:%S.%3NZ` value.
**When**: `PATCH /api/v1/onboarding/state` body `{"dismissedAt": "$NOW"}`
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.dismissedAt` equal to `$NOW` (modulo timezone normalisation)

### Scenario 7: PATCH /state with null clears dismissedAt

**Given**: `$TOKEN` valid; Scenario 6 ran (state currently dismissed).
**When**: `PATCH /api/v1/onboarding/state` body `{"dismissedAt": null}`
**Then**:
- Status is `200`
- Body has `.data.dismissedAt` equal to `null`

### Scenario 8: PATCH /state with malformed dismissedAt returns 400

**Given**: `$TOKEN` valid.
**When**: `PATCH /api/v1/onboarding/state` body `{"dismissedAt": "not-a-date"}`
**Then**:
- Status is `400`
- Body has `.success` equal to `false`
- Body has `.error` present and non-empty

### Scenario 9: PATCH /state ignores non-mutable fields

**Given**: `$TOKEN` valid; capture `$STARTED_AT`, `$CONV_ID`, `$COMPLETED_AT` from a fresh `GET /state`.
**When**: `PATCH /api/v1/onboarding/state` body `{"startedAt": "2020-01-01T00:00:00Z", "completedAt": "2020-01-01T00:00:00Z", "conciergeConversationId": "00000000-0000-0000-0000-000000000000"}`
**Then**:
- Status is `200`
- `.data.startedAt` equals `$STARTED_AT` (unchanged)
- `.data.completedAt` equals `$COMPLETED_AT` (unchanged — typically `null`)
- `.data.conciergeConversationId` equals `$CONV_ID` (unchanged)

### Scenario 10: PATCH /state with empty body is a no-op

**Given**: `$TOKEN` valid.
**When**: `PATCH /api/v1/onboarding/state` body `{}`
**Then**:
- Status is `200`
- Returns the current state unchanged

---

## Group D — Recommended booleans reflect live state

These scenarios verify the **derived** booleans are computed live, not cached. Because dev fixtures may already have data, each scenario reads `recommended.*` and asserts it matches what the underlying repos report — rather than asserting a hard true/false.

### Scenario 11: recommended.hasAgent matches active UserAgentConfig count

**Given**: `$TOKEN` valid.
**When**: `GET /api/v1/onboarding/state` → capture `$HAS_AGENT`. Then `GET /api/agent-config/active` → capture `$AGENT_COUNT` (number of returned configs).
**Then**:
- If `$AGENT_COUNT >= 1`, `$HAS_AGENT` is `true`
- If `$AGENT_COUNT == 0`, `$HAS_AGENT` is `false`

### Scenario 12: recommended.hasApp matches Composio + WhatsApp connection presence

**Given**: `$TOKEN` valid.
**When**: `GET /api/v1/onboarding/state` → capture `$HAS_APP`. Then `GET /api/integrations/whatsapp/phone-numbers` → capture `$WA_COUNT`. Optionally `GET /api/v1/composio/connections` → capture `$COMPOSIO_COUNT`.
**Then**:
- If `$WA_COUNT >= 1` OR `$COMPOSIO_COUNT >= 1`, `$HAS_APP` is `true`
- Else `$HAS_APP` is `false`

### Scenario 13: recommended.hasDoc matches active KnowledgeDocument count of type 'document'

**Given**: `$TOKEN` valid.
**When**: `GET /api/v1/onboarding/state` → capture `$HAS_DOC`. Then a knowledge listing endpoint (TBD path; if no public list endpoint exists, mark this scenario `⏭ skipped (no list endpoint)`).
**Then**: `$HAS_DOC` matches the existence of at least one active document.

---

## Group E — Tool authorization (server-side gate)

These probe the `ToolRegistry.isToolAllowedForAgent` enforcement. Because tools are invoked through the agent loop, we test by sending a streaming message to a NON-concierge conversation and asking the agent to use a concierge-only tool. The expectation is the tool is rejected/unavailable rather than executed.

### Scenario 14: Concierge-only tool not invokable from a CUSTOM agent conversation

**Given**: `$TOKEN` valid; `$CUSTOM_CONV_ID` is a custom-agent conversation id (create one if needed via `POST /api/v1/agent/conversations`).
**When**: Send a streaming message to `POST /api/v1/agent/conversations/$CUSTOM_CONV_ID/messages/stream` asking the agent to call `mark_onboarding_complete`.
**Then**:
- The streamed response does NOT include a `tool_use` block for `mark_onboarding_complete`
- (Either the tool is filtered out of the agent's available tools, or the executor refuses with an authorization error.)

> **Note**: This scenario is harder to assert deterministically via curl because LLM choice is involved. Treat as best-effort. If the LLM doesn't try the tool at all, that's still acceptable — we just need to verify it never runs successfully against a non-concierge conversation.

### Scenario 15: i18n keys exist for new concierge messages

**Given**: en + es locale files include the 6 new keys added by the concierge implementation.
**When**: Read `src/infrastructure/i18n/locales/en.json` and `src/infrastructure/i18n/locales/es.json` for any keys under a `concierge.*` or `onboarding.*` namespace introduced by the feature.
**Then**: Both locales have the same keys (no missing translations).

---

## Coverage Notes

- **Tool execution end-to-end** (calling each of the 5 new tools through the concierge agent and asserting the `ui` envelope is returned) is intentionally not in this file. That's an integration test path that's expensive to drive via curl alone (LLM token use, non-determinism). Cover via a separate scenario file (`onboarding-tools.md`) once a recorded fixture or deterministic test mode exists.
- **Frontend cards** (AgentCreatedCard, WhatsappConnectCard, etc.) belong in a `quala` scenario, not here.
