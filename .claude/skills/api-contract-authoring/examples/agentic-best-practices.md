# Agentic Programming: API Contract Best Practices (2026)

> This document captures the principles for writing API contracts that are optimized for consumption by AI coding agents (Cursor, Copilot, Claude Code, etc.) while remaining excellent documentation for human developers.

---

## The Paradigm Shift: Contract-First → Agent-First

In traditional contract-first development, the API contract served as alignment between human teams. In 2026, the contract increasingly serves as the **execution spec for AI agents**. The contract is no longer just documentation — it's the **prompt** that drives implementation.

### The Two Audiences

| Aspect | Human Developer | AI Agent |
|:---|:---|:---|
| **Reads** | Scans headings, focuses on relevant sections | Processes the entire document sequentially |
| **Interprets** | Uses intuition to fill gaps | Treats gaps as ambiguity → hallucination risk |
| **Validates** | Reviews output manually | Validates output against mock data patterns |
| **Context** | Has project knowledge, can ask questions | Has only what's in the document + conversation |

### Implication

> An API contract must be **self-contained** and **unambiguous**. Every piece of information an agent needs to implement the feature must be present in the document itself or explicitly referenced.

---

## Core Principles

### 1. Explicit Over Implicit

❌ **Human-optimized (implicit):**
```
The response follows the standard format.
```

✅ **Agent-optimized (explicit):**
```typescript
// Standard response envelope used by ALL endpoints.
// Success:
{ success: true, data: { ... } }

// Error:
{ success: false, error: "Error message" }

// List with pagination:
{ success: true, data: [...], total: 100, pagination: { ... } }
```

**Rule**: Never assume the agent "knows" a convention. State it.

---

### 2. Schema as Contract (Not Prose)

AI agents parse structured data (TypeScript interfaces, JSON, tables) far more reliably than natural language.

❌ **Prose description:**
```
The endpoint accepts a user name (required, max 100 chars), 
an email (required, must be valid), and an optional phone number.
```

✅ **Schema definition:**
```typescript
export interface ICreateUserRequest {
  name: string;         // Required. Validation: min 1, max 100
  email: string;        // Required. Validation: valid email format
  phone?: string;       // Optional. Validation: E.164 format
}
```

**Rule**: Every field must have a type, requirement status, and validation inline.

---

### 3. Copy-Paste Ready Interfaces

Agents work best when they can **lift code blocks directly** from the contract into source files.

**Rules:**
- Use `export interface` and `export enum` (not `type`).
- Include complete import-free interfaces (no `import` statements).
- Each interface should be a standalone block with full JSDoc comment.
- Don't use `Partial<X>` or `Omit<X, Y>` in contract interfaces — be explicit.

---

### 4. Deterministic Mock Data

Mock data serves as **test fixtures** for AI agents. When an agent implements a feature, it can validate its output against the mock data in the contract.

**Rules:**
- Use consistent, realistic IDs (MongoDB ObjectIds).
- Cover success, error, and edge cases.
- Include the **full response envelope** (not just `data`).
- Mock data must be **valid JSON** (parseable without errors).
- Use the same entity in different states across mocks (shows lifecycle).

---

### 5. No Cross-References Without Context

❌ **Broken cross-reference:**
```
See the User module for the user interface.
```

✅ **Self-contained with inline reference:**
```typescript
// Simplified user reference embedded in this contract.
// Full interface in docs/api/users-api-contract.md
export interface IUserSummary {
  id: string;
  fullName: string;
  email: string;
}
```

**Rule**: If you reference another entity, include a minimal inline interface.

---

### 6. State Machines as Visual Diagrams + Code

AI agents need both the visual (for understanding) and the code (for implementation).

```
draft → [Activate] → active → [Archive] → archived
   ↓                    ↓
[Delete]           [Deactivate]
```

Plus the corresponding code:
```typescript
// Valid transitions
const TRANSITIONS: Record<Status, Status[]> = {
  draft: ['active', 'deleted'],
  active: ['archived', 'draft'],
  archived: [],            // Terminal state
  deleted: [],             // Terminal state
};
```

---

### 7. Semantic Headers for Navigation

AI agents (and humans) use headers to navigate documents. Use a consistent hierarchy:

```
# Module Name — API Contract        (H1: Document title — only one)
## 1. API Contract                   (H2: Major sections — numbered)
### Endpoints                        (H3: Subsections)
#### CRUD Operations                 (H4: Sub-subsections)
```

---

### 8. Validation Rules Inline, Not Separate

❌ **Separate validation section:**
```
## Validation Rules
- name: required, max 100
- email: required, valid format
```

✅ **Inline with interface:**
```typescript
export interface ICreateUserRequest {
  name: string;         // Required. Validation: min(1), max(100), trimmed
  email: string;        // Required. Validation: email format (RFC 5322)
  phone?: string;       // Optional. Validation: E.164 format, starts with '+'
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|:---|:---|:---|
| "Standard response format" | Agent doesn't know what "standard" means | Define the response envelope explicitly |
| `any` type anywhere | Agent generates untyped code | Use specific types always |
| "Similar to X endpoint" | Agent can't resolve the reference | Duplicate the relevant parts |
| Missing error examples | Agent doesn't implement error handling | Include 400, 404, 409, 500 examples |
| Prose-only endpoint descriptions | Agent can't extract method/path | Use endpoint table |
| Undocumented query defaults | Agent hardcodes wrong defaults | Comment defaults on every param |
| "Various statuses" | Agent invents statuses | List all values in enum |
| References to external files | Agent may not have access | Inline critical types |
| Inconsistent naming | Agent generates inconsistent code | Follow naming conventions strictly |

---

## MCP / Tool Interoperability (2026 Landscape)

Modern AI agents interact with APIs via **Model Context Protocol (MCP)** and tool definitions. A well-written API contract maps naturally to MCP tool definitions:

| Contract Section | Maps To |
|:---|:---|
| Endpoint table | Tool function name + description |
| Request DTO | Tool `inputSchema` (JSON Schema) |
| Response DTO | Tool `outputSchema` |
| Query params | Tool optional parameters with defaults |
| Error reference | Tool error handling specification |

When your contract is structured correctly, an AI agent can **auto-generate** MCP tool wrappers from it. This is especially relevant in the XCALE backend where the Agent module registers `BaseToolExecutor` instances that wrap these endpoints.

---

## Summary: The Checklist for Agent-Ready Contracts

1. ☐ Every field has an explicit type
2. ☐ Every optional field uses `?`
3. ☐ Every enum lists all values with descriptions
4. ☐ Mock data covers 3+ scenarios and is valid JSON
5. ☐ No cross-references without inline context
6. ☐ All validation rules are inline with DTOs
7. ☐ State machine has both diagram and code
8. ☐ Headers follow semantic hierarchy
9. ☐ Interfaces are copy-paste ready (no imports, no utility types)
10. ☐ Error responses include structured codes
