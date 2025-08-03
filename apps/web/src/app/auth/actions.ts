/**
 * @fileMetadata
 * @purpose Server actions for authentication operations
 * @owner backend-team
 * @status active
 */
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { authLogger } from '@/lib/logger'
import { createAuthClient, serverSignOut } from '@/lib/supabase/server-auth'

/**
 * Server action to sign out the user
 * Clears session and redirects to home
 */
export async function signOutAction() {
  try {
    await serverSignOut()
    revalidatePath('/', 'layout')
    redirect('/')
  } catch (error) {
    authLogger.error('Sign out action failed', {}, error as Error)
    // Still redirect even if sign out fails
    redirect('/')
  }
}

/**
 * Server action to validate current session
 * Returns true if session is valid
 */
export async function validateSessionAction(): Promise<boolean> {
  try {
    const supabase = await createAuthClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    return !error && !!user
  } catch (error) {
    authLogger.error('Session validation failed', {}, error as Error)
    return false
  }
}

/**
 * Server action to refresh the current session
 * Returns true if refresh was successful
 */
export async function refreshSessionAction(): Promise<boolean> {
  try {
    const supabase = await createAuthClient()
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session) {
      authLogger.error('Session refresh failed', {}, error || undefined)
      return false
    }
    
    revalidatePath('/', 'layout')
    return true
  } catch (error) {
    authLogger.error('Session refresh action failed', {}, error as Error)
    return false
  }
}

/**
 * Server action to get session expiry time
 * Returns the expiry timestamp or null if no session
 */
export async function getSessionExpiryAction(): Promise<number | null> {
  try {
    const supabase = await createAuthClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    const { data: { session } } = await supabase.auth.getSession()
    
    return session?.expires_at || null
  } catch (error) {
    authLogger.error('Get session expiry failed', {}, error as Error)
    return null
  }
}