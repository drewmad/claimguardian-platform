/**
 * @fileMetadata
 * @purpose Utility for getting the correct site URL in different environments
 * @owner frontend-team
 * @complexity low
 * @tags ["utility", "url", "environment"]
 * @status active
 */

/**
 * Get the site URL based on the environment
 * Handles both client and server side, development and production
 */
export function getSiteURL(): string {
  // If we're on the client
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // If we have a production URL configured
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // If we have a Vercel URL (for preview deployments)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Default to localhost for development
  return 'http://localhost:3000'
}

/**
 * Get the auth callback URL for a specific path
 */
export function getAuthCallbackURL(path: string): string {
  const baseURL = getSiteURL()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseURL}${normalizedPath}`
}