/**
 * @fileMetadata
 * @purpose Auth helper utilities for handling session errors
 * @owner auth-team
 * @status active
 */

import { SupabaseClient } from '@supabase/supabase-js'

import { authLogger } from '@/lib/logger'

export async function handleAuthError(error: unknown, supabase: SupabaseClient) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  if (errorMessage.includes('refresh_token_not_found') || 
      errorMessage.includes('Invalid Refresh Token')) {
    authLogger.warn('Refresh token error detected, signing out user', { error: errorMessage })
    
    try {
      // Sign out to clear invalid session
      await supabase.auth.signOut()
      
      // Clear any remaining cookies
      if (typeof window !== 'undefined') {
        // Get all cookies that might contain auth data
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split('=')
          if (name.includes('sb-') || name.includes('auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          }
        })
      }
      
      // Reload to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (signOutError) {
      authLogger.error('Failed to sign out after refresh token error', {}, signOutError as Error)
    }
  }
}

export async function validateSession(supabase: SupabaseClient) {
  try {
    // Validate with getUser to ensure token is still valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      await handleAuthError(userError, supabase)
      return null
    }
    
    return user
  } catch (error) {
    authLogger.error('Session validation failed', {}, error as Error)
    return null
  }
}