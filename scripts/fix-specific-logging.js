#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 ClaimGuardian Logging Fix Script - Specific Pattern');
console.log('=====================================================');

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

function fixBrokenLogging(content) {
  // The exact broken pattern from the files:
  // console.log(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), message: JSON.stringify({ timestamp: new Date().toISOString( })), level: "info", message: `Testing ${endpoint.name}...` }));
  
  let fixedContent = content;
  let fixCount = 0;
  
  // Pattern 1: The most common broken pattern
  const pattern1 = /console\.log\(JSON\.stringify\(\{\s*level:\s*["']([^"']+)["'],\s*timestamp:\s*new Date\(\)\.toISOString\(\),\s*message:\s*JSON\.stringify\(\{\s*timestamp:\s*new Date\(\)\.toISOString\(\s*\}\s*\)\),\s*level:\s*["']([^"']+)["'],\s*message:\s*([^}]+)\}\)\);?/g;
  
  fixedContent = fixedContent.replace(pattern1, (match, firstLevel, secondLevel, messageAndRest) => {
    fixCount++;
    console.log(`    🔧 Fixing pattern 1: ${match.substring(0, 60)}...`);
    
    // Extract the actual message content
    let cleanMessage = messageAndRest.trim();
    
    // Handle template literals and string concatenation
    if (cleanMessage.startsWith('`') || cleanMessage.startsWith('"') || cleanMessage.startsWith("'")) {
      return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  message: ${cleanMessage}
}));`;
    } else {
      return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  message: "${cleanMessage}"
}));`;
    }
  });
  
  // Pattern 2: With additional properties like error
  const pattern2 = /console\.log\(JSON\.stringify\(\{\s*level:\s*["']([^"']+)["'],\s*timestamp:\s*new Date\(\)\.toISOString\(\),\s*message:\s*JSON\.stringify\(\{\s*timestamp:\s*new Date\(\)\.toISOString\(\s*\}\s*\)\),\s*level:\s*["']([^"']+)["'],\s*message:\s*([^,}]+),\s*([^}]+)\}\)\);?/g;
  
  fixedContent = fixedContent.replace(pattern2, (match, firstLevel, secondLevel, message, additionalProps) => {
    fixCount++;
    console.log(`    🔧 Fixing pattern 2: ${match.substring(0, 60)}...`);
    
    return `console.log(JSON.stringify({
  level: "${secondLevel}",
  timestamp: new Date().toISOString(),
  message: ${message.trim()},
  ${additionalProps.trim()}
}));`;
  });
  
  return { content: fixedContent, fixCount };
}

async function main() {
  try {
    const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
    const files = findFiles(functionsDir);
    
    console.log(`🔍 Scanning ${files.length} TypeScript files...`);
    
    let totalFixed = 0;
    let filesFixed = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if file has the broken pattern
        if (content.includes('JSON.stringify({ timestamp: new Date().toISOString(')) {
          console.log(`\n🔧 Processing: ${path.relative(process.cwd(), file)}`);
          
          const { content: fixedContent, fixCount } = fixBrokenLogging(content);
          
          if (fixCount > 0) {
            fs.writeFileSync(file, fixedContent, 'utf8');
            console.log(`  ✅ Fixed ${fixCount} logging statements`);
            totalFixed += fixCount;
            filesFixed++;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not process ${file}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 COMPLETED FIXES:`);
    console.log(`  📁 Files processed: ${filesFixed}`);
    console.log(`  🔧 Total fixes applied: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Review changes: git diff');
      console.log('2. Test a function: supabase functions serve');
      console.log('3. Verify logs parse correctly');
      console.log('4. Deploy when satisfied: supabase functions deploy');
    } else {
      console.log('\n⚠️  No fixes were applied. The patterns may be more complex.');
      console.log('Manual review and fixing may be required.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing logging:', error);
    process.exit(1);
  }
}

main();