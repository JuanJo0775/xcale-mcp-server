# API Reference Integration

## Table of Contents
- [Overview](#overview)
- [Exporting the OpenAPI Spec from Fastify](#exporting-the-openapi-spec-from-fastify)
- [Swagger 2.0 vs OpenAPI 3.x](#swagger-20-vs-openapi-3x)
- [Configuring Auto-Populated API Pages](#configuring-auto-populated-api-pages)
- [Manual API Pages with MDX](#manual-api-pages-with-mdx)
- [API Playground](#api-playground)
- [Keeping the Spec Updated](#keeping-the-spec-updated)

## Overview

Mintlify can auto-generate interactive API documentation from an OpenAPI (3.0/3.1) specification file. For Fastify projects using `@fastify/swagger`, the spec is generated dynamically from route schemas.

**Workflow:**
1. Export the Swagger/OpenAPI spec from your running server
2. Save it to `mintlify/api-reference/openapi.json`
3. Reference it in `docs.json` — Mintlify generates all endpoint pages automatically

## Exporting the OpenAPI Spec from Fastify

### Option A: curl from running server (quickest)

If `@fastify/swagger` is registered, the spec is served at the swagger route:

```bash
# Swagger 2.0 format (your current config)
curl http://localhost:3001/documentation/json > mintlify/api-reference/openapi.json

# Pretty-printed
curl http://localhost:3001/documentation/json | python3 -m json.tool > mintlify/api-reference/openapi.json
```

### Option B: Programmatic export script

Create a script that boots the server, exports the spec, and exits:

```typescript
// scripts/export-openapi.ts
import { buildServer } from '../src/main';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function exportSpec() {
  const server = await buildServer();
  await server.ready();
  
  const spec = server.swagger();
  const outputPath = resolve(__dirname, '../mintlify/api-reference/openapi.json');
  
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI spec exported to ${outputPath}`);
  
  await server.close();
  process.exit(0);
}

exportSpec().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "export:openapi": "doppler run -- ts-node-dev -r tsconfig-paths/register scripts/export-openapi.ts"
  }
}
```

## Swagger 2.0 vs OpenAPI 3.x

**Important**: Your Fastify server uses the `swagger` config key (Swagger 2.0), but Mintlify supports OpenAPI 3.0 and 3.1.

### Check which format you have

Look at your `@fastify/swagger` registration in `main.ts`:

```typescript
// Swagger 2.0 (your current setup — uses "swagger" key)
await server.register(swagger, {
  swagger: {
    info: { title: 'XCALE Backend API', version: '1.0.0' },
    // ...
  }
});

// OpenAPI 3.0 (recommended — uses "openapi" key)
await server.register(swagger, {
  openapi: {
    info: { title: 'XCALE Backend API', version: '1.0.0' },
    // ...
  }
});
```

### Upgrade to OpenAPI 3.x (recommended)

Change your swagger registration from `swagger:` to `openapi:`:

```typescript
await server.register(swagger, {
  openapi: {
    info: {
      title: 'XCALE Backend API',
      description: 'Clean Architecture Fastify API with MongoDB and JWT Authentication',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.xcale.app', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});
```

### Alternative: Convert with a tool

If you prefer not to change the server config, convert the exported JSON:

```bash
# Install converter
npm i -g swagger2openapi

# Convert
swagger2openapi mintlify/api-reference/openapi.json -o mintlify/api-reference/openapi.json
```

## Configuring Auto-Populated API Pages

The simplest approach — Mintlify generates one page per endpoint:

```json
{
  "navigation": {
    "tabs": [
      {
        "tab": "API Reference",
        "openapi": "api-reference/openapi.json"
      }
    ]
  }
}
```

### With grouped sections

For more control, mix OpenAPI auto-generation with manual groups:

```json
{
  "navigation": {
    "tabs": [
      {
        "tab": "API Reference",
        "groups": [
          {
            "group": "Overview",
            "pages": ["api-reference/introduction"]
          },
          {
            "group": "Users",
            "openapi": "api-reference/openapi.json",
            "filter": { "tag": "users" }
          },
          {
            "group": "Billing",
            "openapi": "api-reference/openapi.json",
            "filter": { "tag": "billing" }
          }
        ]
      }
    ]
  }
}
```

To use filtered groups, your OpenAPI spec needs **tags** on each operation:
```json
{
  "paths": {
    "/api/users": {
      "get": {
        "tags": ["users"],
        "summary": "List all users"
      }
    }
  }
}
```

In Fastify routes, add tags via the schema:
```typescript
server.get('/api/users', {
  schema: {
    tags: ['users'],
    summary: 'List all users',
    description: 'Returns a paginated list of all users.',
    // ... response, querystring schemas
  }
}, handler);
```

### Hiding endpoints

Add `x-hidden: true` in your OpenAPI spec to exclude specific endpoints:
```json
{
  "/api/internal/debug": {
    "get": {
      "x-hidden": true,
      "summary": "Internal debug endpoint"
    }
  }
}
```

## Manual API Pages with MDX

For custom API documentation that goes beyond auto-generation:

```mdx
---
title: "Create User"
api: "POST /api/users"
description: "Creates a new user account"
---

<ParamField body="email" type="string" required>
  User's email address. Must be unique.
</ParamField>

<ParamField body="password" type="string" required>
  Minimum 8 characters with at least one uppercase letter.
</ParamField>

<ParamField body="roles" type="string[]" default='["user"]'>
  Array of role identifiers.
</ParamField>
```

## API Playground

When using OpenAPI specs, Mintlify automatically creates an interactive playground where users can:
- Fill in parameters
- Set authentication headers
- Execute requests against your API
- View formatted responses

**Configuration** in `docs.json`:
```json
{
  "api": {
    "playground": {
      "mode": "simple"
    },
    "baseUrl": "https://api.xcale.app"
  }
}
```

## Keeping the Spec Updated

### Manual workflow
1. Make API changes in code
2. Run `npm run export:openapi`
3. Commit the updated `openapi.json` along with the code changes
4. Push → Mintlify auto-deploys

### CI/CD automation (optional)
Add a GitHub Action step that exports the spec on every push:

```yaml
# .github/workflows/update-docs.yml
name: Update API Docs
on:
  push:
    branches: [main]
    paths: ['src/modules/**/routes.ts']

jobs:
  update-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run export:openapi
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'docs: update OpenAPI spec'
          file_pattern: 'mintlify/api-reference/openapi.json'
```
