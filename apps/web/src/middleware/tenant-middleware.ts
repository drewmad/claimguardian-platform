/**
 * @fileMetadata
 * @purpose "Tenant-aware middleware for multi-tenant routing and authentication"
 * @dependencies ["@/lib","@supabase/supabase-js","next"]
 * @owner enterprise-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { tenantManager } from '@/lib/multi-tenant/tenant-manager'

interface TenantContext {
  organizationId: string
  organizationCode: string
  domain: string
  subscriptionTier: string
  subscriptionStatus: string
  allowedStates: string[]
  featureFlags: Record<string, boolean>
  customizations?: Record<string, unknown>
}

/**
 * Extract tenant information from request
 */
export async function extractTenantContext(request: NextRequest): Promise<TenantContext | null> {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Extract organization code from subdomain or path
  let organizationCode: string | null = null

  // Method 1: Subdomain-based routing (e.g., demo.claimguardian.ai)
  if (host.includes('.')) {
    const subdomain = host.split('.')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      organizationCode = subdomain
    }
  }

  // Method 2: Path-based routing (e.g., /org/demo-corp)
  if (!organizationCode && pathname.startsWith('/org/')) {
    const pathParts = pathname.split('/')
    if (pathParts[2]) {
      organizationCode = pathParts[2]
    }
  }

  // Method 3: Custom domain routing
  if (!organizationCode) {
    const organization = await tenantManager.getOrganizationByDomain(host)
    if (organization) {
      organizationCode = organization.organizationCode
    }
  }

  // If no tenant context found, return null (public access)
  if (!organizationCode) {
    return null
  }

  // Get organization details
  const organization = await tenantManager.getOrganizationByCode(organizationCode)
  if (!organization) {
    return null
  }

  // Get customizations
  const customizations = await tenantManager.getOrganizationCustomizations(organization.id)

  return {
    organizationId: organization.id,
    organizationCode: organization.organizationCode,
    domain: organization.domain,
    subscriptionTier: organization.subscriptionTier,
    subscriptionStatus: organization.subscriptionStatus,
    allowedStates: organization.allowedStates,
    featureFlags: organization.featureFlags,
    customizations: customizations ? {
      id: customizations.id,
      organizationId: customizations.organizationId,
      theme: customizations.theme,
      logoUrl: customizations.logoUrl,
      faviconUrl: customizations.faviconUrl,
      customCss: customizations.customCss,
      enabledFeatures: customizations.enabledFeatures,
      disabledFeatures: customizations.disabledFeatures,
      featureLimits: customizations.featureLimits,
      claimWorkflow: customizations.claimWorkflow,
      approvalWorkflows: customizations.approvalWorkflows,
      notificationPreferences: customizations.notificationPreferences,
      webhookUrls: customizations.webhookUrls,
      apiKeys: customizations.apiKeys,
      externalIntegrations: customizations.externalIntegrations,
      securityPolicies: customizations.securityPolicies,
      dataExportSettings: customizations.dataExportSettings,
      auditSettings: customizations.auditSettings,
      createdAt: customizations.createdAt,
      updatedAt: customizations.updatedAt,
      createdBy: customizations.createdBy
    } : undefined
  }
}

/**
 * Check if user has access to tenant
 */
export async function checkTenantAccess(
  userId: string,
  tenantContext: TenantContext
): Promise<boolean> {
  try {
    const userOrg = await tenantManager.getUserOrganization(userId)
    return userOrg?.id === tenantContext.organizationId
  } catch (error) {
    console.error('Failed to check tenant access:', error)
    return false
  }
}

/**
 * Apply tenant-specific customizations to response
 */
export function applyCustomizations(
  response: NextResponse,
  tenantContext: TenantContext
): NextResponse {
  // Add tenant information to headers
  response.headers.set('X-Tenant-ID', tenantContext.organizationId)
  response.headers.set('X-Tenant-Code', tenantContext.organizationCode)
  response.headers.set('X-Subscription-Tier', tenantContext.subscriptionTier)
  response.headers.set('X-Subscription-Status', tenantContext.subscriptionStatus)

  // Add feature flags
  response.headers.set('X-Feature-Flags', JSON.stringify(tenantContext.featureFlags))

  // Add customizations for client-side theming
  if (tenantContext.customizations) {
    const theme = (tenantContext.customizations as any)?.theme || {}
    response.headers.set('X-Tenant-Theme', JSON.stringify(theme))

    const logoUrl = (tenantContext.customizations as any)?.logoUrl
    if (logoUrl && typeof logoUrl === 'string') {
      response.headers.set('X-Tenant-Logo', logoUrl)
    }

    const customCss = (tenantContext.customizations as any)?.customCss
    if (customCss && typeof customCss === 'string') {
      response.headers.set('X-Tenant-CSS', customCss)
    }
  }

  return response
}

/**
 * Handle tenant-specific routing
 */
export function handleTenantRouting(
  request: NextRequest,
  tenantContext: TenantContext | null
): NextResponse | null {
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  // Public routes that don't require tenant context
  const publicRoutes = [
    '/api/health',
    '/api/webhooks',
    '/favicon.ico',
    '/_next',
    '/images',
    '/login',
    '/signup',
    '/pricing',
    '/about',
    '/contact',
    '/legal'
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Allow public routes without tenant context
  if (isPublicRoute && !tenantContext) {
    return null // Continue with normal processing
  }

  // If no tenant context and not a public route, redirect to main site
  if (!tenantContext && !isPublicRoute) {
    const url = new URL('https://claimguardian.ai' + pathname)
    if (searchParams.toString()) {
      url.search = searchParams.toString()
    }
    return NextResponse.redirect(url)
  }

  // If we have tenant context, ensure all app routes are tenant-aware
  if (tenantContext) {
    // Check subscription status
    if (tenantContext.subscriptionStatus === 'suspended') {
      const suspendedUrl = new URL(request.url)
      suspendedUrl.pathname = '/suspended'
      return NextResponse.redirect(suspendedUrl)
    }

    if (tenantContext.subscriptionStatus === 'cancelled') {
      const cancelledUrl = new URL(request.url)
      cancelledUrl.pathname = '/cancelled'
      return NextResponse.redirect(cancelledUrl)
    }

    // Handle trial expiration
    if (tenantContext.subscriptionStatus === 'trial') {
      // You would check trial expiration date here
      // For now, we'll allow trial access
    }

    // Feature-based routing restrictions
    const restrictedRoutes: Record<string, string[]> = {
      '/ai-tools/advanced': ['professional', 'enterprise', 'custom'],
      '/analytics/advanced': ['enterprise', 'custom'],
      '/admin': ['enterprise', 'custom'],
      '/integrations': ['professional', 'enterprise', 'custom']
    }

    for (const [route, allowedTiers] of Object.entries(restrictedRoutes)) {
      if (pathname.startsWith(route) && !allowedTiers.includes(tenantContext.subscriptionTier)) {
        const upgradeUrl = new URL(request.url)
        upgradeUrl.pathname = '/upgrade'
        upgradeUrl.searchParams.set('feature', route)
        return NextResponse.redirect(upgradeUrl)
      }
    }

    // Geographic restrictions
    if (pathname.startsWith('/properties/') || pathname.startsWith('/claims/')) {
      // Check if the state is allowed for this organization
      const stateParam = searchParams.get('state')
      if (stateParam && !tenantContext.allowedStates.includes(stateParam.toUpperCase())) {
        const restrictedUrl = new URL(request.url)
        restrictedUrl.pathname = '/restricted'
        restrictedUrl.searchParams.set('state', stateParam)
        return NextResponse.redirect(restrictedUrl)
      }
    }

    // Rewrite URLs to include tenant context if using path-based routing
    if (!pathname.startsWith('/org/') && !request.headers.get('host')?.includes('.')) {
      const rewriteUrl = new URL(request.url)
      rewriteUrl.pathname = `/org/${tenantContext.organizationCode}${pathname}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  return null // Continue with normal processing
}

/**
 * Check feature access for tenant
 */
function checkFeatureAccessInternal(
  feature: string,
  tenantContext: TenantContext
): boolean {
  // Check subscription tier access
  const tierFeatures: Record<string, string[]> = {
    standard: [
      'basic_claims',
      'damage_analysis',
      'document_management',
      'policy_chat'
    ],
    professional: [
      'basic_claims',
      'damage_analysis',
      'document_management',
      'policy_chat',
      'inventory_scanner',
      'ai_damage_analyzer',
      'advanced_reporting'
    ],
    enterprise: [
      'basic_claims',
      'damage_analysis',
      'document_management',
      'policy_chat',
      'inventory_scanner',
      'ai_damage_analyzer',
      'advanced_reporting',
      'predictive_modeling',
      'advanced_analytics',
      'custom_integrations',
      'multi_state_support'
    ],
    custom: ['*'] // All features
  }

  const allowedFeatures = tierFeatures[tenantContext.subscriptionTier] || []

  // Custom tier has access to all features
  if (allowedFeatures.includes('*')) {
    return true
  }

  // Check if feature is in allowed list
  if (allowedFeatures.includes(feature)) {
    return true
  }

  // Check feature flags for overrides
  if (tenantContext.featureFlags[feature] === true) {
    return true
  }

  // Explicitly disabled features
  if (tenantContext.featureFlags[feature] === false) {
    return false
  }

  return false
}

/**
 * Apply rate limiting based on subscription tier
 */
function getRateLimitsInternal(tenantContext: TenantContext): {
  apiRequests: number // per minute
  aiRequests: number  // per hour
  fileUploads: number // per hour
} {
  const limits = {
    standard: {
      apiRequests: 100,
      aiRequests: 50,
      fileUploads: 20
    },
    professional: {
      apiRequests: 500,
      aiRequests: 200,
      fileUploads: 100
    },
    enterprise: {
      apiRequests: 2000,
      aiRequests: 1000,
      fileUploads: 500
    },
    custom: {
      apiRequests: 10000,
      aiRequests: 5000,
      fileUploads: 2000
    }
  }

  return limits[tenantContext.subscriptionTier as keyof typeof limits] || limits.standard
}

/**
 * Generate CSP header with tenant-specific domains
 */
function generateTenantCSPInternal(tenantContext: TenantContext): string {
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ]

  // Add tenant-specific domains
  const tenantDomains = [tenantContext.domain]
  if (tenantContext.customizations) {
    const webhookUrls = (tenantContext.customizations as any)?.webhookUrls
    if (webhookUrls && typeof webhookUrls === 'object') {
      Object.values(webhookUrls).forEach((url: unknown) => {
        if (typeof url === 'string') {
          try {
            const domain = new URL(url).hostname
            tenantDomains.push(domain)
          } catch (error) {
            // Invalid URL, skip
          }
        }
      })
    }
  }

  if (tenantDomains.length > 0) {
    baseCSP.push(`connect-src 'self' https: ${tenantDomains.map(d => `https://${d}`).join(' ')}`)
  }

  return baseCSP.join('; ')
}

/**
 * Main tenant middleware function
 */
export async function tenantMiddleware(request: NextRequest): Promise<NextResponse> {
  // Extract tenant context
  const tenantContext = await extractTenantContext(request)

  // Handle tenant-specific routing
  const routingResponse = handleTenantRouting(request, tenantContext)
  if (routingResponse) {
    return routingResponse
  }

  // Create response
  let response = NextResponse.next()

  // Apply tenant customizations if we have context
  if (tenantContext) {
    response = applyCustomizations(response, tenantContext)

    // Add security headers
    response.headers.set('Content-Security-Policy', generateTenantCSPInternal(tenantContext))
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Add rate limiting headers
    const rateLimits = getRateLimitsInternal(tenantContext)
    response.headers.set('X-RateLimit-API', rateLimits.apiRequests.toString())
    response.headers.set('X-RateLimit-AI', rateLimits.aiRequests.toString())
    response.headers.set('X-RateLimit-Uploads', rateLimits.fileUploads.toString())
  }

  return response
}

// Export utility functions for use in components and API routes
export const checkFeatureAccess = checkFeatureAccessInternal
export const getRateLimits = getRateLimitsInternal
export const generateTenantCSP = generateTenantCSPInternal

export type { TenantContext }
