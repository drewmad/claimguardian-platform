/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
/**
 * Test endpoint to verify consent functions are working
 * This endpoint tests the complete consent flow without creating a user
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test data
    const testEmail = `test-${Date.now()}@example.com`;
    const testConsents = {
      email: testEmail,
      gdpr_consent: true,
      data_processing_consent: true,
      marketing_consent: true,
      terms_accepted: true,
      privacy_accepted: true,
      age_verified: true,
      ip_address: "127.0.0.1",
      user_agent: "Test Agent",
      device_fingerprint: "test-fingerprint-123",
    };

    logger.info("Testing consent flow with:", testEmail);

    // Step 1: Record signup consent
    const { data: recordResult, error: recordError } = await supabase.rpc(
      "record_signup_consent",
      {
        p_email: testConsents.email,
        p_gdpr_consent: testConsents.gdpr_consent,
        p_ccpa_consent: true,
        p_marketing_consent: testConsents.marketing_consent,
        p_data_processing_consent: testConsents.data_processing_consent,
        p_cookie_consent: true,
        p_terms_accepted: testConsents.terms_accepted,
        p_privacy_accepted: testConsents.privacy_accepted,
        p_age_confirmed: testConsents.age_verified,
        p_ai_tools_consent: true,
        p_ip_address: testConsents.ip_address,
        p_user_agent: testConsents.user_agent,
        p_fingerprint: testConsents.device_fingerprint,
      },
    );

    if (recordError) {
      return NextResponse.json(
        {
          success: false,
          step: "record_signup_consent",
          error: recordError.message,
          details: recordError,
        },
        { status: 500 },
      );
    }

    const consentResult = recordResult?.[0];

    if (!consentResult?.success || !consentResult?.consent_token) {
      return NextResponse.json(
        {
          success: false,
          step: "record_signup_consent",
          error: consentResult?.error_message || "Failed to record consent",
          result: consentResult,
        },
        { status: 400 },
      );
    }

    logger.info("Consent recorded successfully:", consentResult.consent_token);

    // Step 2: Validate the consent token
    const { data: validateResult, error: validateError } = await supabase.rpc(
      "validate_signup_consent",
      {
        p_email: testEmail,
        p_consent_token: consentResult.consent_token,
      },
    );

    if (validateError) {
      return NextResponse.json(
        {
          success: false,
          step: "validate_signup_consent",
          error: validateError.message,
          details: validateError,
          consent_token: consentResult.consent_token,
        },
        { status: 500 },
      );
    }

    const validationResult = validateResult?.[0];

    if (
      !validationResult?.is_valid ||
      !validationResult?.has_required_consents
    ) {
      return NextResponse.json(
        {
          success: false,
          step: "validate_signup_consent",
          error: validationResult?.error_message || "Consent validation failed",
          result: validationResult,
          consent_token: consentResult.consent_token,
        },
        { status: 400 },
      );
    }

    logger.info("Consent validated successfully");

    // Step 3: Test link_consent_to_user (with a fake user ID)
    const fakeUserId = "00000000-0000-0000-0000-000000000000";
    const { data: linkResult, error: linkError } = await supabase.rpc(
      "link_consent_to_user",
      {
        p_consent_token: consentResult.consent_token,
        p_user_id: fakeUserId,
      },
    );

    // This will likely fail due to foreign key constraints, but that's expected
    logger.info("Link consent test result:", { linkResult, linkError });

    // Step 4: Check if all functions exist
    const { data: functions, error: functionsError } = await supabase
      .rpc("query", {
        query: `
        SELECT
          p.proname as function_name,
          pg_catalog.pg_get_function_result(p.oid) as return_type
        FROM pg_catalog.pg_proc p
        WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND p.proname IN (
          'record_signup_consent',
          'validate_signup_consent',
          'link_consent_to_user',
          'update_user_consent_preferences',
          'track_user_consent'
        )
        ORDER BY p.proname;
      `,
      })
      .select();

    return NextResponse.json({
      success: true,
      message: "Consent flow test completed successfully!",
      steps: {
        record_consent: {
          success: true,
          consent_token: consentResult.consent_token,
        },
        validate_consent: {
          success: true,
          is_valid: validationResult.is_valid,
          has_required_consents: validationResult.has_required_consents,
          consent_id: validationResult.consent_id,
        },
        link_consent: {
          attempted: true,
          note: "Expected to fail with fake user ID",
          error: linkError?.message,
        },
      },
      functions_check: functionsError
        ? "Could not verify functions"
        : functions,
      test_email: testEmail,
    });
  } catch (error) {
    logger.error("Test consent flow error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  // Test with custom data
  return NextResponse.json({
    message:
      "Use GET to run the automated test, or implement POST for custom testing",
  });
}
