/**
 * @fileMetadata
 * @purpose "Full-page loading component for app initialization"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/ui/loading-overlay"]
 * @exports ["PageLoader", "DashboardLoader", "ModalLoader"]
 * @complexity medium
 * @tags ["loading", "page", "full-screen"]
 * @status stable
 */
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Home, Shield, Zap } from 'lucide-react'
import { LoadingSpinner, ProgressIndicator, StepIndicator } from '@/components/ui/loading-overlay'
import { usePageLoading } from '@/hooks/use-loading-state'
import { cn } from '@/lib/utils'

export interface PageLoaderProps {
  isLoading?: boolean
  message?: string
  showProgress?: boolean
  variant?: 'default' | 'branded' | 'minimal'
  className?: string
}

export function PageLoader({
  isLoading = true,
  message = 'Loading ClaimGuardian...',
  showProgress = true,
  variant = 'branded',
  className
}: PageLoaderProps) {
  const { loadingProgress, loadingStage } = usePageLoading()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            {
              "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900": variant === 'branded',
              "bg-white dark:bg-gray-900": variant === 'default',
              "bg-black/50 backdrop-blur-sm": variant === 'minimal'
            },
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center space-y-8 p-8 text-center max-w-md"
          >
            {variant === 'branded' && (
              <div className="relative">
                {/* Animated logo/brand element */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>

                  {/* Orbiting elements */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Home className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Pulsing ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 border-2 border-blue-400 rounded-full"
                />
              </div>
            )}

            {variant === 'default' && (
              <LoadingSpinner size="lg" />
            )}

            {variant === 'minimal' && (
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            )}

            {/* Brand name */}
            {variant === 'branded' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold text-white">
                  ClaimGuardian
                </h1>
                <p className="text-blue-200 text-sm">
                  AI-Powered Property Protection
                </p>
              </motion.div>
            )}

            {/* Loading message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 w-full"
            >
              <p className={cn(
                "text-sm font-medium",
                variant === 'branded' ? "text-blue-100" : "text-gray-600 dark:text-gray-300"
              )}>
                {loadingStage || message}
              </p>

              {showProgress && (
                <ProgressIndicator
                  progress={loadingProgress}
                  showPercentage={false}
                  color={variant === 'branded' ? 'blue' : 'blue'}
                  className="w-full max-w-xs mx-auto"
                />
              )}
            </motion.div>

            {/* Floating sparkles for branded version */}
            {variant === 'branded' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [-20, -40, -20]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Dashboard-specific loader
export function DashboardLoader({ isLoading = true }: { isLoading?: boolean }) {
  const steps = [
    'Authenticating user',
    'Loading property data',
    'Fetching AI insights',
    'Preparing dashboard',
    'Ready!'
  ]

  return (
    <PageLoader
      isLoading={isLoading}
      variant="branded"
      message="Preparing your property dashboard..."
      showProgress={true}
    />
  )
}

// Modal-specific loader
export function ModalLoader({
  isLoading = true,
  message = 'Processing...',
  variant = 'default'
}: {
  isLoading?: boolean
  message?: string
  variant?: 'default' | 'slim'
}) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center space-x-3 py-4"
        >
          <LoadingSpinner size={variant === 'slim' ? 'sm' : 'md'} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Component-level loading wrapper
export interface ComponentLoaderProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  className?: string
  overlay?: boolean
}

export function ComponentLoader({
  isLoading,
  children,
  skeleton,
  className,
  overlay = false
}: ComponentLoaderProps) {
  if (overlay) {
    return (
      <div className={cn("relative", className)}>
        {children}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <LoadingSpinner size="md" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          {skeleton || <LoadingSpinner size="md" />}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
