import { SecretString } from '../core/secret-string';

/**
 * Hop A — extract the forwarded provider credential from the request header into a SecretString.
 * Never logged or persisted. A missing header yields an empty SecretString (adapters treat that
 * as "no credential" and return PROVIDER_AUTH_EXPIRED where they require one).
 */
export function extractProviderToken(headerValue: string | undefined): SecretString {
  return new SecretString(headerValue ?? '');
}
