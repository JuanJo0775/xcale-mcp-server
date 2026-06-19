# Branch Strategy Reference

## Branch Naming Convention

**Format:** `<type>/<ticket-id>-<short-description>` or `<type>/<short-description>`

| Prefix      | Source branch | PR target | When to use                              |
| ----------- | ------------- | --------- | ---------------------------------------- |
| `feat/`     | `dev`         | `dev`     | New features, module additions           |
| `fix/`      | `dev`         | `dev`     | Bug fixes, non-critical                  |
| `hotfix/`   | `main`        | `main`    | Critical production bugs, security fixes |
| `chore/`    | `dev`         | `dev`     | Maintenance, config, dependencies        |
| `docs/`     | `dev`         | `dev`     | Documentation changes                    |
| `refactor/` | `dev`         | `dev`     | Code restructuring, no behavior change   |
| `perf/`     | `dev`         | `dev`     | Performance improvements                 |
| `test/`     | `dev`         | `dev`     | Test additions or updates                |

**Examples:**

```
feat/XCA-103-composio-agent-tools
fix/XCA-78-nevatal-decryption
hotfix/auth-token-refresh
chore/cleanup-legacy-configs
docs/architecture-guide-update
refactor/extract-integration-status
```

**Rules:**

- kebab-case, lowercase
- Concise (under 50 chars for the description part)
- Include ticket ID when available (XCA-\*)
- Descriptive — someone reading the branch name should understand the intent

## Flow: Feature Development

```bash
# 1. Start from dev
git fetch origin dev
git checkout dev
git pull origin dev
git checkout -b feat/XCA-103-composio-agent-tools

# 2. Work, commit (can be multiple commits)
git add src/modules/user-agent-config/usecases/getToolGroups.ts
git commit -m "feat(composio): surface connected plugins in agent tool wizard"

# 3. Push and create PR to dev
git push -u origin feat/XCA-103-composio-agent-tools
gh pr create --base dev --title "feat(composio): surface connected plugins in agent tool wizard"

# 4. After the user authorizes merge, clean up
git checkout dev
git pull origin dev
git branch -d feat/XCA-103-composio-agent-tools
```

## Flow: Hotfix

```bash
# 1. Branch from main (production)
git fetch origin main
git checkout main
git pull origin main
git checkout -b hotfix/auth-token-refresh

# 2. Fix, commit, push
git add src/infrastructure/auth/verifyToken.ts
git commit -m "fix(auth): handle expired refresh token gracefully"
git push -u origin hotfix/auth-token-refresh

# 3. PR directly to main
gh pr create --base main --title "fix(auth): handle expired refresh token"

# 4. After merge to main, sync dev
git checkout dev
git pull origin dev
git merge origin/main
git push origin dev
```

## Branch Cleanup

Branches are short-lived. After a PR is merged, delete the branch — both locally and on GitHub.

### After merging a feature PR to dev

```bash
# Switch to dev and pull the merge
git checkout dev
git pull origin dev

# Delete the local branch
git branch -d feat/XCA-103-composio-agent-tools

# Delete remote branch (if GitHub didn't auto-delete)
git push origin --delete feat/XCA-103-composio-agent-tools
```

### Bulk cleanup (stale branches)

```bash
# Prune remote-tracking refs that no longer exist on origin
git fetch --prune

# Find local branches whose remote is gone
git branch -vv | grep ': gone]' | awk '{print $1}'

# Delete each one (safe — only deletes fully merged branches)
git branch -d <branch-name>
```

### Proactive cleanup at task start

Before creating a new branch, always:

1. `git fetch --prune` — sync remote state
2. Delete stale local branches (remote gone, already merged)
3. Then create the new branch from `dev`

This keeps the local repo clean and avoids confusion from old branches.

## Keeping dev in sync

After a hotfix merges to `main`, or after a release merges `dev` to `main`:

```bash
git checkout dev
git pull origin dev
git merge origin/main
git push origin dev
```

This prevents `dev` from diverging from production.

## Scopes

Use one of the backend module scopes when relevant. These map to `src/modules/`:

- `agent`, `agent-collaboration`, `agent-db`, `agent-templates`, `billing`, `catalog`, `chat`, `composio`, `crm`, `escalation`, `goals`, `gsc`, `instagram`, `integrations`, `knowledge`, `nevatal`, `payments`, `plans`, `sanity`, `scheduler`, `shopify`, `subscriptions`, `tasks`, `user-agent-config`, `whatsapp`, `wordpress`

Cross-cutting: `auth`, `i18n`, `infra`, `db`, `config`, `deps`, `cors`, `build`, `ci`, `tools`
