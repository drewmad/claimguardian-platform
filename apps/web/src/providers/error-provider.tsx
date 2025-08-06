/**
 * @fileMetadata
 * @purpose "Global error provider with centralized error handling and recovery"
 * @owner ui-team
 * @dependencies ["react", "@/components/error", "zustand"]
 * @exports ["ErrorProvider", "useGlobalError", "ErrorCollector"]
 * @complexity high
 * @tags ["provider", "error", "global", "recovery"]
 * @status stable
 */
'use client'

import { createContext, useContext, useCallback, ReactNode, useEffect } from 'react'
import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NetworkStatus } from '@/components/error/async-error-handler'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface GlobalError {
  id: string
  message: string
  level: 'info' | 'warning' | 'error' | 'critical'
  timestamp: number
  context?: string
  action?: {
    label: string
    handler: () => void | Promise<void>
  }
  autoHide?: boolean
  hideAfter?: number
  persistent?: boolean
}

interface ErrorStore {
  errors: GlobalError[]
  errorCount: number
  lastErrorTime: number
  
  addError: (error: Omit<GlobalError, 'id' | 'timestamp'>) => string
  removeError: (id: string) => void
  clearErrors: () => void
  clearErrorsByLevel: (level: GlobalError['level']) => void
  getErrorsByLevel: (level: GlobalError['level']) => GlobalError[]
  hasErrors: () => boolean
  hasErrorLevel: (level: GlobalError['level']) => boolean
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],
  errorCount: 0,
  lastErrorTime: 0,

  addError: (errorData) => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    const error: GlobalError = {
      ...errorData,
      id,
      timestamp,
      autoHide: errorData.autoHide ?? (errorData.level === 'info' || errorData.level === 'warning'),
      hideAfter: errorData.hideAfter ?? (errorData.level === 'error' ? 10000 : 5000)
    }

    set((state) => ({
      errors: [...state.errors, error],
      errorCount: state.errorCount + 1,
      lastErrorTime: timestamp
    }))

    // Auto-hide if configured
    if (error.autoHide && error.hideAfter) {
      setTimeout(() => {
        get().removeError(id)
      }, error.hideAfter)
    }

    // Log error
    logger.error('Global error added', {
      errorId: id,
      level: error.level,
      message: error.message,
      context: error.context
    })

    return id
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter(error => error.id !== id)
    }))
  },

  clearErrors: () => {
    set({ errors: [], errorCount: 0 })
  },

  clearErrorsByLevel: (level) => {
    set((state) => ({
      errors: state.errors.filter(error => error.level !== level)
    }))
  },

  getErrorsByLevel: (level) => {
    return get().errors.filter(error => error.level === level)
  },

  hasErrors: () => {
    return get().errors.length > 0
  },

  hasErrorLevel: (level) => {
    return get().errors.some(error => error.level === level)
  }
}))

interface ErrorContextValue {
  addError: (error: Omit<GlobalError, 'id' | 'timestamp'>) => string
  removeError: (id: string) => void
  clearErrors: () => void
  reportError: (error: Error | string, context?: string, level?: GlobalError['level']) => string
  reportAsyncError: (error: Error, context?: string, retryHandler?: () => Promise<void>) => string
  errors: GlobalError[]
  hasErrors: boolean
  hasCriticalErrors: boolean
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const { 
    errors, 
    addError, 
    removeError, 
    clearErrors,
    hasErrors,
    hasErrorLevel
  } = useErrorStore()

  const reportError = useCallback((
    error: Error | string, 
    context?: string, 
    level: GlobalError['level'] = 'error'
  ): string => {
    const message = typeof error === 'string' ? error : error.message
    
    return addError({
      message,
      level,
      context,
      autoHide: level !== 'critical',
      persistent: level === 'critical'
    })
  }, [addError])

  const reportAsyncError = useCallback((
    error: Error,
    context?: string,
    retryHandler?: () => Promise<void>
  ): string => {
    const action = retryHandler ? {
      label: 'Retry',
      handler: async () => {
        try {
          await retryHandler()
          toast.success('Retry successful')
        } catch (retryError) {
          reportError(retryError as Error, context, 'error')
        }
      }
    } : undefined

    return addError({
      message: error.message,
      level: 'error',
      context,
      action,
      autoHide: false
    })
  }, [addError, reportError])

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))

      reportError(error, 'Unhandled Promise Rejection', 'error')
    }

    const handleError = (event: ErrorEvent) => {
      event.preventDefault()
      
      reportError(
        event.error || new Error(event.message),
        `${event.filename}:${event.lineno}:${event.colno}`,
        'error'
      )
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [reportError])

  const contextValue: ErrorContextValue = {
    addError,
    removeError,
    clearErrors,
    reportError,
    reportAsyncError,
    errors,
    hasErrors: hasErrors(),
    hasCriticalErrors: hasErrorLevel('critical')
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      <NetworkStatus />
      <ErrorDisplay />
    </ErrorContext.Provider>
  )
}

export function useGlobalError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useGlobalError must be used within an ErrorProvider')
  }
  return context
}

// Error display component
function ErrorDisplay() {
  const { errors, removeError } = useGlobalError()
  const displayErrors = errors.slice(-3) // Show max 3 errors

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm">
      <AnimatePresence>
        {displayErrors.map((error) => (
          <ErrorCard
            key={error.id}
            error={error}
            onClose={() => removeError(error.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ErrorCard({ error, onClose }: { error: GlobalError; onClose: () => void }) {
  const getLevelColor = (level: GlobalError['level']) => {
    switch (level) {
      case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'warning': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'critical': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
    }
  }

  const getLevelIcon = (level: GlobalError['level']) => {
    return AlertTriangle
  }

  const Icon = getLevelIcon(error.level)

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto"
    >
      <Card className={`border-l-4 shadow-lg ${getLevelColor(error.level)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-current" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {error.level.toUpperCase()}
                  </Badge>
                  {error.context && (
                    <Badge variant="outline" className="text-xs">
                      {error.context}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                  {error.message}
                </p>
                
                {error.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={error.action.handler}
                    className="mt-2"
                  >
                    {error.action.label}
                  </Button>
                )}
              </div>
            </div>

            {!error.persistent && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="p-1 flex-shrink-0 ml-2"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Error collector for development and debugging
export function ErrorCollector() {
  const { errors, clearErrors } = useGlobalError()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (errors.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-md">
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Error Log ({errors.length})</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearErrors}
              className="text-gray-300 hover:text-white p-1"
            >
              Clear
            </Button>
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {errors.slice(-5).map((error) => (
              <div key={error.id} className="text-xs">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  error.level === 'critical' ? 'bg-purple-400' :
                  error.level === 'error' ? 'bg-red-400' :
                  error.level === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                }`} />
                <span className="text-gray-300">
                  [{new Date(error.timestamp).toLocaleTimeString()}]
                </span>
                <span className="ml-2 text-white">{error.message}</span>
                {error.context && (
                  <span className="ml-2 text-gray-400">({error.context})</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// HOC for adding automatic error reporting to components
export function withErrorReporting<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  return function ErrorReportingWrappedComponent(props: P) {
    const { reportError } = useGlobalError()

    useEffect(() => {
      const componentName = Component.displayName || Component.name || 'Unknown'
      
      // Report component mount
      if (process.env.NODE_ENV === 'development') {
        console.log(`Component mounted: ${componentName}`)
      }

      return () => {
        // Component unmount - could report if needed
      }
    }, [reportError])

    return <Component {...props} />
  }
}