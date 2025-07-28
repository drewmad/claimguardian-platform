#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan
const SCAN_DIRS = ['apps/web/src', 'packages'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '__tests__',
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts',
  '*.spec.tsx',
  '.d.ts',
  'tsconfig.json',
  'package.json',
  'README.md',
  '.gitignore',
  'jest.config',
  'jest.setup',
  'setup.ts'
];

// File extensions to check
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Files that are entry points or configs (always used)
const ENTRY_POINTS = [
  'apps/web/src/app/layout.tsx',
  'apps/web/src/app/page.tsx',
  'apps/web/src/middleware.ts',
  'apps/web/next.config.js',
  'apps/web/postcss.config.js',
  'apps/web/tailwind.config.js',
  'apps/web/src/app/globals.css',
  'packages/*/src/index.ts',
  'packages/*/src/index.tsx',
  'apps/web/src/app/*/page.tsx',
  'apps/web/src/app/*/layout.tsx',
  'apps/web/src/app/*/loading.tsx',
  'apps/web/src/app/*/error.tsx',
  'apps/web/src/app/api/*/route.ts'
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function isEntryPoint(filePath) {
  return ENTRY_POINTS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath === pattern || filePath.endsWith(pattern);
  });
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (shouldIgnore(filePath)) return;
    
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.some(ext => filePath.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractImports(content) {
  const imports = new Set();
  
  // ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[\w\s,*]+))\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(['"]([^'"]+)['"]\)/g;
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }
  while ((match = requireRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }
  
  return imports;
}

function resolveImportPath(importPath, fromFile) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);
    
    // Try different extensions
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
      const testPath = resolved + ext;
      if (fs.existsSync(testPath) && !fs.statSync(testPath).isDirectory()) {
        return testPath;
      }
    }
  }
  
  // Handle @/ imports (assuming @/ maps to src/)
  if (importPath.startsWith('@/')) {
    const srcPath = importPath.replace('@/', 'apps/web/src/');
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
      const testPath = srcPath + ext;
      if (fs.existsSync(testPath) && !fs.statSync(testPath).isDirectory()) {
        return testPath;
      }
    }
  }
  
  // Handle package imports
  if (importPath.startsWith('@claimguardian/')) {
    const packageName = importPath.split('/')[1];
    const packagePath = `packages/${packageName}/src/index`;
    for (const ext of ['.ts', '.tsx']) {
      const testPath = packagePath + ext;
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }
  }
  
  return null;
}

function findUnusedFiles() {
  console.log('🔍 Scanning for unused files...\n');
  
  // Get all files
  const allFiles = [];
  SCAN_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });
  
  console.log(`📁 Found ${allFiles.length} total files\n`);
  
  // Track which files are imported
  const importedFiles = new Set();
  const fileImports = new Map();
  
  // First, mark all entry points as imported
  allFiles.forEach(file => {
    if (isEntryPoint(file)) {
      importedFiles.add(file);
    }
  });
  
  // Then scan all files for imports
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = extractImports(content);
    fileImports.set(file, imports);
    
    imports.forEach(importPath => {
      const resolved = resolveImportPath(importPath, file);
      if (resolved) {
        importedFiles.add(resolved);
      }
    });
  });
  
  // Find unused files
  const unusedFiles = allFiles.filter(file => !importedFiles.has(file) && !isEntryPoint(file));
  
  // Group by directory
  const grouped = {};
  unusedFiles.forEach(file => {
    const dir = path.dirname(file);
    if (!grouped[dir]) {
      grouped[dir] = [];
    }
    grouped[dir].push(path.basename(file));
  });
  
  // Display results
  console.log('📊 Results:\n');
  console.log(`✅ Used files: ${importedFiles.size}`);
  console.log(`❌ Unused files: ${unusedFiles.length}\n`);
  
  if (unusedFiles.length > 0) {
    console.log('🗑️  Unused files by directory:\n');
    Object.entries(grouped).forEach(([dir, files]) => {
      console.log(`\n${dir}/`);
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    });
    
    // Also check for unused exports within used files
    console.log('\n\n📤 Checking for unused exports in used files...\n');
    checkUnusedExports(allFiles, fileImports);
  } else {
    console.log('🎉 No unused files found!');
  }
}

function checkUnusedExports(allFiles, fileImports) {
  const exportUsage = new Map();
  
  // First, collect all exports
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const exports = extractExports(content);
    if (exports.length > 0) {
      exportUsage.set(file, {
        exports: exports,
        used: new Set()
      });
    }
  });
  
  // Then check which exports are actually imported
  fileImports.forEach((imports, fromFile) => {
    const content = fs.readFileSync(fromFile, 'utf8');
    
    imports.forEach(importPath => {
      const resolved = resolveImportPath(importPath, fromFile);
      if (resolved && exportUsage.has(resolved)) {
        const usage = exportUsage.get(resolved);
        const importedNames = extractImportedNames(content, importPath);
        importedNames.forEach(name => usage.used.add(name));
      }
    });
  });
  
  // Report unused exports
  let hasUnusedExports = false;
  exportUsage.forEach((usage, file) => {
    const unused = usage.exports.filter(exp => !usage.used.has(exp) && exp !== 'default');
    if (unused.length > 0) {
      if (!hasUnusedExports) {
        console.log('Files with unused exports:\n');
        hasUnusedExports = true;
      }
      console.log(`${file}`);
      unused.forEach(exp => console.log(`  - ${exp}`));
      console.log('');
    }
  });
  
  if (!hasUnusedExports) {
    console.log('No unused exports found!');
  }
}

function extractExports(content) {
  const exports = [];
  
  // Named exports
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Export statements
  const exportStatementRegex = /export\s*\{([^}]+)\}/g;
  while ((match = exportStatementRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
    exports.push(...names);
  }
  
  // Default export
  if (/export\s+default/.test(content)) {
    exports.push('default');
  }
  
  return exports;
}

function extractImportedNames(content, importPath) {
  const names = new Set();
  
  // Named imports
  const namedImportRegex = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
  let match;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const imported = match[1].split(',').map(n => n.trim().split(' as ')[0]);
    imported.forEach(name => names.add(name));
  }
  
  // Default import
  const defaultImportRegex = new RegExp(`import\\s+(\\w+)\\s+from\\s*['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
  while ((match = defaultImportRegex.exec(content)) !== null) {
    names.add('default');
  }
  
  // Star import (assume all exports are used)
  const starImportRegex = new RegExp(`import\\s*\\*\\s*as\\s+\\w+\\s+from\\s*['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
  if (starImportRegex.test(content)) {
    names.add('*');
  }
  
  return names;
}

// Run the script
findUnusedFiles();