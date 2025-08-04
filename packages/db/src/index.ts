// Re-export database types
export * from './types/database.types'

// Export domain-specific types
export * from './types/asset'
export * from './types/claim'
export * from './types/insurance'
export * from './types/legal-compliance'

// Export Maps Intelligence types and services
export * from './types/maps-intelligence'
export * from './services/maps-intelligence-service'

import type { Database } from './types/database.types'

// Export Supabase client factory functions
export {
  createServerSupabaseClient,
  createBrowserSupabaseClient,
  createServiceRoleClient,
  createEdgeFunctionClient
} from './supabase-factory'

// Re-export Database type
export type { Database }

// Re-export common types for easier access
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Export specific table types for convenience
export type Property = Database['public']['Tables']['properties']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']

// TODO: Fix these once users and profiles tables are added to database types
// export type User = Database['public']['Tables']['users']['Row']
// export type Profile = Database['public']['Tables']['profiles']['Row']

// Temporary types until database types are fixed
export type User = {
  id: string
  email: string
  created_at: string
}

export type Profile = {
  id: string
  user_id: string
  full_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// Export insert/update types
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']
export type ClaimInsert = Database['public']['Tables']['claims']['Insert']
export type ClaimUpdate = Database['public']['Tables']['claims']['Update']

// Re-export Maps Intelligence for convenience
export { MapsIntelligenceService } from './services/maps-intelligence-service'
export type {
  MapsApiType,
  ApiExecutionTrigger,
  ApiExecutionStatus,
  AddressIntelligence,
  WeatherIntelligence,
  AerialIntelligence,
  EnvironmentalIntelligence,
  StreetViewIntelligence,
  SolarIntelligence,
  StaticMapsIntelligence,
  PropertyIntelligenceSummary,
  IntelligenceResponse
} from './types/maps-intelligence'