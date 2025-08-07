/**
 * @fileMetadata
 * @purpose "Server actions for verifying property enrichment data capture"
 * @dependencies ["@/lib"]
 * @owner property-team
 * @status stable
 */

"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

interface EnrichmentVerificationResult {
  propertyId: string;
  hasEnrichment: boolean;
  version?: number;
  capturedFields: {
    location: boolean;
    elevation: boolean;
    visualDocumentation: boolean;
    emergencyServices: boolean;
    riskAssessment: boolean;
    insuranceFactors: boolean;
  };
  missingFields: string[];
  dataQuality: {
    completeness: number;
    hasImages: boolean;
    hasRiskScores: boolean;
  };
  enrichmentDate?: string;
  expirationDate?: string;
  totalApiCost?: number;
}

/**
 * Verify property enrichment data capture
 */
export async function verifyPropertyEnrichment(
  propertyId: string,
): Promise<{
  success: boolean;
  data?: EnrichmentVerificationResult;
  error?: string;
}> {
  try {
    const supabase = await await createClient();

    // Get the current enrichment data
    const { data: enrichment, error } = await supabase
      .from("property_enrichments")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_current", true)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Failed to fetch enrichment data", { propertyId, error });
      return { success: false, error: "Failed to fetch enrichment data" };
    }

    if (!enrichment) {
      return {
        success: true,
        data: {
          propertyId,
          hasEnrichment: false,
          capturedFields: {
            location: false,
            elevation: false,
            visualDocumentation: false,
            emergencyServices: false,
            riskAssessment: false,
            insuranceFactors: false,
          },
          missingFields: ["No enrichment data found"],
          dataQuality: {
            completeness: 0,
            hasImages: false,
            hasRiskScores: false,
          },
        },
      };
    }

    // Check which fields are captured
    const capturedFields = {
      location: !!(
        enrichment.county &&
        enrichment.state_code &&
        enrichment.formatted_address &&
        enrichment.address_components
      ),
      elevation: !!(
        enrichment.elevation_meters !== null &&
        enrichment.flood_zone &&
        enrichment.flood_risk_score
      ),
      visualDocumentation: !!(
        enrichment.street_view_data && enrichment.aerial_view_data
      ),
      emergencyServices: !!(
        enrichment.fire_protection &&
        enrichment.medical_services &&
        enrichment.police_services
      ),
      riskAssessment: !!(
        enrichment.distance_to_coast_meters !== null &&
        enrichment.hurricane_evacuation_zone &&
        enrichment.wind_zone
      ),
      insuranceFactors: !!(
        enrichment.insurance_risk_factors && enrichment.insurance_territory_code
      ),
    };

    // Identify missing fields
    const missingFields: string[] = [];

    // Location fields
    if (!enrichment.plus_code) missingFields.push("Plus Code");
    if (!enrichment.neighborhood) missingFields.push("Neighborhood");
    if (!enrichment.census_tract) missingFields.push("Census Tract");

    // Risk fields
    if (!enrichment.storm_surge_zone) missingFields.push("Storm Surge Zone");

    // Calculate data quality metrics
    const capturedFieldsCount = Object.values(capturedFields).filter(
      (v) => v,
    ).length;
    const completeness = Math.round((capturedFieldsCount / 6) * 100);

    const hasImages = !!(
      enrichment.street_view_data &&
      Object.keys(enrichment.street_view_data).length > 1 // More than just 'available'
    );

    const hasRiskScores = !!(
      enrichment.flood_risk_score &&
      enrichment.insurance_risk_factors?.overall_score
    );

    // Get audit log for additional verification
    const { data: auditLog } = await supabase
      .from("enrichment_audit_log")
      .select("*")
      .eq("property_id", propertyId)
      .order("performed_at", { ascending: false })
      .limit(1)
      .single();

    logger.info("Property enrichment verification completed", {
      propertyId,
      version: enrichment.version,
      completeness,
      hasImages,
      auditLogFound: !!auditLog,
    });

    return {
      success: true,
      data: {
        propertyId,
        hasEnrichment: true,
        version: enrichment.version,
        capturedFields,
        missingFields,
        dataQuality: {
          completeness,
          hasImages,
          hasRiskScores,
        },
        enrichmentDate: enrichment.enriched_at,
        expirationDate: enrichment.expires_at,
        totalApiCost: enrichment.api_costs?.total || 0,
      },
    };
  } catch (error) {
    logger.error(
      "Error verifying property enrichment",
      { propertyId },
      error as Error,
    );
    return { success: false, error: "Failed to verify enrichment data" };
  }
}

/**
 * Get enrichment statistics for all user properties
 */
export async function getUserEnrichmentStats(userId: string) {
  try {
    const supabase = await await createClient();

    // Get all user properties
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", userId);

    if (propError) {
      logger.error("Failed to fetch user properties", { userId,
        error: propError });
      return { success: false, error: "Failed to fetch properties" };
    }

    if (!properties || properties.length === 0) {
      return {
        success: true,
        data: {
          totalProperties: 0,
          enrichedProperties: 0,
          enrichmentPercentage: 0,
          totalApiCost: 0,
          averageCompleteness: 0,
        },
      };
    }

    const propertyIds = properties.map((p) => p.id);

    // Get enrichment data for all properties
    const { data: enrichments, error: enrichError } = await supabase
      .from("property_enrichments")
      .select(
        "property_id, api_costs, flood_risk_score, insurance_risk_factors",
      )
      .in("property_id", propertyIds)
      .eq("is_current", true);

    if (enrichError) {
      logger.error("Failed to fetch enrichment data", { userId,
        error: enrichError });
      return { success: false, error: "Failed to fetch enrichment data" };
    }

    const enrichedCount = enrichments?.length || 0;
    const totalCost =
      enrichments?.reduce((sum, e) => sum + (e.api_costs?.total || 0), 0) || 0;

    // Calculate average completeness based on key fields
    const avgCompleteness =
      enrichments?.reduce((sum, e) => {
        let score = 0;
        if (e.flood_risk_score) score += 25;
        if (e.insurance_risk_factors?.overall_score) score += 25;
        if (e.insurance_risk_factors?.fire_score) score += 25;
        if (e.insurance_risk_factors?.wind_score) score += 25;
        return sum + score;
      }, 0) || 0;

    return {
      success: true,
      data: {
        totalProperties: properties.length,
        enrichedProperties: enrichedCount,
        enrichmentPercentage: Math.round(
          (enrichedCount / properties.length) * 100,
        ),
        totalApiCost: totalCost,
        averageCompleteness:
          enrichedCount > 0 ? Math.round(avgCompleteness / enrichedCount) : 0,
      },
    };
  } catch (error) {
    logger.error("Error getting enrichment stats", { userId }, error as Error);
    return { success: false, error: "Failed to get enrichment statistics" };
  }
}

/**
 * Check for missing or expired enrichments
 */
export async function checkEnrichmentHealth(userId: string) {
  try {
    const supabase = await await createClient();

    // Get all user properties with enrichment status
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        enrichment:property_enrichments(
          version,
          enriched_at,
          expires_at
        )
      `,
      )
      .eq("user_id", userId)
      .eq("property_enrichments.is_current", true);

    if (error) {
      logger.error("Failed to check enrichment health", { userId, error });
      return { success: false, error: "Failed to check enrichment health" };
    }

    const now = new Date();
    const issues: Array<{
      propertyId: string;
      propertyName: string;
      issue: "missing" | "expired" | "expiring_soon";
      expiresAt?: string;
    }> = [];

    data?.forEach((property) => {
      const enrichment = property.enrichment?.[0];

      if (!enrichment) {
        issues.push({
          propertyId: property.id,
          propertyName: property.name,
          issue: "missing",
        });
      } else if (enrichment.expires_at) {
        const expirationDate = new Date(enrichment.expires_at);
        const daysUntilExpiration = Math.floor(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilExpiration < 0) {
          issues.push({
            propertyId: property.id,
            propertyName: property.name,
            issue: "expired",
            expiresAt: enrichment.expires_at,
          });
        } else if (daysUntilExpiration < 30) {
          issues.push({
            propertyId: property.id,
            propertyName: property.name,
            issue: "expiring_soon",
            expiresAt: enrichment.expires_at,
          });
        }
      }
    });

    return {
      success: true,
      data: {
        totalProperties: data?.length || 0,
        healthyProperties: (data?.length || 0) - issues.length,
        issues,
      },
    };
  } catch (error) {
    logger.error(
      "Error checking enrichment health",
      { userId },
      error as Error,
    );
    return { success: false, error: "Failed to check enrichment health" };
  }
}
