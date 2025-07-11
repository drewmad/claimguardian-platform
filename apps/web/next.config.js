/**
 * @fileMetadata
 * @purpose Next.js configuration for the web application.
 * @owner frontend-team
 * @dependencies ["next"]
 * @exports ["nextConfig"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T22:53:03-04:00
 * @complexity medium
 * @status active
 * @notes Configures standalone output, package transpilation, and experimental features.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            // value: '1; mode=block' // This header is deprecated and can cause issues
            value: '0' // Disable XSS protection in modern browsers, CSP is preferred
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig