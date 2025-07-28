'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { useMemo } from 'react'
import { authLogger } from '@/lib/logger'

let browserClient: ReturnType<typeof createBrowserSupabaseClient> | undefined

export function createClient() {
  if (!browserClient) {
    try {
      browserClient = createBrowserSupabaseClient()
      authLogger.info('Supabase client initialized')
    } catch (error) {
      authLogger.error('Failed to initialize Supabase client', {}, error as Error)
      // Re-throw to prevent silent failures
      throw error
    }
  }
  return browserClient
}

export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  return { supabase }
}