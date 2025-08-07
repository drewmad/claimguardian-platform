/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "TypeScript types for ClaimGuardian database schema with temporal digital twin support"
 * @dependencies ["@supabase/supabase-js"]
 * @status stable
 * @supabase-integration database
 * @agent-hints "Auto-generated from Supabase schema, update when schema changes"
 */

// Core Digital Twin Types
export interface CoreProperty {
  id: string;
  user_id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  county_name: string | null;
  full_address: string; // Generated column
  location: any | null; // PostGIS Geography type
  parcel_id: string | null;
  county_id: string | null;
  property_type:
    | "single_family"
    | "townhouse"
    | "condo"
    | "multi_family"
    | "commercial"
    | "land";
  occupancy_status:
    | "owner_occupied"
    | "tenant_occupied"
    | "vacant"
    | "seasonal";
  year_built: number | null;
  square_footage: number | null;
  lot_size_acres: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  stories: number;
  garage_spaces: number;
  pool: boolean;
  construction_type: string | null;
  roof_type: string | null;
  roof_year: number | null;
  hvac_year: number | null;
  plumbing_year: number | null;
  electrical_year: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  mortgage_balance: number | null;
  flood_zone: string | null;
  wind_zone: string | null;
  evacuation_zone: string | null;
  legal_description: string | null;
  metadata: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
  // Temporal fields
  version_id: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
}

export interface CoreStructure {
  id: string;
  property_id: string;
  structure_type: string;
  name: string | null;
  description: string | null;
  footprint: any | null; // PostGIS Geometry
  floors_count: number;
  height_feet: number | null;
  square_footage: number | null;
  construction_type: string | null;
  roof_type: string | null;
  foundation_type: string | null;
  exterior_materials: string[] | null;
  construction_year: number | null;
  last_renovation_year: number | null;
  condition_rating: number | null;
  primary_model_id: string | null;
  last_scan_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Temporal fields
  version_id: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
}

export interface CoreSpace {
  id: string;
  structure_id: string;
  space_type: string;
  name: string;
  description: string | null;
  floor_level: number | null;
  square_footage: number | null;
  ceiling_height_feet: number | null;
  bounding_box: any | null; // PostGIS Geometry
  volume_cubic_feet: number | null;
  room_function: string | null;
  natural_light_rating: number | null;
  ventilation_type: string | null;
  flooring_material: string | null;
  wall_materials: string[] | null;
  ceiling_material: string | null;
  humidity_prone: boolean;
  water_exposure_risk: string | null;
  last_scan_id: string | null;
  scan_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Temporal fields
  version_id: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
}

export interface CoreScan {
  id: string;
  space_id: string | null;
  property_id: string;
  user_id: string;
  scan_type: string;
  scan_purpose: string | null;
  scan_date: string;
  duration_minutes: number | null;
  device_info: Record<string, any> | null;
  capture_settings: Record<string, any> | null;
  environmental_conditions: Record<string, any> | null;
  point_cloud_density: number | null;
  coverage_percentage: number | null;
  accuracy_cm: number | null;
  quality_score: number | null;
  processing_status: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_errors: Record<string, any> | null;
  raw_data_url: string | null;
  raw_data_size_bytes: number | null;
  thumbnail_url: string | null;
  scan_boundary: any | null; // PostGIS Geometry
  scan_center_point: any | null; // PostGIS Geometry
  scan_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CoreDigitalModel {
  id: string;
  primary_scan_id: string | null;
  additional_scan_ids: string[] | null;
  property_id: string;
  structure_id: string | null;
  space_id: string | null;
  model_name: string;
  model_type: string;
  model_purpose: string | null;
  model_format: string;
  storage_url: string;
  file_size_bytes: number | null;
  compression_used: string | null;
  version: number;
  fidelity_level: string;
  level_of_detail: number | null;
  vertex_count: number | null;
  face_count: number | null;
  texture_count: number | null;
  material_count: number | null;
  animation_count: number;
  bounding_box_min: any | null; // PostGIS Geometry
  bounding_box_max: any | null; // PostGIS Geometry
  model_center: any | null; // PostGIS Geometry
  scale_factor: number;
  model_embedding: number[] | null; // Vector type
  ai_analysis_results: Record<string, any> | null;
  tags: string[] | null;
  mesh_quality_score: number | null;
  geometric_accuracy_cm: number | null;
  validation_status: string;
  validation_notes: string | null;
  thumbnail_url: string | null;
  preview_images_urls: string[] | null;
  ar_ready: boolean;
  web_optimized_url: string | null;
  generation_parameters: Record<string, any> | null;
  processing_log: Record<string, any> | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Temporal fields
  version_id: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
}

export interface ReferenceParcel {
  id: string;
  parcel_id: string;
  county_id: string | null;
  assessment_year: number | null;
  legal_description: string | null;
  owner_name: string | null;
  situs_address: string | null;
  situs_city: string | null;
  situs_zip_code: string | null;
  just_value: number | null;
  land_value: number | null;
  building_value: number | null;
  improvement_value: number | null;
  agricultural_value: number | null;
  year_built: number | null;
  living_area_sqft: number | null;
  lot_size_sqft: number | null;
  frontage_feet: number | null;
  depth_feet: number | null;
  dor_use_code: string | null;
  property_appraiser_use_code: string | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  sale_qualification_code: string | null;
  latitude: number | null;
  longitude: number | null;
  county_fips: string | null;
  last_refreshed_at: string;
  source_system: string;
  raw_data_id: number | null;
}

// Temporal operation types
export interface TemporalUpdate {
  property_id: string;
  new_data: Partial<CoreProperty>;
}

export interface PropertyChange {
  version_id: string;
  changed_at: string;
  change_summary: {
    version: number;
    address_changed?: boolean;
    value_changed?: boolean;
    metadata_changed?: boolean;
    previous_value?: number;
    new_value?: number;
  };
}

// Digital Twin hierarchy type
export interface DigitalTwinHierarchy {
  property: {
    id: string;
    address: string;
    property_type: string;
    coordinates: any;
  };
  structures: Array<{
    id: string;
    name: string;
    structure_type: string;
    square_footage: number;
    spaces_count: number;
  }>;
  recent_scans: Array<{
    id: string;
    scan_date: string;
    scan_type: string;
    processing_status: string;
    quality_score: number;
  }>;
  digital_models: Array<{
    id: string;
    model_name: string;
    model_type: string;
    fidelity_level: string;
    file_size_mb: number;
    validation_status: string;
  }>;
  generated_at: string;
}

// Database schema type (for Supabase client)
export interface Database {
  core: {
    Tables: {
      properties: {
        Row: CoreProperty;
        Insert: Omit<
          CoreProperty,
          | "id"
          | "created_at"
          | "updated_at"
          | "version_id"
          | "valid_from"
          | "valid_to"
          | "is_current"
          | "full_address"
        >;
        Update: Partial<
          Omit<
            CoreProperty,
            | "id"
            | "created_at"
            | "version_id"
            | "valid_from"
            | "valid_to"
            | "is_current"
            | "full_address"
          >
        >;
      };
      structures: {
        Row: CoreStructure;
        Insert: Omit<
          CoreStructure,
          | "id"
          | "created_at"
          | "updated_at"
          | "version_id"
          | "valid_from"
          | "valid_to"
          | "is_current"
        >;
        Update: Partial<
          Omit<
            CoreStructure,
            | "id"
            | "created_at"
            | "version_id"
            | "valid_from"
            | "valid_to"
            | "is_current"
          >
        >;
      };
      spaces: {
        Row: CoreSpace;
        Insert: Omit<
          CoreSpace,
          | "id"
          | "created_at"
          | "updated_at"
          | "version_id"
          | "valid_from"
          | "valid_to"
          | "is_current"
        >;
        Update: Partial<
          Omit<
            CoreSpace,
            | "id"
            | "created_at"
            | "version_id"
            | "valid_from"
            | "valid_to"
            | "is_current"
          >
        >;
      };
      scans: {
        Row: CoreScan;
        Insert: Omit<CoreScan, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CoreScan, "id" | "created_at">>;
      };
      digital_models: {
        Row: CoreDigitalModel;
        Insert: Omit<
          CoreDigitalModel,
          | "id"
          | "created_at"
          | "updated_at"
          | "version_id"
          | "valid_from"
          | "valid_to"
          | "is_current"
        >;
        Update: Partial<
          Omit<
            CoreDigitalModel,
            | "id"
            | "created_at"
            | "version_id"
            | "valid_from"
            | "valid_to"
            | "is_current"
          >
        >;
      };
      current_properties: {
        Row: CoreProperty;
        Insert: never;
        Update: never;
      };
    };
    Functions: {
      update_property_temporal: {
        Args: { property_id: string; new_data: Record<string, any> };
        Returns: string;
      };
      get_property_at_time: {
        Args: { property_id: string; query_time: string };
        Returns: CoreProperty[];
      };
      get_property_history: {
        Args: { property_id: string };
        Returns: CoreProperty[];
      };
      get_property_changes: {
        Args: { property_id: string; since_time?: string };
        Returns: PropertyChange[];
      };
      get_property_digital_twin: {
        Args: { property_id: string };
        Returns: DigitalTwinHierarchy;
      };
      create_default_structures: {
        Args: {};
        Returns: number;
      };
      initialize_structure_spaces: {
        Args: { structure_id: string; space_config?: Record<string, any> };
        Returns: number;
      };
      refresh_current_properties: {
        Args: {};
        Returns: void;
      };
    };
  };
  reference: {
    Tables: {
      parcels: {
        Row: ReferenceParcel;
        Insert: Omit<ReferenceParcel, "id" | "last_refreshed_at">;
        Update: Partial<Omit<ReferenceParcel, "id">>;
      };
    };
    Functions: {
      etl_florida_parcels_to_reference: {
        Args: { batch_size?: number; max_batches?: number };
        Returns: {
          processed_count: number;
          error_count: number;
          sample_errors: string[];
        }[];
      };
    };
  };
}

// Re-export commonly used types
export type Property = CoreProperty;
export type Structure = CoreStructure;
export type Space = CoreSpace;
export type Scan = CoreScan;
export type DigitalModel = CoreDigitalModel;
export type Parcel = ReferenceParcel;
