import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export function queryErrorHandler(error: Error) {
  // Log the error
  logger.error('React Query error', {
    message: error.message,
    stack: error.stack,
  })

  // Show user-friendly error messages
  if (error.message.includes('Network')) {
    toast.error('Network error. Please check your connection.')
  } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
    toast.error('Session expired. Please sign in again.')
  } else if (error.message.includes('forbidden') || error.message.includes('403')) {
    toast.error('You don\'t have permission to perform this action.')
  } else if (error.message.includes('not found') || error.message.includes('404')) {
    toast.error('The requested resource was not found.')
  } else {
    // Generic error message
    toast.error('Something went wrong. Please try again.')
  }
}