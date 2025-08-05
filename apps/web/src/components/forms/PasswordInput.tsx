/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { Eye, EyeOff } from 'lucide-react'
import React, { forwardRef, useState, useMemo } from 'react'

import { cn } from '@/lib/utils'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: { message?: string }
  showStrength?: boolean
  helperText?: string
}

// Simple password strength calculation (replacing zxcvbn for now)
const calculatePasswordStrength = (password: string): { score: number; feedback: string } => {
  if (!password) return { score: 0, feedback: 'Enter a password' }
  
  let score = 0
  let feedback = 'Very weak'
  
  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  
  // Common patterns (weak)
  if (/(.)\1{2,}/.test(password)) score -= 1 // Repeated characters
  if (/123|abc|qwerty|password/i.test(password)) score -= 2
  
  score = Math.max(0, Math.min(5, score))
  
  switch (score) {
    case 0:
    case 1:
      feedback = 'Very weak'
      break
    case 2:
      feedback = 'Weak'
      break
    case 3:
      feedback = 'Fair'
      break
    case 4:
      feedback = 'Good'
      break
    case 5:
      feedback = 'Strong'
      break
  }
  
  return { score, feedback }
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showStrength = false, helperText, className, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`
    const strengthId = `${inputId}-strength`
    
    const strength = useMemo(() => {
      if (!showStrength || !value) return null
      return calculatePasswordStrength(value as string)
    }, [value, showStrength])

    const getStrengthColor = (score: number) => {
      switch (score) {
        case 0:
        case 1:
          return 'bg-red-500'
        case 2:
          return 'bg-orange-500'
        case 3:
          return 'bg-yellow-500'
        case 4:
          return 'bg-blue-500'
        case 5:
          return 'bg-green-500'
        default:
          return 'bg-gray-500'
      }
    }

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
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            value={value}
            className={cn(
              "w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600",
              "rounded-md text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
              "transition-colors duration-200",
              error && "border-red-500 ring-2 ring-red-500/20",
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && helperId,
              showStrength && strengthId
            )}
            autoComplete="new-password"
            {...props}
          />
          
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
            onPointerDown={() => setShowPassword(true)}
            onPointerUp={() => setShowPassword(false)}
            onPointerLeave={() => setShowPassword(false)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {showStrength && strength && value && (
          <div id={strengthId} className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    getStrengthColor(strength.score)
                  )}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 min-w-[60px]">
                {strength.feedback}
              </span>
            </div>
          </div>
        )}
        
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

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }