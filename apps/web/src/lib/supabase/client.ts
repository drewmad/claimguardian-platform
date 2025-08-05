/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { useMemo } from 'react'

import { authLogger } from '@/lib/logger'

let browserClient: ReturnType<typeof createBrowserSupabaseClient> | undefined

export function createClient() {
  if (!browserClient) {
    try {
      browserClient = createBrowserSupabaseClient()
      authLogger.info('Supabase browser client initialized (singleton)')
    } catch (error) {
      authLogger.error('Failed to initialize Supabase client', {}, error as Error)
      // Re-throw to prevent silent failures
      throw error
    }
  } else {
    // Reusing existing client to prevent multiple auth listeners
    authLogger.debug('Reusing existing Supabase browser client')
  }
  return browserClient
}

export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  return { supabase }
}