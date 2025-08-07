/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Service account Supabase client for background tasks and monitoring"
 * @dependencies ["@supabase/supabase-js"]
 * @status stable
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger/production-logger";

/**
 * Creates a Supabase client for service/background tasks that don't have access to cookies.
 * This client uses the service role key and bypasses RLS policies.
 * 
 * IMPORTANT: Only use this for internal service operations, never expose to client-side code.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // During build time or when service key is not available, return a mock client
  // This prevents build failures when monitoring is imported
  if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
      logger.error("Missing Supabase configuration for service client", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
    }
    
    // Return a mock client that will fail gracefully
    return {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error("Service client not configured") }),
        insert: () => Promise.resolve({ data: null, error: new Error("Service client not configured") }),
        update: () => Promise.resolve({ data: null, error: new Error("Service client not configured") }),
        delete: () => Promise.resolve({ data: null, error: new Error("Service client not configured") }),
      }),
      storage: {
        from: () => ({
          list: () => Promise.resolve({ data: null, error: new Error("Service client not configured") }),
        }),
      },
    } as any;
  }

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    logger.debug("Supabase service client initialized");
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize Supabase service client",
      {},
      error as Error,
    );
    throw error;
  }
}