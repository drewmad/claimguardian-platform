/**
 * @fileMetadata
 * @purpose Provides a customizable input component with error display.
 * @owner frontend-team
 * @dependencies ["react", "./utils"]
 * @exports ["Input"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity medium
 * @tags ["component", "ui", "form", "input"]
 * @status active
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
            'flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }