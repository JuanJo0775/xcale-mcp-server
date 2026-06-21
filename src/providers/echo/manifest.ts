import type { ProviderManifest } from '../../core/provider-port';

export const SLUG = 'echo';

export const echoManifest: ProviderManifest = {
  slug: SLUG,
  displayName: 'Echo (stub)',
  category: 'utility',
  schemaVersion: '2026-06-19',
  providerVersion: '0.1.0',
};
