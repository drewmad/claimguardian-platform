/**
 * @fileMetadata
 * @purpose "Advanced toast notification system with rich content and actions"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "sonner", "lucide-react"]
 * @exports ["useToast", "ToastProvider", "CustomToaster"]
 * @complexity high
 * @tags ["notifications", "toast", "feedback", "ui"]
 * @status stable
 */
'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast as sonnerToast, Toaster, ExternalToast } from 'sonner'
import {
  CheckCircle,
  AlertTriangle,
  X,
  Info,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Star,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Toast types and configurations
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise'
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'default' | 'secondary' | 'destructive'
  loading?: boolean
}

interface CustomToastOptions extends Omit<ExternalToast, 'action'> {
  variant?: ToastVariant
  title?: string
  subtitle?: string
  progress?: number
  actions?: ToastAction[]
  icon?: React.ComponentType<any>
  persistent?: boolean
  metadata?: Record<string, any>
  onDismiss?: () => void
  rich?: boolean
}

interface ToastContextValue {
  toast: (message: string, options?: CustomToastOptions) => string | number
  success: (message: string, options?: Omit<CustomToastOptions, 'variant'>) => string | number
  error: (message: string, options?: Omit<CustomToastOptions, 'variant'>) => string | number
  warning: (message: string, options?: Omit<CustomToastOptions, 'variant'>) => string | number
  info: (message: string, options?: Omit<CustomToastOptions, 'variant'>) => string | number
  loading: (message: string, options?: Omit<CustomToastOptions, 'variant'>) => string | number
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => Promise<T>
  dismiss: (toastId?: string | number) => void
  dismissAll: () => void
  update: (toastId: string | number, options: CustomToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Map<string | number, CustomToastOptions>>(new Map())

  const getIcon = (variant: ToastVariant, customIcon?: React.ComponentType<any>) => {
    if (customIcon) return customIcon

    switch (variant) {
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
      case 'loading': return Loader2
      default: return Bell
    }
  }

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 text-green-800 dark:text-green-200'
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-red-800 dark:text-red-200'
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 text-orange-800 dark:text-orange-200'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 text-blue-800 dark:text-blue-200'
      case 'loading':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 text-purple-800 dark:text-purple-200'
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const createCustomToast = useCallback((message: string, options: CustomToastOptions = {}) => {
    const {
      variant = 'default',
      title,
      subtitle,
      progress,
      actions,
      icon,
      persistent,
      metadata,
      onDismiss,
      rich = false,
      ...sonnerOptions
    } = options

    const Icon = getIcon(variant, icon)
    const toastId = Math.random().toString(36).substr(2, 9)

    // Store toast metadata
    setToasts(prev => new Map(prev.set(toastId, options)))

    if (rich) {
      return sonnerToast.custom((t) => (
        <RichToast
          id={t}
          message={message}
          title={title}
          subtitle={subtitle}
          variant={variant}
          icon={Icon}
          progress={progress}
          actions={actions}
          onDismiss={() => {
            sonnerToast.dismiss(t)
            onDismiss?.()
          }}
          metadata={metadata}
        />
      ), {
        duration: persistent ? Infinity : sonnerOptions.duration || 5000,
        ...sonnerOptions
      })
    }

    return sonnerToast(message, {
      icon: <Icon className={cn(
        "w-4 h-4",
        variant === 'loading' && "animate-spin"
      )} />,
      className: getVariantStyles(variant),
      duration: persistent ? Infinity : sonnerOptions.duration || 5000,
      action: actions?.[0] ? {
        label: actions[0].label,
        onClick: actions[0].onClick
      } : undefined,
      onDismiss,
      ...sonnerOptions
    })
  }, [])

  const contextValue: ToastContextValue = {
    toast: createCustomToast,

    success: (message, options = {}) =>
      createCustomToast(message, { ...options, variant: 'success' }),

    error: (message, options = {}) =>
      createCustomToast(message, { ...options, variant: 'error' }),

    warning: (message, options = {}) =>
      createCustomToast(message, { ...options, variant: 'warning' }),

    info: (message, options = {}) =>
      createCustomToast(message, { ...options, variant: 'info' }),

    loading: (message, options = {}) =>
      createCustomToast(message, { ...options, variant: 'loading', persistent: true }),

    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: Error) => string)
      }
    ) => {
      const loadingToast = createCustomToast(options.loading, {
        variant: 'loading',
        persistent: true
      })

      try {
        const result = await promise

        sonnerToast.dismiss(loadingToast)

        const successMessage = typeof options.success === 'function'
          ? options.success(result)
          : options.success

        createCustomToast(successMessage, { variant: 'success' })

        return result
      } catch (error) {
        sonnerToast.dismiss(loadingToast)

        const errorMessage = typeof options.error === 'function'
          ? options.error(error as Error)
          : options.error

        createCustomToast(errorMessage, { variant: 'error' })

        throw error
      }
    },

    dismiss: (toastId) => {
      if (toastId) {
        sonnerToast.dismiss(toastId)
        setToasts(prev => {
          const newMap = new Map(prev)
          newMap.delete(toastId)
          return newMap
        })
      }
    },

    dismissAll: () => {
      sonnerToast.dismiss()
      setToasts(new Map())
    },

    update: (toastId, options) => {
      // For Sonner, we'd need to dismiss and recreate
      sonnerToast.dismiss(toastId)
      createCustomToast(options.description || '', options)
    }
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Rich toast component for complex notifications
interface RichToastProps {
  id: string | number
  message: string
  title?: string
  subtitle?: string
  variant: ToastVariant
  icon: React.ComponentType<any>
  progress?: number
  actions?: ToastAction[]
  onDismiss: () => void
  metadata?: Record<string, any>
}

function RichToast({
  id,
  message,
  title,
  subtitle,
  variant,
  icon: Icon,
  progress,
  actions,
  onDismiss,
  metadata
}: RichToastProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const handleActionClick = async (action: ToastAction, index: number) => {
    if (actionLoading !== null) return

    setActionLoading(index)

    try {
      await action.onClick()
    } catch (error) {
      console.error('Toast action failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "max-w-sm w-full pointer-events-auto relative overflow-hidden rounded-lg border-l-4 shadow-lg",
        getVariantStyles(variant)
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={cn(
              "w-5 h-5",
              variant === 'loading' && "animate-spin"
            )} />
          </div>

          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium">
                {title}
              </p>
            )}

            <p className={cn(
              "text-sm",
              title ? "mt-1 text-opacity-90" : "font-medium"
            )}>
              {message}
            </p>

            {subtitle && (
              <p className="mt-1 text-xs opacity-75">
                {subtitle}
              </p>
            )}

            {progress !== undefined && (
              <div className="mt-2">
                <Progress value={progress} className="h-1" />
                <p className="text-xs mt-1 opacity-75">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            {metadata && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(metadata).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}

            {actions && actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'default'}
                    onClick={() => handleActionClick(action, index)}
                    disabled={actionLoading !== null}
                    className="text-xs"
                  >
                    {actionLoading === index ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      action.label
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-4 flex-shrink-0 flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="p-1 opacity-50 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar for timed dismissal */}
      {variant !== 'loading' && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
        />
      )}
    </motion.div>
  )
}

// Helper function to get variant styles (moved outside component for reuse)
function getVariantStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-200'
    case 'error':
      return 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
    case 'warning':
      return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-200'
    case 'info':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200'
    case 'loading':
      return 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-800 dark:text-purple-200'
    default:
      return 'border-gray-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }
}

// Custom toaster component with enhanced features
export function CustomToaster({
  position = 'top-right',
  theme = 'system',
  ...props
}: {
  position?: ToastPosition
  theme?: 'light' | 'dark' | 'system'
} & React.ComponentProps<typeof Toaster>) {
  return (
    <Toaster
      position={position}
      theme={theme}
      richColors
      closeButton
      expand={true}
      visibleToasts={4}
      toastOptions={{
        duration: 5000,
        className: 'border-l-4',
        style: {
          background: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        },
      }}
      {...props}
    />
  )
}

// Specialized toast functions for common use cases
export const toastPresets = {
  // Property-related toasts
  propertyAdded: (propertyName: string) =>
    sonnerToast.success(`${propertyName} has been added to your portfolio`, {
      icon: <CheckCircle className="w-4 h-4" />
    }),

  propertyUpdated: (propertyName: string) =>
    sonnerToast.success(`${propertyName} has been updated successfully`, {
      icon: <RefreshCw className="w-4 h-4" />
    }),

  // AI-related toasts
  aiAnalysisComplete: (analysisType: string) =>
    sonnerToast.success(`${analysisType} analysis completed`, {
      icon: <Zap className="w-4 h-4" />
    }),

  aiAnalysisStarted: (analysisType: string) =>
    sonnerToast.loading(`Running ${analysisType} analysis...`, {
      icon: <Loader2 className="w-4 h-4 animate-spin" />
    }),

  // File upload toasts
  uploadStarted: (fileName: string) =>
    sonnerToast.loading(`Uploading ${fileName}...`, {
      icon: <Upload className="w-4 h-4" />
    }),

  uploadComplete: (fileName: string) =>
    sonnerToast.success(`${fileName} uploaded successfully`, {
      icon: <CheckCircle className="w-4 h-4" />
    }),

  uploadFailed: (fileName: string, error: string) =>
    sonnerToast.error(`Failed to upload ${fileName}: ${error}`, {
      icon: <AlertCircle className="w-4 h-4" />
    }),

  // Authentication toasts
  loginSuccess: () =>
    sonnerToast.success('Welcome back! You have been logged in successfully', {
      icon: <CheckCircle className="w-4 h-4" />
    }),

  logoutSuccess: () =>
    sonnerToast.success('You have been logged out successfully', {
      icon: <CheckCircle className="w-4 h-4" />
    }),

  sessionExpired: () =>
    sonnerToast.warning('Your session has expired. Please log in again', {
      icon: <Clock className="w-4 h-4" />
    }),

  // Network toasts
  connectionLost: () =>
    sonnerToast.error('Connection lost. Please check your internet connection', {
      icon: <AlertTriangle className="w-4 h-4" />
    }),

  connectionRestored: () =>
    sonnerToast.success('Connection restored', {
      icon: <CheckCircle className="w-4 h-4" />
    })
}
