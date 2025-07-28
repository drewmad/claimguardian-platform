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
      ai_analyses: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          cost_cents: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          input_data: Json
          input_embedding: string | null
          model_id: string | null
          output_data: Json
          output_embedding: string | null
          processing_time_ms: number | null
          retry_count: number | null
          status: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          input_data: Json
          input_embedding?: string | null
          model_id?: string | null
          output_data: Json
          output_embedding?: string | null
          processing_time_ms?: number | null
          retry_count?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          input_embedding?: string | null
          model_id?: string | null
          output_data?: Json
          output_embedding?: string | null
          processing_time_ms?: number | null
          retry_count?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_embedding: string | null
          context_id: string | null
          context_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          messages: Json | null
          title: string | null
          total_cost_cents: number | null
          total_messages: number | null
          total_tokens: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_embedding?: string | null
          context_id?: string | null
          context_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json | null
          title?: string | null
          total_cost_cents?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_embedding?: string | null
          context_id?: string | null
          context_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json | null
          title?: string | null
          total_cost_cents?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          additional_info: Json | null
          analysis_id: string | null
          comments: string | null
          corrections: Json | null
          created_at: string | null
          id: string
          rating: number | null
          resulted_in_model_update: boolean | null
          user_id: string
          was_accurate: boolean | null
          was_helpful: boolean | null
        }
        Insert: {
          additional_info?: Json | null
          analysis_id?: string | null
          comments?: string | null
          corrections?: Json | null
          created_at?: string | null
          id?: string
          rating?: number | null
          resulted_in_model_update?: boolean | null
          user_id: string
          was_accurate?: boolean | null
          was_helpful?: boolean | null
        }
        Update: {
          additional_info?: Json | null
          analysis_id?: string | null
          comments?: string | null
          corrections?: Json | null
          created_at?: string | null
          id?: string
          rating?: number | null
          resulted_in_model_update?: boolean | null
          user_id?: string
          was_accurate?: boolean | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          capabilities: Json | null
          config: Json | null
          context_window: number | null
          cost_per_1k_tokens: number | null
          cost_per_image: number | null
          created_at: string | null
          deprecated_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_name: string
          model_type: string
          model_version: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          config?: Json | null
          context_window?: number | null
          cost_per_1k_tokens?: number | null
          cost_per_image?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name: string
          model_type: string
          model_version: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          config?: Json | null
          context_window?: number | null
          cost_per_1k_tokens?: number | null
          cost_per_image?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name?: string
          model_type?: string
          model_version?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          active: boolean | null
          county_id: number | null
          created_at: string | null
          id: number
          name: string
          state_id: number | null
        }
        Insert: {
          active?: boolean | null
          county_id?: number | null
          created_at?: string | null
          id?: number
          name: string
          state_id?: number | null
        }
        Update: {
          active?: boolean | null
          county_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
          state_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_communications: {
        Row: {
          attachments: Json | null
          claim_id: string
          communication_type: string
          content: string
          created_at: string | null
          direction: string
          id: string
          subject: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          claim_id: string
          communication_type: string
          content: string
          created_at?: string | null
          direction: string
          id?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          claim_id?: string
          communication_type?: string
          content?: string
          created_at?: string | null
          direction?: string
          id?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_communications_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_communications_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_status_history: {
        Row: {
          changed_by: string
          claim_id: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["claim_status_enum"]
          previous_status:
            | Database["public"]["Enums"]["claim_status_enum"]
            | null
          reason: string | null
        }
        Insert: {
          changed_by: string
          claim_id: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["claim_status_enum"]
          previous_status?:
            | Database["public"]["Enums"]["claim_status_enum"]
            | null
          reason?: string | null
        }
        Update: {
          changed_by?: string
          claim_id?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["claim_status_enum"]
          previous_status?:
            | Database["public"]["Enums"]["claim_status_enum"]
            | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_status_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_status_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          ai_complexity_score: number | null
          ai_fraud_risk_score: number | null
          ai_recommended_actions: Json | null
          ai_settlement_prediction: Json | null
          claim_embedding: string | null
          claim_notes: string | null
          claim_number: string | null
          created_at: string | null
          damage_type: Database["public"]["Enums"]["damage_type_enum"]
          date_of_loss: string
          date_reported: string | null
          deductible_applied: number | null
          description: string | null
          estimated_value: number | null
          id: string
          metadata: Json | null
          policy_id: string
          property_id: string
          settled_value: number | null
          settlement_date: string | null
          status: Database["public"]["Enums"]["claim_status_enum"]
          supporting_documents: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_complexity_score?: number | null
          ai_fraud_risk_score?: number | null
          ai_recommended_actions?: Json | null
          ai_settlement_prediction?: Json | null
          claim_embedding?: string | null
          claim_notes?: string | null
          claim_number?: string | null
          created_at?: string | null
          damage_type: Database["public"]["Enums"]["damage_type_enum"]
          date_of_loss: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          metadata?: Json | null
          policy_id: string
          property_id: string
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status_enum"]
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          ai_complexity_score?: number | null
          ai_fraud_risk_score?: number | null
          ai_recommended_actions?: Json | null
          ai_settlement_prediction?: Json | null
          claim_embedding?: string | null
          claim_notes?: string | null
          claim_number?: string | null
          created_at?: string | null
          damage_type?: Database["public"]["Enums"]["damage_type_enum"]
          date_of_loss?: string
          date_reported?: string | null
          deductible_applied?: number | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          metadata?: Json | null
          policy_id?: string
          property_id?: string
          settled_value?: number | null
          settlement_date?: string | null
          status?: Database["public"]["Enums"]["claim_status_enum"]
          supporting_documents?: Json | null
          updated_at?: string | null
          user_id?: string
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
      contractor_license_raw: {
        Row: {
          board: string | null
          bond_ind: boolean | null
          city: string | null
          county_name: string | null
          dba_name: string | null
          discipline_flag: boolean | null
          expiry_date: string | null
          issue_date: string | null
          liability_ins: boolean | null
          license_number: string
          license_type: string | null
          qualifier_name: string | null
          rank: string | null
          status_primary: string | null
          status_secondary: string | null
          updated_at: string | null
          wc_exempt: boolean | null
        }
        Insert: {
          board?: string | null
          bond_ind?: boolean | null
          city?: string | null
          county_name?: string | null
          dba_name?: string | null
          discipline_flag?: boolean | null
          expiry_date?: string | null
          issue_date?: string | null
          liability_ins?: boolean | null
          license_number: string
          license_type?: string | null
          qualifier_name?: string | null
          rank?: string | null
          status_primary?: string | null
          status_secondary?: string | null
          updated_at?: string | null
          wc_exempt?: boolean | null
        }
        Update: {
          board?: string | null
          bond_ind?: boolean | null
          city?: string | null
          county_name?: string | null
          dba_name?: string | null
          discipline_flag?: boolean | null
          expiry_date?: string | null
          issue_date?: string | null
          liability_ins?: boolean | null
          license_number?: string
          license_type?: string | null
          qualifier_name?: string | null
          rank?: string | null
          status_primary?: string | null
          status_secondary?: string | null
          updated_at?: string | null
          wc_exempt?: boolean | null
        }
        Relationships: []
      }
      counties: {
        Row: {
          active: boolean | null
          county_fips: string
          created_at: string | null
          fips_code: string
          id: number
          name: string
          state_fips: string
          state_id: number | null
        }
        Insert: {
          active?: boolean | null
          county_fips: string
          created_at?: string | null
          fips_code: string
          id?: number
          name: string
          state_fips: string
          state_id?: number | null
        }
        Update: {
          active?: boolean | null
          county_fips?: string
          created_at?: string | null
          fips_code?: string
          id?: number
          name?: string
          state_fips?: string
          state_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "counties_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_runs: {
        Row: {
          completed_at: string | null
          data_type: Database["public"]["Enums"]["floir_data_type"]
          duration_seconds: number | null
          error_count: number | null
          errors: Json | null
          id: string
          metadata: Json | null
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["crawl_status"] | null
        }
        Insert: {
          completed_at?: string | null
          data_type: Database["public"]["Enums"]["floir_data_type"]
          duration_seconds?: number | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawl_status"] | null
        }
        Update: {
          completed_at?: string | null
          data_type?: Database["public"]["Enums"]["floir_data_type"]
          duration_seconds?: number | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawl_status"] | null
        }
        Relationships: []
      }
      damage_ai_detections: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          damage_id: string
          damage_types: Json | null
          detected_objects: Json | null
          estimated_area_sqft: number | null
          id: string
          image_embedding: string | null
          image_url: string
          material_types: Json | null
          model_id: string | null
          severity_score: number | null
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          damage_id: string
          damage_types?: Json | null
          detected_objects?: Json | null
          estimated_area_sqft?: number | null
          id?: string
          image_embedding?: string | null
          image_url: string
          material_types?: Json | null
          model_id?: string | null
          severity_score?: number | null
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          damage_id?: string
          damage_types?: Json | null
          detected_objects?: Json | null
          estimated_area_sqft?: number | null
          id?: string
          image_embedding?: string | null
          image_url?: string
          material_types?: Json | null
          model_id?: string | null
          severity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_ai_detections_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_ai_detections_damage_id_fkey"
            columns: ["damage_id"]
            isOneToOne: false
            referencedRelation: "property_damage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_ai_detections_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_user_creation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          step: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          step: string
          success: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          step?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      document_ai_extractions: {
        Row: {
          content_embedding: string | null
          coverage_items: Json | null
          created_at: string | null
          document_id: string | null
          document_type: string | null
          exclusions: Json | null
          extracted_fields: Json | null
          extraction_confidence: number | null
          id: string
          important_dates: Json | null
          key_points: Json | null
          key_terms: Json | null
          model_id: string | null
          requires_review: boolean | null
          review_notes: string | null
          summary: string | null
          summary_embedding: string | null
          updated_at: string | null
        }
        Insert: {
          content_embedding?: string | null
          coverage_items?: Json | null
          created_at?: string | null
          document_id?: string | null
          document_type?: string | null
          exclusions?: Json | null
          extracted_fields?: Json | null
          extraction_confidence?: number | null
          id?: string
          important_dates?: Json | null
          key_points?: Json | null
          key_terms?: Json | null
          model_id?: string | null
          requires_review?: boolean | null
          review_notes?: string | null
          summary?: string | null
          summary_embedding?: string | null
          updated_at?: string | null
        }
        Update: {
          content_embedding?: string | null
          coverage_items?: Json | null
          created_at?: string | null
          document_id?: string | null
          document_type?: string | null
          exclusions?: Json | null
          extracted_fields?: Json | null
          extraction_confidence?: number | null
          id?: string
          important_dates?: Json | null
          key_points?: Json | null
          key_terms?: Json | null
          model_id?: string | null
          requires_review?: boolean | null
          review_notes?: string | null
          summary?: string | null
          summary_embedding?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_ai_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ai_extractions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          applied_at: string | null
          applied_to_property: boolean | null
          confidence_score: number | null
          created_at: string | null
          document_id: string
          error_message: string | null
          extracted_data: Json | null
          id: string
          processed_by: string
          processing_status: Database["public"]["Enums"]["processing_status_enum"]
          processing_time_ms: number | null
          property_id: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_to_property?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          processed_by: string
          processing_status?: Database["public"]["Enums"]["processing_status_enum"]
          processing_time_ms?: number | null
          property_id: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_to_property?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          processed_by?: string
          processing_status?: Database["public"]["Enums"]["processing_status_enum"]
          processing_time_ms?: number | null
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_old"
            referencedColumns: ["id"]
          },
        ]
      }
      fdot_history: {
        Row: {
          archived_at: string | null
          co_no: number | null
          geom: unknown
          id: number
          parcel_id: string
          properties: Json
          version: number | null
        }
        Insert: {
          archived_at?: string | null
          co_no?: number | null
          geom: unknown
          id?: number
          parcel_id: string
          properties: Json
          version?: number | null
        }
        Update: {
          archived_at?: string | null
          co_no?: number | null
          geom?: unknown
          id?: number
          parcel_id?: string
          properties?: Json
          version?: number | null
        }
        Relationships: []
      }
      fdot_parcels: {
        Row: {
          co_no: number
          dor_uc: string | null
          geom: unknown
          jv: number | null
          parcel_id: string
          properties: Json
          updated_at: string | null
        }
        Insert: {
          co_no: number
          dor_uc?: string | null
          geom: unknown
          jv?: number | null
          parcel_id: string
          properties: Json
          updated_at?: string | null
        }
        Update: {
          co_no?: number
          dor_uc?: string | null
          geom?: unknown
          jv?: number | null
          parcel_id?: string
          properties?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      fdot_stage: {
        Row: {
          feature: Json
          geom: unknown | null
          id: number
        }
        Insert: {
          feature: Json
          geom?: unknown | null
          id?: number
        }
        Update: {
          feature?: Json
          geom?: unknown | null
          id?: number
        }
        Relationships: []
      }
      floir_data: {
        Row: {
          content_hash: string | null
          created_at: string | null
          data_type: Database["public"]["Enums"]["floir_data_type"]
          embedding: string | null
          extracted_at: string | null
          id: string
          normalized_data: Json | null
          pdf_content: string | null
          primary_key: string
          raw_data: Json
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string | null
          data_type: Database["public"]["Enums"]["floir_data_type"]
          embedding?: string | null
          extracted_at?: string | null
          id?: string
          normalized_data?: Json | null
          pdf_content?: string | null
          primary_key: string
          raw_data: Json
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string | null
          data_type?: Database["public"]["Enums"]["floir_data_type"]
          embedding?: string | null
          extracted_at?: string | null
          id?: string
          normalized_data?: Json | null
          pdf_content?: string | null
          primary_key?: string
          raw_data?: Json
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      florida_counties: {
        Row: {
          aob_restrictions: Json | null
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          citizens_service_center: string | null
          claim_filing_requirements: Json | null
          coastal_county: boolean | null
          contractor_license_search_url: string | null
          contractor_license_verification_phone: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_email: string | null
          emergency_mgmt_name: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_flood_zone_url: string | null
          fema_region: string | null
          flood_elevation_requirement: boolean | null
          flood_zone_maps_url: string | null
          gis_url: string | null
          households: number | null
          hurricane_evacuation_zone_url: string | null
          id: string
          impact_glass_required: boolean | null
          last_verified_at: string | null
          median_home_value: number | null
          notes: string | null
          online_permit_system: boolean | null
          parcel_data_url: string | null
          permit_expiration_days: number | null
          permit_fee_structure: Json | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string
          reinspection_fee: number | null
          storm_surge_planning_zone_url: string | null
          supplemental_claim_deadline_days: number | null
          tax_collector_email: string | null
          tax_collector_name: string | null
          tax_collector_phone: string | null
          tax_collector_website: string | null
          time_zone: string
          unlicensed_contractor_limit: number | null
          updated_at: string | null
          wind_speed_requirement: number | null
          windstorm_requirements: Json | null
        }
        Insert: {
          aob_restrictions?: Json | null
          building_code_version?: string | null
          building_dept_address?: string | null
          building_dept_email?: string | null
          building_dept_name?: string | null
          building_dept_phone?: string | null
          building_dept_website?: string | null
          citizens_service_center?: string | null
          claim_filing_requirements?: Json | null
          coastal_county?: boolean | null
          contractor_license_search_url?: string | null
          contractor_license_verification_phone?: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at?: string | null
          emergency_hotline?: string | null
          emergency_mgmt_email?: string | null
          emergency_mgmt_name?: string | null
          emergency_mgmt_phone?: string | null
          emergency_mgmt_website?: string | null
          fema_flood_zone_url?: string | null
          fema_region?: string | null
          flood_elevation_requirement?: boolean | null
          flood_zone_maps_url?: string | null
          gis_url?: string | null
          households?: number | null
          hurricane_evacuation_zone_url?: string | null
          id: string
          impact_glass_required?: boolean | null
          last_verified_at?: string | null
          median_home_value?: number | null
          notes?: string | null
          online_permit_system?: boolean | null
          parcel_data_url?: string | null
          permit_expiration_days?: number | null
          permit_fee_structure?: Json | null
          permit_search_url?: string | null
          population?: number | null
          property_appraiser_email?: string | null
          property_appraiser_name?: string | null
          property_appraiser_phone?: string | null
          property_appraiser_website?: string | null
          property_search_url?: string | null
          region: string
          reinspection_fee?: number | null
          storm_surge_planning_zone_url?: string | null
          supplemental_claim_deadline_days?: number | null
          tax_collector_email?: string | null
          tax_collector_name?: string | null
          tax_collector_phone?: string | null
          tax_collector_website?: string | null
          time_zone: string
          unlicensed_contractor_limit?: number | null
          updated_at?: string | null
          wind_speed_requirement?: number | null
          windstorm_requirements?: Json | null
        }
        Update: {
          aob_restrictions?: Json | null
          building_code_version?: string | null
          building_dept_address?: string | null
          building_dept_email?: string | null
          building_dept_name?: string | null
          building_dept_phone?: string | null
          building_dept_website?: string | null
          citizens_service_center?: string | null
          claim_filing_requirements?: Json | null
          coastal_county?: boolean | null
          contractor_license_search_url?: string | null
          contractor_license_verification_phone?: string | null
          county_code?: string
          county_name?: string
          county_seat?: string
          created_at?: string | null
          emergency_hotline?: string | null
          emergency_mgmt_email?: string | null
          emergency_mgmt_name?: string | null
          emergency_mgmt_phone?: string | null
          emergency_mgmt_website?: string | null
          fema_flood_zone_url?: string | null
          fema_region?: string | null
          flood_elevation_requirement?: boolean | null
          flood_zone_maps_url?: string | null
          gis_url?: string | null
          households?: number | null
          hurricane_evacuation_zone_url?: string | null
          id?: string
          impact_glass_required?: boolean | null
          last_verified_at?: string | null
          median_home_value?: number | null
          notes?: string | null
          online_permit_system?: boolean | null
          parcel_data_url?: string | null
          permit_expiration_days?: number | null
          permit_fee_structure?: Json | null
          permit_search_url?: string | null
          population?: number | null
          property_appraiser_email?: string | null
          property_appraiser_name?: string | null
          property_appraiser_phone?: string | null
          property_appraiser_website?: string | null
          property_search_url?: string | null
          region?: string
          reinspection_fee?: number | null
          storm_surge_planning_zone_url?: string | null
          supplemental_claim_deadline_days?: number | null
          tax_collector_email?: string | null
          tax_collector_name?: string | null
          tax_collector_phone?: string | null
          tax_collector_website?: string | null
          time_zone?: string
          unlicensed_contractor_limit?: number | null
          updated_at?: string | null
          wind_speed_requirement?: number | null
          windstorm_requirements?: Json | null
        }
        Relationships: []
      }
      florida_counties2: {
        Row: {
          ACT_YR_BLT: number | null
          ALT_KEY: string | null
          APP_STAT: string | null
          ASMNT_YR: number | null
          ASS_DIF_TR: number | null
          ASS_TRNSFR: string | null
          ATV_STRT: string | null
          AV_CLASS_U: number | null
          AV_CONSRV_: number | null
          AV_H2O_REC: number | null
          AV_HIST_CO: number | null
          AV_HIST_SI: number | null
          AV_HMSTD: number | null
          AV_NON_HMS: number | null
          AV_NSD: number | null
          AV_RESD_NO: number | null
          AV_SD: number | null
          AV_WRKNG_W: number | null
          BAS_STRT: string | null
          CENSUS_BK: string | null
          CLERK_NO1: string | null
          CLERK_NO2: string | null
          CO_APP_STA: string | null
          CO_NO: number | null
          CONO_PRV_H: number | null
          CONST_CLAS: number | null
          county_fips: number | null
          county_id: string | null
          created_at: string | null
          DEL_VAL: number | null
          DISTR_CD: string | null
          DISTR_YR: number | null
          DOR_UC: string | null
          DT_LAST_IN: number | null
          EFF_YR_BLT: number | null
          FIDU_ADDR1: string | null
          FIDU_ADDR2: string | null
          FIDU_CD: number | null
          FIDU_CITY: string | null
          FIDU_NAME: string | null
          FIDU_STATE: string | null
          FIDU_ZIPCD: number | null
          FILE_T: string | null
          geometry_wkt: string | null
          GRP_NO: number | null
          id: number
          IMP_QUAL: number | null
          JV: number | null
          JV_CHNG: number | null
          JV_CHNG_CD: number | null
          JV_CLASS_U: number | null
          JV_CONSRV_: number | null
          JV_H2O_REC: number | null
          JV_HIST_CO: number | null
          JV_HIST_SI: number | null
          JV_HMSTD: number | null
          JV_NON_HMS: number | null
          JV_RESD_NO: number | null
          JV_WRKNG_W: number | null
          LND_SQFOOT: number | null
          LND_UNTS_C: number | null
          LND_VAL: number | null
          M_PAR_SAL1: string | null
          M_PAR_SAL2: string | null
          MKT_AR: string | null
          MP_ID: string | null
          NBRHD_CD: string | null
          NCONST_VAL: number | null
          NO_BULDNG: number | null
          NO_LND_UNT: number | null
          NO_RES_UNT: number | null
          OR_BOOK1: string | null
          OR_BOOK2: string | null
          OR_PAGE1: string | null
          OR_PAGE2: string | null
          OWN_ADDR1: string | null
          OWN_ADDR2: string | null
          OWN_CITY: string | null
          OWN_NAME: string | null
          OWN_STATE: string | null
          OWN_STATE_: string | null
          OWN_ZIPCD: number | null
          PA_UC: string | null
          PAR_SPLT: number | null
          PARCEL_ID: string | null
          PARCEL_ID_: string | null
          PHY_ADDR1: string | null
          PHY_ADDR2: string | null
          PHY_CITY: string | null
          PHY_ZIPCD: number | null
          PREV_HMSTD: number | null
          PUBLIC_LND: string | null
          QUAL_CD1: string | null
          QUAL_CD2: string | null
          RNG: string | null
          RS_ID: string | null
          S_CHNG_CD1: string | null
          S_CHNG_CD2: string | null
          S_LEGAL: string | null
          SALE_MO1: number | null
          SALE_MO2: number | null
          SALE_PRC1: number | null
          SALE_PRC2: number | null
          SALE_YR1: number | null
          SALE_YR2: number | null
          SEC: number | null
          SEQ_NO: number | null
          Shape_Area: number | null
          Shape_Length: number | null
          SPASS_CD: string | null
          SPC_CIR_CD: number | null
          SPC_CIR_TX: string | null
          SPC_CIR_YR: number | null
          SPEC_FEAT_: number | null
          STATE_PAR_: string | null
          TAX_AUTH_C: string | null
          TOT_LVG_AR: number | null
          TV_NSD: number | null
          TV_SD: number | null
          TWN: string | null
          updated_at: string | null
          VI_CD1: string | null
          VI_CD2: string | null
          YR_VAL_TRN: number | null
        }
        Insert: {
          ACT_YR_BLT?: number | null
          ALT_KEY?: string | null
          APP_STAT?: string | null
          ASMNT_YR?: number | null
          ASS_DIF_TR?: number | null
          ASS_TRNSFR?: string | null
          ATV_STRT?: string | null
          AV_CLASS_U?: number | null
          AV_CONSRV_?: number | null
          AV_H2O_REC?: number | null
          AV_HIST_CO?: number | null
          AV_HIST_SI?: number | null
          AV_HMSTD?: number | null
          AV_NON_HMS?: number | null
          AV_NSD?: number | null
          AV_RESD_NO?: number | null
          AV_SD?: number | null
          AV_WRKNG_W?: number | null
          BAS_STRT?: string | null
          CENSUS_BK?: string | null
          CLERK_NO1?: string | null
          CLERK_NO2?: string | null
          CO_APP_STA?: string | null
          CO_NO?: number | null
          CONO_PRV_H?: number | null
          CONST_CLAS?: number | null
          county_fips?: number | null
          county_id?: string | null
          created_at?: string | null
          DEL_VAL?: number | null
          DISTR_CD?: string | null
          DISTR_YR?: number | null
          DOR_UC?: string | null
          DT_LAST_IN?: number | null
          EFF_YR_BLT?: number | null
          FIDU_ADDR1?: string | null
          FIDU_ADDR2?: string | null
          FIDU_CD?: number | null
          FIDU_CITY?: string | null
          FIDU_NAME?: string | null
          FIDU_STATE?: string | null
          FIDU_ZIPCD?: number | null
          FILE_T?: string | null
          geometry_wkt?: string | null
          GRP_NO?: number | null
          id?: number
          IMP_QUAL?: number | null
          JV?: number | null
          JV_CHNG?: number | null
          JV_CHNG_CD?: number | null
          JV_CLASS_U?: number | null
          JV_CONSRV_?: number | null
          JV_H2O_REC?: number | null
          JV_HIST_CO?: number | null
          JV_HIST_SI?: number | null
          JV_HMSTD?: number | null
          JV_NON_HMS?: number | null
          JV_RESD_NO?: number | null
          JV_WRKNG_W?: number | null
          LND_SQFOOT?: number | null
          LND_UNTS_C?: number | null
          LND_VAL?: number | null
          M_PAR_SAL1?: string | null
          M_PAR_SAL2?: string | null
          MKT_AR?: string | null
          MP_ID?: string | null
          NBRHD_CD?: string | null
          NCONST_VAL?: number | null
          NO_BULDNG?: number | null
          NO_LND_UNT?: number | null
          NO_RES_UNT?: number | null
          OR_BOOK1?: string | null
          OR_BOOK2?: string | null
          OR_PAGE1?: string | null
          OR_PAGE2?: string | null
          OWN_ADDR1?: string | null
          OWN_ADDR2?: string | null
          OWN_CITY?: string | null
          OWN_NAME?: string | null
          OWN_STATE?: string | null
          OWN_STATE_?: string | null
          OWN_ZIPCD?: number | null
          PA_UC?: string | null
          PAR_SPLT?: number | null
          PARCEL_ID?: string | null
          PARCEL_ID_?: string | null
          PHY_ADDR1?: string | null
          PHY_ADDR2?: string | null
          PHY_CITY?: string | null
          PHY_ZIPCD?: number | null
          PREV_HMSTD?: number | null
          PUBLIC_LND?: string | null
          QUAL_CD1?: string | null
          QUAL_CD2?: string | null
          RNG?: string | null
          RS_ID?: string | null
          S_CHNG_CD1?: string | null
          S_CHNG_CD2?: string | null
          S_LEGAL?: string | null
          SALE_MO1?: number | null
          SALE_MO2?: number | null
          SALE_PRC1?: number | null
          SALE_PRC2?: number | null
          SALE_YR1?: number | null
          SALE_YR2?: number | null
          SEC?: number | null
          SEQ_NO?: number | null
          Shape_Area?: number | null
          Shape_Length?: number | null
          SPASS_CD?: string | null
          SPC_CIR_CD?: number | null
          SPC_CIR_TX?: string | null
          SPC_CIR_YR?: number | null
          SPEC_FEAT_?: number | null
          STATE_PAR_?: string | null
          TAX_AUTH_C?: string | null
          TOT_LVG_AR?: number | null
          TV_NSD?: number | null
          TV_SD?: number | null
          TWN?: string | null
          updated_at?: string | null
          VI_CD1?: string | null
          VI_CD2?: string | null
          YR_VAL_TRN?: number | null
        }
        Update: {
          ACT_YR_BLT?: number | null
          ALT_KEY?: string | null
          APP_STAT?: string | null
          ASMNT_YR?: number | null
          ASS_DIF_TR?: number | null
          ASS_TRNSFR?: string | null
          ATV_STRT?: string | null
          AV_CLASS_U?: number | null
          AV_CONSRV_?: number | null
          AV_H2O_REC?: number | null
          AV_HIST_CO?: number | null
          AV_HIST_SI?: number | null
          AV_HMSTD?: number | null
          AV_NON_HMS?: number | null
          AV_NSD?: number | null
          AV_RESD_NO?: number | null
          AV_SD?: number | null
          AV_WRKNG_W?: number | null
          BAS_STRT?: string | null
          CENSUS_BK?: string | null
          CLERK_NO1?: string | null
          CLERK_NO2?: string | null
          CO_APP_STA?: string | null
          CO_NO?: number | null
          CONO_PRV_H?: number | null
          CONST_CLAS?: number | null
          county_fips?: number | null
          county_id?: string | null
          created_at?: string | null
          DEL_VAL?: number | null
          DISTR_CD?: string | null
          DISTR_YR?: number | null
          DOR_UC?: string | null
          DT_LAST_IN?: number | null
          EFF_YR_BLT?: number | null
          FIDU_ADDR1?: string | null
          FIDU_ADDR2?: string | null
          FIDU_CD?: number | null
          FIDU_CITY?: string | null
          FIDU_NAME?: string | null
          FIDU_STATE?: string | null
          FIDU_ZIPCD?: number | null
          FILE_T?: string | null
          geometry_wkt?: string | null
          GRP_NO?: number | null
          id?: number
          IMP_QUAL?: number | null
          JV?: number | null
          JV_CHNG?: number | null
          JV_CHNG_CD?: number | null
          JV_CLASS_U?: number | null
          JV_CONSRV_?: number | null
          JV_H2O_REC?: number | null
          JV_HIST_CO?: number | null
          JV_HIST_SI?: number | null
          JV_HMSTD?: number | null
          JV_NON_HMS?: number | null
          JV_RESD_NO?: number | null
          JV_WRKNG_W?: number | null
          LND_SQFOOT?: number | null
          LND_UNTS_C?: number | null
          LND_VAL?: number | null
          M_PAR_SAL1?: string | null
          M_PAR_SAL2?: string | null
          MKT_AR?: string | null
          MP_ID?: string | null
          NBRHD_CD?: string | null
          NCONST_VAL?: number | null
          NO_BULDNG?: number | null
          NO_LND_UNT?: number | null
          NO_RES_UNT?: number | null
          OR_BOOK1?: string | null
          OR_BOOK2?: string | null
          OR_PAGE1?: string | null
          OR_PAGE2?: string | null
          OWN_ADDR1?: string | null
          OWN_ADDR2?: string | null
          OWN_CITY?: string | null
          OWN_NAME?: string | null
          OWN_STATE?: string | null
          OWN_STATE_?: string | null
          OWN_ZIPCD?: number | null
          PA_UC?: string | null
          PAR_SPLT?: number | null
          PARCEL_ID?: string | null
          PARCEL_ID_?: string | null
          PHY_ADDR1?: string | null
          PHY_ADDR2?: string | null
          PHY_CITY?: string | null
          PHY_ZIPCD?: number | null
          PREV_HMSTD?: number | null
          PUBLIC_LND?: string | null
          QUAL_CD1?: string | null
          QUAL_CD2?: string | null
          RNG?: string | null
          RS_ID?: string | null
          S_CHNG_CD1?: string | null
          S_CHNG_CD2?: string | null
          S_LEGAL?: string | null
          SALE_MO1?: number | null
          SALE_MO2?: number | null
          SALE_PRC1?: number | null
          SALE_PRC2?: number | null
          SALE_YR1?: number | null
          SALE_YR2?: number | null
          SEC?: number | null
          SEQ_NO?: number | null
          Shape_Area?: number | null
          Shape_Length?: number | null
          SPASS_CD?: string | null
          SPC_CIR_CD?: number | null
          SPC_CIR_TX?: string | null
          SPC_CIR_YR?: number | null
          SPEC_FEAT_?: number | null
          STATE_PAR_?: string | null
          TAX_AUTH_C?: string | null
          TOT_LVG_AR?: number | null
          TV_NSD?: number | null
          TV_SD?: number | null
          TWN?: string | null
          updated_at?: string | null
          VI_CD1?: string | null
          VI_CD2?: string | null
          YR_VAL_TRN?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "florida_counties2_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "florida_counties"
            referencedColumns: ["id"]
          },
        ]
      }
      florida_parcels: {
        Row: {
          act_yr_blt: number | null
          ACT_YR_BLT: number | null
          ag_val: number | null
          ALT_KEY: string | null
          app_stat: string | null
          APP_STAT: string | null
          asmnt_yr: number | null
          ASMNT_YR: number | null
          ASS_DIF_TR: number | null
          ASS_TRNSFR: string | null
          atv_strt: string | null
          ATV_STRT: string | null
          AV_CLASS_U: number | null
          AV_CONSRV_: number | null
          AV_H2O_REC: number | null
          AV_HIST_CO: number | null
          AV_HIST_SI: number | null
          AV_HMSTD: number | null
          AV_NON_HMS: number | null
          av_nsd: number | null
          AV_NSD: number | null
          AV_RESD_NO: number | null
          av_sd: number | null
          AV_SD: number | null
          AV_WRKNG_W: number | null
          bas_strt: string | null
          BAS_STRT: string | null
          bldg_val: number | null
          blk: string | null
          cap: number | null
          cape_shpa: number | null
          census_bk: string | null
          CENSUS_BK: string | null
          clerk_n_2: string | null
          clerk_no1: string | null
          CLERK_NO1: string | null
          clerk_no2: string | null
          CLERK_NO2: string | null
          co_app_sta: string | null
          CO_APP_STA: string | null
          co_no: number | null
          CO_NO: number | null
          CONO_PRV_H: number | null
          const_clas: string | null
          CONST_CLAS: number | null
          const_val: number | null
          county_fips: number | null
          county_id: string | null
          created_at: string | null
          data_source: string | null
          DEL_VAL: number | null
          depth: number | null
          distr_cd: string | null
          DISTR_CD: string | null
          distr_no: string | null
          distr_yr: number | null
          DISTR_YR: number | null
          dor_cd1: string | null
          dor_cd2: string | null
          dor_cd3: string | null
          dor_cd4: string | null
          dor_uc: string | null
          DOR_UC: string | null
          DT_LAST_IN: number | null
          eff_yr_blt: number | null
          EFF_YR_BLT: number | null
          FIDU_ADDR1: string | null
          FIDU_ADDR2: string | null
          FIDU_CD: number | null
          FIDU_CITY: string | null
          FIDU_NAME: string | null
          FIDU_STATE: string | null
          FIDU_ZIPCD: number | null
          file_t: string | null
          FILE_T: string | null
          front: number | null
          geometry_wkt: string | null
          grp_no: string | null
          GRP_NO: number | null
          half_cd: string | null
          id: number
          imp_qual: string | null
          IMP_QUAL: number | null
          imp_val: number | null
          jv: number | null
          JV: number | null
          jv_chng: string | null
          JV_CHNG: number | null
          JV_CHNG_CD: number | null
          JV_CLASS_U: number | null
          JV_CONSRV_: number | null
          JV_H2O_REC: number | null
          JV_HIST_CO: number | null
          JV_HIST_SI: number | null
          JV_HMSTD: number | null
          JV_NON_HMS: number | null
          JV_RESD_NO: number | null
          JV_WRKNG_W: number | null
          land_sqfoot: number | null
          land_val: number | null
          latitude: number | null
          LND_SQFOOT: number | null
          LND_UNTS_C: number | null
          LND_VAL: number | null
          longitude: number | null
          lot: string | null
          m_par_sal1: string | null
          M_PAR_SAL1: string | null
          m_par_sal2: string | null
          M_PAR_SAL2: string | null
          mkt_ar: string | null
          MKT_AR: string | null
          mp_id: string | null
          MP_ID: string | null
          nbrhd_cd: string | null
          NBRHD_CD: string | null
          nbrhd_cd1: string | null
          nbrhd_cd2: string | null
          nbrhd_cd3: string | null
          nbrhd_cd4: string | null
          nconst_val: number | null
          NCONST_VAL: number | null
          no_buldng: number | null
          NO_BULDNG: number | null
          NO_LND_UNT: number | null
          no_res_unt: number | null
          NO_RES_UNT: number | null
          objectid: number | null
          or_book1: string | null
          OR_BOOK1: string | null
          or_book2: string | null
          OR_BOOK2: string | null
          or_book2_: string | null
          or_page1: string | null
          OR_PAGE1: string | null
          or_page2: string | null
          OR_PAGE2: string | null
          or_page2_: string | null
          own_addr1: string | null
          OWN_ADDR1: string | null
          own_addr2: string | null
          OWN_ADDR2: string | null
          own_city: string | null
          OWN_CITY: string | null
          own_name: string | null
          OWN_NAME: string | null
          own_state: string | null
          OWN_STATE: string | null
          OWN_STATE_: string | null
          own_state2: string | null
          own_zipcd: string | null
          OWN_ZIPCD: number | null
          own_zipcda: string | null
          pa_uc: string | null
          PA_UC: string | null
          PAR_SPLT: number | null
          parcel_id: string | null
          PARCEL_ID: string | null
          parcel_id_: string | null
          PARCEL_ID_: string | null
          phy_addr1: string | null
          PHY_ADDR1: string | null
          phy_addr2: string | null
          PHY_ADDR2: string | null
          phy_city: string | null
          PHY_CITY: string | null
          phy_zipcd: string | null
          PHY_ZIPCD: number | null
          pin_1: string | null
          pin_2: string | null
          plat_book: string | null
          PLAT_BOOK: string | null
          plat_page: string | null
          PREV_HMSTD: number | null
          public_lnd: string | null
          PUBLIC_LND: string | null
          qual_cd1: string | null
          QUAL_CD1: string | null
          qual_cd2: string | null
          QUAL_CD2: string | null
          qual_cd2_: string | null
          rng: string | null
          RNG: string | null
          rs_id: string | null
          RS_ID: string | null
          s_chng_cd1: string | null
          S_CHNG_CD1: string | null
          s_chng_cd2: string | null
          S_CHNG_CD2: string | null
          s_legal: string | null
          S_LEGAL: string | null
          sale_mo1: string | null
          SALE_MO1: number | null
          sale_mo2: string | null
          SALE_MO2: number | null
          sale_mo2_: number | null
          sale_prc1: number | null
          SALE_PRC1: number | null
          sale_prc2: number | null
          SALE_PRC2: number | null
          sale_prc2_: number | null
          sale_yr1: number | null
          SALE_YR1: number | null
          sale_yr2: number | null
          SALE_YR2: number | null
          sale_yr2_: number | null
          sec: string | null
          SEC: number | null
          seq_no: string | null
          SEQ_NO: number | null
          Shape_Area: number | null
          Shape_Length: number | null
          spass_cd: string | null
          SPASS_CD: string | null
          spc_cir_cd: string | null
          SPC_CIR_CD: number | null
          spc_cir_tx: string | null
          SPC_CIR_TX: string | null
          spc_cir_yr: number | null
          SPC_CIR_YR: number | null
          spec_feat_: string | null
          SPEC_FEAT_: number | null
          state_par_: string | null
          STATE_PAR_: string | null
          sub: string | null
          tax_auth_c: string | null
          TAX_AUTH_C: string | null
          tot_lvg_ar: number | null
          TOT_LVG_AR: number | null
          tot_val: number | null
          tv_nsd: number | null
          TV_NSD: number | null
          tv_sd: number | null
          TV_SD: number | null
          twn: string | null
          TWN: string | null
          twp: string | null
          updated_at: string | null
          vi_cd1: string | null
          VI_CD1: string | null
          vi_cd2: string | null
          VI_CD2: string | null
          vi_cd2_: string | null
          yr_val_trn: number | null
          YR_VAL_TRN: number | null
        }
        Insert: {
          act_yr_blt?: number | null
          ACT_YR_BLT?: number | null
          ag_val?: number | null
          ALT_KEY?: string | null
          app_stat?: string | null
          APP_STAT?: string | null
          asmnt_yr?: number | null
          ASMNT_YR?: number | null
          ASS_DIF_TR?: number | null
          ASS_TRNSFR?: string | null
          atv_strt?: string | null
          ATV_STRT?: string | null
          AV_CLASS_U?: number | null
          AV_CONSRV_?: number | null
          AV_H2O_REC?: number | null
          AV_HIST_CO?: number | null
          AV_HIST_SI?: number | null
          AV_HMSTD?: number | null
          AV_NON_HMS?: number | null
          av_nsd?: number | null
          AV_NSD?: number | null
          AV_RESD_NO?: number | null
          av_sd?: number | null
          AV_SD?: number | null
          AV_WRKNG_W?: number | null
          bas_strt?: string | null
          BAS_STRT?: string | null
          bldg_val?: number | null
          blk?: string | null
          cap?: number | null
          cape_shpa?: number | null
          census_bk?: string | null
          CENSUS_BK?: string | null
          clerk_n_2?: string | null
          clerk_no1?: string | null
          CLERK_NO1?: string | null
          clerk_no2?: string | null
          CLERK_NO2?: string | null
          co_app_sta?: string | null
          CO_APP_STA?: string | null
          co_no?: number | null
          CO_NO?: number | null
          CONO_PRV_H?: number | null
          const_clas?: string | null
          CONST_CLAS?: number | null
          const_val?: number | null
          county_fips?: number | null
          county_id?: string | null
          created_at?: string | null
          data_source?: string | null
          DEL_VAL?: number | null
          depth?: number | null
          distr_cd?: string | null
          DISTR_CD?: string | null
          distr_no?: string | null
          distr_yr?: number | null
          DISTR_YR?: number | null
          dor_cd1?: string | null
          dor_cd2?: string | null
          dor_cd3?: string | null
          dor_cd4?: string | null
          dor_uc?: string | null
          DOR_UC?: string | null
          DT_LAST_IN?: number | null
          eff_yr_blt?: number | null
          EFF_YR_BLT?: number | null
          FIDU_ADDR1?: string | null
          FIDU_ADDR2?: string | null
          FIDU_CD?: number | null
          FIDU_CITY?: string | null
          FIDU_NAME?: string | null
          FIDU_STATE?: string | null
          FIDU_ZIPCD?: number | null
          file_t?: string | null
          FILE_T?: string | null
          front?: number | null
          geometry_wkt?: string | null
          grp_no?: string | null
          GRP_NO?: number | null
          half_cd?: string | null
          id?: number
          imp_qual?: string | null
          IMP_QUAL?: number | null
          imp_val?: number | null
          jv?: number | null
          JV?: number | null
          jv_chng?: string | null
          JV_CHNG?: number | null
          JV_CHNG_CD?: number | null
          JV_CLASS_U?: number | null
          JV_CONSRV_?: number | null
          JV_H2O_REC?: number | null
          JV_HIST_CO?: number | null
          JV_HIST_SI?: number | null
          JV_HMSTD?: number | null
          JV_NON_HMS?: number | null
          JV_RESD_NO?: number | null
          JV_WRKNG_W?: number | null
          land_sqfoot?: number | null
          land_val?: number | null
          latitude?: number | null
          LND_SQFOOT?: number | null
          LND_UNTS_C?: number | null
          LND_VAL?: number | null
          longitude?: number | null
          lot?: string | null
          m_par_sal1?: string | null
          M_PAR_SAL1?: string | null
          m_par_sal2?: string | null
          M_PAR_SAL2?: string | null
          mkt_ar?: string | null
          MKT_AR?: string | null
          mp_id?: string | null
          MP_ID?: string | null
          nbrhd_cd?: string | null
          NBRHD_CD?: string | null
          nbrhd_cd1?: string | null
          nbrhd_cd2?: string | null
          nbrhd_cd3?: string | null
          nbrhd_cd4?: string | null
          nconst_val?: number | null
          NCONST_VAL?: number | null
          no_buldng?: number | null
          NO_BULDNG?: number | null
          NO_LND_UNT?: number | null
          no_res_unt?: number | null
          NO_RES_UNT?: number | null
          objectid?: number | null
          or_book1?: string | null
          OR_BOOK1?: string | null
          or_book2?: string | null
          OR_BOOK2?: string | null
          or_book2_?: string | null
          or_page1?: string | null
          OR_PAGE1?: string | null
          or_page2?: string | null
          OR_PAGE2?: string | null
          or_page2_?: string | null
          own_addr1?: string | null
          OWN_ADDR1?: string | null
          own_addr2?: string | null
          OWN_ADDR2?: string | null
          own_city?: string | null
          OWN_CITY?: string | null
          own_name?: string | null
          OWN_NAME?: string | null
          own_state?: string | null
          OWN_STATE?: string | null
          OWN_STATE_?: string | null
          own_state2?: string | null
          own_zipcd?: string | null
          OWN_ZIPCD?: number | null
          own_zipcda?: string | null
          pa_uc?: string | null
          PA_UC?: string | null
          PAR_SPLT?: number | null
          parcel_id?: string | null
          PARCEL_ID?: string | null
          parcel_id_?: string | null
          PARCEL_ID_?: string | null
          phy_addr1?: string | null
          PHY_ADDR1?: string | null
          phy_addr2?: string | null
          PHY_ADDR2?: string | null
          phy_city?: string | null
          PHY_CITY?: string | null
          phy_zipcd?: string | null
          PHY_ZIPCD?: number | null
          pin_1?: string | null
          pin_2?: string | null
          plat_book?: string | null
          PLAT_BOOK?: string | null
          plat_page?: string | null
          PREV_HMSTD?: number | null
          public_lnd?: string | null
          PUBLIC_LND?: string | null
          qual_cd1?: string | null
          QUAL_CD1?: string | null
          qual_cd2?: string | null
          QUAL_CD2?: string | null
          qual_cd2_?: string | null
          rng?: string | null
          RNG?: string | null
          rs_id?: string | null
          RS_ID?: string | null
          s_chng_cd1?: string | null
          S_CHNG_CD1?: string | null
          s_chng_cd2?: string | null
          S_CHNG_CD2?: string | null
          s_legal?: string | null
          S_LEGAL?: string | null
          sale_mo1?: string | null
          SALE_MO1?: number | null
          sale_mo2?: string | null
          SALE_MO2?: number | null
          sale_mo2_?: number | null
          sale_prc1?: number | null
          SALE_PRC1?: number | null
          sale_prc2?: number | null
          SALE_PRC2?: number | null
          sale_prc2_?: number | null
          sale_yr1?: number | null
          SALE_YR1?: number | null
          sale_yr2?: number | null
          SALE_YR2?: number | null
          sale_yr2_?: number | null
          sec?: string | null
          SEC?: number | null
          seq_no?: string | null
          SEQ_NO?: number | null
          Shape_Area?: number | null
          Shape_Length?: number | null
          spass_cd?: string | null
          SPASS_CD?: string | null
          spc_cir_cd?: string | null
          SPC_CIR_CD?: number | null
          spc_cir_tx?: string | null
          SPC_CIR_TX?: string | null
          spc_cir_yr?: number | null
          SPC_CIR_YR?: number | null
          spec_feat_?: string | null
          SPEC_FEAT_?: number | null
          state_par_?: string | null
          STATE_PAR_?: string | null
          sub?: string | null
          tax_auth_c?: string | null
          TAX_AUTH_C?: string | null
          tot_lvg_ar?: number | null
          TOT_LVG_AR?: number | null
          tot_val?: number | null
          tv_nsd?: number | null
          TV_NSD?: number | null
          tv_sd?: number | null
          TV_SD?: number | null
          twn?: string | null
          TWN?: string | null
          twp?: string | null
          updated_at?: string | null
          vi_cd1?: string | null
          VI_CD1?: string | null
          vi_cd2?: string | null
          VI_CD2?: string | null
          vi_cd2_?: string | null
          yr_val_trn?: number | null
          YR_VAL_TRN?: number | null
        }
        Update: {
          act_yr_blt?: number | null
          ACT_YR_BLT?: number | null
          ag_val?: number | null
          ALT_KEY?: string | null
          app_stat?: string | null
          APP_STAT?: string | null
          asmnt_yr?: number | null
          ASMNT_YR?: number | null
          ASS_DIF_TR?: number | null
          ASS_TRNSFR?: string | null
          atv_strt?: string | null
          ATV_STRT?: string | null
          AV_CLASS_U?: number | null
          AV_CONSRV_?: number | null
          AV_H2O_REC?: number | null
          AV_HIST_CO?: number | null
          AV_HIST_SI?: number | null
          AV_HMSTD?: number | null
          AV_NON_HMS?: number | null
          av_nsd?: number | null
          AV_NSD?: number | null
          AV_RESD_NO?: number | null
          av_sd?: number | null
          AV_SD?: number | null
          AV_WRKNG_W?: number | null
          bas_strt?: string | null
          BAS_STRT?: string | null
          bldg_val?: number | null
          blk?: string | null
          cap?: number | null
          cape_shpa?: number | null
          census_bk?: string | null
          CENSUS_BK?: string | null
          clerk_n_2?: string | null
          clerk_no1?: string | null
          CLERK_NO1?: string | null
          clerk_no2?: string | null
          CLERK_NO2?: string | null
          co_app_sta?: string | null
          CO_APP_STA?: string | null
          co_no?: number | null
          CO_NO?: number | null
          CONO_PRV_H?: number | null
          const_clas?: string | null
          CONST_CLAS?: number | null
          const_val?: number | null
          county_fips?: number | null
          county_id?: string | null
          created_at?: string | null
          data_source?: string | null
          DEL_VAL?: number | null
          depth?: number | null
          distr_cd?: string | null
          DISTR_CD?: string | null
          distr_no?: string | null
          distr_yr?: number | null
          DISTR_YR?: number | null
          dor_cd1?: string | null
          dor_cd2?: string | null
          dor_cd3?: string | null
          dor_cd4?: string | null
          dor_uc?: string | null
          DOR_UC?: string | null
          DT_LAST_IN?: number | null
          eff_yr_blt?: number | null
          EFF_YR_BLT?: number | null
          FIDU_ADDR1?: string | null
          FIDU_ADDR2?: string | null
          FIDU_CD?: number | null
          FIDU_CITY?: string | null
          FIDU_NAME?: string | null
          FIDU_STATE?: string | null
          FIDU_ZIPCD?: number | null
          file_t?: string | null
          FILE_T?: string | null
          front?: number | null
          geometry_wkt?: string | null
          grp_no?: string | null
          GRP_NO?: number | null
          half_cd?: string | null
          id?: number
          imp_qual?: string | null
          IMP_QUAL?: number | null
          imp_val?: number | null
          jv?: number | null
          JV?: number | null
          jv_chng?: string | null
          JV_CHNG?: number | null
          JV_CHNG_CD?: number | null
          JV_CLASS_U?: number | null
          JV_CONSRV_?: number | null
          JV_H2O_REC?: number | null
          JV_HIST_CO?: number | null
          JV_HIST_SI?: number | null
          JV_HMSTD?: number | null
          JV_NON_HMS?: number | null
          JV_RESD_NO?: number | null
          JV_WRKNG_W?: number | null
          land_sqfoot?: number | null
          land_val?: number | null
          latitude?: number | null
          LND_SQFOOT?: number | null
          LND_UNTS_C?: number | null
          LND_VAL?: number | null
          longitude?: number | null
          lot?: string | null
          m_par_sal1?: string | null
          M_PAR_SAL1?: string | null
          m_par_sal2?: string | null
          M_PAR_SAL2?: string | null
          mkt_ar?: string | null
          MKT_AR?: string | null
          mp_id?: string | null
          MP_ID?: string | null
          nbrhd_cd?: string | null
          NBRHD_CD?: string | null
          nbrhd_cd1?: string | null
          nbrhd_cd2?: string | null
          nbrhd_cd3?: string | null
          nbrhd_cd4?: string | null
          nconst_val?: number | null
          NCONST_VAL?: number | null
          no_buldng?: number | null
          NO_BULDNG?: number | null
          NO_LND_UNT?: number | null
          no_res_unt?: number | null
          NO_RES_UNT?: number | null
          objectid?: number | null
          or_book1?: string | null
          OR_BOOK1?: string | null
          or_book2?: string | null
          OR_BOOK2?: string | null
          or_book2_?: string | null
          or_page1?: string | null
          OR_PAGE1?: string | null
          or_page2?: string | null
          OR_PAGE2?: string | null
          or_page2_?: string | null
          own_addr1?: string | null
          OWN_ADDR1?: string | null
          own_addr2?: string | null
          OWN_ADDR2?: string | null
          own_city?: string | null
          OWN_CITY?: string | null
          own_name?: string | null
          OWN_NAME?: string | null
          own_state?: string | null
          OWN_STATE?: string | null
          OWN_STATE_?: string | null
          own_state2?: string | null
          own_zipcd?: string | null
          OWN_ZIPCD?: number | null
          own_zipcda?: string | null
          pa_uc?: string | null
          PA_UC?: string | null
          PAR_SPLT?: number | null
          parcel_id?: string | null
          PARCEL_ID?: string | null
          parcel_id_?: string | null
          PARCEL_ID_?: string | null
          phy_addr1?: string | null
          PHY_ADDR1?: string | null
          phy_addr2?: string | null
          PHY_ADDR2?: string | null
          phy_city?: string | null
          PHY_CITY?: string | null
          phy_zipcd?: string | null
          PHY_ZIPCD?: number | null
          pin_1?: string | null
          pin_2?: string | null
          plat_book?: string | null
          PLAT_BOOK?: string | null
          plat_page?: string | null
          PREV_HMSTD?: number | null
          public_lnd?: string | null
          PUBLIC_LND?: string | null
          qual_cd1?: string | null
          QUAL_CD1?: string | null
          qual_cd2?: string | null
          QUAL_CD2?: string | null
          qual_cd2_?: string | null
          rng?: string | null
          RNG?: string | null
          rs_id?: string | null
          RS_ID?: string | null
          s_chng_cd1?: string | null
          S_CHNG_CD1?: string | null
          s_chng_cd2?: string | null
          S_CHNG_CD2?: string | null
          s_legal?: string | null
          S_LEGAL?: string | null
          sale_mo1?: string | null
          SALE_MO1?: number | null
          sale_mo2?: string | null
          SALE_MO2?: number | null
          sale_mo2_?: number | null
          sale_prc1?: number | null
          SALE_PRC1?: number | null
          sale_prc2?: number | null
          SALE_PRC2?: number | null
          sale_prc2_?: number | null
          sale_yr1?: number | null
          SALE_YR1?: number | null
          sale_yr2?: number | null
          SALE_YR2?: number | null
          sale_yr2_?: number | null
          sec?: string | null
          SEC?: number | null
          seq_no?: string | null
          SEQ_NO?: number | null
          Shape_Area?: number | null
          Shape_Length?: number | null
          spass_cd?: string | null
          SPASS_CD?: string | null
          spc_cir_cd?: string | null
          SPC_CIR_CD?: number | null
          spc_cir_tx?: string | null
          SPC_CIR_TX?: string | null
          spc_cir_yr?: number | null
          SPC_CIR_YR?: number | null
          spec_feat_?: string | null
          SPEC_FEAT_?: number | null
          state_par_?: string | null
          STATE_PAR_?: string | null
          sub?: string | null
          tax_auth_c?: string | null
          TAX_AUTH_C?: string | null
          tot_lvg_ar?: number | null
          TOT_LVG_AR?: number | null
          tot_val?: number | null
          tv_nsd?: number | null
          TV_NSD?: number | null
          tv_sd?: number | null
          TV_SD?: number | null
          twn?: string | null
          TWN?: string | null
          twp?: string | null
          updated_at?: string | null
          vi_cd1?: string | null
          VI_CD1?: string | null
          vi_cd2?: string | null
          VI_CD2?: string | null
          vi_cd2_?: string | null
          yr_val_trn?: number | null
          YR_VAL_TRN?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "florida_parcels_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "florida_counties"
            referencedColumns: ["id"]
          },
        ]
      }
      florida_parcels_staging: {
        Row: {
          act_yr_blt: string | null
          ag_val: string | null
          app_stat: string | null
          asmnt_yr: string | null
          atv_strt: string | null
          av_nsd: string | null
          av_sd: string | null
          bas_strt: string | null
          bldg_val: string | null
          blk: string | null
          cap: string | null
          cape_shpa: string | null
          census_bk: string | null
          clerk_n_2: string | null
          clerk_no1: string | null
          clerk_no2: string | null
          co_app_sta: string | null
          co_no: string | null
          const_clas: string | null
          const_val: string | null
          county_fips: string | null
          created_at: string | null
          data_source: string | null
          depth: string | null
          distr_cd: string | null
          distr_no: string | null
          distr_yr: string | null
          dor_cd1: string | null
          dor_cd2: string | null
          dor_cd3: string | null
          dor_cd4: string | null
          dor_uc: string | null
          eff_yr_blt: string | null
          file_t: string | null
          front: string | null
          grp_no: string | null
          half_cd: string | null
          id: string | null
          imp_qual: string | null
          imp_val: string | null
          jv: string | null
          jv_chng: string | null
          land_sqfoot: string | null
          land_val: string | null
          latitude: string | null
          longitude: string | null
          lot: string | null
          m_par_sal1: string | null
          m_par_sal2: string | null
          mkt_ar: string | null
          mp_id: string | null
          nbrhd_cd: string | null
          nbrhd_cd1: string | null
          nbrhd_cd2: string | null
          nbrhd_cd3: string | null
          nbrhd_cd4: string | null
          nconst_val: string | null
          no_buldng: string | null
          no_res_unt: string | null
          objectid: string | null
          or_book1: string | null
          or_book2: string | null
          or_book2_: string | null
          or_page1: string | null
          or_page2: string | null
          or_page2_: string | null
          own_addr1: string | null
          own_addr2: string | null
          own_city: string | null
          own_name: string | null
          own_state: string | null
          own_state2: string | null
          own_zipcd: string | null
          own_zipcda: string | null
          pa_uc: string | null
          parcel_id: string | null
          parcel_id_: string | null
          phy_addr1: string | null
          phy_addr2: string | null
          phy_city: string | null
          phy_zipcd: string | null
          pin_1: string | null
          pin_2: string | null
          plat_book: string | null
          plat_page: string | null
          public_lnd: string | null
          qual_cd1: string | null
          qual_cd2: string | null
          qual_cd2_: string | null
          rng: string | null
          rs_id: string | null
          s_chng_cd1: string | null
          s_chng_cd2: string | null
          s_legal: string | null
          sale_mo1: string | null
          sale_mo2: string | null
          sale_mo2_: string | null
          sale_prc1: string | null
          sale_prc2: string | null
          sale_prc2_: string | null
          sale_yr1: string | null
          sale_yr2: string | null
          sale_yr2_: string | null
          sec: string | null
          seq_no: string | null
          spass_cd: string | null
          spc_cir_cd: string | null
          spc_cir_tx: string | null
          spc_cir_yr: string | null
          spec_feat_: string | null
          state_par_: string | null
          sub: string | null
          tax_auth_c: string | null
          tot_lvg_ar: string | null
          tot_val: string | null
          tv_nsd: string | null
          tv_sd: string | null
          twn: string | null
          twp: string | null
          updated_at: string | null
          vi_cd1: string | null
          vi_cd2: string | null
          vi_cd2_: string | null
          yr_val_trn: string | null
        }
        Insert: {
          act_yr_blt?: string | null
          ag_val?: string | null
          app_stat?: string | null
          asmnt_yr?: string | null
          atv_strt?: string | null
          av_nsd?: string | null
          av_sd?: string | null
          bas_strt?: string | null
          bldg_val?: string | null
          blk?: string | null
          cap?: string | null
          cape_shpa?: string | null
          census_bk?: string | null
          clerk_n_2?: string | null
          clerk_no1?: string | null
          clerk_no2?: string | null
          co_app_sta?: string | null
          co_no?: string | null
          const_clas?: string | null
          const_val?: string | null
          county_fips?: string | null
          created_at?: string | null
          data_source?: string | null
          depth?: string | null
          distr_cd?: string | null
          distr_no?: string | null
          distr_yr?: string | null
          dor_cd1?: string | null
          dor_cd2?: string | null
          dor_cd3?: string | null
          dor_cd4?: string | null
          dor_uc?: string | null
          eff_yr_blt?: string | null
          file_t?: string | null
          front?: string | null
          grp_no?: string | null
          half_cd?: string | null
          id?: string | null
          imp_qual?: string | null
          imp_val?: string | null
          jv?: string | null
          jv_chng?: string | null
          land_sqfoot?: string | null
          land_val?: string | null
          latitude?: string | null
          longitude?: string | null
          lot?: string | null
          m_par_sal1?: string | null
          m_par_sal2?: string | null
          mkt_ar?: string | null
          mp_id?: string | null
          nbrhd_cd?: string | null
          nbrhd_cd1?: string | null
          nbrhd_cd2?: string | null
          nbrhd_cd3?: string | null
          nbrhd_cd4?: string | null
          nconst_val?: string | null
          no_buldng?: string | null
          no_res_unt?: string | null
          objectid?: string | null
          or_book1?: string | null
          or_book2?: string | null
          or_book2_?: string | null
          or_page1?: string | null
          or_page2?: string | null
          or_page2_?: string | null
          own_addr1?: string | null
          own_addr2?: string | null
          own_city?: string | null
          own_name?: string | null
          own_state?: string | null
          own_state2?: string | null
          own_zipcd?: string | null
          own_zipcda?: string | null
          pa_uc?: string | null
          parcel_id?: string | null
          parcel_id_?: string | null
          phy_addr1?: string | null
          phy_addr2?: string | null
          phy_city?: string | null
          phy_zipcd?: string | null
          pin_1?: string | null
          pin_2?: string | null
          plat_book?: string | null
          plat_page?: string | null
          public_lnd?: string | null
          qual_cd1?: string | null
          qual_cd2?: string | null
          qual_cd2_?: string | null
          rng?: string | null
          rs_id?: string | null
          s_chng_cd1?: string | null
          s_chng_cd2?: string | null
          s_legal?: string | null
          sale_mo1?: string | null
          sale_mo2?: string | null
          sale_mo2_?: string | null
          sale_prc1?: string | null
          sale_prc2?: string | null
          sale_prc2_?: string | null
          sale_yr1?: string | null
          sale_yr2?: string | null
          sale_yr2_?: string | null
          sec?: string | null
          seq_no?: string | null
          spass_cd?: string | null
          spc_cir_cd?: string | null
          spc_cir_tx?: string | null
          spc_cir_yr?: string | null
          spec_feat_?: string | null
          state_par_?: string | null
          sub?: string | null
          tax_auth_c?: string | null
          tot_lvg_ar?: string | null
          tot_val?: string | null
          tv_nsd?: string | null
          tv_sd?: string | null
          twn?: string | null
          twp?: string | null
          updated_at?: string | null
          vi_cd1?: string | null
          vi_cd2?: string | null
          vi_cd2_?: string | null
          yr_val_trn?: string | null
        }
        Update: {
          act_yr_blt?: string | null
          ag_val?: string | null
          app_stat?: string | null
          asmnt_yr?: string | null
          atv_strt?: string | null
          av_nsd?: string | null
          av_sd?: string | null
          bas_strt?: string | null
          bldg_val?: string | null
          blk?: string | null
          cap?: string | null
          cape_shpa?: string | null
          census_bk?: string | null
          clerk_n_2?: string | null
          clerk_no1?: string | null
          clerk_no2?: string | null
          co_app_sta?: string | null
          co_no?: string | null
          const_clas?: string | null
          const_val?: string | null
          county_fips?: string | null
          created_at?: string | null
          data_source?: string | null
          depth?: string | null
          distr_cd?: string | null
          distr_no?: string | null
          distr_yr?: string | null
          dor_cd1?: string | null
          dor_cd2?: string | null
          dor_cd3?: string | null
          dor_cd4?: string | null
          dor_uc?: string | null
          eff_yr_blt?: string | null
          file_t?: string | null
          front?: string | null
          grp_no?: string | null
          half_cd?: string | null
          id?: string | null
          imp_qual?: string | null
          imp_val?: string | null
          jv?: string | null
          jv_chng?: string | null
          land_sqfoot?: string | null
          land_val?: string | null
          latitude?: string | null
          longitude?: string | null
          lot?: string | null
          m_par_sal1?: string | null
          m_par_sal2?: string | null
          mkt_ar?: string | null
          mp_id?: string | null
          nbrhd_cd?: string | null
          nbrhd_cd1?: string | null
          nbrhd_cd2?: string | null
          nbrhd_cd3?: string | null
          nbrhd_cd4?: string | null
          nconst_val?: string | null
          no_buldng?: string | null
          no_res_unt?: string | null
          objectid?: string | null
          or_book1?: string | null
          or_book2?: string | null
          or_book2_?: string | null
          or_page1?: string | null
          or_page2?: string | null
          or_page2_?: string | null
          own_addr1?: string | null
          own_addr2?: string | null
          own_city?: string | null
          own_name?: string | null
          own_state?: string | null
          own_state2?: string | null
          own_zipcd?: string | null
          own_zipcda?: string | null
          pa_uc?: string | null
          parcel_id?: string | null
          parcel_id_?: string | null
          phy_addr1?: string | null
          phy_addr2?: string | null
          phy_city?: string | null
          phy_zipcd?: string | null
          pin_1?: string | null
          pin_2?: string | null
          plat_book?: string | null
          plat_page?: string | null
          public_lnd?: string | null
          qual_cd1?: string | null
          qual_cd2?: string | null
          qual_cd2_?: string | null
          rng?: string | null
          rs_id?: string | null
          s_chng_cd1?: string | null
          s_chng_cd2?: string | null
          s_legal?: string | null
          sale_mo1?: string | null
          sale_mo2?: string | null
          sale_mo2_?: string | null
          sale_prc1?: string | null
          sale_prc2?: string | null
          sale_prc2_?: string | null
          sale_yr1?: string | null
          sale_yr2?: string | null
          sale_yr2_?: string | null
          sec?: string | null
          seq_no?: string | null
          spass_cd?: string | null
          spc_cir_cd?: string | null
          spc_cir_tx?: string | null
          spc_cir_yr?: string | null
          spec_feat_?: string | null
          state_par_?: string | null
          sub?: string | null
          tax_auth_c?: string | null
          tot_lvg_ar?: string | null
          tot_val?: string | null
          tv_nsd?: string | null
          tv_sd?: string | null
          twn?: string | null
          twp?: string | null
          updated_at?: string | null
          vi_cd1?: string | null
          vi_cd2?: string | null
          vi_cd2_?: string | null
          yr_val_trn?: string | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          sha256_hash: string
          slug: string
          storage_url: string
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          id?: string
          is_active?: boolean | null
          sha256_hash: string
          slug: string
          storage_url: string
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean | null
          sha256_hash?: string
          slug?: string
          storage_url?: string
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          os: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      parcel_import_batches: {
        Row: {
          completed_at: string | null
          data_source: Database["public"]["Enums"]["parcel_data_source"]
          duration_seconds: number | null
          errors: Json | null
          id: string
          invalid_records: number | null
          processed_records: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["import_status"] | null
          total_records: number | null
          valid_records: number | null
          warnings: Json | null
        }
        Insert: {
          completed_at?: string | null
          data_source: Database["public"]["Enums"]["parcel_data_source"]
          duration_seconds?: number | null
          errors?: Json | null
          id?: string
          invalid_records?: number | null
          processed_records?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"] | null
          total_records?: number | null
          valid_records?: number | null
          warnings?: Json | null
        }
        Update: {
          completed_at?: string | null
          data_source?: Database["public"]["Enums"]["parcel_data_source"]
          duration_seconds?: number | null
          errors?: Json | null
          id?: string
          invalid_records?: number | null
          processed_records?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"] | null
          total_records?: number | null
          valid_records?: number | null
          warnings?: Json | null
        }
        Relationships: []
      }
      parcels: {
        Row: {
          assessed_value: number | null
          created_at: string | null
          geom: unknown | null
          id: string
          just_value: number | null
          living_area_sqft: number | null
          owner_name: string | null
          parcel_id: string
          property_use_code: string | null
          raw_data_id: number | null
          situs_address: string | null
          situs_city: string | null
          situs_zip: string | null
          source: string
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          assessed_value?: number | null
          created_at?: string | null
          geom?: unknown | null
          id?: string
          just_value?: number | null
          living_area_sqft?: number | null
          owner_name?: string | null
          parcel_id: string
          property_use_code?: string | null
          raw_data_id?: number | null
          situs_address?: string | null
          situs_city?: string | null
          situs_zip?: string | null
          source: string
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          assessed_value?: number | null
          created_at?: string | null
          geom?: unknown | null
          id?: string
          just_value?: number | null
          living_area_sqft?: number | null
          owner_name?: string | null
          parcel_id?: string
          property_use_code?: string | null
          raw_data_id?: number | null
          situs_address?: string | null
          situs_city?: string | null
          situs_zip?: string | null
          source?: string
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      physical_sites: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json
          parcel_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata: Json
          parcel_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json
          parcel_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          carrier_name: string
          coverage_details: Json | null
          created_at: string | null
          created_by: string | null
          deductible_amount: number | null
          effective_date: string
          expiration_date: string
          flood_deductible_amount: number | null
          id: string
          irfs_filing_id: number | null
          is_active: boolean | null
          policy_number: string
          policy_type: Database["public"]["Enums"]["policy_type_enum"]
          premium_amount: number | null
          property_id: string
          updated_at: string | null
          wind_deductible_percentage: number | null
        }
        Insert: {
          carrier_name: string
          coverage_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          deductible_amount?: number | null
          effective_date: string
          expiration_date: string
          flood_deductible_amount?: number | null
          id?: string
          irfs_filing_id?: number | null
          is_active?: boolean | null
          policy_number: string
          policy_type: Database["public"]["Enums"]["policy_type_enum"]
          premium_amount?: number | null
          property_id: string
          updated_at?: string | null
          wind_deductible_percentage?: number | null
        }
        Update: {
          carrier_name?: string
          coverage_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          deductible_amount?: number | null
          effective_date?: string
          expiration_date?: string
          flood_deductible_amount?: number | null
          id?: string
          irfs_filing_id?: number | null
          is_active?: boolean | null
          policy_number?: string
          policy_type?: Database["public"]["Enums"]["policy_type_enum"]
          premium_amount?: number | null
          property_id?: string
          updated_at?: string | null
          wind_deductible_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_old"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          description: string | null
          document_type: Database["public"]["Enums"]["document_type_enum"]
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          policy_id: string | null
          property_id: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type_enum"]
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          policy_id?: string | null
          property_id: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type_enum"]
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          policy_id?: string | null
          property_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "active_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_old"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          ai_insights: Json | null
          ai_market_analysis: Json | null
          ai_risk_factors: Json | null
          ai_risk_score: number | null
          city: string
          county: string | null
          county_id: string | null
          county_name: string | null
          created_at: string | null
          current_value: number | null
          external_ids: Json | null
          id: string
          last_ai_analysis_at: string | null
          latitude: number | null
          location: unknown | null
          longitude: number | null
          lot_size_acres: number | null
          metadata: Json | null
          occupancy_status:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number: string | null
          property_embedding: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          purchase_date: string | null
          purchase_price: number | null
          square_footage: number | null
          state: string
          updated_at: string | null
          user_id: string
          version: number | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          ai_insights?: Json | null
          ai_market_analysis?: Json | null
          ai_risk_factors?: Json | null
          ai_risk_score?: number | null
          city: string
          county?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          external_ids?: Json | null
          id?: string
          last_ai_analysis_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          lot_size_acres?: number | null
          metadata?: Json | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          property_embedding?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          square_footage?: number | null
          state?: string
          updated_at?: string | null
          user_id: string
          version?: number | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          ai_insights?: Json | null
          ai_market_analysis?: Json | null
          ai_risk_factors?: Json | null
          ai_risk_score?: number | null
          city?: string
          county?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          external_ids?: Json | null
          id?: string
          last_ai_analysis_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          lot_size_acres?: number | null
          metadata?: Json | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          property_embedding?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          square_footage?: number | null
          state?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "florida_counties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_backup_20250724: {
        Row: {
          address: Json | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          insurability_score: number | null
          insurance_carrier: string | null
          insurance_policy_number: string | null
          location: unknown | null
          name: string | null
          parcel_id: string | null
          postal_code: string | null
          property_type: string | null
          square_feet: number | null
          state: string | null
          street_address: string | null
          updated_at: string | null
          user_id: string | null
          value: number | null
          year_built: number | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          insurability_score?: number | null
          insurance_carrier?: string | null
          insurance_policy_number?: string | null
          location?: unknown | null
          name?: string | null
          parcel_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          square_feet?: number | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
          year_built?: number | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          insurability_score?: number | null
          insurance_carrier?: string | null
          insurance_policy_number?: string | null
          location?: unknown | null
          name?: string | null
          parcel_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          square_feet?: number | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      properties_old: {
        Row: {
          address: Json | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string | null
          details: Json | null
          id: string
          insurability_score: number | null
          insurance_carrier: string | null
          insurance_policy_number: string | null
          location: unknown | null
          name: string
          parcel_id: string | null
          postal_code: string | null
          property_type: string | null
          square_feet: number | null
          state: string | null
          street_address: string | null
          updated_at: string | null
          user_id: string | null
          value: number | null
          year_built: number | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          insurability_score?: number | null
          insurance_carrier?: string | null
          insurance_policy_number?: string | null
          location?: unknown | null
          name: string
          parcel_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          square_feet?: number | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
          year_built?: number | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          insurability_score?: number | null
          insurance_carrier?: string | null
          insurance_policy_number?: string | null
          location?: unknown | null
          name?: string
          parcel_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          square_feet?: number | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_ai_insights: {
        Row: {
          calculations: Json | null
          confidence_score: number | null
          created_at: string | null
          data_sources: Json | null
          description: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          insight_type: string
          is_active: boolean | null
          model_id: string | null
          predictions: Json | null
          property_id: string
          recommendations: Json | null
          title: string
        }
        Insert: {
          calculations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          insight_type: string
          is_active?: boolean | null
          model_id?: string | null
          predictions?: Json | null
          property_id: string
          recommendations?: Json | null
          title: string
        }
        Update: {
          calculations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          insight_type?: string
          is_active?: boolean | null
          model_id?: string | null
          predictions?: Json | null
          property_id?: string
          recommendations?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ai_insights_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_ai_insights_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_contractors: {
        Row: {
          claim_id: string | null
          company_name: string
          completion_date: string | null
          contact_name: string | null
          contract_amount: number | null
          contract_url: string | null
          created_at: string | null
          damage_id: string | null
          email: string | null
          estimate_amount: number | null
          estimate_date: string | null
          estimate_url: string | null
          id: string
          invoice_urls: Json | null
          license_number: string | null
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          permit_urls: Json | null
          phone: string | null
          property_id: string
          scope_of_work: string | null
          start_date: string | null
          updated_at: string | null
          version: number | null
          warranty_expiration: string | null
          work_quality_rating: number | null
          work_type: string
        }
        Insert: {
          claim_id?: string | null
          company_name: string
          completion_date?: string | null
          contact_name?: string | null
          contract_amount?: number | null
          contract_url?: string | null
          created_at?: string | null
          damage_id?: string | null
          email?: string | null
          estimate_amount?: number | null
          estimate_date?: string | null
          estimate_url?: string | null
          id?: string
          invoice_urls?: Json | null
          license_number?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          permit_urls?: Json | null
          phone?: string | null
          property_id: string
          scope_of_work?: string | null
          start_date?: string | null
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
          work_quality_rating?: number | null
          work_type: string
        }
        Update: {
          claim_id?: string | null
          company_name?: string
          completion_date?: string | null
          contact_name?: string | null
          contract_amount?: number | null
          contract_url?: string | null
          created_at?: string | null
          damage_id?: string | null
          email?: string | null
          estimate_amount?: number | null
          estimate_date?: string | null
          estimate_url?: string | null
          id?: string
          invoice_urls?: Json | null
          license_number?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          permit_urls?: Json | null
          phone?: string | null
          property_id?: string
          scope_of_work?: string | null
          start_date?: string | null
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
          work_quality_rating?: number | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_contractors_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contractors_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contractors_damage_id_fkey"
            columns: ["damage_id"]
            isOneToOne: false
            referencedRelation: "property_damage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contractors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_damage: {
        Row: {
          actual_repair_cost: number | null
          affected_rooms: Json | null
          affected_systems: Json | null
          ai_detected_damages: Json | null
          ai_detected_materials: Json | null
          ai_repair_estimate_high: number | null
          ai_repair_estimate_low: number | null
          ai_severity_score: number | null
          assessment_date: string
          assessor_name: string | null
          assessor_type: string | null
          claim_id: string | null
          created_at: string | null
          damage_description: string | null
          damage_embedding: string | null
          damage_severity: Database["public"]["Enums"]["damage_severity"]
          damage_type: string
          estimated_repair_cost: number | null
          id: string
          location_description: string | null
          measurements: Json | null
          metadata: Json | null
          photo_urls: Json | null
          property_id: string
          repair_completed_date: string | null
          report_url: string | null
          structure_id: string | null
          updated_at: string | null
          version: number | null
          video_urls: Json | null
        }
        Insert: {
          actual_repair_cost?: number | null
          affected_rooms?: Json | null
          affected_systems?: Json | null
          ai_detected_damages?: Json | null
          ai_detected_materials?: Json | null
          ai_repair_estimate_high?: number | null
          ai_repair_estimate_low?: number | null
          ai_severity_score?: number | null
          assessment_date: string
          assessor_name?: string | null
          assessor_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          damage_description?: string | null
          damage_embedding?: string | null
          damage_severity: Database["public"]["Enums"]["damage_severity"]
          damage_type: string
          estimated_repair_cost?: number | null
          id?: string
          location_description?: string | null
          measurements?: Json | null
          metadata?: Json | null
          photo_urls?: Json | null
          property_id: string
          repair_completed_date?: string | null
          report_url?: string | null
          structure_id?: string | null
          updated_at?: string | null
          version?: number | null
          video_urls?: Json | null
        }
        Update: {
          actual_repair_cost?: number | null
          affected_rooms?: Json | null
          affected_systems?: Json | null
          ai_detected_damages?: Json | null
          ai_detected_materials?: Json | null
          ai_repair_estimate_high?: number | null
          ai_repair_estimate_low?: number | null
          ai_severity_score?: number | null
          assessment_date?: string
          assessor_name?: string | null
          assessor_type?: string | null
          claim_id?: string | null
          created_at?: string | null
          damage_description?: string | null
          damage_embedding?: string | null
          damage_severity?: Database["public"]["Enums"]["damage_severity"]
          damage_type?: string
          estimated_repair_cost?: number | null
          id?: string
          location_description?: string | null
          measurements?: Json | null
          metadata?: Json | null
          photo_urls?: Json | null
          property_id?: string
          repair_completed_date?: string | null
          report_url?: string | null
          structure_id?: string | null
          updated_at?: string | null
          version?: number | null
          video_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_damage_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_damage_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_damage_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_damage_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "property_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      property_insurance: {
        Row: {
          carrier_name: string | null
          created_at: string | null
          dwelling_coverage: number | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          policy_number: string | null
          policy_type: string | null
          property_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          policy_number?: string | null
          policy_type?: string | null
          property_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          carrier_name?: string | null
          created_at?: string | null
          dwelling_coverage?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          policy_number?: string | null
          policy_type?: string | null
          property_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_insurance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_land: {
        Row: {
          assessed_land_value: number | null
          assessment_year: number | null
          created_at: string | null
          elevation_feet: number | null
          environmental_data: Json | null
          flood_zone: string | null
          gis_data: Json | null
          id: string
          land_use_code: string | null
          legal_description: string | null
          property_id: string
          updated_at: string | null
          version: number | null
          zoning_code: string | null
          zoning_description: string | null
        }
        Insert: {
          assessed_land_value?: number | null
          assessment_year?: number | null
          created_at?: string | null
          elevation_feet?: number | null
          environmental_data?: Json | null
          flood_zone?: string | null
          gis_data?: Json | null
          id?: string
          land_use_code?: string | null
          legal_description?: string | null
          property_id: string
          updated_at?: string | null
          version?: number | null
          zoning_code?: string | null
          zoning_description?: string | null
        }
        Update: {
          assessed_land_value?: number | null
          assessment_year?: number | null
          created_at?: string | null
          elevation_feet?: number | null
          environmental_data?: Json | null
          flood_zone?: string | null
          gis_data?: Json | null
          id?: string
          land_use_code?: string | null
          legal_description?: string | null
          property_id?: string
          updated_at?: string | null
          version?: number | null
          zoning_code?: string | null
          zoning_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_land_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_structures: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          construction_details: Json | null
          construction_type: string | null
          created_at: string | null
          exterior_walls: string | null
          features: Json | null
          foundation_type: string | null
          id: string
          last_renovation_date: string | null
          overall_condition: string | null
          property_id: string
          roof_age_years: number | null
          roof_material: string | null
          roof_type: string | null
          square_footage: number | null
          stories: number | null
          structure_name: string | null
          structure_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          construction_details?: Json | null
          construction_type?: string | null
          created_at?: string | null
          exterior_walls?: string | null
          features?: Json | null
          foundation_type?: string | null
          id?: string
          last_renovation_date?: string | null
          overall_condition?: string | null
          property_id: string
          roof_age_years?: number | null
          roof_material?: string | null
          roof_type?: string | null
          square_footage?: number | null
          stories?: number | null
          structure_name?: string | null
          structure_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          construction_details?: Json | null
          construction_type?: string | null
          created_at?: string | null
          exterior_walls?: string | null
          features?: Json | null
          foundation_type?: string | null
          id?: string
          last_renovation_date?: string | null
          overall_condition?: string | null
          property_id?: string
          roof_age_years?: number | null
          roof_material?: string | null
          roof_type?: string | null
          square_footage?: number | null
          stories?: number | null
          structure_name?: string | null
          structure_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_structures_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_systems: {
        Row: {
          condition_rating: number | null
          created_at: string | null
          id: string
          install_date: string | null
          last_inspection_date: string | null
          last_service_date: string | null
          maintenance_history: Json | null
          manufacturer: string | null
          model_number: string | null
          serial_number: string | null
          specifications: Json | null
          structure_id: string
          system_name: string | null
          system_type: string
          updated_at: string | null
          version: number | null
          warranty_expiration: string | null
        }
        Insert: {
          condition_rating?: number | null
          created_at?: string | null
          id?: string
          install_date?: string | null
          last_inspection_date?: string | null
          last_service_date?: string | null
          maintenance_history?: Json | null
          manufacturer?: string | null
          model_number?: string | null
          serial_number?: string | null
          specifications?: Json | null
          structure_id: string
          system_name?: string | null
          system_type: string
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
        }
        Update: {
          condition_rating?: number | null
          created_at?: string | null
          id?: string
          install_date?: string | null
          last_inspection_date?: string | null
          last_service_date?: string | null
          maintenance_history?: Json | null
          manufacturer?: string | null
          model_number?: string | null
          serial_number?: string | null
          specifications?: Json | null
          structure_id?: string
          system_name?: string | null
          system_type?: string
          updated_at?: string | null
          version?: number | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_systems_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "property_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_logs: {
        Row: {
          id: string
          level: string
          message: string
          metadata: Json | null
          source: string
          timestamp: string | null
        }
        Insert: {
          id?: string
          level: string
          message: string
          metadata?: Json | null
          source: string
          timestamp?: string | null
        }
        Update: {
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          source?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      scraper_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_object_id: number | null
          records_processed: number | null
          source: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_object_id?: number | null
          records_processed?: number | null
          source: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_object_id?: number | null
          records_processed?: number | null
          source?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      scraper_runs: {
        Row: {
          last_object_id: number | null
          last_run_at: string | null
          notes: string | null
          source: string
        }
        Insert: {
          last_object_id?: number | null
          last_run_at?: string | null
          notes?: string | null
          source: string
        }
        Update: {
          last_object_id?: number | null
          last_run_at?: string | null
          notes?: string | null
          source?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_questions: {
        Row: {
          created_at: string
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          updated_at?: string
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
      states: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          fips_code: string
          id: number
          name: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          fips_code: string
          id?: number
          name: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          fips_code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      stg_properties: {
        Row: {
          address: string
          ai_insights: Json | null
          ai_market_analysis: Json | null
          ai_risk_factors: Json | null
          ai_risk_score: number | null
          city: string
          county: string | null
          county_id: string | null
          county_name: string | null
          created_at: string | null
          current_value: number | null
          external_ids: Json | null
          id: string
          last_ai_analysis_at: string | null
          latitude: number | null
          location: unknown | null
          longitude: number | null
          lot_size_acres: number | null
          metadata: Json | null
          occupancy_status:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number: string | null
          property_embedding: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          purchase_date: string | null
          purchase_price: number | null
          square_footage: number | null
          state: string
          updated_at: string | null
          user_id: string
          version: number | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          ai_insights?: Json | null
          ai_market_analysis?: Json | null
          ai_risk_factors?: Json | null
          ai_risk_score?: number | null
          city: string
          county?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          external_ids?: Json | null
          id?: string
          last_ai_analysis_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          lot_size_acres?: number | null
          metadata?: Json | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          property_embedding?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          square_footage?: number | null
          state?: string
          updated_at?: string | null
          user_id: string
          version?: number | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          ai_insights?: Json | null
          ai_market_analysis?: Json | null
          ai_risk_factors?: Json | null
          ai_risk_score?: number | null
          city?: string
          county?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          external_ids?: Json | null
          id?: string
          last_ai_analysis_at?: string | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          lot_size_acres?: number | null
          metadata?: Json | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_number?: string | null
          property_embedding?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purchase_date?: string | null
          purchase_price?: number | null
          square_footage?: number | null
          state?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      user_legal_acceptance: {
        Row: {
          accepted_at: string | null
          ip_address: unknown | null
          legal_id: string
          revoked_at: string | null
          signature_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          ip_address?: unknown | null
          legal_id: string
          revoked_at?: string | null
          signature_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          ip_address?: unknown | null
          legal_id?: string
          revoked_at?: string | null
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
      user_plans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_type: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          is_verified: boolean | null
          is_x_connected: boolean | null
          last_name: string | null
          member_since: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role_enum"] | null
          verified_at: string | null
          x_handle: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          is_x_connected?: boolean | null
          last_name?: string | null
          member_since?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          verified_at?: string | null
          x_handle?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          is_x_connected?: boolean | null
          last_name?: string | null
          member_since?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          verified_at?: string | null
          x_handle?: string | null
        }
        Relationships: []
      }
      user_security_answers: {
        Row: {
          answer_hash: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_hash: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_hash?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "security_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      zip_codes: {
        Row: {
          active: boolean | null
          city_id: number | null
          county_id: number | null
          created_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          primary_city: string
          state_id: number | null
          zip_code: string
        }
        Insert: {
          active?: boolean | null
          city_id?: number | null
          county_id?: number | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          primary_city: string
          state_id?: number | null
          zip_code: string
        }
        Update: {
          active?: boolean | null
          city_id?: number | null
          county_id?: number | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          primary_city?: string
          state_id?: number | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "zip_codes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zip_codes_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zip_codes_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_policies: {
        Row: {
          carrier_name: string | null
          city: string | null
          coverage_details: Json | null
          created_at: string | null
          created_by: string | null
          deductible_amount: number | null
          effective_date: string | null
          expiration_date: string | null
          flood_deductible_amount: number | null
          id: string | null
          is_active: boolean | null
          policy_number: string | null
          policy_type: Database["public"]["Enums"]["policy_type_enum"] | null
          postal_code: string | null
          premium_amount: number | null
          property_id: string | null
          property_name: string | null
          state: string | null
          street_address: string | null
          updated_at: string | null
          wind_deductible_percentage: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_old"
            referencedColumns: ["id"]
          },
        ]
      }
      claims_overview: {
        Row: {
          carrier_name: string | null
          city: string | null
          claim_number: string | null
          created_at: string | null
          damage_type: Database["public"]["Enums"]["damage_type_enum"] | null
          date_of_loss: string | null
          deductible_applied: number | null
          description: string | null
          estimated_value: number | null
          id: string | null
          policy_id: string | null
          policy_number: string | null
          policy_type: Database["public"]["Enums"]["policy_type_enum"] | null
          property_id: string | null
          property_name: string | null
          state: string | null
          status: Database["public"]["Enums"]["claim_status_enum"] | null
          street_address: string | null
          updated_at: string | null
          user_id: string | null
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
      florida_parcels_column_analysis: {
        Row: {
          category: string | null
          column_name: unknown | null
          data_type: string | null
          description: string | null
          not_null: boolean | null
          type_category: string | null
        }
        Relationships: []
      }
      florida_parcels_summary: {
        Row: {
          building_count: number | null
          city: string | null
          county_name: string | null
          gis_url: string | null
          just_value: number | null
          land_value: number | null
          last_sale_price: number | null
          last_sale_year: number | null
          owner_name: string | null
          parcel_id: string | null
          physical_address: string | null
          property_search_url: string | null
          total_living_area: number | null
          year_built: number | null
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
      policy_clauses: {
        Row: {
          clause_id: string | null
          clause_text: string | null
          company_name: string | null
          file_name: string | null
          filing_id: number | null
          filing_type: string | null
          vec: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recent_login_activity: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          failed_attempts: number | null
          failure_reason: string | null
          id: string | null
          ip_address: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          os: string | null
          success: boolean | null
          total_logins: number | null
          user_agent: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { version: string; newname: string; oldname: string }
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
        Args: { att_name: string; geom: unknown; tbl: unknown; mode?: string }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          tolerance: number
          geog1: unknown
          geog2: unknown
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line2: unknown; line1: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          return_polygons?: boolean
          tolerance?: number
          clip?: unknown
          g1: unknown
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              new_type: string
              new_dim: number
              use_typmod?: boolean
              table_name: string
              column_name: string
              new_srid: number
            }
          | {
              new_type: string
              use_typmod?: boolean
              new_dim: number
              new_srid_in: number
              column_name: string
              table_name: string
              schema_name: string
              catalog_name: string
            }
          | {
              use_typmod?: boolean
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
            }
        Returns: string
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
        Args: { "": unknown } | { "": unknown }
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
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      check_florida_parcels_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          parcel_id: string
          last_created: string
          first_created: string
          duplicate_count: number
        }[]
      }
      check_florida_parcels_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          counties_with_data: number
          indexes_count: number
          has_rls: boolean
          last_updated: string
          table_status: string
          total_rows: number
        }[]
      }
      create_demo_property: {
        Args: { user_uuid: string }
        Returns: string
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | { column_name: string; table_name: string; schema_name: string }
          | {
              schema_name: string
              column_name: string
              catalog_name: string
              table_name: string
            }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { table_name: string }
          | { table_name: string; catalog_name: string; schema_name: string }
          | { table_name: string; schema_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      extract_county_from_address: {
        Args: { p_address: string }
        Returns: string
      }
      fdot_merge_stage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fdot_stage_insert_one: {
        Args: { j: Json }
        Returns: undefined
      }
      find_similar_properties: {
        Args: { p_property_id: string; p_limit?: number }
        Returns: {
          similarity: number
          address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_id: string
          square_footage: number
        }[]
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
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom2: unknown; geom1: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
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
      get_active_legal_documents: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          sha256_hash: string
          slug: string
          storage_url: string
          title: string
          updated_at: string | null
          version: string
        }[]
      }
      get_ai_usage_stats: {
        Args: { p_user_id?: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          analyses_by_type: Json
          models_used: Json
          total_tokens: number
          avg_confidence: number
          total_analyses: number
          total_cost_cents: number
        }[]
      }
      get_coastal_counties: {
        Args: Record<PropertyKey, never>
        Returns: {
          aob_restrictions: Json | null
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          citizens_service_center: string | null
          claim_filing_requirements: Json | null
          coastal_county: boolean | null
          contractor_license_search_url: string | null
          contractor_license_verification_phone: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_email: string | null
          emergency_mgmt_name: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_flood_zone_url: string | null
          fema_region: string | null
          flood_elevation_requirement: boolean | null
          flood_zone_maps_url: string | null
          gis_url: string | null
          households: number | null
          hurricane_evacuation_zone_url: string | null
          id: string
          impact_glass_required: boolean | null
          last_verified_at: string | null
          median_home_value: number | null
          notes: string | null
          online_permit_system: boolean | null
          parcel_data_url: string | null
          permit_expiration_days: number | null
          permit_fee_structure: Json | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string
          reinspection_fee: number | null
          storm_surge_planning_zone_url: string | null
          supplemental_claim_deadline_days: number | null
          tax_collector_email: string | null
          tax_collector_name: string | null
          tax_collector_phone: string | null
          tax_collector_website: string | null
          time_zone: string
          unlicensed_contractor_limit: number | null
          updated_at: string | null
          wind_speed_requirement: number | null
          windstorm_requirements: Json | null
        }[]
      }
      get_counties_by_region: {
        Args: { p_region: string }
        Returns: {
          aob_restrictions: Json | null
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          citizens_service_center: string | null
          claim_filing_requirements: Json | null
          coastal_county: boolean | null
          contractor_license_search_url: string | null
          contractor_license_verification_phone: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_email: string | null
          emergency_mgmt_name: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_flood_zone_url: string | null
          fema_region: string | null
          flood_elevation_requirement: boolean | null
          flood_zone_maps_url: string | null
          gis_url: string | null
          households: number | null
          hurricane_evacuation_zone_url: string | null
          id: string
          impact_glass_required: boolean | null
          last_verified_at: string | null
          median_home_value: number | null
          notes: string | null
          online_permit_system: boolean | null
          parcel_data_url: string | null
          permit_expiration_days: number | null
          permit_fee_structure: Json | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string
          reinspection_fee: number | null
          storm_surge_planning_zone_url: string | null
          supplemental_claim_deadline_days: number | null
          tax_collector_email: string | null
          tax_collector_name: string | null
          tax_collector_phone: string | null
          tax_collector_website: string | null
          time_zone: string
          unlicensed_contractor_limit: number | null
          updated_at: string | null
          wind_speed_requirement: number | null
          windstorm_requirements: Json | null
        }[]
      }
      get_county_building_requirements: {
        Args: { p_county_identifier: string }
        Returns: {
          permit_expiration_days: number
          flood_elevation_requirement: boolean
          county_name: string
          building_code_version: string
          wind_speed_requirement: number
          coastal_county: boolean
          impact_glass_required: boolean
        }[]
      }
      get_county_for_property: {
        Args: { p_property_id: string }
        Returns: {
          aob_restrictions: Json | null
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          citizens_service_center: string | null
          claim_filing_requirements: Json | null
          coastal_county: boolean | null
          contractor_license_search_url: string | null
          contractor_license_verification_phone: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_email: string | null
          emergency_mgmt_name: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_flood_zone_url: string | null
          fema_region: string | null
          flood_elevation_requirement: boolean | null
          flood_zone_maps_url: string | null
          gis_url: string | null
          households: number | null
          hurricane_evacuation_zone_url: string | null
          id: string
          impact_glass_required: boolean | null
          last_verified_at: string | null
          median_home_value: number | null
          notes: string | null
          online_permit_system: boolean | null
          parcel_data_url: string | null
          permit_expiration_days: number | null
          permit_fee_structure: Json | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string
          reinspection_fee: number | null
          storm_surge_planning_zone_url: string | null
          supplemental_claim_deadline_days: number | null
          tax_collector_email: string | null
          tax_collector_name: string | null
          tax_collector_phone: string | null
          tax_collector_website: string | null
          time_zone: string
          unlicensed_contractor_limit: number | null
          updated_at: string | null
          wind_speed_requirement: number | null
          windstorm_requirements: Json | null
        }[]
      }
      get_county_name: {
        Args: { fips_code: number }
        Returns: string
      }
      get_county_property_appraiser: {
        Args: { p_county_identifier: string }
        Returns: {
          gis_url: string
          property_search_url: string
          property_appraiser_website: string
          county_name: string
        }[]
      }
      get_florida_county: {
        Args: { p_identifier: string }
        Returns: {
          aob_restrictions: Json | null
          building_code_version: string | null
          building_dept_address: string | null
          building_dept_email: string | null
          building_dept_name: string | null
          building_dept_phone: string | null
          building_dept_website: string | null
          citizens_service_center: string | null
          claim_filing_requirements: Json | null
          coastal_county: boolean | null
          contractor_license_search_url: string | null
          contractor_license_verification_phone: string | null
          county_code: string
          county_name: string
          county_seat: string
          created_at: string | null
          emergency_hotline: string | null
          emergency_mgmt_email: string | null
          emergency_mgmt_name: string | null
          emergency_mgmt_phone: string | null
          emergency_mgmt_website: string | null
          fema_flood_zone_url: string | null
          fema_region: string | null
          flood_elevation_requirement: boolean | null
          flood_zone_maps_url: string | null
          gis_url: string | null
          households: number | null
          hurricane_evacuation_zone_url: string | null
          id: string
          impact_glass_required: boolean | null
          last_verified_at: string | null
          median_home_value: number | null
          notes: string | null
          online_permit_system: boolean | null
          parcel_data_url: string | null
          permit_expiration_days: number | null
          permit_fee_structure: Json | null
          permit_search_url: string | null
          population: number | null
          property_appraiser_email: string | null
          property_appraiser_name: string | null
          property_appraiser_phone: string | null
          property_appraiser_website: string | null
          property_search_url: string | null
          region: string
          reinspection_fee: number | null
          storm_surge_planning_zone_url: string | null
          supplemental_claim_deadline_days: number | null
          tax_collector_email: string | null
          tax_collector_name: string | null
          tax_collector_phone: string | null
          tax_collector_website: string | null
          time_zone: string
          unlicensed_contractor_limit: number | null
          updated_at: string | null
          wind_speed_requirement: number | null
          windstorm_requirements: Json | null
        }[]
      }
      get_my_claim_details: {
        Args: { p_claim_id: string }
        Returns: {
          user_email: string
          carrier_name: string
          user_name: string
          claim_number: string
          property_name: string
        }[]
      }
      get_parcel_counts_by_county: {
        Args: Record<PropertyKey, never>
        Returns: {
          county_name: string
          parcel_count: number
          county_code: string
        }[]
      }
      get_parcel_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_parcel_stats_by_county: {
        Args: { p_county_code?: string }
        Returns: {
          total_parcels: number
          total_just_value: number
          avg_just_value: number
          total_land_value: number
          residential_units: number
          county_name: string
        }[]
      }
      get_parcel_with_county: {
        Args: { p_parcel_id: string }
        Returns: {
          property_appraiser_url: string
          parcel_id: string
          owner_name: string
          physical_address: string
          just_value: number
          land_value: number
          county_name: string
          gis_url: string
        }[]
      }
      get_parcels_column_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          example_columns: string
          category: string
          column_count: number
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_property_county_requirements: {
        Args: { p_property_id: string }
        Returns: {
          requirement_details: Json
          requirement_value: string
          requirement_type: string
        }[]
      }
      get_raw_data_counts_by_source: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
        Returns: string
      }
      log_login_activity: {
        Args: {
          p_user_agent: string
          p_user_id: string
          p_ip_address: string
          p_failure_reason?: string
          p_success?: boolean
        }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          p_resource_type?: string
          p_resource_id?: string
          p_metadata?: Json
          p_action: string
        }
        Returns: undefined
      }
      log_user_creation_debug: {
        Args: {
          p_user_id: string
          p_metadata?: Json
          p_error_message?: string
          p_success: boolean
          p_step: string
        }
        Returns: undefined
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      max_objectid_for_county: {
        Args: { cnty_layer: number }
        Returns: {
          max: number
        }[]
      }
      merge_license_into_contractor: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      needs_reaccept: {
        Args: { uid: string }
        Returns: {
          created_at: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          sha256_hash: string
          slug: string
          storage_url: string
          title: string
          updated_at: string | null
          version: string
        }[]
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
        Args: { geomtable: string; geomschema: string; geomcolumn: string }
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
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
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
          use_new_name?: boolean
          coord_dimension: number
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
      queue_county_scraping: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      record_legal_acceptance: {
        Args: {
          p_legal_id: string
          p_user_id: string
          p_signature_data?: Json
          p_user_agent: string
          p_ip_address: unknown
        }
        Returns: string
      }
      refresh_parcels_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_floir_data: {
        Args: {
          match_count?: number
          data_types?: Database["public"]["Enums"]["floir_data_type"][]
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          normalized_data: Json
          data_type: Database["public"]["Enums"]["floir_data_type"]
          id: string
          primary_key: string
          similarity: number
          source_url: string
        }[]
      }
      search_parcels_by_owner: {
        Args: { p_limit?: number; p_county_fips?: number; p_owner_name: string }
        Returns: {
          parcel_id: string
          assessment_year: number
          physical_address: string
          city: string
          just_value: number
          county_name: string
          owner_name: string
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
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line2: unknown; line1: unknown }
          | { pt2: unknown; pt1: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
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
      st_asgeojson: {
        Args:
          | { "": string }
          | { maxdecimaldigits?: number; geog: unknown; options?: number }
          | { maxdecimaldigits?: number; options?: number; geom: unknown }
          | {
              r: Record<string, unknown>
              maxdecimaldigits?: number
              pretty_bool?: boolean
              geom_column?: string
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              options?: number
              nprefix?: string
              id?: string
              maxdecimaldigits?: number
            }
          | {
              id?: string
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
            }
          | {
              nprefix?: string
              options?: number
              maxdecimaldigits?: number
              geom: unknown
              version: number
              id?: string
            }
          | { options?: number; maxdecimaldigits?: number; geom: unknown }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { maxdecimaldigits?: number; geog: unknown; nprefix?: string }
          | { nprefix?: string; geom: unknown; maxdecimaldigits?: number }
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
          buffer?: number
          geom: unknown
          bounds: unknown
          clip_geom?: boolean
          extent?: number
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
          | { rel?: number; maxdecimaldigits?: number; geog: unknown }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              prec_m?: number
              with_sizes?: boolean
              prec_z?: number
              prec?: number
              geom: unknown
              with_boxes?: boolean
            }
          | {
              with_boxes?: boolean
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; options?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: number
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
          | { options?: string; radius: number; geom: unknown }
          | { quadsegs: number; geom: unknown; radius: number }
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
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom2: unknown; geom1: unknown }
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
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_pctconvex: number
          param_geom: unknown
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom2: unknown; geom1: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog2: unknown; use_spheroid?: boolean; geog1: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; radius: number; geom2: unknown }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
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
      st_dwithin: {
        Args: {
          use_spheroid?: boolean
          geog1: unknown
          geog2: unknown
          tolerance: number
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { dm?: number; dz?: number; dy: number; dx: number; geom: unknown }
          | { dx: number; box: unknown; dy: number }
          | { dz?: number; dy: number; dx: number; box: unknown }
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
        Args: { zvalue?: number; geom: unknown }
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
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
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
      st_generatepoints: {
        Args:
          | { npoints: number; area: unknown }
          | { seed: number; npoints: number; area: unknown }
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
          | { geom: unknown; maxchars?: number }
          | { maxchars?: number; geog: unknown }
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
          max_iter?: number
          tolerance?: number
          fail_if_not_converged?: boolean
          g: unknown
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
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom2: unknown; geom1: unknown }
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
      st_interpolatepoint: {
        Args: { point: unknown; line: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { gridsize?: number; geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
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
        Args: { flags?: number; geom: unknown }
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
        Args: { geom2: unknown; geom1: unknown }
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
          leftrightoffset?: number
          tomeasure: number
          frommeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
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
      st_makeline: {
        Args: { "": unknown[] } | { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { params: string; geom: unknown }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
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
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
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
        Args: { distance: number; params?: string; line: unknown }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
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
          mcoordinate: number
          srid?: number
          ycoordinate: number
          xcoordinate: number
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
          ycoordinate: number
          srid?: number
          xcoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
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
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          prec_z?: number
          g: unknown
          prec_x: number
          prec_y?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geom: unknown; srid: number } | { srid: number; geog: unknown }
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
        Args: { vertex_fraction: number; geom: unknown; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_j: number; origin?: unknown; cell_i: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { gridsize?: number; geom: unknown; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { ords: unknown; geom: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { gridsize?: number; geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          y: number
          x: number
          margin?: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { geom: unknown; to_proj: string; from_proj: string }
          | { geom: unknown; to_srid: number; from_proj: string }
          | { to_proj: string; geom: unknown }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom2: unknown; geom1: unknown }
          | { gridsize: number; geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { tolerance?: number; extend_to?: unknown; g1: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
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
      suggest_type_optimizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          column_name: string
          reason: string
          suggested_type: string
          current_type: string
        }[]
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      transfer_florida_parcels_staging: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_all_property_counties: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          new_srid_in: number
          column_name: string
          table_name: string
          schema_name: string
        }
        Returns: string
      }
      validate_parcel_data: {
        Args: { p_parcel_id: string }
        Returns: {
          field_name: string
          issue: string
        }[]
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
      claim_status_enum:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "denied"
        | "settled"
        | "closed"
      crawl_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      damage_severity: "minor" | "moderate" | "major" | "total_loss"
      damage_type_enum:
        | "hurricane"
        | "flood"
        | "fire"
        | "theft"
        | "vandalism"
        | "water"
        | "wind"
        | "hail"
        | "other"
      document_type_enum: "policy" | "claim" | "evidence"
      floir_data_type:
        | "catastrophe"
        | "industry_reports"
        | "professional_liability"
        | "data_call"
        | "licensee_search"
        | "rate_filings"
        | "receivership"
        | "financial_reports"
        | "news_bulletins"
        | "surplus_lines"
      import_status:
        | "pending"
        | "downloading"
        | "validating"
        | "transforming"
        | "importing"
        | "completed"
        | "failed"
        | "cancelled"
      occupancy_status:
        | "owner_occupied"
        | "tenant_occupied"
        | "vacant"
        | "seasonal"
      parcel_data_source:
        | "fl_dor_statewide"
        | "fl_county_charlotte"
        | "fl_county_lee"
        | "fl_county_sarasota"
        | "fl_county_miami_dade"
        | "fl_county_broward"
        | "fl_county_palm_beach"
        | "fl_county_hillsborough"
        | "fl_county_pinellas"
        | "fl_county_orange"
        | "fl_county_duval"
      plan_status_enum: "active" | "canceled" | "suspended" | "trial"
      plan_type_enum: "free" | "basic" | "premium" | "enterprise"
      policy_type_enum:
        | "homeowners"
        | "flood"
        | "windstorm"
        | "umbrella"
        | "auto"
        | "other"
      processing_status_enum: "pending" | "processing" | "completed" | "failed"
      property_type: "residential" | "commercial" | "land" | "mixed_use"
      user_role_enum:
        | "user"
        | "contractor"
        | "adjuster"
        | "admin"
        | "super_admin"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
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
      claim_status_enum: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "denied",
        "settled",
        "closed",
      ],
      crawl_status: ["pending", "running", "completed", "failed", "cancelled"],
      damage_severity: ["minor", "moderate", "major", "total_loss"],
      damage_type_enum: [
        "hurricane",
        "flood",
        "fire",
        "theft",
        "vandalism",
        "water",
        "wind",
        "hail",
        "other",
      ],
      document_type_enum: ["policy", "claim", "evidence"],
      floir_data_type: [
        "catastrophe",
        "industry_reports",
        "professional_liability",
        "data_call",
        "licensee_search",
        "rate_filings",
        "receivership",
        "financial_reports",
        "news_bulletins",
        "surplus_lines",
      ],
      import_status: [
        "pending",
        "downloading",
        "validating",
        "transforming",
        "importing",
        "completed",
        "failed",
        "cancelled",
      ],
      occupancy_status: [
        "owner_occupied",
        "tenant_occupied",
        "vacant",
        "seasonal",
      ],
      parcel_data_source: [
        "fl_dor_statewide",
        "fl_county_charlotte",
        "fl_county_lee",
        "fl_county_sarasota",
        "fl_county_miami_dade",
        "fl_county_broward",
        "fl_county_palm_beach",
        "fl_county_hillsborough",
        "fl_county_pinellas",
        "fl_county_orange",
        "fl_county_duval",
      ],
      plan_status_enum: ["active", "canceled", "suspended", "trial"],
      plan_type_enum: ["free", "basic", "premium", "enterprise"],
      policy_type_enum: [
        "homeowners",
        "flood",
        "windstorm",
        "umbrella",
        "auto",
        "other",
      ],
      processing_status_enum: ["pending", "processing", "completed", "failed"],
      property_type: ["residential", "commercial", "land", "mixed_use"],
      user_role_enum: [
        "user",
        "contractor",
        "adjuster",
        "admin",
        "super_admin",
      ],
    },
  },
} as const

