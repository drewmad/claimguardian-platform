/**
 * @fileMetadata
 * @purpose "Server-side Supabase auth client with secure cookie handling"
 * @dependencies ["@/lib","@supabase/ssr","next"]
 * @owner backend-team
 * @status stable
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { authLogger } from '@/lib/logger'

/**
 * Creates a Supabase client for server-side authentication
 * Uses httpOnly cookies for enhanced security
 */
export async function createAuthClient() {
  const cookieStore = await cookies()

  try {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                // Ensure cookies are secure in production
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                httpOnly: true
              })
            } catch {
              // Cookie setting can fail in Server Components
              // This is expected behavior when called from non-route handlers
              authLogger.debug('Cookie set called from Server Component', { name })
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ 
                name, 
                value: '', 
                ...options,
                maxAge: 0
              })
            } catch {
              authLogger.debug('Cookie remove called from Server Component', { name })
            }
          },
        },
      }
    )
    
    authLogger.info('Server auth client initialized')
    return client
  } catch (error) {
    authLogger.error('Failed to initialize server auth client', {}, error as Error)
    throw error
  }
}

/**
 * Gets the current session from server-side
 * Validates the session with getUser() for security
 */
export async function getServerSession() {
  try {
    const supabase = await createAuthClient()
    
    // Validate session by checking user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      authLogger.warn('Session validation failed', { error: userError?.message })
      
      // If user doesn't exist, clear the invalid session
      if (userError?.message?.includes('User from sub claim in JWT does not exist')) {
        authLogger.info('Clearing invalid session - user no longer exists')
        await supabase.auth.signOut()
      }
      
      return null
    }
    
    // If user is found, get the session from the user object
    const { data: { session } } = await supabase.auth.getSession()

    authLogger.debug('Valid session found', { userId: user.id })
    
    return {
      ...session,
      user
    }
  } catch (error) {
    authLogger.error('Error getting server session', {}, error as Error)
    return null
  }
}

/**
 * Signs out the user from server-side
 * Clears all auth cookies
 */
export async function serverSignOut() {
  try {
    const supabase = await createAuthClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      authLogger.error('Server sign out error', {}, error)
      throw error
    }
    
    authLogger.info('User signed out from server')
  } catch (error) {
    authLogger.error('Failed to sign out from server', {}, error as Error)
    throw error
  }
}

/**
 * Refreshes the current session from server-side
 */
export async function refreshServerSession() {
  try {
    const supabase = await createAuthClient()
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session) {
      authLogger.error('Failed to refresh server session', {}, error || undefined)
      return null
    }
    
    authLogger.info('Server session refreshed', { userId: session.user.id })
    return session
  } catch (error) {
    authLogger.error('Error refreshing server session', {}, error as Error)
    return null
  }
}