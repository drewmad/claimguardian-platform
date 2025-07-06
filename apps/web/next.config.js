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
  
  transpilePackages: ['@claimguardian/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
}

module.exports = nextConfig