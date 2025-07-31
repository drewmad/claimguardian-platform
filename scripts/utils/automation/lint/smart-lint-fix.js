#!/usr/bin/env node

/**
 * Smart ESLint auto-fixer
 * Intelligently fixes lint issues with multiple strategies
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const exec = (command, silent = false) => {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit' 
    });
  } catch (error) {
    if (!silent) {
      log(`Error executing: ${command}`, 'red');
    }
    return null;
  }
};

// Fix strategies
const fixStrategies = [
  {
    name: 'ESLint Auto-fix',
    command: 'cd apps/web && pnpm eslint . --fix --quiet',
    description: 'Standard ESLint auto-fix'
  },
  {
    name: 'React Entities',
    command: 'pnpm eslint . --fix --rule "react/no-unescaped-entities: error" --no-eslintrc',
    description: 'Fix unescaped React entities'
  },
  {
    name: 'Import Order',
    command: 'pnpm eslint . --fix --rule "import/order: error" --no-eslintrc',
    description: 'Fix import ordering'
  },
  {
    name: 'Formatting',
    command: 'pnpm eslint . --fix --rule "quotes: [error, single]" --rule "semi: [error, always]" --rule "comma-dangle: [error, always-multiline]" --no-eslintrc',
    description: 'Fix basic formatting'
  },
  {
    name: 'Unused Variables',
    command: 'pnpm eslint . --fix --rule "@typescript-eslint/no-unused-vars: [error, { argsIgnorePattern: ^_, varsIgnorePattern: ^_ }]" --no-eslintrc',
    description: 'Mark unused vars with underscore'
  }
];

// Main function
async function smartLintFix() {
  log('\n🔍 Smart Lint Fix Starting...', 'blue');
  
  // Get initial error count
  const initialOutput = exec('pnpm lint 2>&1', true) || '';
  // Handle both regular and turbo output formats
  const errorMatches = initialOutput.match(/(\d+)\s+errors?/gi) || [];
  const warningMatches = initialOutput.match(/(\d+)\s+warnings?/gi) || [];
  
  const initialErrors = errorMatches
    .map(match => parseInt(match.match(/\d+/)[0]))
    .reduce((sum, num) => sum + num, 0);
  const initialWarnings = warningMatches
    .map(match => parseInt(match.match(/\d+/)[0]))
    .reduce((sum, num) => sum + num, 0);
  
  log(`\n📊 Initial State: ${initialErrors} errors, ${initialWarnings} warnings`, 'yellow');
  
  if (initialErrors === 0 && initialWarnings === 0) {
    log('✅ No lint issues found!', 'green');
    return true;
  }
  
  // Apply fix strategies
  let fixesApplied = 0;
  
  for (const strategy of fixStrategies) {
    log(`\n🔧 Applying: ${strategy.name}`, 'blue');
    log(`   ${strategy.description}`, 'blue');
    
    const before = exec('pnpm lint 2>&1', true) || '';
    exec(strategy.command, true);
    const after = exec('pnpm lint 2>&1', true) || '';
    
    const beforeCount = (before.match(/(\d+)\s+errors?/gi) || [])
      .map(match => parseInt(match.match(/\d+/)[0]))
      .reduce((sum, num) => sum + num, 0);
    const afterCount = (after.match(/(\d+)\s+errors?/gi) || [])
      .map(match => parseInt(match.match(/\d+/)[0]))
      .reduce((sum, num) => sum + num, 0);
    
    const fixed = beforeCount - afterCount;
    if (fixed > 0) {
      log(`   ✅ Fixed ${fixed} issues`, 'green');
      fixesApplied += fixed;
    } else {
      log(`   ⏭️  No issues fixed by this strategy`, 'yellow');
    }
  }
  
  // Stage any fixed files
  exec('git add -u', true);
  
  // Final check
  const finalOutput = exec('pnpm lint 2>&1', true) || '';
  const finalErrors = (finalOutput.match(/(\d+)\s+errors?/gi) || [])
    .map(match => parseInt(match.match(/\d+/)[0]))
    .reduce((sum, num) => sum + num, 0);
  const finalWarnings = (finalOutput.match(/(\d+)\s+warnings?/gi) || [])
    .map(match => parseInt(match.match(/\d+/)[0]))
    .reduce((sum, num) => sum + num, 0);
  
  log('\n📊 Final Results:', 'blue');
  log(`   Errors: ${initialErrors} → ${finalErrors} (fixed ${initialErrors - finalErrors})`, 
    finalErrors === 0 ? 'green' : 'yellow');
  log(`   Warnings: ${initialWarnings} → ${finalWarnings} (fixed ${initialWarnings - finalWarnings})`,
    finalWarnings === 0 ? 'green' : 'yellow');
  
  if (finalErrors > 0) {
    log('\n❌ Manual intervention required for remaining errors:', 'red');
    
    // Show top error types
    const errorTypes = {};
    const lines = finalOutput.split('\n');
    lines.forEach(line => {
      const match = line.match(/(\S+)\s+error\s+(.+?)\s+(@?\S+)$/);
      if (match) {
        const rule = match[3];
        errorTypes[rule] = (errorTypes[rule] || 0) + 1;
      }
    });
    
    log('\n📋 Error Summary:', 'yellow');
    Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([rule, count]) => {
        log(`   ${rule}: ${count} occurrences`, 'yellow');
      });
    
    return false;
  }
  
  log('\n✅ All lint issues resolved!', 'green');
  return true;
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  smartLintFix().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { smartLintFix };