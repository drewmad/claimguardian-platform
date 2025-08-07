/**
 * @fileMetadata
 * @purpose "Supabase client helpers for consistent async/await patterns"
 * @owner backend-team
 * @dependencies ["@supabase/supabase-js", "@/lib/supabase/server"]
 * @exports ["getServerClient", "SupabaseService"]
 * @status stable
 */

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get a server-side Supabase client with proper async handling
 */
export async function getServerClient(): Promise<SupabaseClient> {
  return await createClient();
}

/**
 * Base class for services that need Supabase client access
 * Handles the async client creation pattern consistently
 */
export abstract class SupabaseService {
  protected async getSupabaseClient(): Promise<SupabaseClient> {
    return await getServerClient();
  }
}
