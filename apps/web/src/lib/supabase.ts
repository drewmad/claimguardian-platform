/**
 * @fileMetadata
 * @purpose Supabase client configuration and authentication utilities for ClaimGuardian.
 * @owner backend-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["supabase", "getUser", "signIn", "signUp", "signOut"]
 * @complexity medium
 * @tags ["auth", "database", "supabase"]
 * @status active
 * @notes Centralizes Supabase client configuration and provides auth helpers.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, options?: {
  data?: {
    firstName?: string
    lastName?: string
    phone?: string
  }
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}