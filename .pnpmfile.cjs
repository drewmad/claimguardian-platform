module.exports = {
  hooks: {
    readPackage(pkg) {
      // Force all @types/react to use version 18.3.23
      if (pkg.name === '@types/react') {
        pkg.version = '18.3.23';
      }
      // Force all @types/react-dom to use version 18.3.7
      if (pkg.name === '@types/react-dom') {
        pkg.version = '18.3.7';
      }
      // Also check and update peer dependencies
      if (pkg.peerDependencies) {
        if (pkg.peerDependencies['@types/react']) {
          pkg.peerDependencies['@types/react'] = '18.3.23';
        }
        if (pkg.peerDependencies['@types/react-dom']) {
          pkg.peerDependencies['@types/react-dom'] = '18.3.7';
        }
      }
      return pkg;
    }
  }
};