// src/lib/pagination.ts
// Pagination utilities for consistent pagination across the app

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

/**
 * Pagination response interface
 */
export interface PaginationResponse {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Parse and validate pagination parameters from URL search params
 *
 * @param searchParams - URL search params or Request URL
 * @param options - Optional configuration
 * @returns Validated pagination parameters
 *
 * @example
 * const { page, limit, offset } = parsePaginationParams(request.url)
 * // Returns: { page: 1, limit: 10, offset: 0 }
 */
export function parsePaginationParams(
  urlOrParams: string | URLSearchParams,
  options: {
    defaultLimit?: number
    maxLimit?: number
  } = {}
): PaginationParams {
  const { defaultLimit = 10, maxLimit = 50 } = options

  let searchParams: URLSearchParams

  if (typeof urlOrParams === 'string') {
    searchParams = new URL(urlOrParams).searchParams
  } else {
    searchParams = urlOrParams
  }

  let page = parseInt(searchParams.get('page') || '1')
  let limit = parseInt(searchParams.get('limit') || String(defaultLimit))

  // Validate page
  if (isNaN(page) || page < 1) {
    page = 1
  }

  // Validate limit
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit
  }
  if (limit > maxLimit) {
    limit = maxLimit
  }

  const offset = (page - 1) * limit

  return {
    page,
    limit,
    offset,
  }
}

/**
 * Create a pagination response object
 *
 * @param params - Pagination parameters used for the query
 * @param total - Total number of items
 * @returns Complete pagination metadata
 *
 * @example
 * const pagination = createPaginationResponse({ page: 1, limit: 10, offset: 0 }, 45)
 * // Returns: { page: 1, limit: 10, total: 45, totalPages: 5, hasNextPage: true, hasPreviousPage: false }
 */
export function createPaginationResponse(
  params: PaginationParams,
  total: number
): PaginationResponse {
  const totalPages = Math.ceil(total / params.limit)

  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  }
}

/**
 * Validate pagination parameters
 * Returns error message if invalid, null if valid
 *
 * @param params - Pagination parameters to validate
 * @param options - Optional configuration
 * @returns Error message or null
 */
export function validatePaginationParams(
  params: PaginationParams,
  options: {
    maxLimit?: number
  } = {}
): string | null {
  const { maxLimit = 50 } = options

  if (params.page < 1) {
    return 'Page must be greater than 0'
  }

  if (params.limit < 1) {
    return 'Limit must be greater than 0'
  }

  if (params.limit > maxLimit) {
    return `Limit cannot exceed ${maxLimit}`
  }

  return null
}
