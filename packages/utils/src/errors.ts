/**
 * @fileMetadata
 * @purpose "Centralized error handling utilities"
 * @dependencies []
 * @owner core-team
 * @status stable
 */

/**
 * Base error class for all application errors
 */
export abstract class BaseError extends Error {
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    }
  }
}

/**
 * Authentication error
 */
export class AuthError extends BaseError {
  constructor(message: string, code = 'AUTH_ERROR', context?: Record<string, unknown>) {
    super(message, code, 401, context)
  }
}

/**
 * Validation error
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, context)
  }
}

/**
 * Not found error
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404, { resource, identifier })
  }
}

/**
 * Permission denied error
 */
export class PermissionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PERMISSION_DENIED', 403, context)
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends BaseError {
  constructor(
    public readonly retryAfter: number,
    context?: Record<string, unknown>
  ) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, context)
  }
}

/**
 * Database error
 */
export class DatabaseError extends BaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', 500, { originalError })
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string,
    originalError?: unknown
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, { service, originalError })
  }
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError
}

/**
 * Type guard to check if error has a code property
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  )
}

/**
 * Error result type for consistent error handling
 */
export type ErrorResult<T = unknown> = {
  success: false
  error: {
    message: string
    code: string
    statusCode?: number
    details?: T
  }
}

/**
 * Success result type
 */
export type SuccessResult<T> = {
  success: true
  data: T
}

/**
 * Combined result type
 */
export type Result<T, E = unknown> = SuccessResult<T> | ErrorResult<E>

/**
 * Helper to create error result
 */
export function errorResult<T = unknown>(
  error: BaseError | Error | unknown
): ErrorResult<T> {
  if (isBaseError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.context as T
      }
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      }
    }
  }

  return {
    success: false,
    error: {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    }
  }
}

/**
 * Helper to create success result
 */
export function successResult<T>(data: T): SuccessResult<T> {
  return {
    success: true,
    data
  }
}

/**
 * Async error handler wrapper
 */
export async function handleAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn()
    return successResult(data)
  } catch (error) {
    return errorResult(error)
  }
}

/**
 * Error serializer for logging
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (isBaseError(error)) {
    return error.toJSON()
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }

  if (typeof error === 'object' && error !== null) {
    return { ...error }
  }

  return { error: String(error) }
}

/**
 * Convert unknown value to Error object
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  if (typeof error === 'object' && error !== null) {
    // Handle objects with message property
    if ('message' in error && typeof (error as any).message === 'string') {
      const err = new Error((error as any).message)
      // Copy stack if available
      if ('stack' in error && typeof (error as any).stack === 'string') {
        err.stack = (error as any).stack
      }
      // Copy name if available
      if ('name' in error && typeof (error as any).name === 'string') {
        err.name = (error as any).name
      }
      return err
    }

    // Fallback: stringify the object
    return new Error(JSON.stringify(error))
  }

  // Fallback for all other types
  return new Error(String(error))
}
