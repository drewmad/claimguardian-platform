/**
 * @fileMetadata
 * @purpose TypeScript types for enhanced database schema (claims, policies, and inventory)
 * @owner data-team
 * @dependencies []
 * @exports ["Database types for claims, policies, and Florida insurance-grade inventory"]
 * @complexity medium
 * @tags ["types", "database", "claims", "policies", "inventory"]
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

// Inventory types
export type InventoryCategory = 
  | 'Electronics'
  | 'Appliance' 
  | 'Furniture'
  | 'Tool'
  | 'Jewelry'
  | 'Collectible'
  | 'Other';

export type ConditionGrade = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export type WarrantyStatus = 'IN_WARRANTY' | 'OUT_OF_WARRANTY' | 'UNKNOWN';

export type DocumentType = 'photo' | 'receipt' | 'warranty' | 'manual' | 'appraisal' | 'other';

export type ImportSource = 'ai_photo_scan' | 'csv_upload' | 'manual_entry' | 'api_import';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'none';

// Inventory item interface
export interface InventoryItem {
  id: string;
  user_id: string;
  property_id?: string;
  
  // Photo reference
  photo_id?: string;
  photo_url?: string;
  
  // Item identification
  item_id: number;
  category: InventoryCategory;
  description: string;
  
  // Manufacturer details
  brand: string;
  model: string;
  serial_number: string;
  
  // Purchase information
  purchase_date?: string; // ISO date string
  purchase_price_usd?: number;
  proof_of_purchase: boolean;
  florida_tax_included?: boolean;
  
  // Condition and valuation
  condition_grade: ConditionGrade;
  estimated_replacement_cost?: number;
  depreciation_percent: number;
  
  // Location and warranty
  location_in_home: string;
  warranty_status: WarrantyStatus;
  warranty_expiration_date?: string; // ISO date string
  
  // Additional details
  quantity: number;
  notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Full-text search vector (readonly)
  search_vector?: string;
}

// Inventory document interface
export interface InventoryDocument {
  id: string;
  inventory_item_id: string;
  user_id: string;
  
  // Document details
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  
  // Photo-specific metadata
  is_primary_photo: boolean;
  contains_serial_number: boolean;
  contains_model_info: boolean;
  
  // AI analysis results
  ai_extracted_text?: string;
  ai_detected_items?: any[];
  ai_confidence_score?: number;
  
  // Metadata
  uploaded_at: string;
  
  // Runtime property
  publicUrl?: string;
}

// Import batch interface
export interface InventoryImportBatch {
  id: string;
  user_id: string;
  property_id?: string;
  
  // Batch details
  batch_name: string;
  import_source: ImportSource;
  
  // Processing status
  status: BatchStatus;
  total_items: number;
  processed_items: number;
  failed_items: number;
  
  // AI processing metadata
  ai_provider?: AIProvider;
  ai_model?: string;
  ai_processing_time_ms?: number;
  
  // Results
  import_results?: {
    imported_item_ids?: string[];
    [key: string]: any;
  };
  error_log?: {
    errors?: Array<{
      item: string;
      error: string;
    }>;
    [key: string]: any;
  };
  
  // Export formats
  csv_export_url?: string;
  json_export_url?: string;
  
  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Inventory statistics view
export interface InventoryStatistics {
  property_id?: string;
  user_id: string;
  total_items: number;
  unique_categories: number;
  total_quantity: number;
  total_purchase_value: number;
  total_replacement_value: number;
  items_in_warranty: number;
  damaged_items: number;
  avg_depreciation: number;
}

// Form input types
export interface CreateInventoryItemInput {
  property_id?: string;
  photo_id?: string;
  photo_url?: string;
  category: InventoryCategory;
  description: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price_usd?: number;
  proof_of_purchase?: boolean;
  florida_tax_included?: boolean;
  condition_grade: ConditionGrade;
  estimated_replacement_cost?: number;
  depreciation_percent?: number;
  location_in_home?: string;
  warranty_status?: WarrantyStatus;
  warranty_expiration_date?: string;
  quantity?: number;
  notes?: string;
}

// Validation result type
export interface InventoryValidationResult {
  total_items: number;
  items_with_photos: number;
  items_with_receipts: number;
  items_with_serial_numbers: number;
  items_with_purchase_info: number;
  items_missing_critical_data: number;
  total_declared_value: number;
  total_replacement_value: number;
  validation_score: number;
  recommendations: string[];
}

// AI analysis result type
export interface AIInventoryAnalysisResult {
  items: Array<{
    photo_id?: string;
    item_id?: number;
    category: InventoryCategory;
    description: string;
    brand: string;
    model: string;
    serial_number: string;
    purchase_date?: string;
    purchase_price_usd?: string | number;
    condition_grade: ConditionGrade;
    estimated_replacement_cost: string | number;
    depreciation_percent?: string | number;
    location_in_home: string;
    warranty_status: WarrantyStatus;
    warranty_expiration_date?: string;
    proof_of_purchase: 'YES' | 'NO' | boolean;
    florida_tax_included?: 'YES' | 'NO' | 'UNK' | boolean;
    notes?: string;
  }>;
  batchId?: string;
  processedCount?: number;
  failedCount?: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
}