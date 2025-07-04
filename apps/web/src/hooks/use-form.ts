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

interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit?: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
      
      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }

    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validate, onSubmit])

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