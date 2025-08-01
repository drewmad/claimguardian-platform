'use client'

import React, { forwardRef } from 'react'
import PhoneInputLib from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import '@/styles/phone-input.css'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  label?: string
  error?: { message?: string }
  helperText?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  required?: boolean
  placeholder?: string
  className?: string
  country?: string
}

const PhoneInput = forwardRef<any, PhoneInputProps>(
  ({ label, error, helperText, className, country = 'us', ...props }, ref) => {
    const inputId = `phone-input-${Math.random().toString(36).substr(2, 9)}`
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
        
        <PhoneInputLib
          country={country}
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          inputProps={{
            id: inputId,
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': cn(
              error && errorId,
              helperText && helperId
            ),
            autoComplete: 'tel',
            required: props.required,
            className: error ? 'invalid' : ''
          }}
          containerClass="react-tel-input"
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

PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }