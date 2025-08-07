/**
 * @fileMetadata
 * @purpose "Async error handling utilities with retry logic and exponential backoff"
 * @dependencies ["@/lib"]
 * @owner platform-team
 * @complexity medium
 * @tags ["error-handling", "async", "retry", "resilience"]
 * @status stable
 */

import { logger } from '@/lib/logger'

export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E }

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  exponential: boolean
  jitter: boolean
  retryCondition?: (error: Error) => boolean
}

export interface TimeoutConfig {
  timeoutMs: number
  timeoutMessage?: string
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeoutMs: number
  monitoringPeriodMs: number
}

type CircuitBreakerState = 'closed' | 'open' | 'half-open'

class CircuitBreaker {
  private state: CircuitBreakerState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.config.resetTimeoutMs) {
        throw new Error('Circuit breaker is open')
      }
      this.state = 'half-open'
      this.successCount = 0
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'closed'
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open'
    }
  }

  getState(): CircuitBreakerState {
    return this.state
  }
}

export class AsyncErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreaker>()

  /**
   * Execute an async operation with automatic error handling
   */
  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<Result<T>> {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      const contextMessage = context ? ` in ${context}` : ''
      logger.error(`Operation failed${contextMessage}`, {}, error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: string
  ): Promise<Result<T>> {
    const finalConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponential: true,
      jitter: true,
      ...config
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const data = await operation()
        if (attempt > 1) {
          logger.info(`Operation succeeded on attempt ${attempt}`, { context })
        }
        return { success: true, data }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if we should retry this error
        if (finalConfig.retryCondition && !finalConfig.retryCondition(lastError)) {
          break
        }

        if (attempt < finalConfig.maxAttempts) {
          const delay = this.calculateDelay(attempt, finalConfig)
          logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delay}ms`, {
            context,
            error: lastError.message,
            attempt,
            maxAttempts: finalConfig.maxAttempts
          })

          await this.delay(delay)
        }
      }
    }

    const contextMessage = context ? ` in ${context}` : ''
    logger.error(`Operation failed after ${finalConfig.maxAttempts} attempts${contextMessage}`, {}, lastError || undefined)

    return {
      success: false,
      error: lastError || new Error('Unknown error')
    }
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    config: TimeoutConfig,
    context?: string
  ): Promise<Result<T>> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(config.timeoutMessage || `Operation timed out after ${config.timeoutMs}ms`))
      }, config.timeoutMs)
    })

    try {
      const data = await Promise.race([operation(), timeoutPromise])
      return { success: true, data }
    } catch (error) {
      const contextMessage = context ? ` in ${context}` : ''
      logger.error(`Operation timed out${contextMessage}`, {}, error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * Execute with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    breakerKey: string,
    config: Partial<CircuitBreakerConfig> = {},
    context?: string
  ): Promise<Result<T>> {
    const finalConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringPeriodMs: 10000,
      ...config
    }

    if (!this.circuitBreakers.has(breakerKey)) {
      this.circuitBreakers.set(breakerKey, new CircuitBreaker(finalConfig))
    }

    const breaker = this.circuitBreakers.get(breakerKey)!

    try {
      const data = await breaker.execute(operation)
      return { success: true, data }
    } catch (error) {
      const contextMessage = context ? ` in ${context}` : ''
      logger.error(`Operation failed with circuit breaker${contextMessage}`, {
        error,
        breakerKey,
        state: breaker.getState()
      })

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * Execute with full resilience (retry + timeout + circuit breaker)
   */
  async executeWithFullResilience<T>(
    operation: () => Promise<T>,
    options: {
      retryConfig?: Partial<RetryConfig>
      timeoutConfig?: TimeoutConfig
      circuitBreakerKey?: string
      circuitBreakerConfig?: Partial<CircuitBreakerConfig>
      context?: string
    } = {}
  ): Promise<Result<T>> {
    const {
      retryConfig,
      timeoutConfig,
      circuitBreakerKey,
      circuitBreakerConfig,
      context
    } = options

    // Wrap operation with timeout if configured
    let finalOperation = operation
    if (timeoutConfig) {
      finalOperation = async () => {
        const result = await this.executeWithTimeout(operation, timeoutConfig, context)
        if (!result.success) throw result.error
        return result.data
      }
    }

    // Wrap with circuit breaker if configured
    if (circuitBreakerKey) {
      const originalOperation = finalOperation
      finalOperation = async () => {
        const result = await this.executeWithCircuitBreaker(
          originalOperation,
          circuitBreakerKey,
          circuitBreakerConfig,
          context
        )
        if (!result.success) throw result.error
        return result.data
      }
    }

    // Apply retry logic
    if (retryConfig) {
      return this.executeWithRetry(finalOperation, retryConfig, context)
    }

    return this.execute(finalOperation, context)
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.exponential
      ? config.baseDelay * Math.pow(2, attempt - 1)
      : config.baseDelay

    // Apply max delay limit
    delay = Math.min(delay, config.maxDelay)

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.floor(delay)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Common retry conditions
   */
  static retryConditions = {
    networkErrors: (error: Error): boolean => {
      const networkErrors = [
        'NetworkError',
        'fetch',
        'timeout',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT'
      ]
      return networkErrors.some(keyword =>
        error.message.toLowerCase().includes(keyword.toLowerCase()) ||
        error.name.toLowerCase().includes(keyword.toLowerCase())
      )
    },

    serverErrors: (error: Error): boolean => {
      // Retry on 5xx errors but not 4xx client errors
      const message = error.message.toLowerCase()
      return message.includes('500') ||
             message.includes('502') ||
             message.includes('503') ||
             message.includes('504') ||
             message.includes('internal server error')
    },

    temporaryErrors: (error: Error): boolean => {
      return AsyncErrorHandler.retryConditions.networkErrors(error) ||
             AsyncErrorHandler.retryConditions.serverErrors(error)
    }
  }
}

// Create singleton instance
export const asyncErrorHandler = new AsyncErrorHandler()

// Helper function for common patterns
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<Result<T>> {
  return asyncErrorHandler.execute(operation, context)
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  context?: string
): Promise<Result<T>> {
  return asyncErrorHandler.executeWithRetry(
    operation,
    {
      maxAttempts,
      retryCondition: AsyncErrorHandler.retryConditions.temporaryErrors
    },
    context
  )
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  context?: string
): Promise<Result<T>> {
  return asyncErrorHandler.executeWithTimeout(
    operation,
    { timeoutMs },
    context
  )
}
