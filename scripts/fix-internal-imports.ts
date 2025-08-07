#!/usr/bin/env tsx
/**
 * Codemod to eliminate subpath imports like `@mad/db/*`
 * This script rewrites any `@mad/<pkg>/<anything>` to `@mad/<pkg>` and deduplicates specifiers.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const WORKSPACE_PACKAGES = [
  '@claimguardian/db',
  '@claimguardian/ui', 
  '@claimguardian/utils',
  '@claimguardian/ai-services',
  '@claimguardian/monitoring',
  '@claimguardian/realtime'
];

function findTSFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, dist, etc.
        if (!['node_modules', '.next', 'dist', '.turbo', 'coverage'].includes(entry)) {
          files.push(...findTSFiles(fullPath));
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }
  
  return files;
}

function fixImportsInFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let modified = false;
    let newContent = content;

    // Pattern to match subpath imports
    // Matches: import ... from '@claimguardian/pkg/subpath'
    const importPattern = /from\s+['"](@claimguardian\/[^/'"]+)\/[^'"]*['"]/g;
    
    newContent = newContent.replace(importPattern, (match, packageName) => {
      if (WORKSPACE_PACKAGES.includes(packageName)) {
        modified = true;
        console.log(`  Fixed: ${match} → from '${packageName}'`);
        return `from '${packageName}'`;
      }
      return match;
    });

    // Also handle dynamic imports
    const dynamicImportPattern = /import\s*\(\s*['"](@claimguardian\/[^/'"]+)\/[^'"]*['"]\s*\)/g;
    
    newContent = newContent.replace(dynamicImportPattern, (match, packageName) => {
      if (WORKSPACE_PACKAGES.includes(packageName)) {
        modified = true;
        console.log(`  Fixed dynamic: ${match} → import('${packageName}')`);
        return `import('${packageName}')`;
      }
      return match;
    });

    if (modified) {
      writeFileSync(filePath, newContent, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing internal imports...\n');
  
  const rootDir = process.cwd();
  const tsFiles = findTSFiles(rootDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files\n`);
  
  let totalFixed = 0;
  let filesModified = 0;
  
  for (const file of tsFiles) {
    const relativePath = file.replace(rootDir + '/', '');
    const wasModified = fixImportsInFile(file);
    
    if (wasModified) {
      filesModified++;
      console.log(`✅ Modified: ${relativePath}`);
    }
  }
  
  console.log(`\n🎉 Complete! Modified ${filesModified} files`);
  
  if (filesModified > 0) {
    console.log('\nNext steps:');
    console.log('1. Review changes: git diff');
    console.log('2. Test builds: pnpm build');
    console.log('3. Commit changes: git add . && git commit -m "fix: eliminate subpath imports"');
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}