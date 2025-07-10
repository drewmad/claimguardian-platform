/**
 * @fileMetadata
 * @purpose React hooks for comprehensive error handling and user feedback
 * @owner frontend-team
 * @complexity medium
 * @tags ["hooks", "error-handling", "react", "user-experience"]
 * @status active
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { 
  asyncErrorHandler, 
  Result, 
  RetryConfig, 
  TimeoutConfig,
  withErrorHandling,
  withRetry,
  withTimeout
} from '@/lib/error-handling/async-error-handler'

export interface ErrorState {
  error: Error | null
  isError: boolean
  errorId: string | null
  retryCount: number
  lastRetry: number | null
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isError: boolean
  errorId: string | null
  retryCount: number
  lastRetry: number | null
}

export interface UseErrorHandlingOptions {
  enableToasts?: boolean
  enableRetry?: boolean
  maxRetries?: number
  context?: string
  onError?: (error: Error, errorId: string) => void
  onRetry?: (retryCount: number) => void
  onSuccess?: () => void
}

/**
 * Hook for handling errors with user feedback and retry capabilities
 */
export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    enableToasts = true,
    enableRetry = true,
    maxRetries = 3,
    context,
    onError,
    onRetry,
    onSuccess
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorId: null,
    retryCount: 0,
    lastRetry: null
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorId: null,
      retryCount: 0,
      lastRetry: null
    })
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    if (onSuccess) {
      onSuccess()
    }
  }, [onSuccess])

  const handleError = useCallback((error: Error) => {
    const errorId = generateErrorId()
    
    setErrorState(prev => ({
      error,
      isError: true,
      errorId,
      retryCount: prev.retryCount,
      lastRetry: prev.lastRetry
    }))

    // Log error
    logger.error('Error handled by useErrorHandling', {
      errorId,
      error: error.message,
      context,
      retryCount: errorState.retryCount
    })

    // Show toast notification
    if (enableToasts) {
      const userMessage = getUserFriendlyMessage(error)
      toast.error(userMessage, {
        id: errorId,
        action: enableRetry && errorState.retryCount < maxRetries ? {
          label: 'Retry',
          onClick: () => retry()
        } : undefined
      })
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorId)
    }
  }, [context, enableToasts, enableRetry, errorState.retryCount, maxRetries, onError, generateErrorId])

  const retry = useCallback(() => {
    if (errorState.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please try again later.')
      return
    }

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      lastRetry: Date.now()
    }))

    if (onRetry) {
      onRetry(errorState.retryCount + 1)
    }

    toast.info(`Retrying... (${errorState.retryCount + 1}/${maxRetries})`)
  }, [errorState.retryCount, maxRetries, onRetry])

  const canRetry = errorState.isError && errorState.retryCount < maxRetries

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...errorState,
    handleError,
    clearError,
    retry,
    canRetry
  }
}

/**
 * Hook for async operations with comprehensive error handling
 */
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: UseErrorHandlingOptions & {
    immediate?: boolean
    retryConfig?: Partial<RetryConfig>
    timeoutConfig?: TimeoutConfig
  } = {}
) {
  const {
    immediate = false,
    retryConfig,
    timeoutConfig,
    ...errorOptions
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    isError: false,
    errorId: null,
    retryCount: 0,
    lastRetry: null
  })

  const { handleError, clearError, retry: retryError } = useErrorHandling(errorOptions)
  const operationRef = useRef(operation)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Update operation ref when it changes
  useEffect(() => {
    operationRef.current = operation
  }, [operation])

  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isError: false
    }))

    clearError()

    try {
      let result: Result<T>

      // Apply timeout if configured
      if (timeoutConfig) {
        result = await withTimeout(operationRef.current, timeoutConfig.timeoutMs, options.context)
      }
      // Apply retry if configured
      else if (retryConfig) {
        result = await withRetry(operationRef.current, retryConfig.maxAttempts, options.context)
      }
      // Basic error handling
      else {
        result = await withErrorHandling(operationRef.current, options.context)
      }

      if (!result.success) {
        throw result.error
      }

      setState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        error: null,
        isError: false,
        retryCount: 0
      }))

      return result.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        isError: true,
        errorId: `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        retryCount: prev.retryCount + 1,
        lastRetry: Date.now()
      }))

      handleError(err)
      return null
    }
  }, [retryConfig, timeoutConfig, options.context, clearError, handleError])

  const retry = useCallback(() => {
    retryError()
    return execute()
  }, [retryError, execute])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isError: false,
      errorId: null,
      retryCount: 0,
      lastRetry: null
    })
    clearError()
  }, [clearError])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: state.isError && state.retryCount < (retryConfig?.maxAttempts || 3)
  }
}

/**
 * Hook for API calls with automatic error handling
 */
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseErrorHandlingOptions & {
    enabled?: boolean
    retryDelay?: number
  } = {}
) {
  const { enabled = true, retryDelay = 1000, ...asyncOptions } = options

  const operation = useAsyncOperation(apiFunction, {
    ...asyncOptions,
    immediate: enabled,
    retryConfig: {
      maxAttempts: 3,
      baseDelay: retryDelay,
      retryCondition: (error: Error) => {
        // Don't retry on client errors (4xx)
        const isClientError = error.message.includes('400') || 
                             error.message.includes('401') || 
                             error.message.includes('403') || 
                             error.message.includes('404')
        return !isClientError
      }
    }
  })

  // Re-execute when dependencies change
  useEffect(() => {
    if (enabled) {
      operation.execute()
    }
  }, [enabled, ...dependencies])

  return operation
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Connection problem. Please check your internet and try again.'
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'You need to sign in to access this feature.'
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return 'You don\'t have permission to perform this action.'
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.'
  }
  
  if (message.includes('500') || message.includes('internal server error')) {
    return 'Server error. Please try again later.'
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.'
  }
  
  // Default message for unknown errors
  return 'Something went wrong. Please try again.'
}