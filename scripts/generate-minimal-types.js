#!/usr/bin/env node

// Generate minimal TypeScript types for essential tables only
// This avoids the massive auto-generated types that break the build

import { writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const minimalTypes = `// Minimal TypeScript types for ClaimGuardian core functionality
// Generated on ${new Date().toISOString()}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          phone: string | null
          organization: string | null
          role: string
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          organization?: string | null
          role?: string
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          organization?: string | null
          role?: string
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          property_name: string
          property_type: string
          address: Record<string, any>
          property_details: Record<string, any>
          images: string[] | null
          value: number | null
          square_footage: number | null
          year_built: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_name: string
          property_type: string
          address: Record<string, any>
          property_details?: Record<string, any>
          images?: string[] | null
          value?: number | null
          square_footage?: number | null
          year_built?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_name?: string
          property_type?: string
          address?: Record<string, any>
          property_details?: Record<string, any>
          images?: string[] | null
          value?: number | null
          square_footage?: number | null
          year_built?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          property_id: string
          user_id: string
          claim_number: string
          claim_type: string
          status: string
          incident_date: string
          reported_date: string
          estimated_amount: number | null
          description: string | null
          damage_categories: string[] | null
          documents: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          claim_number: string
          claim_type: string
          status?: string
          incident_date: string
          reported_date?: string
          estimated_amount?: number | null
          description?: string | null
          damage_categories?: string[] | null
          documents?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          claim_number?: string
          claim_type?: string
          status?: string
          incident_date?: string
          reported_date?: string
          estimated_amount?: number | null
          description?: string | null
          damage_categories?: string[] | null
          documents?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']

export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type ClaimInsert = Database['public']['Tables']['claims']['Insert']

export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']
export type ClaimUpdate = Database['public']['Tables']['claims']['Update']

// Status enums
export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled'
export type PropertyType = 'single_family' | 'condo' | 'townhouse' | 'mobile_home' | 'commercial'
export type ClaimType = 'property_damage' | 'theft' | 'liability' | 'medical' | 'other'
export type UserRole = 'user' | 'admin' | 'manager'
`

// Write to packages/db/src/types/database.types.ts
const outputPath = join(__dirname, '..', 'packages', 'db', 'src', 'types', 'database.types.ts')

try {
  writeFileSync(outputPath, minimalTypes, 'utf8')
  console.log('✅ Generated minimal database types at:', outputPath)
  console.log('📊 Type file size:', (minimalTypes.length / 1024).toFixed(1), 'KB')
} catch (error) {
  console.error('❌ Failed to write types:', error.message)
  process.exit(1)
}

console.log('🎯 Minimal types include:')
console.log('  - user_profiles (essential user data)')
console.log('  - properties (core property management)')  
console.log('  - claims (core claim tracking)')
console.log('  - Convenience types and enums')
console.log('')
console.log('🚀 Ready for development with slim schema!')