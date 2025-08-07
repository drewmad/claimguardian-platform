/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Utility functions for UI components and general app functionality"
 * @dependencies ["clsx", "tailwind-merge"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import React from 'react'

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

// Notification priority badge utility - returns JSX element
export function getPriorityBadge(priority: 'low' | 'medium' | 'high' | 'urgent') {
  // Note: This function returns badge config that should be used with Badge component
  // The actual JSX rendering should happen in the component that imports this
  switch (priority) {
    case 'urgent':
      return { variant: 'destructive' as const, className: 'text-xs', label: 'Urgent' }
    case 'high':
      return { variant: 'secondary' as const, className: 'text-xs bg-orange-100 text-orange-800', label: 'High' }
    case 'medium':
      return { variant: 'outline' as const, className: 'text-xs', label: 'Medium' }
    case 'low':
      return { variant: 'outline' as const, className: 'text-xs bg-gray-100 text-gray-600', label: 'Low' }
    default:
      return null
  }
}
