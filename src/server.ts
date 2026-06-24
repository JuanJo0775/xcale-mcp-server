import Fastify, { type FastifyInstance } from 'fastify';

import { verifyHopB } from './auth/hop-b';
import { extractProviderMetadata, extractProviderToken } from './auth/token';
import { type Config, loadConfig } from './config';
import { buildCatalog } from './core/catalog';
import { createRegistry } from './core/registry';
import { loggerOptions } from './logger';
import { handleMcpRequest } from './protocol/http-mcp';
import { PROVIDERS } from './providers';

export function buildApp(config: Config = loadConfig()): FastifyInstance {
  const registry = createRegistry(PROVIDERS);
  const app = Fastify({ logger: loggerOptions(config.logLevel) });

  // Public health/readiness — no auth.
  app.get('/health', async () => ({ status: 'ok' }));

  // Hop B guard for every non-health route (single isolated point).
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.split('?')[0] === '/health') {
      return;
    }
    if (!verifyHopB(request.headers.authorization, config.serverSecret)) {
      await reply.code(401).send({ error: 'unauthorized' });
    }
  });

  // Pillar: server/discover — the capability catalog. Hop B only; NEVER carries a provider token.
  app.get('/discover', async () => ({ providers: buildCatalog(registry) }));

  // Pillars: tools/list + tools/call over MCP (Streamable HTTP, stateless).
  app.post('/mcp', async (request, reply) => {
    reply.hijack();
    const rawToken = request.headers['x-provider-token'];
    const token = extractProviderToken(typeof rawToken === 'string' ? rawToken : undefined);
    const rawMeta = request.headers['x-provider-metadata'];
    const metadata = extractProviderMetadata(typeof rawMeta === 'string' ? rawMeta : undefined);
    try {
      await handleMcpRequest({
        registry,
        ctx: { token, metadata },
        req: request.raw,
        res: reply.raw,
        body: request.body,
      });
    } catch (err) {
      // After hijack(), Fastify will not respond — never leave the request hanging.
      request.log.error({ err }, 'MCP request handling failed');
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { 'content-type': 'application/json' });
        reply.raw.end(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32603, message: 'Internal error' },
          }),
        );
      } else {
        reply.raw.end();
      }
    }
  });

  return app;
}

async function start(): Promise<void> {
  const config = loadConfig();
  if (config.serverSecret.length === 0) {
    console.error('FATAL: MCP_SERVER_SECRET is not set (Hop B). Refusing to start.');
    process.exit(1);
  }
  const app = buildApp(config);

  // Graceful shutdown — DO App Platform sends SIGTERM on deploy/scale.
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto-start only when run as the entrypoint (not under tests).
if (process.env.VITEST === undefined) {
  void start();
}
