/**
 * @fileMetadata
 * @purpose "Comprehensive security-focused validation schemas for all critical flows"
 * @dependencies ["zod"]
 * @owner security-team
 * @complexity high
 * @tags ["validation", "security", "schemas", "zod"]
 * @status stable
 */

import { z } from 'zod'

// ========================
// SANITIZATION HELPERS
// ========================
const sanitizeString = (str: string) => str.trim().replace(/<[^>]*>/g, '').substring(0, 1000)
const sanitizeName = (str: string) => str.trim().replace(/[^a-zA-Z\s'-]/g, '').substring(0, 100)
const sanitizeAddress = (str: string) => str.trim().replace(/[<>]/g, '').replace(/\s+/g, ' ').substring(0, 200)

// ========================
// COMMON SCHEMAS
// ========================
export const idSchema = z.string().uuid('Invalid ID format')

export const paginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Enhanced email validation
const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(254, 'Email address too long')
  .toLowerCase()
  .transform(email => email.trim())

// Secure password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')

// Phone validation with sanitization
const phoneSchema = z.string()
  .regex(/^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Please enter a valid phone number')
  .transform(val => val.replace(/\D/g, '')) // Remove non-digits

// Florida-specific ZIP code validation
const floridaZipSchema = z.string()
  .regex(/^3[0-4]\d{3}(-\d{4})?$/, 'Please enter a valid Florida ZIP code')

// Property schemas
export const propertyDataSchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  type: z.enum(['single_family', 'condo', 'townhouse', 'multi_family', 'commercial']),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()),
  square_feet: z.number().int().positive(),
  details: z.object({
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(20),
    lot_size: z.number().int().min(0)
  })
})

export const updatePropertySchema = z.object({
  propertyId: idSchema,
  updates: propertyDataSchema.partial()
})

export const deletePropertySchema = z.object({
  propertyId: idSchema
})

// Document schemas
export const uploadDocumentSchema = z.object({
  propertyId: idSchema,
  file: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB')
  }),
  documentType: z.enum(['policy', 'claim', 'evidence', 'correspondence', 'other']),
  description: z.string().max(500).optional()
})

export const extractionRequestSchema = z.object({
  documentId: idSchema,
  extractionType: z.enum(['policy_data', 'claim_details', 'damage_assessment']),
  apiProvider: z.enum(['gemini', 'openai']).optional()
})

// Policy schemas
export const policyDataSchema = z.object({
  propertyId: idSchema,
  carrier: z.string().min(1).max(100),
  policyNumber: z.string().min(1).max(50),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  coverageAmount: z.number().positive(),
  deductible: z.number().min(0),
  windDeductible: z.union([z.number(), z.string()]).optional(),
  floodDeductible: z.number().optional(),
  premiumAmount: z.number().positive(),
  additionalCoverages: z.array(z.string()).optional()
})

// Claim schemas
export const claimDataSchema = z.object({
  propertyId: idSchema,
  policyId: idSchema,
  claimNumber: z.string().min(1).max(50),
  dateOfLoss: z.string().datetime(),
  damageType: z.enum(['hurricane', 'flood', 'fire', 'theft', 'vandalism', 'other']),
  description: z.string().min(10).max(2000),
  estimatedDamage: z.number().positive().optional(),
  status: z.enum(['draft', 'submitted', 'acknowledged', 'investigating', 'approved', 'denied', 'appeal'])
})

// User schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  address: z.object({
    street: z.string().min(1).max(100),
    city: z.string().min(1).max(50),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
  }).optional()
})

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Export type inference helpers
export type PropertyData = z.infer<typeof propertyDataSchema>
export type PolicyData = z.infer<typeof policyDataSchema>
export type ClaimData = z.infer<typeof claimDataSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type PaginationParams = z.infer<typeof paginationSchema>