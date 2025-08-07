/**
 * @fileMetadata
 * @purpose "Enhanced error boundary with proper error classification and recovery"
 * @dependencies ["@/lib","@claimguardian/utils","lucide-react","react"]
 * @owner platform-team
 * @complexity medium
 * @tags ["error-handling", "boundary", "recovery"]
 * @status stable
 */

'use client'

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import React, { Component, ReactNode, ErrorInfo } from 'react'
import { logger } from '@/lib/logger/production-logger'
import { toError } from '@claimguardian/utils'

interface Props {
  children: ReactNode
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean // Isolate errors to prevent cascade failures
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  isRecovering: boolean
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  retry: () => void
  goHome: () => void
  goBack: () => void
  isRecovering: boolean
}

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
type ErrorCategory = 'network' | 'auth' | 'validation' | 'runtime' | 'unknown'

interface ClassifiedError {
  severity: ErrorSeverity
  category: ErrorCategory
  isRecoverable: boolean
  userMessage: string
  technicalMessage: string
}

class ErrorBoundary extends Component<Props, State> {
  private errorClassification: Map<string, ClassifiedError> = new Map([
    // Network errors
    ['NetworkError', {
      severity: 'medium',
      category: 'network',
      isRecoverable: true,
      userMessage: 'Connection issue. Please check your internet and try again.',
      technicalMessage: 'Network request failed'
    }],
    ['TypeError: Failed to fetch', {
      severity: 'medium',
      category: 'network',
      isRecoverable: true,
      userMessage: 'Unable to connect to our servers. Please try again.',
      technicalMessage: 'Fetch operation failed'
    }],

    // Authentication errors
    ['AuthError', {
      severity: 'high',
      category: 'auth',
      isRecoverable: true,
      userMessage: 'Your session has expired. Please sign in again.',
      technicalMessage: 'Authentication failed'
    }],
    ['Unauthorized', {
      severity: 'high',
      category: 'auth',
      isRecoverable: true,
      userMessage: 'You need to sign in to access this feature.',
      technicalMessage: 'Unauthorized access attempt'
    }],

    // Validation errors
    ['ValidationError', {
      severity: 'low',
      category: 'validation',
      isRecoverable: true,
      userMessage: 'Please check your input and try again.',
      technicalMessage: 'Input validation failed'
    }],

    // Runtime errors
    ['ChunkLoadError', {
      severity: 'medium',
      category: 'runtime',
      isRecoverable: true,
      userMessage: 'Failed to load application resources. Please refresh the page.',
      technicalMessage: 'Dynamic import failed'
    }],
    ['ReferenceError', {
      severity: 'high',
      category: 'runtime',
      isRecoverable: false,
      userMessage: 'An unexpected error occurred. Our team has been notified.',
      technicalMessage: 'Reference error in application code'
    }],

    // Critical errors
    ['InternalError', {
      severity: 'critical',
      category: 'runtime',
      isRecoverable: false,
      userMessage: 'A critical error occurred. Please contact support if this continues.',
      technicalMessage: 'Internal application error'
    }]
  ])

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
      isRecovering: false
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'

    // Classify the error
    const classified = this.classifyError(error)

    // Log error with classification
    logger.error('React error boundary caught error', {
      errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      classification: classified,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Report to external error service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, classified, errorId)
    }
  }

  private classifyError(error: Error): ClassifiedError {
    // Check for exact matches first
    const exactMatch = this.errorClassification.get(error.name)
    if (exactMatch) return exactMatch

    // Check for message patterns
    for (const [pattern, classification] of this.errorClassification.entries()) {
      if (error.message.includes(pattern) || error.toString().includes(pattern)) {
        return classification
      }
    }

    // Default classification for unknown errors
    return {
      severity: 'medium',
      category: 'unknown',
      isRecoverable: true,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: error.message || 'Unknown error'
    }
  }

  private async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    classified: ClassifiedError,
    errorId: string
  ) {
    try {
      // This would typically send to your error reporting service
      // For now, we'll just log it
      console.error('Error reported to monitoring service:', {
        errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo,
        classified,
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      })
    } catch (reportingError) {
      logger.error('Failed to report error to monitoring service', toError(reportingError))
    }
  }

  private retry = () => {
    this.setState({ isRecovering: true })

    // Simulate recovery delay
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false
      })
    }, 1000)
  }

  private goHome = () => {
    window.location.href = '/'
  }

  private goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      this.goHome()
    }
  }

  render() {
    if (this.state.hasError) {
      const classified = this.classifyError(this.state.error!)

      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            retry={this.retry}
            goHome={this.goHome}
            goBack={this.goBack}
            isRecovering={this.state.isRecovering}
          />
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                classified.severity === 'critical' ? 'bg-red-600' :
                classified.severity === 'high' ? 'bg-orange-600' :
                classified.severity === 'medium' ? 'bg-yellow-600' :
                'bg-blue-600'
              }`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-400">
                  {classified.category} error
                </p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              {classified.userMessage}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 p-3 bg-gray-900 rounded border border-gray-600">
                <summary className="text-sm text-gray-400 cursor-pointer">
                  Error Details (Development)
                </summary>
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  <p><strong>Error:</strong> {this.state.error?.message}</p>
                  <p><strong>ID:</strong> {this.state.errorId}</p>
                  <p><strong>Classification:</strong> {classified.severity} / {classified.category}</p>
                  {this.state.error?.stack && (
                    <pre className="mt-2 whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              {classified.isRecoverable && (
                <button
                  onClick={this.retry}
                  disabled={this.state.isRecovering}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                  {this.state.isRecovering ? 'Retrying...' : 'Try Again'}
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.goBack}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>

                <button
                  onClick={this.goHome}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Error ID: {this.state.errorId}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
export default ErrorBoundary
