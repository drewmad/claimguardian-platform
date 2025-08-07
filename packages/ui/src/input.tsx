/**
 * @fileMetadata
 * @purpose "Provides a customizable input component with error display."
 * @owner frontend-team
 * @dependencies ["react", "./utils"]
 * @exports ["Input"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity medium
 * @tags ["component", "ui", "form", "input"]
 * @status stable
 * @notes Used for text, email, password, and number inputs.
 */
'use client'

import * as React from 'react'

import { cn } from './utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-lg border border-border bg-panel/30 backdrop-blur-sm px-4 py-3 text-sm text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:ring-offset-2 focus-visible:border-accent-border disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
