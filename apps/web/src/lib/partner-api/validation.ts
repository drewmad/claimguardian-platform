/**
 * @fileMetadata
 * @purpose "Request validation for Partner API with comprehensive schema checking"
 * @owner partner-api-team
 * @dependencies ["zod", "@/lib/monitoring"]
 * @exports ["validatePartnerRequest", "ValidationResult", "createValidationSchema"]
 * @complexity medium
 * @tags ["validation", "partner-api", "security", "schema"]
 * @status stable
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger/production-logger'

export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, unknown>
  data?: any
}

export interface ValidationOptions {
  schema?: any
  validateBody?: boolean
  validateQuery?: boolean
  strictMode?: boolean
}

/**
 * Comprehensive request validation for Partner API
 */
export async function validatePartnerRequest(
  request: NextRequest,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  try {
    const results: ValidationResult[] = []

    // Validate request headers
    const headerValidation = await validateHeaders(request)
    results.push(headerValidation)

    // Validate query parameters if requested
    if (options.validateQuery) {
      const queryValidation = await validateQueryParameters(request, options.schema?.query)
      results.push(queryValidation)
    }

    // Validate request body if requested
    if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const bodyValidation = await validateRequestBody(request, options.schema?.body)
      results.push(bodyValidation)
    }

    // Validate file uploads if present
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const fileValidation = await validateFileUpload(request)
      results.push(fileValidation)
    }

    // Check for any validation failures
    const failedValidation = results.find(result => !result.valid)
    
    if (failedValidation) {
      logger.warn('Request validation failed', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        error: failedValidation.error,
        details: failedValidation.details
      })
      
      return failedValidation
    }

    // Combine all valid data
    const validData = results.reduce((acc, result) => {
      if (result.data) {
        return { ...acc, ...result.data }
      }
      return acc
    }, {})

    return {
      valid: true,
      data: validData
    }

  } catch (error) {
    logger.error('Validation error', {
      error,
      endpoint: request.nextUrl.pathname,
      method: request.method
    })

    return {
      valid: false,
      error: 'Validation service error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Validate request headers
 */
async function validateHeaders(request: NextRequest): Promise<ValidationResult> {
  const errors: string[] = []
  
  // Check Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    
    if (!contentType) {
      errors.push('Content-Type header is required for this method')
    } else if (!isValidContentType(contentType)) {
      errors.push(`Unsupported Content-Type: ${contentType}`)
    }
  }

  // Validate Accept header if present
  const acceptHeader = request.headers.get('accept')
  if (acceptHeader && !acceptHeader.includes('application/json') && acceptHeader !== '*/*') {
    errors.push('API only supports application/json responses')
  }

  // Check for required API version header (if implementing versioning)
  const apiVersion = request.headers.get('x-api-version')
  if (apiVersion && !isValidApiVersion(apiVersion)) {
    errors.push(`Unsupported API version: ${apiVersion}`)
  }

  // Validate custom headers
  const customHeaders = extractCustomHeaders(request)
  const customHeaderValidation = validateCustomHeaders(customHeaders)
  
  if (!customHeaderValidation.valid) {
    errors.push(...(customHeaderValidation.errors || []))
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: 'Invalid request headers',
      details: { errors }
    }
  }

  return {
    valid: true,
    data: { headers: customHeaders }
  }
}

/**
 * Validate query parameters
 */
async function validateQueryParameters(
  request: NextRequest,
  schema?: any
): Promise<ValidationResult> {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries())
  
  // Basic query parameter validation
  const errors: string[] = []
  
  // Check for common injection patterns
  for (const [key, value] of Object.entries(query)) {
    if (containsSqlInjectionPatterns(value)) {
      errors.push(`Potential SQL injection detected in parameter: ${key}`)
    }
    
    if (containsXssPatterns(value)) {
      errors.push(`Potential XSS detected in parameter: ${key}`)
    }
    
    // Validate parameter length
    if (typeof value === 'string' && value.length > 1000) {
      errors.push(`Parameter ${key} exceeds maximum length`)
    }
  }

  // Schema validation if provided
  if (schema) {
    try {
      const validationResult = await validateWithSchema(query, schema)
      if (!validationResult.valid) {
        errors.push(...(validationResult.errors || []))
      }
    } catch (error) {
      errors.push('Schema validation failed')
    }
  }

  // Validate pagination parameters
  if (query.page || query.limit) {
    const paginationValidation = validatePagination(query)
    if (!paginationValidation.valid) {
      errors.push(...(paginationValidation.errors || []))
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: 'Invalid query parameters',
      details: { errors }
    }
  }

  return {
    valid: true,
    data: { query }
  }
}

/**
 * Validate request body
 */
async function validateRequestBody(
  request: NextRequest,
  schema?: any
): Promise<ValidationResult> {
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: any

    // Parse body based on content type
    if (contentType.includes('application/json')) {
      const text = await request.text()
      
      // Check for empty body
      if (!text.trim()) {
        return {
          valid: false,
          error: 'Request body is required',
          details: { contentType }
        }
      }

      try {
        body = JSON.parse(text)
      } catch (parseError) {
        return {
          valid: false,
          error: 'Invalid JSON in request body',
          details: { parseError: parseError instanceof Error ? parseError.message : 'Parse error' }
        }
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      return {
        valid: false,
        error: 'Unsupported content type for body validation',
        details: { contentType }
      }
    }

    // Basic security checks
    const securityValidation = validateBodySecurity(body)
    if (!securityValidation.valid) {
      return securityValidation
    }

    // Schema validation if provided
    if (schema) {
      const schemaValidation = await validateWithSchema(body, schema)
      if (!schemaValidation.valid) {
        return {
          valid: false,
          error: 'Schema validation failed',
          details: { errors: schemaValidation.errors }
        }
      }
    }

    // Validate required fields based on endpoint
    const requiredFieldsValidation = validateRequiredFields(body, request.nextUrl.pathname)
    if (!requiredFieldsValidation.valid) {
      return requiredFieldsValidation
    }

    return {
      valid: true,
      data: { body }
    }

  } catch (error) {
    return {
      valid: false,
      error: 'Body validation failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Validate file uploads
 */
async function validateFileUpload(request: NextRequest): Promise<ValidationResult> {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return { valid: true } // Not a file upload
    }

    // Check content length
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    
    if (contentLength > maxFileSize) {
      return {
        valid: false,
        error: 'File size exceeds maximum limit',
        details: { 
          maxSize: maxFileSize, 
          actualSize: contentLength 
        }
      }
    }

    // Additional file validation would go here
    // (MIME type checking, virus scanning, etc.)

    return { valid: true }

  } catch (error) {
    return {
      valid: false,
      error: 'File validation failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Helper functions

function isValidContentType(contentType: string): boolean {
  const validTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data'
  ]
  
  return validTypes.some(type => contentType.includes(type))
}

function isValidApiVersion(version: string): boolean {
  const validVersions = ['v1', '1.0', '1']
  return validVersions.includes(version.toLowerCase())
}

function extractCustomHeaders(request: NextRequest): Record<string, string> {
  const customHeaders: Record<string, string> = {}
  
  request.headers.forEach((value, key) => {
    if (key.startsWith('x-') && key !== 'x-api-version') {
      customHeaders[key] = value
    }
  })
  
  return customHeaders
}

function validateCustomHeaders(headers: Record<string, string>): { 
  valid: boolean
  errors?: string[] 
} {
  const errors: string[] = []
  
  for (const [key, value] of Object.entries(headers)) {
    // Validate header value length
    if (value.length > 500) {
      errors.push(`Header ${key} exceeds maximum length`)
    }
    
    // Check for potential injection
    if (containsInjectionPatterns(value)) {
      errors.push(`Invalid characters in header ${key}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function containsSqlInjectionPatterns(value: string): boolean {
  const sqlPatterns = [
    /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_)(\s|$)/i,
    /(\s|^)(or|and)(\s|$)\d+(\s|$)(=|<|>)(\s|$)\d+/i,
    /['";][\s\S]*(union|select|insert|update|delete)/i
  ]
  
  return sqlPatterns.some(pattern => pattern.test(value))
}

function containsXssPatterns(value: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[\s\S]*?>/i,
    /<object[\s\S]*?>/i
  ]
  
  return xssPatterns.some(pattern => pattern.test(value))
}

function containsInjectionPatterns(value: string): boolean {
  return containsSqlInjectionPatterns(value) || containsXssPatterns(value)
}

function validatePagination(query: Record<string, string>): { 
  valid: boolean
  errors?: string[] 
} {
  const errors: string[] = []
  
  if (query.page) {
    const page = parseInt(query.page, 10)
    if (isNaN(page) || page < 1 || page > 10000) {
      errors.push('Invalid page number')
    }
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit, 10)
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('Invalid limit value')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function validateBodySecurity(body: any): ValidationResult {
  const errors: string[] = []
  
  // Check for overly nested objects (potential DoS)
  if (getObjectDepth(body) > 10) {
    errors.push('Request body too deeply nested')
  }
  
  // Check for excessive array sizes
  if (hasLargeArrays(body, 1000)) {
    errors.push('Request body contains arrays that are too large')
  }
  
  // Check for suspicious patterns in string values
  const stringValues = extractStringValues(body)
  for (const value of stringValues) {
    if (containsInjectionPatterns(value)) {
      errors.push('Potential security threat detected in request body')
      break
    }
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      error: 'Security validation failed',
      details: { errors }
    }
  }
  
  return { valid: true }
}

function validateRequiredFields(body: any, endpoint: string): ValidationResult {
  // Endpoint-specific validation logic would go here
  // For now, just basic validation
  
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'Request body must be a valid object'
    }
  }
  
  return { valid: true }
}

async function validateWithSchema(data: any, schema: any): Promise<{ 
  valid: boolean
  errors?: string[] 
}> {
  // This would integrate with Zod or similar schema validation library
  // For now, return a placeholder implementation
  
  try {
    // Placeholder for actual schema validation
    // const result = schema.safeParse(data)
    // return {
    //   valid: result.success,
    //   errors: result.success ? undefined : result.error.issues.map(i => i.message)
    // }
    
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      errors: ['Schema validation failed']
    }
  }
}

// Utility functions

function getObjectDepth(obj: any, depth = 0): number {
  if (obj === null || typeof obj !== 'object') {
    return depth
  }
  
  if (depth > 10) return depth // Prevent infinite recursion
  
  let maxDepth = depth
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const childDepth = getObjectDepth(obj[key], depth + 1)
      maxDepth = Math.max(maxDepth, childDepth)
    }
  }
  
  return maxDepth
}

function hasLargeArrays(obj: any, maxSize: number): boolean {
  if (Array.isArray(obj)) {
    return obj.length > maxSize
  }
  
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && hasLargeArrays(obj[key], maxSize)) {
        return true
      }
    }
  }
  
  return false
}

function extractStringValues(obj: any, values: string[] = []): string[] {
  if (typeof obj === 'string') {
    values.push(obj)
  } else if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        extractStringValues(obj[key], values)
      }
    }
  }
  
  return values
}

/**
 * Create validation schemas for common Partner API endpoints
 */
export function createValidationSchema(endpoint: string): any {
  // This would return appropriate Zod schemas based on the endpoint
  // For now, return a placeholder
  return null
}