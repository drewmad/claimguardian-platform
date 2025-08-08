/**
 * Centralized environment configuration
 * Safe for build-time imports - no throwing at module level
 */

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  serviceKey?: string;
}

export function getPublicSupabaseConfig(): SupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getServerSupabaseConfig(): SupabaseConfig {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function validateSupabaseConfig(config: SupabaseConfig): boolean {
  return !!(config.url && config.anonKey);
}

export function validateServerSupabaseConfig(config: SupabaseConfig): boolean {
  return !!(config.url && config.anonKey && config.serviceKey);
}