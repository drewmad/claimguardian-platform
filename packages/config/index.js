/**
 * @fileMetadata
 * @purpose "Shared configuration constants and utilities"
 * @dependencies []
 * @owner platform-team
 * @status stable
 */

// Environment configurations
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
}

// API endpoints
export const API_ENDPOINTS = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

// Feature flags
export const FEATURES = {
  enableAI: true,
  enableFloridaPlatform: true,
  enableDebugMode: process.env.NEXT_PUBLIC_DEBUG === 'true'
}

// Export all configurations
export default {
  ENV,
  API_ENDPOINTS,
  FEATURES
}
