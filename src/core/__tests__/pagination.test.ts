import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, buildPage, paginationInput } from '../pagination';

describe('paginationInput', () => {
  it('applies sane defaults', () => {
    expect(paginationInput.parse({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('rejects a pageSize over the max', () => {
    expect(paginationInput.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });

  it('rejects a non-positive page', () => {
    expect(paginationInput.safeParse({ page: 0 }).success).toBe(false);
  });
});

describe('buildPage', () => {
  it('derives hasMore from totalPages', () => {
    expect(buildPage([1, 2], 1, 2, { totalPages: 3 })).toMatchObject({
      hasMore: true,
      totalPages: 3,
    });
    expect(buildPage([1, 2], 3, 2, { totalPages: 3 })).toMatchObject({ hasMore: false });
  });

  it('derives hasMore from totalResults', () => {
    expect(buildPage([1, 2], 1, 2, { totalResults: 5 })).toMatchObject({
      hasMore: true,
      totalResults: 5,
    });
  });

  it('omits hasMore when it cannot be determined', () => {
    expect(buildPage([1], 1, 25)).not.toHaveProperty('hasMore');
  });
});
