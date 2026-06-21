import { describe, expect, it } from 'vitest';

import { verifyHopB } from '../hop-b';

describe('verifyHopB', () => {
  it('accepts the correct Bearer secret', () => {
    expect(verifyHopB('Bearer s3cret-value', 's3cret-value')).toBe(true);
  });

  it('rejects a wrong secret', () => {
    expect(verifyHopB('Bearer wrong-value', 's3cret-value')).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(verifyHopB(undefined, 's3cret-value')).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    expect(verifyHopB('Bearer anything', '')).toBe(false);
  });

  it('rejects a non-Bearer scheme', () => {
    expect(verifyHopB('Basic s3cret-value', 's3cret-value')).toBe(false);
  });
});
