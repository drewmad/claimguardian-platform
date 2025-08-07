/**
 * @fileMetadata
 * @purpose "Server actions for property data enrichment"
 * @dependencies ["@/lib"]
 * @owner property-team
 * @status stable
 */

"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export interface PropertyEnrichmentResult {
  success: boolean;
  version?: number;
  cost?: number;
  message?: string;
  error?: string;
}

/**
 * Enrich property data using Google APIs
 */
export async function enrichPropertyData({
  propertyId,
  latitude,
  longitude,
  address,
  placeId,
}: {
  propertyId: string;
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}): Promise<PropertyEnrichmentResult> {
  try {
    const supabase = await await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify the user owns this property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();

    if (propertyError || !property) {
      logger.error("Property not found or not owned by user", { propertyId,
        userId: user.id });
      return { success: false, error: "Property not found" };
    }

    // Call the Edge Function using Supabase client
    const { data: result, error: functionError } =
      await supabase.functions.invoke("enrich-property-data", {
        body: {
          propertyId,
          latitude,
          longitude,
          address,
          placeId,
        },
      });

    if (functionError) {
      logger.error("Property enrichment request failed", { propertyId,
        error: functionError });
      return {
        success: false,
        error: `Enrichment failed: ${functionError.message}`,
      };
    }

    if (!result) {
      return {
        success: false,
        error: "No response from enrichment service",
      };
    }

    if (result.success) {
      logger.info("Property enriched successfully", {
        propertyId,
        version: result.version,
        cost: result.cost,
      });

      return {
        success: true,
        version: result.version,
        cost: result.cost,
        message: `Property data enriched successfully (v${result.version})`,
      };
    } else if (result.message === "Property recently enriched") {
      return {
        success: true,
        message: "Property data is already up to date",
      };
    } else {
      return {
        success: false,
        error: result.error || "Unknown error occurred",
      };
    }
  } catch (error) {
    logger.error(
      "Error enriching property data",
      { propertyId },
      error as Error,
    );
    return {
      success: false,
      error: "Failed to enrich property data",
    };
  }
}

/**
 * Get current enrichment status for a property
 */
export async function getPropertyEnrichmentStatus(propertyId: string) {
  try {
    const supabase = await await createClient();

    const { data, error } = await supabase
      .from("property_enrichments")
      .select("version, enriched_at, expires_at, api_costs")
      .eq("property_id", propertyId)
      .eq("is_current", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found is ok
      logger.error("Failed to get enrichment status", { propertyId, error });
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: true,
        enriched: false,
        message: "Property has not been enriched yet",
      };
    }

    const expiresAt = new Date(data.expires_at);
    const isExpired = expiresAt < new Date();
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      success: true,
      enriched: true,
      version: data.version,
      enrichedAt: data.enriched_at,
      expiresAt: data.expires_at,
      isExpired,
      daysUntilExpiry,
      totalCost: data.api_costs?.total || 0,
    };
  } catch (error) {
    logger.error(
      "Error getting enrichment status",
      { propertyId },
      error as Error,
    );
    return { success: false, error: "Failed to get enrichment status" };
  }
}
