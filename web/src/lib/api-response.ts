// src/lib/api-response.ts
// Standardized API response utilities

import { NextResponse } from 'next/server'

/**
 * Standard error codes for consistent error handling
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * HTTP status code mapping
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
}

/**
 * Success response
 *
 * @param data - Response data
 * @param options - Optional status code and message
 * @returns Next.js Response
 *
 * @example
 * return successResponse({ user: userData })
 * return successResponse({ novel: novelData }, { status: 201, message: 'Novel created' })
 */
export function successResponse<T = any>(
  data: T,
  options: {
    status?: number
    message?: string
  } = {}
): NextResponse {
  const { status = 200, message } = options

  const response: any = {
    success: true,
    data,
  }

  if (message) {
    response.message = message
  }

  return NextResponse.json(response, { status })
}

/**
 * Error response with standardized format
 *
 * @param error - Error message or Error object
 * @param code - Error code for categorization
 * @param details - Additional error details (e.g., validation errors)
 * @returns Next.js Response
 *
 * @example
 * return errorResponse('User not found', ErrorCode.NOT_FOUND)
 * return errorResponse('Validation failed', ErrorCode.VALIDATION_ERROR, { fields: ['email', 'password'] })
 */
export function errorResponse(
  error: string | Error,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: any
): NextResponse {
  const message = error instanceof Error ? error.message : error
  const status = ERROR_STATUS_MAP[code] || 500

  const response: any = {
    success: false,
    error: message,
    code,
  }

  if (details) {
    response.details = details
  }

  // Log server errors
  if (status >= 500) {
    console.error(`[API Error] ${code}:`, message, details || '')
  }

  return NextResponse.json(response, { status })
}

/**
 * Validation error response (convenience wrapper)
 *
 * @param message - Error message
 * @param details - Validation error details
 * @returns Next.js Response
 *
 * @example
 * return validationErrorResponse('Invalid input', { email: 'Email is required' })
 */
export function validationErrorResponse(
  message: string,
  details?: Record<string, string>
): NextResponse {
  return errorResponse(message, ErrorCode.VALIDATION_ERROR, details)
}

/**
 * Not found error response (convenience wrapper)
 *
 * @param resource - Resource that was not found
 * @returns Next.js Response
 *
 * @example
 * return notFoundResponse('Novel')
 * // Returns: { success: false, error: 'Novel not found', code: 'NOT_FOUND' }
 */
export function notFoundResponse(resource: string): NextResponse {
  return errorResponse(`${resource} not found`, ErrorCode.NOT_FOUND)
}

/**
 * Unauthorized error response (convenience wrapper)
 *
 * @param message - Optional custom message
 * @returns Next.js Response
 *
 * @example
 * return unauthorizedResponse()
 * return unauthorizedResponse('Invalid token')
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return errorResponse(message, ErrorCode.UNAUTHORIZED)
}

/**
 * Catch-all error handler for try-catch blocks
 *
 * @param error - Caught error
 * @param context - Optional context for logging
 * @returns Next.js Response
 *
 * @example
 * try {
 *   // ... your code
 * } catch (error) {
 *   return handleApiError(error, 'Failed to create novel')
 * }
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse {
  if (context) {
    console.error(`[API Error] ${context}:`, error)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, ErrorCode.INTERNAL_ERROR)
  }

  return errorResponse(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR
  )
}
