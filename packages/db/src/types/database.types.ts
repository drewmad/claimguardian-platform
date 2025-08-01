export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          analysis_type: string
          created_at: string | null
          id: string
          input_data: Json | null
          processing_time_ms: number | null
          result_data: Json | null
          status: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          id?: string
          input_data?: Json | null
          processing_time_ms?: number | null
          result_data?: Json | null
          status?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          id?: string
          input_data?: Json | null
          processing_time_ms?: number | null
          result_data?: Json | null
          status?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          adjuster_company: string | null
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          ai_coverage_analysis: Json | null
          ai_damage_assessment: Json | null
          ai_recommendations: Json | null
          approval_date: string | null
          approved_amount: number | null
          claim_number: string | null
          closed_date: string | null
          created_at: string | null
          damage_severity: Database["public"]["Enums"]["damage_severity"] | null
          damage_type: string
          date_of_loss: string
          date_reported: string | null
          deductible_applied: number | null
          description: string | null
          estimated_value: number | null
          external_claim_number: string | null
          id: string
          inspection_date: string | null
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          photos: Json | null
          policy_id: string | null
          property_id: string | null
          settled_value: number | null
          settlement_date: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents: Json | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          adjuster_company?: string | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_coverage_analysis?: Json | null
          ai_damage_assessment?: Json | null
          ai_recommendations?: Json | null
          approval_date?: string | null
          approved_amount?: number | null
          claim_number?: string | null
          closed_date?: string | null
          created_at?: string | null
          damage_severity?:
            | Database["public"]["Enums"]["damage_severity"]
            | null
          damage_type: string
          date_of_loss: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          external_claim_number?: string | null
          id?: string
          inspection_date?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          photos?: Json | null
          policy_id?: string | null
          property_id?: string | null
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          adjuster_company?: string | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_coverage_analysis?: Json | null
          ai_damage_assessment?: Json | null
          ai_recommendations?: Json | null
          approval_date?: string | null
          approved_amount?: number | null
          claim_number?: string | null
          closed_date?: string | null
          created_at?: string | null
          damage_severity?:
            | Database["public"]["Enums"]["damage_severity"]
            | null
          damage_type?: string
          date_of_loss?: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          external_claim_number?: string | null
          id?: string
          inspection_date?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          photos?: Json | null
          policy_id?: string | null
          property_id?: string | null
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      claims_history: {
        Row: {
          adjuster_company: string | null
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          ai_coverage_analysis: Json | null
          ai_damage_assessment: Json | null
          ai_recommendations: Json | null
          approval_date: string | null
          approved_amount: number | null
          archived_at: string | null
          claim_number: string | null
          closed_date: string | null
          created_at: string | null
          damage_severity: Database["public"]["Enums"]["damage_severity"] | null
          damage_type: string
          date_of_loss: string
          date_reported: string | null
          deductible_applied: number | null
          description: string | null
          estimated_value: number | null
          external_claim_number: string | null
          id: string
          inspection_date: string | null
          metadata: Json | null
          notes: string | null
          operation: string | null
          paid_amount: number | null
          payment_date: string | null
          photos: Json | null
          policy_id: string | null
          property_id: string | null
          settled_value: number | null
          settlement_date: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents: Json | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          adjuster_company?: string | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_coverage_analysis?: Json | null
          ai_damage_assessment?: Json | null
          ai_recommendations?: Json | null
          approval_date?: string | null
          approved_amount?: number | null
          archived_at?: string | null
          claim_number?: string | null
          closed_date?: string | null
          created_at?: string | null
          damage_severity?:
            | Database["public"]["Enums"]["damage_severity"]
            | null
          damage_type: string
          date_of_loss: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          external_claim_number?: string | null
          id?: string
          inspection_date?: string | null
          metadata?: Json | null
          notes?: string | null
          operation?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          photos?: Json | null
          policy_id?: string | null
          property_id?: string | null
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          adjuster_company?: string | null
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_coverage_analysis?: Json | null
          ai_damage_assessment?: Json | null
          ai_recommendations?: Json | null
          approval_date?: string | null
          approved_amount?: number | null
          archived_at?: string | null
          claim_number?: string | null
          closed_date?: string | null
          created_at?: string | null
          damage_severity?:
            | Database["public"]["Enums"]["damage_severity"]
            | null
          damage_type?: string
          date_of_loss?: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          external_claim_number?: string | null
          id?: string
          inspection_date?: string | null
          metadata?: Json | null
          notes?: string | null
          operation?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          photos?: Json | null
          policy_id?: string | null
          property_id?: string | null
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: []
      }
      consent_audit_log: {
        Row: {
          action: string
          consent_type: string | null
          created_at: string | null
          document_type:
            | Database["public"]["Enums"]["legal_document_type"]
            | null
          document_version: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          method: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          consent_type?: string | null
          created_at?: string | null
          document_type?:
            | Database["public"]["Enums"]["legal_document_type"]
            | null
          document_version?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          method?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          consent_type?: string | null
          created_at?: string | null
          document_type?:
            | Database["public"]["Enums"]["legal_document_type"]
            | null
          document_version?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          method?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coverage_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          type: string
          typical_limit: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          type: string
          typical_limit?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string
          typical_limit?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      disaster_events: {
        Row: {
          affected_geography: unknown | null
          created_at: string | null
          description: string | null
          effective_at: string | null
          event_id: string
          expires_at: string | null
          headline: string | null
          id: string
          instruction: string | null
          sender_name: string | null
          severity: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          affected_geography?: unknown | null
          created_at?: string | null
          description?: string | null
          effective_at?: string | null
          event_id: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          instruction?: string | null
          sender_name?: string | null
          severity?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          affected_geography?: unknown | null
          created_at?: string | null
          description?: string | null
          effective_at?: string | null
          event_id?: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          instruction?: string | null
          sender_name?: string | null
          severity?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient: string
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_code: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          ip_address: unknown | null
          request_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          upload_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          upload_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          upload_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      FL_Companies: {
        Row: {
          "Company Name * (* group filing)": string | null
          "Date Closed": string | null
          "File Log Number": string | null
          "Filing Type": string | null
          "Final Action": string | null
          "Line of Business": string | null
          "LOB Code": number | null
          "Sub Type of Insurance": string | null
          "SubTOI Code": string | null
          "TOI Code": number | null
          "Type of Insurance": string | null
        }
        Insert: {
          "Company Name * (* group filing)"?: string | null
          "Date Closed"?: string | null
          "File Log Number"?: string | null
          "Filing Type"?: string | null
          "Final Action"?: string | null
          "Line of Business"?: string | null
          "LOB Code"?: number | null
          "Sub Type of Insurance"?: string | null
          "SubTOI Code"?: string | null
          "TOI Code"?: number | null
          "Type of Insurance"?: string | null
        }
        Update: {
          "Company Name * (* group filing)"?: string | null
          "Date Closed"?: string | null
          "File Log Number"?: string | null
          "Filing Type"?: string | null
          "Final Action"?: string | null
          "Line of Business"?: string | null
          "LOB Code"?: number | null
          "Sub Type of Insurance"?: string | null
          "SubTOI Code"?: string | null
          "TOI Code"?: number | null
          "Type of Insurance"?: string | null
        }
        Relationships: []
      }
      fl_counties: {
        Row: {
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          coastal_county: boolean | null
          county_name: string
          county_seat: string | null
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_region: string | null
          fips5: string
          flood_elevation_requirement: boolean | null
          gis_url: string | null
          households: number | null
          id: string
          impact_glass_required: boolean | null
          median_home_value: number | null
          online_permit_system: boolean | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string | null
          time_zone: string | null
          updated_at: string | null
          version: number | null
          wind_speed_requirement: number | null
        }
        Insert: {
          building_code_version?: string | null
          building_dept_address?: string | null
          building_dept_email?: string | null
          building_dept_name?: string | null
          building_dept_phone?: string | null
          building_dept_website?: string | null
          coastal_county?: boolean | null
          county_name: string
          county_seat?: string | null
          created_at?: string | null
          emergency_hotline?: string | null
          emergency_mgmt_phone?: string | null
          emergency_mgmt_website?: string | null
          fema_region?: string | null
          fips5: string
          flood_elevation_requirement?: boolean | null
          gis_url?: string | null
          households?: number | null
          id?: string
          impact_glass_required?: boolean | null
          median_home_value?: number | null
          online_permit_system?: boolean | null
          permit_search_url?: string | null
          population?: number | null
          property_appraiser_email?: string | null
          property_appraiser_name?: string | null
          property_appraiser_phone?: string | null
          property_appraiser_website?: string | null
          property_search_url?: string | null
          region?: string | null
          time_zone?: string | null
          updated_at?: string | null
          version?: number | null
          wind_speed_requirement?: number | null
        }
        Update: {
          building_code_version?: string | null
          building_dept_address?: string | null
          building_dept_email?: string | null
          building_dept_name?: string | null
          building_dept_phone?: string | null
          building_dept_website?: string | null
          coastal_county?: boolean | null
          county_name?: string
          county_seat?: string | null
          created_at?: string | null
          emergency_hotline?: string | null
          emergency_mgmt_phone?: string | null
          emergency_mgmt_website?: string | null
          fema_region?: string | null
          fips5?: string
          flood_elevation_requirement?: boolean | null
          gis_url?: string | null
          households?: number | null
          id?: string
          impact_glass_required?: boolean | null
          median_home_value?: number | null
          online_permit_system?: boolean | null
          permit_search_url?: string | null
          population?: number | null
          property_appraiser_email?: string | null
          property_appraiser_name?: string | null
          property_appraiser_phone?: string | null
          property_appraiser_website?: string | null
          property_search_url?: string | null
          region?: string | null
          time_zone?: string | null
          updated_at?: string | null
          version?: number | null
          wind_speed_requirement?: number | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          change_summary: string | null
          content: string
          created_at: string | null
          created_by: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          parent_version_id: string | null
          requires_acceptance: boolean | null
          sha256_hash: string
          slug: string
          storage_url: string | null
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at: string | null
          version: string
        }
        Insert: {
          change_summary?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          effective_date: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          parent_version_id?: string | null
          requires_acceptance?: boolean | null
          sha256_hash: string
          slug: string
          storage_url?: string | null
          summary?: string | null
          title: string
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string | null
          version: string
        }
        Update: {
          change_summary?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          parent_version_id?: string | null
          requires_acceptance?: boolean | null
          sha256_hash?: string
          slug?: string
          storage_url?: string | null
          summary?: string | null
          title?: string
          type?: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      login_activity: {
        Row: {
          attempt_type: string | null
          created_at: string | null
          device_fingerprint: string | null
          email: string | null
          error_message: string | null
          geolocation: Json | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string | null
          error_message?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string | null
          error_message?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_attribution: {
        Row: {
          conversion_campaign: string | null
          conversion_date: string | null
          conversion_landing_page: string | null
          conversion_medium: string | null
          conversion_source: string | null
          created_at: string | null
          days_to_conversion: number | null
          first_touch_campaign: string | null
          first_touch_date: string | null
          first_touch_landing_page: string | null
          first_touch_medium: string | null
          first_touch_source: string | null
          id: string
          last_touch_campaign: string | null
          last_touch_date: string | null
          last_touch_landing_page: string | null
          last_touch_medium: string | null
          last_touch_source: string | null
          multi_touch_points: Json | null
          total_touches: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversion_campaign?: string | null
          conversion_date?: string | null
          conversion_landing_page?: string | null
          conversion_medium?: string | null
          conversion_source?: string | null
          created_at?: string | null
          days_to_conversion?: number | null
          first_touch_campaign?: string | null
          first_touch_date?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          last_touch_campaign?: string | null
          last_touch_date?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          multi_touch_points?: Json | null
          total_touches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversion_campaign?: string | null
          conversion_date?: string | null
          conversion_landing_page?: string | null
          conversion_medium?: string | null
          conversion_source?: string | null
          created_at?: string | null
          days_to_conversion?: number | null
          first_touch_campaign?: string | null
          first_touch_date?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          last_touch_campaign?: string | null
          last_touch_date?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          multi_touch_points?: Json | null
          total_touches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      personal_property: {
        Row: {
          ai_category_confidence: number | null
          ai_detected_items: Json | null
          ai_value_estimate: number | null
          brand: string | null
          category: Database["public"]["Enums"]["item_category"] | null
          created_at: string | null
          current_value: number | null
          description: string | null
          disposal_reason: string | null
          disposed_date: string | null
          id: string
          is_active: boolean | null
          location_details: string | null
          manual_url: string | null
          metadata: Json | null
          model: string | null
          name: string
          photo_urls: string[] | null
          property_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          receipt_url: string | null
          replacement_cost: number | null
          room: string | null
          serial_number: string | null
          subcategory: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          warranty_info: Json | null
        }
        Insert: {
          ai_category_confidence?: number | null
          ai_detected_items?: Json | null
          ai_value_estimate?: number | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"] | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          disposal_reason?: string | null
          disposed_date?: string | null
          id?: string
          is_active?: boolean | null
          location_details?: string | null
          manual_url?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          photo_urls?: string[] | null
          property_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          receipt_url?: string | null
          replacement_cost?: number | null
          room?: string | null
          serial_number?: string | null
          subcategory?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          warranty_info?: Json | null
        }
        Update: {
          ai_category_confidence?: number | null
          ai_detected_items?: Json | null
          ai_value_estimate?: number | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"] | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          disposal_reason?: string | null
          disposed_date?: string | null
          id?: string
          is_active?: boolean | null
          location_details?: string | null
          manual_url?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          photo_urls?: string[] | null
          property_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          receipt_url?: string | null
          replacement_cost?: number | null
          room?: string | null
          serial_number?: string | null
          subcategory?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          warranty_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_property_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          annual_premium: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          carrier_naic: string | null
          carrier_name: string
          created_at: string | null
          dwelling_coverage: number | null
          effective_date: string
          endorsements: Json | null
          exclusions: Json | null
          expiration_date: string
          flood_deductible: number | null
          hurricane_deductible: string | null
          id: string
          is_active: boolean | null
          liability_coverage: number | null
          loss_of_use_coverage: number | null
          medical_payments_coverage: number | null
          metadata: Json | null
          other_structures_coverage: number | null
          payment_frequency: string | null
          personal_property_coverage: number | null
          policy_number: string
          policy_type: string | null
          property_id: string | null
          special_coverages: Json | null
          standard_deductible: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          annual_premium?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          carrier_naic?: string | null
          carrier_name: string
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date: string
          endorsements?: Json | null
          exclusions?: Json | null
          expiration_date: string
          flood_deductible?: number | null
          hurricane_deductible?: string | null
          id?: string
          is_active?: boolean | null
          liability_coverage?: number | null
          loss_of_use_coverage?: number | null
          medical_payments_coverage?: number | null
          metadata?: Json | null
          other_structures_coverage?: number | null
          payment_frequency?: string | null
          personal_property_coverage?: number | null
          policy_number: string
          policy_type?: string | null
          property_id?: string | null
          special_coverages?: Json | null
          standard_deductible?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          annual_premium?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          carrier_naic?: string | null
          carrier_name?: string
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date?: string
          endorsements?: Json | null
          exclusions?: Json | null
          expiration_date?: string
          flood_deductible?: number | null
          hurricane_deductible?: string | null
          id?: string
          is_active?: boolean | null
          liability_coverage?: number | null
          loss_of_use_coverage?: number | null
          medical_payments_coverage?: number | null
          metadata?: Json | null
          other_structures_coverage?: number | null
          payment_frequency?: string | null
          personal_property_coverage?: number | null
          policy_number?: string
          policy_type?: string | null
          property_id?: string | null
          special_coverages?: Json | null
          standard_deductible?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      policies_history: {
        Row: {
          annual_premium: number | null
          archived_at: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          carrier_naic: string | null
          carrier_name: string
          created_at: string | null
          dwelling_coverage: number | null
          effective_date: string
          endorsements: Json | null
          exclusions: Json | null
          expiration_date: string
          flood_deductible: number | null
          hurricane_deductible: string | null
          id: string
          is_active: boolean | null
          liability_coverage: number | null
          loss_of_use_coverage: number | null
          medical_payments_coverage: number | null
          metadata: Json | null
          operation: string | null
          other_structures_coverage: number | null
          payment_frequency: string | null
          personal_property_coverage: number | null
          policy_number: string
          policy_type: string | null
          property_id: string | null
          special_coverages: Json | null
          standard_deductible: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          annual_premium?: number | null
          archived_at?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          carrier_naic?: string | null
          carrier_name: string
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date: string
          endorsements?: Json | null
          exclusions?: Json | null
          expiration_date: string
          flood_deductible?: number | null
          hurricane_deductible?: string | null
          id?: string
          is_active?: boolean | null
          liability_coverage?: number | null
          loss_of_use_coverage?: number | null
          medical_payments_coverage?: number | null
          metadata?: Json | null
          operation?: string | null
          other_structures_coverage?: number | null
          payment_frequency?: string | null
          personal_property_coverage?: number | null
          policy_number: string
          policy_type?: string | null
          property_id?: string | null
          special_coverages?: Json | null
          standard_deductible?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          annual_premium?: number | null
          archived_at?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          carrier_naic?: string | null
          carrier_name?: string
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date?: string
          endorsements?: Json | null
          exclusions?: Json | null
          expiration_date?: string
          flood_deductible?: number | null
          hurricane_deductible?: string | null
          id?: string
          is_active?: boolean | null
          liability_coverage?: number | null
          loss_of_use_coverage?: number | null
          medical_payments_coverage?: number | null
          metadata?: Json | null
          operation?: string | null
          other_structures_coverage?: number | null
          payment_frequency?: string | null
          personal_property_coverage?: number | null
          policy_number?: string
          policy_type?: string | null
          property_id?: string | null
          special_coverages?: Json | null
          standard_deductible?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          city: string
          construction_type: string | null
          coordinates: unknown | null
          county_fips: string | null
          created_at: string | null
          current_value: number | null
          electrical_year: number | null
          evacuation_zone: string | null
          flood_zone: string | null
          garage_spaces: number | null
          hvac_year: number | null
          id: string
          legal_description: string | null
          lot_size_acres: number | null
          metadata: Json | null
          mortgage_balance: number | null
          name: string
          occupancy_status:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number: string | null
          plumbing_year: number | null
          pool: boolean | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          purchase_date: string | null
          purchase_price: number | null
          roof_type: string | null
          roof_year: number | null
          square_footage: number | null
          state: string | null
          stories: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          wind_zone: string | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          construction_type?: string | null
          coordinates?: unknown | null
          county_fips?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          name: string
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          plumbing_year?: number | null
          pool?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          roof_type?: string | null
          roof_year?: number | null
          square_footage?: number | null
          state?: string | null
          stories?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          construction_type?: string | null
          coordinates?: unknown | null
          county_fips?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          name?: string
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          plumbing_year?: number | null
          pool?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          roof_type?: string | null
          roof_year?: number | null
          square_footage?: number | null
          state?: string | null
          stories?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_county_fips_fkey"
            columns: ["county_fips"]
            isOneToOne: false
            referencedRelation: "fl_counties"
            referencedColumns: ["fips5"]
          },
        ]
      }
      properties_history: {
        Row: {
          address: string
          archived_at: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          construction_type: string | null
          coordinates: unknown | null
          county_fips: string | null
          created_at: string | null
          current_value: number | null
          electrical_year: number | null
          evacuation_zone: string | null
          flood_zone: string | null
          garage_spaces: number | null
          hvac_year: number | null
          id: string
          legal_description: string | null
          lot_size_acres: number | null
          metadata: Json | null
          mortgage_balance: number | null
          name: string
          occupancy_status:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          operation: string | null
          parcel_number: string | null
          plumbing_year: number | null
          pool: boolean | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          purchase_date: string | null
          purchase_price: number | null
          roof_type: string | null
          roof_year: number | null
          square_footage: number | null
          state: string | null
          stories: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          wind_zone: string | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          archived_at?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          construction_type?: string | null
          coordinates?: unknown | null
          county_fips?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          name: string
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          operation?: string | null
          parcel_number?: string | null
          plumbing_year?: number | null
          pool?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          roof_type?: string | null
          roof_year?: number | null
          square_footage?: number | null
          state?: string | null
          stories?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          archived_at?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          construction_type?: string | null
          coordinates?: unknown | null
          county_fips?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          name?: string
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          operation?: string | null
          parcel_number?: string | null
          plumbing_year?: number | null
          pool?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          roof_type?: string | null
          roof_year?: number | null
          square_footage?: number | null
          state?: string | null
          stories?: number | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      property_systems: {
        Row: {
          condition: string | null
          created_at: string | null
          description: string | null
          estimated_lifespan_years: number | null
          id: string
          installation_date: string | null
          installer_name: string | null
          installer_phone: string | null
          last_service_date: string | null
          manual_url: string | null
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          name: string
          next_service_due: string | null
          property_id: string | null
          replacement_cost: number | null
          serial_number: string | null
          service_interval_months: number | null
          service_phone: string | null
          service_provider: string | null
          service_records: Json | null
          specifications: Json | null
          system_type: string
          updated_at: string | null
          version: number | null
          warranty_expiration: string | null
          warranty_phone: string | null
          warranty_provider: string | null
          warranty_url: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          estimated_lifespan_years?: number | null
          id?: string
          installation_date?: string | null
          installer_name?: string | null
          installer_phone?: string | null
          last_service_date?: string | null
          manual_url?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          next_service_due?: string | null
          property_id?: string | null
          replacement_cost?: number | null
          serial_number?: string | null
          service_interval_months?: number | null
          service_phone?: string | null
          service_provider?: string | null
          service_records?: Json | null
          specifications?: Json | null
          system_type: string
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
          warranty_phone?: string | null
          warranty_provider?: string | null
          warranty_url?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          estimated_lifespan_years?: number | null
          id?: string
          installation_date?: string | null
          installer_name?: string | null
          installer_phone?: string | null
          last_service_date?: string | null
          manual_url?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          next_service_due?: string | null
          property_id?: string | null
          replacement_cost?: number | null
          serial_number?: string | null
          service_interval_months?: number | null
          service_phone?: string | null
          service_provider?: string | null
          service_records?: Json | null
          specifications?: Json | null
          system_type?: string
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
          warranty_phone?: string | null
          warranty_provider?: string | null
          warranty_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_systems_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signup_consents: {
        Row: {
          age_verified: boolean
          consent_timestamp: string
          consent_token: string
          created_at: string | null
          data_processing_consent: boolean
          device_fingerprint: string | null
          email: string
          expires_at: string
          gdpr_consent: boolean
          id: string
          ip_address: string | null
          marketing_accepted: boolean
          marketing_consent: boolean
          privacy_accepted: boolean
          terms_accepted: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          age_verified?: boolean
          consent_timestamp?: string
          consent_token?: string
          created_at?: string | null
          data_processing_consent?: boolean
          device_fingerprint?: string | null
          email: string
          expires_at?: string
          gdpr_consent?: boolean
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean
          marketing_consent?: boolean
          privacy_accepted?: boolean
          terms_accepted?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          age_verified?: boolean
          consent_timestamp?: string
          consent_token?: string
          created_at?: string | null
          data_processing_consent?: boolean
          device_fingerprint?: string | null
          email?: string
          expires_at?: string
          gdpr_consent?: boolean
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean
          marketing_consent?: boolean
          privacy_accepted?: boolean
          terms_accepted?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tidal_stations: {
        Row: {
          created_at: string | null
          id: string
          latitude: number | null
          location: unknown | null
          longitude: number | null
          name: string | null
          observed_at: string | null
          state: string | null
          station_id: string
          unit: string | null
          updated_at: string | null
          water_level: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          name?: string | null
          observed_at?: string | null
          state?: string | null
          station_id: string
          unit?: string | null
          updated_at?: string | null
          water_level?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          name?: string | null
          observed_at?: string | null
          state?: string | null
          station_id?: string
          unit?: string | null
          updated_at?: string | null
          water_level?: number | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_category: string | null
          activity_name: string
          activity_type: string
          activity_value: Json | null
          created_at: string | null
          id: string
          page_title: string | null
          page_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_category?: string | null
          activity_name: string
          activity_type: string
          activity_value?: Json | null
          created_at?: string | null
          id?: string
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_category?: string | null
          activity_name?: string
          activity_type?: string
          activity_value?: Json | null
          created_at?: string | null
          id?: string
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_checklist_progress: {
        Row: {
          completed: boolean
          created_at: string | null
          id: string
          item_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          id?: string
          item_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          id?: string
          item_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          action: Database["public"]["Enums"]["consent_action_type"]
          consent_flow: string | null
          consent_method: string
          consented_at: string | null
          device_fingerprint: string | null
          document_id: string
          geolocation: Json | null
          id: string
          ip_address: unknown
          is_current: boolean | null
          metadata: Json | null
          page_url: string | null
          referrer_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["consent_action_type"]
          consent_flow?: string | null
          consent_method: string
          consented_at?: string | null
          device_fingerprint?: string | null
          document_id: string
          geolocation?: Json | null
          id?: string
          ip_address: unknown
          is_current?: boolean | null
          metadata?: Json | null
          page_url?: string | null
          referrer_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["consent_action_type"]
          consent_flow?: string | null
          consent_method?: string
          consented_at?: string | null
          device_fingerprint?: string | null
          document_id?: string
          geolocation?: Json | null
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          metadata?: Json | null
          page_url?: string | null
          referrer_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          first_seen: string | null
          id: string
          is_blocked: boolean | null
          is_trusted: boolean | null
          last_seen: string | null
          metadata: Json | null
          operating_system: string | null
          trust_score: number | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_blocked?: boolean | null
          is_trusted?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          operating_system?: string | null
          trust_score?: number | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_blocked?: boolean | null
          is_trusted?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          operating_system?: string | null
          trust_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_legal_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: unknown | null
          legal_id: string
          signature_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: unknown | null
          legal_id: string
          signature_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: unknown | null
          legal_id?: string
          signature_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptance_legal_id_fkey"
            columns: ["legal_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          address_verified: boolean | null
          ai_features_enabled: boolean | null
          ai_processing_consent: boolean | null
          ai_processing_consent_date: string | null
          created_at: string | null
          data_processing_consent: boolean | null
          email_notifications: boolean | null
          gdpr_consent: boolean | null
          has_flood_insurance: boolean | null
          has_insurance: boolean | null
          has_insurance_policy: boolean | null
          has_other_insurance: boolean | null
          has_primary_property: boolean | null
          has_property_insurance: boolean | null
          id: string
          insurance_completed: boolean | null
          insurance_provider: string | null
          insurance_setup_completed: boolean | null
          landlord_units: string | null
          marketing_consent: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_current_step: string | null
          onboarding_skipped_at: string | null
          preferred_ai_model: string | null
          preferred_theme: string | null
          professional_role: string | null
          profile_completed: boolean | null
          property_address: string | null
          property_bathrooms: number | null
          property_bedrooms: number | null
          property_setup_completed: boolean | null
          property_stories: number | null
          property_structures: string | null
          push_notifications: boolean | null
          rooms_per_floor: string | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          address_verified?: boolean | null
          ai_features_enabled?: boolean | null
          ai_processing_consent?: boolean | null
          ai_processing_consent_date?: string | null
          created_at?: string | null
          data_processing_consent?: boolean | null
          email_notifications?: boolean | null
          gdpr_consent?: boolean | null
          has_flood_insurance?: boolean | null
          has_insurance?: boolean | null
          has_insurance_policy?: boolean | null
          has_other_insurance?: boolean | null
          has_primary_property?: boolean | null
          has_property_insurance?: boolean | null
          id?: string
          insurance_completed?: boolean | null
          insurance_provider?: string | null
          insurance_setup_completed?: boolean | null
          landlord_units?: string | null
          marketing_consent?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: string | null
          onboarding_skipped_at?: string | null
          preferred_ai_model?: string | null
          preferred_theme?: string | null
          professional_role?: string | null
          profile_completed?: boolean | null
          property_address?: string | null
          property_bathrooms?: number | null
          property_bedrooms?: number | null
          property_setup_completed?: boolean | null
          property_stories?: number | null
          property_structures?: string | null
          push_notifications?: boolean | null
          rooms_per_floor?: string | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          address_verified?: boolean | null
          ai_features_enabled?: boolean | null
          ai_processing_consent?: boolean | null
          ai_processing_consent_date?: string | null
          created_at?: string | null
          data_processing_consent?: boolean | null
          email_notifications?: boolean | null
          gdpr_consent?: boolean | null
          has_flood_insurance?: boolean | null
          has_insurance?: boolean | null
          has_insurance_policy?: boolean | null
          has_other_insurance?: boolean | null
          has_primary_property?: boolean | null
          has_property_insurance?: boolean | null
          id?: string
          insurance_completed?: boolean | null
          insurance_provider?: string | null
          insurance_setup_completed?: boolean | null
          landlord_units?: string | null
          marketing_consent?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: string | null
          onboarding_skipped_at?: string | null
          preferred_ai_model?: string | null
          preferred_theme?: string | null
          professional_role?: string | null
          profile_completed?: boolean | null
          property_address?: string | null
          property_bathrooms?: number | null
          property_bedrooms?: number | null
          property_setup_completed?: boolean | null
          property_stories?: number | null
          property_structures?: string | null
          push_notifications?: boolean | null
          rooms_per_floor?: string | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string | null
          account_type: string | null
          created_at: string | null
          email_verified_at: string | null
          failed_login_count: number | null
          internal_notes: string | null
          last_failed_login_at: string | null
          last_login_at: string | null
          last_login_ip: string | null
          login_count: number | null
          metadata: Json | null
          notes: string | null
          password_changed_at: string | null
          phone_verified_at: string | null
          preferences: Json | null
          risk_score: number | null
          signup_city: string | null
          signup_completed_at: string | null
          signup_country: string | null
          signup_country_code: string | null
          signup_device_fingerprint: string | null
          signup_device_type: string | null
          signup_ip_address: string | null
          signup_landing_page: string | null
          signup_latitude: number | null
          signup_longitude: number | null
          signup_postal_code: string | null
          signup_referrer: string | null
          signup_region: string | null
          signup_source: string | null
          signup_timestamp: string | null
          signup_timezone: string | null
          signup_user_agent: string | null
          signup_utm_campaign: string | null
          signup_utm_content: string | null
          signup_utm_medium: string | null
          signup_utm_source: string | null
          signup_utm_term: string | null
          tags: string[] | null
          trust_level: string | null
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          email_verified_at?: string | null
          failed_login_count?: number | null
          internal_notes?: string | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_count?: number | null
          metadata?: Json | null
          notes?: string | null
          password_changed_at?: string | null
          phone_verified_at?: string | null
          preferences?: Json | null
          risk_score?: number | null
          signup_city?: string | null
          signup_completed_at?: string | null
          signup_country?: string | null
          signup_country_code?: string | null
          signup_device_fingerprint?: string | null
          signup_device_type?: string | null
          signup_ip_address?: string | null
          signup_landing_page?: string | null
          signup_latitude?: number | null
          signup_longitude?: number | null
          signup_postal_code?: string | null
          signup_referrer?: string | null
          signup_region?: string | null
          signup_source?: string | null
          signup_timestamp?: string | null
          signup_timezone?: string | null
          signup_user_agent?: string | null
          signup_utm_campaign?: string | null
          signup_utm_content?: string | null
          signup_utm_medium?: string | null
          signup_utm_source?: string | null
          signup_utm_term?: string | null
          tags?: string[] | null
          trust_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          email_verified_at?: string | null
          failed_login_count?: number | null
          internal_notes?: string | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_count?: number | null
          metadata?: Json | null
          notes?: string | null
          password_changed_at?: string | null
          phone_verified_at?: string | null
          preferences?: Json | null
          risk_score?: number | null
          signup_city?: string | null
          signup_completed_at?: string | null
          signup_country?: string | null
          signup_country_code?: string | null
          signup_device_fingerprint?: string | null
          signup_device_type?: string | null
          signup_ip_address?: string | null
          signup_landing_page?: string | null
          signup_latitude?: number | null
          signup_longitude?: number | null
          signup_postal_code?: string | null
          signup_referrer?: string | null
          signup_region?: string | null
          signup_source?: string | null
          signup_timestamp?: string | null
          signup_timezone?: string | null
          signup_user_agent?: string | null
          signup_utm_campaign?: string | null
          signup_utm_content?: string | null
          signup_utm_medium?: string | null
          signup_utm_source?: string | null
          signup_utm_term?: string | null
          tags?: string[] | null
          trust_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          geolocation: Json | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          logout_at: string | null
          logout_reason: string | null
          metadata: Json | null
          risk_score: number | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          geolocation?: Json | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          last_activity?: string | null
          logout_at?: string | null
          logout_reason?: string | null
          metadata?: Json | null
          risk_score?: number | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          geolocation?: Json | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          logout_at?: string | null
          logout_reason?: string | null
          metadata?: Json | null
          risk_score?: number | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tracking: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          ip_city: string | null
          ip_country: string | null
          ip_region: string | null
          ip_timezone: string | null
          is_first_login: boolean | null
          landing_page: string | null
          last_activity_at: string | null
          login_method: string | null
          os_name: string | null
          os_version: string | null
          referrer_domain: string | null
          referrer_url: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          ip_city?: string | null
          ip_country?: string | null
          ip_region?: string | null
          ip_timezone?: string | null
          is_first_login?: boolean | null
          landing_page?: string | null
          last_activity_at?: string | null
          login_method?: string | null
          os_name?: string | null
          os_version?: string | null
          referrer_domain?: string | null
          referrer_url?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          ip_city?: string | null
          ip_country?: string | null
          ip_region?: string | null
          ip_timezone?: string | null
          is_first_login?: boolean | null
          landing_page?: string | null
          last_activity_at?: string | null
          login_method?: string | null
          os_name?: string | null
          os_version?: string | null
          referrer_domain?: string | null
          referrer_url?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_policies: {
        Row: {
          address: string | null
          annual_premium: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          carrier_naic: string | null
          carrier_name: string | null
          city: string | null
          county_name: string | null
          created_at: string | null
          dwelling_coverage: number | null
          effective_date: string | null
          endorsements: Json | null
          exclusions: Json | null
          expiration_date: string | null
          flood_deductible: number | null
          hurricane_deductible: string | null
          id: string | null
          is_active: boolean | null
          liability_coverage: number | null
          loss_of_use_coverage: number | null
          medical_payments_coverage: number | null
          metadata: Json | null
          other_structures_coverage: number | null
          payment_frequency: string | null
          personal_property_coverage: number | null
          policy_number: string | null
          policy_type: string | null
          property_id: string | null
          special_coverages: Json | null
          standard_deductible: number | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          zip_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      claims_summary: {
        Row: {
          address: string | null
          adjuster_company: string | null
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          ai_coverage_analysis: Json | null
          ai_damage_assessment: Json | null
          ai_recommendations: Json | null
          approval_date: string | null
          approved_amount: number | null
          carrier_name: string | null
          city: string | null
          claim_number: string | null
          closed_date: string | null
          county_name: string | null
          created_at: string | null
          damage_severity: Database["public"]["Enums"]["damage_severity"] | null
          damage_type: string | null
          date_of_loss: string | null
          date_reported: string | null
          deductible_applied: number | null
          description: string | null
          estimated_value: number | null
          external_claim_number: string | null
          id: string | null
          inspection_date: string | null
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          photos: Json | null
          policy_id: string | null
          policy_number: string | null
          property_id: string | null
          settled_value: number | null
          settlement_date: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          supporting_documents: Json | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      error_summary: {
        Row: {
          affected_users: number | null
          error_code: string | null
          error_count: number | null
          error_type: string | null
          first_occurrence: string | null
          last_occurrence: string | null
          severity: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      raster_columns: {
        Row: {
          blocksize_x: number | null
          blocksize_y: number | null
          extent: unknown | null
          nodata_values: number[] | null
          num_bands: number | null
          out_db: boolean[] | null
          pixel_types: string[] | null
          r_raster_column: unknown | null
          r_table_catalog: unknown | null
          r_table_name: unknown | null
          r_table_schema: unknown | null
          regular_blocking: boolean | null
          same_alignment: boolean | null
          scale_x: number | null
          scale_y: number | null
          spatial_index: boolean | null
          srid: number | null
        }
        Relationships: []
      }
      raster_overviews: {
        Row: {
          o_raster_column: unknown | null
          o_table_catalog: unknown | null
          o_table_name: unknown | null
          o_table_schema: unknown | null
          overview_factor: number | null
          r_raster_column: unknown | null
          r_table_catalog: unknown | null
          r_table_name: unknown | null
          r_table_schema: unknown | null
        }
        Relationships: []
      }
      recent_security_events: {
        Row: {
          action: string | null
          created_at: string | null
          event_type: string | null
          id: string | null
          ip_address: unknown | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      __st_countagg_transfn: {
        Args: {
          agg: Database["public"]["CompositeTypes"]["agg_count"]
          rast: unknown
          nband?: number
          exclude_nodata_value?: boolean
          sample_percent?: number
        }
        Returns: Database["public"]["CompositeTypes"]["agg_count"]
      }
      _add_overview_constraint: {
        Args: {
          ovschema: unknown
          ovtable: unknown
          ovcolumn: unknown
          refschema: unknown
          reftable: unknown
          refcolumn: unknown
          factor: number
        }
        Returns: boolean
      }
      _add_raster_constraint: {
        Args: { cn: unknown; sql: string }
        Returns: boolean
      }
      _add_raster_constraint_alignment: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_blocksize: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: boolean
      }
      _add_raster_constraint_coverage_tile: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_extent: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_nodata_values: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_num_bands: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_out_db: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_pixel_types: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_scale: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: boolean
      }
      _add_raster_constraint_spatially_unique: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _add_raster_constraint_srid: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_overview_constraint: {
        Args: { ovschema: unknown; ovtable: unknown; ovcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint: {
        Args: { rastschema: unknown; rasttable: unknown; cn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_alignment: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_blocksize: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: boolean
      }
      _drop_raster_constraint_coverage_tile: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_extent: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_nodata_values: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_num_bands: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_out_db: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_pixel_types: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_regular_blocking: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_scale: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: boolean
      }
      _drop_raster_constraint_spatially_unique: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _drop_raster_constraint_srid: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _overview_constraint: {
        Args: {
          ov: unknown
          factor: number
          refschema: unknown
          reftable: unknown
          refcolumn: unknown
        }
        Returns: boolean
      }
      _overview_constraint_info: {
        Args: { ovschema: unknown; ovtable: unknown; ovcolumn: unknown }
        Returns: Record<string, unknown>
      }
      _postgis_deprecate: {
        Args: { oldname: string; newname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { tbl: unknown; col: string }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { tbl: unknown; att_name: string; geom: unknown; mode?: string }
        Returns: number
      }
      _raster_constraint_info_alignment: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _raster_constraint_info_blocksize: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: number
      }
      _raster_constraint_info_coverage_tile: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _raster_constraint_info_extent: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: unknown
      }
      _raster_constraint_info_index: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _raster_constraint_info_nodata_values: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: number[]
      }
      _raster_constraint_info_num_bands: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: number
      }
      _raster_constraint_info_out_db: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean[]
      }
      _raster_constraint_info_pixel_types: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: string[]
      }
      _raster_constraint_info_regular_blocking: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _raster_constraint_info_scale: {
        Args: {
          rastschema: unknown
          rasttable: unknown
          rastcolumn: unknown
          axis: string
        }
        Returns: number
      }
      _raster_constraint_info_spatially_unique: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: boolean
      }
      _raster_constraint_info_srid: {
        Args: { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
        Returns: number
      }
      _raster_constraint_nodata_values: {
        Args: { rast: unknown }
        Returns: number[]
      }
      _raster_constraint_out_db: {
        Args: { rast: unknown }
        Returns: boolean[]
      }
      _raster_constraint_pixel_types: {
        Args: { rast: unknown }
        Returns: string[]
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_aspect4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_asraster: {
        Args: {
          geom: unknown
          scalex?: number
          scaley?: number
          width?: number
          height?: number
          pixeltype?: string[]
          value?: number[]
          nodataval?: number[]
          upperleftx?: number
          upperlefty?: number
          gridx?: number
          gridy?: number
          skewx?: number
          skewy?: number
          touched?: boolean
        }
        Returns: unknown
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_clip: {
        Args: {
          rast: unknown
          nband: number[]
          geom: unknown
          nodataval?: number[]
          crop?: boolean
        }
        Returns: unknown
      }
      _st_colormap: {
        Args: {
          rast: unknown
          nband: number
          colormap: string
          method?: string
        }
        Returns: unknown
      }
      _st_contains: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_containsproperly: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_convertarray4ma: {
        Args: { value: number[] }
        Returns: number[]
      }
      _st_count: {
        Args: {
          rast: unknown
          nband?: number
          exclude_nodata_value?: boolean
          sample_percent?: number
        }
        Returns: number
      }
      _st_countagg_finalfn: {
        Args: { agg: Database["public"]["CompositeTypes"]["agg_count"] }
        Returns: number
      }
      _st_countagg_transfn: {
        Args:
          | {
              agg: Database["public"]["CompositeTypes"]["agg_count"]
              rast: unknown
              exclude_nodata_value: boolean
            }
          | {
              agg: Database["public"]["CompositeTypes"]["agg_count"]
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
            }
          | {
              agg: Database["public"]["CompositeTypes"]["agg_count"]
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              sample_percent: number
            }
        Returns: Database["public"]["CompositeTypes"]["agg_count"]
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dfullywithin: {
        Args: {
          rast1: unknown
          nband1: number
          rast2: unknown
          nband2: number
          distance: number
        }
        Returns: boolean
      }
      _st_dwithin: {
        Args:
          | {
              geog1: unknown
              geog2: unknown
              tolerance: number
              use_spheroid?: boolean
            }
          | {
              rast1: unknown
              nband1: number
              rast2: unknown
              nband2: number
              distance: number
            }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_gdalwarp: {
        Args: {
          rast: unknown
          algorithm?: string
          maxerr?: number
          srid?: number
          scalex?: number
          scaley?: number
          gridx?: number
          gridy?: number
          skewx?: number
          skewy?: number
          width?: number
          height?: number
        }
        Returns: unknown
      }
      _st_grayscale4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_hillshade4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_histogram: {
        Args: {
          rast: unknown
          nband?: number
          exclude_nodata_value?: boolean
          sample_percent?: number
          bins?: number
          width?: number[]
          right?: boolean
          min?: number
          max?: number
        }
        Returns: Record<string, unknown>[]
      }
      _st_intersects: {
        Args:
          | { geom: unknown; rast: unknown; nband?: number }
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_mapalgebra: {
        Args:
          | {
              rastbandargset: Database["public"]["CompositeTypes"]["rastbandarg"][]
              callbackfunc: unknown
              pixeltype?: string
              distancex?: number
              distancey?: number
              extenttype?: string
              customextent?: unknown
              mask?: number[]
              weighted?: boolean
            }
          | {
              rastbandargset: Database["public"]["CompositeTypes"]["rastbandarg"][]
              expression: string
              pixeltype?: string
              extenttype?: string
              nodata1expr?: string
              nodata2expr?: string
              nodatanodataval?: number
            }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_neighborhood: {
        Args: {
          rast: unknown
          band: number
          columnx: number
          rowy: number
          distancex: number
          distancey: number
          exclude_nodata_value?: boolean
        }
        Returns: number[]
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_pixelascentroids: {
        Args: {
          rast: unknown
          band?: number
          columnx?: number
          rowy?: number
          exclude_nodata_value?: boolean
        }
        Returns: {
          geom: unknown
          val: number
          x: number
          y: number
        }[]
      }
      _st_pixelaspolygons: {
        Args: {
          rast: unknown
          band?: number
          columnx?: number
          rowy?: number
          exclude_nodata_value?: boolean
        }
        Returns: {
          geom: unknown
          val: number
          x: number
          y: number
        }[]
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_quantile: {
        Args: {
          rast: unknown
          nband?: number
          exclude_nodata_value?: boolean
          sample_percent?: number
          quantiles?: number[]
        }
        Returns: Record<string, unknown>[]
      }
      _st_rastertoworldcoord: {
        Args: { rast: unknown; columnx?: number; rowy?: number }
        Returns: Record<string, unknown>
      }
      _st_reclass: {
        Args: { rast: unknown }
        Returns: unknown
      }
      _st_roughness4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_samealignment_finalfn: {
        Args: { agg: Database["public"]["CompositeTypes"]["agg_samealignment"] }
        Returns: boolean
      }
      _st_samealignment_transfn: {
        Args: {
          agg: Database["public"]["CompositeTypes"]["agg_samealignment"]
          rast: unknown
        }
        Returns: Database["public"]["CompositeTypes"]["agg_samealignment"]
      }
      _st_setvalues: {
        Args: {
          rast: unknown
          nband: number
          x: number
          y: number
          newvalueset: number[]
          noset?: boolean[]
          hasnosetvalue?: boolean
          nosetvalue?: number
          keepnodata?: boolean
        }
        Returns: unknown
      }
      _st_slope4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_summarystats: {
        Args: {
          rast: unknown
          nband?: number
          exclude_nodata_value?: boolean
          sample_percent?: number
        }
        Returns: Database["public"]["CompositeTypes"]["summarystats"]
      }
      _st_summarystats_finalfn: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["summarystats"]
      }
      _st_tile: {
        Args: {
          rast: unknown
          width: number
          height: number
          nband?: number[]
          padwithnodata?: boolean
          nodataval?: number
        }
        Returns: unknown[]
      }
      _st_touches: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_tpi4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_tri4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      _st_union_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_valuecount: {
        Args:
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
        Returns: Record<string, unknown>[]
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
        Returns: boolean
      }
      _st_worldtorastercoord: {
        Args: { rast: unknown; longitude?: number; latitude?: number }
        Returns: Record<string, unknown>
      }
      _updaterastersrid: {
        Args: {
          schema_name: unknown
          table_name: unknown
          column_name: unknown
          new_srid: number
        }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
        Returns: string
      }
      addoverviewconstraints: {
        Args:
          | {
              ovschema: unknown
              ovtable: unknown
              ovcolumn: unknown
              refschema: unknown
              reftable: unknown
              refcolumn: unknown
              ovfactor: number
            }
          | {
              ovtable: unknown
              ovcolumn: unknown
              reftable: unknown
              refcolumn: unknown
              ovfactor: number
            }
        Returns: boolean
      }
      addrasterconstraints: {
        Args:
          | { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
          | {
              rastschema: unknown
              rasttable: unknown
              rastcolumn: unknown
              srid?: boolean
              scale_x?: boolean
              scale_y?: boolean
              blocksize_x?: boolean
              blocksize_y?: boolean
              same_alignment?: boolean
              regular_blocking?: boolean
              num_bands?: boolean
              pixel_types?: boolean
              nodata_values?: boolean
              out_db?: boolean
              extent?: boolean
            }
          | { rasttable: unknown; rastcolumn: unknown }
          | {
              rasttable: unknown
              rastcolumn: unknown
              srid?: boolean
              scale_x?: boolean
              scale_y?: boolean
              blocksize_x?: boolean
              blocksize_y?: boolean
              same_alignment?: boolean
              regular_blocking?: boolean
              num_bands?: boolean
              pixel_types?: boolean
              nodata_values?: boolean
              out_db?: boolean
              extent?: boolean
            }
        Returns: boolean
      }
      admin_get_user_usage_stats: {
        Args: { target_user_id: string }
        Returns: Json
      }
      admin_set_user_subscription: {
        Args: { target_user_id: string; new_tier: string; reason?: string }
        Returns: Json
      }
      admin_set_user_type: {
        Args: { target_user_id: string; new_user_type: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown } | { "": unknown }
        Returns: string
      }
      capture_signup_data: {
        Args: { p_user_id: string; p_signup_metadata: Json }
        Returns: undefined
      }
      check_user_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      cleanup_expired_consents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_preferences: {
        Args: { p_user_id: string; p_preferences?: Json }
        Returns: undefined
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      dropoverviewconstraints: {
        Args:
          | { ovschema: unknown; ovtable: unknown; ovcolumn: unknown }
          | { ovtable: unknown; ovcolumn: unknown }
        Returns: boolean
      }
      droprasterconstraints: {
        Args:
          | { rastschema: unknown; rasttable: unknown; rastcolumn: unknown }
          | {
              rastschema: unknown
              rasttable: unknown
              rastcolumn: unknown
              srid?: boolean
              scale_x?: boolean
              scale_y?: boolean
              blocksize_x?: boolean
              blocksize_y?: boolean
              same_alignment?: boolean
              regular_blocking?: boolean
              num_bands?: boolean
              pixel_types?: boolean
              nodata_values?: boolean
              out_db?: boolean
              extent?: boolean
            }
          | { rasttable: unknown; rastcolumn: unknown }
          | {
              rasttable: unknown
              rastcolumn: unknown
              srid?: boolean
              scale_x?: boolean
              scale_y?: boolean
              blocksize_x?: boolean
              blocksize_y?: boolean
              same_alignment?: boolean
              regular_blocking?: boolean
              num_bands?: boolean
              pixel_types?: boolean
              nodata_values?: boolean
              out_db?: boolean
              extent?: boolean
            }
        Returns: boolean
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_user_consent_status: {
        Args: { p_user_id: string }
        Returns: {
          document_type: Database["public"]["Enums"]["legal_document_type"]
          is_accepted: boolean
          accepted_version: string
          accepted_at: string
          needs_update: boolean
        }[]
      }
      get_user_metadata: {
        Args: { target_user_id?: string }
        Returns: Json
      }
      get_user_subscription_tier: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
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
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      link_consent_to_user: {
        Args: { p_user_id: string; p_email: string; p_consent_token: string }
        Returns: Json
      }
      log_error: {
        Args: {
          p_error_type: string
          p_error_code: string
          p_error_message: string
          p_error_stack?: string
          p_context?: Json
          p_severity?: string
          p_url?: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_login_activity: {
        Args: { p_user_id: string; p_tracking_data: Json }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_severity: string
          p_action: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_activity_type: string
          p_activity_name: string
          p_activity_category?: string
          p_activity_value?: Json
          p_page_url?: string
          p_page_title?: string
        }
        Returns: string
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_gdal_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_raster_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_raster_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_raster_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      raster_hash: {
        Args: { "": unknown }
        Returns: number
      }
      raster_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      raster_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      record_legal_acceptance: {
        Args: {
          p_user_id: string
          p_legal_id: string
          p_ip_address?: string
          p_user_agent?: string
          p_signature_data?: Json
        }
        Returns: undefined
      }
      record_signup_consent: {
        Args: {
          p_email: string
          p_gdpr_consent: boolean
          p_ccpa_consent: boolean
          p_marketing_consent: boolean
          p_data_processing_consent: boolean
          p_cookie_consent: boolean
          p_terms_accepted: boolean
          p_privacy_accepted: boolean
          p_age_confirmed: boolean
          p_ai_tools_consent: boolean
          p_ip_address?: string
          p_user_agent?: string
          p_fingerprint?: string
        }
        Returns: Json
      }
      record_user_consent: {
        Args: {
          p_user_id: string
          p_document_id: string
          p_action: Database["public"]["Enums"]["consent_action_type"]
          p_ip_address: unknown
          p_user_agent?: string
          p_device_fingerprint?: string
          p_metadata?: Json
        }
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_user_metadata: {
        Args: { target_user_id: string; metadata_updates: Json }
        Returns: Json
      }
      show_current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addband: {
        Args:
          | {
              rast: unknown
              addbandargset: Database["public"]["CompositeTypes"]["addbandarg"][]
            }
          | {
              rast: unknown
              index: number
              outdbfile: string
              outdbindex: number[]
              nodataval?: number
            }
          | {
              rast: unknown
              index: number
              pixeltype: string
              initialvalue?: number
              nodataval?: number
            }
          | {
              rast: unknown
              outdbfile: string
              outdbindex: number[]
              index?: number
              nodataval?: number
            }
          | {
              rast: unknown
              pixeltype: string
              initialvalue?: number
              nodataval?: number
            }
          | {
              torast: unknown
              fromrast: unknown
              fromband?: number
              torastindex?: number
            }
          | {
              torast: unknown
              fromrasts: unknown[]
              fromband?: number
              torastindex?: number
            }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_approxcount: {
        Args:
          | {
              rast: unknown
              exclude_nodata_value: boolean
              sample_percent?: number
            }
          | { rast: unknown; nband: number; sample_percent: number }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              sample_percent?: number
            }
          | { rast: unknown; sample_percent: number }
        Returns: number
      }
      st_approxhistogram: {
        Args:
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              sample_percent: number
              bins: number
              right: boolean
            }
          | { rast: unknown; nband: number; sample_percent: number }
          | {
              rast: unknown
              nband: number
              sample_percent: number
              bins: number
              right: boolean
            }
          | {
              rast: unknown
              nband: number
              sample_percent: number
              bins: number
              width?: number[]
              right?: boolean
            }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              sample_percent?: number
              bins?: number
              width?: number[]
              right?: boolean
            }
          | { rast: unknown; sample_percent: number }
        Returns: Record<string, unknown>[]
      }
      st_approxquantile: {
        Args:
          | { rast: unknown; exclude_nodata_value: boolean; quantile?: number }
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              sample_percent: number
              quantile: number
            }
          | {
              rast: unknown
              nband: number
              sample_percent: number
              quantile: number
            }
          | {
              rast: unknown
              nband: number
              sample_percent: number
              quantiles?: number[]
            }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              sample_percent?: number
              quantiles?: number[]
            }
          | { rast: unknown; quantile: number }
          | { rast: unknown; quantiles: number[] }
          | { rast: unknown; sample_percent: number; quantile: number }
          | { rast: unknown; sample_percent: number; quantiles?: number[] }
        Returns: number
      }
      st_approxsummarystats: {
        Args:
          | {
              rast: unknown
              exclude_nodata_value: boolean
              sample_percent?: number
            }
          | { rast: unknown; nband: number; sample_percent: number }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              sample_percent?: number
            }
          | { rast: unknown; sample_percent: number }
        Returns: Database["public"]["CompositeTypes"]["summarystats"]
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgdalraster: {
        Args: {
          rast: unknown
          format: string
          options?: string[]
          srid?: number
        }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | {
              version: number
              geom: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asjpeg: {
        Args:
          | { rast: unknown; nband: number; options?: string[] }
          | { rast: unknown; nband: number; quality: number }
          | { rast: unknown; nbands: number[]; options?: string[] }
          | { rast: unknown; nbands: number[]; quality: number }
          | { rast: unknown; options?: string[] }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { geom: unknown; format?: string }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          geom: unknown
          bounds: unknown
          extent?: number
          buffer?: number
          clip_geom?: boolean
        }
        Returns: unknown
      }
      st_aspect: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              units?: string
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              units?: string
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_aspng: {
        Args:
          | { rast: unknown; nband: number; compression: number }
          | { rast: unknown; nband: number; options?: string[] }
          | { rast: unknown; nbands: number[]; compression: number }
          | { rast: unknown; nbands: number[]; options?: string[] }
          | { rast: unknown; options?: string[] }
        Returns: string
      }
      st_asraster: {
        Args:
          | {
              geom: unknown
              ref: unknown
              pixeltype: string
              value?: number
              nodataval?: number
              touched?: boolean
            }
          | {
              geom: unknown
              ref: unknown
              pixeltype?: string[]
              value?: number[]
              nodataval?: number[]
              touched?: boolean
            }
          | {
              geom: unknown
              scalex: number
              scaley: number
              gridx: number
              gridy: number
              pixeltype: string
              value?: number
              nodataval?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              scalex: number
              scaley: number
              gridx?: number
              gridy?: number
              pixeltype?: string[]
              value?: number[]
              nodataval?: number[]
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              scalex: number
              scaley: number
              pixeltype: string[]
              value?: number[]
              nodataval?: number[]
              upperleftx?: number
              upperlefty?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              scalex: number
              scaley: number
              pixeltype: string
              value?: number
              nodataval?: number
              upperleftx?: number
              upperlefty?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              width: number
              height: number
              gridx: number
              gridy: number
              pixeltype: string
              value?: number
              nodataval?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              width: number
              height: number
              gridx?: number
              gridy?: number
              pixeltype?: string[]
              value?: number[]
              nodataval?: number[]
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              width: number
              height: number
              pixeltype: string[]
              value?: number[]
              nodataval?: number[]
              upperleftx?: number
              upperlefty?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
          | {
              geom: unknown
              width: number
              height: number
              pixeltype: string
              value?: number
              nodataval?: number
              upperleftx?: number
              upperlefty?: number
              skewx?: number
              skewy?: number
              touched?: boolean
            }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; rel?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astiff: {
        Args:
          | { rast: unknown; compression: string; srid?: number }
          | {
              rast: unknown
              nbands: number[]
              compression: string
              srid?: number
            }
          | {
              rast: unknown
              nbands: number[]
              options?: string[]
              srid?: number
            }
          | { rast: unknown; options?: string[]; srid?: number }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_band: {
        Args:
          | { rast: unknown; nband: number }
          | { rast: unknown; nbands: string; delimiter?: string }
          | { rast: unknown; nbands?: number[] }
        Returns: unknown
      }
      st_bandfilesize: {
        Args: { rast: unknown; band?: number }
        Returns: number
      }
      st_bandfiletimestamp: {
        Args: { rast: unknown; band?: number }
        Returns: number
      }
      st_bandisnodata: {
        Args:
          | { rast: unknown; band?: number; forcechecking?: boolean }
          | { rast: unknown; forcechecking: boolean }
        Returns: boolean
      }
      st_bandmetadata: {
        Args:
          | { rast: unknown; band: number[] }
          | { rast: unknown; band?: number }
        Returns: {
          pixeltype: string
          nodatavalue: number
          isoutdb: boolean
          path: string
          outdbbandnum: number
          filesize: number
          filetimestamp: number
        }[]
      }
      st_bandnodatavalue: {
        Args: { rast: unknown; band?: number }
        Returns: number
      }
      st_bandpath: {
        Args: { rast: unknown; band?: number }
        Returns: string
      }
      st_bandpixeltype: {
        Args: { rast: unknown; band?: number }
        Returns: string
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; options?: string }
          | { geom: unknown; radius: number; quadsegs: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clip: {
        Args:
          | { rast: unknown; geom: unknown; crop: boolean }
          | { rast: unknown; geom: unknown; nodataval: number; crop?: boolean }
          | {
              rast: unknown
              geom: unknown
              nodataval?: number[]
              crop?: boolean
            }
          | {
              rast: unknown
              nband: number[]
              geom: unknown
              nodataval?: number[]
              crop?: boolean
            }
          | { rast: unknown; nband: number; geom: unknown; crop: boolean }
          | {
              rast: unknown
              nband: number
              geom: unknown
              nodataval: number
              crop?: boolean
            }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_colormap: {
        Args:
          | { rast: unknown; colormap: string; method?: string }
          | {
              rast: unknown
              nband?: number
              colormap?: string
              method?: string
            }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
        }
        Returns: unknown
      }
      st_contains: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_contour: {
        Args: {
          rast: unknown
          bandnumber?: number
          level_interval?: number
          level_base?: number
          fixed_levels?: number[]
          polygonize?: boolean
        }
        Returns: {
          geom: unknown
          id: number
          value: number
        }[]
      }
      st_convexhull: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_count: {
        Args:
          | { rast: unknown; exclude_nodata_value: boolean }
          | { rast: unknown; nband?: number; exclude_nodata_value?: boolean }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_createoverview: {
        Args: { tab: unknown; col: unknown; factor: number; algo?: string }
        Returns: unknown
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { geom: unknown; tol?: number; toltype?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; tolerance?: number; flags?: number }
        Returns: unknown
      }
      st_dfullywithin: {
        Args:
          | {
              rast1: unknown
              nband1: number
              rast2: unknown
              nband2: number
              distance: number
            }
          | { rast1: unknown; rast2: unknown; distance: number }
        Returns: boolean
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distinct4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpaspolygons: {
        Args: { rast: unknown; band?: number; exclude_nodata_value?: boolean }
        Returns: Database["public"]["CompositeTypes"]["geomval"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpvalues: {
        Args:
          | { rast: unknown; nband: number; exclude_nodata_value?: boolean }
          | { rast: unknown; nband?: number[]; exclude_nodata_value?: boolean }
        Returns: {
          nband: number
          valarray: number[]
        }[]
      }
      st_dwithin: {
        Args:
          | {
              geog1: unknown
              geog2: unknown
              tolerance: number
              use_spheroid?: boolean
            }
          | {
              rast1: unknown
              nband1: number
              rast2: unknown
              nband2: number
              distance: number
            }
          | { rast1: unknown; rast2: unknown; distance: number }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { geom: unknown; dx: number; dy: number; dz?: number; dm?: number }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; zvalue?: number; mvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_fromgdalraster: {
        Args: { gdaldata: string; srid?: number }
        Returns: unknown
      }
      st_gdaldrivers: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          g: unknown
          tolerance?: number
          max_iter?: number
          fail_if_not_converged?: boolean
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_georeference: {
        Args: { rast: unknown; format?: string }
        Returns: string
      }
      st_geotransform: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_grayscale: {
        Args:
          | {
              rast: unknown
              redband?: number
              greenband?: number
              blueband?: number
              extenttype?: string
            }
          | {
              rastbandargset: Database["public"]["CompositeTypes"]["rastbandarg"][]
              extenttype?: string
            }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hasnoband: {
        Args: { rast: unknown; nband?: number }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_height: {
        Args: { "": unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_hillshade: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              azimuth?: number
              altitude?: number
              max_bright?: number
              scale?: number
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              azimuth?: number
              altitude?: number
              max_bright?: number
              scale?: number
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_histogram: {
        Args:
          | { rast: unknown; nband: number; bins: number; right: boolean }
          | {
              rast: unknown
              nband: number
              bins: number
              width?: number[]
              right?: boolean
            }
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              bins: number
              right: boolean
            }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              bins?: number
              width?: number[]
              right?: boolean
            }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_interpolateraster: {
        Args: {
          geom: unknown
          options: string
          rast: unknown
          bandnumber?: number
        }
        Returns: unknown
      }
      st_intersection: {
        Args:
          | { geom1: unknown; geom2: unknown; gridsize?: number }
          | { geomin: unknown; rast: unknown; band?: number }
          | { rast: unknown; band: number; geomin: unknown }
          | { rast: unknown; geomin: unknown }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              nodataval: number[]
            }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              nodataval: number
            }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              returnband: string
              nodataval: number
            }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              returnband?: string
              nodataval?: number[]
            }
          | { rast1: unknown; rast2: unknown; nodataval: number[] }
          | { rast1: unknown; rast2: unknown; nodataval: number }
          | {
              rast1: unknown
              rast2: unknown
              returnband: string
              nodataval: number
            }
          | {
              rast1: unknown
              rast2: unknown
              returnband?: string
              nodataval?: number[]
            }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom: unknown; rast: unknown; nband?: number }
          | { geom1: unknown; geom2: unknown }
          | { rast: unknown; geom: unknown; nband?: number }
          | { rast: unknown; nband: number; geom: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_invdistweight4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscoveragetile: {
        Args: {
          rast: unknown
          coverage: unknown
          tilewidth: number
          tileheight: number
        }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown } | { rast: unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          tomeasure: number
          leftrightoffset?: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeemptycoverage: {
        Args: {
          tilewidth: number
          tileheight: number
          width: number
          height: number
          upperleftx: number
          upperlefty: number
          scalex: number
          scaley: number
          skewx: number
          skewy: number
          srid?: number
        }
        Returns: unknown[]
      }
      st_makeemptyraster: {
        Args:
          | { rast: unknown }
          | {
              width: number
              height: number
              upperleftx: number
              upperlefty: number
              pixelsize: number
            }
          | {
              width: number
              height: number
              upperleftx: number
              upperlefty: number
              scalex: number
              scaley: number
              skewx: number
              skewy: number
              srid?: number
            }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_mapalgebra: {
        Args:
          | {
              rast: unknown
              nband: number[]
              callbackfunc: unknown
              pixeltype?: string
              extenttype?: string
              customextent?: unknown
              distancex?: number
              distancey?: number
            }
          | {
              rast: unknown
              nband: number
              callbackfunc: unknown
              mask: number[]
              weighted: boolean
              pixeltype?: string
              extenttype?: string
              customextent?: unknown
            }
          | {
              rast: unknown
              nband: number
              callbackfunc: unknown
              pixeltype?: string
              extenttype?: string
              customextent?: unknown
              distancex?: number
              distancey?: number
            }
          | {
              rast: unknown
              nband: number
              pixeltype: string
              expression: string
              nodataval?: number
            }
          | {
              rast: unknown
              pixeltype: string
              expression: string
              nodataval?: number
            }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              expression: string
              pixeltype?: string
              extenttype?: string
              nodata1expr?: string
              nodata2expr?: string
              nodatanodataval?: number
            }
          | {
              rast1: unknown
              nband1: number
              rast2: unknown
              nband2: number
              callbackfunc: unknown
              pixeltype?: string
              extenttype?: string
              customextent?: unknown
              distancex?: number
              distancey?: number
            }
          | {
              rast1: unknown
              rast2: unknown
              expression: string
              pixeltype?: string
              extenttype?: string
              nodata1expr?: string
              nodata2expr?: string
              nodatanodataval?: number
            }
          | {
              rastbandargset: Database["public"]["CompositeTypes"]["rastbandarg"][]
              callbackfunc: unknown
              pixeltype?: string
              extenttype?: string
              customextent?: unknown
              distancex?: number
              distancey?: number
            }
        Returns: unknown
      }
      st_mapalgebraexpr: {
        Args:
          | {
              rast: unknown
              band: number
              pixeltype: string
              expression: string
              nodataval?: number
            }
          | {
              rast: unknown
              pixeltype: string
              expression: string
              nodataval?: number
            }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              expression: string
              pixeltype?: string
              extenttype?: string
              nodata1expr?: string
              nodata2expr?: string
              nodatanodataval?: number
            }
          | {
              rast1: unknown
              rast2: unknown
              expression: string
              pixeltype?: string
              extenttype?: string
              nodata1expr?: string
              nodata2expr?: string
              nodatanodataval?: number
            }
        Returns: unknown
      }
      st_mapalgebrafct: {
        Args:
          | { rast: unknown; band: number; onerastuserfunc: unknown }
          | { rast: unknown; band: number; onerastuserfunc: unknown }
          | {
              rast: unknown
              band: number
              pixeltype: string
              onerastuserfunc: unknown
            }
          | {
              rast: unknown
              band: number
              pixeltype: string
              onerastuserfunc: unknown
            }
          | { rast: unknown; onerastuserfunc: unknown }
          | { rast: unknown; onerastuserfunc: unknown }
          | { rast: unknown; pixeltype: string; onerastuserfunc: unknown }
          | { rast: unknown; pixeltype: string; onerastuserfunc: unknown }
          | {
              rast1: unknown
              band1: number
              rast2: unknown
              band2: number
              tworastuserfunc: unknown
              pixeltype?: string
              extenttype?: string
            }
          | {
              rast1: unknown
              rast2: unknown
              tworastuserfunc: unknown
              pixeltype?: string
              extenttype?: string
            }
        Returns: unknown
      }
      st_mapalgebrafctngb: {
        Args: {
          rast: unknown
          band: number
          pixeltype: string
          ngbwidth: number
          ngbheight: number
          onerastngbuserfunc: unknown
          nodatamode: string
        }
        Returns: unknown
      }
      st_max4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_mean4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_memsize: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      st_metadata: {
        Args: { rast: unknown }
        Returns: Record<string, unknown>
      }
      st_min4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_minconvexhull: {
        Args: { rast: unknown; nband?: number }
        Returns: unknown
      }
      st_mindist4ma: {
        Args: { value: number[]; pos: number[] }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_minpossiblevalue: {
        Args: { pixeltype: string }
        Returns: number
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_nearestvalue: {
        Args:
          | {
              rast: unknown
              band: number
              columnx: number
              rowy: number
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              band: number
              pt: unknown
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              columnx: number
              rowy: number
              exclude_nodata_value?: boolean
            }
          | { rast: unknown; pt: unknown; exclude_nodata_value?: boolean }
        Returns: number
      }
      st_neighborhood: {
        Args:
          | {
              rast: unknown
              band: number
              columnx: number
              rowy: number
              distancex: number
              distancey: number
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              band: number
              pt: unknown
              distancex: number
              distancey: number
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              columnx: number
              rowy: number
              distancex: number
              distancey: number
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              pt: unknown
              distancex: number
              distancey: number
              exclude_nodata_value?: boolean
            }
        Returns: number[]
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_notsamealignmentreason: {
        Args: { rast1: unknown; rast2: unknown }
        Returns: string
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numbands: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { line: unknown; distance: number; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pixelascentroid: {
        Args: { rast: unknown; x: number; y: number }
        Returns: unknown
      }
      st_pixelascentroids: {
        Args: { rast: unknown; band?: number; exclude_nodata_value?: boolean }
        Returns: {
          geom: unknown
          val: number
          x: number
          y: number
        }[]
      }
      st_pixelaspoint: {
        Args: { rast: unknown; x: number; y: number }
        Returns: unknown
      }
      st_pixelaspoints: {
        Args: { rast: unknown; band?: number; exclude_nodata_value?: boolean }
        Returns: {
          geom: unknown
          val: number
          x: number
          y: number
        }[]
      }
      st_pixelaspolygon: {
        Args: { rast: unknown; x: number; y: number }
        Returns: unknown
      }
      st_pixelaspolygons: {
        Args: { rast: unknown; band?: number; exclude_nodata_value?: boolean }
        Returns: {
          geom: unknown
          val: number
          x: number
          y: number
        }[]
      }
      st_pixelheight: {
        Args: { "": unknown }
        Returns: number
      }
      st_pixelofvalue: {
        Args:
          | {
              rast: unknown
              nband: number
              search: number[]
              exclude_nodata_value?: boolean
            }
          | {
              rast: unknown
              nband: number
              search: number
              exclude_nodata_value?: boolean
            }
          | { rast: unknown; search: number[]; exclude_nodata_value?: boolean }
          | { rast: unknown; search: number; exclude_nodata_value?: boolean }
        Returns: {
          x: number
          y: number
        }[]
      }
      st_pixelwidth: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygon: {
        Args: { rast: unknown; band?: number }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { geog: unknown; distance: number; azimuth: number }
        Returns: unknown
      }
      st_quantile: {
        Args:
          | { rast: unknown; exclude_nodata_value: boolean; quantile?: number }
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              quantile: number
            }
          | { rast: unknown; nband: number; quantile: number }
          | { rast: unknown; nband: number; quantiles: number[] }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              quantiles?: number[]
            }
          | { rast: unknown; quantile: number }
          | { rast: unknown; quantiles: number[] }
        Returns: Record<string, unknown>[]
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_range4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_rastertoworldcoord: {
        Args: { rast: unknown; columnx: number; rowy: number }
        Returns: Record<string, unknown>
      }
      st_rastertoworldcoordx: {
        Args:
          | { rast: unknown; xr: number }
          | { rast: unknown; xr: number; yr: number }
        Returns: number
      }
      st_rastertoworldcoordy: {
        Args:
          | { rast: unknown; xr: number; yr: number }
          | { rast: unknown; yr: number }
        Returns: number
      }
      st_rastfromhexwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_rastfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_reclass: {
        Args:
          | { rast: unknown }
          | {
              rast: unknown
              nband: number
              reclassexpr: string
              pixeltype: string
              nodataval?: number
            }
          | { rast: unknown; reclassexpr: string; pixeltype: string }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_resample: {
        Args:
          | {
              rast: unknown
              ref: unknown
              algorithm?: string
              maxerr?: number
              usescale?: boolean
            }
          | {
              rast: unknown
              ref: unknown
              usescale: boolean
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              scalex?: number
              scaley?: number
              gridx?: number
              gridy?: number
              skewx?: number
              skewy?: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              width: number
              height: number
              gridx?: number
              gridy?: number
              skewx?: number
              skewy?: number
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_rescale: {
        Args:
          | {
              rast: unknown
              scalex: number
              scaley: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              scalexy: number
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_resize: {
        Args:
          | {
              rast: unknown
              percentwidth: number
              percentheight: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              width: number
              height: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              width: string
              height: string
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_reskew: {
        Args:
          | {
              rast: unknown
              skewx: number
              skewy: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              skewxy: number
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_retile: {
        Args: {
          tab: unknown
          col: unknown
          ext: unknown
          sfx: number
          sfy: number
          tw: number
          th: number
          algo?: string
        }
        Returns: unknown[]
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_rotation: {
        Args: { "": unknown }
        Returns: number
      }
      st_roughness: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_samealignment: {
        Args:
          | { rast1: unknown; rast2: unknown }
          | {
              ulx1: number
              uly1: number
              scalex1: number
              scaley1: number
              skewx1: number
              skewy1: number
              ulx2: number
              uly2: number
              scalex2: number
              scaley2: number
              skewx2: number
              skewy2: number
            }
        Returns: boolean
      }
      st_scalex: {
        Args: { "": unknown }
        Returns: number
      }
      st_scaley: {
        Args: { "": unknown }
        Returns: number
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setbandindex: {
        Args: {
          rast: unknown
          band: number
          outdbindex: number
          force?: boolean
        }
        Returns: unknown
      }
      st_setbandisnodata: {
        Args: { rast: unknown; band?: number }
        Returns: unknown
      }
      st_setbandnodatavalue: {
        Args:
          | {
              rast: unknown
              band: number
              nodatavalue: number
              forcechecking?: boolean
            }
          | { rast: unknown; nodatavalue: number }
        Returns: unknown
      }
      st_setbandpath: {
        Args: {
          rast: unknown
          band: number
          outdbpath: string
          outdbindex: number
          force?: boolean
        }
        Returns: unknown
      }
      st_setgeoreference: {
        Args:
          | { rast: unknown; georef: string; format?: string }
          | {
              rast: unknown
              upperleftx: number
              upperlefty: number
              scalex: number
              scaley: number
              skewx: number
              skewy: number
            }
        Returns: unknown
      }
      st_setgeotransform: {
        Args: {
          rast: unknown
          imag: number
          jmag: number
          theta_i: number
          theta_ij: number
          xoffset: number
          yoffset: number
        }
        Returns: unknown
      }
      st_setm: {
        Args: { rast: unknown; geom: unknown; resample?: string; band?: number }
        Returns: unknown
      }
      st_setrotation: {
        Args: { rast: unknown; rotation: number }
        Returns: unknown
      }
      st_setscale: {
        Args:
          | { rast: unknown; scale: number }
          | { rast: unknown; scalex: number; scaley: number }
        Returns: unknown
      }
      st_setskew: {
        Args:
          | { rast: unknown; skew: number }
          | { rast: unknown; skewx: number; skewy: number }
        Returns: unknown
      }
      st_setsrid: {
        Args:
          | { geog: unknown; srid: number }
          | { geom: unknown; srid: number }
          | { rast: unknown; srid: number }
        Returns: unknown
      }
      st_setupperleft: {
        Args: { rast: unknown; upperleftx: number; upperlefty: number }
        Returns: unknown
      }
      st_setvalue: {
        Args:
          | {
              rast: unknown
              band: number
              x: number
              y: number
              newvalue: number
            }
          | { rast: unknown; geom: unknown; newvalue: number }
          | { rast: unknown; nband: number; geom: unknown; newvalue: number }
          | { rast: unknown; x: number; y: number; newvalue: number }
        Returns: unknown
      }
      st_setvalues: {
        Args:
          | {
              rast: unknown
              nband: number
              geomvalset: Database["public"]["CompositeTypes"]["geomval"][]
              keepnodata?: boolean
            }
          | {
              rast: unknown
              nband: number
              x: number
              y: number
              newvalueset: number[]
              noset?: boolean[]
              keepnodata?: boolean
            }
          | {
              rast: unknown
              nband: number
              x: number
              y: number
              newvalueset: number[]
              nosetvalue: number
              keepnodata?: boolean
            }
          | {
              rast: unknown
              nband: number
              x: number
              y: number
              width: number
              height: number
              newvalue: number
              keepnodata?: boolean
            }
          | {
              rast: unknown
              x: number
              y: number
              width: number
              height: number
              newvalue: number
              keepnodata?: boolean
            }
        Returns: unknown
      }
      st_setz: {
        Args: { rast: unknown; geom: unknown; resample?: string; band?: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_skewx: {
        Args: { "": unknown }
        Returns: number
      }
      st_skewy: {
        Args: { "": unknown }
        Returns: number
      }
      st_slope: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              units?: string
              scale?: number
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              units?: string
              scale?: number
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_snaptogrid: {
        Args:
          | {
              rast: unknown
              gridx: number
              gridy: number
              algorithm?: string
              maxerr?: number
              scalex?: number
              scaley?: number
            }
          | {
              rast: unknown
              gridx: number
              gridy: number
              scalex: number
              scaley: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              gridx: number
              gridy: number
              scalexy: number
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { "": unknown } | { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_stddev4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number }
        Returns: unknown[]
      }
      st_sum4ma: {
        Args:
          | { matrix: number[]; nodatamode: string }
          | { value: number[]; pos: number[] }
        Returns: number
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown } | { rast: unknown }
        Returns: string
      }
      st_summarystats: {
        Args:
          | { rast: unknown; exclude_nodata_value: boolean }
          | { rast: unknown; nband?: number; exclude_nodata_value?: boolean }
        Returns: Database["public"]["CompositeTypes"]["summarystats"]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tile: {
        Args:
          | {
              rast: unknown
              nband: number[]
              width: number
              height: number
              padwithnodata?: boolean
              nodataval?: number
            }
          | {
              rast: unknown
              nband: number
              width: number
              height: number
              padwithnodata?: boolean
              nodataval?: number
            }
          | {
              rast: unknown
              width: number
              height: number
              padwithnodata?: boolean
              nodataval?: number
            }
        Returns: unknown[]
      }
      st_tileenvelope: {
        Args: {
          zoom: number
          x: number
          y: number
          bounds?: unknown
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_tpi: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_proj: string }
          | { geom: unknown; from_proj: string; to_srid: number }
          | { geom: unknown; to_proj: string }
          | {
              rast: unknown
              alignto: unknown
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              srid: number
              algorithm?: string
              maxerr?: number
              scalex?: number
              scaley?: number
            }
          | {
              rast: unknown
              srid: number
              scalex: number
              scaley: number
              algorithm?: string
              maxerr?: number
            }
          | {
              rast: unknown
              srid: number
              scalexy: number
              algorithm?: string
              maxerr?: number
            }
        Returns: unknown
      }
      st_tri: {
        Args:
          | {
              rast: unknown
              nband: number
              customextent: unknown
              pixeltype?: string
              interpolate_nodata?: boolean
            }
          | {
              rast: unknown
              nband?: number
              pixeltype?: string
              interpolate_nodata?: boolean
            }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_upperleftx: {
        Args: { "": unknown }
        Returns: number
      }
      st_upperlefty: {
        Args: { "": unknown }
        Returns: number
      }
      st_value: {
        Args:
          | {
              rast: unknown
              band: number
              pt: unknown
              exclude_nodata_value?: boolean
              resample?: string
            }
          | {
              rast: unknown
              band: number
              x: number
              y: number
              exclude_nodata_value?: boolean
            }
          | { rast: unknown; pt: unknown; exclude_nodata_value?: boolean }
          | {
              rast: unknown
              x: number
              y: number
              exclude_nodata_value?: boolean
            }
        Returns: number
      }
      st_valuecount: {
        Args:
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              searchvalue: number
              roundto?: number
            }
          | {
              rast: unknown
              nband: number
              searchvalue: number
              roundto?: number
            }
          | {
              rast: unknown
              nband: number
              searchvalues: number[]
              roundto?: number
            }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
          | { rast: unknown; searchvalue: number; roundto?: number }
          | { rast: unknown; searchvalues: number[]; roundto?: number }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              exclude_nodata_value: boolean
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              searchvalues: number[]
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              searchvalues: number[]
              roundto?: number
            }
        Returns: number
      }
      st_valuepercent: {
        Args:
          | {
              rast: unknown
              nband: number
              exclude_nodata_value: boolean
              searchvalue: number
              roundto?: number
            }
          | {
              rast: unknown
              nband: number
              searchvalue: number
              roundto?: number
            }
          | {
              rast: unknown
              nband: number
              searchvalues: number[]
              roundto?: number
            }
          | {
              rast: unknown
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
          | { rast: unknown; searchvalue: number; roundto?: number }
          | { rast: unknown; searchvalues: number[]; roundto?: number }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              exclude_nodata_value: boolean
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband: number
              searchvalues: number[]
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              nband?: number
              exclude_nodata_value?: boolean
              searchvalues?: number[]
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              searchvalue: number
              roundto?: number
            }
          | {
              rastertable: string
              rastercolumn: string
              searchvalues: number[]
              roundto?: number
            }
        Returns: Record<string, unknown>[]
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_width: {
        Args: { "": unknown }
        Returns: number
      }
      st_within: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { rast1: unknown; nband1: number; rast2: unknown; nband2: number }
          | { rast1: unknown; rast2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_worldtorastercoord: {
        Args:
          | { rast: unknown; longitude: number; latitude: number }
          | { rast: unknown; pt: unknown }
        Returns: Record<string, unknown>
      }
      st_worldtorastercoordx: {
        Args:
          | { rast: unknown; pt: unknown }
          | { rast: unknown; xw: number }
          | { rast: unknown; xw: number; yw: number }
        Returns: number
      }
      st_worldtorastercoordy: {
        Args:
          | { rast: unknown; pt: unknown }
          | { rast: unknown; xw: number; yw: number }
          | { rast: unknown; yw: number }
        Returns: number
      }
      st_wrapx: {
        Args: { geom: unknown; wrap: number; move: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      track_user_consent: {
        Args: {
          p_user_id: string
          p_action: string
          p_consent_data: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      track_user_device: {
        Args: {
          p_user_id: string
          p_device_fingerprint: string
          p_device_type?: string
          p_browser?: string
          p_os?: string
          p_ip_address?: string
        }
        Returns: undefined
      }
      track_user_login: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_ip_address: unknown
          p_user_agent: string
          p_referrer_url?: string
          p_utm_source?: string
          p_utm_medium?: string
          p_utm_campaign?: string
          p_login_method?: string
        }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_email_status: {
        Args: { p_resend_id: string; p_status: string; p_timestamp?: string }
        Returns: undefined
      }
      update_property_enrichment: {
        Args: {
          p_property_id: string
          p_enrichment_data: Json
          p_previous_version: number
        }
        Returns: undefined
      }
      update_user_consent_preferences: {
        Args: {
          p_user_id: string
          p_consent_type: string
          p_consent_value: boolean
        }
        Returns: Json
      }
      update_user_phone: {
        Args: { p_user_id: string; p_phone: string }
        Returns: boolean
      }
      update_user_preference: {
        Args: {
          p_user_id: string
          p_preference_name: string
          p_preference_value: boolean
          p_ip_address: string
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
      updaterastersrid: {
        Args:
          | {
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              new_srid: number
            }
          | { table_name: unknown; column_name: unknown; new_srid: number }
        Returns: boolean
      }
      validate_signup_consent: {
        Args: { p_email: string; p_consent_token: string }
        Returns: Json
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
      claim_status:
        | "draft"
        | "submitted"
        | "acknowledged"
        | "investigating"
        | "approved"
        | "denied"
        | "settled"
        | "closed"
        | "reopened"
        | "withdrawn"
      consent_action_type:
        | "accepted"
        | "declined"
        | "withdrawn"
        | "updated"
        | "rejected"
      damage_severity: "minor" | "moderate" | "major" | "severe" | "total_loss"
      item_category:
        | "ELECTRONICS"
        | "FURNITURE"
        | "APPLIANCES"
        | "JEWELRY"
        | "CLOTHING"
        | "TOOLS"
        | "SPORTS"
        | "COLLECTIBLES"
        | "DOCUMENTS"
        | "STRUCTURE"
        | "SYSTEM"
        | "OTHER"
      legal_document_type:
        | "privacy_policy"
        | "terms_of_service"
        | "ai_use_agreement"
        | "cookie_policy"
        | "data_processing_agreement"
      occupancy_status:
        | "owner_occupied"
        | "tenant_occupied"
        | "vacant"
        | "seasonal"
      property_type:
        | "single_family"
        | "condo"
        | "townhouse"
        | "mobile_home"
        | "multi_family"
        | "commercial"
        | "vacant_land"
    }
    CompositeTypes: {
      addbandarg: {
        index: number | null
        pixeltype: string | null
        initialvalue: number | null
        nodataval: number | null
      }
      agg_count: {
        count: number | null
        nband: number | null
        exclude_nodata_value: boolean | null
        sample_percent: number | null
      }
      agg_samealignment: {
        refraster: unknown | null
        aligned: boolean | null
      }
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      geomval: {
        geom: unknown | null
        val: number | null
      }
      rastbandarg: {
        rast: unknown | null
        nband: number | null
      }
      reclassarg: {
        nband: number | null
        reclassexpr: string | null
        pixeltype: string | null
        nodataval: number | null
      }
      summarystats: {
        count: number | null
        sum: number | null
        mean: number | null
        stddev: number | null
        min: number | null
        max: number | null
      }
      unionarg: {
        nband: number | null
        uniontype: string | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
      claim_status: [
        "draft",
        "submitted",
        "acknowledged",
        "investigating",
        "approved",
        "denied",
        "settled",
        "closed",
        "reopened",
        "withdrawn",
      ],
      consent_action_type: [
        "accepted",
        "declined",
        "withdrawn",
        "updated",
        "rejected",
      ],
      damage_severity: ["minor", "moderate", "major", "severe", "total_loss"],
      item_category: [
        "ELECTRONICS",
        "FURNITURE",
        "APPLIANCES",
        "JEWELRY",
        "CLOTHING",
        "TOOLS",
        "SPORTS",
        "COLLECTIBLES",
        "DOCUMENTS",
        "STRUCTURE",
        "SYSTEM",
        "OTHER",
      ],
      legal_document_type: [
        "privacy_policy",
        "terms_of_service",
        "ai_use_agreement",
        "cookie_policy",
        "data_processing_agreement",
      ],
      occupancy_status: [
        "owner_occupied",
        "tenant_occupied",
        "vacant",
        "seasonal",
      ],
      property_type: [
        "single_family",
        "condo",
        "townhouse",
        "mobile_home",
        "multi_family",
        "commercial",
        "vacant_land",
      ],
    },
  },
} as const
