/**
 * @fileMetadata
 * @purpose Base error class and error code definitions
 * @owner core-team
 * @dependencies []
 * @exports ["AppError", "ErrorCode", "isAppError"]
 * @complexity low
 * @tags ["error", "base", "types"]
 * @status active
 */

export type ErrorCode = 
  // Authentication errors
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_EXISTS'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_INVALID_RESPONSE'
  | 'AUTH_UNKNOWN_ERROR'
  | 'AUTH_CONSENT_REQUIRED'
  | 'AUTH_CONSENT_INVALID'
  | 'AUTH_AGE_REQUIRED'
  
  // Validation errors
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD'
  
  // API errors
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  
  // Database errors
  | 'DB_CONNECTION_ERROR'
  | 'DB_QUERY_ERROR'
  | 'DB_CONSTRAINT_ERROR'
  
  // Business logic errors
  | 'BUSINESS_RULE_VIOLATION'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  
  // System errors
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  timestamp?: Date
  [key: string]: unknown
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly context?: ErrorContext
  public readonly originalError?: Error
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: ErrorCode,
    originalError?: Error,
    context?: ErrorContext,
    isOperational = true
  ) {
    super(message)
    
    this.name = 'AppError'
    this.code = code
    this.originalError = originalError
    this.context = context
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      timestamp: new Date().toISOString()
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}