/**
 * @fileMetadata
 * @purpose "Pagination utilities for database queries"
 * @dependencies []
 * @owner core-team
 * @status stable
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Cursor pagination metadata
 */
export interface CursorPaginationMeta {
  limit: number
  hasMore: boolean
  nextCursor?: string
  previousCursor?: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Cursor paginated response
 */
export interface CursorPaginatedResponse<T> {
  data: T[]
  meta: CursorPaginationMeta
}

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100
} as const

/**
 * Calculate offset for pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(params?: PaginationParams): {
  page: number
  limit: number
  offset: number
} {
  const page = Math.max(1, params?.page || PAGINATION_DEFAULTS.page)
  const limit = Math.min(
    PAGINATION_DEFAULTS.maxLimit,
    Math.max(1, params?.limit || PAGINATION_DEFAULTS.limit)
  )
  const offset = calculateOffset(page, limit)
  
  return { page, limit, offset }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  }
}

/**
 * Create cursor from record
 */
export function createCursor<T extends { id: string | number }>(
  record: T
): string {
  return Buffer.from(JSON.stringify({ id: record.id })).toString('base64')
}

/**
 * Parse cursor
 */
export function parseCursor(cursor: string): { id: string | number } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Create cursor pagination metadata
 */
export function createCursorPaginationMeta<T extends { id: string | number }>(
  data: T[],
  limit: number,
  hasMore: boolean
): CursorPaginationMeta {
  return {
    limit,
    hasMore,
    nextCursor: hasMore && data.length > 0 
      ? createCursor(data[data.length - 1]) 
      : undefined,
    previousCursor: data.length > 0 
      ? createCursor(data[0]) 
      : undefined
  }
}

/**
 * Apply pagination to array
 */
export function paginateArray<T>(
  array: T[],
  params?: PaginationParams
): PaginatedResponse<T> {
  const { page, limit, offset } = normalizePaginationParams(params)
  const paginatedData = array.slice(offset, offset + limit)
  const meta = createPaginationMeta(page, limit, array.length)
  
  return {
    data: paginatedData,
    meta
  }
}

/**
 * Build SQL pagination clause
 */
export function buildPaginationClause(params?: PaginationParams): {
  limit: number
  offset: number
  sql: string
} {
  const { limit, offset } = normalizePaginationParams(params)
  return {
    limit,
    offset,
    sql: `LIMIT ${limit} OFFSET ${offset}`
  }
}

/**
 * Build cursor pagination clause
 */
export function buildCursorPaginationClause(
  cursor?: string,
  limit = PAGINATION_DEFAULTS.limit,
  direction: 'forward' | 'backward' = 'forward'
): {
  limit: number
  whereClause?: string
  orderBy: string
} {
  const normalizedLimit = Math.min(limit, PAGINATION_DEFAULTS.maxLimit)
  
  if (!cursor) {
    return {
      limit: normalizedLimit,
      orderBy: direction === 'forward' ? 'ORDER BY id ASC' : 'ORDER BY id DESC'
    }
  }
  
  const parsed = parseCursor(cursor)
  if (!parsed) {
    return {
      limit: normalizedLimit,
      orderBy: direction === 'forward' ? 'ORDER BY id ASC' : 'ORDER BY id DESC'
    }
  }
  
  return {
    limit: normalizedLimit,
    whereClause: direction === 'forward' 
      ? `id > '${parsed.id}'` 
      : `id < '${parsed.id}'`,
    orderBy: direction === 'forward' ? 'ORDER BY id ASC' : 'ORDER BY id DESC'
  }
}