import { describe, expect, it } from 'vitest';

import { PROVIDERS } from '../../providers';
import { buildCatalog } from '../catalog';
import { createRegistry } from '../registry';

describe('buildCatalog', () => {
  const catalog = buildCatalog(createRegistry(PROVIDERS));

  it('lists every registered provider with discovery metadata', () => {
    expect(catalog.length).toBe(PROVIDERS.length);
    const echo = catalog.find((e) => e.slug === 'echo');
    expect(echo).toBeDefined();
    expect(echo?.authDescriptor.type).toBe('api_key');
    expect(echo?.toolCount).toBeGreaterThan(0);
    expect(echo?.providerVersion).toBe('0.1.0');
    expect(echo?.schemaVersion.length).toBeGreaterThan(0);
  });

  it('carries no secrets and no consumer-specific concepts', () => {
    const json = JSON.stringify(catalog);
    expect(json).not.toMatch(/clientSecret|client_secret|password|tenant|\bplan\b/i);
  });
});
