/**
 * @fileMetadata
 * @purpose Tests for async error handling utilities with retry and circuit breaker logic
 * @owner platform-team
 * @complexity high
 * @tags ["testing", "async", "error-handling", "retry", "circuit-breaker"]
 * @status active
 */

import { mockConsole, delay } from '../../utils/test-utils'

import { AsyncErrorHandler } from '@/lib/error-handling/async-error-handler'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('AsyncErrorHandler', () => {
  let errorHandler: AsyncErrorHandler
  let console: ReturnType<typeof mockConsole>

  beforeEach(() => {
    console = mockConsole()
    errorHandler = new AsyncErrorHandler()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    console.restore()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      const result = await errorHandler.executeWithRetry(mockOperation)

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.error).toBeNull()
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success')

      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelay: 100,
      })

      // Fast-forward timers to allow retries
      jest.advanceTimersByTime(1000)

      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'))

      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 2,
        baseDelay: 100,
      })

      jest.advanceTimersByTime(1000)

      const result = await promise

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Persistent failure')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff for retry delays', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success')

      const startTime = Date.now()
      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelay: 100,
        exponential: true,
      })

      // First retry after 100ms
      jest.advanceTimersByTime(100)
      expect(mockOperation).toHaveBeenCalledTimes(2)

      // Second retry after 200ms (exponential backoff)
      jest.advanceTimersByTime(200)
      expect(mockOperation).toHaveBeenCalledTimes(3)

      await promise
    })

    it('should add jitter to retry delays', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('success')

      // Mock Math.random to return predictable jitter
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.5)

      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 2,
        baseDelay: 100,
        jitter: true,
      })

      jest.advanceTimersByTime(150) // 100ms + 50% jitter

      const result = await promise

      expect(result.success).toBe(true)
      Math.random = originalRandom
    })

    it('should respect max delay cap', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('success')

      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 2,
        baseDelay: 1000,
        exponential: true,
        maxDelay: 500, // Cap at 500ms
      })

      jest.advanceTimersByTime(500) // Should be capped at maxDelay

      const result = await promise
      expect(result.success).toBe(true)
    })

    it('should provide context in error logs', async () => {
      const { logger } = await import('@/lib/logger')
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))

      const promise = errorHandler.executeWithRetry(
        mockOperation,
        { maxAttempts: 1 },
        'test-operation'
      )

      const result = await promise

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after 1 attempts in test-operation'),
        expect.any(Object),
        expect.any(Error)
      )
    })
  })

  describe('executeWithCircuitBreaker', () => {
    it('should execute operation when circuit is closed', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      const result = await errorHandler.executeWithCircuitBreaker(
        mockOperation,
        'test-circuit'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
    })

    it('should open circuit after failure threshold', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'))

      // Execute enough failures to open the circuit
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')
      }

      // Next call should fail fast without calling operation
      const result = await errorHandler.executeWithCircuitBreaker(
        mockOperation,
        'test-circuit'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Circuit breaker is open')
      expect(mockOperation).toHaveBeenCalledTimes(5) // Not called for the last attempt
    })

    it('should transition to half-open after timeout', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'))

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')
      }

      // Wait for circuit breaker timeout
      jest.advanceTimersByTime(30000) // 30 seconds

      // Reset mock to return success
      mockOperation.mockResolvedValueOnce('service restored')

      const result = await errorHandler.executeWithCircuitBreaker(
        mockOperation,
        'test-circuit'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('service restored')
    })

    it('should close circuit after successful operation in half-open state', async () => {
      const mockOperation = jest.fn()

      // Open circuit
      mockOperation.mockRejectedValue(new Error('Service unavailable'))
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')
      }

      // Wait for timeout to half-open
      jest.advanceTimersByTime(30000)

      // Succeed in half-open state
      mockOperation.mockResolvedValueOnce('service restored')
      await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')

      // Circuit should be closed now, operation should execute normally
      mockOperation.mockResolvedValueOnce('normal operation')
      const result = await errorHandler.executeWithCircuitBreaker(
        mockOperation,
        'test-circuit'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('normal operation')
    })

    it('should maintain separate states for different circuit names', async () => {
      const mockOperation1 = jest.fn().mockRejectedValue(new Error('Service 1 down'))
      const mockOperation2 = jest.fn().mockResolvedValue('Service 2 up')

      // Open circuit 1
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation1, 'circuit-1')
      }

      // Circuit 2 should still work
      const result = await errorHandler.executeWithCircuitBreaker(
        mockOperation2,
        'circuit-2'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('Service 2 up')
    })
  })

  describe('executeWithFullResilience', () => {
    it('should combine retry logic with circuit breaker', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success')

      const promise = errorHandler.executeWithFullResilience(
        mockOperation,
        {
          circuitBreakerKey: 'test-circuit',
          retryConfig: { maxAttempts: 2, baseDelay: 100 }
        }
      )

      jest.advanceTimersByTime(200)

      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    it('should fail fast if circuit is open', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service down'))

      // Open the circuit first
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')
      }

      // Now try with retry - should fail fast
      const result = await errorHandler.executeWithFullResilience(
        mockOperation,
        {
          circuitBreakerKey: 'test-circuit',
          retryConfig: { maxAttempts: 3 }
        }
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Circuit breaker is open')
      // Should not have made additional calls due to open circuit
      expect(mockOperation).toHaveBeenCalledTimes(5)
    })
  })

  describe('Error Logging and Monitoring', () => {
    it('should log retry attempts', async () => {
      const { logger } = await import('@/lib/logger')
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success')

      const promise = errorHandler.executeWithRetry(mockOperation, {
        maxAttempts: 2,
        baseDelay: 100,
      })

      jest.advanceTimersByTime(200)
      await promise

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed on attempt'),
        expect.objectContaining({
          attempt: 1,
          maxAttempts: 2,
        })
      )
    })

    it('should log circuit breaker state changes', async () => {
      const { logger } = await import('@/lib/logger')
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service down'))

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await errorHandler.executeWithCircuitBreaker(mockOperation, 'test-circuit')
      }

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed with circuit breaker'),
        expect.objectContaining({
          breakerKey: 'test-circuit',
        })
      )
    })
  })
})