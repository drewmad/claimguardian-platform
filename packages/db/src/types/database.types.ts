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
      ai_explanations: {
        Row: {
          activation_patterns: Json | null
          attention_maps: Json | null
          computation_time_ms: number | null
          confidence_breakdown: Json | null
          counterfactuals: Json | null
          created_at: string | null
          decision_path: Json | null
          explanation_method: string
          explanation_size_kb: number | null
          feature_importances: Json
          feature_interactions: Json | null
          id: string
          method_config: Json | null
          minimum_changes: Json | null
          model_version_id: string | null
          prediction_id: string
          saliency_maps: Json | null
          text_explanation: string | null
        }
        Insert: {
          activation_patterns?: Json | null
          attention_maps?: Json | null
          computation_time_ms?: number | null
          confidence_breakdown?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          decision_path?: Json | null
          explanation_method: string
          explanation_size_kb?: number | null
          feature_importances: Json
          feature_interactions?: Json | null
          id?: string
          method_config?: Json | null
          minimum_changes?: Json | null
          model_version_id?: string | null
          prediction_id: string
          saliency_maps?: Json | null
          text_explanation?: string | null
        }
        Update: {
          activation_patterns?: Json | null
          attention_maps?: Json | null
          computation_time_ms?: number | null
          confidence_breakdown?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          decision_path?: Json | null
          explanation_method?: string
          explanation_size_kb?: number | null
          feature_importances?: Json
          feature_interactions?: Json | null
          id?: string
          method_config?: Json | null
          minimum_changes?: Json | null
          model_version_id?: string | null
          prediction_id?: string
          saliency_maps?: Json | null
          text_explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_explanations_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "ml_model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_processing_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_retries: number | null
          parameters: Json | null
          priority: string | null
          processing_type: string
          retry_count: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          parameters?: Json | null
          priority?: string | null
          processing_type: string
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          parameters?: Json | null
          priority?: string | null
          processing_type?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_stream_processors: {
        Row: {
          average_latency_ms: number | null
          backpressure_threshold: number | null
          checkpoint_interval_seconds: number | null
          created_at: string | null
          error_count: number | null
          id: string
          input_sources: Json
          last_checkpoint: string | null
          max_throughput_per_second: number | null
          output_destinations: Json
          parallelism: number | null
          processed_count: number | null
          processing_pipeline: Json
          processor_name: string
          slide_interval_seconds: number | null
          state_backend: string | null
          state_retention_hours: number | null
          status: string | null
          updated_at: string | null
          window_size_seconds: number | null
          window_type: string | null
        }
        Insert: {
          average_latency_ms?: number | null
          backpressure_threshold?: number | null
          checkpoint_interval_seconds?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          input_sources: Json
          last_checkpoint?: string | null
          max_throughput_per_second?: number | null
          output_destinations: Json
          parallelism?: number | null
          processed_count?: number | null
          processing_pipeline: Json
          processor_name: string
          slide_interval_seconds?: number | null
          state_backend?: string | null
          state_retention_hours?: number | null
          status?: string | null
          updated_at?: string | null
          window_size_seconds?: number | null
          window_type?: string | null
        }
        Update: {
          average_latency_ms?: number | null
          backpressure_threshold?: number | null
          checkpoint_interval_seconds?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          input_sources?: Json
          last_checkpoint?: string | null
          max_throughput_per_second?: number | null
          output_destinations?: Json
          parallelism?: number | null
          processed_count?: number | null
          processing_pipeline?: Json
          processor_name?: string
          slide_interval_seconds?: number | null
          state_backend?: string | null
          state_retention_hours?: number | null
          status?: string | null
          updated_at?: string | null
          window_size_seconds?: number | null
          window_type?: string | null
        }
        Relationships: []
      }
      ai_training_datasets: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_statistics: Json | null
          dataset_name: string
          dataset_type: string
          description: string | null
          feature_columns: Json
          id: string
          label_columns: Json
          quality_metrics: Json | null
          size_gb: number | null
          storage_format: string
          storage_location: string
          total_samples: number
          validation_passed: boolean | null
          version: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_statistics?: Json | null
          dataset_name: string
          dataset_type: string
          description?: string | null
          feature_columns: Json
          id?: string
          label_columns: Json
          quality_metrics?: Json | null
          size_gb?: number | null
          storage_format: string
          storage_location: string
          total_samples: number
          validation_passed?: boolean | null
          version: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_statistics?: Json | null
          dataset_name?: string
          dataset_type?: string
          description?: string | null
          feature_columns?: Json
          id?: string
          label_columns?: Json
          quality_metrics?: Json | null
          size_gb?: number | null
          storage_format?: string
          storage_location?: string
          total_samples?: number
          validation_passed?: boolean | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_datasets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_cost: number | null
          id: string
          model: string
          operation_type: string
          provider: string
          request_metadata: Json | null
          response_time_ms: number | null
          success: boolean | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          model: string
          operation_type: string
          provider: string
          request_metadata?: Json | null
          response_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          model?: string
          operation_type?: string
          provider?: string
          request_metadata?: Json | null
          response_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ar_scan_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          measurements: Json
          room_type: string
          scan_data: Json
          session_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          measurements: Json
          room_type: string
          scan_data: Json
          session_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          measurements?: Json
          room_type?: string
          scan_data?: Json
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ar_scan_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
      claude_errors: {
        Row: {
          context: Json
          created_at: string | null
          error_details: string
          error_message: string
          error_stack: string | null
          id: string
          learning_applied: boolean | null
          pattern_id: string | null
          resolution_method: string | null
          resolved: boolean | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          context: Json
          created_at?: string | null
          error_details: string
          error_message: string
          error_stack?: string | null
          id: string
          learning_applied?: boolean | null
          pattern_id?: string | null
          resolution_method?: string | null
          resolved?: boolean | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          context?: Json
          created_at?: string | null
          error_details?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          learning_applied?: boolean | null
          pattern_id?: string | null
          resolution_method?: string | null
          resolved?: boolean | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      claude_learnings: {
        Row: {
          confidence_score: number | null
          context_tags: string[] | null
          created_at: string | null
          id: string
          mistake_pattern: string
          pattern_name: string
          solution_pattern: string
          success_rate: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          id: string
          mistake_pattern: string
          pattern_name: string
          solution_pattern: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          id?: string
          mistake_pattern?: string
          pattern_name?: string
          solution_pattern?: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      community_analytics_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          filters_used: Json | null
          id: string
          insights_accessed: Json | null
          privacy_settings: Json
          session_duration: number | null
          session_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          filters_used?: Json | null
          id?: string
          insights_accessed?: Json | null
          privacy_settings: Json
          session_duration?: number | null
          session_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          filters_used?: Json | null
          id?: string
          insights_accessed?: Json | null
          privacy_settings?: Json
          session_duration?: number | null
          session_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_analytics_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_contributions: {
        Row: {
          anonymized_data: Json
          contributed_at: string | null
          created_at: string | null
          id: string
          privacy_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anonymized_data: Json
          contributed_at?: string | null
          created_at?: string | null
          id?: string
          privacy_level?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anonymized_data?: Json
          contributed_at?: string | null
          created_at?: string | null
          id?: string
          privacy_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "consent_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
      document_extractions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          document_id: string | null
          extraction_data: Json | null
          id: string
          processed_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          extraction_data?: Json | null
          id?: string
          processed_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          extraction_data?: Json | null
          id?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "error_logs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      federated_learning_rounds: {
        Row: {
          aggregated_metrics: Json | null
          aggregation_strategy: string
          completed_at: string | null
          convergence_delta: number | null
          data_distribution: Json | null
          differential_privacy: Json | null
          global_model_update: Json | null
          homomorphic_encryption: boolean | null
          id: string
          max_participants: number | null
          min_participants: number | null
          model_family: string
          node_contributions: Json | null
          participating_nodes: Json | null
          round_number: number
          secure_aggregation: boolean | null
          started_at: string | null
          status: string | null
          verification_threshold: number | null
        }
        Insert: {
          aggregated_metrics?: Json | null
          aggregation_strategy: string
          completed_at?: string | null
          convergence_delta?: number | null
          data_distribution?: Json | null
          differential_privacy?: Json | null
          global_model_update?: Json | null
          homomorphic_encryption?: boolean | null
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          model_family: string
          node_contributions?: Json | null
          participating_nodes?: Json | null
          round_number: number
          secure_aggregation?: boolean | null
          started_at?: string | null
          status?: string | null
          verification_threshold?: number | null
        }
        Update: {
          aggregated_metrics?: Json | null
          aggregation_strategy?: string
          completed_at?: string | null
          convergence_delta?: number | null
          data_distribution?: Json | null
          differential_privacy?: Json | null
          global_model_update?: Json | null
          homomorphic_encryption?: boolean | null
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          model_family?: string
          node_contributions?: Json | null
          participating_nodes?: Json | null
          round_number?: number
          secure_aggregation?: boolean | null
          started_at?: string | null
          status?: string | null
          verification_threshold?: number | null
        }
        Relationships: []
      }
      federated_nodes: {
        Row: {
          allow_model_caching: boolean | null
          certification_expires: string | null
          certified_at: string | null
          compute_capacity: Json | null
          contribution_count: number | null
          data_characteristics: Json | null
          data_retention_days: number | null
          failed_rounds: number | null
          id: string
          last_heartbeat: string | null
          network_bandwidth: number | null
          node_identifier: string
          organization_id: string | null
          privacy_level: string | null
          registered_at: string | null
          status: string | null
          successful_rounds: number | null
          trust_score: number | null
        }
        Insert: {
          allow_model_caching?: boolean | null
          certification_expires?: string | null
          certified_at?: string | null
          compute_capacity?: Json | null
          contribution_count?: number | null
          data_characteristics?: Json | null
          data_retention_days?: number | null
          failed_rounds?: number | null
          id?: string
          last_heartbeat?: string | null
          network_bandwidth?: number | null
          node_identifier: string
          organization_id?: string | null
          privacy_level?: string | null
          registered_at?: string | null
          status?: string | null
          successful_rounds?: number | null
          trust_score?: number | null
        }
        Update: {
          allow_model_caching?: boolean | null
          certification_expires?: string | null
          certified_at?: string | null
          compute_capacity?: Json | null
          contribution_count?: number | null
          data_characteristics?: Json | null
          data_retention_days?: number | null
          failed_rounds?: number | null
          id?: string
          last_heartbeat?: string | null
          network_bandwidth?: number | null
          node_identifier?: string
          organization_id?: string | null
          privacy_level?: string | null
          registered_at?: string | null
          status?: string | null
          successful_rounds?: number | null
          trust_score?: number | null
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
        Relationships: [
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
      floor_plans: {
        Row: {
          created_at: string | null
          generated_from_ar: boolean | null
          id: string
          name: string
          plan_data: Json
          room_count: number
          total_area: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_from_ar?: boolean | null
          id?: string
          name: string
          plan_data: Json
          room_count?: number
          total_area: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_from_ar?: boolean | null
          id?: string
          name?: string
          plan_data?: Json
          room_count?: number
          total_area?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      florida_parcels: {
        Row: {
          act_yr_blt: number | null
          ai_features: Json | null
          ai_processed: boolean | null
          alt_key: string | null
          app_stat: string | null
          asmnt_yr: number | null
          ass_dif_tr: number | null
          ass_trnsfr: string | null
          atv_strt: string | null
          av_class_u: number | null
          av_consrv_: number | null
          av_h2o_rec: number | null
          av_hist_co: number | null
          av_hist_si: number | null
          av_hmstd: number | null
          av_non_hms: number | null
          av_nsd: number | null
          av_resd_no: number | null
          av_sd: number | null
          av_wrkng_w: number | null
          bas_strt: string | null
          census_bk: string | null
          clerk_no1: string | null
          clerk_no2: string | null
          co_app_sta: string | null
          co_no: number | null
          completeness_score: number | null
          cono_prv_h: number | null
          const_clas: string | null
          county_fips: string | null
          created_at: string | null
          data_source: string | null
          data_version: string | null
          del_val: number | null
          distr_cd: string | null
          distr_yr: number | null
          dor_uc: string | null
          dt_last_in: number | null
          eff_yr_blt: number | null
          fidu_addr1: string | null
          fidu_addr2: string | null
          fidu_cd: string | null
          fidu_city: string | null
          fidu_name: string | null
          fidu_state: string | null
          fidu_zipcd: string | null
          file_t: string | null
          geom: unknown | null
          geometry_valid: boolean | null
          grp_no: string | null
          id: number
          imp_qual: string | null
          imp_val: number | null
          import_batch: string | null
          import_date: string | null
          jv: number | null
          jv_chng: number | null
          jv_chng_cd: number | null
          jv_class_u: number | null
          jv_consrv_: number | null
          jv_h2o_rec: number | null
          jv_hist_co: number | null
          jv_hist_si: number | null
          jv_hmstd: number | null
          jv_non_hms: number | null
          jv_resd_no: number | null
          jv_wrkng_w: number | null
          latitude: number | null
          lnd_sqfoot: number | null
          lnd_unts_c: number | null
          lnd_val: number | null
          longitude: number | null
          m_par_sal1: string | null
          m_par_sal2: string | null
          mkt_ar: string | null
          mp_id: string | null
          nbrhd_cd: string | null
          nconst_val: number | null
          no_buldng: number | null
          no_lnd_unt: number | null
          no_res_unt: number | null
          or_book1: string | null
          or_book2: string | null
          or_page1: string | null
          or_page2: string | null
          own_addr1: string | null
          own_addr2: string | null
          own_city: string | null
          own_name: string | null
          own_state: string | null
          own_state_: string | null
          own_zipcd: string | null
          pa_uc: string | null
          par_splt: number | null
          parcel_id: string | null
          parcel_id_: string | null
          phy_addr1: string | null
          phy_addr2: string | null
          phy_city: string | null
          phy_zipcd: string | null
          prev_hmstd: number | null
          processing_notes: string | null
          public_lnd: string | null
          qual_cd1: string | null
          qual_cd2: string | null
          rng: string | null
          rs_id: string | null
          s_chng_cd1: string | null
          s_chng_cd2: string | null
          s_legal: string | null
          sale_mo1: string | null
          sale_mo2: string | null
          sale_prc1: number | null
          sale_prc2: number | null
          sale_yr1: number | null
          sale_yr2: number | null
          sec: string | null
          seq_no: number | null
          shape_area: number | null
          shape_length: number | null
          source_file: string | null
          source_format: string | null
          spass_cd: string | null
          spc_cir_cd: string | null
          spc_cir_tx: string | null
          spc_cir_yr: number | null
          spec_feat_: number | null
          state_par_: string | null
          tax_auth_c: string | null
          tot_lvg_ar: number | null
          tv_nsd: number | null
          tv_sd: number | null
          twn: string | null
          updated_at: string | null
          validation_status: string | null
          vi_cd1: string | null
          vi_cd2: string | null
          yr_val_trn: number | null
        }
        Insert: {
          act_yr_blt?: number | null
          ai_features?: Json | null
          ai_processed?: boolean | null
          alt_key?: string | null
          app_stat?: string | null
          asmnt_yr?: number | null
          ass_dif_tr?: number | null
          ass_trnsfr?: string | null
          atv_strt?: string | null
          av_class_u?: number | null
          av_consrv_?: number | null
          av_h2o_rec?: number | null
          av_hist_co?: number | null
          av_hist_si?: number | null
          av_hmstd?: number | null
          av_non_hms?: number | null
          av_nsd?: number | null
          av_resd_no?: number | null
          av_sd?: number | null
          av_wrkng_w?: number | null
          bas_strt?: string | null
          census_bk?: string | null
          clerk_no1?: string | null
          clerk_no2?: string | null
          co_app_sta?: string | null
          co_no?: number | null
          completeness_score?: number | null
          cono_prv_h?: number | null
          const_clas?: string | null
          county_fips?: string | null
          created_at?: string | null
          data_source?: string | null
          data_version?: string | null
          del_val?: number | null
          distr_cd?: string | null
          distr_yr?: number | null
          dor_uc?: string | null
          dt_last_in?: number | null
          eff_yr_blt?: number | null
          fidu_addr1?: string | null
          fidu_addr2?: string | null
          fidu_cd?: string | null
          fidu_city?: string | null
          fidu_name?: string | null
          fidu_state?: string | null
          fidu_zipcd?: string | null
          file_t?: string | null
          geom?: unknown | null
          geometry_valid?: boolean | null
          grp_no?: string | null
          id?: number
          imp_qual?: string | null
          imp_val?: number | null
          import_batch?: string | null
          import_date?: string | null
          jv?: number | null
          jv_chng?: number | null
          jv_chng_cd?: number | null
          jv_class_u?: number | null
          jv_consrv_?: number | null
          jv_h2o_rec?: number | null
          jv_hist_co?: number | null
          jv_hist_si?: number | null
          jv_hmstd?: number | null
          jv_non_hms?: number | null
          jv_resd_no?: number | null
          jv_wrkng_w?: number | null
          latitude?: number | null
          lnd_sqfoot?: number | null
          lnd_unts_c?: number | null
          lnd_val?: number | null
          longitude?: number | null
          m_par_sal1?: string | null
          m_par_sal2?: string | null
          mkt_ar?: string | null
          mp_id?: string | null
          nbrhd_cd?: string | null
          nconst_val?: number | null
          no_buldng?: number | null
          no_lnd_unt?: number | null
          no_res_unt?: number | null
          or_book1?: string | null
          or_book2?: string | null
          or_page1?: string | null
          or_page2?: string | null
          own_addr1?: string | null
          own_addr2?: string | null
          own_city?: string | null
          own_name?: string | null
          own_state?: string | null
          own_state_?: string | null
          own_zipcd?: string | null
          pa_uc?: string | null
          par_splt?: number | null
          parcel_id?: string | null
          parcel_id_?: string | null
          phy_addr1?: string | null
          phy_addr2?: string | null
          phy_city?: string | null
          phy_zipcd?: string | null
          prev_hmstd?: number | null
          processing_notes?: string | null
          public_lnd?: string | null
          qual_cd1?: string | null
          qual_cd2?: string | null
          rng?: string | null
          rs_id?: string | null
          s_chng_cd1?: string | null
          s_chng_cd2?: string | null
          s_legal?: string | null
          sale_mo1?: string | null
          sale_mo2?: string | null
          sale_prc1?: number | null
          sale_prc2?: number | null
          sale_yr1?: number | null
          sale_yr2?: number | null
          sec?: string | null
          seq_no?: number | null
          shape_area?: number | null
          shape_length?: number | null
          source_file?: string | null
          source_format?: string | null
          spass_cd?: string | null
          spc_cir_cd?: string | null
          spc_cir_tx?: string | null
          spc_cir_yr?: number | null
          spec_feat_?: number | null
          state_par_?: string | null
          tax_auth_c?: string | null
          tot_lvg_ar?: number | null
          tv_nsd?: number | null
          tv_sd?: number | null
          twn?: string | null
          updated_at?: string | null
          validation_status?: string | null
          vi_cd1?: string | null
          vi_cd2?: string | null
          yr_val_trn?: number | null
        }
        Update: {
          act_yr_blt?: number | null
          ai_features?: Json | null
          ai_processed?: boolean | null
          alt_key?: string | null
          app_stat?: string | null
          asmnt_yr?: number | null
          ass_dif_tr?: number | null
          ass_trnsfr?: string | null
          atv_strt?: string | null
          av_class_u?: number | null
          av_consrv_?: number | null
          av_h2o_rec?: number | null
          av_hist_co?: number | null
          av_hist_si?: number | null
          av_hmstd?: number | null
          av_non_hms?: number | null
          av_nsd?: number | null
          av_resd_no?: number | null
          av_sd?: number | null
          av_wrkng_w?: number | null
          bas_strt?: string | null
          census_bk?: string | null
          clerk_no1?: string | null
          clerk_no2?: string | null
          co_app_sta?: string | null
          co_no?: number | null
          completeness_score?: number | null
          cono_prv_h?: number | null
          const_clas?: string | null
          county_fips?: string | null
          created_at?: string | null
          data_source?: string | null
          data_version?: string | null
          del_val?: number | null
          distr_cd?: string | null
          distr_yr?: number | null
          dor_uc?: string | null
          dt_last_in?: number | null
          eff_yr_blt?: number | null
          fidu_addr1?: string | null
          fidu_addr2?: string | null
          fidu_cd?: string | null
          fidu_city?: string | null
          fidu_name?: string | null
          fidu_state?: string | null
          fidu_zipcd?: string | null
          file_t?: string | null
          geom?: unknown | null
          geometry_valid?: boolean | null
          grp_no?: string | null
          id?: number
          imp_qual?: string | null
          imp_val?: number | null
          import_batch?: string | null
          import_date?: string | null
          jv?: number | null
          jv_chng?: number | null
          jv_chng_cd?: number | null
          jv_class_u?: number | null
          jv_consrv_?: number | null
          jv_h2o_rec?: number | null
          jv_hist_co?: number | null
          jv_hist_si?: number | null
          jv_hmstd?: number | null
          jv_non_hms?: number | null
          jv_resd_no?: number | null
          jv_wrkng_w?: number | null
          latitude?: number | null
          lnd_sqfoot?: number | null
          lnd_unts_c?: number | null
          lnd_val?: number | null
          longitude?: number | null
          m_par_sal1?: string | null
          m_par_sal2?: string | null
          mkt_ar?: string | null
          mp_id?: string | null
          nbrhd_cd?: string | null
          nconst_val?: number | null
          no_buldng?: number | null
          no_lnd_unt?: number | null
          no_res_unt?: number | null
          or_book1?: string | null
          or_book2?: string | null
          or_page1?: string | null
          or_page2?: string | null
          own_addr1?: string | null
          own_addr2?: string | null
          own_city?: string | null
          own_name?: string | null
          own_state?: string | null
          own_state_?: string | null
          own_zipcd?: string | null
          pa_uc?: string | null
          par_splt?: number | null
          parcel_id?: string | null
          parcel_id_?: string | null
          phy_addr1?: string | null
          phy_addr2?: string | null
          phy_city?: string | null
          phy_zipcd?: string | null
          prev_hmstd?: number | null
          processing_notes?: string | null
          public_lnd?: string | null
          qual_cd1?: string | null
          qual_cd2?: string | null
          rng?: string | null
          rs_id?: string | null
          s_chng_cd1?: string | null
          s_chng_cd2?: string | null
          s_legal?: string | null
          sale_mo1?: string | null
          sale_mo2?: string | null
          sale_prc1?: number | null
          sale_prc2?: number | null
          sale_yr1?: number | null
          sale_yr2?: number | null
          sec?: string | null
          seq_no?: number | null
          shape_area?: number | null
          shape_length?: number | null
          source_file?: string | null
          source_format?: string | null
          spass_cd?: string | null
          spc_cir_cd?: string | null
          spc_cir_tx?: string | null
          spc_cir_yr?: number | null
          spec_feat_?: number | null
          state_par_?: string | null
          tax_auth_c?: string | null
          tot_lvg_ar?: number | null
          tv_nsd?: number | null
          tv_sd?: number | null
          twn?: string | null
          updated_at?: string | null
          validation_status?: string | null
          vi_cd1?: string | null
          vi_cd2?: string | null
          yr_val_trn?: number | null
        }
        Relationships: []
      }
      florida_parcels_orchestrator: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          counties_to_process: number[]
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          last_updated: string | null
          mode: string
          parallel_counties: number | null
          processed_counties: number | null
          started_at: string | null
          status: string
          stopped_at: string | null
          total_counties: number
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          counties_to_process: number[]
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          last_updated?: string | null
          mode: string
          parallel_counties?: number | null
          processed_counties?: number | null
          started_at?: string | null
          status: string
          stopped_at?: string | null
          total_counties: number
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          counties_to_process?: number[]
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          last_updated?: string | null
          mode?: string
          parallel_counties?: number | null
          processed_counties?: number | null
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          total_counties?: number
        }
        Relationships: []
      }
      florida_parcels_processing_log: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          county_code: number
          county_name: string
          created_at: string | null
          error_count: number | null
          error_message: string | null
          failed_at: string | null
          id: string
          last_batch_index: number | null
          processed_parcels: number | null
          started_at: string | null
          status: string
          total_parcels: number | null
          updated_at: string | null
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          county_code: number
          county_name: string
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          last_batch_index?: number | null
          processed_parcels?: number | null
          started_at?: string | null
          status: string
          total_parcels?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          county_code?: number
          county_name?: string
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          last_batch_index?: number | null
          processed_parcels?: number | null
          started_at?: string | null
          status?: string
          total_parcels?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      florida_parcels_processing_stats: {
        Row: {
          average_parcels_per_second: number | null
          county_code: number
          created_at: string | null
          date: string
          errors_encountered: number | null
          id: string
          parcels_processed: number | null
          peak_memory_mb: number | null
          processing_time_seconds: number | null
        }
        Insert: {
          average_parcels_per_second?: number | null
          county_code: number
          created_at?: string | null
          date: string
          errors_encountered?: number | null
          id?: string
          parcels_processed?: number | null
          peak_memory_mb?: number | null
          processing_time_seconds?: number | null
        }
        Update: {
          average_parcels_per_second?: number | null
          county_code?: number
          created_at?: string | null
          date?: string
          errors_encountered?: number | null
          id?: string
          parcels_processed?: number | null
          peak_memory_mb?: number | null
          processing_time_seconds?: number | null
        }
        Relationships: []
      }
      geospatial_data_loads: {
        Row: {
          county: string | null
          created_at: string | null
          created_by: string | null
          error_details: Json | null
          id: string
          load_completed_at: string | null
          load_started_at: string
          load_status: string | null
          load_type: string
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          source_agency: string | null
          source_name: string
          source_url: string | null
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          id?: string
          load_completed_at?: string | null
          load_started_at: string
          load_status?: string | null
          load_type: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          source_agency?: string | null
          source_name: string
          source_url?: string | null
        }
        Update: {
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          id?: string
          load_completed_at?: string | null
          load_started_at?: string
          load_status?: string | null
          load_type?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          source_agency?: string | null
          source_name?: string
          source_url?: string | null
        }
        Relationships: []
      }
      learnings: {
        Row: {
          code_language: string | null
          created_at: string | null
          error_details: Json | null
          error_type: string | null
          framework: string | null
          id: string
          lesson_learned: string | null
          solution: string | null
          task_description: string | null
          task_type: string
          tools_used: string[] | null
          updated_at: string | null
          user_intent: string | null
        }
        Insert: {
          code_language?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_type?: string | null
          framework?: string | null
          id?: string
          lesson_learned?: string | null
          solution?: string | null
          task_description?: string | null
          task_type: string
          tools_used?: string[] | null
          updated_at?: string | null
          user_intent?: string | null
        }
        Update: {
          code_language?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_type?: string | null
          framework?: string | null
          id?: string
          lesson_learned?: string | null
          solution?: string | null
          task_description?: string | null
          task_type?: string
          tools_used?: string[] | null
          updated_at?: string | null
          user_intent?: string | null
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
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "login_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "marketing_attribution_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ml_model_deployments: {
        Row: {
          ab_test_id: string | null
          average_latency_ms: number | null
          canary_rollout: Json | null
          deployed_at: string | null
          deployed_by: string | null
          deployment_config: Json
          deployment_env: string
          deployment_target: string
          error_count: number | null
          health_status: Json | null
          id: string
          last_health_check: string | null
          model_version_id: string
          peak_latency_ms: number | null
          previous_deployment_id: string | null
          request_count: number | null
          retired_at: string | null
          rollback_count: number | null
          status: string | null
          traffic_percentage: number | null
        }
        Insert: {
          ab_test_id?: string | null
          average_latency_ms?: number | null
          canary_rollout?: Json | null
          deployed_at?: string | null
          deployed_by?: string | null
          deployment_config: Json
          deployment_env: string
          deployment_target: string
          error_count?: number | null
          health_status?: Json | null
          id?: string
          last_health_check?: string | null
          model_version_id: string
          peak_latency_ms?: number | null
          previous_deployment_id?: string | null
          request_count?: number | null
          retired_at?: string | null
          rollback_count?: number | null
          status?: string | null
          traffic_percentage?: number | null
        }
        Update: {
          ab_test_id?: string | null
          average_latency_ms?: number | null
          canary_rollout?: Json | null
          deployed_at?: string | null
          deployed_by?: string | null
          deployment_config?: Json
          deployment_env?: string
          deployment_target?: string
          error_count?: number | null
          health_status?: Json | null
          id?: string
          last_health_check?: string | null
          model_version_id?: string
          peak_latency_ms?: number | null
          previous_deployment_id?: string | null
          request_count?: number | null
          retired_at?: string | null
          rollback_count?: number | null
          status?: string | null
          traffic_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_model_deployments_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ml_model_deployments_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "ml_model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_model_deployments_previous_deployment_id_fkey"
            columns: ["previous_deployment_id"]
            isOneToOne: false
            referencedRelation: "ml_model_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_versions: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          architecture: Json
          created_at: string | null
          created_by: string | null
          deployment_checklist: Json | null
          ethical_review: Json | null
          feature_importance: Json | null
          framework: string
          hyperparameters: Json
          id: string
          inference_optimization: Json | null
          latency_p50_ms: number | null
          latency_p95_ms: number | null
          latency_p99_ms: number | null
          lineage_type: string | null
          model_artifacts: Json | null
          model_family: string
          model_size_mb: number | null
          parent_model_id: string | null
          passed_ab_testing: boolean | null
          passed_validation: boolean | null
          production_metrics: Json | null
          production_ready: boolean | null
          regulatory_compliance: Json | null
          test_metrics: Json
          training_config: Json
          training_data_hash: string
          training_dataset_id: string | null
          validation_metrics: Json
          version_tag: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          architecture: Json
          created_at?: string | null
          created_by?: string | null
          deployment_checklist?: Json | null
          ethical_review?: Json | null
          feature_importance?: Json | null
          framework: string
          hyperparameters: Json
          id?: string
          inference_optimization?: Json | null
          latency_p50_ms?: number | null
          latency_p95_ms?: number | null
          latency_p99_ms?: number | null
          lineage_type?: string | null
          model_artifacts?: Json | null
          model_family: string
          model_size_mb?: number | null
          parent_model_id?: string | null
          passed_ab_testing?: boolean | null
          passed_validation?: boolean | null
          production_metrics?: Json | null
          production_ready?: boolean | null
          regulatory_compliance?: Json | null
          test_metrics: Json
          training_config: Json
          training_data_hash: string
          training_dataset_id?: string | null
          validation_metrics: Json
          version_tag: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          architecture?: Json
          created_at?: string | null
          created_by?: string | null
          deployment_checklist?: Json | null
          ethical_review?: Json | null
          feature_importance?: Json | null
          framework?: string
          hyperparameters?: Json
          id?: string
          inference_optimization?: Json | null
          latency_p50_ms?: number | null
          latency_p95_ms?: number | null
          latency_p99_ms?: number | null
          lineage_type?: string | null
          model_artifacts?: Json | null
          model_family?: string
          model_size_mb?: number | null
          parent_model_id?: string | null
          passed_ab_testing?: boolean | null
          passed_validation?: boolean | null
          production_metrics?: Json | null
          production_ready?: boolean | null
          regulatory_compliance?: Json | null
          test_metrics?: Json
          training_config?: Json
          training_data_hash?: string
          training_dataset_id?: string | null
          validation_metrics?: Json
          version_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_model_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ml_model_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ml_model_versions_parent_model_id_fkey"
            columns: ["parent_model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_model_versions_training_dataset_id_fkey"
            columns: ["training_dataset_id"]
            isOneToOne: false
            referencedRelation: "ai_training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_performance_metrics: {
        Row: {
          accuracy: number | null
          auc_roc: number | null
          concept_drift_detected: boolean | null
          cpu_usage_percent: number | null
          f1_score: number | null
          false_negative: number | null
          false_positive: number | null
          feature_drift_score: number | null
          gpu_usage_percent: number | null
          id: string
          inference_latency_p50: number | null
          inference_latency_p95: number | null
          inference_latency_p99: number | null
          memory_usage_mb: number | null
          metric_timestamp: string
          metric_window: string
          model_deployment_id: string | null
          precision: number | null
          prediction_count: number | null
          prediction_drift_score: number | null
          recall: number | null
          throughput_per_second: number | null
          true_negative: number | null
          true_positive: number | null
        }
        Insert: {
          accuracy?: number | null
          auc_roc?: number | null
          concept_drift_detected?: boolean | null
          cpu_usage_percent?: number | null
          f1_score?: number | null
          false_negative?: number | null
          false_positive?: number | null
          feature_drift_score?: number | null
          gpu_usage_percent?: number | null
          id?: string
          inference_latency_p50?: number | null
          inference_latency_p95?: number | null
          inference_latency_p99?: number | null
          memory_usage_mb?: number | null
          metric_timestamp: string
          metric_window: string
          model_deployment_id?: string | null
          precision?: number | null
          prediction_count?: number | null
          prediction_drift_score?: number | null
          recall?: number | null
          throughput_per_second?: number | null
          true_negative?: number | null
          true_positive?: number | null
        }
        Update: {
          accuracy?: number | null
          auc_roc?: number | null
          concept_drift_detected?: boolean | null
          cpu_usage_percent?: number | null
          f1_score?: number | null
          false_negative?: number | null
          false_positive?: number | null
          feature_drift_score?: number | null
          gpu_usage_percent?: number | null
          id?: string
          inference_latency_p50?: number | null
          inference_latency_p95?: number | null
          inference_latency_p99?: number | null
          memory_usage_mb?: number | null
          metric_timestamp?: string
          metric_window?: string
          model_deployment_id?: string | null
          precision?: number | null
          prediction_count?: number | null
          prediction_drift_score?: number | null
          recall?: number | null
          throughput_per_second?: number | null
          true_negative?: number | null
          true_positive?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_performance_metrics_model_deployment_id_fkey"
            columns: ["model_deployment_id"]
            isOneToOne: false
            referencedRelation: "ml_model_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      model_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          image_urls: string[]
          local_processing: boolean | null
          model_info: Json | null
          model_url: string | null
          processing_task_id: string | null
          progress: number | null
          settings: Json
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          image_urls: string[]
          local_processing?: boolean | null
          model_info?: Json | null
          model_url?: string | null
          processing_task_id?: string | null
          progress?: number | null
          settings: Json
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          image_urls?: string[]
          local_processing?: boolean | null
          model_info?: Json | null
          model_url?: string | null
          processing_task_id?: string | null
          progress?: number | null
          settings?: Json
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      monitoring_logs: {
        Row: {
          check_type: string
          created_at: string | null
          details: Json
          id: string
          status: string
        }
        Insert: {
          check_type: string
          created_at?: string | null
          details: Json
          id?: string
          status: string
        }
        Update: {
          check_type?: string
          created_at?: string | null
          details?: Json
          id?: string
          status?: string
        }
        Relationships: []
      }
      parcel_access_logs: {
        Row: {
          access_granted: boolean | null
          access_method: string | null
          access_type: string | null
          accessed_at: string | null
          county_fips: string | null
          created_at: string | null
          denial_reason: string | null
          id: string
          ip_address: unknown | null
          parcel_id: string | null
          query_parameters: Json | null
          response_time_ms: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_granted?: boolean | null
          access_method?: string | null
          access_type?: string | null
          accessed_at?: string | null
          county_fips?: string | null
          created_at?: string | null
          denial_reason?: string | null
          id?: string
          ip_address?: unknown | null
          parcel_id?: string | null
          query_parameters?: Json | null
          response_time_ms?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_granted?: boolean | null
          access_method?: string | null
          access_type?: string | null
          accessed_at?: string | null
          county_fips?: string | null
          created_at?: string | null
          denial_reason?: string | null
          id?: string
          ip_address?: unknown | null
          parcel_id?: string | null
          query_parameters?: Json | null
          response_time_ms?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      parcel_access_test: {
        Row: {
          county_fips: string | null
          created_at: string | null
          id: string
          test_data: string | null
        }
        Insert: {
          county_fips?: string | null
          created_at?: string | null
          id?: string
          test_data?: string | null
        }
        Update: {
          county_fips?: string | null
          created_at?: string | null
          id?: string
          test_data?: string | null
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
          {
            foreignKeyName: "personal_property_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "policies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
      policy_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          insurance_type: string | null
          mime_type: string
          property_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          insurance_type?: string | null
          mime_type: string
          property_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          insurance_type?: string | null
          mime_type?: string
          property_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "signup_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
      stream_analytics_results: {
        Row: {
          aggregations: Json
          anomalies_detected: Json | null
          confidence_level: number | null
          data_quality_score: number | null
          event_count: number
          id: string
          pattern_matches: Json | null
          predictions: Json | null
          processed_at: string | null
          processor_id: string | null
          unique_entities: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          aggregations: Json
          anomalies_detected?: Json | null
          confidence_level?: number | null
          data_quality_score?: number | null
          event_count: number
          id?: string
          pattern_matches?: Json | null
          predictions?: Json | null
          processed_at?: string | null
          processor_id?: string | null
          unique_entities?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          aggregations?: Json
          anomalies_detected?: Json | null
          confidence_level?: number | null
          data_quality_score?: number | null
          event_count?: number
          id?: string
          pattern_matches?: Json | null
          predictions?: Json | null
          processed_at?: string | null
          processor_id?: string | null
          unique_entities?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_results_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "ai_stream_processors"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_checklist_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "user_legal_acceptance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted: boolean
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permission_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          permission_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          permission_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          permission_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_status: string | null
          account_type: string | null
          created_at: string | null
          email: string | null
          email_verified_at: string | null
          failed_login_count: number | null
          first_name: string | null
          internal_notes: string | null
          is_x_connected: boolean | null
          last_failed_login_at: string | null
          last_login_at: string | null
          last_login_ip: string | null
          last_name: string | null
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
          tier: Database["public"]["Enums"]["user_tier"] | null
          trust_level: string | null
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          updated_at: string | null
          user_id: string
          x_handle: string | null
        }
        Insert: {
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_login_count?: number | null
          first_name?: string | null
          internal_notes?: string | null
          is_x_connected?: boolean | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_name?: string | null
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
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string | null
          user_id: string
          x_handle?: string | null
        }
        Update: {
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_login_count?: number | null
          first_name?: string | null
          internal_notes?: string | null
          is_x_connected?: boolean | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_name?: string | null
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
          tier?: Database["public"]["Enums"]["user_tier"] | null
          trust_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string | null
          user_id?: string
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          started_at: string | null
          status: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_ai_requests_monthly: number | null
          max_claims: number | null
          max_properties: number | null
          max_storage_gb: number | null
          permissions: Database["public"]["Enums"]["permission_type"][] | null
          price_monthly: number | null
          price_yearly: number | null
          rate_limits: Json | null
          tier_name: Database["public"]["Enums"]["user_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_ai_requests_monthly?: number | null
          max_claims?: number | null
          max_properties?: number | null
          max_storage_gb?: number | null
          permissions?: Database["public"]["Enums"]["permission_type"][] | null
          price_monthly?: number | null
          price_yearly?: number | null
          rate_limits?: Json | null
          tier_name: Database["public"]["Enums"]["user_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_ai_requests_monthly?: number | null
          max_claims?: number | null
          max_properties?: number | null
          max_storage_gb?: number | null
          permissions?: Database["public"]["Enums"]["permission_type"][] | null
          price_monthly?: number | null
          price_yearly?: number | null
          rate_limits?: Json | null
          tier_name?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "user_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      active_events: {
        Row: {
          attributes: Json | null
          created_at: string | null
          data_source: string | null
          end_time: string | null
          event_name: string | null
          event_type: string | null
          external_id: string | null
          geom: unknown | null
          id: string | null
          severity: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          data_source?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          external_id?: string | null
          geom?: unknown | null
          id?: string | null
          severity?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          data_source?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          external_id?: string | null
          geom?: unknown | null
          id?: string | null
          severity?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_cost_projection: {
        Row: {
          current_month: string | null
          month_to_date_cost: number | null
          projected_monthly_cost: number | null
          recent_avg_daily_cost: number | null
        }
        Relationships: []
      }
      ai_model_performance: {
        Row: {
          avg_response_time: number | null
          avg_tokens_per_call: number | null
          error_rate: number | null
          median_response_time: number | null
          model: string | null
          operation_type: string | null
          p95_response_time: number | null
          provider: string | null
          total_calls: number | null
        }
        Relationships: []
      }
      ai_usage_hourly: {
        Row: {
          calls: number | null
          cost: number | null
          hour: string | null
          provider: string | null
          tokens: number | null
        }
        Relationships: []
      }
      ai_usage_summary: {
        Row: {
          avg_response_time_ms: number | null
          calls: number | null
          daily_cost: number | null
          date: string | null
          failed_calls: number | null
          model: string | null
          provider: string | null
          total_tokens: number | null
        }
        Relationships: []
      }
      community_statistics: {
        Row: {
          avg_claim_amount: number | null
          total_claims: number | null
          total_properties: number | null
          total_users: number | null
        }
        Relationships: []
      }
      critical_facilities: {
        Row: {
          address: string | null
          attributes: Json | null
          capacity: number | null
          created_at: string | null
          facility_type: string | null
          geom: unknown | null
          id: string | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          attributes?: Json | null
          capacity?: number | null
          created_at?: string | null
          facility_type?: string | null
          geom?: unknown | null
          id?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          attributes?: Json | null
          capacity?: number | null
          created_at?: string | null
          facility_type?: string | null
          geom?: unknown | null
          id?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_summary: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_type: string | null
          id: string | null
          severity: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      florida_parcels_import_status: {
        Row: {
          completed_at: string | null
          county_code: number | null
          county_name: string | null
          error_count: number | null
          processed_parcels: number | null
          processing_seconds: number | null
          progress_percent: number | null
          started_at: string | null
          status: string | null
          total_parcels: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          county_code?: number | null
          county_name?: string | null
          error_count?: number | null
          processed_parcels?: number | null
          processing_seconds?: never
          progress_percent?: never
          started_at?: string | null
          status?: string | null
          total_parcels?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          county_code?: number | null
          county_name?: string | null
          error_count?: number | null
          processed_parcels?: number | null
          processing_seconds?: never
          progress_percent?: never
          started_at?: string | null
          status?: string | null
          total_parcels?: number | null
          updated_at?: string | null
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
      geospatial_load_summary: {
        Row: {
          avg_load_time_seconds: number | null
          failed_loads: number | null
          last_successful_load: string | null
          load_type: string | null
          successful_loads: number | null
          total_loads: number | null
          total_records_failed: number | null
          total_records_processed: number | null
        }
        Relationships: []
      }
      hazard_zones: {
        Row: {
          created_at: string | null
          data_version: string | null
          effective_date: string | null
          expiration_date: string | null
          geom: unknown | null
          hazard_type_code: string | null
          id: string | null
          updated_at: string | null
          zone_attributes: Json | null
          zone_name: string | null
        }
        Insert: {
          created_at?: string | null
          data_version?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          geom?: unknown | null
          hazard_type_code?: string | null
          id?: string | null
          updated_at?: string | null
          zone_attributes?: Json | null
          zone_name?: string | null
        }
        Update: {
          created_at?: string | null
          data_version?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          geom?: unknown | null
          hazard_type_code?: string | null
          id?: string | null
          updated_at?: string | null
          zone_attributes?: Json | null
          zone_name?: string | null
        }
        Relationships: []
      }
      latest_geospatial_loads: {
        Row: {
          county: string | null
          id: string | null
          load_completed_at: string | null
          load_type: string | null
          metadata: Json | null
          records_processed: number | null
          source_agency: string | null
          source_name: string | null
        }
        Relationships: []
      }
      mv_claims_analytics: {
        Row: {
          avg_approved: number | null
          avg_days_to_resolve: number | null
          avg_estimated: number | null
          avg_settled: number | null
          claim_count: number | null
          damage_type: string | null
          month: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          total_paid: number | null
          total_settled: number | null
        }
        Relationships: []
      }
      parcel_access_summary: {
        Row: {
          access_count: number | null
          access_date: string | null
          access_method: string | null
          access_type: string | null
          avg_response_time: number | null
          county_fips: string | null
          denied_access_count: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      parcels: {
        Row: {
          assessed_value: number | null
          county_fips: string | null
          county_name: string | null
          created_at: string | null
          data_source: string | null
          geom: unknown | null
          id: string | null
          land_area: number | null
          last_updated: string | null
          living_area: number | null
          owner_address: string | null
          owner_name: string | null
          parcel_id: string | null
          property_address: string | null
          property_use_code: string | null
          raw_data: Json | null
          taxable_value: number | null
          year_built: number | null
        }
        Insert: {
          assessed_value?: number | null
          county_fips?: string | null
          county_name?: string | null
          created_at?: string | null
          data_source?: string | null
          geom?: unknown | null
          id?: string | null
          land_area?: number | null
          last_updated?: string | null
          living_area?: number | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_id?: string | null
          property_address?: string | null
          property_use_code?: string | null
          raw_data?: Json | null
          taxable_value?: number | null
          year_built?: number | null
        }
        Update: {
          assessed_value?: number | null
          county_fips?: string | null
          county_name?: string | null
          created_at?: string | null
          data_source?: string | null
          geom?: unknown | null
          id?: string | null
          land_area?: number | null
          last_updated?: string | null
          living_area?: number | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_id?: string | null
          property_address?: string | null
          property_use_code?: string | null
          raw_data?: Json | null
          taxable_value?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          construction_type: string | null
          county_id: string | null
          county_name: string | null
          created_at: string | null
          current_value: number | null
          electrical_year: number | null
          evacuation_zone: string | null
          flood_zone: string | null
          full_address: string | null
          garage_spaces: number | null
          hvac_year: number | null
          id: string | null
          is_current: boolean | null
          legal_description: string | null
          location: unknown | null
          lot_size_acres: number | null
          metadata: Json | null
          mortgage_balance: number | null
          occupancy_status:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_id: string | null
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
          street_address: string | null
          updated_at: string | null
          user_id: string | null
          valid_from: string | null
          valid_to: string | null
          version: number | null
          version_id: string | null
          wind_zone: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          construction_type?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          full_address?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string | null
          is_current?: boolean | null
          legal_description?: string | null
          location?: unknown | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_id?: string | null
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
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
          version?: number | null
          version_id?: string | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          construction_type?: string | null
          county_id?: string | null
          county_name?: string | null
          created_at?: string | null
          current_value?: number | null
          electrical_year?: number | null
          evacuation_zone?: string | null
          flood_zone?: string | null
          full_address?: string | null
          garage_spaces?: number | null
          hvac_year?: number | null
          id?: string | null
          is_current?: boolean | null
          legal_description?: string | null
          location?: unknown | null
          lot_size_acres?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          occupancy_status?:
            | Database["public"]["Enums"]["occupancy_status"]
            | null
          parcel_id?: string | null
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
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
          version?: number | null
          version_id?: string | null
          wind_zone?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
      recent_login_activity: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string | null
          ip_address: unknown | null
          last_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ai_usage_summary: {
        Row: {
          days_active: number | null
          email: string | null
          last_usage: string | null
          total_calls: number | null
          total_cost: number | null
          total_tokens: number | null
          user_id: string | null
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
      analyze_claude_error_patterns: {
        Args: { time_range_days?: number }
        Returns: {
          pattern_key: string
          error_count: number
          resolved_count: number
          resolution_rate: number
          avg_severity_score: number
          most_common_tools: string[]
        }[]
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
      calculate_and_store_risk_assessment: {
        Args: { p_parcel_id: string }
        Returns: boolean
      }
      capture_signup_data: {
        Args: { p_user_id: string; p_signup_metadata: Json }
        Returns: undefined
      }
      check_ai_cost_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_type: string
          alert_message: string
          current_value: number
        }[]
      }
      check_model_drift: {
        Args: { p_deployment_id: string; p_window_hours?: number }
        Returns: Json
      }
      check_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          issue_count: number
        }[]
      }
      check_user_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      cleanup_expired_consents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_insights_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_geospatial_load: {
        Args: {
          p_load_id: string
          p_records_processed: number
          p_records_failed?: number
          p_status?: string
          p_error_details?: Json
        }
        Returns: boolean
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
      get_active_events_near_parcel: {
        Args: { p_parcel_id: string; p_radius_meters?: number }
        Returns: {
          id: string
          event_type: string
          event_name: string
          status: string
          severity: string
          start_time: string
          distance_meters: number
          geom_geojson: Json
        }[]
      }
      get_aggregated_insights: {
        Args: {
          p_damage_type?: string
          p_county_region?: string
          p_months_back?: number
          p_min_sample_size?: number
        }
        Returns: {
          damage_type: string
          sample_size: number
          avg_settlement_bucket: string
          avg_time_bucket: string
          success_rate: number
          region: string
        }[]
      }
      get_ai_model_costs: {
        Args: Record<PropertyKey, never>
        Returns: {
          provider: string
          model: string
          cost_per_1k_input_tokens: number
          cost_per_1k_output_tokens: number
        }[]
      }
      get_parcel_hazard_zones: {
        Args: { p_parcel_id: string }
        Returns: {
          id: string
          hazard_type: string
          zone_name: string
          category: string
          risk_weight: number
        }[]
      }
      get_parcel_with_geojson: {
        Args: { p_parcel_id: string }
        Returns: {
          parcel_id: string
          county_name: string
          property_address: string
          owner_name: string
          assessed_value: number
          year_built: number
          living_area: number
          land_area: number
          geom_geojson: Json
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_property_at_time: {
        Args: { property_id: string; target_time: string }
        Returns: {
          like: Database["public"]["Views"]["properties"]["Row"]
        }[]
      }
      get_property_changes: {
        Args: { property_id: string }
        Returns: {
          like: Database["public"]["Views"]["properties"]["Row"]
        }[]
      }
      get_relevant_claude_learnings: {
        Args: {
          task_type?: string
          error_type?: string
          framework?: string
          min_confidence?: number
        }
        Returns: {
          learning_id: string
          pattern_name: string
          mistake_pattern: string
          solution_pattern: string
          confidence_score: number
          usage_count: number
          success_rate: number
          relevance_score: number
        }[]
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
      get_user_portfolio_risk_summary: {
        Args: { p_user_id: string }
        Returns: {
          total_properties: number
          avg_composite_risk: number
          high_risk_properties: number
          medium_risk_properties: number
          low_risk_properties: number
          risk_by_category: Json
        }[]
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      log_ai_usage: {
        Args: {
          p_user_id: string
          p_provider: string
          p_model: string
          p_operation_type: string
          p_tokens_used: number
          p_estimated_cost: number
          p_response_time_ms?: number
          p_success?: boolean
          p_error_message?: string
          p_metadata?: Json
        }
        Returns: string
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
      owns_property: {
        Args: { property_id: string }
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
      promote_model_to_production: {
        Args: {
          p_model_version_id: string
          p_deployment_config: Json
          p_traffic_percentage?: number
        }
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
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_learnings: {
        Args:
          | {
              p_task_type?: string
              p_code_language?: string
              p_framework?: string
              p_limit?: number
            }
          | {
              p_task_type?: string
              p_error_type?: string
              p_code_language?: string
              p_framework?: string
            }
        Returns: {
          id: string
          task_type: string
          task_description: string
          error_type: string
          solution: string
          lesson_learned: string
          relevance_score: number
        }[]
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
      start_geospatial_load: {
        Args: {
          p_load_type: string
          p_source_name: string
          p_source_url?: string
          p_source_agency?: string
          p_county?: string
          p_metadata?: Json
        }
        Returns: string
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
      update_claude_learning_success: {
        Args: { learning_id: string; was_successful: boolean }
        Returns: undefined
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
      update_property_simple: {
        Args: { property_id: string; new_data: Json }
        Returns: string
      }
      update_property_temporal: {
        Args: { property_id: string; new_data: Json }
        Returns: string
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
      permission_type:
        | "dashboard_view"
        | "properties_create"
        | "properties_edit"
        | "properties_delete"
        | "claims_create"
        | "claims_edit"
        | "claims_view_all"
        | "ai_damage_analyzer"
        | "ai_policy_chat"
        | "ai_inventory_scanner"
        | "ai_claim_assistant"
        | "ai_document_generator"
        | "ai_communication_helper"
        | "ai_settlement_analyzer"
        | "ai_evidence_organizer"
        | "ai_3d_model_generator"
        | "admin_panel"
        | "admin_users"
        | "admin_analytics"
        | "export_data"
        | "bulk_operations"
        | "advanced_reports"
        | "priority_support"
        | "white_label"
      property_type:
        | "single_family"
        | "condo"
        | "townhouse"
        | "mobile_home"
        | "multi_family"
        | "commercial"
        | "vacant_land"
      user_tier: "free" | "renter" | "essential" | "plus" | "pro"
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
      permission_type: [
        "dashboard_view",
        "properties_create",
        "properties_edit",
        "properties_delete",
        "claims_create",
        "claims_edit",
        "claims_view_all",
        "ai_damage_analyzer",
        "ai_policy_chat",
        "ai_inventory_scanner",
        "ai_claim_assistant",
        "ai_document_generator",
        "ai_communication_helper",
        "ai_settlement_analyzer",
        "ai_evidence_organizer",
        "ai_3d_model_generator",
        "admin_panel",
        "admin_users",
        "admin_analytics",
        "export_data",
        "bulk_operations",
        "advanced_reports",
        "priority_support",
        "white_label",
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
      user_tier: ["free", "renter", "essential", "plus", "pro"],
    },
  },
} as const
