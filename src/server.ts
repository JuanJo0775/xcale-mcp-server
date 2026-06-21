import Fastify, { type FastifyInstance } from 'fastify';

import { verifyHopB } from './auth/hop-b';
import { extractProviderToken } from './auth/token';
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
    await handleMcpRequest({
      registry,
      ctx: { token },
      req: request.raw,
      res: reply.raw,
      body: request.body,
    });
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
