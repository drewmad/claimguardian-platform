/**
 * @fileMetadata
 * @purpose "Loading overlay component with customizable spinners and messages"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["LoadingOverlay", "LoadingSpinner", "LoadingDots", "LoadingPulse"]
 * @complexity medium
 * @tags ["loading", "overlay", "spinner", "ui"]
 * @status stable
 */
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sparkles, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'sparkles'
  size?: 'sm' | 'md' | 'lg'
  backdrop?: boolean
  className?: string
  children?: ReactNode
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  backdrop = true,
  className,
  children
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center z-50",
              backdrop && "bg-black/20 backdrop-blur-sm"
            )}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              {variant === 'spinner' && <LoadingSpinner size={size} />}
              {variant === 'dots' && <LoadingDots size={size} />}
              {variant === 'pulse' && <LoadingPulse size={size} />}
              {variant === 'bars' && <LoadingBars size={size} />}
              {variant === 'sparkles' && <LoadingSparkles size={size} />}

              {message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-xs"
                >
                  {message}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'primary' | 'secondary' | 'accent'
}

export function LoadingSpinner({ size = 'md', className, color = 'primary' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    accent: 'text-purple-600'
  }

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  )
}

export function LoadingDots({ size = 'md', className }: LoadingSpinnerProps) {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn("bg-blue-600 rounded-full", dotSize[size])}
          animate={{
            y: [-4, 4, -4],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export function LoadingPulse({ size = 'md', className }: LoadingSpinnerProps) {
  const pulseSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn("relative", pulseSize[size], className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0 border-2 border-blue-600 rounded-full"
          animate={{
            scale: [1, 2, 1],
            opacity: [1, 0, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export function LoadingBars({ size = 'md', className }: LoadingSpinnerProps) {
  const barHeight = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8'
  }

  const barWidth = {
    sm: 'w-1',
    md: 'w-1',
    lg: 'w-1.5'
  }

  return (
    <div className={cn("flex items-end space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className={cn("bg-blue-600", barWidth[size])}
          animate={{
            height: ['25%', '100%', '25%']
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
          style={{ minHeight: '25%', maxHeight: barHeight[size] }}
        />
      ))}
    </div>
  )
}

export function LoadingSparkles({ size = 'md', className }: LoadingSpinnerProps) {
  const sparkleSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <motion.div
      className={cn("relative", sparkleSize[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      <Sparkles className={cn("text-purple-600", sparkleSize[size])} />

      {/* Floating sparkle effects */}
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className="absolute w-1 h-1 bg-purple-400 rounded-full"
          style={{
            top: `${25 + index * 15}%`,
            left: `${25 + index * 15}%`
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

// Progress indicator component
export interface ProgressIndicatorProps {
  progress: number
  showPercentage?: boolean
  message?: string
  className?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export function ProgressIndicator({
  progress,
  showPercentage = true,
  message,
  className,
  color = 'blue'
}: ProgressIndicatorProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600'
  }

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn("space-y-2", className)}>
      {message && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// Step indicator for multi-step processes
export interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const isUpcoming = index > currentStep

        return (
          <div key={step} className="flex items-center">
            <motion.div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                {
                  "bg-blue-600 text-white": isActive,
                  "bg-green-600 text-white": isCompleted,
                  "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300": isUpcoming
                }
              )}
              animate={{
                scale: isActive ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </motion.div>

            <div className="ml-2 mr-4">
              <div className={cn(
                "text-xs font-medium",
                {
                  "text-blue-600": isActive,
                  "text-green-600": isCompleted,
                  "text-gray-500": isUpcoming
                }
              )}>
                {step}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5",
                {
                  "bg-green-600": isCompleted,
                  "bg-gray-200 dark:bg-gray-700": !isCompleted
                }
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
