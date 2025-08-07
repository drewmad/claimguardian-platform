#!/usr/bin/env node

/**
 * Pretty build script with clean output
 */

import { spawn } from 'child_process';
import readline from 'readline';

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Patterns to filter out
const filterPatterns = [
  /Supabase Factory/,
  /\[Supabase Factory\]/,
  /monitoring started/,
  /Redis AI Cache/,
  /Supabase browser client/,
  /AUTH SERVICE.*Supabase client created/,
  /\[2025.*\[INFO\]/,
  /hasUrl: true/,
  /url: https/,
  /hasAnonKey: true/,
  /anonKeyLength:/,
  /Feedback loop monitoring/,
];

// Patterns to highlight
const highlightPatterns = [
  { pattern: /Tasks:.*successful/, color: 'green' },
  { pattern: /Cached:/, color: 'cyan' },
  { pattern: /Time:/, color: 'magenta' },
  { pattern: /✓ Compiled successfully/, color: 'green' },
  { pattern: /⚡️ Build success/, color: 'green' },
  { pattern: /Building entry:/, color: 'blue' },
  { pattern: /cache hit/, color: 'cyan' },
  { pattern: /cache miss/, color: 'yellow' },
  { pattern: /error/, color: 'red', caseInsensitive: true },
  { pattern: /warning/, color: 'yellow', caseInsensitive: true },
];

// Progress tracking
let currentPackage = '';
const packageProgress = new Map();

console.log(`${colors.bright}🚀 Starting optimized build...${colors.reset}\n`);

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.VERBOSE_LOGS = 'false';
process.env.LOG_LEVEL = 'error';

// Run the build
const build = spawn('pnpm', ['build'], {
  env: { ...process.env },
  shell: true,
});

const rl = readline.createInterface({
  input: build.stdout,
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  // Skip filtered patterns
  if (filterPatterns.some(pattern => pattern.test(line))) {
    return;
  }

  // Extract package name if present
  const packageMatch = line.match(/^(@claimguardian\/[^:]+|web):build:/);
  if (packageMatch) {
    currentPackage = packageMatch[1];
    if (!packageProgress.has(currentPackage)) {
      packageProgress.set(currentPackage, { status: 'building', startTime: Date.now() });
    }
  }

  // Check for completion
  if (line.includes('Build success') && currentPackage) {
    const progress = packageProgress.get(currentPackage);
    if (progress) {
      progress.status = 'complete';
      progress.endTime = Date.now();
      progress.duration = progress.endTime - progress.startTime;
    }
  }

  // Apply highlighting
  let formattedLine = line;
  highlightPatterns.forEach(({ pattern, color, caseInsensitive }) => {
    const regex = caseInsensitive ? new RegExp(pattern, 'i') : pattern;
    if (regex.test(line)) {
      formattedLine = `${colors[color]}${line}${colors.reset}`;
    }
  });

  // Clean up the line
  formattedLine = formattedLine
    .replace(/^.*?:build:\s*/, '') // Remove package prefix
    .replace(/CLI\s+/, '') // Remove CLI prefix
    .replace(/\s+$/, ''); // Trim trailing whitespace

  // Only print non-empty lines
  if (formattedLine.trim()) {
    console.log(formattedLine);
  }
});

build.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim() && !filterPatterns.some(pattern => pattern.test(line))) {
      console.error(`${colors.red}${line}${colors.reset}`);
    }
  });
});

build.on('close', (code) => {
  console.log('\n' + '─'.repeat(50) + '\n');

  // Show package summary
  console.log(`${colors.bright}📦 Package Build Summary:${colors.reset}`);
  packageProgress.forEach((progress, pkg) => {
    const icon = progress.status === 'complete' ? '✅' : '❌';
    const duration = progress.duration ? `(${progress.duration}ms)` : '';
    console.log(`  ${icon} ${pkg} ${colors.dim}${duration}${colors.reset}`);
  });

  console.log('\n' + '─'.repeat(50) + '\n');

  if (code === 0) {
    console.log(`${colors.green}${colors.bright}✨ Build completed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Build failed with code ${code}${colors.reset}`);
    process.exit(code);
  }
});
