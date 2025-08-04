#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 ClaimGuardian Logging Fix Script');
console.log('==================================');

function findFiles(dir, extension = '.ts') {
  const files = [];
  
  function walkDir(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${currentPath}: ${error.message}`);
    }
  }
  
  walkDir(dir);
  return files;
}

async function findBrokenLogFiles() {
  console.log('🔍 Scanning for broken logging patterns...');
  
  const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
  const files = findFiles(functionsDir);
  
  const brokenFiles = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for the specific broken pattern
      if (content.includes('JSON.stringify({ timestamp: new Date().toISOString(')) {
        const matches = [...content.matchAll(/JSON\.stringify\(\{ timestamp: new Date\(\)\.toISOString\(/g)];
        if (matches.length > 0) {
          brokenFiles.push({
            file,
            matches: matches.length,
            content
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read ${file}: ${error.message}`);
    }
  }
  
  return brokenFiles;
}

function fixLoggingInContent(content) {
  console.log('🔧 Applying fixes...');
  
  // Fix the most common broken patterns
  // Pattern: console.log(JSON.stringify({ level: "info", timestamp: ..., message: JSON.stringify({ timestamp: ... })), level: "error", message: 'text' }));
  
  // Replace the complex broken pattern with clean logging
  content = content.replace(
    /console\.log\(JSON\.stringify\(\{\s*level:\s*["']([^"']+)["'],\s*timestamp:\s*new Date\(\)\.toISOString\(\),\s*message:\s*JSON\.stringify\(\{\s*timestamp:\s*new Date\(\)\.toISOString\(\s*\}\s*\)[^}]*\}\),\s*level:\s*["']([^"']+)["'],\s*message:\s*['"]([^'"]+)['"]([^}]*)\}\)\);?/gs,
    (match, firstLevel, secondLevel, message, rest) => {
      // Use the second level (the one that overwrites)
      const cleanMessage = message.replace(/'/g, "");
      const hasRest = rest.trim().length > 0 && rest.includes(':');
      
      if (hasRest) {
        return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  message: "${cleanMessage}",${rest.replace(/^,\s*/, '\n  ')}
}));`;
      } else {
        return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  message: "${cleanMessage}"
}));`;
      }
    }
  );
  
  // Fix simpler pattern with just the nested timestamp issue
  content = content.replace(
    /console\.log\(JSON\.stringify\(\{\s*level:\s*["']([^"']+)["'],\s*timestamp:\s*new Date\(\)\.toISOString\(\),\s*message:\s*JSON\.stringify\(\{\s*timestamp:\s*new Date\(\)\.toISOString\(\s*\}\s*\)[^}]*\}\),\s*level:\s*["']([^"']+)["'],\s*message:\s*([^}]+)\}\)\);?/gs,
    (match, firstLevel, secondLevel, messageAndRest) => {
      return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  ${messageAndRest.trim()}
}));`;
    }
  );
  
  return content;
}

async function main() {
  try {
    const brokenFiles = await findBrokenLogFiles();
    
    if (brokenFiles.length === 0) {
      console.log('✅ No broken logging patterns found!');
      return;
    }
    
    console.log(`\n🚨 Found ${brokenFiles.length} files with broken logging:`);
    brokenFiles.forEach(({ file, matches }) => {
      console.log(`  📁 ${path.relative(process.cwd(), file)} (${matches} issues)`);
    });
    
    console.log('\n🔧 Fixing files...');
    
    let totalFixed = 0;
    
    for (const { file, content } of brokenFiles) {
      console.log(`\n🔧 Fixing: ${path.relative(process.cwd(), file)}`);
      
      const originalMatches = [...content.matchAll(/JSON\.stringify\(\{ timestamp: new Date\(\)\.toISOString\(/g)].length;
      const fixedContent = fixLoggingInContent(content);
      const remainingMatches = [...fixedContent.matchAll(/JSON\.stringify\(\{ timestamp: new Date\(\)\.toISOString\(/g)].length;
      
      const fixed = originalMatches - remainingMatches;
      totalFixed += fixed;
      
      if (fixed > 0) {
        fs.writeFileSync(file, fixedContent, 'utf8');
        console.log(`  ✅ Fixed ${fixed} logging statements`);
      } else {
        console.log(`  ⚠️  Complex pattern - needs manual review`);
        // Let's show what pattern exists
        const problemLines = content.split('\n').filter(line => 
          line.includes('JSON.stringify({ timestamp: new Date().toISOString(')
        );
        if (problemLines.length > 0) {
          console.log(`  📋 Pattern found: ${problemLines[0].trim().substring(0, 80)}...`);
        }
      }
    }
    
    console.log(`\n🎉 COMPLETED: Fixed ${totalFixed} broken logging statements`);
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Review the changes with git diff');
    console.log('2. Test a few functions manually');
    console.log('3. Deploy and verify logs parse correctly');
    console.log('');
    console.log('⚠️  IMPORTANT: Complex patterns may need manual review');
    
  } catch (error) {
    console.error('❌ Error fixing logging:', error);
    process.exit(1);
  }
}

main();