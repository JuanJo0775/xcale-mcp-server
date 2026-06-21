/**
 * Closed set of provider error codes (ADR: typed-tool-result-error-contract).
 * Evolves ADDITIVELY only — never rename or repurpose an existing code without a version bump.
 * The canonical list also lives in CONTEXT.md.
 */
export const ProviderErrorCode = {
  AUTH_EXPIRED: 'PROVIDER_AUTH_EXPIRED',
  RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  INVALID_INPUT: 'PROVIDER_INVALID_INPUT',
  UNKNOWN_TOOL: 'PROVIDER_UNKNOWN_TOOL',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
} as const;

export type ProviderErrorCode = (typeof ProviderErrorCode)[keyof typeof ProviderErrorCode];

/** Exhaustiveness guard — makes a missing `switch` case a compile error. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`);
}
