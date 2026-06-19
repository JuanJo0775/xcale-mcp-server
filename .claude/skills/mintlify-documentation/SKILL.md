---
name: mintlify-documentation
description: Creates, manages, and maintains Mintlify documentation sites that live inside project repos (monorepo mode). Covers project setup, docs.json configuration, MDX page authoring, OpenAPI/Swagger API reference integration, Mintlify CLI usage, navigation structure, component usage, and deployment. Use when creating documentation, adding doc pages, updating API references, configuring Mintlify, or troubleshooting doc deployments.
---

# Mintlify Documentation Management

## Quick Start

Mintlify docs live **inside each project repo** at `<project-root>/mintlify/`. Each project gets its own Mintlify dashboard project configured in monorepo mode pointing to the `/mintlify` path.

```text
<project-root>/
├── src/                    ← Project source code
├── docs/                   ← Internal dev notes (NOT Mintlify)
├── mintlify/               ← Mintlify documentation site
│   ├── docs.json           ← Site configuration (required)
│   ├── index.mdx           ← Homepage
│   ├── api-reference/      ← API docs + OpenAPI spec
│   │   ├── openapi.json    ← Exported from Fastify Swagger
│   │   └── introduction.mdx
│   ├── guides/             ← How-to guides
│   ├── architecture/       ← Technical architecture docs
│   ├── images/             ← Documentation images
│   ├── logo/               ← Brand logos (light.svg, dark.svg)
│   ├── snippets/           ← Reusable MDX snippets
│   └── .mintignore         ← Files to exclude from publishing
└── package.json
```

## Core Workflow

### 1. Initialize a New Mintlify Site

<details>
<summary>First-time setup checklist</summary>

- [ ] Create `mintlify/` directory at project root
- [ ] Create `mintlify/docs.json` with project config (see [project-setup.md](reference/project-setup.md))
- [ ] Create `mintlify/index.mdx` homepage
- [ ] Add logos to `mintlify/logo/` (light.svg, dark.svg)
- [ ] Add favicon to `mintlify/favicon.svg`
- [ ] Export OpenAPI spec from Fastify (see [api-reference.md](reference/api-reference.md))
- [ ] Configure Mintlify Dashboard: Git Settings → monorepo toggle → path `/mintlify`
- [ ] Install Mintlify CLI: `npm i -g mint`
- [ ] Test locally: `cd mintlify && mint dev`
</details>

### 2. Create or Edit Pages

Every page is an `.mdx` file with YAML frontmatter:

```mdx
---
title: "Page Title"
description: "Concise description for SEO and AI discoverability"
icon: "rocket"
---

Your content here using MDX (Markdown + React components).
```

**Key rules:**
- File names use `kebab-case.mdx` (e.g., `getting-started.mdx`)
- Every page MUST have `title` and `description` in frontmatter
- Use MDX (`.mdx`) not plain Markdown (`.md`) for full component support
- Add every new page to `docs.json` navigation or it won't appear in the sidebar

### 3. Update Navigation

All navigation is defined in `docs.json`. After creating a page, add it:

```json
{
  "navigation": {
    "tabs": [
      {
        "tab": "Guides",
        "groups": [
          {
            "group": "Getting Started",
            "pages": ["index", "quickstart", "new-page-slug"]
          }
        ]
      }
    ]
  }
}
```

Page references are **relative paths without the file extension** (e.g., `"guides/authentication"` for `guides/authentication.mdx`).

### 4. Preview and Validate

```bash
# Preview locally (from the mintlify/ directory)
cd mintlify && mint dev

# Check for broken links
mint broken-links

# Update CLI if preview doesn't match production
npm i -g mint@latest
```

Default preview: `http://localhost:3000`. Use `--port` flag if 3000 is busy.

### 5. Deploy

Push to the configured branch (usually `main`). Mintlify auto-deploys via the GitHub App.

## Component Quick Reference

Use Mintlify's built-in MDX components. Full reference: [components-reference.md](reference/components-reference.md)

| Component | Use For |
|-----------|---------|
| `<Card>` | Navigation links, feature highlights |
| `<CardGroup>` | Grid layout of cards |
| `<Steps>` + `<Step>` | Sequential instructions |
| `<Tabs>` + `<Tab>` | Alternative content views |
| `<Accordion>` | Collapsible sections |
| `<CodeGroup>` | Multi-language code examples |
| `<Note>`, `<Tip>`, `<Warning>`, `<Info>` | Callout boxes |
| `<Frame>` | Border/shadow around images |
| `<Tooltip>` | Hover definitions |
| `<Expandable>` | Nested API properties |
| Mermaid code blocks | Diagrams and flowcharts |

## API Reference Integration

For Fastify projects with `@fastify/swagger`, the API reference is auto-generated from your OpenAPI spec. See [api-reference.md](reference/api-reference.md) for:
- Exporting the spec from a running Fastify server
- Converting Swagger 2.0 → OpenAPI 3.x
- Configuring auto-populated API pages in `docs.json`

## Hosting at Custom Subpath

To host docs at `yourdomain.com/docs`, configure a reverse proxy (Vercel rewrites, Cloudflare Workers, etc.) to proxy `/docs/*` to `your-project.mintlify.app/*`. See [deployment.md](reference/deployment.md).

## Writing Standards

- **Voice**: Active, second person ("you")
- **Sentences**: Concise — one idea per sentence
- **Headings**: Sentence case
- **UI elements**: Bold — Click **Settings**
- **Code references**: Backtick — `docs.json`, `mint dev`
- **Structure**: Lead with value — most important info first
- **Links**: Always validate with `mint broken-links` before push

## Advanced Features

- **Reusable snippets**: See [components-reference.md](reference/components-reference.md#reusable-snippets)
- **OpenAPI auto-generation**: See [api-reference.md](reference/api-reference.md)
- **Custom domain / subpath**: See [deployment.md](reference/deployment.md)
- **AI features (assistant, llms.txt, MCP)**: See [deployment.md](reference/deployment.md#ai-features)
