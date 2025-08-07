/**
 * Shared Supabase Client for Edge Functions
 * Provides configured Supabase client with service role access
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Create Supabase client with service role access
 * Use this for server-side operations that bypass RLS
 */
export const createServiceClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Create Supabase client with anonymous access
 * Use this for operations that should respect RLS policies
 */
export const createAnonClient = () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!anonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }
  
  return createClient(SUPABASE_URL, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get environment configuration for tile generation
 */
export const getTileConfig = () => {
  return {
    storageConfig: {
      bucket: Deno.env.get('TILE_STORAGE_BUCKET') || 'vector-tiles',
      prefix: Deno.env.get('TILE_STORAGE_PREFIX') || 'v1',
    },
    versionSig: Deno.env.get('MVT_VERSION_SIG') || 'properties|boundaries|risk_zones@v1',
    ttl: {
      default: parseInt(Deno.env.get('MVT_DEFAULT_TTL_SECONDS') || '604800', 10), // 7 days
      active: parseInt(Deno.env.get('MVT_ACTIVE_TTL_SECONDS') || '86400', 10),    // 1 day
    },
    floridaBbox: {
      minLon: parseFloat(Deno.env.get('FLORIDA_BBOX_MIN_LON') || '-87.6349'),
      minLat: parseFloat(Deno.env.get('FLORIDA_BBOX_MIN_LAT') || '24.3963'),
      maxLon: parseFloat(Deno.env.get('FLORIDA_BBOX_MAX_LON') || '-80.0314'),
      maxLat: parseFloat(Deno.env.get('FLORIDA_BBOX_MAX_LAT') || '31.0006'),
    },
  };
};