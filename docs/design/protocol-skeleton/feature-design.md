# Feature Design — Protocol Skeleton (Phase 2)

- **Status:** In progress · **Date:** 2026-06-19 · **Branch:** `feat/protocol-skeleton`
- **Phase:** Roadmap Phase 2 (foundation §15) — the runnable shell, one stub provider, no real API.
- **Owner:** Juan José
- **Design layer:** the WHY/WHAT here is already locked by `docs/architecture-review.md` + the ADRs;
  this doc is intentionally lean and references them rather than re-deriving.

## Problem & goal

Stand up the **minimal runnable shell** of the gateway so the architecture's seams exist and can
be tested end-to-end with a **stub provider** — before any real provider (Nevatal/ePayco). Success
is measured by the §10 criteria of the architecture review: a provider lives only in
`src/providers/{slug}/`, nothing provider-specific leaks into shared infra or consumers.

## Scope (in)

- Core domain seams: `IProvider`, `ProviderAuthDescriptor`, `ProviderManifest`, `ProviderCallContext`,
  `ToolResult` (discriminated union), `ProviderErrorCode` (closed set), `SecretString`.
- The explicit `ProviderRegistry` (no auto-discovery) + the derived capability `Catalog`.
- The three protocol pillars over MCP / JSON-RPC 2.0 on Fastify (stateless Streamable HTTP):
  `server/discover`, `tools/list`, `tools/call`.
- **Hop B** auth (shared-secret Bearer) verified in one place; `X-Provider-Token` (`SecretString`)
  extraction, never logged.
- One **stub provider** (`echo`) proving the seam (no external API; `api_key` auth shape).
- Tests: core unit tests + a provider **conformance** test.

## Scope (out — explicitly)

- No real provider, no DB, no workers, no curation engine, no tool-search, no ephemeral-token
  exchange (the credential ADR's MVP = direct forwarding + guardrails). *Complexity on demand.*
- No backend (consumer) changes.

## Architectural decisions (already locked — see ADRs)

- Thin ACL: MCP SDK confined to `src/protocol/`. → `stateless-gateway-and-thin-acl`
- Three pillars incl. `server/discover`. → `three-pillar-mcp-contract-with-discovery`
- Knowledge in server, custody in consumer; adaptive `authDescriptor`. → `provider-knowledge-vs-credential-custody`
- Typed result + closed error codes. → `typed-tool-result-error-contract`
- Additive versioning + lifecycle/capabilities reserved. → `additive-contract-versioning`
- Consumer-agnostic contracts. → `consumer-agnostic-contract`
- Credential-in-Transit-Only + `SecretString`. → `credential-forwarding-and-token-model` + `docs/security/`

## Build slices (vertical, ordered)

1. **Project scaffold** — package.json, tsconfig, vitest, .env.example.
2. **Core domain** — types, `SecretString`, errors, `IProvider`/descriptor/manifest, registry, catalog. *(testable, no SDK)*
3. **Stub provider `echo`** — manifest + auth descriptor + tools + provider + errors + conformance test.
4. **Protocol layer** — Fastify app, hop-B auth, MCP handlers for the three pillars, `SecretString` extraction, pino redaction.
5. **Server entrypoint** — `server.ts` (config, health, `/mcp`), smoke test.

## Success criteria

The §10 validation experiment, applied to the `echo` stub now and to the first real providers next:
the provider is added only under `src/providers/echo/`, no `switch`/`if`/registration in
`src/core|protocol|auth`, tests validate descriptor + tools + contract with no manual exceptions.
