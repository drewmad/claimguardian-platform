/**
 * @fileMetadata
 * @purpose Provides utility functions for common form validation patterns.
 * @owner frontend-team
 * @dependencies []
 * @exports ["validateRequired", "validateEmail", "validatePhone", "validatePassword"]
 * @complexity low
 * @tags ["utility", "validation", "form"]
 * @status active
 */
export const validateRequired = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 8
}