/**
 * @fileMetadata
 * @purpose "Async error handling with retry logic and user feedback"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["useAsyncError", "AsyncErrorBoundary", "RetryableOperation"]
 * @complexity medium
 * @tags ["async", "error", "retry", "feedback"]
 * @status stable
 */
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock,
  CheckCircle2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface AsyncError extends Error {
  code?: string
  status?: number
  retryable?: boolean
  context?: string
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: AsyncError) => boolean
}

interface AsyncErrorState {
  error: AsyncError | null
  isRetrying: boolean
  retryCount: number
  retryDelay: number
  lastAttemptTime: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.status && error.status >= 500 && error.status < 600) ||
      error.name === 'TypeError' // Often network-related
    )
  }
}

export function useAsyncError(retryConfig: Partial<RetryConfig> = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  const [state, setState] = useState<AsyncErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    retryDelay: 0,
    lastAttemptTime: 0
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const operationRef = useRef<(() => Promise<any>) | null>(null)

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      isRetrying: false,
      retryCount: 0,
      retryDelay: 0
    }))
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  const calculateRetryDelay = useCallback((attempt: number): number => {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    )
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random()
    return Math.floor(delay + jitter)
  }, [config])

  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    operationRef.current = operation
    
    const attempt = async (attemptCount: number): Promise<T> => {
      try {
        setState(prev => ({
          ...prev,
          lastAttemptTime: Date.now(),
          isRetrying: attemptCount > 0
        }))

        const result = await operation()
        
        // Success - clear any previous errors
        clearError()
        
        if (attemptCount > 0) {
          toast.success('Operation completed successfully')
          logger.info('Operation succeeded after retry', { 
            context, 
            attemptCount,
            totalAttempts: attemptCount + 1 
          })
        }
        
        return result
      } catch (error) {
        const asyncError: AsyncError = error instanceof Error 
          ? Object.assign(error, { context })
          : new Error('Unknown async error')

        const shouldRetry = 
          attemptCount < config.maxAttempts &&
          (config.retryCondition?.(asyncError) ?? true)

        logger.error('Async operation failed', {
          error: asyncError.message,
          context,
          attemptCount: attemptCount + 1,
          shouldRetry,
          maxAttempts: config.maxAttempts
        })

        if (shouldRetry) {
          const retryDelay = calculateRetryDelay(attemptCount)
          
          setState(prev => ({
            ...prev,
            error: asyncError,
            isRetrying: true,
            retryCount: attemptCount + 1,
            retryDelay
          }))

          // Wait before retrying
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay)
          })

          return attempt(attemptCount + 1)
        } else {
          // No more retries - set final error state
          setState(prev => ({
            ...prev,
            error: asyncError,
            isRetrying: false,
            retryCount: attemptCount
          }))

          throw asyncError
        }
      }
    }

    return attempt(0)
  }, [config, calculateRetryDelay, clearError])

  const manualRetry = useCallback(async () => {
    if (!operationRef.current || state.isRetrying) return

    try {
      setState(prev => ({ ...prev, isRetrying: true }))
      const result = await operationRef.current()
      clearError()
      toast.success('Manual retry successful')
      return result
    } catch (error) {
      const asyncError: AsyncError = error instanceof Error 
        ? error as AsyncError
        : new Error('Manual retry failed')
      
      setState(prev => ({
        ...prev,
        error: asyncError,
        isRetrying: false
      }))
      
      throw asyncError
    }
  }, [state.isRetrying, clearError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    executeWithRetry,
    manualRetry,
    clearError,
    canRetry: !state.isRetrying && !!operationRef.current,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  }
}

// Component for displaying async errors with retry options
export interface AsyncErrorDisplayProps {
  error: AsyncError | null
  isRetrying: boolean
  retryCount: number
  retryDelay: number
  onRetry: () => void
  onClear: () => void
  canRetry: boolean
  isOnline: boolean
  className?: string
}

export function AsyncErrorDisplay({
  error,
  isRetrying,
  retryCount,
  retryDelay,
  onRetry,
  onClear,
  canRetry,
  isOnline,
  className
}: AsyncErrorDisplayProps) {
  const [countdown, setCountdown] = useState(0)

  // Countdown for automatic retries
  useEffect(() => {
    if (isRetrying && retryDelay > 0) {
      setCountdown(Math.ceil(retryDelay / 1000))
      
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1))
      }, 1000)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        setCountdown(0)
      }, retryDelay)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isRetrying, retryDelay])

  if (!error && !isRetrying) return null

  const getErrorIcon = () => {
    if (isRetrying) return RefreshCw
    if (!isOnline) return WifiOff
    if (error?.status && error.status >= 500) return AlertCircle
    return AlertCircle
  }

  const getErrorMessage = () => {
    if (isRetrying) return `Retrying... ${countdown > 0 ? `(${countdown}s)` : ''}`
    if (!isOnline) return 'No internet connection'
    if (error?.status === 429) return 'Too many requests - please wait'
    if (error?.status && error.status >= 500) return 'Server error - please try again'
    if (error?.code === 'TIMEOUT') return 'Request timed out'
    return error?.message || 'An unexpected error occurred'
  }

  const getErrorColor = () => {
    if (isRetrying) return 'blue'
    if (!isOnline) return 'orange'
    return 'red'
  }

  const Icon = getErrorIcon()
  const message = getErrorMessage()
  const color = getErrorColor()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={cn("mb-4", className)}
      >
        <Card className={cn(
          "border-l-4",
          {
            "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20": color === 'blue',
            "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20": color === 'orange',
            "border-l-red-500 bg-red-50 dark:bg-red-900/20": color === 'red'
          }
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <motion.div
                  animate={{ rotate: isRetrying ? 360 : 0 }}
                  transition={{ 
                    duration: isRetrying ? 1 : 0, 
                    repeat: isRetrying ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 mt-0.5",
                    {
                      "text-blue-600": color === 'blue',
                      "text-orange-600": color === 'orange',
                      "text-red-600": color === 'red'
                    }
                  )} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    {
                      "text-blue-800 dark:text-blue-200": color === 'blue',
                      "text-orange-800 dark:text-orange-200": color === 'orange',
                      "text-red-800 dark:text-red-200": color === 'red'
                    }
                  )}>
                    {message}
                  </p>
                  
                  {retryCount > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Attempt {retryCount + 1} of {DEFAULT_RETRY_CONFIG.maxAttempts}
                    </p>
                  )}
                  
                  {error?.context && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {error.context}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {canRetry && !isRetrying && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    disabled={!isOnline}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClear}
                  className="p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Progress bar for retry countdown */}
            {isRetrying && countdown > 0 && (
              <div className="mt-3">
                <Progress 
                  value={((retryDelay / 1000 - countdown) / (retryDelay / 1000)) * 100}
                  className="h-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// HOC for wrapping components with async error handling
export function withAsyncErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  retryConfig?: Partial<RetryConfig>
) {
  return function AsyncErrorWrappedComponent(props: P) {
    const asyncError = useAsyncError(retryConfig)

    return (
      <>
        <AsyncErrorDisplay
          error={asyncError.error}
          isRetrying={asyncError.isRetrying}
          retryCount={asyncError.retryCount}
          retryDelay={asyncError.retryDelay}
          onRetry={asyncError.manualRetry}
          onClear={asyncError.clearError}
          canRetry={asyncError.canRetry}
          isOnline={asyncError.isOnline}
        />
        <Component {...props} />
      </>
    )
  }
}

// Network status indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

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

  if (isOnline) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white p-2 text-center text-sm"
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Some features may not work properly.</span>
      </div>
    </motion.div>
  )
}