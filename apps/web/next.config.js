/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@claimguardian/ui', '@supabase/auth-helpers-nextjs'],
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
}

module.exports = nextConfig