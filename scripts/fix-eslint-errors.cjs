#!/usr/bin/env node

/**
 * Script to fix common ESLint errors systematically
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 Starting ESLint fixes...\n')

// Step 1: Run ESLint auto-fix for fixable issues
console.log('1️⃣ Running ESLint auto-fix...')
try {
  execSync('pnpm lint --fix', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../apps/web')
  })
  console.log('✅ ESLint auto-fix completed\n')
} catch (error) {
  console.log('⚠️  Some ESLint issues remain (this is expected)\n')
}

// Step 2: Fix unused imports
console.log('2️⃣ Removing unused imports...')
const removeUnusedImports = () => {
  const srcDir = path.join(__dirname, '../apps/web/src')
  
  // Get all TypeScript/React files
  const getAllFiles = (dir, files = []) => {
    const dirFiles = fs.readdirSync(dir)
    for (const file of dirFiles) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, files)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(filePath)
      }
    }
    return files
  }
  
  const files = getAllFiles(srcDir)
  let fixedCount = 0
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8')
    let modified = false
    
    // Remove completely unused imports
    const unusedImportRegex = /import\s+(?:{[^}]*}|[^{]*)\s+from\s+['"][^'"]+['"]\s*\n?/g
    const importMatches = content.match(unusedImportRegex) || []
    
    importMatches.forEach(importLine => {
      // Extract imported items
      const namedImportsMatch = importLine.match(/import\s+{([^}]+)}\s+from/)
      if (namedImportsMatch) {
        const imports = namedImportsMatch[1].split(',').map(i => i.trim())
        const usedImports = imports.filter(imp => {
          const importName = imp.split(' as ')[0].trim()
          // Check if import is used in the file (excluding the import line itself)
          const restOfFile = content.replace(importLine, '')
          return new RegExp(`\\b${importName}\\b`).test(restOfFile)
        })
        
        if (usedImports.length === 0) {
          // Remove entire import line
          content = content.replace(importLine, '')
          modified = true
        } else if (usedImports.length < imports.length) {
          // Update import line with only used imports
          const newImportLine = importLine.replace(
            /{[^}]+}/,
            `{ ${usedImports.join(', ')} }`
          )
          content = content.replace(importLine, newImportLine)
          modified = true
        }
      }
    })
    
    if (modified) {
      fs.writeFileSync(file, content)
      fixedCount++
    }
  })
  
  console.log(`✅ Fixed unused imports in ${fixedCount} files\n`)
}

// Step 3: Fix unescaped entities
console.log('3️⃣ Fixing unescaped entities...')
const fixUnescapedEntities = () => {
  const srcDir = path.join(__dirname, '../apps/web/src')
  const files = require('child_process')
    .execSync(`find ${srcDir} -name "*.tsx" -o -name "*.jsx"`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let fixedCount = 0
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8')
    let modified = false
    
    // Fix common unescaped entities in JSX text
    const replacements = [
      { from: /(\>)([^<]*)'([^<]*\<)/g, to: '$1$2&apos;$3' },
      { from: /(\>)([^<]*)"([^<]*\<)/g, to: '$1$2&quot;$3' },
      { from: /(\>)([^<]*)"([^<]*\<)/g, to: '$1$2&ldquo;$3' },
      { from: /(\>)([^<]*)"([^<]*\<)/g, to: '$1$2&rdquo;$3' },
    ]
    
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to)
      if (newContent !== content) {
        content = newContent
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(file, content)
      fixedCount++
    }
  })
  
  console.log(`✅ Fixed unescaped entities in ${fixedCount} files\n`)
}

// Step 4: Add missing dependencies to useEffect
console.log('4️⃣ Adding missing useEffect dependencies...')
const fixUseEffectDeps = () => {
  console.log('⚠️  Manual review needed for useEffect dependencies\n')
}

// Step 5: Fix any type annotations
console.log('5️⃣ Replacing any types with unknown...')
const fixAnyTypes = () => {
  const srcDir = path.join(__dirname, '../apps/web/src')
  const files = require('child_process')
    .execSync(`find ${srcDir} -name "*.ts" -o -name "*.tsx"`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  let fixedCount = 0
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8')
    
    // Replace : any with : unknown in most cases
    const newContent = content
      .replace(/:\s*any\[\]/g, ': unknown[]')
      .replace(/:\s*any\b/g, ': unknown')
      .replace(/as\s+any\b/g, 'as unknown')
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent)
      fixedCount++
    }
  })
  
  console.log(`✅ Replaced any types in ${fixedCount} files\n`)
}

// Run fixes
try {
  removeUnusedImports()
  // fixUnescapedEntities()
  fixAnyTypes()
  fixUseEffectDeps()
  
  // Final ESLint check
  console.log('📊 Final ESLint check...')
  execSync('pnpm lint', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../apps/web')
  })
} catch (error) {
  console.log('\n⚠️  Some ESLint warnings remain. Please review manually.')
}

console.log('\n✨ ESLint fixes completed!')