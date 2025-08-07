/**
 * @fileMetadata
 * @purpose "TypeScript type definitions for Google Maps Intelligence database schema"
 * @dependencies []
 * @owner maps-intelligence-team
 * @status stable
 */

// =====================================================
// Database Enum Types
// =====================================================

export type ApiExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cached";

export type ApiExecutionTrigger =
  | "onboarding"
  | "scheduled"
  | "storm_event"
  | "claim_filing"
  | "manual";

export type MapsApiType =
  | "address_validation"
  | "aerial_roof"
  | "weather_claims"
  | "environmental"
  | "maps_static"
  | "street_view"
  | "solar"
  | "unified_intelligence";

// =====================================================
// Core Database Table Types
// =====================================================

export interface Property {
  id: string;
  user_id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export interface MapsApiExecution {
  id: string;
  property_id: string;
  api_type: MapsApiType;
  execution_trigger: ApiExecutionTrigger;
  status: ApiExecutionStatus;

  // Request tracking
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  error_details?: Record<string, unknown>;

  // Performance metrics
  execution_time_ms?: number;
  api_cost_usd?: number;
  cached_result: boolean;
  cache_key?: string;

  // Scheduling metadata
  scheduled_at?: string;
  executed_at?: string;
  expires_at?: string;
  retry_count: number;

  // Audit trail
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// =====================================================
// Address Intelligence Types
// =====================================================

export interface AddressIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Validation results
  is_valid?: boolean;
  confidence_score?: number; // 0-100
  validation_verdict?: string;

  // Standardized address
  formatted_address?: string;
  address_components?: Record<string, unknown>;
  postal_address?: Record<string, unknown>;
  usps_data?: Record<string, unknown>;

  // Geocoding
  geocode_lat?: number;
  geocode_lng?: number;
  geocode_accuracy?: string;
  place_id?: string;

  // Risk assessment
  flood_zone?: string;
  hurricane_risk?: "low" | "moderate" | "high" | "extreme";
  coastal_proximity_miles?: number;
  elevation_risk?: "low" | "moderate" | "high";
  insurance_considerations?: string[];

  // Property intelligence
  property_type?: string;
  estimated_value?: number;
  building_age?: number;
  lot_size?: number;
  nearby_risks?: string[];
  accessibility_notes?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// Weather Intelligence Types
// =====================================================

export interface WeatherIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Weather data
  current_weather?: Record<string, unknown>;
  historical_data?: Record<string, unknown>;
  date_range_start?: string;
  date_range_end?: string;

  // Claims correlation
  claim_date?: string;
  correlation_probability?: number; // 0.00-100.00
  weather_events?: Record<string, unknown>;
  risk_factors?: string[];
  correlation_recommendation?: string;

  // Risk assessment
  flood_risk_score?: number; // 0-100
  wind_risk_score?: number; // 0-100
  hail_risk_score?: number; // 0-100
  hurricane_risk_score?: number; // 0-100
  seasonal_factors?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// Aerial Intelligence Types
// =====================================================

export interface AerialIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Analysis metadata
  analysis_type: string;
  imagery_date?: Record<string, unknown>;

  // Imagery URLs
  satellite_image_url?: string;
  oblique_image_url?: string;
  historical_image_urls?: string[];

  // Roof condition
  roof_area_sqft?: number;
  roof_material?: string;
  roof_condition?: "excellent" | "good" | "fair" | "poor" | "damaged";
  roof_age_estimate?: number;
  maintenance_needed?: string[];

  // Damage assessment
  damage_percentage?: number;
  damage_types?: string[];
  affected_areas?: string[];
  repair_estimate_min?: number;
  repair_estimate_max?: number;
  repair_priority?: "immediate" | "urgent" | "scheduled" | "cosmetic";
  insurance_recommendation?: string;

  // Solar potential
  solar_viable_area_sqft?: number;
  annual_energy_potential?: number;
  estimated_solar_panels?: number;
  potential_savings?: number;
  roof_obstacles?: string[];

  // Structural analysis
  foundation_visible?: boolean;
  property_additions?: string[];
  property_boundaries?: Record<string, unknown>; // GeoJSON
  building_footprint_sqft?: number;
  structural_concerns?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// Environmental Intelligence Types
// =====================================================

export interface EnvironmentalIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Pollen data
  pollen_forecast?: Record<string, unknown>;
  pollen_risk_level?: "low" | "moderate" | "high" | "very-high";
  pollen_recommendations?: string[];

  // Air quality data
  air_quality_aqi?: number;
  air_quality_category?: string;
  air_pollutants?: Record<string, unknown>;
  health_recommendations?: string[];

  // Timezone data
  timezone_id?: string;
  timezone_name?: string;
  utc_offset_seconds?: number;
  dst_offset_seconds?: number;
  current_local_time?: string;

  // Elevation data
  elevation_meters?: number;
  elevation_flood_risk?: "low" | "moderate" | "high";
  drainage_assessment?: string;

  // Distance matrix
  distance_destinations?: Record<string, unknown>;
  nearest_services?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Street View Intelligence Types
// =====================================================

export interface StreetViewIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Metadata
  analysis_type: string;
  street_view_available?: boolean;
  panorama_id?: string;
  imagery_date?: string;
  imagery_copyright?: string;

  // View URLs
  primary_view_url?: string;
  front_view_url?: string;
  left_view_url?: string;
  right_view_url?: string;
  rear_view_url?: string;

  // Property analysis
  roof_visible?: boolean;
  siding_material?: string;
  siding_condition?: "excellent" | "good" | "fair" | "poor";
  siding_damage_visible?: boolean;
  windows_count?: number;
  windows_condition?: string;
  hurricane_protection_visible?: boolean;

  // Landscaping
  landscaping_maturity?: "new" | "established" | "mature";
  landscaping_maintenance?: "well-maintained" | "average" | "neglected";
  landscaping_risk_factors?: string[];

  // Accessibility
  driveway_type?: string;
  driveway_condition?: string;
  driveway_width?: string;
  walkway_material?: string;
  walkway_condition?: string;
  parking_type?: string;
  parking_capacity?: number;

  // Damage documentation
  visible_damage?: Record<string, unknown>;
  before_image_url?: string;
  after_image_url?: string;
  recommended_angles?: Record<string, unknown>;

  // Neighborhood context
  surrounding_properties?: Record<string, unknown>;
  street_surface_type?: string;
  street_condition?: string;
  drainage_visible?: boolean;
  fire_hydrant_visible?: boolean;
  street_width?: string;
  access_obstructions?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// Solar Intelligence Types
// =====================================================

export interface SolarIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Building insights
  building_name?: string;
  building_center_lat?: number;
  building_center_lng?: number;
  building_postal_code?: string;
  administrative_area?: string;
  imagery_date?: Record<string, unknown>;

  // Solar potential
  max_array_panels_count?: number;
  max_array_area_m2?: number;
  max_sunshine_hours_per_year?: number;
  carbon_offset_factor?: number;
  whole_roof_area_m2?: number;
  whole_roof_sunshine_quantiles?: number[];
  roof_segments?: Record<string, unknown>;

  // Panel specs
  panel_capacity_watts?: number;
  panel_height_meters?: number;
  panel_width_meters?: number;
  panel_lifetime_years?: number;

  // Financial analysis
  monthly_bill_amount?: number;
  average_kwh_per_month?: number;
  installation_cost?: number;
  maintenance_cost?: number;
  annual_savings?: number;
  total_savings_20_years?: number;
  payback_years?: number;
  roi_percentage?: number;

  // Incentives
  federal_tax_credit?: number;
  state_incentives?: number;
  utility_incentives?: number;
  financing_options?: Record<string, unknown>;

  // Environmental impact
  carbon_offset_yearly_lbs?: number;
  carbon_offset_lifetime_lbs?: number;
  equivalent_trees_planted?: number;
  gas_car_miles_offset?: number;
  sustainability_score?: number; // 0-100

  // Roof suitability
  roof_suitability?: "excellent" | "good" | "fair" | "poor";
  installation_challenges?: string[];
  installation_recommendations?: string[];
  maintenance_factors?: string[];

  // Property value impact
  estimated_value_increase?: number;
  property_value_percentage_increase?: number;
  market_appeal_factors?: string[];
  resale_considerations?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// Static Maps Intelligence Types
// =====================================================

export interface StaticMapsIntelligence {
  id: string;
  property_id: string;
  execution_id: string;

  // Analysis metadata
  analysis_type: string;
  map_type: string;

  // Primary map
  primary_map_url: string;
  primary_map_analysis?: string;
  primary_map_insights?: string[];

  // Contextual maps
  overview_map_url?: string;
  satellite_map_url?: string;
  terrain_map_url?: string;
  annotated_map_url?: string;

  // Property analysis
  property_boundaries?: Record<string, unknown>; // GeoJSON
  nearby_structures?: Record<string, unknown>;
  access_points?: Record<string, unknown>;
  landscape_features?: string[];

  // Risk visualization
  flood_zones_map_url?: string;
  hurricane_evacuation_map_url?: string;
  emergency_services?: Record<string, unknown>;

  // Claims context
  before_storm_map_url?: string;
  after_storm_map_url?: string;
  damage_markers?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Unified Intelligence Cache Types
// =====================================================

export interface UnifiedIntelligenceCache {
  id: string;
  property_id: string;

  // Cache metadata
  cache_key: string;
  cache_type: string;
  apis_included: MapsApiType[];

  // Cached data
  unified_data: Record<string, unknown>;
  individual_results?: Record<string, unknown>;

  // Cache management
  created_at: string;
  expires_at: string;
  hit_count: number;
  last_accessed_at: string;
}

// =====================================================
// API Usage Statistics Types
// =====================================================

export interface MapsApiUsageStats {
  id: string;
  user_id?: string;
  property_id?: string;

  // Usage tracking
  date: string;
  api_type: MapsApiType;
  call_count: number;
  total_cost_usd: number;
  total_execution_time_ms: number;

  // Performance metrics
  average_response_time_ms?: number;
  cache_hit_rate?: number; // 0.0000-1.0000
  error_rate?: number; // 0.0000-1.0000

  created_at: string;
  updated_at: string;
}

// =====================================================
// Service Layer Types (for API responses)
// =====================================================

export interface PropertyIntelligenceSummary {
  property_id: string;
  address: string;
  last_updated: string;
  intelligence_types: {
    address_validation: boolean;
    weather_analysis: boolean;
    aerial_analysis: boolean;
    environmental_data: boolean;
    street_view_data: boolean;
    solar_analysis: boolean;
    static_maps_data: boolean;
  };
}

export interface IntelligenceQueryOptions {
  property_id: string;
  api_types?: MapsApiType[];
  date_range?: {
    start: string;
    end: string;
  };
  include_cache?: boolean;
  max_age_hours?: number;
}

export interface IntelligenceResponse<T = unknown> {
  success: boolean;
  data?: T;
  cached?: boolean;
  cache_key?: string;
  execution_time_ms?: number;
  api_cost_usd?: number;
  error?: string;
  timestamp: string;
}

// =====================================================
// Batch Processing Types
// =====================================================

export interface BatchIntelligenceRequest {
  property_ids: string[];
  api_types: MapsApiType[];
  execution_trigger: ApiExecutionTrigger;
  options?: {
    max_concurrent?: number;
    timeout_ms?: number;
    retry_failed?: boolean;
  };
}

export interface BatchIntelligenceResult {
  total_properties: number;
  successful_executions: number;
  failed_executions: number;
  cached_results: number;
  total_cost_usd: number;
  total_execution_time_ms: number;
  results: Array<{
    property_id: string;
    api_type: MapsApiType;
    status: ApiExecutionStatus;
    error?: string;
  }>;
}

// =====================================================
// Utility Types
// =====================================================

export type IntelligenceTableType =
  | AddressIntelligence
  | WeatherIntelligence
  | AerialIntelligence
  | EnvironmentalIntelligence
  | StreetViewIntelligence
  | SolarIntelligence
  | StaticMapsIntelligence;

export type IntelligenceTableName =
  | "address_intelligence"
  | "weather_intelligence"
  | "aerial_intelligence"
  | "environmental_intelligence"
  | "street_view_intelligence"
  | "solar_intelligence"
  | "static_maps_intelligence";

// =====================================================
// Service Configuration Types
// =====================================================

export interface MapsIntelligenceConfig {
  google_maps_api_key: string;
  cache_ttl_hours: number;
  max_concurrent_requests: number;
  rate_limit_per_minute: number;
  cost_limit_per_day_usd: number;
  enable_mock_data: boolean;
  florida_specific_optimizations: boolean;
}

export interface ApiScheduleConfig {
  onboarding_apis: MapsApiType[];
  scheduled_apis: Array<{
    api_type: MapsApiType;
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    conditions?: string[]; // e.g., ['hurricane_season', 'coastal_property']
  }>;
  event_driven_apis: Array<{
    api_type: MapsApiType;
    triggers: ApiExecutionTrigger[];
  }>;
}
