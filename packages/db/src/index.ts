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

// Export core types from types.ts
export * from './types'

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
export type TablesUpdate = Database['public']['Tables'][keyof Database['public']['Tables']]['Update']
export type Enums = Database['public']['Enums']

// Import types from the new schema structure
import type { 
  CoreProperty, 
  CoreStructure, 
  CoreSpace, 
  CoreScan, 
  CoreDigitalModel,
  ReferenceParcel,
  Database as TypesDatabase 
} from './types'

// Import asset structure type
import type { Structure as AssetStructure } from './types/asset'

// Re-export the types with simpler names for backward compatibility
export type Property = CoreProperty
export type Structure = AssetStructure // Use Asset Structure type for backward compatibility
export type Space = CoreSpace
export type Scan = CoreScan
export type DigitalModel = CoreDigitalModel
export type Parcel = ReferenceParcel

// Temporary types until database types are properly generated
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

export type Claim = {
  id: string
  user_id: string
  property_id: string
  claim_number: string
  status: 'draft' | 'submitted' | 'acknowledged' | 'investigating' | 'approved' | 'denied' | 'settled' | 'closed' | 'reopened' | 'withdrawn'
  claim_type: 'property' | 'casualty' | 'liability' | 'other'
  incident_date: string
  reported_date: string
  description: string | null
  estimated_amount: number | null
  adjuster_name: string | null
  adjuster_phone: string | null
  adjuster_email: string | null
  created_at: string
  updated_at: string
}

// Export insert/update types
export type PropertyInsert = Omit<CoreProperty, 'id' | 'created_at' | 'updated_at' | 'version_id' | 'valid_from' | 'valid_to' | 'is_current' | 'full_address'>
export type PropertyUpdate = Partial<Omit<CoreProperty, 'id' | 'created_at' | 'version_id' | 'valid_from' | 'valid_to' | 'is_current' | 'full_address'>>

export type ClaimInsert = Omit<Claim, 'id' | 'created_at' | 'updated_at'>
export type ClaimUpdate = Partial<Omit<Claim, 'id' | 'created_at' | 'updated_at'>>

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