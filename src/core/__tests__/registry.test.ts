import { describe, expect, it } from 'vitest';

import type { IProvider } from '../provider-port';
import { createRegistry } from '../registry';
import { toolSuccess } from '../types';

function fakeProvider(slug: string, toolNames: readonly string[]): IProvider {
  return {
    manifest: {
      slug,
      displayName: slug,
      category: 'test',
      schemaVersion: '1',
      providerVersion: '0.1.0',
    },
    auth: { type: 'api_key', fields: [{ key: 'k', label: 'K', placement: 'header' }] },
    listTools: () =>
      toolNames.map((name) => ({ name, description: name, inputSchema: { type: 'object' } })),
    callTool: async (toolName) => toolSuccess({ toolName, providerSlug: slug, data: null }),
  };
}

describe('createRegistry', () => {
  it('indexes providers by slug and by tool name', () => {
    const reg = createRegistry([fakeProvider('a', ['mcp_a_x']), fakeProvider('b', ['mcp_b_y'])]);
    expect(reg.getProvider('a')?.manifest.slug).toBe('a');
    expect(reg.getProviderByTool('mcp_b_y')?.manifest.slug).toBe('b');
    expect(reg.hasTool('mcp_a_x')).toBe(true);
    expect(reg.hasTool('missing')).toBe(false);
    expect(reg.getProvider('missing')).toBeUndefined();
  });

  it('rejects duplicate provider slugs', () => {
    expect(() =>
      createRegistry([fakeProvider('a', ['mcp_a_x']), fakeProvider('a', ['mcp_a_z'])]),
    ).toThrow(/Duplicate provider slug/);
  });

  it('rejects duplicate tool names across providers', () => {
    expect(() => createRegistry([fakeProvider('a', ['dup']), fakeProvider('b', ['dup'])])).toThrow(
      /Duplicate tool name/,
    );
  });
});
