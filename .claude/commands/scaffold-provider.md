---
description: Generate the skeleton for a new provider adapter (src/providers/{slug}/) following the add-provider recipe.
argument-hint: <provider-slug>
---

# /scaffold-provider $ARGUMENTS

Generate the starting skeleton for a new provider adapter in xcale-mcp-server.

`$ARGUMENTS` is the provider **slug** (e.g. `nevatal`, `epayco`). It MUST match the backend's
`MCPToolboxDefinition.id`. If no slug is given, ask for one before doing anything.

## What to generate

Under `src/providers/$ARGUMENTS/`, create:

1. **`client.ts`** — a thin API client stub: base URL, an authenticated request helper that
   takes the forwarded token as a parameter (never stored), and TODOs for each endpoint.
2. **`tools.ts`** — an exported `{SLUG}_TOOLS: McpToolDefinition[]` with 1–2 example tools
   named `mcp_$ARGUMENTS_{verb}`, each with a `description` and a JSON-Schema `inputSchema`.
3. **`index.ts`** — the `IProvider` implementation: `slug: '$ARGUMENTS'`, `listTools`
   returning `{SLUG}_TOOLS`, and a `callTool` skeleton that resolves the handler, calls the
   client with `ctx.token`, normalizes the result, and maps 401/403 to the typed
   reconnect-required result.

Then remind the human to:

- Add the provider to the explicit `PROVIDERS` list in `src/core/registry.ts` (one line).
- Create the matching `MCPToolboxDefinition` entry in xcale-backend (Rail E).

## Guardrails

- Follow `.claude/skills/add-provider/SKILL.md` exactly — this command is its scaffolding step.
- The adapter must contain **no** xcale business logic and must **never** persist the token.
- Keep tools curated and domain-grouped; do not stub one tool per provider endpoint.
- If `src/core/` interfaces (`IProvider`, `McpToolDefinition`, `ProviderCallContext`,
  `NormalizedResult`) don't exist yet, note that they must be defined first (Phase 2) and
  generate against the shapes documented in `docs/foundation.md` §9.
