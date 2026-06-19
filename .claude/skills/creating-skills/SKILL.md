---
name: creating-skills
description: Creates well-structured Claude Code skills (SKILL.md + supporting files) following best practices. Use when the user asks to create, author, or build a new skill, or when documenting a reusable agent workflow as a skill.
---

# Creating Claude Code Skills

## Quick Start

A skill is a `SKILL.md` file (with optional supporting files) placed in `.claude/skills/<skill-name>/`.

```text
.claude/skills/<skill-name>/
├── SKILL.md              # Main instructions (required)
├── reference.md          # Detailed reference (optional)
├── examples.md           # Usage examples (optional)
└── scripts/              # Utility scripts (optional)
```

## Workflow

Copy and track progress:

```
Skill Creation Progress:
- [ ] Step 1: Gather requirements
- [ ] Step 2: Define metadata (name + description)
- [ ] Step 3: Write SKILL.md body
- [ ] Step 4: Create supporting files (if needed)
- [ ] Step 5: Review against checklist
```

### Step 1: Gather Requirements

Ask the user:
1. **What does the skill do?** (core capability)
2. **When should it trigger?** (keywords, scenarios)
3. **What freedom level?** → See [FREEDOM_LEVELS.md](FREEDOM_LEVELS.md)
4. **Does it need scripts?** (executable code vs. text-only instructions)

### Step 2: Define Metadata

Write YAML frontmatter with `name` and `description`.

**Name rules:**
- Lowercase letters/numbers/hyphens only
- Prefer gerund form: `processing-pdfs`, `managing-databases`

**Description rules:**
- Third person only ("Processes files", NOT "I help you process")
- Include **what** it does AND **when** to use it
- Include trigger keywords for discovery

**Example:**
```yaml
---
name: analyzing-spreadsheets
description: Analyzes Excel spreadsheets, creates pivot tables, and generates charts. Use when analyzing .xlsx files, tabular data, or when the user mentions spreadsheet analysis.
---
```

### Step 3: Write SKILL.md Body

Follow these rules:
- **Under 500 lines** for optimal performance
- **Be concise** — only add context the agent doesn't already know
- **Use progressive disclosure** — link to separate files for detailed content
- **Keep references one level deep** from SKILL.md (no nested file chains)
- **Use consistent terminology** throughout

**Structure pattern:**
````markdown
# [Skill Title]

## Quick start
[Minimal example to get started]

## Core instructions
[Main workflow or rules]

## Advanced features
**Feature A**: See [FEATURE_A.md](FEATURE_A.md)
**API reference**: See [REFERENCE.md](REFERENCE.md)
````

### Step 4: Create Supporting Files (if needed)

Split content when SKILL.md approaches 500 lines. Organize by domain:

```text
my-skill/
├── SKILL.md                    # Overview + navigation
├── reference/
│   ├── domain-a.md             # Domain-specific details
│   └── domain-b.md
└── scripts/
    └── validate.py             # Utility scripts
```

For reference files over 100 lines, add a table of contents at the top.

### Step 5: Review Against Checklist

See [CHECKLIST.md](CHECKLIST.md) for the complete quality checklist.

## Key Patterns

- **Template pattern**: Provide output format templates (strict or flexible)
- **Examples pattern**: Show input/output pairs for quality-dependent outputs
- **Conditional workflow**: Guide through decision points with branching paths
- **Feedback loops**: Run validator → fix errors → repeat
- **Verifiable intermediates**: plan file → validate → execute (for batch/destructive ops)

## Claude Code Specific Features

- **`disable-model-invocation: true`**: Only user can invoke the skill (e.g., `/deploy`, `/commit`). Use for side-effect workflows.
- **`user-invocable: false`**: Only Claude can invoke. Use for background knowledge.
- **`allowed-tools`**: Restrict which tools a skill can use (e.g., `Read, Grep, Glob`).
- **`context: fork`**: Run skill in a subagent for isolation.
- **`$ARGUMENTS`**: Access user-provided arguments in skill body.

## Common Mistakes

- Verbose explanations of things the agent already knows
- Vague names (`helper`, `utils`) or descriptions (`helps with files`)
- Multiple approach options without a clear default
- Deeply nested file references (keep one level deep)
- Time-sensitive information without an "old patterns" fallback
- Windows-style backslash paths (always use forward slashes)
- Missing trigger keywords in description
- Using first/second person in descriptions
