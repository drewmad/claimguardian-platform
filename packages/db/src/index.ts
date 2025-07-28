// Re-export database types
export * from './types/database.types'

// Export Supabase client factory
import { createServerClient } from '@supabase/ssr'
import { Database } from './types/database.types'

export type { Database }

export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookies: any
) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  })
}