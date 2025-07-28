/**
 * pnpm configuration for approving package build scripts
 * This allows trusted packages to run their postinstall scripts
 */

module.exports = {
  hooks: {
    readPackage(pkg) {
      // Approve build scripts for trusted packages
      const trustedPackages = [
        '@sentry/cli',
        'core-js-pure',
        'esbuild',
        'sharp',
        'unrs-resolver'
      ];

      if (trustedPackages.includes(pkg.name)) {
        pkg.trustedDependencies = true;
      }

      return pkg;
    }
  }
};