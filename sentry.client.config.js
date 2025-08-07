const { withSentryConfig } = require("@sentry/nextjs");

const moduleExports = {
  // Your existing Next.js config
  // For example:
  // output: 'standalone',
  // transpilePackages: ['@claimguardian/ui'],
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // experimental: {
  //   optimizePackageImports: ['lucide-react']
  // }
};

const sentryWebpackPluginOptions = {
  // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a sourcemap and create a release on Sentry when building your application
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true, // Suppresses all logs
  dryRun: process.env.VERCEL_ENV !== "production", // Don't upload sourcemaps in development
};

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
