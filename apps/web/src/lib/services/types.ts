/**
 * @fileMetadata
 * @purpose "Type definitions for services"
 * @dependencies []
 * @owner core-team
 * @status stable
 */

/**
 * File object from Supabase storage
 */
export interface StorageFile {
  id: string
  name: string
  bucket_id: string
  owner?: string
  created_at: string
  updated_at: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
  size?: number
}

/**
 * Property data from database
 */
export interface Property {
  id: string
  user_id: string
  name: string
  address: string
  type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'commercial'
  year_built: number
  square_feet: number
  details: {
    bedrooms: number
    bathrooms: number
    lot_size: number
  }
  created_at: string
  updated_at: string
}

/**
 * Policy data from database
 */
export interface Policy {
  id: string
  property_id: string
  carrier: string
  policy_number: string
  effective_date: string
  expiration_date: string
  coverage_amount: number
  deductible: number
  wind_deductible?: number | string
  flood_deductible?: number
  premium_amount: number
  additional_coverages?: string[]
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  updated_at: string
}

/**
 * Claim data from database
 */
export interface Claim {
  id: string
  property_id: string
  policy_id: string
  claim_number: string
  date_of_loss: string
  damage_type: 'hurricane' | 'flood' | 'fire' | 'theft' | 'vandalism' | 'other'
  description: string
  estimated_damage?: number
  status: 'draft' | 'submitted' | 'acknowledged' | 'investigating' | 'approved' | 'denied' | 'appeal'
  created_at: string
  updated_at: string
}

/**
 * Document metadata from database
 */
export interface Document {
  id: string
  property_id?: string
  claim_id?: string
  policy_id?: string
  user_id: string
  name: string
  type: 'policy' | 'claim' | 'evidence' | 'correspondence' | 'other'
  file_path: string
  file_size: number
  mime_type: string
  description?: string
  extracted_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * User profile data
 */
export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zip_code: string
  }
  created_at: string
  updated_at: string
}

/**
 * Login activity record
 */
export interface LoginActivity {
  id: string
  user_id: string
  ip_address?: string
  user_agent?: string
  location?: string
  success: boolean
  created_at: string
}

/**
 * Generic database response
 */
export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

/**
 * Paginated database response
 */
export interface PaginatedDatabaseResponse<T> {
  data: T[]
  count: number | null
  error: Error | null
}

/**
 * Google Places API result
 */
export interface GooglePlaceResult {
  place_id: string
  name?: string
  formatted_address?: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  types?: string[]
  url?: string
  vicinity?: string
}