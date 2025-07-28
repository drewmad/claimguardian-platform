import { createServerSupabaseClient } from '@claimguardian/db'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerSupabaseClient(cookieStore)
}