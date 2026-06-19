# API Contract Style Guide

> Quick reference for writing consistent, high-quality API contracts in the XCALE ecosystem.

---

## 1. Document Structure (Mandatory Order)

Every API contract MUST follow this exact section order:

```
1. Module Metadata (header block)
2. Implementation Status (tracker table)
3. API Contract (endpoints + middleware)
4. TypeScript Interfaces (enums → entities → request DTOs → response DTOs → query params)
5. Frontend Hooks (key factory → queries → mutations)
6. Agent Tool Specification (if applicable)
7. Mock Data (success → error scenarios)
8. Error Reference (table with UX suggestions)
9. Roadmap (upcoming phases)
```

---

## 2. Naming Conventions

| Type | Convention | Example |
|:---|:---|:---|
| **File** | `<module>-api-contract.md` or `<module>-phase<N>-api-contract.md` | `goals-api-contract.md` |
| **Interface** | `I[Entity]` | `IGoal` |
| **Request DTO** | `I[Action][Entity]Request` | `ICreateGoalRequest` |
| **Response DTO** | `I[Entity]ListResponse`, `IBatch[Entity]Result` | `IGoalListResponse` |
| **Enum** | `[Entity][Field]` in PascalCase | `GoalStatus` |
| **Query Params** | `I[Entity]ListQuery` | `IGoalListQuery` |
| **Frontend Query Keys** | `[module]Keys` | `goalKeys` |
| **Frontend Hook (query)** | `use[Entities]`, `use[Entity]` | `useGoals`, `useGoal` |
| **Frontend Hook (mutation)** | `use[Action][Entity]` | `useCreateGoal`, `useUpdateGoal` |
| **Agent Tool** | `[action]_[entity]` (snake_case) | `create_goal`, `list_goals` |

---

## 3. Markdown Formatting Rules

### Use Tables for Structured Data
Tables are more parseable than prose for both humans and AI agents.

✅ **DO**:
```markdown
| Method | Endpoint | Description | Auth | Roles | Status |
|:---|:---|:---|:---|:---|:---|
| GET | `/` | List goals | Yes | Any | `200` |
```

❌ **DON'T**:
```markdown
The GET endpoint at `/` returns a list of goals. It requires authentication
and any role can access it. It returns status 200.
```

### Use Callout Blocks for Important Notes

```markdown
> [!IMPORTANT]
> **Auth Required**: All endpoints require `Authorization: Bearer <jwt>`.

> [!NOTE]
> The `userId` is extracted from the JWT token, never passed by the client.

> [!TIP]
> Use the standard `apiClient` for all hook implementations.
```

### Use Code Blocks for All Technical Content
- TypeScript interfaces: ` ```typescript `
- JSON mock data: ` ```json `
- Middleware chains: ` ```typescript ` or plain ` ``` `

### Use Comments Inside Code Blocks
```typescript
export interface IGoal {
  id: string;
  userId: string;
  title: string;
  status: GoalStatus;
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  completedAt?: string;        // ISO 8601 — only set when completed
}
```

---

## 4. Date Handling

All dates in the contract MUST:

1. Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
2. Include `// ISO 8601` comment on the field
3. Use the `Z` suffix (UTC)

**In mock data:**
```json
"createdAt": "2026-02-18T14:30:00.000Z"
```

---

## 5. Enum Documentation Pattern

Every enum MUST:
1. Use `export enum` (not `type`)
2. Include a description comment above
3. Include a comment after each value

```typescript
/**
 * Lifecycle states of a Goal.
 */
export enum GoalStatus {
  ACTIVE = 'active',         // Goal is in progress
  COMPLETED = 'completed',   // Goal has been achieved
  ARCHIVED = 'archived',     // Goal is no longer relevant
}
```

---

## 6. Mock Data Quality Standards

1. **Use realistic MongoDB ObjectIds**: `"683b1a2e3f4c5d6e7a8b9c0d"`
2. **Cover multiple scenarios per endpoint** (min 3 for primary endpoints):
   - Happy path (full data)
   - Edge case (partial data, empty arrays)
   - Error case (validation, not found, conflict)
3. **Include the full response wrapper**: `{ success, data }`
4. **Use realistic field values** — not "test", "foo", "bar"

---

## 7. Error Response Standards

Always include a table AND JSON examples:

**Table format:**
| Status | Code | When | UX Suggestion |
|:---|:---|:---|:---|
| `400` | `VALIDATION_ERROR` | Missing fields | Highlight field |

**JSON format:**
```json
{
  "success": false,
  "error": "Title is required"
}
```

---

## 8. Agent Tool Documentation Pattern

When a module exposes AI Agent tools, document:

1. **Tool Name**: snake_case action (e.g., `create_goal`)
2. **Tool Definition**: JSON Schema `input_schema` (what the AI sees)
3. **Context Injection**: Which fields are auto-injected (e.g., `userId`)
4. **Response**: What the tool returns, including the `ui` object for rich rendering

```typescript
// Tool definition — NO userId in schema (injected from context)
definition: ToolDefinition = {
  name: 'create_goal',
  description: 'Creates a new goal for the user',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'The goal title' },
      description: { type: 'string', description: 'Optional details' },
    },
    required: ['title'],
  },
};

// Response includes ui object for frontend rendering
return {
  success: true,
  result: { id: '...', title: '...' },
  ui: {
    component: 'GoalCard',
    props: { /* component-specific props */ }
  }
};
```
