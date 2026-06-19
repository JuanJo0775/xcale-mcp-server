# Skill Quality Checklist

Verify all items before finalizing a skill.

## Core Quality
- [ ] `name` is lowercase, hyphens, max 64 chars, no reserved words
- [ ] `description` is third-person, specific, includes trigger keywords
- [ ] `description` says **what** it does AND **when** to use it
- [ ] SKILL.md body is under 500 lines
- [ ] Only adds context the agent doesn't already know (concise)
- [ ] No time-sensitive info (or wrapped in "old patterns" section)
- [ ] Consistent terminology throughout (one term per concept)
- [ ] Examples are concrete, not abstract
- [ ] File references are one level deep from SKILL.md
- [ ] Progressive disclosure used for large content
- [ ] Workflows have clear, sequential steps

## Code & Scripts (if applicable)
- [ ] Scripts handle errors explicitly (don't punt to the agent)
- [ ] No magic numbers — all constants are documented
- [ ] Required packages are listed with install commands
- [ ] Scripts have clear documentation
- [ ] All paths use forward slashes
- [ ] Validation/feedback loops for critical operations
- [ ] Clear distinction: "Run script" vs "Read script as reference"

## Structure
- [ ] Skill placed in `.agent/skills/<skill-name>/`
- [ ] SKILL.md has valid YAML frontmatter (`name` + `description`)
- [ ] Supporting files organized by domain (e.g., `reference/`, `scripts/`)
- [ ] Reference files over 100 lines include a table of contents
- [ ] File names are descriptive (`form_validation.md`, not `doc2.md`)
