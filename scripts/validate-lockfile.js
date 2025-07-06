#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

// Log validation attempt for retrospectives
const logValidation = (success, details) => {
  const retrospective = {
    timestamp: new Date().toISOString(),
    agent: 'system',
    task: 'lockfile_validation',
    success,
    details
  };
  
  const logPath = '.ai-context/retrospectives/system-validations.jsonl';
  fs.appendFileSync(logPath, JSON.stringify(retrospective) + '\n');
};

try {
  execSync('pnpm install --frozen-lockfile --dry-run', { stdio: 'ignore' });
  console.log('✅ Lockfile is up to date');
  logValidation(true, 'Lockfile valid');
  process.exit(0);
} catch (error) {
  console.error('❌ Lockfile is outdated!');
  console.error('Run: pnpm install');
  logValidation(false, 'Lockfile outdated');
  process.exit(1);
}