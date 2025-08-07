/**
 * @fileMetadata
 * @purpose "Service class for managing Google Maps Intelligence data storage and retrieval"
 * @dependencies ["@supabase/supabase-js"]
 * @owner maps-intelligence-team
 * @status stable
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  MapsApiExecution,
  MapsApiType,
  ApiExecutionTrigger,
  ApiExecutionStatus,
  AddressIntelligence,
  WeatherIntelligence,
  AerialIntelligence,
  EnvironmentalIntelligence,
  StreetViewIntelligence,
  SolarIntelligence,
  StaticMapsIntelligence,
  UnifiedIntelligenceCache,
  MapsApiUsageStats,
  PropertyIntelligenceSummary,
  IntelligenceResponse,
  BatchIntelligenceRequest,
  BatchIntelligenceResult,
} from "../types/maps-intelligence";

export class MapsIntelligenceService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // =====================================================
  // API Execution Tracking
  // =====================================================

  async createApiExecution(data: {
    property_id: string;
    api_type: MapsApiType;
    execution_trigger: ApiExecutionTrigger;
    request_payload?: Record<string, unknown>;
    scheduled_at?: string;
  }): Promise<IntelligenceResponse<MapsApiExecution>> {
    const { data: execution, error } = await this.supabase
      .from("maps_api_executions")
      .insert({
        ...data,
        status: "pending" as ApiExecutionStatus,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: execution,
      timestamp: new Date().toISOString(),
    };
  }

  async updateApiExecution(
    executionId: string,
    updates: {
      status?: ApiExecutionStatus;
      response_payload?: Record<string, unknown>;
      error_details?: Record<string, unknown>;
      execution_time_ms?: number;
      api_cost_usd?: number;
      cached_result?: boolean;
      cache_key?: string;
    },
  ): Promise<IntelligenceResponse<MapsApiExecution>> {
    const { data: execution, error } = await this.supabase
      .from("maps_api_executions")
      .update({
        ...updates,
        executed_at:
          updates.status === "completed" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", executionId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: execution,
      timestamp: new Date().toISOString(),
    };
  }

  async getApiExecutions(
    propertyId: string,
    filters?: {
      api_type?: MapsApiType;
      status?: ApiExecutionStatus;
      trigger?: ApiExecutionTrigger;
      limit?: number;
    },
  ): Promise<IntelligenceResponse<MapsApiExecution[]>> {
    let query = this.supabase
      .from("maps_api_executions")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (filters?.api_type) {
      query = query.eq("api_type", filters.api_type);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.trigger) {
      query = query.eq("execution_trigger", filters.trigger);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data: executions, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: executions || [],
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Intelligence Data Storage
  // =====================================================

  async storeAddressIntelligence(
    data: Omit<AddressIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<AddressIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("address_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeWeatherIntelligence(
    data: Omit<WeatherIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<WeatherIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("weather_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeAerialIntelligence(
    data: Omit<AerialIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<AerialIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("aerial_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeEnvironmentalIntelligence(
    data: Omit<EnvironmentalIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<EnvironmentalIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("environmental_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeStreetViewIntelligence(
    data: Omit<StreetViewIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<StreetViewIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("street_view_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeSolarIntelligence(
    data: Omit<SolarIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<SolarIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("solar_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  async storeStaticMapsIntelligence(
    data: Omit<StaticMapsIntelligence, "id" | "created_at" | "updated_at">,
  ): Promise<IntelligenceResponse<StaticMapsIntelligence>> {
    const { data: intelligence, error } = await this.supabase
      .from("static_maps_intelligence")
      .insert(data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Intelligence Data Retrieval
  // =====================================================

  async getAddressIntelligence(
    propertyId: string,
    latest = true,
  ): Promise<
    IntelligenceResponse<AddressIntelligence | AddressIntelligence[]>
  > {
    let query = this.supabase
      .from("address_intelligence")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (latest) {
      query = query.limit(1);
    }

    const { data: intelligence, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: latest ? intelligence?.[0] : intelligence || [],
      timestamp: new Date().toISOString(),
    };
  }

  async getWeatherIntelligence(
    propertyId: string,
    filters?: {
      claim_date?: string;
      date_range?: { start: string; end: string };
      latest?: boolean;
    },
  ): Promise<
    IntelligenceResponse<WeatherIntelligence | WeatherIntelligence[]>
  > {
    let query = this.supabase
      .from("weather_intelligence")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (filters?.claim_date) {
      query = query.eq("claim_date", filters.claim_date);
    }

    if (filters?.date_range) {
      query = query
        .gte("date_range_start", filters.date_range.start)
        .lte("date_range_end", filters.date_range.end);
    }

    if (filters?.latest) {
      query = query.limit(1);
    }

    const { data: intelligence, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: filters?.latest ? intelligence?.[0] : intelligence || [],
      timestamp: new Date().toISOString(),
    };
  }

  async getAerialIntelligence(
    propertyId: string,
    analysisType?: string,
    latest = true,
  ): Promise<IntelligenceResponse<AerialIntelligence | AerialIntelligence[]>> {
    let query = this.supabase
      .from("aerial_intelligence")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (analysisType) {
      query = query.eq("analysis_type", analysisType);
    }

    if (latest) {
      query = query.limit(1);
    }

    const { data: intelligence, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: latest ? intelligence?.[0] : intelligence || [],
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Unified Intelligence Cache
  // =====================================================

  async getCachedIntelligence(
    cacheKey: string,
  ): Promise<IntelligenceResponse<UnifiedIntelligenceCache | null>> {
    const { data: cached, error } = await this.supabase
      .from("unified_intelligence_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Update hit count and last accessed if found
    if (cached) {
      await this.supabase
        .from("unified_intelligence_cache")
        .update({
          hit_count: cached.hit_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", cached.id);
    }

    return {
      success: true,
      data: cached || null,
      cached: !!cached,
      timestamp: new Date().toISOString(),
    };
  }

  async setCachedIntelligence(data: {
    property_id: string;
    cache_key: string;
    cache_type: string;
    apis_included: MapsApiType[];
    unified_data: Record<string, unknown>;
    individual_results?: Record<string, unknown>;
    expires_at: string;
  }): Promise<IntelligenceResponse<UnifiedIntelligenceCache>> {
    const { data: cached, error } = await this.supabase
      .from("unified_intelligence_cache")
      .upsert({
        ...data,
        hit_count: 0,
        last_accessed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: cached,
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Property Intelligence Summary
  // =====================================================

  async getPropertyIntelligenceSummary(
    propertyId: string,
  ): Promise<IntelligenceResponse<PropertyIntelligenceSummary>> {
    const { data: summary, error } = await this.supabase.rpc(
      "get_property_intelligence_summary",
      { p_property_id: propertyId },
    );

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Usage Statistics
  // =====================================================

  async recordApiUsage(data: {
    user_id?: string;
    property_id?: string;
    date: string;
    api_type: MapsApiType;
    call_count?: number;
    cost_usd?: number;
    execution_time_ms?: number;
    cache_hit?: boolean;
    error_occurred?: boolean;
  }): Promise<IntelligenceResponse<MapsApiUsageStats>> {
    // Use upsert to increment existing stats or create new record
    const { data: stats, error } = await this.supabase
      .from("maps_api_usage_stats")
      .upsert(
        {
          user_id: data.user_id,
          property_id: data.property_id,
          date: data.date,
          api_type: data.api_type,
          call_count: data.call_count || 1,
          total_cost_usd: data.cost_usd || 0,
          total_execution_time_ms: data.execution_time_ms || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,property_id,date,api_type",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  async getUsageStats(filters: {
    user_id?: string;
    property_id?: string;
    api_type?: MapsApiType;
    date_range?: { start: string; end: string };
  }): Promise<IntelligenceResponse<MapsApiUsageStats[]>> {
    let query = this.supabase
      .from("maps_api_usage_stats")
      .select("*")
      .order("date", { ascending: false });

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }
    if (filters.property_id) {
      query = query.eq("property_id", filters.property_id);
    }
    if (filters.api_type) {
      query = query.eq("api_type", filters.api_type);
    }
    if (filters.date_range) {
      query = query
        .gte("date", filters.date_range.start)
        .lte("date", filters.date_range.end);
    }

    const { data: stats, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: stats || [],
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Batch Operations
  // =====================================================

  async batchCreateExecutions(
    executions: Array<{
      property_id: string;
      api_type: MapsApiType;
      execution_trigger: ApiExecutionTrigger;
      request_payload?: Record<string, unknown>;
      scheduled_at?: string;
    }>,
  ): Promise<IntelligenceResponse<MapsApiExecution[]>> {
    const { data: created, error } = await this.supabase
      .from("maps_api_executions")
      .insert(
        executions.map((exec) => ({
          ...exec,
          status: "pending" as ApiExecutionStatus,
          created_at: new Date().toISOString(),
        })),
      )
      .select();

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: created || [],
      timestamp: new Date().toISOString(),
    };
  }

  // =====================================================
  // Maintenance Operations
  // =====================================================

  async cleanupExpiredCache(): Promise<
    IntelligenceResponse<{ deleted_count: number }>
  > {
    const { data: result, error } = await this.supabase.rpc(
      "cleanup_expired_intelligence_cache",
    );

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { deleted_count: result },
      timestamp: new Date().toISOString(),
    };
  }

  async performMaintenance(): Promise<
    IntelligenceResponse<{ summary: string }>
  > {
    const { data: result, error } = await this.supabase.rpc(
      "maintenance_cleanup_maps_data",
    );

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { summary: result },
      timestamp: new Date().toISOString(),
    };
  }
}
