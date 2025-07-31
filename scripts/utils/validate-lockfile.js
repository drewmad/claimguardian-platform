#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const LOCKFILE_PATH = path.join(REPO_ROOT, 'pnpm-lock.yaml');

const logValidation = (success, details) => {
  const retrospective = {
    timestamp: new Date().toISOString(),
    agent: 'system',
    task: 'lockfile_validation',
    success,
    details
  };
  const logPath = path.join(REPO_ROOT, '.ai-context/retrospectives/system-validations.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(retrospective) + '\n');
};

try {
  // Run pnpm install to ensure node_modules and lockfile are up-to-date locally
  // This might modify pnpm-lock.yaml if it's outdated
  console.log('Running pnpm install to ensure local dependencies are up-to-date...');
  execSync('pnpm install', { stdio: 'inherit' }); // Use 'inherit' to show pnpm output

  // Check if pnpm-lock.yaml is now dirty (meaning pnpm install changed it)
  const statusOutput = execSync('git status --porcelain pnpm-lock.yaml', { encoding: 'utf8' }).trim();

  if (statusOutput.includes('M pnpm-lock.yaml')) {
    console.error('❌ pnpm-lock.yaml was modified by "pnpm install" and is not staged!');
    console.error('Please run "git add pnpm-lock.yaml" and commit the changes.');
    logValidation(false, 'Lockfile modified by pnpm install and not staged');
    process.exit(1);
  }

  // Final check with --frozen-lockfile --dry-run to ensure strict match
  console.log('Performing final lockfile validation...');
  execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' });
  
  console.log('✅ Lockfile is up to date');
  logValidation(true, 'Lockfile valid');
  process.exit(0);

} catch (error) {
  console.error('❌ Lockfile validation failed!');
  console.error('Error details:', error.message);
  console.error('Please run "pnpm install" and commit "pnpm-lock.yaml" if it was modified.');
  logValidation(false, `Lockfile validation failed: ${error.message}`);
  process.exit(1);
}
