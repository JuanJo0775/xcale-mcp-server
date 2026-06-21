import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/**
 * The uniform pagination args every list tool merges into its input (ADR: canonical-provider-pattern).
 * Sane defaults + a capped max so a consumer can't request an abusive page size.
 */
export const paginationInput = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationInput = z.infer<typeof paginationInput>;

/** The uniform list envelope returned by every list tool, regardless of the underlying API. */
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages?: number;
  readonly totalResults?: number;
  readonly hasMore?: boolean;
}

/**
 * Build the uniform envelope. `hasMore` is derived only when the provider gives enough info
 * (totalPages or totalResults); otherwise it is omitted, never inferred (documented per tool).
 */
export function buildPage<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
  meta: { totalPages?: number; totalResults?: number } = {},
): PaginatedResult<T> {
  const hasMore =
    meta.totalPages !== undefined
      ? page < meta.totalPages
      : meta.totalResults !== undefined
        ? page * pageSize < meta.totalResults
        : undefined;
  return {
    items,
    page,
    pageSize,
    ...(meta.totalPages !== undefined ? { totalPages: meta.totalPages } : {}),
    ...(meta.totalResults !== undefined ? { totalResults: meta.totalResults } : {}),
    ...(hasMore !== undefined ? { hasMore } : {}),
  };
}
