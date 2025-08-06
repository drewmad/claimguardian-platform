/**
 * @fileMetadata
 * @purpose "Demonstration page for error boundaries and error handling"
 * @owner ui-team
 * @dependencies ["react", "@/components/error", "@/providers/error-provider"]
 * @exports ["ErrorDemoPage"]
 * @complexity high
 * @tags ["demo", "error", "boundary", "testing"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bug, 
  Wifi, 
  WifiOff, 
  Database, 
  Lock, 
  Server,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ErrorBoundary,
  ComponentErrorBoundary,
  PageErrorBoundary,
  useErrorHandler
} from '@/components/error/error-boundary'
import {
  ChunkErrorFallback,
  NetworkErrorFallback,
  AuthErrorFallback,
  DatabaseErrorFallback,
  GenericErrorFallback
} from '@/components/error/error-fallbacks'
import { useAsyncError, AsyncErrorDisplay } from '@/components/error/async-error-handler'
import { useGlobalError } from '@/providers/error-provider'
import { cn } from '@/lib/utils'

// Error-throwing components for testing
function ChunkErrorComponent() {
  const error = new Error('Failed to load module')
  error.name = 'ChunkLoadError'
  throw error
}

function NetworkErrorComponent() {
  const error = new Error('Network request failed')
  error.name = 'NetworkError'
  throw error
}

function AuthErrorComponent() {
  const error = new Error('Session expired - please log in again')
  error.name = 'AuthenticationError'
  throw error
}

function DatabaseErrorComponent() {
  const error = new Error('Connection to database failed')
  error.name = 'DatabaseError'
  throw error
}

function GenericErrorComponent() {
  const error = new Error('An unexpected error occurred in this component')
  throw error
}

export default function ErrorDemoPage() {
  const [activeErrors, setActiveErrors] = useState<Set<string>>(new Set())
  const [asyncError, setAsyncError] = useState<string | null>(null)
  
  const { reportError, reportAsyncError, addError } = useGlobalError()
  const { handleError } = useErrorHandler()
  const asyncErrorHandler = useAsyncError()

  const toggleError = (errorType: string) => {
    const newActiveErrors = new Set(activeErrors)
    if (newActiveErrors.has(errorType)) {
      newActiveErrors.delete(errorType)
    } else {
      newActiveErrors.add(errorType)
    }
    setActiveErrors(newActiveErrors)
  }

  const simulateAsyncError = async (type: string) => {
    setAsyncError(type)
    
    try {
      const result = await asyncErrorHandler.executeWithRetry(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          switch (type) {
            case 'network':
              throw new Error('Network timeout - please check your connection')
            case 'rate-limit':
              const error = new Error('Too many requests')
              ;(error as any).status = 429
              throw error
            case 'server':
              const serverError = new Error('Internal server error')
              ;(serverError as any).status = 500
              throw serverError
            default:
              throw new Error('Unknown async error')
          }
        },
        `Async ${type} demo`
      )
      
      console.log('Async operation succeeded:', result)
    } catch (error) {
      console.error('Async operation failed:', error)
    } finally {
      setAsyncError(null)
    }
  }

  const reportGlobalError = (level: 'info' | 'warning' | 'error' | 'critical') => {
    const messages = {
      info: 'This is an informational message',
      warning: 'This is a warning about something important',
      error: 'This is an error that needs attention',
      critical: 'This is a critical system error!'
    }

    addError({
      message: messages[level],
      level,
      context: 'Demo',
      action: level === 'error' ? {
        label: 'Fix Issue',
        handler: () => console.log('Fixing issue...')
      } : undefined
    })
  }

  const errorTypes = [
    {
      id: 'chunk',
      title: 'Chunk Loading Error',
      description: 'Simulates code splitting/dynamic import failures',
      icon: Bug,
      component: ChunkErrorComponent,
      fallback: ChunkErrorFallback,
      color: 'orange'
    },
    {
      id: 'network',
      title: 'Network Error',
      description: 'Simulates connectivity and API failures',
      icon: WifiOff,
      component: NetworkErrorComponent,
      fallback: NetworkErrorFallback,
      color: 'red'
    },
    {
      id: 'auth',
      title: 'Authentication Error',
      description: 'Simulates session expiry and permission issues',
      icon: Lock,
      component: AuthErrorComponent,
      fallback: AuthErrorFallback,
      color: 'purple'
    },
    {
      id: 'database',
      title: 'Database Error',
      description: 'Simulates database connectivity and query failures',
      icon: Database,
      component: DatabaseErrorComponent,
      fallback: DatabaseErrorFallback,
      color: 'red'
    },
    {
      id: 'generic',
      title: 'Generic Error',
      description: 'Simulates unexpected component errors',
      icon: AlertTriangle,
      component: GenericErrorComponent,
      fallback: GenericErrorFallback,
      color: 'gray'
    }
  ]

  const asyncErrorTypes = [
    { id: 'network', label: 'Network Timeout', icon: WifiOff },
    { id: 'rate-limit', label: 'Rate Limited', icon: Server },
    { id: 'server', label: 'Server Error', icon: Database }
  ]

  const globalErrorTypes = [
    { id: 'info', label: 'Info Message', color: 'blue' },
    { id: 'warning', label: 'Warning', color: 'orange' },
    { id: 'error', label: 'Error', color: 'red' },
    { id: 'critical', label: 'Critical', color: 'purple' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Error Handling Demo
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive demonstration of error boundaries, fallback components, 
            and error recovery mechanisms in ClaimGuardian.
          </p>
        </motion.div>

        {/* Error Boundary Demos */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Error Boundary Components
              </CardTitle>
              <p className="text-gray-300">
                Click to trigger different types of component errors and see their fallbacks
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {errorTypes.map((errorType) => {
                  const isActive = activeErrors.has(errorType.id)
                  const Icon = errorType.icon
                  
                  return (
                    <div key={errorType.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5 text-white" />
                          <h3 className="text-white font-medium">{errorType.title}</h3>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => toggleError(errorType.id)}
                          variant={isActive ? 'destructive' : 'default'}
                        >
                          {isActive ? (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Reset
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Trigger
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-gray-400 text-sm">{errorType.description}</p>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 min-h-[200px]">
                        <ComponentErrorBoundary context={errorType.title}>
                          {isActive ? (
                            <errorType.component />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              Click "Trigger" to see error fallback
                            </div>
                          )}
                        </ComponentErrorBoundary>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Async Error Demos */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Async Error Handling
              </CardTitle>
              <p className="text-gray-300">
                Test automatic retry logic and async error recovery
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {asyncErrorTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.id}
                        onClick={() => simulateAsyncError(type.id)}
                        disabled={asyncError === type.id}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </Button>
                    )
                  })}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <AsyncErrorDisplay
                    error={asyncErrorHandler.error}
                    isRetrying={asyncErrorHandler.isRetrying}
                    retryCount={asyncErrorHandler.retryCount}
                    retryDelay={asyncErrorHandler.retryDelay}
                    onRetry={asyncErrorHandler.manualRetry}
                    onClear={asyncErrorHandler.clearError}
                    canRetry={asyncErrorHandler.canRetry}
                    isOnline={asyncErrorHandler.isOnline}
                  />
                  
                  {!asyncErrorHandler.error && !asyncErrorHandler.isRetrying && (
                    <div className="text-center text-gray-500 py-8">
                      Select an async error type to see retry behavior
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Error System */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Global Error System
              </CardTitle>
              <p className="text-gray-300">
                Test global error notifications and toast messages
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {globalErrorTypes.map((type) => (
                  <Button
                    key={type.id}
                    onClick={() => reportGlobalError(type.id as any)}
                    className={cn(
                      "text-white",
                      {
                        'bg-blue-600 hover:bg-blue-700': type.color === 'blue',
                        'bg-orange-600 hover:bg-orange-700': type.color === 'orange',
                        'bg-red-600 hover:bg-red-700': type.color === 'red',
                        'bg-purple-600 hover:bg-purple-700': type.color === 'purple'
                      }
                    )}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-300 text-sm">
                  Global errors appear as toast notifications in the bottom-right corner.
                  Check the error collector in the bottom-left for development mode.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            ← Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  )
}