/** @type {import('next').NextConfig} */

const SUPABASE_CONNECT_SRCS = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://api.openai.com",
  "https://generativelanguage.googleapis.com",
  "https://*.google-analytics.com",
  "https://*.googleapis.com",
  "https://maps.googleapis.com",
  "https://maps.google.com",
  "https://maps.gstatic.com",
  // Allow Mapbox (CSP reports show it's being blocked from /dashboard):
  "https://api.mapbox.com",
  "https://events.mapbox.com",
];

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.google.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com;
  img-src 'self' data: blob: https: http://localhost:*;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src ${SUPABASE_CONNECT_SRCS.join(' ')};
  media-src 'self' blob: data:;
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  worker-src 'self' blob:;
  manifest-src 'self';
  frame-src 'self' https://www.google.com https://maps.google.com;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  transpilePackages: [
    '@claimguardian/db',
    '@claimguardian/ui',
    '@claimguardian/utils',
    '@claimguardian/ai-services',
    '@claimguardian/monitoring',
    '@claimguardian/realtime'
  ],

  experimental: {
    typedRoutes: true
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" }
        ],
      },
      // CSP report endpoint
      {
        source: "/api/csp-report",
        headers: [
          { key: "Content-Type", value: "application/csp-report" }
        ],
      },
    ];
  },
};

export default nextConfig;