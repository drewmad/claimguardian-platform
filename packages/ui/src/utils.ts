/**
 * @fileMetadata
 * @purpose "Utility function for conditionally joining CSS class names and merging Tailwind CSS classes."
 * @owner frontend-team
 * @dependencies ["clsx", "tailwind-merge"]
 * @exports ["cn"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity low
 * @tags ["utility", "css", "tailwind"]
 * @status stable
 * @notes Simplifies dynamic class name generation in React components.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}