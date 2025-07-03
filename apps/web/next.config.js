/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@claimguardian/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
}

module.exports = nextConfig