# `.claude/` — Agent toolset for xcale-mcp-server

This folder makes the project **self-contained** when opened on its own in the editor: the
full set of Claude skills, agents, rules, and commands needed to **design, build, document,
and iterate** on this MCP server — without exposing the rest of `xcale-proyect`.

The skills and agents below are shared with `xcale-backend` (same org, same conventions, same
`soul.md` philosophy). They were brought in so the toolset travels with the repo. Process and
design skills are **portable as-is**; a few build/QA skills reference the backend's runtime and
need light adaptation (flagged ⚙️ below) before they fully apply here.

> **Identity:** `rules/soul.md` (this repo's identity — loaded every session).
> **Founding pillar:** `../docs/foundation.md` (read first).

---

## Skills, grouped by purpose

### 🎯 Design & align (before building)

| Skill | Use it to | Status |
|:--|:--|:--|
| **grill** | Pressure-test a plan/idea against the domain and the code before designing. Resolves the open questions in `foundation.md` §12. Runs in front of `feature-design`. | ✅ portable |
| **feature-design** | Write a Feature Design / PRD for a slice (the protocol boundary, the auth model, a provider). Lands in `docs/design/<slug>/feature-design.md`. | ✅ portable |
| **api-contract-authoring** | Define the contract before code. Here the contract is the **MCP boundary** (`tools/list` + `tools/call`, schemas, error shapes). | ✅ portable |
| **implementation-plan** | The executive build map — file tree, per-file symbol changes, ordered slices, subagent delegation. Runs after the contract, before code. | ✅ portable |
| **adr** | Record durable architecture decisions (protocol choice, stateless auth, stack) in `docs/adr/`. | ✅ portable |

### 🔨 Build

| Skill | Use it to | Status |
|:--|:--|:--|
| **tdd** | Red-green-refactor with Vitest through the core/provider seams. | ✅ portable |
| **api-integration** | Implement an outbound provider integration (Sandwich: Tool → UseCase → Repository → API Client). Directly relevant to **provider adapters** — pairs with `add-provider`. | ⚙️ adapt — written for Fastify modules; the *pattern* applies, the file layout maps to `src/providers/{slug}/`. |
| **diagnose** | Disciplined bug/perf diagnosis loop (reproduce → minimise → hypothesise → fix → regression-test). | ✅ portable |

### 🔌 Project-specific (built for this repo)

| Skill | Use it to | Status |
|:--|:--|:--|
| **add-provider** | The **mechanical recipe** to onboard a new provider as a thin MCP adapter — the system's core leverage (`foundation.md` §9). | ✅ native to this repo |

### 🔍 Review & QA

| Skill | Use it to | Status |
|:--|:--|:--|
| **improve-architecture** | Whole-codebase "deepening" review — shallow modules, tangled seams, untestable code. Complements diff-scoped review. | ✅ portable |
| **qa** | Run QA suites + the post-implementation reconcile-to-zero-blockers loop. | ⚙️ adapt — references the backend dev server (curl) + the `quala` (Playwright/UI) subagent that don't exist here. The reconcile-loop method is reusable; the suite machinery needs an MCP-server target (e.g. JSON-RPC scenarios against the `/mcp` endpoint). |

### 📝 Document & iterate with the agent

| Skill | Use it to | Status |
|:--|:--|:--|
| **creating-skills** | Author new skills for this repo (e.g. a future `test-mcp-tool` skill). | ✅ portable |
| **handoff** | Compact a session into a handoff doc, or load the last one when resuming. Lands in `docs/handoff/`. | ✅ portable |
| **mintlify-documentation** | Build/maintain a Mintlify docs site if/when this server gets public docs. | ✅ portable (optional) |
| **git-workflow** | Branch, commit, ship, PR, release. | ⚙️ adapt — the release/soak/archival flow references backend docs-lifecycle specifics; branching/committing/PR parts are portable. |

---

## Agents (`agents/`)

| Agent | Role | Notes |
|:--|:--|:--|
| **mcp-architect** | Read-only architecture advisor specific to this MCP server (boundary, provider contract, auth model, SOLID). | native to this repo |
| **architect** | General read-only technical-spec designer. | portable; overlaps with `mcp-architect` — use `mcp-architect` for MCP-specific design |
| **code-reviewer** | Reviews diffs for quality, security, architecture compliance. | portable |
| **debugger** | Systematic local bug diagnosis & fixing. | portable |
| **api-qa** | Executes curl/HTTP test scenarios against a dev server. | ⚙️ becomes useful once the `/mcp` HTTP endpoint exists |
| **prod-debugger** | Safe production debugging (DO/Atlas read-first SRE protocols). | ⚙️ applies once this server is deployed (DO App Platform, `foundation.md` Q-4) |

---

## Commands (`commands/`)

| Command | Does |
|:--|:--|
| **/scaffold-provider `<slug>`** | Generates the `src/providers/{slug}/` skeleton per the `add-provider` recipe. |

---

## Recommended lifecycle for this project

```
grill ─▶ feature-design ─▶ api-contract-authoring ─▶ implementation-plan ─▶ tdd / add-provider ─▶ code-reviewer ─▶ git-workflow
  │                                                                                                                    │
  └────────────────────── adr (whenever a durable decision is locked) ──────────────────────────────────────────────┘
       handoff (wrap up / resume a session at any point)
```

## Not yet present (recommended next seeds)

These files several skills lean on don't exist here yet — create them when you start the design
phase (grill/feature-design will help populate them):

- **`CONTEXT.md`** at the repo root — the domain glossary (seed it from `foundation.md` §17).
  `grill` and `feature-design` read and update it.
- **`CLAUDE.md`** at the repo root — project facts (stack, ports, conventions) once the stack
  is locked (`foundation.md` Q-6).
- **`docs/adr/`** — created by the first `adr` invocation.
