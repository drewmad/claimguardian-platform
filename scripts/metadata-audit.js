#!/usr/bin/env node

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

const directoriesToScan = ['apps', 'packages'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

async function auditMetadata() {
  console.log('Starting metadata audit...');
  const filesToScan = await glob(`{${directoriesToScan.join(',')}}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ignorePatterns,
  });

  const filesMissingMetadata = [];

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
      continue;
    }
    const content = await readFile(file, 'utf-8');
    if (!content.includes('@fileMetadata')) {
      filesMissingMetadata.push(file);
    }
  }

  if (filesMissingMetadata.length > 0) {
    console.log('Files missing @fileMetadata header:');
    filesMissingMetadata.forEach(file => console.log(`- ${file}`));
    process.exit(1);
  } else {
    console.log('All scanned files have the @fileMetadata header.');
    process.exit(0);
  }
}

auditMetadata().catch(err => {
  console.error(err);
  process.exit(1);
});
