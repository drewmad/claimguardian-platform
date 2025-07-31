'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { logger } from '@/lib/logger'


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error with full details
    logger.error('Application error boundary triggered', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorDigest: error.digest,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }, error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h1>
          
          <p className="text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>

          {error.digest && (
            <p className="text-xs text-gray-500 mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Go Back
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}