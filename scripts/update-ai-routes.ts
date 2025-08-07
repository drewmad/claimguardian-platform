#!/usr/bin/env tsx
/**
 * Script to add Node.js runtime and workspace guards to all AI routes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const AI_ROUTES_PATTERN = /\/api\/ai\//;
const ADMIN_AI_ROUTES_PATTERN = /\/api\/admin.*ai/;

const RUNTIME_GUARD = `
// Force Node.js runtime for AI operations (requires Supabase server client)
export const runtime = 'nodejs';

// Workspace guard: Ensure @claimguardian packages are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[@claimguardian/ai-services] Supabase configuration required for AI operations');
}`;

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (entry === 'route.ts' && (AI_ROUTES_PATTERN.test(fullPath) || ADMIN_AI_ROUTES_PATTERN.test(fullPath))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }
  
  return files;
}

function updateRouteFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Skip if already has runtime export
    if (content.includes("export const runtime = 'nodejs'")) {
      console.log(`  ⏭️  Skipped (already has runtime): ${filePath.replace(process.cwd() + '/', '')}`);
      return false;
    }
    
    // Find the first import statement to insert after
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Look for the end of the file metadata comment block
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('*/') && lines[i - 1]?.includes('@supabase-integration')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // If no metadata block found, insert after first import
    if (insertIndex === 0) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          // Find the last import
          let lastImportIndex = i;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith('import ') || lines[j].trim() === '') {
              if (lines[j].startsWith('import ')) {
                lastImportIndex = j;
              }
            } else {
              break;
            }
          }
          insertIndex = lastImportIndex + 1;
          break;
        }
      }
    }
    
    // Insert the runtime guard
    lines.splice(insertIndex, 0, RUNTIME_GUARD);
    
    const newContent = lines.join('\n');
    writeFileSync(filePath, newContent, 'utf-8');
    
    console.log(`  ✅ Updated: ${filePath.replace(process.cwd() + '/', '')}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('🔧 Updating AI routes with Node.js runtime and workspace guards...\n');
  
  const appsWebDir = join(process.cwd(), 'apps/web/src/app/api');
  const routeFiles = findRouteFiles(appsWebDir);
  
  console.log(`Found ${routeFiles.length} AI route files\n`);
  
  let updatedCount = 0;
  
  for (const file of routeFiles) {
    if (updateRouteFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Complete! Updated ${updatedCount} AI routes`);
  
  if (updatedCount > 0) {
    console.log('\nNext steps:');
    console.log('1. Review changes: git diff');
    console.log('2. Test builds: pnpm build');
    console.log('3. Commit changes: git add . && git commit -m "feat: add Node.js runtime to AI routes"');
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}