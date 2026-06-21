import { timingSafeEqual } from 'node:crypto';

/**
 * Hop B — verify that a consumer (e.g. xcale-backend) is allowed to call this server.
 * Shared-secret Bearer, compared in constant time (ADR: credential-forwarding-and-token-model).
 * This is distinct from Hop A (the provider token) and is checked in exactly one place.
 */
export function verifyHopB(
  authorizationHeader: string | undefined,
  expectedSecret: string,
): boolean {
  if (expectedSecret.length === 0 || authorizationHeader === undefined) {
    return false;
  }
  const prefix = 'Bearer ';
  if (!authorizationHeader.startsWith(prefix)) {
    return false;
  }
  const provided = Buffer.from(authorizationHeader.slice(prefix.length));
  const expected = Buffer.from(expectedSecret);
  // timingSafeEqual requires equal lengths; an early length check is not a timing leak of the secret.
  if (provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(provided, expected);
}
