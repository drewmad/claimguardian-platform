'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useMemo } from 'react'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  return { supabase }
}