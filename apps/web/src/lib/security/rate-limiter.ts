/**
 * @fileMetadata
 * @purpose Rate limiting service to prevent abuse and DoS attacks
 * @owner platform-team
 * @complexity medium
 * @tags ["security", "rate-limiting", "ddos-prevention"]
 * @status active
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  private getKey(identifier: string, route: string): string {
    return `${identifier}:${route}`
  }

  private getClientIdentifier(request: Request): string {
    // Try to get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
    
    // For authenticated requests, we could also use user ID
    // This would require extracting the user from the auth token
    
    return ip.trim()
  }

  async isRateLimited(
    request: Request, 
    route: string, 
    config: RateLimitConfig
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const identifier = this.getClientIdentifier(request)
    const key = this.getKey(identifier, route)
    const now = Date.now()
    const windowMs = config.windowMs
    
    const entry = this.store.get(key)
    
    if (!entry || now > entry.resetTime) {
      // New window or first request
      const resetTime = now + windowMs
      this.store.set(key, { count: 1, resetTime })
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetTime
      }
    }
    
    if (entry.count >= config.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }
    
    // Increment counter
    entry.count += 1
    this.store.set(key, entry)
    
    return {
      limited: false,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  // Common rate limit configurations
  static configs = {
    // Very strict for sensitive operations
    strict: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
    
    // Moderate for API calls
    moderate: { maxRequests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
    
    // Lenient for regular operations
    lenient: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    
    // Very lenient for public endpoints
    public: { maxRequests: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter()

// Helper function to create rate limit response
export function createRateLimitResponse(resetTime: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      resetTime: new Date(resetTime).toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': resetTime.toString()
      }
    }
  )
}

// Middleware function for Next.js API routes
export async function withRateLimit(
  request: Request,
  route: string,
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await rateLimiter.isRateLimited(request, route, config)
  
  if (result.limited) {
    return createRateLimitResponse(result.resetTime)
  }
  
  const response = await handler()
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
  
  return response
}

export { RateLimiter }
export type { RateLimitConfig, RateLimitEntry }