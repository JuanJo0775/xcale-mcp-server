# API Contract Review Checklist

Use this checklist **before finalizing** any API contract. Every item must be checked.

---

## Phase 1: Structural Completeness

- [ ] **Module metadata block** contains: module name, base path, last updated date.
- [ ] **Implementation status table** has at least Phase 1 defined with a clear status.
- [ ] **Base URL** follows `/api/v1/<module>` convention.
- [ ] **Endpoint table** has ALL columns: Method, Endpoint, Description, Auth, Permission/Roles, Success Status.
- [ ] **Required Headers** section specifies `Authorization` (and any additional headers).
- [ ] **Middleware chain** is documented using Fastify `preHandler` pattern.

## Phase 2: Type Safety & Agentic Readability

- [ ] **Every TypeScript interface** uses `export interface I[Name]` convention.
- [ ] **Every field** has an explicit type — no `any`, no `unknown`, no "same as above".
- [ ] **Every optional field** uses `?` suffix (e.g., `name?: string`).
- [ ] **Every enum** lists all valid values inline with descriptions.
- [ ] **Every date field** has an `// ISO 8601` comment.
- [ ] **Request DTOs** do NOT include server-managed fields (`id`, `createdAt`, `updatedAt`).
- [ ] **Response DTOs** include the standard `{ success, data, error }` wrapper definition.
- [ ] **Pagination interface** is defined with all 6 fields (`page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`).
- [ ] **Query parameter** interfaces specify defaults in comments.
- [ ] **Validation rules** are inline with the field definition (use `// Validation: ...` comments).

## Phase 3: Frontend Integration

- [ ] **Frontend types**: TypeScript interfaces are copy-paste ready for the frontend.
- [ ] **Frontend hooks**: Query key factory, query hooks, and mutation hooks are specified.
- [ ] **Mutation invalidation strategy** is documented for every mutation hook.
- [ ] **API Client**: All hooks reference the standard `apiClient` (not raw `fetch`).
- [ ] **i18n display rules** are documented: backend messages displayed directly (no `t()` wrapping on API responses).
- [ ] **State transition diagram** is included (if entity has lifecycle states).

## Phase 4: Agent Tool Specification (if applicable)

- [ ] **Tool name** is specified following naming convention (e.g., `create_goal`, `search_patients`).
- [ ] **Tool definition** includes `name`, `description`, and `input_schema` with JSON Schema.
- [ ] **Context injection** requirements are documented (e.g., `userId` auto-injected, NOT in AI schema).
- [ ] **Tool response** specifies the `ui` object if the tool triggers rich frontend rendering.
- [ ] **Tool registration** steps are documented: export, `TOOL_IMPLEMENTATIONS` map, catalog, agent type authorization.

## Phase 5: Mock Data & Error Coverage

- [ ] **Mock data** covers at least 3 scenarios:
  - [ ] Success with data (200 OK or 201 Created)
  - [ ] Validation error (400)
  - [ ] Not found (404) or Conflict (409)
- [ ] **Mock data** uses realistic, consistent IDs (MongoDB ObjectId format).
- [ ] **Mock data** includes the full `{ success, data }` wrapper.
- [ ] **Error reference table** covers all expected error codes with UX suggestions.

## Phase 6: Architecture Compliance

- [ ] **Authentication**: All protected endpoints use `verifyToken` preHandler.
- [ ] **Authorization**: Role-based endpoints use `authorizeRoles(['admin'])` or equivalent.
- [ ] **Localization**: Messages use `t('key', locale)` pattern — no hardcoded strings documented as responses.
- [ ] **Error Handling**: Uses `{ success: false, error: '...' }` response envelope.
- [ ] **API Versioning**: All paths use `/api/v1/` prefix.
- [ ] **Repository Pattern**: Contract aligns with `IRepository` → `MongoRepository` pattern.
- [ ] **Use Case Pattern**: Each endpoint maps to a specific Use Case class.

## Phase 7: Agentic Programming QA

These checks ensure AI agents can implement from this contract without ambiguity:

- [ ] **No prose-only descriptions** — Every endpoint has a table row, not just a paragraph.
- [ ] **No "see X for details"** cross-references — All information is self-contained.
- [ ] **No ambiguous field names** — Each field name is unique within its interface.
- [ ] **No untyped arrays** — Every array field specifies the item type (e.g., `string[]`, `IRecord[]`).
- [ ] **No magic strings** — Every string that has a fixed set of values is typed as a union or enum.
- [ ] **Copy-paste ready** — An agent can copy the TypeScript interfaces directly into a `.ts` file.
- [ ] **Mock data is valid JSON** — Parseable without syntax errors.
- [ ] **Consistent naming** — Hook names, key factories, and component names all follow `[module]` prefix.

---

## Approval Criteria

A contract is **ready for implementation** when:

1. ✅ All checklist items above are checked.
2. ✅ A developer (human or AI) can implement the full backend without asking clarifying questions.
3. ✅ A developer (human or AI) can implement the full frontend without seeing backend code.
4. ✅ The contract has been reviewed for alignment with `docs/architecture-guide.md` conventions.
