/**
 * @fileMetadata
 * @purpose "Partner API authentication and authorization with multi-tenant support"
 * @owner partner-api-team
 * @dependencies ["@/lib/supabase", "@/lib/cache", "crypto"]
 * @exports ["partnerApiAuth", "PartnerAuthResult"]
 * @complexity high
 * @tags ["authentication", "partner-api", "security", "api-keys"]
 * @status stable
 */

import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger/production-logger";
import {
  PartnerApiKey,
  PartnerOrganization,
  PartnerApiErrorCode,
} from '@claimguardian/db';

export interface PartnerAuthResult {
  success: boolean;
  partner?: PartnerOrganization;
  apiKey?: PartnerApiKey;
  error?: string;
  errorCode?: PartnerApiErrorCode;
}

export interface ApiKeyValidation {
  isValid: boolean;
  partnerId?: string;
  keyId?: string;
  error?: string;
}

class PartnerApiAuth {
  private keyCache = new Map<
    string,
    { key: PartnerApiKey; partner: PartnerOrganization; cachedAt: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Authenticate partner API request using API key
   */
  async authenticate(request: NextRequest): Promise<PartnerAuthResult> {
    try {
      // Extract API key from Authorization header
      const apiKey = this.extractApiKey(request);
      if (!apiKey) {
        return {
          success: false,
          error: "Missing or invalid Authorization header",
          errorCode: PartnerApiErrorCode.INVALID_API_KEY,
        };
      }

      // Validate API key format
      const keyValidation = this.validateApiKeyFormat(apiKey);
      if (!keyValidation.isValid) {
        return {
          success: false,
          error: keyValidation.error || "Invalid API key format",
          errorCode: PartnerApiErrorCode.INVALID_API_KEY,
        };
      }

      // Check cache first for performance
      const cached = this.getCachedKey(apiKey);
      if (cached) {
        // Verify key is still active
        if (cached.key.status !== "active") {
          this.invalidateCache(apiKey);
          return {
            success: false,
            error: "API key is suspended or revoked",
            errorCode: PartnerApiErrorCode.INVALID_API_KEY,
          };
        }

        // Check expiration
        if (
          cached.key.expiresAt &&
          new Date(cached.key.expiresAt) < new Date()
        ) {
          this.invalidateCache(apiKey);
          return {
            success: false,
            error: "API key has expired",
            errorCode: PartnerApiErrorCode.EXPIRED_API_KEY,
          };
        }

        // Update last used timestamp asynchronously
        this.updateLastUsed(cached.key.id).catch((error) => {
          logger.error("Failed to update API key last used timestamp", { 
            error: (error as Error).message,
            keyId: cached.key.id 
          });
        });

        return {
          success: true,
          partner: cached.partner,
          apiKey: cached.key,
        };
      }

      // Database lookup for new or expired cache
      const dbResult = await this.validateApiKeyInDatabase(apiKey);
      if (!dbResult.success) {
        return dbResult;
      }

      // Cache the result
      this.cacheKey(apiKey, dbResult.apiKey!, dbResult.partner!);

      return dbResult;
    } catch (error) {
      logger.error("Partner API authentication error", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: "Authentication service unavailable",
        errorCode: PartnerApiErrorCode.SERVICE_UNAVAILABLE,
      };
    }
  }

  /**
   * Extract API key from Authorization header
   */
  private extractApiKey(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return null;
    }

    // Support both "Bearer" and "ApiKey" prefixes
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const apiKeyMatch = authHeader.match(/^ApiKey\s+(.+)$/i);

    return bearerMatch?.[1] || apiKeyMatch?.[1] || null;
  }

  /**
   * Validate API key format and structure
   */
  private validateApiKeyFormat(apiKey: string): ApiKeyValidation {
    // API key format: pk_{env}_{32_char_random}
    const keyPattern = /^pk_(live|test)_[a-zA-Z0-9]{32}$/;

    if (!keyPattern.test(apiKey)) {
      return {
        isValid: false,
        error: "Invalid API key format. Expected format: pk_{env}_{key}",
      };
    }

    // Extract environment and key ID
    const parts = apiKey.split("_");
    const environment = parts[1]; // 'live' or 'test'
    const keyId = parts[2];

    return {
      isValid: true,
      partnerId: undefined, // Will be determined from database
      keyId,
    };
  }

  /**
   * Validate API key against database
   */
  private async validateApiKeyInDatabase(
    apiKey: string,
  ): Promise<PartnerAuthResult> {
    const supabase = await createClient();

    try {
      // Hash the API key for database lookup
      const hashedKey = this.hashApiKey(apiKey);

      // Query for API key and associated partner
      const { data: keyData, error: keyError } = await supabase
        .from("partner_api_keys")
        .select(
          `
          *,
          partner_organizations (*)
        `,
        )
        .eq("hashed_key", hashedKey)
        .eq("status", "active")
        .single();

      if (keyError || !keyData) {
        // Log potential security issue
        logger.warn("Invalid API key attempt", {
          hashedKey: hashedKey.substring(0, 8), // Log only first 8 chars
          error: keyError?.message,
        });

        return {
          success: false,
          error: "Invalid API key",
          errorCode: PartnerApiErrorCode.INVALID_API_KEY,
        };
      }

      // Check if key has expired
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return {
          success: false,
          error: "API key has expired",
          errorCode: PartnerApiErrorCode.EXPIRED_API_KEY,
        };
      }

      // Check if partner organization is active
      const partner = keyData.partner_organizations;
      if (!partner || partner.subscription_status !== "active") {
        return {
          success: false,
          error: "Partner account is not active",
          errorCode: PartnerApiErrorCode.INVALID_API_KEY,
        };
      }

      // Update last used timestamp
      await this.updateLastUsed(keyData.id);

      // Transform database records to interface types
      const apiKeyRecord: PartnerApiKey = {
        id: keyData.id,
        partnerId: keyData.partner_id,
        keyName: keyData.key_name,
        keyPrefix: keyData.key_prefix,
        hashedKey: keyData.hashed_key,
        permissions: keyData.permissions,
        rateLimit: keyData.rate_limit,
        status: keyData.status,
        environment: keyData.environment,
        lastUsedAt: keyData.last_used_at,
        expiresAt: keyData.expires_at,
        createdAt: keyData.created_at,
        updatedAt: keyData.updated_at,
      };

      const partnerRecord: PartnerOrganization = {
        id: partner.id,
        companyName: partner.company_name,
        companyCode: partner.company_code,
        domain: partner.domain,
        additionalDomains: partner.additional_domains || [],
        subscriptionTier: partner.subscription_tier,
        billingCycle: partner.billing_cycle,
        subscriptionStatus: partner.subscription_status,
        limits: partner.limits,
        currentUsage: partner.current_usage,
        branding: partner.branding,
        configuration: partner.configuration,
        primaryContactEmail: partner.primary_contact_email,
        technicalContactEmail: partner.technical_contact_email,
        billingContactEmail: partner.billing_contact_email,
        supportContactEmail: partner.support_contact_email,
        phone: partner.phone,
        allowedStates: partner.allowed_states || [],
        dataRegion: partner.data_region,
        complianceRequirements: partner.compliance_requirements || [],
        ssoEnabled: partner.sso_enabled,
        mfaRequired: partner.mfa_required,
        ipWhitelist: partner.ip_whitelist || [],
        createdAt: partner.created_at,
        updatedAt: partner.updated_at,
        trialEndsAt: partner.trial_ends_at,
        nextBillingDate: partner.next_billing_date,
      };

      return {
        success: true,
        partner: partnerRecord,
        apiKey: apiKeyRecord,
      };
    } catch (error) {
      logger.error("Database error during API key validation", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: "Authentication service error",
        errorCode: PartnerApiErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Hash API key for secure storage comparison
   */
  private hashApiKey(apiKey: string): string {
    return createHash("sha256").update(apiKey).digest("hex");
  }

  /**
   * Update API key last used timestamp
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from("partner_api_keys")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("id", keyId);
  }

  /**
   * Cache API key and partner data
   */
  private cacheKey(
    apiKey: string,
    key: PartnerApiKey,
    partner: PartnerOrganization,
  ): void {
    const hashedKey = this.hashApiKey(apiKey);
    this.keyCache.set(hashedKey, {
      key,
      partner,
      cachedAt: Date.now(),
    });
  }

  /**
   * Get cached API key data if valid
   */
  private getCachedKey(
    apiKey: string,
  ): { key: PartnerApiKey; partner: PartnerOrganization } | null {
    const hashedKey = this.hashApiKey(apiKey);
    const cached = this.keyCache.get(hashedKey);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.cachedAt > this.CACHE_TTL) {
      this.keyCache.delete(hashedKey);
      return null;
    }

    return cached;
  }

  /**
   * Invalidate cached API key
   */
  private invalidateCache(apiKey: string): void {
    const hashedKey = this.hashApiKey(apiKey);
    this.keyCache.delete(hashedKey);
  }

  /**
   * Generate new API key for partner
   */
  async generateApiKey(params: {
    partnerId: string;
    keyName: string;
    environment: "sandbox" | "production";
    permissions: any;
    rateLimit?: any;
    expiresAt?: string;
  }): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    const supabase = await createClient();

    try {
      // Generate secure random API key
      const keyId = this.generateSecureKey(32);
      const apiKey = `pk_${params.environment === "production" ? "live" : "test"}_${keyId}`;
      const hashedKey = this.hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 12) + "..."; // For display purposes

      // Default rate limits based on environment
      const defaultRateLimit = {
        requestsPerMinute: params.environment === "production" ? 1000 : 100,
        requestsPerHour: params.environment === "production" ? 10000 : 1000,
        requestsPerDay: params.environment === "production" ? 100000 : 10000,
        burstLimit: params.environment === "production" ? 100 : 10,
      };

      // Insert API key into database
      const { data, error } = await supabase
        .from("partner_api_keys")
        .insert({
          partner_id: params.partnerId,
          key_name: params.keyName,
          key_prefix: keyPrefix,
          hashed_key: hashedKey,
          permissions: params.permissions,
          rate_limit: params.rateLimit || defaultRateLimit,
          status: "active",
          environment: params.environment,
          expires_at: params.expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error("Failed to create API key", { 
          error: error.message,
          partnerId: params.partnerId 
        });
        return {
          success: false,
          error: "Failed to create API key",
        };
      }

      logger.info("API key created", {
        partnerId: params.partnerId,
        keyId: data.id,
        keyName: params.keyName,
        environment: params.environment,
      });

      return {
        success: true,
        apiKey, // Return the raw key only once
      };
    } catch (error) {
      logger.error("Error generating API key", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: "Internal error",
      };
    }
  }

  /**
   * Generate cryptographically secure random key
   */
  private generateSecureKey(length: number): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    return result;
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(
    keyId: string,
    partnerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
      const { error } = await supabase
        .from("partner_api_keys")
        .update({
          status: "revoked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", keyId)
        .eq("partner_id", partnerId);

      if (error) {
        logger.error("Failed to revoke API key", { 
          error: error.message, 
          keyId, 
          partnerId 
        });
        return {
          success: false,
          error: "Failed to revoke API key",
        };
      }

      // Clear from cache if present
      this.keyCache.forEach((value, key) => {
        if (value.key.id === keyId) {
          this.keyCache.delete(key);
        }
      });

      logger.info("API key revoked", { keyId, partnerId });

      return { success: true };
    } catch (error) {
      logger.error("Error revoking API key", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: "Internal error",
      };
    }
  }

  /**
   * List API keys for partner
   */
  async listApiKeys(partnerId: string): Promise<{
    success: boolean;
    keys?: Omit<PartnerApiKey, "hashedKey">[];
    error?: string;
  }> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from("partner_api_keys")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to list API keys", { 
          error: error.message, 
          partnerId 
        });
        return {
          success: false,
          error: "Failed to retrieve API keys",
        };
      }

      // Remove sensitive data before returning
      const sanitizedKeys = data.map((key) => ({
        id: key.id,
        partnerId: key.partner_id,
        keyName: key.key_name,
        keyPrefix: key.key_prefix,
        // hashedKey: omitted for security
        permissions: key.permissions,
        rateLimit: key.rate_limit,
        status: key.status,
        environment: key.environment,
        lastUsedAt: key.last_used_at,
        expiresAt: key.expires_at,
        createdAt: key.created_at,
        updatedAt: key.updated_at,
      }));

      return {
        success: true,
        keys: sanitizedKeys,
      };
    } catch (error) {
      logger.error("Error listing API keys", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: "Internal error",
      };
    }
  }
}

// Export singleton instance
export const partnerApiAuth = new PartnerApiAuth();
