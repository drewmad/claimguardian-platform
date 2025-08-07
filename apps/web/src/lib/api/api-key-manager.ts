/**
 * @fileMetadata
 * @purpose "API key management service with secure generation, validation, and rate limiting"
 * @dependencies ["@/lib","crypto"]
 * @owner api-team
 * @status stable
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger/production-logger";
import crypto from "crypto";

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  expires_at?: Date;
  last_used_at?: Date;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface APIKeyCreationResult {
  key: APIKey;
  plainTextKey: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit_type: string;
  limit_value: number;
  current_usage: number;
  reset_time: Date;
}

export interface APIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time: number;
  most_used_endpoints: Array<{ endpoint: string; count: number }>;
  daily_usage: Array<{ date: string; count: number }>;
}

export class APIKeyManager {
  private static instance: APIKeyManager;

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Generate a new API key for a user
   */
  async generateAPIKey(
    userId: string,
    name: string,
    permissions: string[] = [],
    expiresAt?: Date,
  ): Promise<APIKeyCreationResult> {
    try {
      const supabase = await createClient();

      // Generate secure API key
      const keyBytes = crypto.randomBytes(32);
      const plainTextKey = `cg_${keyBytes.toString("hex")}`;
      const keyHash = crypto
        .createHash("sha256")
        .update(plainTextKey)
        .digest("hex");
      const keyPrefix = plainTextKey.substring(0, 8);

      // Create API key record
      const { data: apiKey, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create API key: ${error.message}`);
      }

      logger.info(`API key created for user ${userId}: ${name}`);

      return {
        key: apiKey,
        plainTextKey,
      };
    } catch (error) {
      logger.error("Failed to generate API key", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Validate an API key and return user information
   */
  async validateAPIKey(
    apiKey: string,
  ): Promise<{ userId: string; keyId: string; permissions: string[] } | null> {
    try {
      const supabase = await createClient();
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

      const { data, error } = await supabase
        .from("api_keys")
        .select("id, user_id, permissions, is_active, expires_at")
        .eq("key_hash", keyHash)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if key is active
      if (!data.is_active) {
        return null;
      }

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Update last used timestamp and usage count
      // First get current usage count, then increment
      const { data: currentData } = await supabase
        .from("api_keys")
        .select("usage_count")
        .eq("id", data.id)
        .single();

      await supabase
        .from("api_keys")
        .update({
          last_used_at: new Date(),
          usage_count: (currentData?.usage_count || 0) + 1,
        })
        .eq("id", data.id);

      return {
        userId: data.user_id,
        keyId: data.id,
        permissions: data.permissions,
      };
    } catch (error) {
      logger.error("Failed to validate API key", error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Check rate limit for a user/API key combination
   */
  async checkRateLimit(
    userId: string,
    apiKeyId: string,
    endpoint: string,
    userTier: string = "free",
  ): Promise<RateLimitResult> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_user_id: userId,
        p_api_key_id: apiKeyId,
        p_endpoint: endpoint,
        p_user_tier: userTier,
      });

      if (error) {
        throw new Error(`Rate limit check failed: ${error.message}`);
      }

      return {
        allowed: data.allowed,
        limit_type: data.limit_type,
        limit_value: data.limit_value,
        current_usage: data.current_usage,
        reset_time: new Date(data.reset_time),
      };
    } catch (error) {
      logger.error("Failed to check rate limit", error instanceof Error ? error : new Error(String(error)));
      // Default to allowing request if rate limit check fails
      return {
        allowed: true,
        limit_type: "daily",
        limit_value: -1,
        current_usage: 0,
        reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }
  }

  /**
   * Log API usage for analytics and monitoring
   */
  async logAPIUsage(
    userId: string,
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs?: number,
    requestSizeBytes?: number,
    responseSizeBytes?: number,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    requestId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.rpc("log_api_usage", {
        p_user_id: userId,
        p_api_key_id: apiKeyId,
        p_endpoint: endpoint,
        p_method: method,
        p_status_code: statusCode,
        p_response_time_ms: responseTimeMs,
        p_request_size_bytes: requestSizeBytes,
        p_response_size_bytes: responseSizeBytes,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: errorMessage,
        p_request_id: requestId,
        p_metadata: metadata || {},
      });
    } catch (error) {
      logger.error("Failed to log API usage", error instanceof Error ? error : new Error(String(error)));
      // Don't throw error for logging failures
    }
  }

  /**
   * Get API usage statistics for a user
   */
  async getUsageStats(
    userId: string,
    days: number = 30,
  ): Promise<APIUsageStats> {
    try {
      const supabase = await createClient();
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get overall stats
      const { data: overallStats } = await supabase
        .from("api_usage_logs")
        .select("status_code, response_time_ms")
        .eq("user_id", userId)
        .gte("created_at", sinceDate.toISOString());

      // Get endpoint usage
      const { data: endpointStats } = await supabase
        .from("api_usage_logs")
        .select("endpoint")
        .eq("user_id", userId)
        .gte("created_at", sinceDate.toISOString());

      // Get daily usage
      const { data: dailyStats } = await supabase
        .from("api_usage_logs")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", sinceDate.toISOString())
        .order("created_at");

      const stats: APIUsageStats = {
        total_requests: overallStats?.length || 0,
        successful_requests:
          overallStats?.filter(
            (s) => s.status_code >= 200 && s.status_code < 400,
          ).length || 0,
        failed_requests:
          overallStats?.filter((s) => s.status_code >= 400).length || 0,
        avg_response_time:
          overallStats && overallStats.length > 0
            ? overallStats.reduce(
                (sum, s) => sum + (s.response_time_ms || 0),
                0,
              ) / overallStats.length
            : 0,
        most_used_endpoints: this.aggregateEndpoints(endpointStats || []),
        daily_usage: this.aggregateDailyUsage(dailyStats || []),
      };

      return stats;
    } catch (error) {
      logger.error("Failed to get usage stats", error instanceof Error ? error : new Error(String(error)));
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time: 0,
        most_used_endpoints: [],
        daily_usage: [],
      };
    }
  }

  /**
   * List API keys for a user
   */
  async listAPIKeys(userId: string): Promise<APIKey[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to list API keys: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Failed to list API keys", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeAPIKey(userId: string, keyId: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false, updated_at: new Date() })
        .eq("id", keyId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to revoke API key: ${error.message}`);
      }

      logger.info(`API key revoked: ${keyId} for user ${userId}`);
    } catch (error) {
      logger.error("Failed to revoke API key", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Update API key permissions
   */
  async updateAPIKeyPermissions(
    userId: string,
    keyId: string,
    permissions: string[],
  ): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("api_keys")
        .update({ permissions, updated_at: new Date() })
        .eq("id", keyId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(
          `Failed to update API key permissions: ${error.message}`,
        );
      }

      logger.info(`API key permissions updated: ${keyId} for user ${userId}`);
    } catch (error) {
      logger.error("Failed to update API key permissions", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Private helper methods

  private aggregateEndpoints(
    endpointData: Array<{ endpoint: string }>,
  ): Array<{ endpoint: string; count: number }> {
    const counts = endpointData.reduce(
      (acc, { endpoint }) => {
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 endpoints
  }

  private aggregateDailyUsage(
    usageData: Array<{ created_at: string }>,
  ): Array<{ date: string; count: number }> {
    const dailyCounts = usageData.reduce(
      (acc, { created_at }) => {
        const date = new Date(created_at).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
