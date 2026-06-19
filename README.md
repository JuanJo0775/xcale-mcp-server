# xcale-mcp-server — "Composio LATAM"

> **Status:** Foundation / pre-implementation. No runtime code yet.

xcale's own **MCP server** (a "Composio LATAM"): a separate service that centralizes
integrations with the platforms LATAM businesses actually use — and any provider Composio
will never cover — and exposes their capabilities as **tools over the MCP protocol
(JSON-RPC 2.0)**. xcale-backend consumes it as an MCP client, the same way it consumes
Composio today, but over a protocol and a server xcale fully owns.

```
xcale-backend (MCP client)  ──tools/list / tools/call──▶  xcale-mcp-server (this repo)
  · owns business logic                                     · owns provider plumbing
  · Rail A owns tokens, forwards them per call              · STATELESS w.r.t. auth
```

## Start here

**[`docs/foundation.md`](docs/foundation.md)** is the founding pillar — full
context, vision, architecture seed, the token model, the mechanical provider-onboarding
recipe, the first functional requirements, and the roadmap. Read it before designing or
building anything.

## Why

- Composio's catalog is global-SaaS-centric and won't cover LATAM apps (regional CRMs,
  payment gateways, appointment systems, accounting platforms).
- xcale needs full control of provider auth, data, cost, and roadmap.
- Long-term: migrate native provider plumbing out of xcale-backend so the backend becomes a
  pure consumer that only owns business rules.

## Repo layout (current)

```
xcale-mcp-server/
├── README.md                    ← you are here
├── docs/
│   └── design/
│       └── foundation.md        ← the pillar document
└── .claude/                     ← agent rules, skills, agents, commands for this repo
    ├── rules/soul.md
    ├── skills/add-provider/
    ├── agents/mcp-architect.md
    ├── commands/scaffold-provider.md
    └── settings.json
```

The `src/` tree is proposed in `foundation.md` §6 but not yet built — Phase 2 of the roadmap.

## Conventions

- TypeScript, ES modules, `kebab-case.ts` files, `IPascalCase` interfaces, `camelCase`
  methods — same as xcale-backend, so contributors move between repos without friction.
- Artifacts (code, docs, ADRs, commits) stay in English. Conversation can be in any language.
- No xcale business logic lives here. This server only adapts providers to MCP.

## Relationship to xcale-backend

This server fulfills the `MCPToolboxDefinition` stub defined in xcale-backend's Rail E
(`src/modules/toolboxes/entities.ts`). See `foundation.md` §10 for the consuming-side contract.
