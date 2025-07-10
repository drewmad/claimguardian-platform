'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: Error) => boolean
}

export interface RetryState {
  isRetrying: boolean
  retryCount: number
  lastError: Error | null
  canRetry: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return error.message.includes('network') || 
           error.message.includes('timeout') ||
           error.message.includes('fetch') ||
           error.message.includes('5')
  }
}

export class RetryManager {
  public config: RetryConfig
  private retryCount = 0
  private lastError: Error | null = null

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    this.retryCount = 0
    this.lastError = null

    while (this.retryCount <= this.config.maxRetries) {
      try {
        const result = await operation()
        this.retryCount = 0
        this.lastError = null
        return result
      } catch (error) {
        this.lastError = error as Error
        
        if (this.retryCount >= this.config.maxRetries) {
          throw error
        }

        if (this.config.retryCondition && !this.config.retryCondition(error as Error)) {
          throw error
        }

        this.retryCount++
        const delay = Math.min(
          this.config.initialDelay * Math.pow(this.config.backoffFactor, this.retryCount - 1),
          this.config.maxDelay
        )

        onRetry?.(this.retryCount, error as Error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw this.lastError
  }

  getRetryState(): RetryState {
    return {
      isRetrying: this.retryCount > 0,
      retryCount: this.retryCount,
      lastError: this.lastError,
      canRetry: this.retryCount < this.config.maxRetries
    }
  }

  reset() {
    this.retryCount = 0
    this.lastError = null
  }
}

export function useErrorRecovery(config: Partial<RetryConfig> = {}) {
  const [retryManager] = useState(() => new RetryManager(config))
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: true
  })

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      onRetry?: (attempt: number, error: Error) => void
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
      showToasts?: boolean
    }
  ): Promise<T | null> => {
    const { onRetry, onSuccess, onError, showToasts = true } = options || {}

    try {
      setRetryState(retryManager.getRetryState())
      
      const result = await retryManager.executeWithRetry(
        operation,
        (attempt, error) => {
          setRetryState(retryManager.getRetryState())
          
          if (showToasts) {
            toast.info(`Retrying... (${attempt}/${retryManager.config.maxRetries})`)
          }
          
          onRetry?.(attempt, error)
        }
      )

      setRetryState(retryManager.getRetryState())
      
      if (showToasts && retryState.retryCount > 0) {
        toast.success('Operation succeeded after retry')
      }
      
      onSuccess?.(result)
      return result
    } catch (error) {
      setRetryState(retryManager.getRetryState())
      
      if (showToasts) {
        toast.error(`Operation failed after ${retryManager.config.maxRetries} attempts`)
      }
      
      onError?.(error as Error)
      return null
    }
  }, [retryManager, retryState.retryCount])

  const reset = useCallback(() => {
    retryManager.reset()
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true
    })
  }, [retryManager])

  return {
    executeWithRetry,
    retryState,
    reset,
    isRetrying: retryState.isRetrying,
    canRetry: retryState.canRetry
  }
}

// Specific error recovery for AI operations
export function useAIErrorRecovery() {
  const errorRecovery = useErrorRecovery({
    maxRetries: 2,
    initialDelay: 2000,
    retryCondition: (error) => {
      // Retry on rate limits, network errors, and temporary server issues
      return error.message.includes('rate limit') ||
             error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('503') ||
             error.message.includes('502') ||
             error.message.includes('504')
    }
  })

  const executeAIOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return errorRecovery.executeWithRetry(
      operation,
      {
        onRetry: (attempt, error) => {
          console.log(`Retrying ${operationName} (attempt ${attempt}):`, error.message)
        },
        onSuccess: (result) => {
          console.log(`${operationName} succeeded`)
        },
        onError: (error) => {
          console.error(`${operationName} failed after retries:`, error)
        }
      }
    )
  }, [errorRecovery])

  return {
    ...errorRecovery,
    executeAIOperation
  }
}

// Error boundary for graceful degradation
export function withErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  return operation().catch((error) => {
    console.error('Error caught by boundary:', error)
    
    if (errorMessage) {
      toast.error(errorMessage)
    }
    
    return fallback
  })
}

// Network status detection
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}