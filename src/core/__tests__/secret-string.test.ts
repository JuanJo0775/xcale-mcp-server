import { inspect } from 'node:util';

import { describe, expect, it } from 'vitest';

import { SecretString } from '../secret-string';

describe('SecretString', () => {
  const secret = new SecretString('super-secret-token');

  it('exposes the raw value only via reveal()', () => {
    expect(secret.reveal()).toBe('super-secret-token');
  });

  it('redacts on string coercion', () => {
    expect(String(secret)).toBe('[REDACTED]');
    expect(`${secret}`).toBe('[REDACTED]');
  });

  it('redacts on JSON.stringify, including when nested', () => {
    expect(JSON.stringify(secret)).toBe('"[REDACTED]"');
    expect(JSON.stringify({ token: secret })).toBe('{"token":"[REDACTED]"}');
  });

  it('redacts on util.inspect (what structured loggers serialize with)', () => {
    expect(inspect(secret)).toContain('[REDACTED]');
    expect(inspect({ token: secret })).not.toContain('super-secret');
  });

  it('reports emptiness', () => {
    expect(new SecretString('').isEmpty()).toBe(true);
    expect(secret.isEmpty()).toBe(false);
  });
});
