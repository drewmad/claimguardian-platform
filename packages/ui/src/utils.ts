/**
 * @fileMetadata
 * @purpose Utility function for conditionally joining CSS class names and merging Tailwind CSS classes.
 * @owner frontend-team
 * @dependencies ["clsx", "tailwind-merge"]
 * @exports ["cn"]
 * @complexity low
 * @tags ["utility", "css", "tailwind"]
 * @status active
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}