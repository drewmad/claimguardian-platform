#!/usr/bin/env node

import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const directoriesToScan = ['apps', 'packages'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

// Status mapping for common fixes
const statusMapping = {
  'active': 'stable',
  'production': 'stable',
  'ready': 'stable',
  'complete': 'stable',
  'beta': 'experimental',
  'alpha': 'experimental',
  'wip': 'experimental',
  'work-in-progress': 'experimental'
};

async function fixMetadata() {
  console.log('🔧 Starting metadata fixes...\n');

  const filesToScan = await glob(`{${directoriesToScan.join(',')}}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ignorePatterns,
  });

  let filesFixed = 0;

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
      continue;
    }

    const content = await readFile(file, 'utf-8');

    // Skip files without metadata
    if (!content.includes('@fileMetadata')) {
      continue;
    }

    let updatedContent = content;
    let hasChanges = false;

    // Fix status values
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const statusRegex = new RegExp(`(@status\\s+)${oldStatus}\\b`, 'g');
      if (statusRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(statusRegex, `$1${newStatus}`);
        hasChanges = true;
      }
    }

    // Fix unquoted @purpose values
    const purposeRegex = /@purpose\s+([^"\n]+?)(?=\n|\*\/)/g;
    const purposeMatches = [...updatedContent.matchAll(purposeRegex)];

    for (const match of purposeMatches) {
      const [fullMatch, purposeText] = match;
      // Only fix if it's not already quoted and doesn't contain special markers
      if (!purposeText.trim().startsWith('"') &&
          !purposeText.includes('@') &&
          !purposeText.includes('*')) {
        const quotedPurpose = `"${purposeText.trim()}"`;
        updatedContent = updatedContent.replace(fullMatch, `@purpose ${quotedPurpose}`);
        hasChanges = true;
      }
    }

    // Add missing @dependencies tag
    const metadataMatch = updatedContent.match(/(\/\*\*[\s\S]*?@fileMetadata[\s\S]*?\*\/)/);
    if (metadataMatch) {
      const metadataBlock = metadataMatch[1];

      // Check if @dependencies is missing
      if (!metadataBlock.includes('@dependencies')) {
        // Try to extract actual imports
        const imports = await extractBasicImports(updatedContent);

        if (imports.length > 0) {
          const depsString = JSON.stringify(imports);

          // Add @dependencies after @purpose if it exists
          const purposeMatch = metadataBlock.match(/(@purpose\s+.*)/);
          if (purposeMatch) {
            const updatedMetadata = metadataBlock.replace(
              purposeMatch[1],
              `${purposeMatch[1]}\n * @dependencies ${depsString}`
            );
            updatedContent = updatedContent.replace(metadataBlock, updatedMetadata);
            hasChanges = true;
          } else {
            // Add before closing */
            const updatedMetadata = metadataBlock.replace(
              /\s*\*\//,
              `\n * @dependencies ${depsString}\n */`
            );
            updatedContent = updatedContent.replace(metadataBlock, updatedMetadata);
            hasChanges = true;
          }
        } else {
          // Add empty dependencies array
          const purposeMatch = metadataBlock.match(/(@purpose\s+.*)/);
          if (purposeMatch) {
            const updatedMetadata = metadataBlock.replace(
              purposeMatch[1],
              `${purposeMatch[1]}\n * @dependencies []`
            );
            updatedContent = updatedContent.replace(metadataBlock, updatedMetadata);
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      await writeFile(file, updatedContent, 'utf-8');
      console.log(`✅ Fixed metadata issues in ${file}`);
      filesFixed++;
    }
  }

  if (filesFixed > 0) {
    console.log(`\n🎉 Successfully fixed metadata in ${filesFixed} files.`);
    console.log('\n💡 Run `pnpm metadata:validate` to check remaining issues.');
  } else {
    console.log('\n✅ No metadata issues found to fix.');
  }

  process.exit(0);
}

async function extractBasicImports(content) {
  const imports = new Set();

  // Basic import pattern matching
  const importPatterns = [
    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  ];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let pkg = match[1];

      // Handle scoped packages
      if (pkg.startsWith('@')) {
        const parts = pkg.split('/');
        if (parts.length >= 2) {
          pkg = `${parts[0]}/${parts[1]}`;
        }
      } else {
        pkg = pkg.split('/')[0];
      }

      // Filter out relative imports and common non-packages
      if (!pkg.startsWith('.') &&
          !pkg.startsWith('/') &&
          pkg !== 'node:fs' &&
          pkg !== 'node:path' &&
          !pkg.startsWith('node:')) {
        imports.add(pkg);
      }
    }
  }

  return Array.from(imports).sort().slice(0, 5); // Limit to top 5 imports
}

fixMetadata().catch(err => {
  console.error('❌ Metadata fix failed:', err);
  process.exit(1);
});
