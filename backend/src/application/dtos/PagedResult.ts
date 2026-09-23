export interface PagedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function createPagedResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalCount: number
): PagedResult<T> {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items,
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}