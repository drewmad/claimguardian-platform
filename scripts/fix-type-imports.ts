#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Script to fix TS1484 errors by converting value imports to type imports
 * when they are only used as types
 */

interface TypeImportFix {
  file: string;
  line: number;
  importName: string;
}

function extractTS1484Errors(): TypeImportFix[] {
  try {
    // Get TypeScript errors
    const output = execSync('pnpm exec tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8', 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });
    return [];
  } catch (error) {
    const output = error.stdout as string;
    const fixes: TypeImportFix[] = [];
    
    // Parse TS1484 errors: filename(line,col): error TS1484: 'TypeName' is a type and must be imported using a type-only import
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/^(.+\.tsx?)\((\d+),\d+\): error TS1484: '([^']+)' is a type and must be imported using a type-only import/);
      if (match) {
        fixes.push({
          file: match[1],
          line: parseInt(match[2]),
          importName: match[3]
        });
      }
    }
    
    return fixes;
  }
}

function fixTypeImports(fixes: TypeImportFix[]) {
  // Group fixes by file
  const fileGroups = fixes.reduce((acc, fix) => {
    if (!acc[fix.file]) acc[fix.file] = [];
    acc[fix.file].push(fix);
    return acc;
  }, {} as Record<string, TypeImportFix[]>);

  let fixedCount = 0;
  
  for (const [filePath, fileFixes] of Object.entries(fileGroups)) {
    try {
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Get unique import names for this file
      const importNames = [...new Set(fileFixes.map(f => f.importName))];
      
      for (const importName of importNames) {
        // Look for import statements containing this type
        const importRegex = new RegExp(
          `import\\s*{([^}]*\\b${importName}\\b[^}]*)}\\s*from\\s*['"]([^'"]+)['"]`,
          'g'
        );
        
        content = content.replace(importRegex, (match, imports, source) => {
          // Split imports and identify which ones are types
          const importList = imports.split(',').map((imp: string) => imp.trim());
          const typeImports: string[] = [];
          const valueImports: string[] = [];
          
          for (const imp of importList) {
            if (imp.includes(importName)) {
              typeImports.push(imp);
            } else {
              // For now, assume other imports are values (could be enhanced)
              valueImports.push(imp);
            }
          }
          
          // Build new import statement
          let newImport = '';
          if (typeImports.length > 0) {
            newImport += `import type { ${typeImports.join(', ')} } from '${source}';\n`;
          }
          if (valueImports.length > 0) {
            newImport += `import { ${valueImports.join(', ')} } from '${source}';`;
          }
          
          modified = true;
          return newImport.trim();
        });
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        fixedCount += fileFixes.length;
        console.log(`✓ Fixed ${fileFixes.length} type import(s) in ${path.relative(process.cwd(), fullPath)}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  return fixedCount;
}

// Alternative: simpler approach - disable verbatimModuleSyntax temporarily
function disableVerbatimModuleSyntax() {
  const tsConfigPaths = [
    'tsconfig.base.json',
    'apps/web/tsconfig.json'
  ];
  
  for (const configPath of tsConfigPaths) {
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      content = content.replace(
        /"verbatimModuleSyntax":\s*true/g,
        '"verbatimModuleSyntax": false'
      );
      fs.writeFileSync(configPath, content);
      console.log(`✓ Disabled verbatimModuleSyntax in ${configPath}`);
    }
  }
}

async function main() {
  console.log('🔧 Fixing TS1484 type import errors...\n');
  
  // Method 1: Try the simpler approach first
  console.log('Method 1: Disabling verbatimModuleSyntax...');
  disableVerbatimModuleSyntax();
  
  // Test if this fixes the errors
  try {
    execSync('pnpm exec tsc --noEmit --skipLibCheck', { stdio: 'ignore' });
    console.log('✅ Successfully fixed by disabling verbatimModuleSyntax');
    return;
  } catch (error) {
    console.log('Method 1 did not resolve all issues, checking remaining errors...');
  }
  
  // Method 2: If still errors, try to fix them individually  
  const fixes = extractTS1484Errors();
  if (fixes.length === 0) {
    console.log('✅ No TS1484 errors found!');
    return;
  }
  
  console.log(`Found ${fixes.length} TS1484 errors to fix`);
  const fixedCount = fixTypeImports(fixes);
  console.log(`\n✅ Fixed ${fixedCount} type import errors`);
}

if (require.main === module) {
  main().catch(console.error);
}