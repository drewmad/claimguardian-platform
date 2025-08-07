/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not set distDir here. Allow default ".next" in CWD (apps/web).
  // distDir: '.next', // leave commented

  // Temporarily you can set this to true if you need to ship while we fix types,
  // but target is false. Keep it false for compliance with your success criteria.
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    // We lint in CI. Vercel builds should not fail on lint to avoid noisy blocking.
    ignoreDuringBuilds: true,
  },

  // Transpile internal workspace packages for Next
  transpilePackages: [
    // Replace this list with the package.json "name" fields of your 8 pkgs
    // **REQUIRED**: fill out with your actual package names
    '@claimguardian/db',
    '@claimguardian/ui',
    '@claimguardian/utils',
    '@claimguardian/ai-services',
    '@claimguardian/monitoring',
    '@claimguardian/realtime'
    // **ADD MORE AS NEEDED** to cover all internal packages used by apps/web
  ],

  experimental: {
    // Turn on Turbopack in dev if you want, but stable builds stick to SWC for prod
    // turbo: { rules: {} } // optional
    typedRoutes: true
  }
};

export default nextConfig;