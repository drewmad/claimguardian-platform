export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          level_names: string[] | null
          name: string
          points_per_level: number[]
          rewards: Json | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_names?: string[] | null
          name: string
          points_per_level: number[]
          rewards?: Json | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_names?: string[] | null
          name?: string
          points_per_level?: number[]
          rewards?: Json | null
        }
        Relationships: []
      }
      ai_forecasts: {
        Row: {
          confidence_intervals: Json | null
          created_at: string | null
          feature_id: string | null
          forecast_horizon: unknown
          forecast_timestamps: string[]
          forecast_values: number[]
          forecasting_model: string
          generated_at: string
          id: string
          mae: number | null
          mape: number | null
          metadata: Json | null
          metric_name: string
          model_name: string | null
          model_parameters: Json | null
          provider: string | null
          rmse: number | null
          training_period_end: string
          training_period_start: string
        }
        Insert: {
          confidence_intervals?: Json | null
          created_at?: string | null
          feature_id?: string | null
          forecast_horizon: unknown
          forecast_timestamps: string[]
          forecast_values: number[]
          forecasting_model?: string
          generated_at?: string
          id?: string
          mae?: number | null
          mape?: number | null
          metadata?: Json | null
          metric_name: string
          model_name?: string | null
          model_parameters?: Json | null
          provider?: string | null
          rmse?: number | null
          training_period_end: string
          training_period_start: string
        }
        Update: {
          confidence_intervals?: Json | null
          created_at?: string | null
          feature_id?: string | null
          forecast_horizon?: unknown
          forecast_timestamps?: string[]
          forecast_values?: number[]
          forecasting_model?: string
          generated_at?: string
          id?: string
          mae?: number | null
          mape?: number | null
          metadata?: Json | null
          metric_name?: string
          model_name?: string | null
          model_parameters?: Json | null
          provider?: string | null
          rmse?: number | null
          training_period_end?: string
          training_period_start?: string
        }
        Relationships: []
      }
      ai_metrics_aggregated: {
        Row: {
          avg_value: number
          count: number
          created_at: string | null
          feature_id: string | null
          id: string
          max_value: number | null
          metadata: Json | null
          metric_name: string
          min_value: number | null
          model_name: string | null
          percentile_50: number | null
          percentile_95: number | null
          percentile_99: number | null
          provider: string | null
          stddev_value: number | null
          sum_value: number
          time_bucket: string
          window_size: unknown
        }
        Insert: {
          avg_value?: number
          count?: number
          created_at?: string | null
          feature_id?: string | null
          id?: string
          max_value?: number | null
          metadata?: Json | null
          metric_name: string
          min_value?: number | null
          model_name?: string | null
          percentile_50?: number | null
          percentile_95?: number | null
          percentile_99?: number | null
          provider?: string | null
          stddev_value?: number | null
          sum_value?: number
          time_bucket: string
          window_size: unknown
        }
        Update: {
          avg_value?: number
          count?: number
          created_at?: string | null
          feature_id?: string | null
          id?: string
          max_value?: number | null
          metadata?: Json | null
          metric_name?: string
          min_value?: number | null
          model_name?: string | null
          percentile_50?: number | null
          percentile_95?: number | null
          percentile_99?: number | null
          provider?: string | null
          stddev_value?: number | null
          sum_value?: number
          time_bucket?: string
          window_size?: unknown
        }
        Relationships: []
      }
      analytics_aggregated: {
        Row: {
          active_users: number | null
          avg_response_time: number | null
          cache_hit_rate: number | null
          created_at: string | null
          error_rate: number | null
          interval: string
          model_performance: Json | null
          timestamp: string
          top_features: Json | null
          total_cost: number | null
          total_requests: number
        }
        Insert: {
          active_users?: number | null
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          created_at?: string | null
          error_rate?: number | null
          interval: string
          model_performance?: Json | null
          timestamp: string
          top_features?: Json | null
          total_cost?: number | null
          total_requests?: number
        }
        Update: {
          active_users?: number | null
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          created_at?: string | null
          error_rate?: number | null
          interval?: string
          model_performance?: Json | null
          timestamp?: string
          top_features?: Json | null
          total_cost?: number | null
          total_requests?: number
        }
        Relationships: []
      }
      community_claims: {
        Row: {
          claim_month: number | null
          claim_year: number | null
          county: string
          created_at: string | null
          damage_type: string
          days_to_settle: number | null
          id: string
          insurance_company_type: string | null
          property_type: string | null
          settlement_bracket: number | null
          state: string | null
          success_factors: Json | null
          total_samples: number | null
        }
        Insert: {
          claim_month?: number | null
          claim_year?: number | null
          county: string
          created_at?: string | null
          damage_type: string
          days_to_settle?: number | null
          id?: string
          insurance_company_type?: string | null
          property_type?: string | null
          settlement_bracket?: number | null
          state?: string | null
          success_factors?: Json | null
          total_samples?: number | null
        }
        Update: {
          claim_month?: number | null
          claim_year?: number | null
          county?: string
          created_at?: string | null
          damage_type?: string
          days_to_settle?: number | null
          id?: string
          insurance_company_type?: string | null
          property_type?: string | null
          settlement_bracket?: number | null
          state?: string | null
          success_factors?: Json | null
          total_samples?: number | null
        }
        Relationships: []
      }
      community_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          damage_type: string | null
          geographic_area: string | null
          id: string
          insight_data: Json
          insight_type: string
          sample_size: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          damage_type?: string | null
          geographic_area?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          sample_size: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          damage_type?: string | null
          geographic_area?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          sample_size?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      community_insights_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          filters_applied: Json | null
          generated_at: string | null
          id: string
          insights_data: Json
          privacy_guarantee: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          filters_applied?: Json | null
          generated_at?: string | null
          id?: string
          insights_data: Json
          privacy_guarantee: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          filters_applied?: Json | null
          generated_at?: string | null
          id?: string
          insights_data?: Json
          privacy_guarantee?: Json
        }
        Relationships: []
      }
      crisis_action_templates: {
        Row: {
          category: string
          conditions: Json | null
          created_at: string
          crisis_type: string
          dependencies: string[] | null
          description: string
          estimated_time: number
          id: string
          instructions: Json
          priority: string
          requires_assistance: boolean
          severity_max: number
          severity_min: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          conditions?: Json | null
          created_at?: string
          crisis_type: string
          dependencies?: string[] | null
          description: string
          estimated_time?: number
          id: string
          instructions?: Json
          priority: string
          requires_assistance?: boolean
          severity_max: number
          severity_min: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          conditions?: Json | null
          created_at?: string
          crisis_type?: string
          dependencies?: string[] | null
          description?: string
          estimated_time?: number
          id?: string
          instructions?: Json
          priority?: string
          requires_assistance?: boolean
          severity_max?: number
          severity_min?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_insights: {
        Row: {
          action_items: Json | null
          created_at: string
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          metadata: Json | null
          related_documents: string[] | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          related_documents?: string[] | null
          severity: string
          title: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          related_documents?: string[] | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      document_search_history: {
        Row: {
          avg_relevance_score: number | null
          created_at: string
          execution_time_ms: number | null
          filters: Json | null
          id: string
          query: string
          results_count: number
          search_mode: string
          user_id: string
        }
        Insert: {
          avg_relevance_score?: number | null
          created_at?: string
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          query: string
          results_count?: number
          search_mode: string
          user_id: string
        }
        Update: {
          avg_relevance_score?: number | null
          created_at?: string
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number
          search_mode?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          claim_id: string | null
          confidence_score: number | null
          content: string
          content_embedding: string | null
          created_at: string
          document_type: string
          extracted_entities: Json | null
          file_path: string | null
          file_size: number | null
          id: string
          key_terms: string[] | null
          mime_type: string | null
          processed_at: string | null
          property_id: string | null
          search_vector: unknown | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claim_id?: string | null
          confidence_score?: number | null
          content: string
          content_embedding?: string | null
          created_at?: string
          document_type: string
          extracted_entities?: Json | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          key_terms?: string[] | null
          mime_type?: string | null
          processed_at?: string | null
          property_id?: string | null
          search_vector?: unknown | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claim_id?: string | null
          confidence_score?: number | null
          content?: string
          content_embedding?: string | null
          created_at?: string
          document_type?: string
          extracted_entities?: Json | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          key_terms?: string[] | null
          mime_type?: string | null
          processed_at?: string | null
          property_id?: string | null
          search_vector?: unknown | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_organizations: {
        Row: {
          additional_domains: string[] | null
          address: Json | null
          ai_request_limit: number | null
          allowed_states: string[]
          billing_cycle: string
          billing_email: string | null
          branding: Json
          claim_limit: number | null
          compliance_requirements: string[] | null
          configuration: Json
          created_at: string | null
          created_by: string | null
          current_ai_requests: number | null
          current_claims: number | null
          current_properties: number | null
          current_storage_gb: number | null
          current_users: number | null
          data_region: string
          data_retention_policy: Json | null
          domain: string
          feature_flags: Json
          id: string
          integrations: Json
          ip_whitelist: string[] | null
          last_modified_by: string | null
          next_billing_date: string | null
          notes: string | null
          organization_code: string
          organization_name: string
          phone: string | null
          primary_contact_email: string
          primary_state: string
          property_limit: number | null
          require_2fa: boolean | null
          sso_configuration: Json | null
          sso_enabled: boolean | null
          sso_provider: string | null
          storage_limit_gb: number | null
          subscription_start_date: string | null
          subscription_status: string
          subscription_tier: string
          technical_contact_email: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          user_limit: number | null
        }
        Insert: {
          additional_domains?: string[] | null
          address?: Json | null
          ai_request_limit?: number | null
          allowed_states?: string[]
          billing_cycle?: string
          billing_email?: string | null
          branding?: Json
          claim_limit?: number | null
          compliance_requirements?: string[] | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          current_ai_requests?: number | null
          current_claims?: number | null
          current_properties?: number | null
          current_storage_gb?: number | null
          current_users?: number | null
          data_region?: string
          data_retention_policy?: Json | null
          domain: string
          feature_flags?: Json
          id?: string
          integrations?: Json
          ip_whitelist?: string[] | null
          last_modified_by?: string | null
          next_billing_date?: string | null
          notes?: string | null
          organization_code: string
          organization_name: string
          phone?: string | null
          primary_contact_email: string
          primary_state?: string
          property_limit?: number | null
          require_2fa?: boolean | null
          sso_configuration?: Json | null
          sso_enabled?: boolean | null
          sso_provider?: string | null
          storage_limit_gb?: number | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_tier?: string
          technical_contact_email?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Update: {
          additional_domains?: string[] | null
          address?: Json | null
          ai_request_limit?: number | null
          allowed_states?: string[]
          billing_cycle?: string
          billing_email?: string | null
          branding?: Json
          claim_limit?: number | null
          compliance_requirements?: string[] | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          current_ai_requests?: number | null
          current_claims?: number | null
          current_properties?: number | null
          current_storage_gb?: number | null
          current_users?: number | null
          data_region?: string
          data_retention_policy?: Json | null
          domain?: string
          feature_flags?: Json
          id?: string
          integrations?: Json
          ip_whitelist?: string[] | null
          last_modified_by?: string | null
          next_billing_date?: string | null
          notes?: string | null
          organization_code?: string
          organization_name?: string
          phone?: string | null
          primary_contact_email?: string
          primary_state?: string
          property_limit?: number | null
          require_2fa?: boolean | null
          sso_configuration?: Json | null
          sso_enabled?: boolean | null
          sso_provider?: string | null
          storage_limit_gb?: number | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_tier?: string
          technical_contact_email?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Relationships: []
      }
      expansion_plans: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          id: string
          milestones: Json | null
          notes: string | null
          phase: number
          resources: Json | null
          risks: Json | null
          states: string[]
          status: string | null
          timeline_end: string
          timeline_start: string
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          milestones?: Json | null
          notes?: string | null
          phase: number
          resources?: Json | null
          risks?: Json | null
          states: string[]
          status?: string | null
          timeline_end: string
          timeline_start: string
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          milestones?: Json | null
          notes?: string | null
          phase?: number
          resources?: Json | null
          risks?: Json | null
          states?: string[]
          status?: string | null
          timeline_end?: string
          timeline_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_usage_analytics: {
        Row: {
          avg_response_time: number | null
          cache_hit_rate: number | null
          date: string
          error_count: number | null
          feature_id: string
          metadata: Json | null
          total_cost: number | null
          total_requests: number | null
          unique_users: number | null
        }
        Insert: {
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          date: string
          error_count?: number | null
          feature_id: string
          metadata?: Json | null
          total_cost?: number | null
          total_requests?: number | null
          unique_users?: number | null
        }
        Update: {
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          date?: string
          error_count?: number | null
          feature_id?: string
          metadata?: Json | null
          total_cost?: number | null
          total_requests?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      model_performance_analytics: {
        Row: {
          avg_response_time: number | null
          date: string
          error_rate: number | null
          fallback_count: number | null
          metadata: Json | null
          model_name: string
          provider: string
          total_cost: number | null
          total_requests: number | null
        }
        Insert: {
          avg_response_time?: number | null
          date: string
          error_rate?: number | null
          fallback_count?: number | null
          metadata?: Json | null
          model_name: string
          provider: string
          total_cost?: number | null
          total_requests?: number | null
        }
        Update: {
          avg_response_time?: number | null
          date?: string
          error_rate?: number | null
          fallback_count?: number | null
          metadata?: Json | null
          model_name?: string
          provider?: string
          total_cost?: number | null
          total_requests?: number | null
        }
        Relationships: []
      }
      noaa_climate_records: {
        Row: {
          created_at: string | null
          departure_from_normal: number | null
          historical_rank: number | null
          id: string
          normal_value: number | null
          percentile_rank: number | null
          period: string | null
          record_date: string | null
          record_type: string | null
          station_id: string | null
          station_name: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          departure_from_normal?: number | null
          historical_rank?: number | null
          id?: string
          normal_value?: number | null
          percentile_rank?: number | null
          period?: string | null
          record_date?: string | null
          record_type?: string | null
          station_id?: string | null
          station_name?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          departure_from_normal?: number | null
          historical_rank?: number | null
          id?: string
          normal_value?: number | null
          percentile_rank?: number | null
          period?: string | null
          record_date?: string | null
          record_type?: string | null
          station_id?: string | null
          station_name?: string | null
          value?: number | null
        }
        Relationships: []
      }
      noaa_drought_monitor: {
        Row: {
          county_fips: string | null
          county_name: string | null
          created_at: string | null
          drought_level: string | null
          id: string
          impacts: string[] | null
          outlook: string | null
          percent_area: number | null
          population_affected: number | null
          state: string | null
          valid_date: string | null
        }
        Insert: {
          county_fips?: string | null
          county_name?: string | null
          created_at?: string | null
          drought_level?: string | null
          id?: string
          impacts?: string[] | null
          outlook?: string | null
          percent_area?: number | null
          population_affected?: number | null
          state?: string | null
          valid_date?: string | null
        }
        Update: {
          county_fips?: string | null
          county_name?: string | null
          created_at?: string | null
          drought_level?: string | null
          id?: string
          impacts?: string[] | null
          outlook?: string | null
          percent_area?: number | null
          population_affected?: number | null
          state?: string | null
          valid_date?: string | null
        }
        Relationships: []
      }
      noaa_fire_weather: {
        Row: {
          created_at: string | null
          fire_danger_rating: string | null
          fire_weather_watch: boolean | null
          fuel_moisture_100hr: number | null
          fuel_moisture_10hr: number | null
          fuel_moisture_1hr: number | null
          haines_index: number | null
          id: string
          keetch_byram_index: number | null
          prescribed_burn_conditions: string | null
          red_flag_warning: boolean | null
          relative_humidity: number | null
          temperature: number | null
          valid_time: string | null
          wind_speed: number | null
          zone_id: string | null
          zone_name: string | null
        }
        Insert: {
          created_at?: string | null
          fire_danger_rating?: string | null
          fire_weather_watch?: boolean | null
          fuel_moisture_100hr?: number | null
          fuel_moisture_10hr?: number | null
          fuel_moisture_1hr?: number | null
          haines_index?: number | null
          id?: string
          keetch_byram_index?: number | null
          prescribed_burn_conditions?: string | null
          red_flag_warning?: boolean | null
          relative_humidity?: number | null
          temperature?: number | null
          valid_time?: string | null
          wind_speed?: number | null
          zone_id?: string | null
          zone_name?: string | null
        }
        Update: {
          created_at?: string | null
          fire_danger_rating?: string | null
          fire_weather_watch?: boolean | null
          fuel_moisture_100hr?: number | null
          fuel_moisture_10hr?: number | null
          fuel_moisture_1hr?: number | null
          haines_index?: number | null
          id?: string
          keetch_byram_index?: number | null
          prescribed_burn_conditions?: string | null
          red_flag_warning?: boolean | null
          relative_humidity?: number | null
          temperature?: number | null
          valid_time?: string | null
          wind_speed?: number | null
          zone_id?: string | null
          zone_name?: string | null
        }
        Relationships: []
      }
      noaa_forecasts: {
        Row: {
          created_at: string | null
          detailed_forecast: string | null
          end_time: string | null
          icon_url: string | null
          id: string
          is_daytime: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          period_name: string | null
          period_number: number | null
          short_forecast: string | null
          start_time: string | null
          temperature: number | null
          temperature_trend: string | null
          temperature_unit: string | null
          wind_direction: string | null
          wind_speed: string | null
        }
        Insert: {
          created_at?: string | null
          detailed_forecast?: string | null
          end_time?: string | null
          icon_url?: string | null
          id?: string
          is_daytime?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          period_name?: string | null
          period_number?: number | null
          short_forecast?: string | null
          start_time?: string | null
          temperature?: number | null
          temperature_trend?: string | null
          temperature_unit?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Update: {
          created_at?: string | null
          detailed_forecast?: string | null
          end_time?: string | null
          icon_url?: string | null
          id?: string
          is_daytime?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          period_name?: string | null
          period_number?: number | null
          short_forecast?: string | null
          start_time?: string | null
          temperature?: number | null
          temperature_trend?: string | null
          temperature_unit?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Relationships: []
      }
      noaa_ingestion_logs: {
        Row: {
          created_at: string | null
          data_type: string
          duration_ms: number | null
          end_time: string | null
          error_details: Json | null
          id: string
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          severity_level: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          duration_ms?: number | null
          end_time?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          severity_level?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          duration_ms?: number | null
          end_time?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          severity_level?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      noaa_marine_conditions: {
        Row: {
          created_at: string | null
          dominant_wave_period: number | null
          forecast_text: string | null
          gale_warning: boolean | null
          hurricane_warning: boolean | null
          id: string
          rip_current_risk: string | null
          sea_state: string | null
          small_craft_advisory: boolean | null
          storm_warning: boolean | null
          swell_direction: number | null
          swell_height: number | null
          swell_period: number | null
          valid_time: string | null
          water_temperature: number | null
          wave_direction: number | null
          wave_height: number | null
          wave_period: number | null
          wind_direction: string | null
          wind_speed: string | null
          wind_wave_height: number | null
          zone_id: string
          zone_name: string | null
        }
        Insert: {
          created_at?: string | null
          dominant_wave_period?: number | null
          forecast_text?: string | null
          gale_warning?: boolean | null
          hurricane_warning?: boolean | null
          id?: string
          rip_current_risk?: string | null
          sea_state?: string | null
          small_craft_advisory?: boolean | null
          storm_warning?: boolean | null
          swell_direction?: number | null
          swell_height?: number | null
          swell_period?: number | null
          valid_time?: string | null
          water_temperature?: number | null
          wave_direction?: number | null
          wave_height?: number | null
          wave_period?: number | null
          wind_direction?: string | null
          wind_speed?: string | null
          wind_wave_height?: number | null
          zone_id: string
          zone_name?: string | null
        }
        Update: {
          created_at?: string | null
          dominant_wave_period?: number | null
          forecast_text?: string | null
          gale_warning?: boolean | null
          hurricane_warning?: boolean | null
          id?: string
          rip_current_risk?: string | null
          sea_state?: string | null
          small_craft_advisory?: boolean | null
          storm_warning?: boolean | null
          swell_direction?: number | null
          swell_height?: number | null
          swell_period?: number | null
          valid_time?: string | null
          water_temperature?: number | null
          wave_direction?: number | null
          wave_height?: number | null
          wave_period?: number | null
          wind_direction?: string | null
          wind_speed?: string | null
          wind_wave_height?: number | null
          zone_id?: string
          zone_name?: string | null
        }
        Relationships: []
      }
      noaa_radar_imagery: {
        Row: {
          base_reflectivity: string | null
          base_velocity: string | null
          composite_reflectivity: string | null
          echo_tops: string | null
          id: string
          one_hour_precipitation: string | null
          site_id: string | null
          site_name: string | null
          storm_relative_motion: string | null
          updated_at: string | null
        }
        Insert: {
          base_reflectivity?: string | null
          base_velocity?: string | null
          composite_reflectivity?: string | null
          echo_tops?: string | null
          id?: string
          one_hour_precipitation?: string | null
          site_id?: string | null
          site_name?: string | null
          storm_relative_motion?: string | null
          updated_at?: string | null
        }
        Update: {
          base_reflectivity?: string | null
          base_velocity?: string | null
          composite_reflectivity?: string | null
          echo_tops?: string | null
          id?: string
          one_hour_precipitation?: string | null
          site_id?: string | null
          site_name?: string | null
          storm_relative_motion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      noaa_space_weather: {
        Row: {
          affected_systems: string[] | null
          alert_type: string | null
          created_at: string | null
          description: string | null
          electron_flux: number | null
          end_time: string | null
          id: string
          impacts: string | null
          kp_index: number | null
          onset_time: string | null
          peak_time: string | null
          proton_flux: number | null
          scale_value: string | null
          severity: string | null
          solar_flux: number | null
        }
        Insert: {
          affected_systems?: string[] | null
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          electron_flux?: number | null
          end_time?: string | null
          id?: string
          impacts?: string | null
          kp_index?: number | null
          onset_time?: string | null
          peak_time?: string | null
          proton_flux?: number | null
          scale_value?: string | null
          severity?: string | null
          solar_flux?: number | null
        }
        Update: {
          affected_systems?: string[] | null
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          electron_flux?: number | null
          end_time?: string | null
          id?: string
          impacts?: string | null
          kp_index?: number | null
          onset_time?: string | null
          peak_time?: string | null
          proton_flux?: number | null
          scale_value?: string | null
          severity?: string | null
          solar_flux?: number | null
        }
        Relationships: []
      }
      noaa_tide_and_current_data: {
        Row: {
          created_at: string | null
          current_direction: number | null
          current_speed: number | null
          data_type: string | null
          datum: string | null
          id: string
          metadata: Json | null
          observation_time: string
          quality: string | null
          salinity: number | null
          station_id: string
          station_name: string | null
          water_level: number | null
          water_temperature: number | null
        }
        Insert: {
          created_at?: string | null
          current_direction?: number | null
          current_speed?: number | null
          data_type?: string | null
          datum?: string | null
          id?: string
          metadata?: Json | null
          observation_time: string
          quality?: string | null
          salinity?: number | null
          station_id: string
          station_name?: string | null
          water_level?: number | null
          water_temperature?: number | null
        }
        Update: {
          created_at?: string | null
          current_direction?: number | null
          current_speed?: number | null
          data_type?: string | null
          datum?: string | null
          id?: string
          metadata?: Json | null
          observation_time?: string
          quality?: string | null
          salinity?: number | null
          station_id?: string
          station_name?: string | null
          water_level?: number | null
          water_temperature?: number | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channels: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_template: string | null
          type: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          channels?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_template?: string | null
          type: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          channels?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string | null
          type?: string
          variables?: Json | null
        }
        Relationships: []
      }
      organization_billing: {
        Row: {
          ai_requests_count: number
          base_cost: number
          billing_period_end: string
          billing_period_start: string
          claims_count: number
          created_at: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string
          organization_id: string
          overage_costs: Json | null
          paid_date: string | null
          properties_count: number
          storage_gb: number
          total_cost: number
          updated_at: string | null
          users_count: number
        }
        Insert: {
          ai_requests_count?: number
          base_cost?: number
          billing_period_end: string
          billing_period_start: string
          claims_count?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string
          organization_id: string
          overage_costs?: Json | null
          paid_date?: string | null
          properties_count?: number
          storage_gb?: number
          total_cost?: number
          updated_at?: string | null
          users_count?: number
        }
        Update: {
          ai_requests_count?: number
          base_cost?: number
          billing_period_end?: string
          billing_period_start?: string
          claims_count?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string
          organization_id?: string
          overage_costs?: Json | null
          paid_date?: string | null
          properties_count?: number
          storage_gb?: number
          total_cost?: number
          updated_at?: string | null
          users_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "enterprise_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_customizations: {
        Row: {
          api_keys: Json | null
          approval_workflows: Json | null
          audit_settings: Json | null
          claim_workflow: Json | null
          created_at: string | null
          created_by: string | null
          custom_css: string | null
          data_export_settings: Json | null
          disabled_features: string[] | null
          enabled_features: string[] | null
          external_integrations: Json | null
          favicon_url: string | null
          feature_limits: Json | null
          id: string
          logo_url: string | null
          notification_preferences: Json | null
          organization_id: string
          security_policies: Json | null
          theme: Json | null
          updated_at: string | null
          webhook_urls: Json | null
        }
        Insert: {
          api_keys?: Json | null
          approval_workflows?: Json | null
          audit_settings?: Json | null
          claim_workflow?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          data_export_settings?: Json | null
          disabled_features?: string[] | null
          enabled_features?: string[] | null
          external_integrations?: Json | null
          favicon_url?: string | null
          feature_limits?: Json | null
          id?: string
          logo_url?: string | null
          notification_preferences?: Json | null
          organization_id: string
          security_policies?: Json | null
          theme?: Json | null
          updated_at?: string | null
          webhook_urls?: Json | null
        }
        Update: {
          api_keys?: Json | null
          approval_workflows?: Json | null
          audit_settings?: Json | null
          claim_workflow?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          data_export_settings?: Json | null
          disabled_features?: string[] | null
          enabled_features?: string[] | null
          external_integrations?: Json | null
          favicon_url?: string | null
          feature_limits?: Json | null
          id?: string
          logo_url?: string | null
          notification_preferences?: Json | null
          organization_id?: string
          security_policies?: Json | null
          theme?: Json | null
          updated_at?: string | null
          webhook_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_customizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "enterprise_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          commission_details: Json | null
          commission_type: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          disclosure_text: string
          email: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          provider_type: string
          rating: number | null
          review_count: number | null
          service_areas: Json | null
          specialties: Json | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          commission_details?: Json | null
          commission_type?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          disclosure_text: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          provider_type: string
          rating?: number | null
          review_count?: number | null
          service_areas?: Json | null
          specialties?: Json | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          commission_details?: Json | null
          commission_type?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          disclosure_text?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          provider_type?: string
          rating?: number | null
          review_count?: number | null
          service_areas?: Json | null
          specialties?: Json | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      state_configurations: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_load_status: Json | null
          data_sources: Json
          deployment_status: string | null
          features: Json
          id: string
          insurance_regulations: Json
          is_active: boolean | null
          last_modified_by: string | null
          launch_date: string | null
          market_data: Json
          migration_complete: boolean | null
          notes: string | null
          operations: Json
          state_code: string
          state_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_load_status?: Json | null
          data_sources?: Json
          deployment_status?: string | null
          features?: Json
          id?: string
          insurance_regulations?: Json
          is_active?: boolean | null
          last_modified_by?: string | null
          launch_date?: string | null
          market_data?: Json
          migration_complete?: boolean | null
          notes?: string | null
          operations?: Json
          state_code: string
          state_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_load_status?: Json | null
          data_sources?: Json
          deployment_status?: string | null
          features?: Json
          id?: string
          insurance_regulations?: Json
          is_active?: boolean | null
          last_modified_by?: string | null
          launch_date?: string | null
          market_data?: Json
          migration_complete?: boolean | null
          notes?: string | null
          operations?: Json
          state_code?: string
          state_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_configurations_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: true
            referencedRelation: "expansion_dashboard_summary"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "state_configurations_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: true
            referencedRelation: "us_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      state_data_sources: {
        Row: {
          activated_at: string | null
          authentication: Json | null
          cost_structure: Json | null
          created_at: string | null
          created_by: string | null
          data_format: string | null
          data_quality_score: number | null
          data_volume_estimate: number | null
          deactivated_at: string | null
          endpoint_url: string | null
          id: string
          integration_type: string
          last_successful_sync: string | null
          notes: string | null
          provider_contact: Json | null
          provider_name: string
          reliability_score: number | null
          source_type: string
          state_code: string
          status: string | null
          sync_failure_count: number | null
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          authentication?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_format?: string | null
          data_quality_score?: number | null
          data_volume_estimate?: number | null
          deactivated_at?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type: string
          last_successful_sync?: string | null
          notes?: string | null
          provider_contact?: Json | null
          provider_name: string
          reliability_score?: number | null
          source_type: string
          state_code: string
          status?: string | null
          sync_failure_count?: number | null
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          authentication?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_format?: string | null
          data_quality_score?: number | null
          data_volume_estimate?: number | null
          deactivated_at?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type?: string
          last_successful_sync?: string | null
          notes?: string | null
          provider_contact?: Json | null
          provider_name?: string
          reliability_score?: number | null
          source_type?: string
          state_code?: string
          status?: string | null
          sync_failure_count?: number | null
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_data_sources_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "expansion_dashboard_summary"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "state_data_sources_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "us_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      state_deployment_tracking: {
        Row: {
          actual_effort_hours: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          assigned_team: string | null
          blocking_tasks: string[] | null
          budget_allocated: number | null
          budget_spent: number | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          current_issues: Json | null
          dependencies: string[] | null
          deployment_phase: string
          estimated_effort_hours: number | null
          id: string
          last_updated_by: string | null
          mitigation_actions: Json | null
          notes: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          risk_level: string | null
          state_code: string
          status: string | null
          task_category: string | null
          task_description: string | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          actual_effort_hours?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_team?: string | null
          blocking_tasks?: string[] | null
          budget_allocated?: number | null
          budget_spent?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          current_issues?: Json | null
          dependencies?: string[] | null
          deployment_phase: string
          estimated_effort_hours?: number | null
          id?: string
          last_updated_by?: string | null
          mitigation_actions?: Json | null
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          risk_level?: string | null
          state_code: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          actual_effort_hours?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_team?: string | null
          blocking_tasks?: string[] | null
          budget_allocated?: number | null
          budget_spent?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          current_issues?: Json | null
          dependencies?: string[] | null
          deployment_phase?: string
          estimated_effort_hours?: number | null
          id?: string
          last_updated_by?: string | null
          mitigation_actions?: Json | null
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          risk_level?: string | null
          state_code?: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_deployment_tracking_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "expansion_dashboard_summary"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "state_deployment_tracking_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "us_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      state_market_analysis: {
        Row: {
          addressable_market: number | null
          analysis_date: string
          analyst: string | null
          competitive_advantages: Json | null
          confidence_score: number | null
          created_at: string | null
          current_penetration: number | null
          customer_acquisition_cost: number | null
          customer_segments: Json | null
          economic_indicators: Json | null
          id: string
          lifetime_value: number | null
          major_competitors: Json | null
          market_entry_strategy: string | null
          market_leaders: Json | null
          market_maturity: string | null
          market_risks: Json | null
          marketing_strategy: string | null
          notes: string | null
          operational_risks: Json | null
          pricing_strategy: Json | null
          recommended_features: Json | null
          regulatory_complexity: string | null
          regulatory_risks: Json | null
          seasonal_factors: Json | null
          state_code: string
          target_demographics: Json | null
          target_penetration: number | null
          threats: Json | null
          total_market_size: number | null
          updated_at: string | null
        }
        Insert: {
          addressable_market?: number | null
          analysis_date: string
          analyst?: string | null
          competitive_advantages?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          current_penetration?: number | null
          customer_acquisition_cost?: number | null
          customer_segments?: Json | null
          economic_indicators?: Json | null
          id?: string
          lifetime_value?: number | null
          major_competitors?: Json | null
          market_entry_strategy?: string | null
          market_leaders?: Json | null
          market_maturity?: string | null
          market_risks?: Json | null
          marketing_strategy?: string | null
          notes?: string | null
          operational_risks?: Json | null
          pricing_strategy?: Json | null
          recommended_features?: Json | null
          regulatory_complexity?: string | null
          regulatory_risks?: Json | null
          seasonal_factors?: Json | null
          state_code: string
          target_demographics?: Json | null
          target_penetration?: number | null
          threats?: Json | null
          total_market_size?: number | null
          updated_at?: string | null
        }
        Update: {
          addressable_market?: number | null
          analysis_date?: string
          analyst?: string | null
          competitive_advantages?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          current_penetration?: number | null
          customer_acquisition_cost?: number | null
          customer_segments?: Json | null
          economic_indicators?: Json | null
          id?: string
          lifetime_value?: number | null
          major_competitors?: Json | null
          market_entry_strategy?: string | null
          market_leaders?: Json | null
          market_maturity?: string | null
          market_risks?: Json | null
          marketing_strategy?: string | null
          notes?: string | null
          operational_risks?: Json | null
          pricing_strategy?: Json | null
          recommended_features?: Json | null
          regulatory_complexity?: string | null
          regulatory_risks?: Json | null
          seasonal_factors?: Json | null
          state_code?: string
          target_demographics?: Json | null
          target_penetration?: number | null
          threats?: Json | null
          total_market_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_market_analysis_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "expansion_dashboard_summary"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "state_market_analysis_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "us_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      state_regulatory_requirements: {
        Row: {
          advance_notice_days: number | null
          application_date: string | null
          application_process: string | null
          approval_date: string | null
          compliance_status: string | null
          contact_information: Json | null
          created_at: string | null
          created_by: string | null
          dependent_requirements: string[] | null
          description: string | null
          expiry_date: string | null
          fees: Json | null
          id: string
          is_mandatory: boolean | null
          issuing_authority: string
          notes: string | null
          prerequisites: string[] | null
          processing_time_days: number | null
          renewal_required: boolean | null
          required_documents: string[] | null
          requirement_name: string
          requirement_type: string
          state_code: string
          updated_at: string | null
          validity_period_days: number | null
        }
        Insert: {
          advance_notice_days?: number | null
          application_date?: string | null
          application_process?: string | null
          approval_date?: string | null
          compliance_status?: string | null
          contact_information?: Json | null
          created_at?: string | null
          created_by?: string | null
          dependent_requirements?: string[] | null
          description?: string | null
          expiry_date?: string | null
          fees?: Json | null
          id?: string
          is_mandatory?: boolean | null
          issuing_authority: string
          notes?: string | null
          prerequisites?: string[] | null
          processing_time_days?: number | null
          renewal_required?: boolean | null
          required_documents?: string[] | null
          requirement_name: string
          requirement_type: string
          state_code: string
          updated_at?: string | null
          validity_period_days?: number | null
        }
        Update: {
          advance_notice_days?: number | null
          application_date?: string | null
          application_process?: string | null
          approval_date?: string | null
          compliance_status?: string | null
          contact_information?: Json | null
          created_at?: string | null
          created_by?: string | null
          dependent_requirements?: string[] | null
          description?: string | null
          expiry_date?: string | null
          fees?: Json | null
          id?: string
          is_mandatory?: boolean | null
          issuing_authority?: string
          notes?: string | null
          prerequisites?: string[] | null
          processing_time_days?: number | null
          renewal_required?: boolean | null
          required_documents?: string[] | null
          requirement_name?: string
          requirement_type?: string
          state_code?: string
          updated_at?: string | null
          validity_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "state_regulatory_requirements_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "expansion_dashboard_summary"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "state_regulatory_requirements_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "us_states"
            referencedColumns: ["state_code"]
          },
        ]
      }
      system_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      us_states: {
        Row: {
          created_at: string | null
          gdp: number | null
          insurance_market_size: number | null
          population: number | null
          region: string
          state_code: string
          state_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gdp?: number | null
          insurance_market_size?: number | null
          population?: number | null
          region: string
          state_code: string
          state_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gdp?: number | null
          insurance_market_size?: number | null
          population?: number | null
          region?: string
          state_code?: string
          state_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          created_at: string | null
          damage_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          success_criteria: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          damage_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps: Json
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          damage_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          template_id: string | null
          trigger_config: Json
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_id?: string | null
          trigger_config: Json
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_id?: string | null
          trigger_config?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cost_analysis: {
        Row: {
          avg_cache_hit_rate: number | null
          avg_response_time: number | null
          daily_cost: number | null
          daily_requests: number | null
          date: string | null
        }
        Relationships: []
      }
      expansion_dashboard_summary: {
        Row: {
          active_data_sources: number | null
          avg_deployment_progress: number | null
          deployment_status: string | null
          has_recent_market_analysis: boolean | null
          insurance_market_size: number | null
          is_active: boolean | null
          last_updated: string | null
          population: number | null
          region: string | null
          regulatory_compliance_count: number | null
          state_code: string | null
          state_name: string | null
        }
        Relationships: []
      }
      partition_status: {
        Row: {
          estimated_rows: number | null
          partition_name: unknown | null
          partition_type: string | null
          schema_name: unknown | null
          size: string | null
          table_name: unknown | null
        }
        Relationships: []
      }
      real_time_metrics: {
        Row: {
          active_users: number | null
          avg_response_time: number | null
          cache_hit_rate: number | null
          error_rate: number | null
          interval: string | null
          timestamp: string | null
          total_cost: number | null
          total_requests: number | null
        }
        Insert: {
          active_users?: number | null
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          error_rate?: number | null
          interval?: string | null
          timestamp?: string | null
          total_cost?: number | null
          total_requests?: number | null
        }
        Update: {
          active_users?: number | null
          avg_response_time?: number | null
          cache_hit_rate?: number | null
          error_rate?: number | null
          interval?: string | null
          timestamp?: string | null
          total_cost?: number | null
          total_requests?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_ai_metrics: {
        Args: { lookback_period?: unknown; window_interval?: unknown }
        Returns: undefined
      }
      analyze_partition_stats: {
        Args: { table_pattern: string }
        Returns: {
          size_pretty: string
          row_count: number
          partition_name: string
          last_analyzed: string
          size_bytes: number
        }[]
      }
      anonymize_claim_for_community: {
        Args: { claim_id: string }
        Returns: undefined
      }
      award_achievement_points: {
        Args: { p_event_type: string; p_points: number; p_user_id: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_optimal_send_time: {
        Args: { urgency: number; user_id: string }
        Returns: string
      }
      check_extension_exists: {
        Args: { extension_name: string }
        Returns: boolean
      }
      check_organization_limit: {
        Args: { limit_type: string; org_id: string }
        Returns: boolean
      }
      cleanup_expired_insights_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_intelligence_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_analytics_partitions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_analytics_partition: {
        Args: { partition_date: string }
        Returns: undefined
      }
      create_organization_schema: {
        Args: { org_code: string }
        Returns: boolean
      }
      detect_ai_anomalies: {
        Args: { lookback_hours?: number; sensitivity?: number }
        Returns: number
      }
      drop_old_partitions: {
        Args: { retention_days?: number }
        Returns: undefined
      }
      estimate_sync_completion: {
        Args: { sync_id: string }
        Returns: string
      }
      execute_raw_sql: {
        Args: { params?: string[]; query: string }
        Returns: Json
      }
      find_nearest_weather_station: {
        Args: { max_distance_km?: number; user_lat: number; user_lon: number }
        Returns: {
          distance_km: number
          station_id: string
          station_name: string
        }[]
      }
      generate_document_insights: {
        Args: { p_user_id: string }
        Returns: {
          insight_type: string
          related_documents: string[]
          action_items: Json
          description: string
          severity: string
          title: string
        }[]
      }
      get_aggregated_insights: {
        Args: {
          p_county_region?: string
          p_damage_type?: string
          p_min_sample_size?: number
          p_months_back?: number
        }
        Returns: {
          sample_size: number
          damage_type: string
          avg_settlement_bucket: string
          avg_time_bucket: string
          success_rate: number
          region: string
        }[]
      }
      get_expansion_readiness: {
        Args: { target_state_code: string }
        Returns: {
          technical_score: number
          blockers: string[]
          operational_score: number
          state_code: string
          readiness_score: number
          market_score: number
          regulatory_score: number
          recommendations: string[]
        }[]
      }
      get_extraction_statistics: {
        Args: { p_days?: number; p_user_id?: string }
        Returns: {
          total_extractions: number
          most_used_model: string
          most_used_provider: string
          total_fields_extracted: number
          auto_applied_count: number
          review_required_count: number
          successful_extractions: number
          average_processing_time_ms: number
          average_confidence: number
          failed_extractions: number
        }[]
      }
      get_property_intelligence_summary: {
        Args: { p_property_id: string }
        Returns: Json
      }
      get_session_completion_percentage: {
        Args: { session_uuid: string }
        Returns: number
      }
      get_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_feature_usage: {
        Args: {
          p_cache_hit: boolean
          p_cost: number
          p_error: boolean
          p_feature_id: string
          p_response_time: number
          p_user_id?: string
        }
        Returns: undefined
      }
      initialize_organization: {
        Args: {
          domain: string
          org_code: string
          org_name: string
          owner_email: string
          subscription_tier?: string
        }
        Returns: string
      }
      is_property_in_alert_zone: {
        Args: { property_lat: number; property_lon: number }
        Returns: {
          event_id: string
          expires: string
          headline: string
          severity: string
          event_type: string
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_error: {
        Args: {
          p_context?: Json
          p_error_code: string
          p_error_message: string
          p_error_stack?: string
          p_error_type: string
          p_severity?: string
          p_url?: string
          p_user_agent?: string
        }
        Returns: string
      }
      maintenance_cleanup_maps_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      properties_in_hurricane_path: {
        Args: { storm_id_param: string }
        Returns: {
          address: string
          property_id: string
          distance_from_center: number
          wind_speed_category: string
          surge_risk: string
        }[]
      }
      refresh_ai_metrics_realtime: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_expansion_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      semantic_document_search: {
        Args: {
          match_count?: number
          p_user_id?: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          similarity: number
          property_id: string
          claim_id: string
          created_at: string
          file_size: number
          extracted_entities: Json
          key_terms: string[]
          document_type: string
          content: string
          title: string
          id: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_organization_usage: {
        Args: { increment_by?: number; org_id: string; usage_type: string }
        Returns: boolean
      }
      update_policy_extraction: {
        Args: { p_document_id: string; p_extracted_data: Json }
        Returns: undefined
      }
      update_state_configuration: {
        Args: { config_data: Json; target_state_code: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      api_execution_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cached"
      api_execution_trigger:
        | "onboarding"
        | "scheduled"
        | "storm_event"
        | "claim_filing"
        | "manual"
      error_log_status: "new" | "acknowledged" | "resolved" | "ignored"
      maps_api_type:
        | "address_validation"
        | "aerial_roof"
        | "weather_claims"
        | "environmental"
        | "maps_static"
        | "street_view"
        | "solar"
        | "unified_intelligence"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_execution_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cached",
      ],
      api_execution_trigger: [
        "onboarding",
        "scheduled",
        "storm_event",
        "claim_filing",
        "manual",
      ],
      error_log_status: ["new", "acknowledged", "resolved", "ignored"],
      maps_api_type: [
        "address_validation",
        "aerial_roof",
        "weather_claims",
        "environmental",
        "maps_static",
        "street_view",
        "solar",
        "unified_intelligence",
      ],
    },
  },
} as const

