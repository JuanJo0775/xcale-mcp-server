# CONTEXT.md — xcale-mcp-server glossary

The canonical vocabulary for this repo. One term, what it **is**, and `_Avoid_:` for rejected
aliases. No implementation detail, no decisions (those live in `docs/adr/` and feature designs).
Seeded from `docs/foundation.md` §17 and sharpened during the first `/grill` session
(2026-06-18). Skills (`grill`, `feature-design`) read and update this file.

---

**MCP** — Model Context Protocol; open standard (JSON-RPC 2.0) for exposing tools to LLM
clients. https://modelcontextprotocol.io

**MCP server** — this repo (`xcale-mcp-server`); exposes provider tools over MCP.
_Avoid_: "the gateway" as a synonym for the whole system — the gateway is the *shape*, the
server is the artifact.

**MCP client** — xcale-backend; consumes the server's tools. The only consumer in v1.

**Provider / adapter** — a thin module that maps one external API (e.g. Nevatal) to the MCP
tool contract. _Avoid_: "integration" (overloaded — say "provider" for the adapter here,
"connection" for a user's authenticated link in Rail A).

**Tool** — a single callable capability (`name` + `inputSchema`), discoverable via `tools/list`,
runnable via `tools/call`.

**Protocol boundary** — the MCP surface between backend and server, now **three pillars**:
`server/discover` (capability catalog), `tools/list`, `tools/call`. The *only* interface between
the two systems. _Avoid_: calling it "two methods" (outdated); treating internal module APIs as
"the boundary".

**Thin ACL (anti-corruption layer)** — the design stance resolved in grill: the MCP SDK is
confined to `src/protocol/`, which translates MCP wire types ↔ our own domain types
(`IProvider`, `ToolDefinition`, `ToolResult`). Adapters never import `@modelcontextprotocol/sdk`.
JSON Schema is reused as-is; the transport is **not** abstracted (one protocol only).
_Avoid_: "MCP is the core" (it is a swappable edge); "transport-agnostic core" (rejected as
premature abstraction).

**Plugin core** — the stable inner system (registry + adapters + domain types) that the MCP
"skin" wraps. The phrase "a plugin disguised as MCP" refers to this stance.

**Stateless (two distinct senses — keep separate)** —
  1. *stateless auth*: the server holds no credentials; it receives a token per call and
     discards it (never persists, caches, or logs the raw token).
  2. *stateless transport*: Streamable HTTP with **no** `Mcp-Session-Id`; each `tools/call` is
     an independent POST. Chosen partly to sidestep MCP's session-elimination breaking change.

**Hop A** — auth from the forwarded user token → the provider API (per-connection data, carried
in `X-Provider-Token`).

**Hop B** — auth from xcale-backend → xcale-mcp-server (infrastructure trust; a shared-secret
`Authorization: Bearer`). _Avoid_: conflating Hop A and Hop B — they are different secrets and
**neither is ever logged**.

**`X-Provider-Token`** — the request header carrying the decrypted, opaque provider credential
for Hop A. The adapter applies it per its provider's scheme; the core never interprets it.

**`PROVIDER_AUTH_EXPIRED`** — the typed, machine-readable code returned in a `tools/call` result
with `isError: true` (in `structuredContent`) when a provider returns 401/403. The backend maps
this code → Rail A's `markConnectionAuthFailure()` → reconnect prompt. _Avoid_: signalling
expiry as a JSON-RPC protocol error (rejected — it's a tool-execution failure, not protocol).

**`ProviderCallContext.metadata`** — an opaque `Record<string, unknown>` channel for
provider-scoped data an adapter needs beyond the token (e.g. `accountKey`, `storeDomain`). Each
adapter validates the keys it needs with `zod`. _Avoid_: treating metadata as tenant/user
identity — it carries no business meaning to the core.

**Curation (author-time)** — we expose a high-signal tool set by **declaring only the tools that
matter** in each adapter, not by running a runtime curation engine. _Avoid_: "the server curates"
(it doesn't; per-user/token-budget curation stays in the backend's existing `composio/curation`).

**Tool Basket** — xcale-backend's per-user materialized set of available tools (a backend term;
the server has no notion of it).

**Rail A** — xcale-backend's connection/OAuth/re-auth lifecycle. Owns token storage. Still owns
auth even after a provider migrates to MCP.

**Rail E** — xcale-backend's `ToolboxDefinition` + `registerAllToolboxes()`; defines the
`MCPToolboxDefinition` (`source: 'mcp'`) stub this project fulfills.

**`StandardToolResult`** — xcale-backend's normalized tool-result envelope (`success`, `message`,
`data`, optional `ui`). The backend's MCP client maps our `ToolResult` into this; it is **not** a
type in this repo.

**Provider Self-Containment** — architectural principle #1: adding a provider means working
almost exclusively in `src/providers/{slug}/`; the only permitted backend touch is generic config
(secrets/env) or business policy, never provider-specific code. _Avoid_: editing backend logic to
support a standard provider (that is the alarm signal). See `docs/architecture-review.md` §0.

**Capability catalog** — what `server/discover` publishes: per provider, its `slug`, display
metadata, `authDescriptor`, `contextSchema`, `toolCount`, health, and `schemaVersion`. The backend
discovers providers from this instead of hardcoding them. _Avoid_: "the registry" (that is the
server's internal list; the catalog is the published view of it).

**`authDescriptor`** — the **non-secret**, adaptive auth blueprint a provider publishes (api_key →
type + field labels; oauth2 → URLs/scopes/placement). Lets Rail A run auth flows generically.
_Avoid_: putting secrets (`clientId`/`clientSecret`) in it — those stay in the backend's Doppler.

**`ProviderErrorCode`** — the closed, `as const` set of error codes on the `ToolResult` error
variant (`PROVIDER_AUTH_EXPIRED`, `PROVIDER_RATE_LIMITED`, …); evolves additively only. _Avoid_:
free-form error strings.

**Credential-in-Transit-Only** — the server may process a provider credential in memory for one
invocation, but must never persist it (DBs, queues, persistent caches, logs, metrics, traces,
dumps). The governing invariant of the credential boundary. See
`docs/security/credential-boundary-review.md`.

**`SecretString`** — branded wrapper type for the forwarded credential whose `toJSON`/`toString`/
`inspect` return `"[REDACTED]"`; `.reveal()` is called only at the provider egress, only inside
`src/providers/**`. The mechanical enforcement of Credential-in-Transit-Only.

**Consumer-agnostic** — architectural principle #2: public contracts carry no consumer-specific
concepts (no xcale entities, tenant ids, plan/business terms); the server is told *which token* and
*which tool*, never *which tenant*. xcale-backend is the **first consumer**, not a dependency.
_Avoid_: "the boundary between xcale-backend and the server" (it is the boundary between the server
and *any* consumer). See `docs/adr/consumer-agnostic-contract.md`.

**Provider lifecycle** — per-provider evolution metadata in `manifest.ts`/catalog: `providerVersion`
(adapter semver), `apiVersion`, `deprecated`, `sunsetDate`. v1 ships `providerVersion` (+
`schemaVersion`); the rest are **reserved** so a provider can evolve or be retired without breaking
consumers. _Avoid_: conflating it with `schemaVersion` (that versions the contract; this versions
the provider). See `docs/adr/additive-contract-versioning.md`.

**Provider capabilities (reserved)** — optional flags a provider may declare in the catalog
(`streaming`, `longRunning`, `webhooks`, `polling`, `files`, `pagination`, `autoRefresh`); absent =
not supported. Reserved now so the model isn't limited to simple synchronous calls; each is built
only on demonstrated need (*complexity on demand*). See `docs/architecture-review.md` §4.3.

**Complexity on demand** — the rule that no new infrastructure (own DB, queues, scheduler, complex
discovery, distributed plugin runtimes) is added until a demonstrable need exists; introducing any
requires an ADR. Keeps the platform maintainable as providers grow. _Avoid_: building for a "might
need it someday" scenario.
