// Re-export database types
export * from './types/database.types'

// Export Supabase client factory
import { createServerClient } from '@supabase/ssr'
import { Database } from './types/database.types'

export type { Database }

// Client creation functions
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

// Re-export common types for easier access
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Export specific table types for convenience
export type Property = Database['public']['Tables']['properties']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

// Export insert/update types
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']
export type ClaimInsert = Database['public']['Tables']['claims']['Insert']
export type ClaimUpdate = Database['public']['Tables']['claims']['Update']