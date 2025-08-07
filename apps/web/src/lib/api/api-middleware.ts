/**
 * @fileMetadata
 * @purpose "API middleware for authentication, rate limiting, and request logging"
 * @dependencies ["@/lib","next"]
 * @owner api-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { APIKeyManager, RateLimitResult } from './api-key-manager'
import { logger } from '@/lib/logger/production-logger'
import { createClient } from '@/lib/supabase/server'

export interface APIContext {
  userId: string
  apiKeyId: string
  permissions: string[]
  userTier: string
}

export interface APIRequestInfo {
  method: string
  endpoint: string
  ipAddress: string
  userAgent: string
  requestSize: number
  requestId: string
}

export class APIMiddleware {
  private apiKeyManager = APIKeyManager.getInstance()

  /**
   * Main middleware function for API requests
   */
  async handleAPIRequest(
    request: NextRequest,
    handler: (req: NextRequest, context: APIContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const requestInfo = this.extractRequestInfo(request)

    try {
      // 1. Authenticate API key
      const authResult = await this.authenticateRequest(request)
      if (!authResult.success) {
        return this.createErrorResponse(
          401,
          'Unauthorized',
          authResult.error || 'Invalid API key',
          requestInfo,
          startTime
        )
      }

      const context = authResult.context!

      // 2. Check rate limits
      const rateLimitResult = await this.checkRateLimit(context, requestInfo.endpoint)
      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(rateLimitResult, requestInfo, startTime, context)
      }

      // 3. Check permissions
      if (!this.checkPermissions(context, requestInfo)) {
        return this.createErrorResponse(
          403,
          'Forbidden',
          'Insufficient permissions for this endpoint',
          requestInfo,
          startTime,
          context
        )
      }

      // 4. Execute the API handler
      const response = await handler(request, context)

      // 5. Log successful request
      await this.logRequest(context, requestInfo, response.status, Date.now() - startTime)

      // 6. Add rate limit headers
      this.addRateLimitHeaders(response, rateLimitResult)

      return response

    } catch (error) {
      logger.error('API middleware error:', error)

      const errorResponse = this.createErrorResponse(
        500,
        'Internal Server Error',
        'An unexpected error occurred',
        requestInfo,
        startTime
      )

      return errorResponse
    }
  }

  /**
   * Authenticate API request using API key
   */
  private async authenticateRequest(request: NextRequest): Promise<{
    success: boolean
    context?: APIContext
    error?: string
  }> {
    try {
      // Extract API key from Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid Authorization header' }
      }

      const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Validate API key
      const validation = await this.apiKeyManager.validateAPIKey(apiKey)
      if (!validation) {
        return { success: false, error: 'Invalid or expired API key' }
      }

      // Get user tier
      const userTier = await this.getUserTier(validation.userId)

      return {
        success: true,
        context: {
          userId: validation.userId,
          apiKeyId: validation.keyId,
          permissions: validation.permissions,
          userTier
        }
      }
    } catch (error) {
      logger.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Check rate limits for the request
   */
  private async checkRateLimit(context: APIContext, endpoint: string) {
    return await this.apiKeyManager.checkRateLimit(
      context.userId,
      context.apiKeyId,
      endpoint,
      context.userTier
    )
  }

  /**
   * Check if user has required permissions for the endpoint
   */
  private checkPermissions(context: APIContext, requestInfo: APIRequestInfo): boolean {
    // If no specific permissions are set, allow all requests
    if (context.permissions.length === 0) {
      return true
    }

    // Define endpoint permission requirements
    const permissionMap: Record<string, string[]> = {
      '/api/properties': ['properties.read', 'properties.write'],
      '/api/claims': ['claims.read', 'claims.write'],
      '/api/field-documentation': ['documentation.read', 'documentation.write'],
      '/api/ai': ['ai.read', 'ai.write'],
    }

    // Check if endpoint requires specific permissions
    const requiredPermissions = this.getRequiredPermissions(requestInfo.endpoint, requestInfo.method, permissionMap)

    // Check if user has required permissions
    return requiredPermissions.every(permission =>
      context.permissions.includes(permission) || context.permissions.includes('*')
    )
  }

  /**
   * Get required permissions for an endpoint and method
   */
  private getRequiredPermissions(endpoint: string, method: string, permissionMap: Record<string, string[]>): string[] {
    // Find matching endpoint pattern
    const matchingPattern = Object.keys(permissionMap).find(pattern =>
      endpoint.startsWith(pattern)
    )

    if (!matchingPattern) {
      return [] // No specific permissions required
    }

    const basePermissions = permissionMap[matchingPattern]

    // For read operations, only require read permission
    if (method === 'GET') {
      return basePermissions.filter(p => p.endsWith('.read'))
    }

    // For write operations, require write permission
    return basePermissions.filter(p => p.endsWith('.write'))
  }

  /**
   * Get user tier from database
   */
  private async getUserTier(userId: string): Promise<string> {
    try {
      const supabase = await createClient()

      const { data } = await supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single()

      return data?.tier || 'free'
    } catch (error) {
      logger.error('Failed to get user tier:', error)
      return 'free'
    }
  }

  /**
   * Extract request information
   */
  private extractRequestInfo(request: NextRequest): APIRequestInfo {
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const contentLength = request.headers.get('content-length')
    const requestSize = contentLength ? parseInt(contentLength, 10) : 0
    const requestId = crypto.randomUUID()

    return {
      method,
      endpoint,
      ipAddress,
      userAgent,
      requestSize,
      requestId
    }
  }

  /**
   * Log API request
   */
  private async logRequest(
    context: APIContext,
    requestInfo: APIRequestInfo,
    statusCode: number,
    responseTimeMs: number,
    errorMessage?: string
  ): Promise<void> {
    await this.apiKeyManager.logAPIUsage(
      context.userId,
      context.apiKeyId,
      requestInfo.endpoint,
      requestInfo.method,
      statusCode,
      responseTimeMs,
      requestInfo.requestSize,
      undefined, // Response size not available here
      requestInfo.ipAddress,
      requestInfo.userAgent,
      errorMessage,
      requestInfo.requestId
    )
  }

  /**
   * Create error response with proper logging
   */
  private createErrorResponse(
    status: number,
    error: string,
    message: string,
    requestInfo: APIRequestInfo,
    startTime: number,
    context?: APIContext
  ): NextResponse {
    const responseTime = Date.now() - startTime

    // Log error if we have context
    if (context) {
      this.logRequest(context, requestInfo, status, responseTime, message)
    }

    const response = NextResponse.json({
      error,
      message,
      timestamp: new Date().toISOString(),
      request_id: requestInfo.requestId
    }, { status })

    // Add CORS headers
    this.addCORSHeaders(response)

    return response
  }

  /**
   * Create rate limit exceeded response
   */
  private createRateLimitResponse(
    rateLimitResult: RateLimitResult,
    requestInfo: APIRequestInfo,
    startTime: number,
    context: APIContext
  ): NextResponse {
    const responseTime = Date.now() - startTime

    // Log rate limit exceeded
    this.logRequest(context, requestInfo, 429, responseTime, 'Rate limit exceeded')

    const response = NextResponse.json({
      error: 'Rate Limit Exceeded',
      message: `You have exceeded your ${rateLimitResult.limit_type} limit of ${rateLimitResult.limit_value} requests`,
      limit_type: rateLimitResult.limit_type,
      limit_value: rateLimitResult.limit_value,
      current_usage: rateLimitResult.current_usage,
      reset_time: rateLimitResult.reset_time,
      timestamp: new Date().toISOString(),
      request_id: requestInfo.requestId
    }, { status: 429 })

    this.addRateLimitHeaders(response, rateLimitResult)
    this.addCORSHeaders(response)

    return response
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(response: NextResponse, rateLimitResult: RateLimitResult): void {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit_value.toString())
    response.headers.set('X-RateLimit-Remaining',
      Math.max(0, rateLimitResult.limit_value - rateLimitResult.current_usage).toString())
    response.headers.set('X-RateLimit-Reset',
      Math.floor(rateLimitResult.reset_time.getTime() / 1000).toString())
  }

  /**
   * Add CORS headers to response
   */
  private addCORSHeaders(response: NextResponse): void {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
}

// Export singleton instance
export const apiMiddleware = new APIMiddleware()

// Helper function for API routes
export function withAPIMiddleware(
  handler: (req: NextRequest, context: APIContext) => Promise<NextResponse>
) {
  return (request: NextRequest) => apiMiddleware.handleAPIRequest(request, handler)
}
