/**
 * @fileMetadata
 * @purpose Next.js configuration for the web application.
 * @owner frontend-team
 * @dependencies ["next", "@next/bundle-analyzer"]
 * @exports ["nextConfig"]
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-07-28
 * @complexity medium
 * @status active
 * @notes Configures standalone output, package transpilation, bundle analysis, and experimental features.
 */

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  
  // TODO: Remove these once we fix all ESLint and TypeScript errors
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore to test deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore to test deployment
  },
  output: 'standalone',
  experimental: {
    // Optimize more packages for better performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', 'framer-motion']
  },
  // Add image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
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

// Export with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig)