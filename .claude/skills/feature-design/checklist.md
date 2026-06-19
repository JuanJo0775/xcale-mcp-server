# Feature Design Review Checklist

Use this checklist **before finalizing** any Feature Design document. Every applicable item must be checked.

---

## Phase 1: Strategic Foundation

- [ ] **Problem Statement** is evidence-based, not assumption-based.
- [ ] **Problem Statement** clearly identifies WHO is affected and HOW OFTEN.
- [ ] **Cost of inaction** is articulated — what happens if we don't build this?
- [ ] **North Star goal** is a single, clear sentence.
- [ ] **Success Metrics** include at least 1 leading AND 1 lagging indicator.
- [ ] **Success Metrics** are SMART — Specific, Measurable, Achievable, Relevant, Time-bound.
- [ ] **Target value** is defined for each metric — not just "increase" or "improve".

## Phase 2: User Clarity

- [ ] **All affected user roles** are listed in Target Users.
- [ ] **Each role** has Context, Motivation, Pain Today, and Expected Benefit.
- [ ] **User Stories** follow the standard format: `As a [role], I want [action] so that [value]`.
- [ ] **User Stories** are grouped by priority (P0 / P1 / P2).
- [ ] **No user story is a technical task** — they describe user behavior, not implementation.
- [ ] **User stories cover the full lifecycle** — create, read, update, delete, edge cases.

## Phase 3: Scope Control

- [ ] **Must Have** items are truly ship-blocking — the feature is incomplete without them.
- [ ] **Should Have** items are clearly separated from Must Have — no hidden dependencies.
- [ ] **Won't Have** section is filled — at least 2 explicit exclusions.
- [ ] **Won't Have** items include the reason WHY they're excluded.
- [ ] **No ambiguous scope** — every item is specific enough to be implementable.
- [ ] **Phase 1 MVP** is small enough to be achievable, large enough to be valuable.

## Phase 4: UX Descriptive Quality

- [ ] **Entry Point** is described — how does the user get to this feature?
- [ ] **Main View** includes layout, content description, and data displayed.
- [ ] **Empty State** is described — what shows when there's no data?
- [ ] **Loading State** is described — how does the page indicate loading?
- [ ] **Creation Flow** describes trigger, form structure, validation, submit, and error handling.
- [ ] **Detail/Edit View** is described — how does the user view and modify a record?
- [ ] **Key Interactions table** covers important non-obvious behaviors.
- [ ] **Narrative style** is used — "The user sees...", not "Display a table with..."
- [ ] **Error states** are covered — what happens when things go wrong?
- [ ] **All described interactions map to user stories** — no orphaned UX that nobody asked for.
- [ ] **Responsive behavior** is mentioned (even if brief).

## Phase 5: Data Model & Architecture

- [ ] **All entities** mentioned in user stories appear in the Data Model Sketch.
- [ ] **Entity relationships** are shown with a text diagram.
- [ ] **Key fields** are listed per entity — enough to understand the shape, not full DTOs.
- [ ] **Architectural Decisions** are documented with rationale (not just the choice).
- [ ] **Storage Strategy** is documented — new collection or extend existing.
- [ ] **Agent/Tool requirements** are called out if this feature adds AI capabilities.
- [ ] **No TypeScript interfaces** are defined — those belong in the API contract.

## Phase 6: Risk & Completeness

- [ ] **At least 2 risks** are identified with likelihood, impact, and mitigation.
- [ ] **Open Questions** are listed with owner and deadline.
- [ ] **No open question blocks implementation** — if it does, resolve it first.
- [ ] **Phasing** is defined with clear Phase 1 scope.
- [ ] **Effort estimate** is provided per phase (S/M/L/XL).
- [ ] **Dependencies** between phases are documented.

## Phase 7: Agentic Readiness

- [ ] **Metadata block** is complete — all fields filled.
- [ ] **Related Modules** lists existing modules this feature touches.
- [ ] **Codebase Entry Points** point to the correct module structural directories.
- [ ] **Conventions to Follow** are listed (or reference architecture guide).
- [ ] **Next Steps** clearly state "Generate API Contract" as the first downstream action.
- [ ] **All structured data uses tables** — not prose paragraphs.
- [ ] **Headers follow consistent hierarchy** — H1 (title), H2 (sections), H3 (subsections).
- [ ] **No "see X for details"** without inline context — the document is self-contained.
- [ ] **Consistent terminology** — the entity name is the same throughout the document.

---

## Approval Criteria

A Feature Design is **ready for API contract generation** when:

1. ✅ All applicable checklist items above are checked.
2. ✅ A developer (human or AI) can understand the complete feature without asking clarifying questions.
3. ✅ A designer can create wireframes from the UX section alone.
4. ✅ The `api-contract-authoring` skill can be invoked with this document as the primary input.
5. ✅ A product stakeholder can review and approve the scope and priorities.

---

## Common Rejection Reasons

| Issue | Example | Fix |
|:--|:--|:--|
| Vague problem statement | "Users need better tools" | Add specifics: who, when, how often, what pain? |
| No success metrics | "The feature should be useful" | Add measurable targets: adoption rate, time saved |
| Missing Out of Scope | Nothing in Won't Have | Always define boundaries — what are we NOT building? |
| Technical user stories | "Create a MongoDB index" | Rewrite as user behavior: "As a user, I want fast search..." |
| Prose-only UX | "The page shows a list of items" | Add narrative detail: layout, states, interactions |
| Full DTOs in data model | TypeScript interfaces with all fields | Keep sketchy — entity + key fields + relationships only |
| Decisions without rationale | "We'll use a new collection" | Add WHY: "Because X data is independent of Y" |
| No phasing | Everything in one big launch | Split into MVP (Must Have) + enhancement phases |
