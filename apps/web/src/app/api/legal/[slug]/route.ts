/**
 * @fileMetadata
 * @purpose "API route to fetch individual legal document content by slug"
 * @owner legal-team
 * @dependencies ["next", "@/lib/legal"]
 * @exports ["GET"]
 * @complexity medium
 * @tags ["api", "legal", "document", "content"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";

import { legalServiceServer } from "@/lib/legal/legal-service-server";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Document slug is required" },
        { status: 400 },
      );
    }

    // Get the document by slug from Supabase
    const document = await legalServiceServer.getLegalDocumentBySlug(slug);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // If document has content directly in the database, return it
    if (document.content) {
      // Return as JSON with content
      const response = NextResponse.json({
        data: {
          id: document.id,
          title: document.title,
          content: document.content,
          version: document.version,
          effective_date: document.effective_date,
          slug: document.slug,
        },
      });

      // Cache for 10 minutes since legal documents don't change frequently
      response.headers.set(
        "Cache-Control",
        "public, max-age=600, stale-while-revalidate=120",
      );

      return response;
    }

    // If document has a storage URL, fetch from Supabase Storage
    if (document.storage_url) {
      try {
        const storageResponse = await fetch(document.storage_url);

        if (!storageResponse.ok) {
          throw new Error(`Storage fetch failed: ${storageResponse.status}`);
        }

        const content = await storageResponse.text();

        // Return as JSON with fetched content
        const response = NextResponse.json({
          data: {
            id: document.id,
            title: document.title,
            content: content,
            version: document.version,
            effective_date: document.effective_date,
            slug: document.slug,
          },
        });

        // Cache for 10 minutes
        response.headers.set(
          "Cache-Control",
          "public, max-age=600, stale-while-revalidate=120",
        );

        return response;
      } catch (storageError) {
        logger.error(
          "Failed to fetch document from storage",
          {
            slug,
            documentId: document.id,
            storageUrl: document.storage_url,
          },
          storageError instanceof Error
            ? storageError
            : new Error(String(storageError)),
        );

        return NextResponse.json(
          { error: "Failed to load document content from storage" },
          { status: 500 },
        );
      }
    }

    // No content available
    return NextResponse.json(
      { error: "Document content not available" },
      { status: 404 },
    );
  } catch (error) {
    logger.error(
      "Failed to fetch legal document content",
      { slug: "unknown" },
      error instanceof Error ? error : new Error(String(error)),
    );

    return NextResponse.json(
      { error: "Failed to fetch document content" },
      { status: 500 },
    );
  }
}
