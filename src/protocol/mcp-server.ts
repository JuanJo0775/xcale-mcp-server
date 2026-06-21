import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { ProviderErrorCode } from '../core/errors';
import type { ProviderRegistry } from '../core/registry';
import type { ProviderCallContext } from '../core/types';
import { toMcpResult } from './result-mapping';

/**
 * Build a per-request MCP Server bound to the registry and this call's context (the forwarded
 * token). Stateless: one Server per request, so the handlers close over the request's credential
 * without any shared/persistent state. This is the ONLY place that imports the MCP SDK + the core.
 */
export function createMcpServer(registry: ProviderRegistry, ctx: ProviderCallContext): Server {
  const server = new Server(
    { name: 'xcale-mcp-server', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  // Pillar: tools/list — flat list across all providers (namespaced mcp_{slug}_{verb}).
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = registry.providers.flatMap((provider) =>
      provider.listTools().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Tool['inputSchema'],
      })),
    );
    return { tools };
  });

  // Pillar: tools/call — route by tool name, execute via the provider, map the result.
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const provider = registry.getProviderByTool(name);
    if (provider === undefined) {
      return toMcpResult({
        kind: 'error',
        code: ProviderErrorCode.UNKNOWN_TOOL,
        toolName: name,
        providerSlug: 'unknown',
        message: `Unknown tool: ${name}`,
      });
    }
    const result = await provider.callTool(name, args ?? {}, ctx);
    return toMcpResult(result);
  });

  return server;
}
