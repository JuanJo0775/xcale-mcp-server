# Freedom Levels Guide

Match instruction specificity to the task's fragility and variability.

## High Freedom (text-based instructions)

**Use when:** Multiple approaches are valid, decisions depend on context.

```markdown
## Code review process
1. Analyze code structure
2. Check for bugs and edge cases
3. Suggest improvements
4. Verify project conventions
```

## Medium Freedom (pseudocode/scripts with parameters)

**Use when:** A preferred pattern exists, some variation is acceptable.

````markdown
## Generate report
Use this template and customize:
```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data, generate output, optionally add charts
```
````

## Low Freedom (exact scripts, no parameters)

**Use when:** Operations are fragile, consistency is critical.

````markdown
## Database migration
Run exactly:
```bash
python scripts/migrate.py --verify --backup
```
Do not modify the command or add flags.
````

## Decision Guide

| Scenario | Freedom | Why |
|---|---|---|
| Code reviews | High | Context-dependent decisions |
| Report generation | Medium | Pattern exists, details vary |
| DB migrations | Low | Fragile, must be exact |
| Content writing | High | Creative, many valid outputs |
| API integrations | Medium | Patterns + config variation |
| Deploy scripts | Low | Consistency critical |
