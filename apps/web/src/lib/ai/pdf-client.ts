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
"use client";

// This module handles PDF.js imports for client-side only usage
export async function getPdfLib() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be used in the browser");
  }

  const pdfjs = await import("pdfjs-dist");

  // Configure worker to use local file
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

  return pdfjs;
}
