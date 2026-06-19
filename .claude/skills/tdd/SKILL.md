---
name: tdd
description: Test-driven development for the xcale backend using Vitest and a red-green-refactor loop. Use when building a feature or fixing a bug test-first, when the user mentions "red-green-refactor", TDD, or wants behavior locked down with tests before or alongside the change. Builds one vertical slice at a time through the use-case/entity seams.
---

# Test-Driven Development (xcale)

Adapted from classic red-green-refactor for this repo: **Vitest**, co-located
`src/**/*.test.ts`, `@/`-aliased imports, tests that exercise behavior through the
**public interface of a use case or entity** — never private internals or the DB
directly.

Before writing anything, read the project's domain glossary (`CONTEXT.md`) so test
names and interface vocabulary match the project's language, and respect any ADRs in
`docs/adr/` for the area you're touching.

## Philosophy

**Test behavior through public interfaces, not implementation.** A good test reads like
a specification — `"attempt 4 fires at T+7d"`, `"reconnect proceeds even when status is
CONNECTED"`. It survives refactors because it doesn't know how the code is structured
inside. In Clean Architecture terms: test at the **use-case or entity seam**, assert on
the returned value or the response envelope — not on repository internals.

**Bad tests** mock internal collaborators, assert on private fields, or verify by
querying Mongo directly instead of going through the interface. The warning sign: you
rename an internal function and a test breaks though behavior didn't change.

### What to mock, what not to

- **Don't mock** the entity/use-case under test, or pure logic.
- **Do** inject fakes for the repository **interface** (`IFooRepository`) — an
  in-memory adapter is better than a `vi.fn()` mountain. Two real adapters (Mongo +
  in-memory) prove the seam is real; one is a hypothetical seam.
- **Don't** reach for the network, ePayco, Composio, or Anthropic in a unit test. Those
  live behind interfaces — fake them. Real third-party calls belong in `/qa` (api-qa),
  not here.

## Anti-pattern: horizontal slices

**DO NOT write all tests first, then all implementation.** Tests written in bulk test
*imagined* behavior — they assert on data shapes and signatures, pass when behavior
breaks, and fail when it's fine.

```
WRONG (horizontal):   RED: test1..test5   then   GREEN: impl1..impl5
RIGHT (vertical):     test1→impl1, test2→impl2, test3→impl3, …
```

Each test responds to what you learned from the previous cycle.

## Workflow

### 1. Plan (get approval before code)

- [ ] Read `CONTEXT.md`; name behaviors using the glossary.
- [ ] Confirm the **public interface** under test (which use-case method / entity
      static / response envelope). Prefer the highest existing seam; don't invent a new
      one just for testability.
- [ ] List the **behaviors** to test, not implementation steps — and prioritize. You
      can't test everything; focus on critical paths (money, auth, tenant isolation,
      tool resolution) and complex logic.
- [ ] Get the user's sign-off on the behavior list.

Ask: *"What should the public interface look like, and which behaviors matter most?"*

### 2. Tracer bullet

Write ONE test for ONE behavior, end-to-end through the seam:

```
RED:   write the test → it fails (run `npm test -- <file>`)
GREEN: minimal code to pass → it passes
```

### 3. Incremental loop

For each remaining behavior: `RED → GREEN`, one at a time. Only enough code to pass the
current test. Don't anticipate future tests.

### 4. Refactor (only while GREEN)

After tests pass: extract duplication, **deepen modules** (push complexity behind a
small interface), tighten names against `CONTEXT.md`. Re-run tests after each step.
**Never refactor while RED** — get to green first.

## Per-cycle checklist

```
[ ] Test names a behavior in glossary vocabulary, not an implementation detail
[ ] Test goes through the public use-case/entity interface only
[ ] Test would survive an internal refactor (rename/move) unchanged
[ ] No real network / DB / third-party calls — repository faked at its interface
[ ] Code is minimal for this test; nothing speculative added
```

## Running

- One file: `npm test -- src/modules/<module>/<name>.test.ts`
- Watch: `npm run test:watch`
- All: `npm test`

Co-locate the test next to its subject as `<name>.test.ts`, import via `@/…`, and use
`describe / it / expect` from `vitest`.
