/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Server-side Supabase client with robust cookie handling and domain isolation"
 * @dependencies ["@supabase/ssr", "next/headers"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import 'server-only';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { authLogger } from "@/lib/logger";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Don't throw at import time - validate when used
  if (!supabaseUrl || !supabaseAnonKey) {
    authLogger.error("Missing Supabase environment variables", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    throw new Error("Supabase configuration missing");
  }

  try {
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, any>) {
          try {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              // Don't set explicit domain - allows cookies to work on previews and production
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            authLogger.debug("Cookie set failed in Server Component", { name, error });
          }
        },
        remove(name: string, options: Record<string, any>) {
          try {
            cookieStore.set(name, '', {
              ...options,
              path: '/',
              maxAge: 0,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            authLogger.debug("Cookie removal failed in Server Component", { name, error });
          }
        },
      },
    });
    
    if (process.env.NODE_ENV === 'development') {
      authLogger.info("Supabase server client initialized");
    }
    return client;
  } catch (error) {
    authLogger.error(
      "Failed to initialize Supabase server client",
      {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      },
      error as Error,
    );
    throw error;
  }
}

// Alias for backward compatibility
export const createServerSupabaseClient = createClient;
