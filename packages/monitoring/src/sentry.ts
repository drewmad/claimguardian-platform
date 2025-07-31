import * as Sentry from '@sentry/nextjs'

import { recordMetric } from './metrics'

export interface SentryConfig {
  dsn: string
  environment: string
  tracesSampleRate?: number
  debug?: boolean
  integrations?: any[]
  beforeSend?: (event: any, hint: any) => any
}

export function initializeSentry(config: SentryConfig) {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate || 0.1,
    debug: config.debug || false,
    integrations: [
      // Default integrations
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      ...(config.integrations || [])
    ],
    
    // Set up performance monitoring
    profilesSampleRate: 1.0,
    
    // Custom error filtering
    beforeSend: config.beforeSend || ((event, hint) => {
      // Filter out non-error logs
      if (event.level === 'log') return null
      
      // Add custom context
      if (typeof window !== 'undefined') {
        event.contexts = {
          ...event.contexts,
          browser: {
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }
        }
      }
      
      // Record error metric
      recordMetric('error-count', 1, {
        errorType: event.exception?.values?.[0]?.type || 'unknown',
        errorMessage: event.exception?.values?.[0]?.value || 'unknown'
      })
      
      return event
    }),
    
    // Capture console errors
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'error') {
        recordMetric('console-error', 1, {
          message: breadcrumb.message
        })
      }
      return breadcrumb
    }
  })
}

// Error boundary component for React
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: (fallback as any) || (ErrorFallback as any),
    showDialog: false
  })
}

// Default error fallback component
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  // Return plain object for server-side compatibility
  if (typeof window === 'undefined') {
    return null
  }
  
  // Client-side React component
  const React = require('react')
  return React.createElement('div', {
    className: 'min-h-screen flex items-center justify-center p-4'
  },
    React.createElement('div', {
      className: 'max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'
    },
      React.createElement('h2', {
        className: 'text-2xl font-bold text-red-600 dark:text-red-400 mb-4'
      }, 'Something went wrong'),
      React.createElement('p', {
        className: 'text-gray-600 dark:text-gray-300 mb-4'
      }, error.message || 'An unexpected error occurred'),
      React.createElement('button', {
        onClick: resetError,
        className: 'w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors'
      }, 'Try again')
    )
  )
}

// Profiling wrapper for performance monitoring
export function profileComponent<P extends object>(
  Component: React.ComponentType<P>,
  name: string
) {
  return Sentry.withProfiler(Component, { name })
}

// Custom error capture with additional context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context?.component || 'unknown',
      action: context?.action || 'unknown'
    }
  })
  
  // Also record in metrics
  recordMetric('error-captured', 1, {
    errorName: error.name,
    errorMessage: error.message,
    ...context
  })
}

// Performance transaction wrapper
export async function withTransaction<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    // Use modern Sentry span API
    const result = await Sentry.startSpan({ name, op: operation }, async () => {
      return await callback()
    })
    
    recordMetric('transaction-success', Date.now() - startTime, {
      name,
      operation
    })
    
    return result
  } catch (error) {
    recordMetric('transaction-error', Date.now() - startTime, {
      name,
      operation,
      errorName: error instanceof Error ? error.name : 'unknown'
    })
    
    Sentry.captureException(error)
    throw error
  }
}

// User identification
export function identifyUser(userId: string, userData?: Record<string, any>) {
  Sentry.setUser({
    id: userId,
    ...userData
  })
}

// Clear user context (on logout)
export function clearUser() {
  Sentry.setUser(null)
}

// Add custom breadcrumb
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000
  })
}