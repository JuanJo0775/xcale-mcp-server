---
name: feature-design
description: Creates comprehensive Feature Design documents (PRDs) before implementation. Use when the user wants to define a new feature's problem space, scope, UX flow, data model sketch, and architectural decisions BEFORE writing API contracts or code. Designed for the agentic programming era — balanced for both human alignment and AI agent consumption.
---

# Feature Design

## Purpose

This skill standardizes the creation of **Feature Design documents** — the strategic upstream document that captures the *WHY*, *WHO*, *WHAT*, and *HOW* of a new feature before any code is written. It sits at the top of the development pipeline:

```
Feature Design → API Contract → Implementation
  (this skill)    (api-contract-authoring)    (code)
```

A Feature Design document enables:

1. **Strategic Clarity** — Forces structured thinking about the problem, users, and success metrics before jumping to solutions.
2. **Scope Control** — MoSCoW prioritization and explicit "Out of Scope" sections prevent scope creep during implementation.
3. **Descriptive UX** — Rich, narrative-driven UX descriptions that designers, frontend engineers, and AI agents can visualize without mockups.
4. **Architectural Pre-Decisions** — Key design choices (Integration points? Scheduled tasks? Tools?) are documented early, preventing mid-implementation pivots.
5. **Agentic Pipeline** — Structured enough that an AI agent can read the Feature Design and generate an API contract skeleton from it.
6. **Parallel Enablement** — Designers, backend, and frontend teams can work in parallel once the Feature Design is approved.

## When to Use

- The user says "design a new feature", "let's plan this feature", "write a PRD", or "let's scope this out".
- A new module or significant feature extension is being considered.
- The user wants to think through a feature before writing API contracts or code.
- A feature idea needs to be evaluated, prioritized, or discussed with stakeholders.
- The user runs a design sprint or planning session.

## When NOT to Use

- The feature is already designed and you need the API surface → use `api-contract-authoring` instead.
- You're fixing a bug or doing a small enhancement → just implement it.
- You're writing implementation details for an already-approved design → use the API contract or go straight to code.

## ⚠️ Output File Convention (MANDATORY)

> **ALL feature design documents MUST land at `docs/design/<slug>/feature-design.md`.**

The feature design and its API contract live **together** in the same `docs/design/<slug>/` folder while the feature is in flight. At Release (dev→main), after the prod soak window, the `/git-workflow` Release step (reference: `.claude/skills/git-workflow/references/promote-docs.md`) moves the entire folder to `docs/archive/<year>-q<N>/<slug>/`. No design folder stays in `docs/design/` after release + soak.

| Rule | Value |
|:--|:--|
| **Folder** | `docs/design/<slug>/` |
| **File** | `feature-design.md` (always — do not invent variants) |
| **Slug** | Kebab-case, descriptive, no suffix (no `-prd`, `-design`, `-spec`) |
| **Examples** | `docs/design/concierge-onboarding/feature-design.md`, `docs/design/subscription-trials/feature-design.md` |
| **Companion files in the same folder** | `api-contract.md` (from `/api-contract-authoring`), optionally `ship-log.md` (the post-build artifact: build notes + operational ship log) |

**NEVER** save new feature designs to `docs/features/`, `docs/api/`, `docs/api_contracts/`, `docs/api-contracts/`, or the `docs/` root. Those are pre-lifecycle legacy locations (see `docs/README.md`).

---

## Pre-Requisites

Before writing a Feature Design, gather:

1. **Feature Idea** — What is the user trying to build? What problem does it solve?
2. **Backend Architecture Context** — Read `docs/architecture-guide.md` to understand existing patterns.
3. **Existing Modules** — Check if related modules already exist in `src/modules/` that this feature touches or extends.
4. **User Context** — Who are the users? What are their roles, workflows, and pain points?

## Workflow

### Step 1: Discovery & Context Gathering

1. **Listen to the user.** Understand the core idea, motivation, and desired outcome.
2. **Read `docs/architecture-guide.md`** to refresh on system patterns, fastify endpoints, and conventions.
3. **Check in-flight designs** in `docs/design/` and **archived designs** in `docs/archive/` for style consistency and to avoid duplicating work.
4. **Check legacy artifacts** in `docs/features/` and `docs/api/` for context on related modules that predate the lifecycle.
5. **Ask clarifying questions** if the problem space is unclear. Don't assume intent.

### Step 2: Collaborative Design Session

This is a **conversation**, not a one-shot generation. The Feature Design should emerge from dialogue:

1. **Start with the problem** — Help the user articulate the pain clearly.
2. **Explore the user stories** — Walk through scenarios together.
3. **Discuss scope** — Use MoSCoW to negotiate what's in vs. out.
4. **Sketch the UX narratively** — Describe screens and interactions in prose.
5. **Surface risks and questions** — Identify unknowns before they become blockers.
6. **Validate assumptions** — Challenge implicit assumptions with questions.

### Step 3: Write the Feature Design

Use the **template** in [feature-design-template.md](templates/feature-design-template.md). Fill in every applicable section. Follow the Golden Rules below.

**Save to**: `docs/design/<slug>/feature-design.md` (slug is kebab-case, no suffix).

### Step 4: Review Checklist

Run through [checklist.md](checklist.md) before finalizing.

### Step 5: Handoff

Once approved (file saved at `docs/design/<slug>/feature-design.md`), the Feature Design feeds into:
- **`/api-contract-authoring`** — defines the technical API surface. The contract lands at `docs/design/<slug>/api-contract.md`, **alongside** this feature design.
- **Implementation** — AI agents or developers read both files for context.
- **`/adr`** — invoke when the feature locks in an architectural choice (technology, pattern, trade-off) worth preserving beyond the feature folder.
- **`/git-workflow` Release step** (reference: `.claude/skills/git-workflow/references/promote-docs.md`) — at Release (dev→main), after the prod soak window, archives the entire `docs/design/<slug>/` folder to `docs/archive/<year>-q<N>/<slug>/`. No design folder stays in `docs/design/` after release + soak. See `docs/README.md` for the lifecycle.

---

## Golden Rules for Feature Design

### 🎯 Strategic Quality

| Rule | Why |
|:---|:---|
| **ALWAYS** start with the problem, not the solution | Solutions without problems lead to features nobody uses |
| **ALWAYS** define measurable success metrics | "Make it better" is not a goal. Numbers are. |
| **ALWAYS** include explicit Out of Scope | Prevents scope creep during implementation |
| **ALWAYS** use MoSCoW for scope prioritization | Forces prioritization decisions upfront |
| **NEVER** skip user stories | They ground the design in real user behavior |

### 🎨 Descriptive UX Quality

| Rule | Why |
|:---|:---|
| **ALWAYS** write UX as screen-by-screen narratives | Vivid descriptions > abstract flowcharts for agent consumption |
| **ALWAYS** describe key states (empty, loading, error, success) | Agents and designers need all states, not just the happy path |
| **ALWAYS** describe interactions (click, hover, submit, transition) | Behavior is as important as layout |
| **NEVER** reference external mockups as the only UX source | The document must be self-contained |
| **PREFER** "The user sees..." and "Clicking X triggers..." phrasing | Active, descriptive language creates mental images |

### 🏗️ Architectural Quality

| Rule | Why |
|:---|:---|
| **ALWAYS** identify integration points with existing modules | Prevents surprise dependencies during implementation |
| **ALWAYS** document if AI Agents need Tools for this feature | Agents require structured tool registration |
| **NEVER** define full DTOs or TypeScript interfaces | That's the API contract's job. Keep it at entity-sketch level. |
| **PREFER** relationship diagrams over field lists | Show how entities connect, not every attribute |

### 🤖 Agentic Readiness (Balanced)

| Rule | Why |
|:---|:---|
| **ALWAYS** use structured sections with consistent headers | Agents navigate by headers |
| **ALWAYS** use tables for comparable data (metrics, decisions, risks) | Agents parse tables better than prose lists |
| **ALWAYS** include the "Agentic Context" section | Gives agents orientation for downstream work |
| **NEVER** write prose-only sections for structured data | Tables and lists > paragraphs for extractable information |
| **PREFER** explicit choices over open-ended descriptions | "We chose X because Y" > "We could do X or Y" |

---

## Section Quick Reference

| # | Section | Purpose | Required |
|:--|:--|:--|:--:|
| 0 | **Metadata** | Quick-scan context | ✅ |
| 1 | **Problem Statement** | The WHY | ✅ |
| 2 | **Goals & Success Metrics** | Measurable outcomes | ✅ |
| 3 | **Target Users** | The WHO | ✅ |
| 4 | **User Stories** | The WHAT (behavioral) | ✅ |
| 5 | **Feature Scope (MoSCoW)** | Prioritized boundaries | ✅ |
| 6 | **UX & Interaction Design** | Descriptive screen narratives | ✅ |
| 7 | **Data Model Sketch** | Entity relationships | ✅ |
| 8 | **Architectural Decisions** | Key design choices | ✅ |
| 9 | **Risks & Open Questions** | Risk register + unknowns | ✅ |
| 10 | **Phasing & Roadmap** | Incremental delivery plan | ✅ |
| 11 | **Agentic Context** | AI agent orientation | ✅ |

---

## See Also

- **Template**: [feature-design-template.md](templates/feature-design-template.md) — The fill-in-the-blanks template.
- **Checklist**: [checklist.md](checklist.md) — Pre-approval review checklist.
- **Style Guide**: [style-guide.md](examples/style-guide.md) — Writing style guidance for descriptive UX sections.
- **Docs Lifecycle**: `docs/README.md` — How `docs/design/`, `docs/archive/`, and `docs/adr/` fit together; how the four lifecycle skills (`/feature-design`, `/api-contract-authoring`, `/implementation-plan`, `/adr`) hand off; archival is a `/git-workflow` Release step, not its own skill.
- **Architecture**: `docs/architecture-guide.md` — Backend patterns and conventions.
- **ADRs**: `docs/adr/` — Durable architectural decisions this feature must honor or extend.
- **Downstream Skill**: `/api-contract-authoring` — Consumes this feature design to produce the companion `api-contract.md` in the same folder.
- **Lifecycle Close**: `.claude/skills/git-workflow/references/promote-docs.md` — the `/git-workflow` Release step that archives the design folder at Release (dev→main), after the prod soak window.
