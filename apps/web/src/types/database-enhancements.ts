/**
 * @fileMetadata
 * @purpose TypeScript types for enhanced database schema (claims and policies)
 * @owner data-team
 * @dependencies []
 * @exports ["Database types for claims and policies"]
 * @complexity medium
 * @tags ["types", "database", "claims", "policies"]
 * @status active
 */

// Enum types
export type ClaimStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'denied'
  | 'settled'
  | 'closed'
  | 'reopened';

export type DamageType = 
  | 'hurricane'
  | 'flood'
  | 'wind'
  | 'hail'
  | 'fire'
  | 'water_damage'
  | 'mold'
  | 'theft'
  | 'vandalism'
  | 'lightning'
  | 'fallen_tree'
  | 'other';

export type PolicyType = 
  | 'HO3'      // Homeowners (Special Form)
  | 'HO5'      // Comprehensive
  | 'HO6'      // Condo
  | 'HO8'      // Older Home
  | 'DP1'      // Basic Dwelling
  | 'DP3'      // Special Dwelling
  | 'FLOOD'    // Flood Insurance
  | 'WIND'     // Wind/Hurricane Only
  | 'UMBRELLA' // Umbrella Policy
  | 'OTHER';

export type CommunicationType = 'email' | 'phone' | 'letter' | 'meeting' | 'other';
export type CommunicationDirection = 'incoming' | 'outgoing';

// Database table types
export interface Policy {
  id: string;
  property_id: string;
  carrier_name: string;
  policy_number: string;
  policy_type: PolicyType;
  effective_date: string; // ISO date string
  expiration_date: string; // ISO date string
  coverage_details?: {
    coverage_amount?: number;
    deductible?: number;
    wind_deductible?: number;
    limits?: Record<string, number>;
    exclusions?: string[];
    special_conditions?: string[];
    [key: string]: any;
  };
  premium_amount?: number;
  deductible_amount?: number;
  wind_deductible_percentage?: number;
  flood_deductible_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Claim {
  id: string;
  claim_number?: string; // Auto-generated
  property_id: string;
  policy_id: string;
  user_id: string;
  status: ClaimStatus;
  damage_type: DamageType;
  date_of_loss: string; // ISO date string
  date_reported?: string; // ISO date string
  description?: string;
  estimated_value?: number;
  deductible_applied?: number;
  settled_value?: number;
  settlement_date?: string; // ISO date string
  adjuster_name?: string;
  adjuster_phone?: string;
  adjuster_email?: string;
  claim_notes?: string;
  supporting_documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded_at: string;
    [key: string]: any;
  }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClaimStatusHistory {
  id: string;
  claim_id: string;
  previous_status?: ClaimStatus;
  new_status: ClaimStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface ClaimCommunication {
  id: string;
  claim_id: string;
  user_id: string;
  communication_type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    [key: string]: any;
  }>;
  created_at: string;
}

// Enhanced Property type with structured address
export interface EnhancedProperty {
  id: string;
  name: string;
  property_type: string;
  user_id: string;
  
  // Structured address fields
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  county?: string;
  country?: string;
  
  // Legacy JSONB address (for backward compatibility)
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    googlePlaceId?: string;
  };
  
  year_built?: number;
  square_feet?: number;
  value?: number;
  parcel_id?: string;
  
  details?: Record<string, any>;
  insurability_score?: number;
  is_primary?: boolean;
  
  created_at: string;
  updated_at: string;
}

// View types
export interface ActivePolicy extends Policy {
  property_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface ClaimOverview extends Claim {
  property_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  carrier_name?: string;
  policy_number?: string;
  policy_type?: PolicyType;
  user_email?: string;
  user_name?: string;
}

// Helper types for forms and UI
export interface CreatePolicyInput {
  property_id: string;
  carrier_name: string;
  policy_number: string;
  policy_type: PolicyType;
  effective_date: string;
  expiration_date: string;
  coverage_details?: Policy['coverage_details'];
  premium_amount?: number;
  deductible_amount?: number;
  wind_deductible_percentage?: number;
  flood_deductible_amount?: number;
}

export interface CreateClaimInput {
  property_id: string;
  policy_id: string;
  damage_type: DamageType;
  date_of_loss: string;
  description?: string;
  estimated_value?: number;
}

export interface UpdateClaimInput {
  status?: ClaimStatus;
  description?: string;
  estimated_value?: number;
  deductible_applied?: number;
  settled_value?: number;
  settlement_date?: string;
  adjuster_name?: string;
  adjuster_phone?: string;
  adjuster_email?: string;
  claim_notes?: string;
}

// Utility type for claim timeline
export interface ClaimTimelineEvent {
  id: string;
  type: 'status_change' | 'communication' | 'document_added' | 'settlement';
  timestamp: string;
  title: string;
  description?: string;
  user_name?: string;
  metadata?: Record<string, any>;
}