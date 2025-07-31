/**
 * @fileMetadata
 * @purpose Shared Supabase client factory for consistent client creation
 * @owner core-team
 * @status active
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr'

interface ClientConfig {
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceRoleKey?: string
}

/**
 * Get configuration from environment
 */
function getConfig(): Required<Omit<ClientConfig, 'supabaseServiceRoleKey'>> & { supabaseServiceRoleKey?: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Factory] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length
    })
    throw new Error('Missing required Supabase environment variables')
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey
  }
}

/**
 * Create a Supabase client for server-side use with cookie handling
 * This should be used in Server Components and Server Actions
 * @param cookieStore - The cookie store from next/headers
 */
export function createServerSupabaseClient(cookieStore: {
  get: (name: string) => { value: string } | undefined
  set: (options: { name: string; value: string } & CookieOptions) => void
}) {
  const config = getConfig()
  
  return createServerClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for browser/client-side use
 * This should be used in Client Components
 */
export function createBrowserSupabaseClient() {
  const config = getConfig()
  
  return createBrowserClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  )
}

/**
 * Create a Supabase client with service role key for admin operations
 * WARNING: This should only be used in secure server-side contexts
 */
export function createServiceRoleClient(): SupabaseClient {
  const config = getConfig()
  
  if (!config.supabaseServiceRoleKey) {
    throw new Error('Service role key not configured')
  }
  
  return createSupabaseClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Create a Supabase client for Edge Functions
 */
export function createEdgeFunctionClient(authHeader?: string): SupabaseClient {
  const config = getConfig()
  
  const options: any = {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
  
  // If auth header is provided, use it
  if (authHeader) {
    options.global = {
      headers: {
        Authorization: authHeader
      }
    }
  }
  
  return createSupabaseClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    options
  )
}

/**
 * Type exports for database
 */
export type { Database } from './types/database.types'
export * from './types/database.types'