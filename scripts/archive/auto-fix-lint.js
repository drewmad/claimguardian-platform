#!/usr/bin/env node

/**
 * Automatic lint fixer for pre-commit hook
 * Detects and fixes common ESLint issues across the monorepo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes
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

// Execute command and return output
const exec = (command, options = {}) => {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.silent && !options.ignoreError) {
      log(`Error: ${command}`, 'red');
    }
    return options.ignoreError ? error.stdout || '' : null;
  }
};

// Get lint stats
const getLintStats = () => {
  const output = exec('pnpm lint 2>&1', { silent: true, ignoreError: true }) || '';
  
  // Count errors and warnings from the output
  let errors = 0;
  let warnings = 0;
  
  // Look for Next.js/ESLint output patterns
  const lines = output.split('\n');
  lines.forEach(line => {
    if (line.includes('Error:')) errors++;
    if (line.includes('Warning:')) warnings++;
  });
  
  // Also check for summary lines
  const errorMatch = output.match(/(\d+)\s+errors?/i);
  const warningMatch = output.match(/(\d+)\s+warnings?/i);
  
  if (errorMatch) errors = Math.max(errors, parseInt(errorMatch[1]));
  if (warningMatch) warnings = Math.max(warnings, parseInt(warningMatch[1]));
  
  return { errors, warnings, output };
};

// Apply fixes
const applyFixes = () => {
  log('\n🤖 Auto-fixing lint issues...', 'blue');
  
  // Get initial state
  const initial = getLintStats();
  log(`\n📊 Initial: ${initial.errors} errors, ${initial.warnings} warnings`, 'yellow');
  
  if (initial.errors === 0 && initial.warnings === 0) {
    log('✅ No issues to fix!', 'green');
    return true;
  }
  
  // Strategy 1: Fix all auto-fixable issues in each workspace
  log('\n🔧 Running ESLint auto-fix...', 'blue');
  
  // Fix in web app (main source of issues)
  if (fs.existsSync('apps/web')) {
    exec('cd apps/web && npx eslint . --fix --ext .js,.jsx,.ts,.tsx', { 
      silent: true, 
      ignoreError: true 
    });
  }
  
  // Fix in packages
  const packages = ['ui', 'utils', 'config', 'ai-config'];
  packages.forEach(pkg => {
    const pkgPath = `packages/${pkg}`;
    if (fs.existsSync(pkgPath)) {
      exec(`cd ${pkgPath} && npx eslint . --fix --ext .js,.jsx,.ts,.tsx`, { 
        silent: true, 
        ignoreError: true 
      });
    }
  });
  
  // Strategy 2: Target specific common issues
  const targetedFixes = [
    {
      name: 'Unescaped entities',
      rule: 'react/no-unescaped-entities'
    },
    {
      name: 'Import order',
      rule: 'import/order'
    },
    {
      name: 'Quotes',
      rule: 'quotes: [2, single]'
    },
    {
      name: 'Semicolons',
      rule: 'semi: [2, always]'
    }
  ];
  
  targetedFixes.forEach(({ name, rule }) => {
    log(`\n🎯 Fixing ${name}...`, 'blue');
    exec(`cd apps/web && npx eslint . --fix --rule "${rule}" --no-eslintrc`, {
      silent: true,
      ignoreError: true
    });
  });
  
  // Stage all changes
  exec('git add -u', { silent: true });
  
  // Get final state
  const final = getLintStats();
  
  // Calculate improvements
  const fixedErrors = initial.errors - final.errors;
  const fixedWarnings = initial.warnings - final.warnings;
  
  log('\n📊 Results:', 'blue');
  log(`   Errors: ${initial.errors} → ${final.errors} (fixed ${fixedErrors})`, 
    final.errors === 0 ? 'green' : 'yellow');
  log(`   Warnings: ${initial.warnings} → ${final.warnings} (fixed ${fixedWarnings})`,
    final.warnings === 0 ? 'green' : 'yellow');
  
  if (final.errors > 0) {
    log('\n❌ Manual fixes required:', 'red');
    
    // Show sample of remaining errors
    const remainingErrors = final.output
      .split('\n')
      .filter(line => line.includes('Error:'))
      .slice(0, 5);
    
    remainingErrors.forEach(error => {
      console.log(`   ${error.trim()}`);
    });
    
    if (remainingErrors.length === 5) {
      log('   ... and more', 'yellow');
    }
    
    log('\n💡 Tips:', 'yellow');
    log('   1. Run "pnpm lint" to see all errors', 'yellow');
    log('   2. Fix TypeScript "any" types manually', 'yellow');
    log('   3. Add missing hook dependencies', 'yellow');
    
    return false;
  }
  
  log('\n✅ All auto-fixable issues resolved!', 'green');
  return true;
};

// Main execution
if (require.main === module) {
  const success = applyFixes();
  process.exit(success ? 0 : 1);
}

module.exports = { applyFixes };