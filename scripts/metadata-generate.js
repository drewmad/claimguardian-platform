#!/usr/bin/env node

import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const directoriesToScan = ['apps', 'packages'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

const metadataTemplate = `/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */`;

async function generateMetadata() {
  console.log('Starting metadata generation...');
  const filesToScan = await glob(`{${directoriesToScan.join(',')}}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ignorePatterns,
  });

  let filesModified = 0;

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
        continue;
    }
    const content = await readFile(file, 'utf-8');
    if (!content.includes('@fileMetadata')) {
      const newContent = `${metadataTemplate}\n${content}`;
      await writeFile(file, newContent, 'utf-8');
      console.log(`- Added metadata to ${file}`);
      filesModified++;
    }
  }

  if (filesModified > 0) {
    console.log(`\nSuccessfully added metadata to ${filesModified} files.`);
  } else {
    console.log('All scanned files already have the @fileMetadata header.');
  }
  process.exit(0);
}

generateMetadata().catch(err => {
  console.error(err);
  process.exit(1);
});
