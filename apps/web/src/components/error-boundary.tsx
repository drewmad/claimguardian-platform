/**
 * @fileMetadata
 * @purpose React error boundary component for catching and handling errors
 * @owner core-team
 * @dependencies ["react", "@/lib/logger", "lucide-react"]
 * @exports ["ErrorBoundary"]
 * @complexity medium
 * @tags ["error-boundary", "error-handling", "component"]
 * @status active
 */
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging service
    logger.fatal('React Error Boundary caught an error', error, {
      errorInfo,
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    // Update state with error info
    this.setState({
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
          <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-400 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-900 rounded-lg text-left">
                <p className="text-sm text-red-400 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-400">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error ID for support */}
            {this.state.errorId && (
              <p className="text-xs text-slate-500 mb-6">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    logger.error('Error caught by useErrorHandler', error, {
      errorInfo,
      componentStack: errorInfo?.componentStack
    })
  }
}