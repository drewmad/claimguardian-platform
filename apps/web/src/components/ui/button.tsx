/**
 * @fileMetadata
 * @purpose "Enhanced button component with loading states, icons, and accessibility features"
 * @owner frontend-team
 * @dependencies ["react", "class-variance-authority", "@/lib/utils"]
 * @exports ["Button", "buttonVariants"]
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-05T20:00:00Z
 * @complexity medium
 * @tags ["component", "ui", "button", "loading", "icons", "accessibility"]
 * @status stable
 * @notes Enhanced with loading spinner, icon support, and proper ARIA attributes
 */
'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-text-primary hover:bg-accent-hover shadow-lg border border-accent-border',
        secondary: 'bg-panel text-text-primary hover:bg-panel/80 border border-border',
        outline: 'border border-border bg-transparent text-text-primary hover:bg-panel',
        ghost: 'hover:bg-panel text-text-primary',
        link: 'text-accent underline-offset-4 hover:underline',
        success: 'bg-success text-text-primary hover:bg-success/90 shadow-lg',
        error: 'bg-error text-text-primary hover:bg-error/90 shadow-lg',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    data-testid="loading-spinner"
    className={cn("animate-spin h-4 w-4", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>( 
  ({ 
    className, 
    variant, 
    size, 
    children,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    asChild = false,
    disabled,
    onClick,
    type = 'button',
    ...props 
  }, ref) => {
    const [isProcessing, setIsProcessing] = React.useState(false)
    
    const isDisabled = disabled || loading || isProcessing
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (isProcessing || loading) return
      
      // Allow default behavior for reset and submit buttons if no custom onClick
      if ((type === 'reset' || type === 'submit') && !onClick) {
        return // Let the browser handle the default behavior
      }
      
      setIsProcessing(true)
      onClick?.(e)
      
      // Reset processing state after a short delay to prevent double-clicks
      setTimeout(() => setIsProcessing(false), 300)
    }, [onClick, isProcessing, loading, type])

    const Component = asChild ? 'span' : 'button'
    
    return React.createElement(
      Component,
      {
        type: asChild ? undefined : type,
        className: cn(buttonVariants({ variant, size, className })),
        disabled: asChild ? undefined : isDisabled,
        'aria-disabled': isDisabled,
        'aria-busy': loading,
        ref,
        onClick: handleClick,
        ...props
      },
      loading && React.createElement(LoadingSpinner, { className: "mr-2" }),
      !loading && leftIcon && React.createElement(
        'span',
        { className: "mr-2" },
        leftIcon
      ),
      loading ? (loadingText || null) : children,
      !loading && rightIcon && React.createElement(
        'span',
        { className: "ml-2" },
        rightIcon
      )
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

