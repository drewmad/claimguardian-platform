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
 * Debug API route to test legal documents loading
 */

import { NextResponse } from "next/server";

import { legalServiceServer } from "@/lib/legal/legal-service-server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    logger.info("Debug: Testing legal documents API");

    // Test basic connection
    const documents = await legalServiceServer.getActiveLegalDocuments();

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        version: doc.version,
        slug: doc.slug,
        type: doc.type,
        is_active: doc.is_active,
        requires_acceptance: doc.requires_acceptance,
      })),
    });
  } catch (error) {
    logger.error(
      "Debug: Failed to load legal documents",
      {},
      error instanceof Error ? error : new Error(String(error)),
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
