/**
 * @fileMetadata
 * @purpose "Check for required environment variables"
 * @dependencies ["@/lib"]
 * @owner frontend-team
 * @complexity low
 * @tags ["utility", "environment", "validation"]
 * @status stable
 */

import { logger } from '@/lib/logger/production-logger'

interface EnvCheckResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * Check if all required environment variables are set
 */
export function checkRequiredEnv(): EnvCheckResult {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const recommended = [
    'NEXT_PUBLIC_SITE_URL',
  ]

  const missing = required.filter(key => !process.env[key])
  const warnings = recommended.filter(key => !process.env[key])

  // Log warnings in development
  if (process.env.NODE_ENV === 'development') {
    if (missing.length > 0) {
      logger.error(`[Environment Check] Missing required variables: ${missing.join(', ')}`)
    }
    if (warnings.length > 0) {
      logger.warn('[Environment Check] Missing recommended variables:', { warnings })
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Get Supabase configuration with validation
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const error = new Error('Supabase configuration missing')
    
    // Enhanced error logging for production
    if (process.env.NODE_ENV === 'production') {
      console.error('[ClaimGuardian Config Error]', {
        hasUrl: !!url,
        hasAnonKey: !!anonKey,
        timestamp: new Date().toISOString()
      })
    }
    
    throw error
  }

  return { url, anonKey }
}