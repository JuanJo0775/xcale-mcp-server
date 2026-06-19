# Feature Design Writing Style Guide

> This guide establishes the writing standards for Feature Design documents. It focuses on the **descriptive UX** sections, which are the most novel aspect of this skill — but the principles apply throughout.

---

## The Core Principle: Paint a Mental Picture

A Feature Design document should be so vivid that someone reading it can **close their eyes and see the screen**. We're not writing technical specs (that's the API contract). We're writing a **screenplay for the user experience**.

---

## Voice & Tone

### Use Active, Present Tense

Write as if you're narrating the user's experience in real time.

❌ **Passive/future:**
> A table will be displayed containing user records. The admin would then click on a row to see details.

✅ **Active/present:**
> The admin sees a data table showing all users in the system. Each row displays the user's name, ID number, last login date, and a status badge. Clicking a row opens the user detail panel on the right side.

### Use "The User" as Subject

Consistent subject makes narratives easy to follow for both humans and agents.

❌ **Mixed subjects:**
> The system displays a list. Admins can filter by date. Clicking opens a modal.

✅ **Consistent subject:**
> The user sees a paginated list of records. The user can filter by date range using the date picker in the filter bar. Clicking a record name opens the detail modal.

### Be Specific, Never Vague

Every element mentioned should be concrete.

❌ **Vague:**
> The page shows relevant information about the item.

✅ **Specific:**
> The page shows the creation date and time, the user's full name, the assigned agent, the duration, and the current status. The status is displayed as a color-coded badge: green for "Active", yellow for "Pending", gray for "Archived".

---

## Describing UI Elements

### Layout & Structure

Describe the spatial arrangement of elements using familiar terms:

| Use This | Not This |
|:--|:--|
| "A full-width data table" | "A tabular display" |
| "A sidebar on the left with filters" | "Filtering capabilities" |
| "A floating action bar at the bottom" | "Action controls" |
| "A card grid, 3 columns on desktop" | "A grid layout" |
| "A split panel — list on the left, details on the right" | "A master-detail layout" |
| "A sticky header with the page title and primary action button" | "A header area" |

### Interactive Elements

Describe triggers and their results:

```
Pattern: [Trigger] → [Immediate visual change] → [Result]
```

✅ **Good interaction description:**
> Clicking the "Add Target" button in the top-right corner opens a full-page form. The form has two sections: "Basic Information" (name, description, tags) and "Advanced Settings" (webhook URL, priority). All fields in "Basic Information" are required and show a red asterisk. The "Save" button at the bottom is disabled until all required fields are filled. On successful save, the user is redirected to the target list with a success toast: "Target created successfully".

### States

Always describe these four states for data-driven views:

1. **Empty State**: No records exist yet
2. **Loading State**: Data is being fetched
3. **Populated State**: Normal view with data
4. **Error State**: Something went wrong

✅ **Example — all four states:**
> **Empty State**: When no integrations exist, the user sees a centered illustration with the message "No integrations connected yet" and a prominent "Connect App" button below.
>
> **Loading State**: While integrations are loading, the list shows 5 skeleton cards with shimmer animation, matching the grid layout.
>
> **Populated State**: The dashboard shows integrations sorted by status with cards for Name, Icon, Status, and Actions.
>
> **Error State**: If the data fails to load, the user sees an error card with the message "Unable to load integrations. Please try again." and a "Retry" button.

---

## Describing Interactions

### Form Flows

For creation/edit forms, always cover:

1. **How the user gets there** (navigation path)
2. **What the form looks like** (sections, fields, grouping)
3. **What's required vs optional** (asterisks, labels)
4. **How validation works** (when errors appear, how they look)
5. **What happens on success** (redirect, toast, list update)
6. **What happens on failure** (error message placement)

### Status Transitions

For entities with lifecycle states, describe:

1. **What the user sees** (current status badge)
2. **What actions are available** (buttons, menu items)
3. **What confirmation is needed** (dialog, none)
4. **What changes visually** (badge color, available actions update)
5. **What side effects occur** (notifications, dependent records update)

---

## Tables vs. Prose

### Use Tables for Structured Data

| Good for Tables | Good for Prose |
|:--|:--|
| Metrics & KPIs | Problem statements |
| Architectural decisions | UX narratives |
| Risks with likelihood/impact | Context descriptions |
| Field lists with types | Interaction flow descriptions |
| Status transitions | Motivation and rationale |
| User role summaries | Edge case scenarios |

### Never Use Prose for Data That Has Categories

❌ **Prose:**
> The feature has three risk levels: a performance risk that is high likelihood and high impact which we'll mitigate with caching, a data risk that is medium likelihood...

✅ **Table:**

| Risk | Likelihood | Impact | Mitigation |
|:--|:--|:--|:--|
| Performance with large datasets | High | High | Pagination + caching |
| Data migration complexity | Medium | Medium | Phased migration script |

---

## Section-Specific Tips

### Problem Statement

- Lead with data if possible: "Currently, staff spend an average of 15 minutes manually..."
- Avoid solution language in the problem section: "We need a dashboard" ← this is a solution.
- The problem should be believable without the solution: Does the pain exist independently?

### User Stories

- Start with the most critical story first.
- Each story should be testable: Can someone verify `[action]` achieves `[value]`?
- Avoid compound stories: Break "I want to create and manage rules" into two stories.

### Feature Scope (MoSCoW)

- **Must Have test**: If I remove this item, is the feature still useful? If yes, it's not Must Have.
- **Won't Have test**: Could this cause scope creep if not explicitly excluded? If yes, list it.
- Won't Have is NOT a backlog — it's an explicit "we decided against this for this phase" list.

### UX Section

- Write as if guiding a painter through a scene of the interface.
- Include **micro-interactions**: hover states, focus states, transition animations (if important).
- Mention **accessibility concerns** when relevant: keyboard navigation, screen reader text.
- For complex flows, use numbered steps within the narrative.

### Data Model Sketch

- Keep it light — 3-6 key fields per entity, NOT every column.
- Focus on fields that **drive business logic** or **appear in the UI**.
- Use the relationship diagram to show connections, not to define schemas.

### Architectural Decisions

- Every decision needs a **WHY**, not just the choice.
- If you considered alternatives, mention them briefly: "We chose X over Y because..."
- Flag reversible vs. irreversible decisions — irreversible ones need more scrutiny.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|:---|:---|:---|
| "The page shows data" | Too vague for implementation | Describe exactly what data: columns, fields, format |
| "Standard CRUD operations" | Assumes everyone knows the same standard | Describe each operation's UX separately |
| "Beautiful, modern UI" | Subjective, unactionable | Describe specific layout, spacing, color usage |
| "Easy to use interface" | Not measurable | Describe the specific interactions that make it easy |
| "Various filters" | Agents will guess which filters | List every filter: field, type (dropdown/text/date), defaults |
| Full TypeScript interfaces | Wrong level of detail for Feature Design | Save for API Contract. Here: entity + key fields only |
| No error states | Incomplete UX | Always describe empty, loading, error, and success states |
| Solution in Problem Statement | Skips the "why" | Rewrite: describe the pain without mentioning the solution |
| "Responsive design" without details | Agents don't know what adapts | Describe: what changes on mobile? Collapsed sidebar? Card view? |
