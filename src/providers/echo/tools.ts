import type { McpToolDefinition } from '../../core/types';
import { SLUG } from './manifest';

export const TOOL_SAY = `mcp_${SLUG}_say`;
export const TOOL_AUTH_CHECK = `mcp_${SLUG}_auth_check`;

export const echoTools: readonly McpToolDefinition[] = [
  {
    name: TOOL_SAY,
    description: 'Echo a message back (stub tool that proves the tools/call round trip).',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Text to echo back.' } },
      required: ['message'],
      additionalProperties: false,
    },
  },
  {
    name: TOOL_AUTH_CHECK,
    description: 'Verify the forwarded credential reached the adapter (proves Hop-A wiring).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];
