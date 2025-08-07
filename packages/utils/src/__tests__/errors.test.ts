/**
 * @fileMetadata
 * @purpose "Tests for error handling utility functions"
 * @owner test-team
 * @dependencies ["vitest"]
 * @exports []
 * @complexity high
 * @tags ["test", "error-handling", "utilities"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:18:00Z
 */

import { describe, it, expect } from 'vitest'
import {
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  isBaseError,
  hasErrorCode,
  errorResult,
  successResult,
  handleAsync,
  serializeError,
  toError
} from '../errors'

describe('Error Utilities', () => {
  describe('BaseError', () => {
    it('should create error with all properties', () => {
      const error = new AuthError('Test message', 'TEST_CODE', { userId: '123' })

      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.statusCode).toBe(401)
      expect(error.context).toEqual({ userId: '123' })
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should serialize to JSON correctly', () => {
      const error = new AuthError('Test message', 'TEST_CODE')
      const json = error.toJSON()

      expect(json).toMatchObject({
        name: 'AuthError',
        message: 'Test message',
        code: 'TEST_CODE',
        statusCode: 401,
        timestamp: expect.any(Date)
      })
    })
  })

  describe('Specific Error Types', () => {
    it('should create AuthError with correct defaults', () => {
      const error = new AuthError('Authentication failed')

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTH_ERROR')
    })

    it('should create ValidationError with field errors', () => {
      const fieldErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ]
      const error = new ValidationError('Validation failed', fieldErrors)

      expect(error.statusCode).toBe(400)
      expect(error.errors).toEqual(fieldErrors)
    })

    it('should create NotFoundError with resource info', () => {
      const error = new NotFoundError('User', '123')

      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('User with identifier 123 not found')
    })

    it('should create PermissionError with correct status', () => {
      const error = new PermissionError('Access denied')

      expect(error.statusCode).toBe(403)
    })

    it('should create RateLimitError with retry info', () => {
      const error = new RateLimitError(60)

      expect(error.statusCode).toBe(429)
      expect(error.retryAfter).toBe(60)
      expect(error.message).toBe('Rate limit exceeded')
    })

    it('should create DatabaseError with original error', () => {
      const originalError = new Error('Connection failed')
      const error = new DatabaseError('Database operation failed', originalError)

      expect(error.statusCode).toBe(500)
      expect(error.context).toEqual({ originalError })
    })

    it('should create ExternalServiceError with service name', () => {
      const error = new ExternalServiceError('OpenAI', 'API timeout')

      expect(error.statusCode).toBe(502)
      expect(error.message).toBe('API timeout')
      expect(error.context).toEqual({ service: 'OpenAI', originalError: undefined })
    })
  })

  describe('Type Guards', () => {
    it('should identify BaseError instances', () => {
      const baseError = new AuthError('Test')
      const regularError = new Error('Test')
      const notError = { message: 'Test' }

      expect(isBaseError(baseError)).toBe(true)
      expect(isBaseError(regularError)).toBe(false)
      expect(isBaseError(notError)).toBe(false)
      expect(isBaseError(null)).toBe(false)
    })

    it('should identify objects with error codes', () => {
      const withCode = { code: 'TEST_CODE' }
      const withoutCode = { message: 'Test' }
      const authError = new AuthError('Test')

      expect(hasErrorCode(withCode)).toBe(true)
      expect(hasErrorCode(withoutCode)).toBe(false)
      expect(hasErrorCode(authError)).toBe(true)
      expect(hasErrorCode(null)).toBe(false)
    })
  })

  describe('Result Helpers', () => {
    it('should create error result from BaseError', () => {
      const error = new AuthError('Test message', 'TEST_CODE')
      const result = errorResult(error)

      expect(result.success).toBe(false)
      expect(result.error).toMatchObject({
        message: 'Test message',
        code: 'TEST_CODE',
        statusCode: 401
      })
    })

    it('should create error result from regular Error', () => {
      const error = new Error('Regular error')
      const result = errorResult(error)

      expect(result.success).toBe(false)
      expect(result.error.message).toBe('Regular error')
      expect(result.error.code).toBe('UNKNOWN_ERROR')
    })

    it('should create error result from unknown value', () => {
      const result = errorResult('String error')

      expect(result.success).toBe(false)
      expect(result.error.message).toBe('An unknown error occurred')
    })

    it('should create success result', () => {
      const data = { id: '123', name: 'Test' }
      const result = successResult(data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })
  })

  describe('handleAsync', () => {
    it('should handle successful async operations', async () => {
      const asyncFn = async () => 'success'
      const result = await handleAsync(asyncFn)

      expect(result.success).toBe(true)
      expect((result as any).data).toBe('success')
    })

    it('should handle async errors', async () => {
      const asyncFn = async () => {
        throw new AuthError('Async error')
      }
      const result = await handleAsync(asyncFn)

      expect(result.success).toBe(false)
      expect((result as any).error.message).toBe('Async error')
    })

    it('should handle rejected promises', async () => {
      const asyncFn = async () => {
        throw new Error('Promise rejected')
      }
      const result = await handleAsync(asyncFn)

      expect(result.success).toBe(false)
      expect((result as any).error.message).toBe('Promise rejected')
    })
  })

  describe('serializeError', () => {
    it('should serialize BaseError correctly', () => {
      const error = new AuthError('Test', 'TEST_CODE', { userId: '123' })
      const serialized = serializeError(error)

      expect(serialized).toMatchObject({
        name: 'AuthError',
        message: 'Test',
        code: 'TEST_CODE',
        statusCode: 401,
        context: { userId: '123' }
      })
    })

    it('should serialize regular Error', () => {
      const error = new Error('Regular error')
      error.stack = 'Error stack trace'
      const serialized = serializeError(error)

      expect(serialized).toMatchObject({
        name: 'Error',
        message: 'Regular error',
        stack: 'Error stack trace'
      })
    })

    it('should serialize non-error values', () => {
      expect(serializeError('string error')).toEqual({
        error: 'string error'
      })

      expect(serializeError({ custom: 'error' })).toEqual({
        custom: 'error'
      })

      expect(serializeError(null)).toEqual({
        error: 'null'
      })
    })
  })

  describe('toError', () => {
    it('should return Error objects unchanged', () => {
      const error = new Error('Test error')
      expect(toError(error)).toBe(error)
    })

    it('should convert BaseError to Error', () => {
      const authError = new AuthError('Auth failed')
      const converted = toError(authError)

      expect(converted).toBeInstanceOf(Error)
      expect(converted.message).toBe('Auth failed')
    })

    it('should convert strings to Error', () => {
      const error = toError('String error')

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('String error')
    })

    it('should convert objects to Error', () => {
      const error = toError({ message: 'Object error', code: 'TEST' })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Object error')
    })

    it('should handle null and undefined', () => {
      expect(toError(null).message).toBe('null')
      expect(toError(undefined).message).toBe('undefined')
    })

    it('should handle numbers and other primitives', () => {
      expect(toError(404).message).toBe('404')
      expect(toError(true).message).toBe('true')
    })
  })
})
