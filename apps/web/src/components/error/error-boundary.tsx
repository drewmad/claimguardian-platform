/**
 * @fileMetadata
 * @purpose "Advanced error boundary with recovery options and analytics"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["ErrorBoundary", "ErrorFallback", "useErrorHandler"]
 * @complexity high
 * @tags ["error", "boundary", "recovery", "analytics"]
 * @status stable
 */
'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  RefreshCcw, 
  Home, 
  MessageCircle, 
  Bug,
  Copy,
  ExternalLink,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  lastErrorTime: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  maxRetries?: number
  resetOnPropsChange?: boolean
  level?: 'page' | 'component' | 'critical'
  context?: string
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  retryCount: number
  errorId: string
  level: 'page' | 'component' | 'critical'
  context?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context } = this.props
    const { errorId } = this.state

    // Enhanced error logging
    logger.error('Error Boundary caught an error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      context: context || 'Unknown',
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    })

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, errorId)
    }

    // Report to external error tracking (if configured)
    this.reportErrorToService(error, errorInfo, errorId)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // This would integrate with services like Sentry, Bugsnag, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${error.name}: ${error.message}`,
        fatal: this.props.level === 'critical',
        error_id: errorId
      })
    }
  }

  resetError = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    })
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      logger.warn('Maximum retry attempts reached', { retryCount, maxRetries })
      return
    }

    const newRetryCount = retryCount + 1
    const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 10000) // Exponential backoff, max 10s

    logger.info('Retrying after error', { retryCount: newRetryCount, retryDelay })

    this.setState({ retryCount: newRetryCount })

    this.retryTimeoutId = window.setTimeout(() => {
      this.resetError()
    }, retryDelay)
  }

  render() {
    const { hasError, error, errorInfo, retryCount, errorId } = this.state
    const { children, fallback: FallbackComponent, level = 'component', context, maxRetries = 3 } = this.props

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        resetError: this.resetError,
        retryCount,
        errorId,
        level,
        context
      }

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />
      }

      return <DefaultErrorFallback {...fallbackProps} maxRetries={maxRetries} />
    }

    return children
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  retryCount, 
  errorId, 
  level, 
  context,
  maxRetries = 3 
}: ErrorFallbackProps & { maxRetries?: number }) {
  const canRetry = retryCount < maxRetries
  const isPageLevel = level === 'page'
  const isCritical = level === 'critical'

  const copyErrorDetails = () => {
    const errorDetails = {
      errorId,
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      component: errorInfo?.componentStack || 'No component stack',
      context: context || 'Unknown context',
      retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Could show a toast here
        console.log('Error details copied to clipboard')
      })
      .catch(() => {
        console.log('Failed to copy error details')
      })
  }

  const errorTitle = isCritical 
    ? 'Critical System Error'
    : isPageLevel 
    ? 'Page Load Error'
    : 'Component Error'

  const errorMessage = error?.message || 'An unexpected error occurred'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex items-center justify-center p-4",
          {
            "min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20": isPageLevel || isCritical,
            "h-full": !isPageLevel && !isCritical
          }
        )}
      >
        <Card className={cn(
          "w-full max-w-lg border-red-200 dark:border-red-800",
          {
            "shadow-xl": isPageLevel || isCritical,
            "shadow-lg": !isPageLevel && !isCritical
          }
        )}>
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              {isCritical ? (
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              )}
            </motion.div>
            
            <CardTitle className={cn(
              "text-xl font-semibold",
              isCritical ? "text-red-800 dark:text-red-200" : "text-orange-800 dark:text-orange-200"
            )}>
              {errorTitle}
            </CardTitle>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Error ID: {errorId.slice(-8)}
              </Badge>
              {context && (
                <Badge variant="outline" className="text-xs">
                  {context}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {errorMessage}
              </p>
              
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Retry attempt: {retryCount}/{maxRetries}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {canRetry && (
                <Button onClick={resetError} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Secondary actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyErrorDetails}
                className="text-gray-600 hover:text-gray-800"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Error Details
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('mailto:support@claimguardianai.com?subject=Error Report&body=Error ID: ' + errorId)}
                className="text-gray-600 hover:text-gray-800"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.error('Error Details:', { error, errorInfo, errorId })}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Info
                </Button>
              )}
            </div>

            {/* Development info */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  Development Details
                </summary>
                <div className="mt-2 space-y-2 text-xs font-mono">
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {error.stack}
                    </pre>
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for manual error handling
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.error('Manual error handled', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: context || 'Manual',
      errorId,
      timestamp: new Date().toISOString()
    })

    // Could trigger a toast notification or other UI feedback
    return errorId
  }

  const reportError = (error: Error | string, context?: string, extra?: Record<string, any>) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const errorId = handleError(errorObj, context)
    
    if (extra) {
      logger.info('Additional error context', { errorId, extra })
    }
    
    return errorId
  }

  return { handleError, reportError }
}

// Specialized error boundaries for different use cases
export function PageErrorBoundary({ children, onError }: { 
  children: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void 
}) {
  return (
    <ErrorBoundary
      level="page"
      context="Page"
      maxRetries={2}
      resetOnPropsChange={true}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ 
  children, 
  context, 
  onError 
}: { 
  children: ReactNode
  context?: string
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void 
}) {
  return (
    <ErrorBoundary
      level="component"
      context={context}
      maxRetries={3}
      resetOnPropsChange={true}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="critical"
      context="Critical System"
      maxRetries={1}
      resetOnPropsChange={false}
      onError={(error, errorInfo, errorId) => {
        // Send to monitoring service immediately for critical errors
        logger.error('CRITICAL ERROR', { error, errorInfo, errorId })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}