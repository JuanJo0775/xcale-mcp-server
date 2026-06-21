import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { ToolResult } from '../core/types';

/**
 * The anti-corruption mapping (lives only in src/protocol/): our domain ToolResult → the MCP wire
 * shape. A provider auth failure is a tool-execution error (`isError: true`) carrying a typed,
 * machine-readable `code` in `structuredContent` — never a JSON-RPC protocol error.
 */
export function toMcpResult(result: ToolResult): CallToolResult {
  if (result.kind === 'success') {
    return {
      content: [{ type: 'text', text: result.message ?? `Executed ${result.toolName}.` }],
      structuredContent: { ok: true, data: result.data },
      isError: false,
    };
  }
  return {
    content: [{ type: 'text', text: result.message }],
    structuredContent: {
      ok: false,
      code: result.code,
      providerSlug: result.providerSlug,
      toolName: result.toolName,
    },
    isError: true,
  };
}
