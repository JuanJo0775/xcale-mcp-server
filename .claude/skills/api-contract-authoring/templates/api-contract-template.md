# [MODULE_NAME] — API Contract

> **Module**: [Full module name and description]
> **Base Path**: `/api/v1/[module]`
> **Last Updated**: [YYYY-MM-DD]

---

## Implementation Status

| Phase | Description | Status | Notes |
|:---|:---|:---:|:---|
| **Phase 1** | [Core functionality description] | ⬜ Planned | — |
| **Phase 2** | [Extension description] | ⬜ Planned | — |

<!-- Status Legend: ⬜ Planned | 🔄 In Progress | ✅ Done | ⏸️ Deferred -->

---

## 1. API Contract

**Base URL**: `/api/v1/[module]`

### Required Headers

| Header | Value | Required | Description |
|:---|:---|:---:|:---|
| `Authorization` | `Bearer <jwt>` | Yes | JWT authentication token |
| `Accept-Language` | `en` or `es` | No | Preferred locale for response messages (default: `en`) |

### Endpoints

| Method | Endpoint | Description | Auth | Roles | Success Status |
|:---|:---|:---|:---|:---|:---|
| GET | `/` | List [entities] (paginated) | Yes | Any | `200` |
| GET | `/:id` | Get single [entity] | Yes | Any | `200` |
| POST | `/` | Create [entity] | Yes | [admin / any] | `201` |
| PATCH | `/:id` | Update [entity] | Yes | [admin / any] | `200` |
| DELETE | `/:id` | Delete (soft) [entity] | Yes | [admin] | `200` |

<!-- Add more endpoints as needed. Include:
  - Batch operations: POST /batch
  - Status transitions: PATCH /:id/activate, PATCH /:id/archive
  - Sub-resources: GET /:id/items
  - File downloads: GET /:id/download (note: response is Binary)
  - Search endpoints: GET /search?q=...
-->

### Middleware Chain (Fastify preHandler)

```typescript
// Standard authenticated endpoint:
preHandler: [
  verifyToken,
  // authorizeRoles(['admin']),  // Uncomment if role-restricted
]
```

---

## 2. TypeScript Interfaces

### Enums

```typescript
/**
 * [Describe what this enum represents]
 */
export enum [EntityStatus] {
  [VALUE_1] = '[value_1]',   // [Description]
  [VALUE_2] = '[value_2]',   // [Description]
  [VALUE_3] = '[value_3]',   // [Description]
}
```

### Core Entities

```typescript
/**
 * Primary entity returned by GET endpoints.
 * This is the "read model" — what the frontend receives.
 */
export interface I[Entity] {
  id: string;
  // --- Core Fields ---
  [field1]: string;
  [field2]: number;
  [field3]: [EntityStatus];
  // --- Relationships ---
  [relatedEntityId]: string;
  // --- Metadata ---
  isActive: boolean;              // Soft delete flag
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
  // --- Optional Fields ---
  [optionalField]?: string;
}
```

### Request DTOs

```typescript
/**
 * POST / — Create [entity]
 * All required fields for creation. No `id` or timestamps
 * (these are set server-side).
 */
export interface ICreate[Entity]Request {
  [field1]: string;            // Required. Validation: min 1, max 100
  [field2]: number;            // Required. Validation: > 0
  [optionalField]?: string;   // Optional. Default: null
}

/**
 * PATCH /:id — Update [entity]
 * All fields are optional (partial update).
 */
export interface IUpdate[Entity]Request {
  [field1]?: string;
  [field2]?: number;
}

/**
 * POST /batch — Batch create [entities]
 */
export interface IBatch[Entity]Request {
  items: ICreate[Entity]Request[];
}
```

### Response DTOs

```typescript
/**
 * Standard API response envelope.
 * ALL endpoints use this pattern.
 */
// Success:
{ success: true, data: T }

// Error:
{ success: false, error: "Error message" }

// List with pagination:
{ success: true, data: T[], total: number, pagination: IPagination }

/**
 * GET / — List response with pagination
 */
export interface I[Entity]ListResponse {
  [entities]: I[Entity][];
  pagination: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * POST /batch — Batch response with partial success support
 */
export interface IBatch[Entity]Result {
  results: I[Entity][];
  errors: Array<{
    [identifier]: string;
    error: string;
  }>;
}
```

### Query Parameters

```typescript
/**
 * GET / — List filters
 * All are optional with sensible defaults.
 */
export interface I[Entity]ListQuery {
  search?: string;              // Full-text search across [fields]
  status?: [EntityStatus];      // Filter by status
  startDate?: string;           // ISO 8601 date (inclusive)
  endDate?: string;             // ISO 8601 date (inclusive)
  page?: number;                // Default: 1
  limit?: number;               // Default: 20, Max: 100
  sortBy?: string;              // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
}
```

---

## 3. Frontend Hooks Specification

**API Client**: All hooks MUST use the standard `apiClient` (singleton with auto-token-refresh).

### Query Key Factory

```typescript
export const [module]Keys = {
  all: ['[module]'] as const,
  lists: () => [...[module]Keys.all, 'list'] as const,
  list: (filters: I[Entity]ListQuery) => [...[module]Keys.lists(), filters] as const,
  details: () => [...[module]Keys.all, 'detail'] as const,
  detail: (id: string) => [...[module]Keys.details(), id] as const,
};
```

### Queries

| Hook | Key | Endpoint | Notes |
|:---|:---|:---|:---|
| `use[Entities]` | `[module]Keys.list(filters)` | `GET /` | Paginated, supports all query filters |
| `use[Entity]` | `[module]Keys.detail(id)` | `GET /:id` | Single entity by ID |

### Mutations & Invalidation Strategy

| Hook | Endpoint | On Success — Invalidate |
|:---|:---|:---|
| `useCreate[Entity]` | `POST /` | `[module]Keys.lists()` |
| `useUpdate[Entity]` | `PATCH /:id` | `[module]Keys.detail(id)` + `[module]Keys.lists()` |
| `useDelete[Entity]` | `DELETE /:id` | `[module]Keys.lists()` |

---

## 4. Agent Tool Specification *(Optional — only if this module is AI-accessible)*

<!-- 
  Include this section if this module exposes tools for the AI agent system.
  See docs/architecture-guide.md → "Tool System (AI Agent)" for the standard pattern.
-->

### Tools

| Tool Name | Description | UserId Injected? |
|:---|:---|:---:|
| `[action]_[entity]` | [What the tool does] | Yes |

### Tool Definition

```typescript
/**
 * Tool: [action]_[entity]
 * Description: [What the tool does for the AI]
 */
definition: ToolDefinition = {
  name: '[action]_[entity]',
  description: '[Natural language description for AI]',
  input_schema: {
    type: 'object',
    properties: {
      [field1]: { type: 'string', description: '[Field description]' },
      // userId NOT included — injected from context
    },
    required: ['[field1]'],
  },
};
```

### Tool Response

```typescript
// Return format with UI rendering hint
return {
  success: true,
  result: { /* entity data */ },
  ui: {
    component: '[ComponentName]',   // e.g., 'GoalCard', 'TaskList'
    props: { /* component-specific props */ }
  }
};
```

### Registration Steps

1. **Create** tool class extending `BaseToolExecutor` in `src/modules/agent/tools/implementations/`
2. **Export** class in `src/modules/agent/tools/implementations/index.ts`
3. **Register** in `TOOL_IMPLEMENTATIONS` map in the same file
4. **Catalog** entry in `src/modules/agent/tools/catalog/tool-catalog.ts`
5. **Authorize** tool group for relevant Agents in `src/modules/agent/types/{agent-name}.ts`
6. **Context injection** (if needed): Add to injection list in `executionService.ts`

---

## 5. Mock Data

### `GET /api/v1/[module]` — 200 OK (Success with data)

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "field1": "Example Value",
      "status": "active",
      "isActive": true,
      "createdAt": "2026-02-18T14:30:00.000Z",
      "updatedAt": "2026-02-18T14:30:00.000Z"
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### `POST /api/v1/[module]` — 201 Created

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "field1": "New Entity",
    "status": "active",
    "isActive": true,
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

### `POST /api/v1/[module]` — 400 Validation Error

```json
{
  "success": false,
  "error": "[field1] is required"
}
```

### `GET /api/v1/[module]/:id` — 404 Not Found

```json
{
  "success": false,
  "error": "[Entity] not found"
}
```

### `POST /api/v1/[module]` — 409 Conflict

```json
{
  "success": false,
  "error": "[Entity] with this [field] already exists"
}
```

---

## 6. Error Reference

| Status | When | UX Suggestion |
|:---|:---|:---|
| `400` | Missing/invalid fields | Highlight form field with error |
| `401` | Invalid/expired JWT | Redirect to login |
| `403` | Insufficient permissions | Show "Access Denied" message |
| `404` | Entity doesn't exist | Show empty state or redirect |
| `409` | Duplicate entity | Show conflict resolution UI |
| `500` | Server failure | Show generic error toast |

---

## 7. i18n Guidelines

| What | How | Example |
|:---|:---|:---|
| **UI labels & buttons** | Use `t('key')` from your i18n library | `t('[module].create')` |
| **Backend success messages** | Display response directly | `toast.success(response.message)` |
| **Backend error messages** | Display response directly | `toast.error(response.error)` |
| **Form validation messages** | Use client-side i18n | `z.string().min(1, t('required'))` |

> [!IMPORTANT]
> **NEVER** double-translate backend messages: `toast.success(t(response.message))` ← ❌ WRONG
> Backend messages are already localized via the `Accept-Language` header.

---

## 8. Upcoming Phases (Roadmap)

| Phase | Feature | Impact on API Contract |
|:---|:---|:---|
| **Phase 2** | [Description] | [New endpoints, modified DTOs, etc.] |
| **Phase 3** | [Description] | [New endpoints, modified DTOs, etc.] |

<!-- 
  This section communicates to the frontend team what's coming
  so they can design extensible components. 
-->
