/**
 * @fileMetadata
 * @purpose Provides utility functions for formatting data such as phone numbers, currency, and dates.
 * @owner frontend-team
 * @dependencies []
 * @exports ["formatPhoneNumber", "formatCurrency", "formatDate"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:09:02-04:00
 * @complexity low
 * @tags ["utility", "formatting"]
 * @status active
 * @notes Includes functions for consistent data presentation.
 */
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').substring(0, 10)
  if (digits.length >= 6) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
  } else if (digits.length >= 3) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
  } else {
    return digits
  }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export const formatDate = (date: Date | string | number): string => {
  let d: Date
  
  if (typeof date === 'string') {
    d = new Date(date)
  } else if (typeof date === 'number') {
    d = new Date(date)
  } else {
    d = date
  }
  
  // Check if date is invalid
  if (isNaN(d.getTime())) {
    return 'Invalid Date'
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}