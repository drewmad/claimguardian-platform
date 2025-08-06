/**
 * @fileMetadata
 * @purpose "Specialized error fallback components for different scenarios"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["ChunkErrorFallback", "NetworkErrorFallback", "AuthErrorFallback"]
 * @complexity medium
 * @tags ["error", "fallback", "specialized"]
 * @status stable
 */
'use client'

import { motion } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Home, 
  Shield, 
  Download,
  AlertTriangle,
  Lock,
  Database,
  Server,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

// Chunk loading error (common with code splitting)
export function ChunkErrorFallback({ 
  onRetry, 
  className 
}: { 
  onRetry?: () => void
  className?: string 
}) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      // Clear module cache and reload
      if (typeof window !== 'undefined') {
        // Force reload to get fresh chunks
        window.location.reload()
      }
      
      if (onRetry) {
        await onRetry()
      }
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-center p-8", className)}
    >
      <Card className="w-full max-w-md border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto mb-4 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center"
          >
            <Download className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </motion.div>
          
          <CardTitle className="text-orange-800 dark:text-orange-200">
            Loading Issue
          </CardTitle>
          
          <Badge variant="outline" className="w-fit mx-auto mt-2">
            Code Split Error
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Failed to load the required code modules. This usually resolves with a refresh.
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </>
              )}
            </Button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This will reload the page to fetch fresh code
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Network connectivity error
export function NetworkErrorFallback({ 
  onRetry, 
  isOnline = true,
  className 
}: { 
  onRetry?: () => void
  isOnline?: boolean
  className?: string 
}) {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    try {
      // Wait a moment for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onRetry) {
        await onRetry()
      }
    } catch (error) {
      console.error('Network retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const Icon = isOnline ? Wifi : WifiOff
  const statusColor = isOnline ? 'blue' : 'red'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center justify-center p-8", className)}
    >
      <Card className={cn(
        "w-full max-w-md",
        isOnline ? "border-blue-200 dark:border-blue-800" : "border-red-200 dark:border-red-800"
      )}>
        <CardHeader className="text-center">
          <motion.div
            animate={{ 
              scale: isOnline ? [1, 1.1, 1] : 1,
              rotate: isOnline ? 0 : [-5, 5, -5, 5, 0]
            }}
            transition={{ 
              duration: isOnline ? 2 : 0.5,
              repeat: isOnline ? Infinity : 0
            }}
            className={cn(
              "mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center",
              isOnline 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            )}
          >
            <Icon className={cn(
              "w-6 h-6",
              isOnline 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-red-600 dark:text-red-400"
            )} />
          </motion.div>
          
          <CardTitle className={cn(
            isOnline 
              ? "text-blue-800 dark:text-blue-200" 
              : "text-red-800 dark:text-red-200"
          )}>
            {isOnline ? 'Connection Slow' : 'No Internet Connection'}
          </CardTitle>
          
          <Badge variant="outline" className="w-fit mx-auto mt-2">
            Network Issue
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {isOnline 
              ? 'Your connection seems slow. Some features may not work properly.'
              : 'Please check your internet connection and try again.'
            }
          </p>
          
          {retryCount > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Retry attempts: {retryCount}
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              variant={isOnline ? 'default' : 'destructive'}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Authentication error
export function AuthErrorFallback({ 
  error,
  onRetry,
  onLogin,
  className 
}: { 
  error?: Error | null
  onRetry?: () => void
  onLogin?: () => void
  className?: string 
}) {
  const isExpiredSession = error?.message.includes('expired') || error?.message.includes('invalid')
  const isPermissionDenied = error?.message.includes('permission') || error?.message.includes('unauthorized')

  const handleLogin = () => {
    if (onLogin) {
      onLogin()
    } else {
      window.location.href = '/auth/login'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-center p-8", className)}
    >
      <Card className="w-full max-w-md border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mx-auto mb-4 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"
          >
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </motion.div>
          
          <CardTitle className="text-purple-800 dark:text-purple-200">
            {isExpiredSession ? 'Session Expired' : isPermissionDenied ? 'Access Denied' : 'Authentication Required'}
          </CardTitle>
          
          <Badge variant="outline" className="w-fit mx-auto mt-2">
            Auth Error
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {isExpiredSession 
              ? 'Your session has expired. Please log in again to continue.'
              : isPermissionDenied
              ? "You don't have permission to access this resource."
              : 'Please log in to access this feature.'
            }
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleLogin}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              {isExpiredSession ? 'Log In Again' : 'Log In'}
            </Button>
            
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Database/API error
export function DatabaseErrorFallback({ 
  error,
  onRetry,
  className 
}: { 
  error?: Error | null
  onRetry?: () => void
  className?: string 
}) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const isMaintenanceMode = error?.message.includes('maintenance')
  const isRateLimited = error?.message.includes('rate limit') || error?.message.includes('429')
  const isServerError = error?.message.includes('server') || error?.message.includes('5')

  const handleRetry = async () => {
    if (isRateLimited) {
      // Start countdown for rate limit
      setCountdown(30)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      await new Promise(resolve => setTimeout(resolve, 30000))
    }

    setIsRetrying(true)
    
    try {
      if (onRetry) {
        await onRetry()
      }
    } catch (retryError) {
      console.error('Database retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  const getIcon = () => {
    if (isMaintenanceMode) return Server
    if (isRateLimited) return Zap
    return Database
  }

  const getTitle = () => {
    if (isMaintenanceMode) return 'Under Maintenance'
    if (isRateLimited) return 'Too Many Requests'
    if (isServerError) return 'Server Error'
    return 'Database Error'
  }

  const getMessage = () => {
    if (isMaintenanceMode) return 'The system is currently under maintenance. Please try again later.'
    if (isRateLimited) return 'You\'ve made too many requests. Please wait before trying again.'
    if (isServerError) return 'Our servers are experiencing issues. Please try again in a few moments.'
    return 'There was a problem connecting to our database. Please try again.'
  }

  const Icon = getIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-center p-8", className)}
    >
      <Card className="w-full max-w-md border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <motion.div
            animate={{ 
              y: isMaintenanceMode ? [-2, 2, -2] : 0,
              rotate: isRateLimited ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: isMaintenanceMode || isRateLimited ? Infinity : 0 
            }}
            className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
          >
            <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </motion.div>
          
          <CardTitle className="text-red-800 dark:text-red-200">
            {getTitle()}
          </CardTitle>
          
          <Badge variant="outline" className="w-fit mx-auto mt-2">
            {isRateLimited ? 'Rate Limited' : 'Service Error'}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {getMessage()}
          </p>
          
          {countdown > 0 && (
            <div className="space-y-2">
              <Progress value={((30 - countdown) / 30) * 100} className="w-full" />
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Please wait {countdown} seconds before retrying
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying || countdown > 0}
              variant="destructive"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Wait {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Debug Information
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Generic fallback for unknown errors
export function GenericErrorFallback({
  error,
  onRetry,
  context,
  className
}: {
  error?: Error | null
  onRetry?: () => void
  context?: string
  className?: string
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center justify-center p-8", className)}
    >
      <Card className="w-full max-w-md border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
          >
            <AlertTriangle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </motion.div>
          
          <CardTitle className="text-gray-800 dark:text-gray-200">
            Something Went Wrong
          </CardTitle>
          
          {context && (
            <Badge variant="outline" className="w-fit mx-auto mt-2">
              {context}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          <div className="space-y-2">
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {error && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Button>
              
              {showDetails && (
                <div className="mt-2 text-left">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Message:
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {error.message || 'No error message available'}
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && error.stack && (
                    <>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">
                        Stack Trace:
                      </div>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}