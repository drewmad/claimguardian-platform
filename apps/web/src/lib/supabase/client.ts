'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function useSupabase() {
  const [supabase] = useState(() => createClient())
  const { user } = useAuth()

  return { supabase, user }
}