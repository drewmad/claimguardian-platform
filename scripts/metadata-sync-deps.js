#!/usr/bin/env node

import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const directoriesToScan = ['apps', 'packages'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

// Common package mappings
const packageMappings = {
  'react': ['react'],
  'next': ['next', 'next/'],
  '@supabase/supabase-js': ['createClient', 'SupabaseClient'],
  '@claimguardian/ui': ['Button', 'Card', 'Input'],
  '@claimguardian/utils': ['formatDate', 'cn'],
  'openai': ['OpenAI'],
  'lucide-react': ['Plus', 'Minus', 'Home'],
  'tailwindcss': ['twMerge', 'clsx']
};

async function extractImports(content) {
  const imports = new Set();
  
  // Match various import patterns
  const importPatterns = [
    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  ];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let pkg = match[1];
      
      // Handle scoped packages and subpaths
      if (pkg.startsWith('@')) {
        const parts = pkg.split('/');
        if (parts.length >= 2) {
          pkg = `${parts[0]}/${parts[1]}`;
        }
      } else {
        pkg = pkg.split('/')[0];
      }
      
      // Filter out relative imports
      if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
        imports.add(pkg);
      }
    }
  }

  return Array.from(imports).sort();
}

async function updateDependencies() {
  console.log('🔄 Starting dependency synchronization...\n');
  
  const filesToScan = await glob(`{${directoriesToScan.join(',')}}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ignorePatterns,
  });

  let filesUpdated = 0;

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
      continue;
    }
    
    const content = await readFile(file, 'utf-8');
    
    // Skip files without metadata
    if (!content.includes('@fileMetadata')) {
      continue;
    }

    // Extract current dependencies
    const actualImports = await extractImports(content);
    
    if (actualImports.length === 0) {
      continue;
    }

    // Find metadata block
    const metadataMatch = content.match(/(\/\*\*[\s\S]*?@fileMetadata[\s\S]*?\*\/)/);
    if (!metadataMatch) {
      continue;
    }

    const metadataBlock = metadataMatch[1];
    
    // Check if dependencies already exist and are accurate
    const depsMatch = metadataBlock.match(/@dependencies\s+(\[.*?\])/s);
    
    let needsUpdate = false;
    let currentDeps = [];
    
    if (depsMatch) {
      try {
        currentDeps = JSON.parse(depsMatch[1].replace(/'/g, '"'));
        // Compare arrays (order doesn't matter)
        const currentSet = new Set(currentDeps);
        const actualSet = new Set(actualImports);
        needsUpdate = currentSet.size !== actualSet.size || 
                     ![...currentSet].every(dep => actualSet.has(dep));
      } catch (e) {
        needsUpdate = true;
      }
    } else {
      needsUpdate = true;
    }

    if (needsUpdate) {
      let updatedMetadata;
      const depsString = JSON.stringify(actualImports).replace(/"/g, '"');
      
      if (depsMatch) {
        // Update existing dependencies
        updatedMetadata = metadataBlock.replace(
          /@dependencies\s+\[.*?\]/s,
          `@dependencies ${depsString}`
        );
      } else {
        // Add dependencies after @purpose or before the closing */
        const purposeMatch = metadataBlock.match(/(@purpose\s+.*)/);
        if (purposeMatch) {
          updatedMetadata = metadataBlock.replace(
            purposeMatch[1],
            `${purposeMatch[1]}\n * @dependencies ${depsString}`
          );
        } else {
          // Add before closing */
          updatedMetadata = metadataBlock.replace(
            /\s*\*\//,
            `\n * @dependencies ${depsString}\n */`
          );
        }
      }

      // Update the file
      const updatedContent = content.replace(metadataBlock, updatedMetadata);
      await writeFile(file, updatedContent, 'utf-8');
      
      console.log(`📦 Updated dependencies in ${file}`);
      console.log(`   Dependencies: ${actualImports.join(', ')}\n`);
      filesUpdated++;
    }
  }

  if (filesUpdated > 0) {
    console.log(`✅ Successfully updated dependencies in ${filesUpdated} files.`);
  } else {
    console.log('✅ All file dependencies are already up to date.');
  }
  
  process.exit(0);
}

updateDependencies().catch(err => {
  console.error('❌ Dependency sync failed:', err);
  process.exit(1);
});