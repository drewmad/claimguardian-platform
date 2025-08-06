/**
 * @fileMetadata
 * @purpose "Global loading state provider with smart loading management"
 * @owner ui-team
 * @dependencies ["react", "zustand", "@/components/loading"]
 * @exports ["LoadingProvider", "useLoading"]
 * @complexity high
 * @tags ["provider", "loading", "state-management"]
 * @status stable
 */
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageLoader } from '@/components/loading/page-loader'
import { useGlobalLoadingStore } from '@/hooks/use-loading-state'
import { useRouter, usePathname } from 'next/navigation'

interface LoadingContextValue {
  isGlobalLoading: boolean
  setPageLoading: (loading: boolean) => void
  addLoadingOperation: (key: string, message?: string) => void
  removeLoadingOperation: (key: string) => void
  getLoadingMessage: () => string
  getActiveOperations: () => string[]
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

export interface LoadingProviderProps {
  children: ReactNode
  enableRouteLoading?: boolean
  enablePageTransitions?: boolean
  minLoadingDuration?: number
}

export function LoadingProvider({
  children,
  enableRouteLoading = true,
  enablePageTransitions = true,
  minLoadingDuration = 500
}: LoadingProviderProps) {
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isRouteChanging, setIsRouteChanging] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number>(0)
  
  const router = useRouter()
  const pathname = usePathname()
  
  const { 
    isAnyLoading, 
    loadingStates, 
    loadingMessages, 
    setLoading, 
    clearLoading 
  } = useGlobalLoadingStore()

  // Handle route changes
  useEffect(() => {
    if (!enableRouteLoading) return

    const handleRouteChangeStart = () => {
      setIsRouteChanging(true)
      setLoadingStartTime(Date.now())
    }

    const handleRouteChangeComplete = () => {
      const elapsed = Date.now() - loadingStartTime
      const remainingTime = Math.max(0, minLoadingDuration - elapsed)
      
      setTimeout(() => {
        setIsRouteChanging(false)
      }, remainingTime)
    }

    // These would be handled by Next.js router events in a real implementation
    // For now, we'll simulate route change detection
    let previousPath = pathname
    
    const checkRouteChange = () => {
      if (pathname !== previousPath) {
        handleRouteChangeStart()
        previousPath = pathname
        
        // Simulate route change completion
        setTimeout(() => {
          handleRouteChangeComplete()
        }, 200)
      }
    }

    const interval = setInterval(checkRouteChange, 100)
    return () => clearInterval(interval)
  }, [pathname, enableRouteLoading, minLoadingDuration, loadingStartTime])

  // Smart loading state management
  const setPageLoading = (loading: boolean) => {
    if (loading) {
      setLoadingStartTime(Date.now())
    } else {
      const elapsed = Date.now() - loadingStartTime
      const remainingTime = Math.max(0, minLoadingDuration - elapsed)
      
      setTimeout(() => {
        setIsPageLoading(false)
      }, remainingTime)
    }
    
    if (loading) {
      setIsPageLoading(true)
    }
  }

  const addLoadingOperation = (key: string, message?: string) => {
    setLoading(key, true, message)
  }

  const removeLoadingOperation = (key: string) => {
    clearLoading(key)
  }

  const getLoadingMessage = (): string => {
    const activeMessages = Object.values(loadingMessages).filter(Boolean)
    
    if (isRouteChanging) return 'Navigating...'
    if (isPageLoading) return 'Loading page...'
    if (activeMessages.length > 0) return activeMessages[0]
    if (isAnyLoading()) return 'Loading...'
    
    return ''
  }

  const getActiveOperations = (): string[] => {
    return Object.keys(loadingStates).filter(key => loadingStates[key])
  }

  const shouldShowGlobalLoader = isPageLoading || isRouteChanging || (isAnyLoading() && getActiveOperations().includes('page'))

  const contextValue: LoadingContextValue = {
    isGlobalLoading: shouldShowGlobalLoader,
    setPageLoading,
    addLoadingOperation,
    removeLoadingOperation,
    getLoadingMessage,
    getActiveOperations
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {/* Global page loader */}
      <PageLoader
        isLoading={shouldShowGlobalLoader}
        message={getLoadingMessage()}
        variant="branded"
        showProgress={true}
      />

      {/* Page transition wrapper */}
      {enablePageTransitions ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      ) : (
        children
      )}

      {/* Loading operation indicators */}
      <LoadingIndicators />
    </LoadingContext.Provider>
  )
}

// Hook to use loading context
export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Small loading indicators for active operations
function LoadingIndicators() {
  const { loadingStates, loadingMessages } = useGlobalLoadingStore()
  const [showIndicators, setShowIndicators] = useState(false)
  
  const activeOperations = Object.keys(loadingStates)
    .filter(key => loadingStates[key] && !key.includes('page'))
    .slice(0, 3) // Limit to 3 indicators

  useEffect(() => {
    setShowIndicators(activeOperations.length > 0)
  }, [activeOperations.length])

  return (
    <AnimatePresence>
      {showIndicators && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-40 space-y-2 pointer-events-none"
        >
          {activeOperations.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700 max-w-xs"
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {loadingMessages[key] || 'Loading...'}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// HOC for automatic loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingKey?: string
) {
  return function LoadingWrappedComponent(props: P) {
    const { addLoadingOperation, removeLoadingOperation } = useLoading()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const key = loadingKey || Component.name || 'component'
      
      // Add loading operation
      addLoadingOperation(key, `Loading ${Component.displayName || Component.name}...`)
      
      // Simulate component loading time
      const timer = setTimeout(() => {
        removeLoadingOperation(key)
        setIsLoading(false)
      }, 300)

      return () => {
        clearTimeout(timer)
        removeLoadingOperation(key)
      }
    }, [addLoadingOperation, removeLoadingOperation])

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Hook for async operations with loading state
export function useAsyncWithLoading() {
  const { addLoadingOperation, removeLoadingOperation } = useLoading()

  const executeAsync = async <T,>(
    asyncFn: () => Promise<T>,
    options: {
      key: string
      message?: string
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null> => {
    const { key, message = 'Processing...', onSuccess, onError } = options

    try {
      addLoadingOperation(key, message)
      const result = await asyncFn()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error')
      
      if (onError) {
        onError(errorInstance)
      }
      
      return null
    } finally {
      removeLoadingOperation(key)
    }
  }

  return { executeAsync }
}