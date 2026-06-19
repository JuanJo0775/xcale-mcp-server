# Native Connections Phase 2.6 — QA Scenarios

> **Branch**: `feat/phase-2-migration-combined`
> **Covers**: WordPress, Instagram, Sanity, Nevatal on the generic connection rail (ADR-0005 / ADR-0007 / ADR-0008)
> **Base URL**: `https://localhost:3200` (dev — self-signed TLS, hence `curl -sk`)
> **Last reviewed**: 2026-06-12 (paths/shapes verified against the live surface)

## Setup

```bash
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')
```

---

## Group A — WordPress (OAuth)

WordPress uses the generic OAuth surface. These tests verify the connect flow returns a proper
auth URL and that the status endpoint reports the integration correctly.

### Scenario A-1: POST /connect returns a valid authUrl

**Given**: `$TOKEN` valid.
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
- Body has `.data.state` non-empty string (the Mongo-backed OAuth state token)

### Scenario A-2: GET /api/v1/connections lists WordPress connection with correct provider

**Given**: A WordPress connection is present for the test user (seed if needed).
**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | select(.provider == "wordpress")'
```
**Then**:
- At least one entry has `.provider` equal to `"wordpress"`
- Entry has `.status` one of `connected`, `expired`, `error`
- Entry has `.id` (non-empty string — save as `$CONN_ID`)
- Entry does NOT contain `accessToken` or `refreshToken` fields

### Scenario A-3: GET /api/integrations/wordpress returns rail-backed status

**Given**: `$TOKEN` valid.
**When**:
```bash
curl -sk https://localhost:3200/api/integrations/wordpress \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.id` equal to `"wordpress"`
- Body has `.integration.actions.connectDescriptor` non-null with a `methods`
  array containing `{ kind: "oauth", endpoint: "/api/v1/connections/wordpress/connect" }`
- Body has `.integration.actions.connectUrl` empty (legacy URL retired per ADR-0008)

### Scenario A-4: DELETE /api/v1/connections/:id soft-deletes the connection

**Given**: `$CONN_ID` from Scenario A-2. `$TOKEN` valid.
**When**:
```bash
curl -sk -X DELETE https://localhost:3200/api/v1/connections/$CONN_ID \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`

### Scenario A-5: DELETE with wrong-user token returns 404 (no existence leak)

**Given**: `$CONN_ID` exists but `$OTHER_TOKEN` belongs to a different user.
**When**:
```bash
curl -sk -X DELETE https://localhost:3200/api/v1/connections/$CONN_ID \
  -H "Authorization: Bearer $OTHER_TOKEN"
```
**Then**:
- Status is `404`

---

## Group B — Instagram (OAuth)

### Scenario B-1: POST /connect returns a valid authUrl

**Given**: `$TOKEN` valid.
**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/instagram/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.authUrl` starting with `https://www.instagram.com/oauth/authorize`
  (current Meta OAuth host; `api.instagram.com` is the legacy Basic Display endpoint)
- Body has `.data.state` non-empty string

### Scenario B-2: GET /api/v1/connections lists Instagram connection with correct provider

**Given**: An Instagram connection is present for the test user.
**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | select(.provider == "instagram")'
```
**Then**:
- Entry has `.provider` equal to `"instagram"`
- Entry has `.status` one of `connected`, `expired`, `error`
- Entry does NOT contain `accessToken` or `refreshToken`

### Scenario B-3: GET /api/integrations/instagram returns rail-backed status

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/instagram \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.actions.connectDescriptor` non-null with an `oauth` method
- Body has `.integration.actions.connectUrl` empty

---

## Group C — Sanity (Credential)

Sanity uses `POST /connect-credential` — no OAuth dance needed. Test credentials from Doppler.

```bash
SANITY_PROJECT_ID=$(doppler secrets get --project xcale --config dev TEST_SANITY_PROJECT_ID --plain)
SANITY_DATASET=$(doppler secrets get --project xcale --config dev TEST_SANITY_DATASET --plain)
SANITY_TOKEN=$(doppler secrets get --project xcale --config dev TEST_SANITY_TOKEN --plain)
```

### Scenario C-1: POST /connect-credential with valid Sanity creds connects

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

### Scenario C-2: POST /connect-credential with wrong token returns 400

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/sanity/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"projectId":"bad-project","dataset":"production","token":"wrong-token"}}'
```
**Then**:
- Status is `400`
- Body has `.success` equal to `false`
- Body has `.error` non-empty

### Scenario C-3: GET /api/v1/connections lists Sanity connection

**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | select(.provider == "sanity")'
```
**Then**:
- Entry has `.provider` equal to `"sanity"`
- Entry has `.accountKey` equal to `$SANITY_PROJECT_ID`
- Entry has `.status` equal to `"connected"`

### Scenario C-4: GET /api/integrations/sanity returns rail-backed status

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/sanity \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"connected"`
- Body has `.integration.actions.connectDescriptor` non-null (credential fields: `projectId`, `dataset`, `token`)

### Scenario C-5: DELETE /api/v1/connections/:id disconnects Sanity

**Given**: `$SANITY_CONN_ID` from Scenario C-3 (`.id`).
**When**:
```bash
curl -sk -X DELETE https://localhost:3200/api/v1/connections/$SANITY_CONN_ID \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Subsequent `GET /api/v1/connections` shows no Sanity entry (or status `disconnected`)

---

## Group D — Nevatal (Credential)

```bash
NEVATAL_API_KEY=$(doppler secrets get --project xcale --config dev TEST_NEVATAL_API_KEY --plain)
```

### Scenario D-1: POST /connect-credential with valid Nevatal key connects

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/nevatal/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"apiKey\":\"$NEVATAL_API_KEY\"}}"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
- Body has `.data.connection.provider` equal to `"nevatal"`
- Body has `.data.connection.status` equal to `"connected"`
- Body has `.data.connection.accountKey` equal to `"nevatal"`

### Scenario D-2: POST /connect-credential with wrong key returns 400

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/nevatal/connect-credential \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"apiKey":"wrong-api-key"}}'
```
**Then**:
- Status is `400`
- Body has `.success` equal to `false`

### Scenario D-3: GET /api/v1/connections lists Nevatal connection

**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | select(.provider == "nevatal")'
```
**Then**:
- Entry has `.provider` equal to `"nevatal"`
- Entry has `.status` equal to `"connected"`

### Scenario D-4: GET /api/integrations/nevatal returns rail-backed status

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/nevatal \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.integration.status` equal to `"connected"`
- Body has `.integration.actions.connectDescriptor` non-null (credential field: `apiKey`)

### Scenario D-5: DELETE /api/v1/connections/:id disconnects Nevatal

**Given**: `$NEVATAL_CONN_ID` from Scenario D-3 (`.id`).
**When**:
```bash
curl -sk -X DELETE https://localhost:3200/api/v1/connections/$NEVATAL_CONN_ID \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- Body has `.success` equal to `true`
