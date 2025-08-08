"use server";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Mock client for when cookies() fails outside request context
const createMockSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
  const anon = process.env.SUPABASE_ANON_KEY || 'mock-anon-key';
  
  return createServerClient(url, anon, {
    cookies: {
      get() { return undefined; },
      set() { /* no-op during build/static generation */ },
      remove() { /* no-op during build/static generation */ },
    },
  });
};

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn("Supabase environment variables missing, using mock client");
    return createMockSupabaseClient();
  }

  try {
    // Call cookies() inside try-catch - only when actually creating the client
    const cookieStore = await cookies();

    return createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          try {
            return cookieStore?.get(name)?.value;
          } catch {
            return undefined; // Null-safe operation
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Next server actions/route handlers can set cookies via this API
            cookieStore?.set({ name, value, ...options });
          } catch {
            // Graceful fallback - no-op if cookies unavailable
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore?.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Graceful fallback - no-op if cookies unavailable
          }
        },
      },
    });
  } catch (error) {
    // Graceful fallback when cookies() fails outside request context
    console.warn("Cookies context not available (likely build-time), using mock client:", error instanceof Error ? error.message : 'Unknown error');
    return createMockSupabaseClient();
  }
}

// Aliases for backward compatibility
export const createClient = createSupabaseServerClient;
export const createServerSupabaseClient = createSupabaseServerClient;
