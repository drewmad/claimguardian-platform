/**
 * @fileMetadata
 * @purpose Custom React hook for managing form state, validation, and submission.
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["useForm"]
 * @complexity medium
 * @tags ["hook", "form-management", "validation"]
 * @status active
 */
'use client'

import { useState, useCallback } from 'react'
import { inputSanitizer } from '@/lib/security/input-sanitizer'

interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit?: (values: T) => void | Promise<void>
  sanitize?: boolean // Enable automatic input sanitization
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
  sanitize = true
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target
    
    // Sanitize input if enabled and value is a string
    let sanitizedValue = value
    if (sanitize && typeof value === 'string') {
      // Apply appropriate sanitization based on input type or name
      if (name.toLowerCase().includes('email')) {
        sanitizedValue = inputSanitizer.sanitizeEmail(value)
      } else if (name.toLowerCase().includes('url') || name.toLowerCase().includes('website')) {
        sanitizedValue = inputSanitizer.sanitizeUrl(value)
      } else if (name.toLowerCase().includes('phone')) {
        sanitizedValue = inputSanitizer.sanitizePhone(value)
      } else if (name.toLowerCase().includes('search') || name.toLowerCase().includes('query')) {
        sanitizedValue = inputSanitizer.sanitizeSearchQuery(value)
      } else {
        sanitizedValue = inputSanitizer.sanitizeText(value)
      }
    }
    
    setValues(prev => ({ ...prev, [name]: sanitizedValue }))
    
    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors, sanitize])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final sanitization before submission
    let finalValues = values
    if (sanitize) {
      finalValues = inputSanitizer.sanitizeFormData(values) as T
    }
    
    if (validate) {
      const validationErrors = validate(finalValues)
      setErrors(validationErrors)
      
      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }

    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(finalValues)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validate, onSubmit, sanitize])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  }
}