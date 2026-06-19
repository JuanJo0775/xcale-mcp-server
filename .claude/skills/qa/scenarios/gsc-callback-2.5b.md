# GSC Callback Migration (Phase 2.5b) — QA Scenarios

> **Covers**: Google Search Console connection lifecycle on the generic rail
> (ADR-0005 / ADR-0008 / ADR-0009) — connect, callback error path, list shape
> (`toPublic()` 2.5b extension), reconnect, ownership-guarded DELETE, and
> deletion of the old `/api/gsc/*` surface.
> **Contract**: `docs/design/native-toolbox-platform/gsc-callback-migration/api-contract.md`
> **Base URL**: `https://localhost:3200` (dev — self-signed TLS, hence `curl -sk`)
> **Last reviewed**: 2026-06-12
>
> **Not covered here (manual, ship-log item):** the real-Google E2E
> (connect → consent → callback → `onConnected` site enrichment). Headless curl
> can't complete Google's consent screen. Verify once on dev per the cutover
> runbook (feature-design §8 step 3).

## Setup

```bash
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')
```

---

## Group A — Connect surface

### Scenario A-1: POST /connect returns a Google authUrl pointing at the generic callback

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/google-search-console/connect \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
```
**Then**:
- Status is `200`
- `.success` is `true`
- `.data.authUrl` starts with `https://accounts.google.com/o/oauth2/v2/auth`
- `.data.authUrl` contains `redirect_uri=` whose decoded value ends with
  `/api/v1/connections/google-search-console/callback` (NOT the old `/api/gsc/callback`)
- `.data.authUrl` contains `access_type=offline` and `prompt=consent`
- `.data.state` is a non-empty string

### Scenario A-2: connect requires auth

**When**: same request without the `Authorization` header.
**Then**: Status is `401`.

### Scenario A-3: GET /api/integrations/google-search-console exposes the oauth Connect Descriptor

**When**:
```bash
curl -sk https://localhost:3200/api/integrations/google-search-console \
  -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`
- `.integration.actions.connectDescriptor.methods[0].kind` is `"oauth"`
- `.integration.actions.connectDescriptor.methods[0].endpoint` is
  `"/api/v1/connections/google-search-console/connect"`
- `.integration.actions.connectDescriptor.methods[0].fields` is `[]` (AD-5: no siteUrl input)
- `.integration.actions.connectUrl` is empty (legacy URL retired)

---

## Group B — Callback error path (unauthenticated; CSRF = one-time state)

### Scenario B-1: callback with bogus state redirects with connection=error

**When**:
```bash
curl -sk -o /dev/null -w "%{http_code} %{redirect_url}" \
  "https://localhost:3200/api/v1/connections/google-search-console/callback?code=bogus&state=does-not-exist"
```
**Then**:
- Status is `302`
- `redirect_url` contains `connection=error` and `integration=google-search-console`
- No connection document is created

### Scenario B-2: old GSC surface is gone

**When**: each of
```bash
curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:3200/api/gsc/connect -H "Authorization: Bearer $TOKEN"
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:3200/api/gsc/status -H "Authorization: Bearer $TOKEN"
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:3200/api/gsc/callback?code=x&state=y"
```
**Then**: every status is `404` (routes deleted per contract §1.1).

---

## Group C — List shape (`toPublic()` 2.5b extension)

### Scenario C-1: every connection in GET /api/v1/connections carries the 2.5b fields

**When**:
```bash
curl -sk https://localhost:3200/api/v1/connections -H "Authorization: Bearer $TOKEN"
```
**Then**:
- Status is `200`, `.success` is `true`, `.data` is an array
- **Every** entry has the keys `lastRefreshedAt` (string or null),
  `needsReconnect` (boolean), `createdAt` (string), `updatedAt` (string)
- `needsReconnect` is `true` iff `status` ∈ {`expired`, `revoked`, `error`}
- No entry contains `accessToken` or `refreshToken` at any depth
- No entry has `status` equal to `disconnected` (list is active-only)

### Scenario C-2: GSC entry metadata shape (only if a GSC connection exists for the test user)

**Given**: a `google-search-console` entry in C-1's response (skip if none — record SKIPPED).
**Then**:
- `.accountKey` is a Google account email
- `.metadata.sites` is an array (may be empty if `onConnected` failed)
- `.metadata` does NOT contain `requestedSiteUrl` (dead code removed, AD-5)

---

## Group D — Reconnect

### Scenario D-1: POST /reconnect always proceeds (no "already connected" deadlock)

**When**:
```bash
curl -sk -X POST https://localhost:3200/api/v1/connections/google-search-console/reconnect \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
```
**Then**:
- Status is `200` regardless of current GSC connection status
- `.data.authUrl` and `.data.state` present (same shape as A-1)

---

## Group E — Ownership-guarded DELETE (ship-blocking per feature-design §2 / R-4)

### Scenario E-1: DELETE a non-existent id returns 404 with the standard envelope

**When**:
```bash
curl -sk -o /dev/null -w "%{http_code}" -X DELETE \
  https://localhost:3200/api/v1/connections/00000000-0000-4000-8000-000000000000 \
  -H "Authorization: Bearer $TOKEN"
```
**Then**: Status is `404`.

### Scenario E-2: cross-user DELETE returns 404 and does NOT delete (no existence leak)

**Given**: `$CONN_ID` = any connection id of the test user (from C-1); `$OTHER_TOKEN` = JWT
of a second user (register a throwaway user if needed).
**When**:
```bash
curl -sk -o /dev/null -w "%{http_code}" -X DELETE \
  https://localhost:3200/api/v1/connections/$CONN_ID \
  -H "Authorization: Bearer $OTHER_TOKEN"
```
**Then**:
- Status is `404` (indistinguishable from not-found)
- A subsequent C-1 call with `$TOKEN` still lists `$CONN_ID` (nothing was deleted)

### Scenario E-3: DELETE requires auth

**When**: E-1's request without the `Authorization` header.
**Then**: Status is `401`.
