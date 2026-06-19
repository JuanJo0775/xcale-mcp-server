# [FEATURE_NAME] — Feature Design

> **Feature**: [Full feature name and one-line description]
> **Priority**: [P0 Critical | P1 High | P2 Medium | P3 Low]
> **Owner**: [Name or role of the person driving this feature]
> **Status**: [Draft | In Review | Approved | In Progress | Done]
> **Target Release**: [Phase, sprint, quarter, or date]
> **Last Updated**: [YYYY-MM-DD]

---

## 1. Problem Statement

### What's happening?

[Describe the current pain point, inefficiency, or unmet need. Be specific and evidence-based. What are users doing today that's painful, slow, or impossible?]

### Who's affected?

[Which user roles experience this problem? In what context? How frequently?]

### What's the cost of inaction?

[What happens if we don't solve this? Lost revenue? User churn? Manual overhead? Regulatory risk? Quantify where possible.]

---

## 2. Goals & Success Metrics

### North Star

[One sentence: What does success look like for this feature?]

### Metrics

| Type | Metric | Target | How Measured |
|:--|:--|:--|:--|
| **Leading** | [Early indicator, e.g., adoption rate] | [Target value] | [Measurement method] |
| **Leading** | [Early indicator, e.g., task completion rate] | [Target value] | [Measurement method] |
| **Lagging** | [Outcome metric, e.g., time saved per user/week] | [Target value] | [Measurement method] |
| **Lagging** | [Outcome metric, e.g., error rate reduction] | [Target value] | [Measurement method] |

<!-- 
  Tips:
  - Leading indicators are things you can measure SOON (first week): adoption, click-through, feature usage.
  - Lagging indicators are outcomes that take TIME to materialize: revenue impact, churn reduction, NPS change.
  - Be specific: "50% of users adopt this feature within 30 days" > "Users adopt the feature."
-->

---

## 3. Target Users

<!-- Describe each user role affected by this feature. Not full personas — just role, context, and motivation. -->

### [Role 1: e.g., System Administrator]

- **Context**: [When and where do they encounter this need?]
- **Motivation**: [What do they want to achieve?]
- **Pain Today**: [How do they currently handle this?]
- **Expected Benefit**: [How does this feature change their experience?]

### [Role 2: e.g., End User / Manager]

- **Context**: [...]
- **Motivation**: [...]
- **Pain Today**: [...]
- **Expected Benefit**: [...]

<!-- Add more roles as needed. Keep each to 4 bullets. -->

---

## 4. User Stories

<!-- Group by priority. Each story follows: As a [role], I want [action] so that [value]. -->

### Must Have (P0)

- **US-01**: As a [role], I want to [action] so that [value].
- **US-02**: As a [role], I want to [action] so that [value].
- **US-03**: As a [role], I want to [action] so that [value].

### Should Have (P1)

- **US-04**: As a [role], I want to [action] so that [value].
- **US-05**: As a [role], I want to [action] so that [value].

### Could Have (P2)

- **US-06**: As a [role], I want to [action] so that [value].

---

## 5. Feature Scope (MoSCoW)

### ✅ Must Have — Phase 1 MVP

<!-- These items are ship-blocking. The feature is incomplete without them. -->

- [ ] [Core capability 1]
- [ ] [Core capability 2]
- [ ] [Core capability 3]

### 🟡 Should Have — High Value

<!-- Strong value but not blocking launch. Planned for Phase 1 if time allows, otherwise Phase 2. -->

- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### 🔵 Could Have — Nice to Have

<!-- Low priority. Only if there's bandwidth. -->

- [ ] [Nice-to-have 1]

### ⛔ Won't Have — Explicit Out of Scope

<!-- CRITICAL: Be explicit about what we are NOT building. This prevents scope creep. -->

- [Feature or behavior explicitly excluded and WHY]
- [Feature or behavior explicitly excluded and WHY]
- [Feature or behavior explicitly excluded and WHY]

---

## 6. UX & Interaction Design

<!-- 
  Write this section as VIVID NARRATIVES. Describe what the user sees, does, and experiences 
  screen by screen. A designer or frontend agent should be able to visualize the interface 
  from this text alone.

  Use active phrasing: "The user sees...", "Clicking X opens...", "The status changes to..."
  
  Cover: happy path, empty states, loading states, error states, and edge cases.
-->

### 6.1 Entry Point

[How does the user access this feature? Sidebar menu item? Button on an existing page? Notification link?]

### 6.2 Main View — [Page Name]

[Describe the primary screen the user sees when they land on this feature.]

**Layout**: [What's the overall structure? List view with filters? Dashboard with cards? Split panel?]

**Content**: [What data is displayed? Describe the table columns, card fields, or dashboard widgets. Be specific about what each element shows.]

**Empty State**: [What does the user see when there's no data yet? Helpful message + call-to-action?]

**Loading State**: [How does the page indicate data is loading? Skeleton screens? Spinner? Progressive loading?]

### 6.3 Creation Flow — [Creating a New Entity]

[Describe the creation experience step by step.]

**Trigger**: [What action starts the creation? A button? Where is it positioned?]

**Form Structure**: [Describe the form sections and fields. Which are required? How are they grouped? Is it a full page form or a modal?]

**Validation**: [How are errors shown? Inline? Summary? When does validation trigger — on blur, on submit?]

**Submit**: [What happens on successful submission? Redirect? Toast message? Added to list?]

**Error Handling**: [What happens if the submit fails? How is the error displayed?]

### 6.4 Detail View — [Viewing/Editing an Entity]

[Describe what the user sees when they click into a specific record.]

**Read Mode**: [How is the information laid out? Sections? Tabs? Summary cards?]

**Edit Mode**: [How does the user enter edit mode? Inline editing? Edit button → modal? Edit button → form page?]

**Actions**: [What actions are available? Status transitions? Delete? Export? Share?]

### 6.5 Key Interactions

<!-- Describe non-obvious or important interactions. -->

| Interaction | Trigger | Behavior |
|:--|:--|:--|
| [e.g., Status transition] | [e.g., Click "Approve" button] | [e.g., Confirmation dialog appears. On confirm, status changes and badge updates to green. Toast shows success message.] |
| [e.g., Bulk selection] | [e.g., Checkbox on table rows] | [e.g., A floating action bar appears at the bottom with "Delete Selected" and "Export Selected" options.] |
| [e.g., Search] | [e.g., Typing in search bar] | [e.g., Debounced search (300ms). Results filter in real-time. Highlights matching text.] |

### 6.6 Responsive Behavior

[How does the layout adapt on smaller screens? Does the table become cards? Do sidebar filters collapse into a dropdown?]

### 6.7 Notifications & Feedback

[What system notifications does this feature trigger? Email? In-app? WhatsApp? When and to whom?]

---

## 7. Data Model Sketch

<!-- 
  This is a HIGH-LEVEL entity sketch, NOT full DTOs (those belong in the API contract).
  Show entities, their key fields, and how they relate to each other.
-->

### Entities

#### [Entity 1: e.g., Integration]

| Field | Type | Description |
|:--|:--|:--|
| [key field 1] | [type] | [what it represents] |
| [key field 2] | [type] | [what it represents] |
| [status] | [enum: value1, value2] | [lifecycle state] |

#### [Entity 2: e.g., Configuration]

| Field | Type | Description |
|:--|:--|:--|
| [key field 1] | [type] | [what it represents] |

### Relationships

```
[Entity A] ──has many──▶ [Entity B]
[Entity B] ──belongs to──▶ [Entity C]
[Entity C] ──has one──▶ [Entity D]
```

### State Machine (if applicable)

```
[state_1] ──[Action]──▶ [state_2] ──[Action]──▶ [state_3] (terminal)
     │
     └──[Alt Action]──▶ [state_4]
```

| From | To | Action | Who Can Do It | Side Effects |
|:--|:--|:--|:--|:--|
| [state_1] | [state_2] | [Action verb] | [Role] | [What happens: notifications, calculations, etc.] |

---

## 8. Architectural Decisions

<!-- Document key design choices as lightweight ADRs (Architecture Decision Records). -->

| # | Decision | Choice | Rationale |
|:--|:--|:--|:--|
| AD-1 | Architecture Pattern | [Use Case Pattern] | [Standard Clean Architecture module] |
| AD-2 | Tool Executor | [Need `create_xyz` tool / None] | [Registers a tool for Agent consumption] |
| AD-3 | Storage Strategy | [New Mongoose collection `[name]` / Extend existing] | [Why this choice] |
| AD-4 | Creation Pattern | [Full-page form / Modal] | [Why this choice — field count, complexity] |
| AD-5 | Integration Points | [External API / Internal module / None] | [Why this choice] |
| AD-6 | Notification Triggers | [Email / In-app / WhatsApp / None] | [When and why] |

<!-- Add more rows as needed. Each decision should have a clear "choice" and "rationale". -->

---

## 9. Risks & Open Questions

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|:--|:--|:--|:--|:--|
| R-1 | [Technical risk, e.g., "Performance with large datasets"] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| R-2 | [Data risk, e.g., "Migration of existing data"] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| R-3 | [UX risk, e.g., "Users may not discover the feature"] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |

### Open Questions

| # | Question | Needed By | Owner | Resolution |
|:--|:--|:--|:--|:--|
| Q-1 | [Unresolved question] | [Phase/Date] | [Who answers this] | [Pending / Resolved: answer] |
| Q-2 | [Unresolved question] | [Phase/Date] | [Who answers this] | [Pending / Resolved: answer] |

---

## 10. Phasing & Roadmap

| Phase | Scope Summary | Key Deliverables | Dependencies | Est. Effort |
|:--|:--|:--|:--|:--|
| **Phase 1** | [MVP — core functionality] | [List of deliverables] | [None / Phase X of Module Y] | [S/M/L/XL] |
| **Phase 2** | [Enhancement — extended features] | [List of deliverables] | [Phase 1 complete] | [S/M/L/XL] |
| **Phase 3** | [Polish — optimizations, integrations] | [List of deliverables] | [Phase 2 complete] | [S/M/L/XL] |

<!-- 
  Effort Scale:
  S = 1-2 days   | Simple CRUD, small UI changes
  M = 3-5 days   | Multi-endpoint feature, moderate UI
  L = 1-2 weeks  | Complex feature, integrations, multi-page UI
  XL = 2+ weeks  | Major module, external APIs, multi-system integration
-->

---

## 11. Agentic Context

<!-- 
  This section helps AI coding agents orient themselves when working 
  downstream (API contracts, implementation). Keep it factual and concise.
-->

### Related Modules

| Module | Relationship | Key Files |
|:--|:--|:--|
| [e.g., Users] | [e.g., This feature references user data] | [e.g., `src/modules/users/`] |
| [e.g., Agent] | [e.g., This feature extends agent tools] | [e.g., `src/modules/agent/tools/`] |

### Codebase Entry Points

- **Module**: `src/modules/[module]/` — Contains entity definitions, use cases, controllers, and repository implementations.
- **Infrastructure**: `src/infrastructure/` — Shared infrastructure mechanisms (db, auth, ai, i18n).
- **Agent Tools**: `src/modules/agent/tools/implementations/` — Where tool executors are added.

### Conventions to Follow

- **Architecture**: Follow the Clean Architecture pattern documented in `docs/architecture-guide.md`.
- **Injection**: Controllers inject UseCases; UseCases inject Repositories.
- **Routing**: API Routes use FastAPI standards. Validate requests with JSON Schema. 
- **Response Format**: Use `{ success: boolean, data?: any, error?: string }`.
- **Agent Tools**: Tools should return a `ui` object if they trigger visual entities to render on the frontend context.
- **i18n**: All user-facing strings go through `t('key', request.locale)`.
- **Database**: Use Mongoose schemas with indexing.

### Next Steps After Approval

1. **Generate API Contract** → Use the `api-contract-authoring` skill with this Feature Design as input.
2. **Create wireframes** → Use the UX section (Section 6) to create mockups in your design tool of choice.
3. **Implement** → Follow the API Contract for backend and frontend implementation.
