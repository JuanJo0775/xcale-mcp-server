# Project Setup Reference

## Table of Contents
- [Directory Structure](#directory-structure)
- [docs.json Configuration](#docsjson-configuration)
- [Monorepo Dashboard Setup](#monorepo-dashboard-setup)
- [Branding](#branding)
- [Homepage Template](#homepage-template)
- [.mintignore](#mintignore)

## Directory Structure

Create the following structure at `<project-root>/mintlify/`:

```text
mintlify/
├── docs.json               ← Required: site configuration
├── index.mdx               ← Required: homepage
├── favicon.svg             ← Browser tab icon
├── .mintignore              ← Exclude files from publishing
├── logo/
│   ├── light.svg            ← Logo for light theme
│   └── dark.svg             ← Logo for dark theme
├── images/                  ← Screenshots, diagrams
├── snippets/                ← Reusable MDX fragments
├── api-reference/
│   ├── openapi.json         ← Exported OpenAPI spec
│   └── introduction.mdx    ← API overview page
├── guides/                  ← How-to guides
│   ├── quickstart.mdx
│   ├── authentication.mdx
│   └── ...
├── architecture/            ← Technical docs
│   ├── overview.mdx
│   └── ...
└── changelog/               ← Optional: release notes
    └── v1.mdx
```

## docs.json Configuration

The `docs.json` file is the **single source of truth** for your Mintlify site. Minimum required fields:

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "theme": "mint",
  "name": "Project Name",
  "colors": {
    "primary": "#16A34A",
    "light": "#07C983",
    "dark": "#15803D"
  },
  "favicon": "/favicon.svg",
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg"
  },
  "navigation": {
    "tabs": [
      {
        "tab": "Documentation",
        "groups": [
          {
            "group": "Getting Started",
            "pages": ["index", "guides/quickstart"]
          }
        ]
      },
      {
        "tab": "API Reference",
        "openapi": "api-reference/openapi.json"
      }
    ]
  }
}
```

### Key configuration fields

| Field | Purpose | Required |
|-------|---------|----------|
| `$schema` | Enables editor autocomplete/validation | Recommended |
| `theme` | Visual theme (`"mint"`, `"quill"`, `"prism"`, `"venus"`) | Yes |
| `name` | Site name shown in header | Yes |
| `colors.primary` | Primary accent color (hex) | Yes |
| `colors.light` | Light theme accent (hex) | No |
| `colors.dark` | Dark theme accent (hex) | No |
| `favicon` | Browser tab icon path | No |
| `logo.light/dark` | Header logos for each theme | No |
| `navigation` | Entire sidebar/tab structure | Yes |
| `navbar.links` | Top-right nav links | No |
| `navbar.primary` | CTA button in navbar | No |
| `footer.socials` | Social links in footer | No |
| `contextual.options` | AI context menu options | No |

### Navigation patterns

**Tabs** — Top-level horizontal navigation:
```json
"navigation": {
  "tabs": [
    { "tab": "Guides", "groups": [...] },
    { "tab": "API Reference", "openapi": "api-reference/openapi.json" }
  ]
}
```

**Groups** — Sidebar sections within a tab:
```json
{
  "group": "Authentication",
  "pages": ["guides/auth-overview", "guides/jwt-tokens", "guides/roles"]
}
```

**Anchors** — Global links outside the tab structure:
```json
"navigation": {
  "global": {
    "anchors": [
      { "anchor": "GitHub", "href": "https://github.com/org/repo", "icon": "github" },
      { "anchor": "Support", "href": "mailto:support@example.com", "icon": "envelope" }
    ]
  }
}
```

### Contextual AI menu

Enable AI-powered features on every page:
```json
"contextual": {
  "options": ["copy", "view", "chatgpt", "claude", "cursor", "mcp"]
}
```

## Monorepo Dashboard Setup

Since docs live inside a project repo (not a dedicated docs repo), configure monorepo mode:

1. Go to [Mintlify Dashboard](https://dashboard.mintlify.com) → **Settings** → **Git Settings**
2. Connect to your project's GitHub repository (e.g., `matesjara/xcale-backend`)
3. Toggle **"Set up as monorepo"** → ON
4. Set path: `/mintlify` (no trailing slash)
5. Save changes

**Important**: Install the [Mintlify GitHub App](https://dashboard.mintlify.com/settings/organization/github-app) on the repository. Grant it access to only the needed repos.

## Branding

### Logos
- Place `light.svg` and `dark.svg` in `mintlify/logo/`
- SVG format is preferred for crisp rendering
- Keep logos simple and legible at small sizes

### Favicon
- Place as `mintlify/favicon.svg`
- SVG format recommended

### Colors
- Use hex values matching your brand
- `primary`: Used for links, buttons, and accents
- `light`: Override for light theme if primary is too dark
- `dark`: Override for dark theme if primary is too light

## Homepage Template

```mdx
---
title: "Introduction"
description: "Your project tagline or description for SEO"
---

Brief intro paragraph about what this project is and who it's for.

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/guides/quickstart">
    Get up and running in under 5 minutes.
  </Card>
  <Card title="API Reference" icon="terminal" href="/api-reference/introduction">
    Explore the full API with an interactive playground.
  </Card>
  <Card title="Architecture" icon="sitemap" href="/architecture/overview">
    Understand the system design and key patterns.
  </Card>
  <Card title="Changelog" icon="clock" href="/changelog">
    See what's new in the latest release.
  </Card>
</CardGroup>
```

## .mintignore

Exclude files from the published site. Follows `.gitignore` syntax:

```
# Exclude drafts
drafts/

# Exclude internal notes
INTERNAL.md

# Exclude test files
*.test.mdx
```
