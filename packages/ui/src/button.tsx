/**
 * @fileMetadata
 * @purpose Provides a customizable button component with various styles and sizes, built using `class-variance-authority`.
 * @owner frontend-team
 * @dependencies ["react", "class-variance-authority", "./utils"]
 * @exports ["Button", "buttonVariants"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity medium
 * @tags ["component", "ui", "button"]
 * @status active
 * @notes Uses `cva` for flexible variant styling.
 */
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

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
        error: 'bg-error text-text-primary hover:bg-error/90 shadow-lg'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>( 
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }