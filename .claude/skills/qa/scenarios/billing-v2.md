# Billing v2 — QA Scenarios

> **Source**: `docs/api/billing-v2-api-contract.md`
> **PRD**: `docs/features/billing-v2-plan-first-saas.md`
> **Last reviewed**: 2026-04-22
> **Base URL**: `https://localhost:3200` (dev, self-signed — use `curl -k`)

## Setup

Scenarios that need auth assume `$TOKEN` is already exported. Obtain it from `POST /api/users/login` with credentials pulled from Doppler `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`:

```bash
TOKEN=$(curl -sk -X POST https://localhost:3200/api/users/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(doppler secrets get --project xcale --config dev TEST_USER_EMAIL --plain)\",\"password\":\"$(doppler secrets get --project xcale --config dev TEST_USER_PASSWORD --plain)\"}" | jq -r '.token')
```

Token field is `.token` at the top level (not `.data.token`). Response shape: `{success, token, user}`.

For scenarios 10 (admin guard 403), use the regular `$TOKEN` above — this user has `roles: ["user"]`, which is exactly the non-admin case the scenario asserts.

Fixture-dependent scenarios list their prerequisite in **Given**. If a fixture doesn't exist, mark the scenario `⏭ skipped (missing fixture)` rather than failing.

---

## Group A — Public routes (no auth required)

### Scenario 1: Plan listing is public

**Given**: No auth.
**When**: `GET /api/v1/plans`
**Then**:
- Status is `200`
- Body has `data.plans | length >= 3`
- Body has `.data.plans[0].tier` equal to `starter`
- Body has `.data.plans[] | .billingInterval` all equal to `monthly`

### Scenario 2: Plan pricing includes COP + USD

**Given**: No auth.
**When**: `GET /api/v1/plans/pricing`
**Then**:
- Status is `200`
- Body has `.data.plans[0].priceCopCents` present
- Body has `.data.plans[0].priceUsdCents` present
- Body has `.data.plans[0].founderPriceCopCents` present
- Body has `.data.exchangeRate` present

### Scenario 3: Founder status counter is public

**Given**: No auth.
**When**: `GET /api/v1/subscriptions/founder/status`
**Then**:
- Status is `200`
- Body has `.data.totalSlots` equal to `50`
- Body has `.data.availableSlots` present
- Body has `.data.isAvailable` present

---

## Group B — Route relocations (slice 2, 10)

### Scenario 4: Legacy `/api/payments/methods` returns 404

**Given**: No auth.
**When**: `GET /api/payments/methods`
**Then**:
- Status is `404`

### Scenario 5: Legacy `/api/billing/balance` returns 404

**Given**: No auth.
**When**: `GET /api/billing/balance`
**Then**:
- Status is `404`

### Scenario 6: Legacy `/api/payments/webhooks/wompi` returns 404

**Given**: No auth.
**When**: `POST /api/payments/webhooks/wompi` with body `{}`
**Then**:
- Status is `404`

### Scenario 7: Legacy `/api/billing/usage/breakdown` returns 404

**Given**: No auth.
**When**: `GET /api/billing/usage/breakdown`
**Then**:
- Status is `404`

---

## Group C — Auth guards

### Scenario 8: `GET /api/v1/payments/methods` without JWT → 401

**Given**: No auth.
**When**: `GET /api/v1/payments/methods`
**Then**:
- Status is `401`

### Scenario 9: `GET /api/v1/subscriptions/current` without JWT → 401

**Given**: No auth.
**When**: `GET /api/v1/subscriptions/current`
**Then**:
- Status is `401`

### Scenario 10: `/api/admin/billing/*` without admin role → 403

**Given**: `$TOKEN` is a non-admin user.
**When**: `GET /api/admin/billing/users/anything/balance` with header `Authorization: Bearer $TOKEN`
**Then**:
- Status is `403`

### Scenario 11: `/api/admin/billing/*` without any JWT → 401

**Given**: No auth.
**When**: `GET /api/admin/billing/users/anything/balance`
**Then**:
- Status is `401`

---

## Group D — ePayco webhook (slice 4, 5)

### Scenario 12: Webhook rejects missing signature

**Given**: No auth, no `x-signature` header.
**When**: `POST /api/v1/payments/webhooks/epayco` with body `{"x_id_invoice":"T1"}`
**Then**:
- Status is `401`
- Body has `.error` equal to `invalid_signature`

### Scenario 13: Webhook rejects tampered signature

**Given**: Signature built with wrong secret.
**When**: `POST /api/v1/payments/webhooks/epayco` with header `x-signature: deadbeef` and body `{"x_id_invoice":"T2"}`
**Then**:
- Status is `401`
- Body has `.error` equal to `invalid_signature`

### Scenario 14: Webhook accepts valid signature, acknowledges unknown charge

**Given**: Signature computed over the raw body with `$EPAYCO_WEBHOOK_SECRET` (pulled from Doppler dev config). Transaction id `UNKNOWN_CHARGE_123` not in DB.
**When**: `POST /api/v1/payments/webhooks/epayco` with signed header and body `{"x_id_invoice":"T3","x_transaction_state":"Aceptada","x_ref_payco":"UNKNOWN_CHARGE_123"}`
**Then**:
- Status is `200`
- Body has `.received` equal to `true`
- Body has `.event` equal to `charge.approved`

### Scenario 15: Webhook normalizes `Rechazada` to `charge.declined`

**Given**: Valid signature as in scenario 14.
**When**: `POST /api/v1/payments/webhooks/epayco` with body where `x_transaction_state` is `Rechazada`
**Then**:
- Status is `200`
- Body has `.event` equal to `charge.declined`

### Scenario 16: Webhook normalizes unknown state to `unknown` but still acks

**Given**: Valid signature; state not in ePayco's enum.
**When**: `POST /api/v1/payments/webhooks/epayco` with body where `x_transaction_state` is `GARBAGE_STATE`
**Then**:
- Status is `200`
- Body has `.event` equal to `unknown`
- Body has `.received` equal to `true`

---

## Group E — Current subscription read

### Scenario 17: `/current` returns 404 when user has no subscription

**Given**: `$TOKEN` belongs to a user with zero rows in `user_subscriptions`.
**When**: `GET /api/v1/subscriptions/current` with auth header
**Then**:
- Status is `404`
- Body has `.success` equal to `false`

### Scenario 18: `/current` returns embedded plan + usage + banner on active sub

**Given**: `$TOKEN` belongs to a user with an `active` subscription (fixture: seed via `POST /api/v1/subscriptions`).
**When**: `GET /api/v1/subscriptions/current`
**Then**:
- Status is `200`
- Body has `.data.subscription.status` equal to `active`
- Body has `.data.plan` present
- Body has `.data.usage.conversationsUsed` present
- Body has `.data.paymentMethod` present

---

## Group F — Subscription creation (trial flow, slices 5 + 8)

### Scenario 19: Create subscription without `paymentMethodId` → 400 `trial_requires_payment_method`

**Given**: `$TOKEN` belongs to a user with no active subscription.
**When**: `POST /api/v1/subscriptions` with body `{"planId": "<any-valid-plan-id>"}`
**Then**:
- Status is `400`
- Body has `.error` containing (regex) `payment.*method|trial_requires_payment_method`

### Scenario 20: Create subscription with bogus `paymentMethodId` → 404

**Given**: `$TOKEN` with no active subscription.
**When**: `POST /api/v1/subscriptions` with body `{"planId":"<valid>","paymentMethodId":"does-not-exist"}`
**Then**:
- Status is `404`

---

## Group G — Plan-change preview (slice 11)

### Scenario 21: Proration preview requires `planId` query param

**Given**: `$TOKEN` with an active subscription on Starter.
**When**: `GET /api/v1/subscriptions/current/proration-preview`
**Then**:
- Status is `400`

### Scenario 22: Proration preview for same-plan change → 400 `invalid_plan_transition`

**Given**: `$TOKEN` on Starter.
**When**: `GET /api/v1/subscriptions/current/proration-preview?planId=<starter-id>`
**Then**:
- Status is `400`
- Body has `.error` containing (regex) `plan.*transition|invalid`

### Scenario 23: Proration preview Starter → Pro returns positive netCharge

**Given**: `$TOKEN` on Starter.
**When**: `GET /api/v1/subscriptions/current/proration-preview?planId=<pro-id>`
**Then**:
- Status is `200`
- Body has `.data.prorationType` equal to `charge`
- Body has `.data.netChargeCents` present and `> 0`
- Body has `.data.currency` equal to `USD`

### Scenario 24: Proration preview Pro → Starter returns credit (negative netCharge)

**Given**: `$TOKEN` on Pro.
**When**: `GET /api/v1/subscriptions/current/proration-preview?planId=<starter-id>`
**Then**:
- Status is `200`
- Body has `.data.prorationType` equal to `credit`
- Body has `.data.netChargeCents` present and `< 0`

---

## Group H — Hard-cap enforcement (slice 9)

### Scenario 25: Conversation creation at cap returns `402 plan_cap_exceeded`

**Given**: `$TOKEN` on a Starter subscription whose `conversationsUsed >= softConversationCap` (500). Fixture: seed via direct Mongo update OR call `POST /api/agent/conversations` 500× (expensive — prefer fixture).
**When**: `POST /api/agent/conversations` with minimal body
**Then**:
- Status is `402`
- Body has `.errorCode` equal to `plan_cap_exceeded`
- Body has `.data.resource` equal to `conversation`
- Body has `.data.cap` equal to `500`

### Scenario 26: Agent creation at cap returns `402 plan_cap_exceeded`

**Given**: `$TOKEN` on Starter with `agentsUsed >= maxAgents` (1).
**When**: `POST /api/agents` with a valid create body
**Then**:
- Status is `402`
- Body has `.errorCode` equal to `plan_cap_exceeded`
- Body has `.data.resource` equal to `agent`

### Scenario 27: No active subscription on conversation creation → `402 subscription_required`

**Given**: `$TOKEN` with no active subscription.
**When**: `POST /api/agent/conversations` with minimal body
**Then**:
- Status is `402`
- Body has `.errorCode` equal to `subscription_required`

---

## Group I — Payment method removal guard (slice 8)

### Scenario 28: Deleting last card during trial → 409 `cannot_remove_last_card_during_trial`

**Given**: `$TOKEN` user has a trialing subscription and exactly one active PaymentMethod (fixture required).
**When**: `DELETE /api/v1/payments/methods/<the-card-id>`
**Then**:
- Status is `409`
- Body has `.errorCode` equal to `cannot_remove_last_card_during_trial`

### Scenario 29: Deleting a non-owned card → 403

**Given**: `$TOKEN` and a `paymentMethodId` that belongs to a different user.
**When**: `DELETE /api/v1/payments/methods/<other-user-card-id>`
**Then**:
- Status is `403`
- Body has `.errorCode` equal to `unauthorized_payment_method`

### Scenario 30: Deleting a non-existent card → 404

**Given**: `$TOKEN`, arbitrary id.
**When**: `DELETE /api/v1/payments/methods/definitely-not-a-card`
**Then**:
- Status is `404`
- Body has `.errorCode` equal to `payment_method_not_found`
