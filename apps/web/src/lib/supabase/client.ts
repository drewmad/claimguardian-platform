/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Browser-side Supabase client with error handling and environment validation"
 * @dependencies ["@claimguardian/db", "react"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { createBrowserSupabaseClient } from "@claimguardian/db";
import { useMemo } from "react";

import { authLogger } from "@/lib/logger";

let browserClient: ReturnType<typeof createBrowserSupabaseClient> | undefined;

export function createClient() {
  if (!browserClient) {
    // Validate environment variables before creating client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error("Missing Supabase environment variables");
      authLogger.error("Supabase configuration missing", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        location: "browser client"
      });
      throw error;
    }

    try {
      browserClient = createBrowserSupabaseClient();
      if (process.env.NODE_ENV === "development") {
        authLogger.info("Supabase browser client initialized (singleton)");
      }
    } catch (error) {
      authLogger.error(
        "Failed to initialize Supabase browser client",
        {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
        },
        error as Error,
      );
      // Re-throw to prevent silent failures
      throw error;
    }
  } else {
    // Reusing existing client to prevent multiple auth listeners
    if (
      process.env.NODE_ENV === "development" &&
      process.env.VERBOSE_LOGS === "true"
    ) {
      authLogger.debug("Reusing existing Supabase browser client");
    }
  }
  return browserClient;
}

export function useSupabase() {
  const supabase = useMemo(() => createClient(), []);
  return { supabase };
}
