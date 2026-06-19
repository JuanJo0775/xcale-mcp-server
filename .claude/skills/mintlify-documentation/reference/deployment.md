# Deployment & Operations Reference

## Table of Contents
- [Deployment Flow](#deployment-flow)
- [Custom Domain and Subpath](#custom-domain-and-subpath)
- [Mintlify CLI Reference](#mintlify-cli-reference)
- [Preview Deployments](#preview-deployments)
- [CI Checks](#ci-checks)
- [AI Features](#ai-features)
- [Troubleshooting](#troubleshooting)

## Deployment Flow

Mintlify deploys automatically when you push to the configured branch:

```
git push to main
    ↓
GitHub App detects change in /mintlify directory
    ↓
Mintlify builds the site
    ↓
Site is live at your-project.mintlify.app (or custom domain)
```

### Manual deployment trigger
If auto-deploy doesn't trigger, go to [Mintlify Dashboard](https://dashboard.mintlify.com) → **Overview** → trigger manually, or use the API:

```bash
curl -X POST "https://api.mintlify.com/v1/update/trigger" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## Custom Domain and Subpath

### Hosting at `yourdomain.com/docs`

To host docs at a subpath (e.g., `xcale.app/docs`), configure a reverse proxy on your hosting platform.

**Vercel (recommended for Next.js apps):**

Add to `vercel.json` in your frontend project:
```json
{
  "rewrites": [
    {
      "source": "/docs/:match*",
      "destination": "https://your-project.mintlify.app/:match*"
    }
  ]
}
```

**Cloudflare Workers:**

Create a Worker that proxies `/docs/*` traffic:
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/docs')) {
      const mintlifyUrl = `https://your-project.mintlify.app${url.pathname.replace('/docs', '')}${url.search}`;
      return fetch(mintlifyUrl, { headers: request.headers });
    }
    return fetch(request);
  }
};
```

**Custom domain (full domain):**

In Mintlify Dashboard → **Settings** → **Custom Domain**:
1. Enter your domain (e.g., `docs.xcale.app`)
2. Add the provided CNAME record to your DNS settings
3. Wait for DNS propagation and SSL provisioning

## Mintlify CLI Reference

Install globally:
```bash
npm i -g mint
```

### Core Commands

| Command | Description |
|---------|-------------|
| `mint dev` | Start local preview server at `http://localhost:3000` |
| `mint dev --port 3333` | Start on custom port |
| `mint broken-links` | Find and report broken links in your docs |
| `mint update` | Update CLI to latest version |

### Usage patterns

```bash
# Always run from the mintlify/ directory (where docs.json lives)
cd mintlify

# Start preview
mint dev

# Custom port (if 3000 is occupied by your dev server)
mint dev --port 3333

# Validate all links before pushing
mint broken-links

# Update CLI when local preview diverges from production
npm i -g mint@latest
# or
mint update
```

### Requirements
- Node.js v19 or higher (v20 LTS recommended)
- The `docs.json` file must be in the current directory

### Common Issues

| Issue | Solution |
|-------|----------|
| "Could not load sharp" | Reinstall: `npm remove -g mint && npm i -g mint` |
| Preview doesn't match production | Run `mint update` |
| Unknown error on startup | Delete `~/.mintlify` folder, then retry |
| Port already in use | Use `--port` flag or kill the process on port 3000 |

## Preview Deployments

On the **Pro plan**, opening a pull request generates a unique preview URL. This lets reviewers see how docs changes will look before merging.

- Preview deploys are automatic for PRs that modify files in the `/mintlify` directory
- Each PR gets its own unique `preview-xxxxx.mintlify.app` URL
- The Mintlify GitHub App posts the preview link as a PR comment

## CI Checks

### GitHub Action for link validation

```yaml
# .github/workflows/docs-lint.yml
name: Lint Documentation
on:
  pull_request:
    paths: ['mintlify/**']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm i -g mint
      - run: cd mintlify && mint broken-links
```

## AI Features

Mintlify automatically provides several AI-ready features:

### llms.txt
Auto-generated file at `your-site/llms.txt` that indexes all documentation pages. AI tools use this to discover available content. URL: `https://your-project.mintlify.app/llms.txt`

### skill.md
Auto-generated capability file at `your-site/skill.md`. Contains structured information about your documentation for AI coding assistants. Install with:
```bash
npx skills add https://your-project.mintlify.app/docs
```

### MCP Server
Built-in Model Context Protocol server that lets AI tools connect directly to your documentation. Configure in AI tools that support MCP.

### Markdown Export
Every page is available as Markdown by appending `.md` to the URL:
```
https://your-project.mintlify.app/guides/quickstart.md
```

### AI Assistant (Pro plan)
Embeddable chat widget that answers questions based on your documentation content.

### Contextual Menu
Add AI options to every page:
```json
"contextual": {
  "options": ["copy", "view", "chatgpt", "claude", "cursor", "mcp"]
}
```

## Troubleshooting

### Deployment not triggering
1. Verify the GitHub App is installed on the correct repository
2. Check that monorepo path is set to `/mintlify` (no trailing slash)
3. Check that you're pushing to the configured branch (usually `main`)
4. Try manual trigger from the dashboard

### 404 on pages
1. Verify the page is listed in `docs.json` navigation
2. Check file extension is `.mdx` (not `.md` for component support)
3. Verify the page reference in `docs.json` matches the file path without extension
4. Run `mint dev` locally to verify the page loads

### Styles not rendering
1. Ensure `docs.json` has the `$schema` field for validation
2. Verify component syntax (MDX components are case-sensitive)
3. Check for unclosed JSX tags

### OpenAPI spec not generating pages
1. Verify `openapi.json` is valid OpenAPI 3.0 or 3.1 (not Swagger 2.0)
2. Validate the spec: paste into [editor.swagger.io](https://editor.swagger.io)
3. Check the `openapi` field path in `docs.json` matches the actual file location
4. Ensure the spec has `info`, `paths`, and `openapi` version fields
