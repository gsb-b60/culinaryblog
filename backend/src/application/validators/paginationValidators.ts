import { z } from 'zod';

// HTTP query parameters are strings. Reject empty strings, arrays and objects.
const positiveQueryInteger = (maximum = Number.MAX_SAFE_INTEGER) => z.preprocess(
  value => typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  z.number().int().positive().max(maximum),
);

/** Shared offset-pagination contract for every list endpoint. */
export function createPaginationSchema(defaultPageSize = 12) {
  return z.object({
    page: positiveQueryInteger().default(1),
    pageSize: positiveQueryInteger(50).default(defaultPageSize),
  });
}

export const paginationSchema = createPaginationSchema();
export type PaginationInput = z.infer<typeof paginationSchema>;
