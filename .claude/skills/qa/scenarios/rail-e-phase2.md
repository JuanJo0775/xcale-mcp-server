# Rail E Phase 2 — QA Scenarios

> **Branch**: `main` (post-merge)
> **Covers**: Sanity, Instagram, WordPress, WhatsApp, Shopify migrated to ToolboxDefinition + `registerAllToolboxes()` (5 new providers on the rail; Nevatal + GSC were Phase 1).
> **Scope**: Backend curl — startup, catalog, status resolvers, credential connect, OAuth authUrl generation, reconnect safety. Browser OAuth (WordPress, Instagram full dance) → `fe-qa-handoff.md`.
> **Base URL**: `https://localhost:3200` (dev self-signed TLS → `curl -sk`)
> **Last reviewed**: 2026-06-18

## Setup

```bash
# Login — get token
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')

echo "TOKEN: ${TOKEN:0:20}..."

# Credential vars (pull from Doppler)
SANITY_PROJECT_ID=$(doppler secrets get --project xcale --config dev TEST_SANITY_PROJECT_ID --plain 2>/dev/null || echo "")
SANITY_DATASET=$(doppler secrets get --project xcale --config dev TEST_SANITY_DATASET --plain 2>/dev/null || echo "production")
SANITY_TOKEN=$(doppler secrets get --project xcale --config dev TEST_SANITY_TOKEN --plain 2>/dev/null || echo "")
SHOPIFY_SHOP=$(doppler secrets get --project xcale --config dev TEST_SHOPIFY_SHOP --plain 2>/dev/null || echo "")
SHOPIFY_TOKEN=$(doppler secrets get --project xcale --config dev TEST_SHOPIFY_ADMIN_TOKEN --plain 2>/dev/null || echo "")
```

> **Note**: If `TEST_SANITY_*` or `TEST_SHOPIFY_*` keys don't exist in Doppler, check for alternate names (`SANITY_PROJECT_ID`, `SHOPIFY_TEST_STORE`, etc.). Create a scratch Sanity project + Shopify dev store if no test creds are provisioned.

---

## Group 0 — Startup

### Scenario 0-1: Health check — server is up

**Given**: `npm run dev` has been running for at least 10s.
**When**:
```bash
curl -sk https://localhost:3200/health
```
**Then**:
- Status is `200`
- Body has `.status` equal to `"ok"` (or any non-error shape)

### Scenario 0-2: No startup errors in logs

**Given**: Server just started.
**Then** (manual log inspection):
- No `Error:` or `Cannot find module` or `is not a function` in startup output
- `[SCHEDULER] Agenda connected to MongoDB and ready` appears
- Server announces port 3200

---

## Group 1 — Auth

### Scenario 1-1: Login returns a valid JWT token

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}"
```
**Then**:
- Status is `200`
- Body has `.token` non-empty string
- Body does NOT contain `password`

---

## Group 2 — Catalog (7 native providers)

### Scenario 2-1: Catalog lists all 7 native providers with source: native

**When**:
```bash
curl -sk https://localhost:3200/api/v1/catalog/apps \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[] | select(.source == "native") | .id] | sort'
```
**Then**:
- Status is `200`
- Result array contains ALL of: `"nevatal"`, `"google-search-console"`, `"sanity"`, `"instagram"`, `"wordpress"`, `"whatsapp"`, `"shopify"`
- None of the 7 appear with `source: "composio"` in a parallel lookup

### Scenario 2-2: Each Phase 2 provider has required catalog fields

**When** (run for each of: `sanity`, `instagram`, `wordpress`, `whatsapp`, `shopify`):
```bash
curl -sk "https://localhost:3200/api/v1/catalog/apps/shopify" \
  -H "Authorization: Bearer $TOKEN" | jq '{id:.data.id, source:.data.source, displayName:.data.displayName, requiresOAuth:.data.requiresOAuth}'
```
**Then** (for each provider):
- `.data.source` equal to `"native"`
- `.data.id` matches the slug
- `.data.displayName` non-empty
- Shopify and WordPress: `.data.requiresOAuth` is `true`
- Sanity and WhatsApp: `.data.requiresOAuth` is `false`

---

## Group 3 — Status resolvers: not_connected (clean user)

> **Precondition**: Use a test user with NO pre-existing connections, or run after disconnecting all.

### Scenario 3-1: GET /api/integrations — all Phase 2 providers return not_connected

**When**:
```bash
curl -sk https://localhost:3200/api/integrations \
  -H "Authorization: Bearer $TOKEN" | jq '[.integrations[] | select(.id | IN("sanity","instagram","wordpress","whatsapp","shopify")) | {id, status}]'
```
**Then**:
- All 5 providers present in the array
- Each has `.status` equal to `"not_connected"`
- No provider throws a 500 / missing from array

### Scenario 3-2: GET /api/integrations/sanity — not_connected, no crash

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/sanity \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"not_connected"`
- Body has `.integration.connections` equal to `[]`
- Body has `.integration.actions.connectDescriptor.methods` array with a `credential` entry
  whose `endpoint` is `"/api/v1/connections/sanity/connect-credential"`

### Scenario 3-3: GET /api/integrations/whatsapp — not_connected, no crash (custom resolver)

WhatsApp uses its own `MongoWhatsAppConnectionRepository`-backed resolver — NOT the rail. This test verifies it doesn't crash when no WA connection exists.

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/whatsapp \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"not_connected"`
- Body has `.integration.connections` equal to `[]`
- No 500 / stack trace in response

### Scenario 3-4: GET /api/integrations/shopify — not_connected, connectDescriptor has dual methods

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/shopify \
  -H "Authorization: Bearer $TOKEN" | jq '.integration.actions.connectDescriptor.methods | map(.kind)'
```
**Then**:
- Status is `200`
- `.integration.status` equal to `"not_connected"`
- `connectDescriptor.methods` contains BOTH `"oauth"` AND `"credential"` kinds
  (Shopify has dual auth: OAuth or API key)

### Scenario 3-5: GET /api/integrations/wordpress — not_connected, oauth connectDescriptor

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/wordpress \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- `.integration.status` equal to `"not_connected"`
- `.integration.actions.connectDescriptor.methods[0].kind` equal to `"oauth"`
- `.integration.actions.connectDescriptor.methods[0].endpoint` equal to `"/api/v1/connections/wordpress/connect"`

### Scenario 3-6: GET /api/integrations/instagram — not_connected, oauth connectDescriptor

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/instagram \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- `.integration.status` equal to `"not_connected"`
- `.integration.actions.connectDescriptor.methods[0].kind` equal to `"oauth"`
- `.integration.actions.connectDescriptor.methods[0].endpoint` equal to `"/api/v1/connections/instagram/connect"`

---

## Group 4 — OAuth authUrl generation (no browser needed)

These tests verify the OAuth initiation surface returns a correct `authUrl`. The actual browser dance is in `fe-qa-handoff.md`.

### Scenario 4-1: WordPress OAuth — POST /connect returns a valid authUrl

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/wordpress/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.authUrl` starting with `https://public-api.wordpress.com/oauth2/authorize`
- Body has `.data.state` non-empty (Mongo-backed OAuth state token)

### Scenario 4-2: Instagram OAuth — POST /connect returns a valid authUrl

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/instagram/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```
**Then**:
- Status is `200`
- Body has `.data.authUrl` starting with `https://www.instagram.com/oauth/authorize`
  (NOT `api.instagram.com` — that's the deprecated Basic Display endpoint)
- Body has `.data.state` non-empty

### Scenario 4-3: Shopify OAuth — POST /connect with shop domain returns authUrl

Shopify's `authBaseUrl` is dynamic (per shop). Requires the `shop` field in `data`.

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/shopify/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"shop\":\"${SHOPIFY_SHOP}\"}}"
```
**Then**:
- Status is `200`
- Body has `.data.authUrl` containing `${SHOPIFY_SHOP}` and `admin/oauth/authorize`
- Body has `.data.state` non-empty

> **Skip** if `$SHOPIFY_SHOP` is empty (no test store provisioned).

---

## Group 5 — Credential connect: Sanity

### Scenario 5-1: POST /connect-credential with valid Sanity creds → connected

**Precondition**: `$SANITY_PROJECT_ID`, `$SANITY_TOKEN` are set.
**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/sanity/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"projectId\":\"$SANITY_PROJECT_ID\",\"dataset\":\"$SANITY_DATASET\",\"token\":\"$SANITY_TOKEN\"}}"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.connection.provider` equal to `"sanity"`
- Body has `.data.connection.status` equal to `"connected"`
- Body has `.data.connection.accountKey` equal to `$SANITY_PROJECT_ID`
- Body does NOT contain `accessToken` or `refreshToken`

### Scenario 5-2: GET /api/integrations/sanity → status connected + connectionDetails

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/sanity \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"connected"`
- Body has `.integration.connections[0].connectionDetails.projectId` equal to `$SANITY_PROJECT_ID`
- Body has `.integration.connections[0].connectionDetails.dataset` non-empty

### Scenario 5-3: POST /connect-credential with wrong token → 400

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/sanity/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"projectId":"bad-proj","dataset":"production","token":"wrong-token"}}'
```
**Then**:
- Status is `400`
- Body has `.success` equal to `false`
- Body has `.error` non-empty (e.g. "Invalid Sanity credentials")

---

## Group 6 — Credential connect: Shopify

### Scenario 6-1: POST /connect-credential with valid Shopify API key → connected

**Precondition**: `$SHOPIFY_SHOP` and `$SHOPIFY_TOKEN` are set.
**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/shopify/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"shop\":\"$SHOPIFY_SHOP\",\"token\":\"$SHOPIFY_TOKEN\"}}"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.connection.provider` equal to `"shopify"`
- Body has `.data.connection.status` equal to `"connected"`
- Body has `.data.connection.accountKey` equal to `$SHOPIFY_SHOP`
- Body does NOT contain `accessToken` or `refreshToken`

### Scenario 6-2: GET /api/integrations/shopify → status connected + shopDomain + authMethod

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/shopify \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"connected"`
- Body has `.integration.connections[0].connectionDetails.shopDomain` equal to `$SHOPIFY_SHOP`
- Body has `.integration.connections[0].connectionDetails.authMethod` equal to `"api_key"`

### Scenario 6-3: POST /connect-credential with invalid shop domain format → 400

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/shopify/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"shop":"notavaliddomain","token":"any-token"}}'
```
**Then**:
- Status is `400`
- Body has `.error` containing "Invalid shop domain"

---

## Group 7 — Reconnect safety

### Scenario 7-1: Credential reconnect (Sanity) — connect-credential a second time → upserts, no error

This is the correct reconnect path for credential providers (upsert, not OAuth dance).

**Given**: Sanity is already connected (Scenario 5-1 ran).
**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/sanity/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"projectId\":\"$SANITY_PROJECT_ID\",\"dataset\":\"$SANITY_DATASET\",\"token\":\"$SANITY_TOKEN\"}}"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.connection.status` equal to `"connected"`
- No "already connected" error (idempotent upsert)

### Scenario 7-2: POST /reconnect on a credential-only provider (Sanity) — behavior check

The `/reconnect` endpoint calls `initiateConnection` (OAuth flow). For credential-only providers this should fail gracefully — NOT 500.

**Given**: Sanity is connected.
**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/sanity/reconnect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```
**Then**:
- Status is `400` (no OAuth config for Sanity — expected controlled error)
- Body has `.success` equal to `false`
- Body has `.error` non-empty
- **NOT** `500` (no unhandled exception)

> **Finding risk**: If this returns 500 or a stack trace, the OAuth start path doesn't guard against
> unregistered providers — that's a Blocker. A clean 400 is the correct behavior.

### Scenario 7-3: OAuth reconnect (WordPress) — POST /reconnect returns fresh authUrl

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/wordpress/reconnect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```
**Then**:
- Status is `200`
- Body has `.data.authUrl` starting with `https://public-api.wordpress.com/oauth2/authorize`
- (Same as `/connect` — reconnect always proceeds, no "already connected" gate)

---

## Group 8 — Connections list

### Scenario 8-1: GET /api/v1/connections lists Sanity + Shopify connections (no tokens)

**Given**: Scenarios 5-1 and 6-1 have run.
**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[] | select(.provider | IN("sanity","shopify")) | {provider, status, accountKey}]'
```
**Then**:
- Sanity entry: `.provider` = `"sanity"`, `.status` = `"connected"`, `.accountKey` = `$SANITY_PROJECT_ID`
- Shopify entry: `.provider` = `"shopify"`, `.status` = `"connected"`, `.accountKey` = `$SHOPIFY_SHOP`
- Neither entry contains `accessToken` or `refreshToken` fields

---

## Group 9 — WhatsApp: custom resolver deep check

### Scenario 9-1: WhatsApp status with active connection — verifyToken decrypts correctly

**Given**: A WhatsApp connection exists for the test user (requires WhatsApp embedded-signup — skip if not available).
**When**:
```bash
curl -sk https://localhost:3200/api/integrations/whatsapp \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"connected"`
- Body has `.integration.connections[0].connectionDetails.verifyToken` as a readable string (NOT an encrypted blob)
- Body has `.integration.connections[0].connectionDetails.phoneNumberId` non-empty

> **Skip** if no WhatsApp connection exists — Scenario 3-3 already covers the not_connected path.

---

## Browser OAuth scenarios → FE handoff

Scenarios for WordPress and Instagram full OAuth browser dance (callback redirect, `connection=success`, `availableSites` for WordPress, `instagramUserId` in metadata for Instagram) are documented in:

**`docs/design/rail-e-phase2/fe-qa-handoff.md`**

Those scenarios run in the FE repo (`xcale-frontend`) via `quala` (Playwright), not from here.
