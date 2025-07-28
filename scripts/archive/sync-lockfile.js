#!/usr/bin/env node

/**
 * Lockfile synchronization script
 * Ensures pnpm-lock.yaml is always in sync with package.json files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Execute command
const exec = (command, options = {}) => {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) {
      log(`Error executing: ${command}`, 'red');
      throw error;
    }
    return null;
  }
};

// Get hash of all package.json files
const getPackageJsonHash = () => {
  const packageFiles = [
    'package.json',
    'apps/web/package.json',
    'packages/*/package.json'
  ];
  
  let combinedContent = '';
  
  // Root package.json
  if (fs.existsSync('package.json')) {
    combinedContent += fs.readFileSync('package.json', 'utf8');
  }
  
  // Apps
  const appsDir = 'apps';
  if (fs.existsSync(appsDir)) {
    fs.readdirSync(appsDir).forEach(app => {
      const pkgPath = `${appsDir}/${app}/package.json`;
      if (fs.existsSync(pkgPath)) {
        combinedContent += fs.readFileSync(pkgPath, 'utf8');
      }
    });
  }
  
  // Packages
  const packagesDir = 'packages';
  if (fs.existsSync(packagesDir)) {
    fs.readdirSync(packagesDir).forEach(pkg => {
      const pkgPath = `${packagesDir}/${pkg}/package.json`;
      if (fs.existsSync(pkgPath)) {
        combinedContent += fs.readFileSync(pkgPath, 'utf8');
      }
    });
  }
  
  return crypto.createHash('sha256').update(combinedContent).digest('hex');
};

// Check if lockfile needs update
const checkLockfileSync = () => {
  log('🔍 Checking lockfile synchronization...', 'blue');
  
  // Get current package.json hash
  const currentHash = getPackageJsonHash();
  
  // Check if we have a stored hash
  const hashFile = '.lockfile-hash';
  let storedHash = '';
  
  if (fs.existsSync(hashFile)) {
    storedHash = fs.readFileSync(hashFile, 'utf8').trim();
  }
  
  // Also check if lockfile exists
  const lockfileExists = fs.existsSync('pnpm-lock.yaml');
  
  if (!lockfileExists) {
    log('⚠️  No pnpm-lock.yaml found!', 'yellow');
    return false;
  }
  
  // Check if package.json files have changed
  if (currentHash !== storedHash) {
    log('📦 Package.json files have changed', 'yellow');
    return false;
  }
  
  // Additional check: run pnpm install --dry-run
  const dryRunOutput = exec('pnpm install --frozen-lockfile --dry-run', { 
    silent: true, 
    ignoreError: true 
  });
  
  if (dryRunOutput && dryRunOutput.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
    log('❌ Lockfile is outdated', 'red');
    return false;
  }
  
  log('✅ Lockfile is in sync', 'green');
  return true;
};

// Update lockfile
const updateLockfile = (options = {}) => {
  log('\n🔄 Updating lockfile...', 'blue');
  
  // Save current lockfile for comparison
  let oldLockfile = '';
  if (fs.existsSync('pnpm-lock.yaml')) {
    oldLockfile = fs.readFileSync('pnpm-lock.yaml', 'utf8');
  }
  
  // Run pnpm install to update lockfile
  try {
    exec('pnpm install --no-frozen-lockfile', { silent: false });
    
    // Check if lockfile changed
    const newLockfile = fs.readFileSync('pnpm-lock.yaml', 'utf8');
    const changed = oldLockfile !== newLockfile;
    
    if (changed) {
      log('✅ Lockfile updated successfully', 'green');
      
      // Update hash file
      const newHash = getPackageJsonHash();
      fs.writeFileSync('.lockfile-hash', newHash);
      
      // Stage the lockfile if in git context
      if (options.stage) {
        exec('git add pnpm-lock.yaml', { silent: true });
        log('📝 Lockfile staged for commit', 'green');
      }
      
      return true;
    } else {
      log('ℹ️  Lockfile was already up to date', 'blue');
      return false;
    }
  } catch (error) {
    log('❌ Failed to update lockfile', 'red');
    throw error;
  }
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  const options = {
    check: args.includes('--check'),
    fix: args.includes('--fix'),
    stage: args.includes('--stage'),
    ci: args.includes('--ci')
  };
  
  // CI mode - fail if lockfile is out of sync
  if (options.ci) {
    if (!checkLockfileSync()) {
      log('\n❌ Lockfile is out of sync in CI environment', 'red');
      log('Please run "pnpm install" locally and commit the updated lockfile', 'yellow');
      process.exit(1);
    }
    log('\n✅ Lockfile check passed in CI', 'green');
    process.exit(0);
  }
  
  // Check mode
  if (options.check) {
    const inSync = checkLockfileSync();
    process.exit(inSync ? 0 : 1);
  }
  
  // Fix mode or default behavior
  const inSync = checkLockfileSync();
  
  if (!inSync) {
    if (options.fix || !options.check) {
      const updated = updateLockfile(options);
      if (updated && !options.stage) {
        log('\n💡 Remember to commit the updated lockfile', 'yellow');
      }
    } else {
      log('\n💡 Run with --fix to update the lockfile', 'yellow');
      process.exit(1);
    }
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkLockfileSync, updateLockfile };