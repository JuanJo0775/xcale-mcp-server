---
name: api-integration
description: Implements outbound third-party API integrations following the Sandwich architecture (Tool → UseCase → Repository → API Client). Use when adding a new external service integration, creating agent tools for an existing integration, or building connection/disconnection flows for third-party APIs.
---

# Implementing API Integrations

## Prerequisites

Before starting, gather from the user:
1. **Service name** (e.g., `stripe`, `hubspot`)
2. **Auth method** — API Key (direct) or OAuth
3. **API docs URL** for endpoint reference
4. **Tool list** — what actions the AI agent needs (e.g., list items, create record)

## Architecture: The Integration Sandwich

Every outbound integration follows a 4-layer "sandwich":

```
Agent Tool  →  UseCase  →  Repository  →  API Client
(LLM schema)   (biz logic)  (credentials)   (HTTP calls)
```

**Files produced per integration:**

```
src/modules/{service}/
├── entities.ts           # Domain types + DTOs
├── repository.ts         # Abstract interface (INevatalRepository)
├── repository.mongo.ts   # MongoDB impl (encrypt/decrypt credentials)
├── api.ts                # HTTP client wrapping the external API
├── usecases/
│   ├── connect.ts        # Verify-first connection flow
│   ├── disconnect.ts     # Soft-delete connection
│   └── {action}.ts       # One UseCase per business action
├── controller.ts         # Fastify request handlers
└── routes.ts             # Fastify route definitions + JSON schemas

src/modules/agent/tools/implementations/integrations/{service}/
├── {service}Tool.ts      # Abstract base class (shared repo + client setup)
├── {service}{Action}Tool.ts  # One file per tool
└── index.ts              # Barrel export
```

## Implementation Sequence

Track your progress:

```
Integration: {SERVICE_NAME}
- [ ] Step 1: Domain Layer (entities.ts)
- [ ] Step 2: Repository Interface + MongoDB impl
- [ ] Step 3: API Client (api.ts)
- [ ] Step 4: Connect/Disconnect UseCases
- [ ] Step 5: HTTP Layer (controller.ts + routes.ts)
- [ ] Step 6: Agent Tools (base class + individual tools)
- [ ] Step 7: Triple Registration
- [ ] Step 8: Integration Registry entry
- [ ] Step 9: i18n keys
```

---

### Step 1: Domain Layer

Create `src/modules/{service}/entities.ts` with:
- Connection interface
- Request/Response DTOs for each API action
- Typed API response wrappers

**Reference**: `src/modules/nevatal/entities.ts`

```typescript
// Minimal example
export interface {Service}Connection {
  id: string;
  userId: string;
  apiKey: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Search{Resource}Request {
  query?: string;
  limit?: number;
}

export interface Search{Resource}Response {
  success: boolean;
  data?: {Resource}[];
  error?: string;
}
```

### Step 2: Repository

**Interface** (`repository.ts`):

```typescript
export interface I{Service}Repository {
  findByUserId(userId: string): Promise<{Service}Connection | null>;
  create(userId: string, apiKey: string): Promise<{Service}Connection>;
  update(userId: string, apiKey: string, metadata?: Record<string, any>): Promise<{Service}Connection>;
  delete(userId: string): Promise<boolean>;
}
```

**MongoDB impl** (`repository.mongo.ts`):
- Encrypt credentials on write (`encryptApiKey`)
- Decrypt on read (`decryptApiKey`)
- Use soft-delete (`isActive: false`) in `delete()`
- Use `findOneAndUpdate` with `upsert: true` in `update()`

**Reference**: `src/modules/nevatal/repository.mongo.ts`

### Step 3: API Client

Create `src/modules/{service}/api.ts`:

```typescript
export class {Service}Client {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.service.com/v1';
  }

  // Verify-first pattern — MANDATORY
  async verifyConnection(): Promise<{ valid: boolean; metadata?: any }> {
    // Call a lightweight endpoint to validate the API key
  }

  // Typed generic request helper
  private async request<T>(method: string, path: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status}`);
    }
    return response.json() as T;
  }

  // One method per API action
  async list{Resources}(query?: string, limit = 20): Promise<{Resource}[]> {
    return this.request<{Resource}[]>('GET', `/resources?q=${query}&limit=${limit}`);
  }
}
```

**Key patterns**:
- `verifyConnection()` is mandatory — used by the Connect UseCase
- Use `request<T>()` generic for all HTTP calls
- Add custom headers (e.g., `X-Location-Id`) when the API requires them
- Handle response unwrapping (normalize list vs. object responses)

### Step 4: Connect/Disconnect UseCases

**Connect** (`usecases/connect.ts`):

```typescript
export class Connect{Service}UseCase {
  constructor(private readonly repo: I{Service}Repository) {}

  async execute(request: { userId: string; apiKey: string }, locale: SupportedLocale) {
    // 1. Validate API key using verify endpoint
    const client = new {Service}Client(request.apiKey);
    const verify = await client.verifyConnection();
    if (!verify.valid) {
      return { success: false, error: t('integrations.error.invalid_api_key', locale) };
    }

    // 2. Upsert connection (handles re-connections)
    const connection = await this.repo.update(request.userId, request.apiKey, verify.metadata);

    // 3. Return sanitized response (never expose raw API key)
    return { success: true, connection: { id: connection.id, isActive: connection.isActive } };
  }
}
```

**Disconnect** (`usecases/disconnect.ts`):
- Verify the connection belongs to `userId`
- Soft-delete via `repo.delete(userId)`

### Step 5: HTTP Layer

**Controller** (`controller.ts`):
- Instantiate repository + use cases in constructor
- Extract `userId` from `(request as any).user?.id`
- Use `t()` for localized error messages
- Return standardized `{ success, data/error }` envelope

**Routes** (`routes.ts`):
- `POST /{service}/connect` — `preHandler: [verifyToken]`
- `DELETE /{service}/connections/:connectionId`
- Add JSON Schema for request/response validation

**Reference**: `src/modules/nevatal/controller.ts`, `src/modules/nevatal/routes.ts`

> **IMPORTANT**: Register routes in `src/main.ts` under the `/api/integrations` prefix.

### Step 6: Agent Tools

**Base class** (`{service}Tool.ts`) — if ≥2 tools share repo/client setup:

```typescript
import { BaseToolExecutor } from '@/modules/agent/tools/interfaces';
import { Mongo{Service}Repository } from '@/modules/{service}/repository.mongo';
import { {Service}Client } from '@/modules/{service}/api';

export abstract class {Service}Tool extends BaseToolExecutor {
  protected readonly repository = new Mongo{Service}Repository();

  protected async getClient(userId: string): Promise<{Service}Client> {
    const connection = await this.repository.findByUserId(userId);
    if (!connection) throw new Error('{Service} not connected');
    return new {Service}Client(connection.apiKey);
  }
}
```

**Individual tool** (`{service}{Action}Tool.ts`):

```typescript
export class {Service}List{Resources}Tool extends {Service}Tool {
  name = '{service}_list_{resources}';

  definition: ToolDefinition = {
    name: '{service}_list_{resources}',
    description: 'Lists {resources} from {Service}',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
      required: [],
    },
    requiresUserContext: true,
    category: 'integration',
    ui: { component: '{Service}{Resource}List' },
  };

  async execute(input: Record<string, any>) {
    const client = await this.getClient(input.userId);
    const results = await client.list{Resources}(input.query, input.limit || 20);
    return {
      success: true,
      data: results,
      ui: { component: '{Service}{Resource}List', props: { items: results } },
    };
  }
}
```

**Tool design rules**:
- `name` must match the key in `TOOL_IMPLEMENTATIONS` and `TOOL_CATALOG`
- Always include `requiresUserContext: true` for user-scoped tools
- List tools: mandatory `query` + `limit` params (token-safe design)
- Return `{ success, data, ui }` envelope
- Never expose raw API keys in responses

### Step 7: Triple Registration

You must register the tool in **three** places:

#### 7a. Implementation Index
`src/modules/agent/tools/implementations/index.ts`

```typescript
// Top exports section
export { {Service}List{Resources}Tool } from './integrations/{service}/{service}List{Resources}Tool';

// Bottom imports section
import { {Service}List{Resources}Tool } from './integrations/{service}/{service}List{Resources}Tool';

// TOOL_IMPLEMENTATIONS map
export const TOOL_IMPLEMENTATIONS = {
  // ...existing tools...
  {service}_list_{resources}: {Service}List{Resources}Tool,
};
```

#### 7b. Tool Catalog
`src/modules/agent/tools/catalog/tool-catalog.ts`

```typescript
// Add to ToolGroup enum if new integration
export enum ToolGroup { /* ...existing */ {SERVICE} = '{SERVICE}' }

// Add catalog entries
{ name: '{service}_list_{resources}', group: ToolGroup.{SERVICE}, requiredIntegration: '{service}' },
```

#### 7c. Agent Authorization
`src/modules/agent/types/{agent-name}.ts` — add the `ToolGroup` to the relevant agent's allowed tools.

### Step 8: Integration Registry

`src/modules/integrations/registry.ts` — add an entry in `initializeIntegrations()`:

```typescript
registry.register({
  id: '{service}',
  name: '{Service Display Name}',
  description: 'Brief description',
  icon: '/assets/integrations/{service}.png',
  category: '{category}',           // 'cms', 'crm', 'analytics', 'messaging', etc.
  connectionType: 'api_key',        // or 'oauth'
  requiredCredentials: ['apiKey'],
  status: 'active',
});
```

The registry auto-maps tools from `TOOL_CATALOG` entries with matching `requiredIntegration`.

### Step 9: i18n Keys

Add localized strings in both `src/infrastructure/i18n/locales/en.json` and `es.json`:

```json
{
  "integrations": {
    "error": {
      "invalid_api_key": "Invalid API key",
      "connect_failed": "Failed to connect",
      "disconnect_failed": "Failed to disconnect",
      "not_connected": "{Service} is not connected"
    }
  }
}
```

---

## Architectural Variants

| Complexity | Pattern | When to use |
|---|---|---|
| Simple (≤3 tools) | **Flat**: Tool → Repository → API Client | Single-purpose integrations (e.g., Sanity CMS) |
| Complex (≥4 tools) | **Full Sandwich**: Tool → UseCase → Repository → API Client | Multi-resource integrations (e.g., Nevatal clinic) |

For the **Flat** pattern, skip the UseCase layer — the tool's `execute()` method directly calls the repository and API client. See `src/modules/agent/tools/implementations/integrations/sanity/` for reference.

## Common Mistakes

1. **Forgetting triple registration** — tool won't appear for agents
2. **Skipping `verifyConnection()`** — invalid credentials stored silently
3. **Exposing API keys in tool responses** — security breach
4. **Missing `requiresUserContext: true`** — userId won't be injected
5. **No `limit` on list tools** — token overflow in agent context
6. **Hardcoding error messages** — use `t()` for i18n
7. **Not encrypting credentials** — use `encryptApiKey`/`decryptApiKey` in repository

## Key References

| File | Purpose |
|---|---|
| `src/modules/nevatal/` | Full Sandwich reference implementation |
| `src/modules/agent/tools/implementations/integrations/sanity/` | Flat pattern reference |
| `src/modules/integrations/registry.ts` | Integration metadata registry |
| `src/modules/agent/tools/catalog/tool-catalog.ts` | Tool catalog + group enums |
| `src/modules/agent/tools/implementations/index.ts` | Tool implementations map |
| `src/modules/agent/tools/interfaces.ts` | `BaseToolExecutor` base class |
| `src/modules/agent/tools/entities.ts` | `ToolDefinition` interface |
| `docs/architecture-guide.md` | Architecture standards |
