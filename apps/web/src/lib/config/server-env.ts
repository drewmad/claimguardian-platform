/**
 * @fileMetadata
 * @purpose Secure server-side environment configuration
 * @owner security-team
 * @complexity medium
 * @tags ["security", "environment", "server-side"]
 * @status active
 */

import { z } from 'zod'
import { logger } from "@/lib/logger/production-logger"

// Server-side only environment variables
const serverEnvSchema = z.object({
  // Database
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'Supabase JWT secret is required'),
  
  // AI Services (NEVER expose these client-side)
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  
  // Email Services
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
  RESEND_FROM_EMAIL: z.string().email('Invalid from email'),
  
  // External APIs (server-side proxy only)
  GOOGLE_MAPS_SERVER_API_KEY: z.string().optional(), // Different from client key
  ZILLOW_RAPIDAPI_KEY: z.string().optional(),
  WEATHER_API_KEY: z.string().optional(),
  
  // Security
  ENCRYPTION_SECRET: z.string().min(32, 'Encryption secret must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  
  // Monitoring
  SENTRY_AUTH_TOKEN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

// Client-safe environment variables
const clientEnvSchema = z.object({
  // Public configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Public monitoring (client-side error tracking)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  
  // Public maps (restricted by referrer)
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Environment indicators
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
})

// Validate environment variables
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    logger.error('❌ Invalid server environment variables:')
    parsed.error.errors.forEach(error => {
      logger.error(`  ${error.path.join('.')}: ${error.message}`)
    })
    throw new Error('Invalid server environment configuration')
  }
  
  return parsed.data
}

function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    logger.error('❌ Invalid client environment variables:')
    parsed.error.errors.forEach(error => {
      logger.error(`  ${error.path.join('.')}: ${error.message}`)
    })
    throw new Error('Invalid client environment configuration')
  }
  
  return parsed.data
}

// Export validated environment configs
export const serverEnv = validateServerEnv()
export const clientEnv = validateClientEnv()

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Utility to check if we're running server-side
export const isServer = typeof window === 'undefined'

// Safe environment access with runtime checks
export const getServerEnv = (key: keyof ServerEnv): string => {
  if (!isServer) {
    throw new Error(`Attempted to access server environment variable '${key}' on client side`)
  }
  
  const value = serverEnv[key]
  if (!value) {
    throw new Error(`Server environment variable '${key}' is not defined`)
  }
  
  return value as string
}

export const getClientEnv = (key: keyof ClientEnv): string | undefined => {
  return clientEnv[key] as string | undefined
}

// Development helpers
export const isDevelopment = serverEnv.NODE_ENV === 'development'
export const isProduction = serverEnv.NODE_ENV === 'production'
export const isTest = serverEnv.NODE_ENV === 'test'

// Security headers configuration
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.openai.com https://generativelanguage.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  
  // HSTS (only in production)
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
}

// CORS configuration
export const corsConfig = {
  development: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
  },
  production: {
    origin: ['https://claimguardianai.com', 'https://www.claimguardianai.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
  }
}

// Rate limiting configuration
export const rateLimitConfig = {
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // API endpoints - standard limits
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File uploads - very strict
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: { error: 'Upload limit exceeded, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }
}

// Environment validation on import
if (isServer) {
  // Ensure critical server environment variables are present
  const criticalVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'OPENAI_API_KEY',
    'RESEND_API_KEY'
  ] as const

  const missing = criticalVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`)
  }
}