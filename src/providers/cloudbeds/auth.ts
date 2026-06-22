import type { ProviderAuthDescriptor } from '../../core/provider-port';

/**
 * Non-secret OAuth2 blueprint published via the catalog. Rail A (the consumer) runs the flow with
 * its own clientId/secret (Doppler) — those NEVER appear here.
 * Scope strings are representative for the read-first pilot; confirm exact per-endpoint scopes
 * against the live Cloudbeds docs during connection setup.
 */
export const cloudbedsAuth: ProviderAuthDescriptor = {
  type: 'oauth2',
  authorizationUrl: 'https://hotels.cloudbeds.com/api/v1.2/oauth',
  tokenUrl: 'https://hotels.cloudbeds.com/api/v1.2/access_token',
  scopes: ['read:reservation', 'read:guest', 'read:room', 'read:hotel', 'read:rate'],
  tokenPlacement: 'bearer_header',
  supportsRefresh: true,
};
