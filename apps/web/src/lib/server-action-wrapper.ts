/**
 * @fileMetadata
 * @purpose Centralized wrapper for server actions with error handling
 * @owner core-team
 * @status active
 */

import { 
  AuthError, 
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  isBaseError,
  serializeError
} from '@claimguardian/utils'
import { logger } from './logger'
import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

type ActionResult<T> = 
  | { data: T; error: null }
  | { data: null; error: string }

type ActionFunction<TParams, TResult> = (
  params: TParams,
  context: ActionContext
) => Promise<TResult>

interface ActionContext {
  supabase: SupabaseClient
  userId: string
}

/**
 * Wraps a server action with error handling and authentication
 */
export function withAuth<TParams, TResult>(
  action: ActionFunction<TParams, TResult>
): (params: TParams) => Promise<ActionResult<TResult>> {
  return async (params: TParams): Promise<ActionResult<TResult>> => {
    try {
      // Create Supabase client
      const supabase = await createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new AuthError('Authentication required')
      }
      
      // Create context
      const context: ActionContext = {
        supabase,
        userId: user.id
      }
      
      // Execute action
      const result = await action(params, context)
      
      return { data: result, error: null }
    } catch (error) {
      // Log error with context
      logger.error('Server action failed', {
        action: action.name,
        params,
        error: serializeError(error)
      })
      
      // Return user-friendly error message
      if (isBaseError(error)) {
        return { data: null, error: error.message }
      }
      
      // Handle Supabase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code: string; message: string }
        
        switch (supabaseError.code) {
          case '23505': // Unique violation
            return { data: null, error: 'This item already exists' }
          case '23503': // Foreign key violation
            return { data: null, error: 'Related item not found' }
          case '42501': // Insufficient privilege
            return { data: null, error: 'Permission denied' }
          default:
            return { data: null, error: 'Database operation failed' }
        }
      }
      
      // Generic error
      return { data: null, error: 'An unexpected error occurred' }
    }
  }
}

/**
 * Wraps a server action without authentication requirement
 */
export function withoutAuth<TParams, TResult>(
  action: (params: TParams) => Promise<TResult>
): (params: TParams) => Promise<ActionResult<TResult>> {
  return async (params: TParams): Promise<ActionResult<TResult>> => {
    try {
      const result = await action(params)
      return { data: result, error: null }
    } catch (error) {
      // Log error with context
      logger.error('Server action failed', {
        action: action.name,
        params,
        error: serializeError(error)
      })
      
      // Return user-friendly error message
      if (isBaseError(error)) {
        return { data: null, error: error.message }
      }
      
      return { data: null, error: 'An unexpected error occurred' }
    }
  }
}

/**
 * Helper to validate action parameters
 */
export function validateParams<T>(
  params: unknown,
  validator: (params: unknown) => params is T
): T {
  if (!validator(params)) {
    throw new ValidationError('Invalid parameters', [])
  }
  return params
}

/**
 * Helper to handle database errors
 */
export function handleDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message: string }
    throw new DatabaseError(dbError.message, error)
  }
  throw new DatabaseError('Database operation failed', error)
}

/**
 * Helper to handle external service errors
 */
export function handleServiceError(service: string, error: unknown): never {
  if (error instanceof Error) {
    throw new ExternalServiceError(service, error.message, error)
  }
  throw new ExternalServiceError(service, 'Service request failed', error)
}