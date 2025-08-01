'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: { message?: string }
  helperText?: string
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="mb-4">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3 py-2 bg-gray-800 border border-gray-600",
            "rounded-md text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
            "transition-colors duration-200",
            error && "border-red-500 ring-2 ring-red-500/20",
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          )}
          autoComplete={
            props.type === 'email' ? 'email' :
            props.name === 'firstName' ? 'given-name' :
            props.name === 'lastName' ? 'family-name' :
            props.name === 'phone' ? 'tel' :
            props.type === 'password' ? 'new-password' :
            props.autoComplete
          }
          {...props}
        />
        
        {error && (
          <p 
            id={errorId} 
            role="alert" 
            className="mt-1 text-sm text-red-400"
          >
            {error.message}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={helperId} 
            className="mt-1 text-sm text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'

export { TextInput }