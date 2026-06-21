const REDACTED = '[REDACTED]';

/**
 * Branded wrapper for a forwarded provider credential (Hop A).
 *
 * The mechanical enforcement of "Credential-in-Transit-Only" (see
 * docs/security/credential-boundary-review.md): the raw value is unreachable via serialization,
 * logging, or string coercion — `reveal()` is the only way out, and it must be called ONLY at the
 * provider egress, inside `src/providers/**`.
 */
export class SecretString {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  /** The ONLY accessor for the raw credential. Call at provider egress only. */
  reveal(): string {
    return this.#value;
  }

  /** True when no credential was forwarded (e.g. provider needs none, or it's missing). */
  isEmpty(): boolean {
    return this.#value.length === 0;
  }

  toString(): string {
    return REDACTED;
  }

  toJSON(): string {
    return REDACTED;
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return REDACTED;
  }
}
