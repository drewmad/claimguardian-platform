'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useMemo } from 'react'
import { getSupabaseConfig } from '@/lib/utils/check-env'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    try {
      const { url, anonKey } = getSupabaseConfig()
      browserClient = createBrowserClient(url, anonKey)
    } catch (error) {
      console.error('[ClaimGuardian] Failed to initialize Supabase client:', error)
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