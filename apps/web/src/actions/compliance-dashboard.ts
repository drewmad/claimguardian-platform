/**
 * @fileMetadata
 * @purpose "Server actions for compliance dashboard data with service role access"
 * @dependencies ["@/lib"]
 * @owner compliance-team
 * @status stable
 */

"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

interface ComplianceMetrics {
  totalUsers: number;
  consentedUsers: number;
  cookieAcceptance: {
    accepted: number;
    rejected: number;
    custom: number;
  };
  ageVerified: number;
  gdprConsents: number;
  recentSignups: number;
  dataRequests: {
    exports: number;
    deletions: number;
    pending: number;
  };
}

interface ConsentRecord {
  id: string;
  email: string;
  created_at: string;
  gdpr_consent: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  age_verified: boolean;
  marketing_consent: boolean;
}

/**
 * Get compliance dashboard data using service role access
 */
export async function getComplianceDashboardData(): Promise<{
  metrics: ComplianceMetrics | null;
  recentConsents: ConsentRecord[];
  error: string | null;
}> {
  try {
    const supabase = await await createClient();

    // Get total consent records (proxy for users since we have pre-signup consents)
    const { count: totalConsents } = await supabase
      .from("signup_consents")
      .select("*", { count: "exact", head: true });

    // Get consented users (those with GDPR consent)
    const { count: consentedUsers } = await supabase
      .from("signup_consents")
      .select("*", { count: "exact", head: true })
      .eq("gdpr_consent", true);

    // Get age verified count
    const { count: ageVerified } = await supabase
      .from("signup_consents")
      .select("*", { count: "exact", head: true })
      .eq("age_verified", true);

    // Get GDPR consents count
    const { count: gdprConsents } = await supabase
      .from("signup_consents")
      .select("*", { count: "exact", head: true })
      .eq("gdpr_consent", true);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSignups } = await supabase
      .from("signup_consents")
      .select("*", { count: "exact", head: true })
      .gte("consent_timestamp", sevenDaysAgo.toISOString());

    // Get recent consent records for display
    const { data: consents, error: consentsError } = await supabase
      .from("signup_consents")
      .select(
        `
        id,
        email,
        consent_timestamp,
        gdpr_consent,
        data_processing_consent,
        marketing_consent,
        terms_accepted,
        privacy_accepted,
        age_verified
      `,
      )
      .order("consent_timestamp", { ascending: false })
      .limit(20);

    if (consentsError) {
      logger.error("Error fetching consent records", {}, consentsError instanceof Error ? consentsError : new Error(String(consentsError)));
      throw consentsError;
    }

    // Transform data for display
    const transformedConsents: ConsentRecord[] = (consents || []).map(
      (consent) => ({
        id: consent.id,
        email: consent.email || "N/A",
        created_at: consent.consent_timestamp || new Date().toISOString(),
        gdpr_consent: consent.gdpr_consent || false,
        terms_accepted: consent.terms_accepted || false,
        privacy_accepted: consent.privacy_accepted || false,
        age_verified: consent.age_verified || false,
        marketing_consent: consent.marketing_consent || false,
      }),
    );

    const metrics: ComplianceMetrics = {
      totalUsers: totalConsents || 0,
      consentedUsers: consentedUsers || 0,
      cookieAcceptance: {
        accepted: 0, // Would need separate tracking
        rejected: 0,
        custom: 0,
      },
      ageVerified: ageVerified || 0,
      gdprConsents: gdprConsents || 0,
      recentSignups: recentSignups || 0,
      dataRequests: {
        exports: 0, // Would need separate tracking
        deletions: 0,
        pending: 0,
      },
    };

    logger.info("Compliance dashboard data fetched successfully", {
      totalConsents: metrics.totalUsers,
      consentedUsers: metrics.consentedUsers,
      recentSignups: metrics.recentSignups,
    });

    return {
      metrics,
      recentConsents: transformedConsents,
      error: null,
    };
  } catch (error) {
    logger.error(
      "Failed to fetch compliance dashboard data",
      {},
      error as Error,
    );
    return {
      metrics: null,
      recentConsents: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Export consent records for compliance reporting
 */
export async function exportConsentRecords(): Promise<{
  data: ConsentRecord[] | null;
  error: string | null;
}> {
  try {
    const supabase = await await createClient();

    const { data: consents, error } = await supabase
      .from("signup_consents")
      .select(
        `
        id,
        email,
        consent_timestamp,
        gdpr_consent,
        data_processing_consent,
        marketing_consent,
        terms_accepted,
        privacy_accepted,
        age_verified,
        ip_address,
        user_agent
      `,
      )
      .order("consent_timestamp", { ascending: false });

    if (error) {
      logger.error("Error exporting consent records", {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    const transformedConsents: ConsentRecord[] = (consents || []).map(
      (consent) => ({
        id: consent.id,
        email: consent.email || "N/A",
        created_at: consent.consent_timestamp || new Date().toISOString(),
        gdpr_consent: consent.gdpr_consent || false,
        terms_accepted: consent.terms_accepted || false,
        privacy_accepted: consent.privacy_accepted || false,
        age_verified: consent.age_verified || false,
        marketing_consent: consent.marketing_consent || false,
      }),
    );

    logger.info("Consent records exported", {
      count: transformedConsents.length,
    });

    return {
      data: transformedConsents,
      error: null,
    };
  } catch (error) {
    logger.error("Failed to export consent records", {}, error as Error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
