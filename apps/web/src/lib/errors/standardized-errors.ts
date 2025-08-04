/**
 * Standardized Error Handling for ClaimGuardian
 * Provides consistent error patterns across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field })
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

// Standardized error response format
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
  }
}

export function createErrorResponse(error: Error): ErrorResponse {
  const isAppError = error instanceof AppError
  
  return {
    error: {
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      message: error.message,
      details: isAppError ? error.context : undefined,
      timestamp: new Date().toISOString()
    }
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): Response {
  const appError = error instanceof AppError ? error : new AppError(
    'Internal server error',
    'INTERNAL_ERROR',
    500
  )
  
  return Response.json(
    createErrorResponse(appError),
    { status: appError.statusCode }
  )
}
