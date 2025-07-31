/**
 * @fileMetadata
 * @purpose Bot protection utilities and middleware
 * @owner security-team
 * @status active
 */

import { NextRequest } from 'next/server'

import { logger } from '@/lib/logger'

// Common bot user agents to block
const BOT_USER_AGENTS = [
  // Search engine bots (we want to allow these for SEO)
  // 'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  
  // Malicious bots and scrapers
  'ahrefsbot',
  'semrushbot',
  'dotbot',
  'mj12bot',
  'blexbot',
  'ezooms',
  'majestic',
  'seznambot',
  'exabot',
  'facebookexternalhit',
  'ia_archiver',
  'alexabot',
  'sogoubot',
  'baiduspider',
  'yandexbot',
  
  // Common scraping libraries
  'python-requests',
  'python-urllib',
  'go-http-client',
  'java/',
  'wget',
  'curl',
  'scrapy',
  'httpclient',
  'libwww-perl',
  'mechanize',
  'selenium',
  'phantomjs',
  
  // Security scanners
  'nikto',
  'sqlmap',
  'openvas',
  'nessus',
  'burp',
  'zap',
  
  // Generic bot patterns
  'bot',
  'spider',
  'crawl',
  'scrape',
  'scan'
]

// Suspicious behavior patterns
const SUSPICIOUS_PATTERNS = {
  // Rapid-fire requests (more than X requests in Y seconds)
  rapidRequests: {
    threshold: 10,
    windowMs: 5000
  },
  
  // Missing common headers
  missingHeaders: [
    'accept',
    'accept-language',
    'accept-encoding'
  ],
  
  // Invalid or suspicious header combinations
  suspiciousHeaders: [
    // User agent doesn't match accept headers
    (headers: Headers) => {
      const ua = headers.get('user-agent')?.toLowerCase() || ''
      const accept = headers.get('accept') || ''
      
      // Chrome/Firefox should accept modern formats
      if ((ua.includes('chrome') || ua.includes('firefox')) && !accept.includes('webp')) {
        return true
      }
      
      return false
    }
  ]
}

// IP-based blocking (can be extended with reputation services)
const BLOCKED_IPS: Set<string> = new Set([
  // Add known malicious IPs here
])

// Honeypot field names
export const HONEYPOT_FIELDS = {
  login: 'website_url', // Bots might fill this thinking it's required
  signup: 'confirm_email_address', // Duplicate email field
  contact: 'phone_number_confirm' // Fake confirmation field
}

export interface BotCheckResult {
  isBot: boolean
  confidence: number // 0-100
  reasons: string[]
  shouldBlock: boolean
  shouldChallenge: boolean // For CAPTCHA
}

export class BotProtection {
  private requestCounts: Map<string, { count: number; timestamp: number }> = new Map()
  
  /**
   * Check if a request appears to be from a bot
   */
  checkRequest(request: NextRequest): BotCheckResult {
    const reasons: string[] = []
    let confidence = 0
    
    const headers = request.headers
    const userAgent = headers.get('user-agent')?.toLowerCase() || ''
    const ip = headers.get('x-forwarded-for')?.split(',')[0] || 
               headers.get('x-real-ip') || 
               'unknown'
    
    // Check user agent
    if (this.isBotUserAgent(userAgent)) {
      reasons.push('Detected bot user agent')
      confidence += 50
    }
    
    // Check for missing headers
    const missingHeaders = this.checkMissingHeaders(headers)
    if (missingHeaders.length > 0) {
      reasons.push(`Missing headers: ${missingHeaders.join(', ')}`)
      confidence += missingHeaders.length * 10
    }
    
    // Check request rate
    if (this.checkRequestRate(ip)) {
      reasons.push('Excessive request rate')
      confidence += 30
    }
    
    // Check blocked IPs
    if (BLOCKED_IPS.has(ip)) {
      reasons.push('Blocked IP address')
      confidence = 100
    }
    
    // Check suspicious header patterns
    const suspiciousHeaders = this.checkSuspiciousHeaders(headers)
    if (suspiciousHeaders) {
      reasons.push('Suspicious header combination')
      confidence += 20
    }
    
    // Check for headless browser indicators
    if (this.isHeadlessBrowser(userAgent)) {
      reasons.push('Headless browser detected')
      confidence += 40
    }
    
    // Determine action based on confidence
    const isBot = confidence >= 50
    const shouldBlock = confidence >= 80
    const shouldChallenge = confidence >= 50 && confidence < 80
    
    // Log suspicious activity
    if (isBot) {
      logger.warn('Bot detected', {
        ip,
        userAgent,
        confidence,
        reasons,
        path: request.nextUrl.pathname
      })
    }
    
    return {
      isBot,
      confidence: Math.min(confidence, 100),
      reasons,
      shouldBlock,
      shouldChallenge
    }
  }
  
  /**
   * Check if user agent matches known bot patterns
   */
  private isBotUserAgent(userAgent: string): boolean {
    return BOT_USER_AGENTS.some(pattern => userAgent.includes(pattern))
  }
  
  /**
   * Check for missing common headers
   */
  private checkMissingHeaders(headers: Headers): string[] {
    return SUSPICIOUS_PATTERNS.missingHeaders.filter(
      header => !headers.get(header)
    )
  }
  
  /**
   * Check request rate from IP
   */
  private checkRequestRate(ip: string): boolean {
    const now = Date.now()
    const record = this.requestCounts.get(ip)
    
    if (!record || now - record.timestamp > SUSPICIOUS_PATTERNS.rapidRequests.windowMs) {
      this.requestCounts.set(ip, { count: 1, timestamp: now })
      return false
    }
    
    record.count++
    
    if (record.count > SUSPICIOUS_PATTERNS.rapidRequests.threshold) {
      return true
    }
    
    return false
  }
  
  /**
   * Check for suspicious header combinations
   */
  private checkSuspiciousHeaders(headers: Headers): boolean {
    return SUSPICIOUS_PATTERNS.suspiciousHeaders.some(check => check(headers))
  }
  
  /**
   * Detect headless browsers
   */
  private isHeadlessBrowser(userAgent: string): boolean {
    // Check for headless indicators in user agent
    if (userAgent.includes('headless') || 
        userAgent.includes('phantomjs') ||
        userAgent.includes('selenium')) {
      return true
    }
    
    // Check for missing window properties (would need client-side check)
    // This is a placeholder for more sophisticated checks
    
    return false
  }
  
  /**
   * Validate honeypot fields (should be empty)
   */
  static validateHoneypot(formData: Record<string, any>, formType: keyof typeof HONEYPOT_FIELDS): boolean {
    const honeypotField = HONEYPOT_FIELDS[formType]
    
    if (formData[honeypotField]) {
      logger.warn('Honeypot field filled', {
        formType,
        field: honeypotField,
        value: formData[honeypotField]
      })
      return false
    }
    
    return true
  }
  
  /**
   * Clean up old request records
   */
  cleanup(): void {
    const now = Date.now()
    const expiredTime = now - SUSPICIOUS_PATTERNS.rapidRequests.windowMs * 2
    
    for (const [ip, record] of this.requestCounts.entries()) {
      if (record.timestamp < expiredTime) {
        this.requestCounts.delete(ip)
      }
    }
  }
}

// Singleton instance
export const botProtection = new BotProtection()

// Cleanup old records periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    botProtection.cleanup()
  }, 60000) // Every minute
}

