#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 ClaimGuardian Logging Fix Script - Remaining Patterns');
console.log('=======================================================');

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

function fixRemainingLogging(content) {
  let fixedContent = content;
  let fixCount = 0;
  
  // Find and fix all remaining broken patterns
  // Look for the pattern: console.log(JSON.stringify({ level: "...", timestamp: ..., message: JSON.stringify({ timestamp: ... })), level: "...", message: ... }));
  
  const lines = fixedContent.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains the broken pattern
    if (line.includes('JSON.stringify({ timestamp: new Date().toISOString(')) {
      console.log(`    🔧 Found broken line: ${line.trim().substring(0, 80)}...`);
      
      // Extract the indentation
      const indent = line.match(/^(\s*)/)[1];
      
      try {
        // Try to extract the level and message using regex
        const match = line.match(/console\.log\(JSON\.stringify\(\{[^}]*level:\s*["']([^"']+)["'][^}]*\}\),\s*level:\s*["']([^"']+)["'],\s*message:\s*(.+?)\s*\}\)\);?\s*$/);
        
        if (match) {
          const [, firstLevel, secondLevel, messageContent] = match;
          
          // Create clean logging statement
          const cleanLog = `${indent}console.log(JSON.stringify({
${indent}  level: "${secondLevel}",
${indent}  timestamp: new Date().toISOString(),
${indent}  message: ${messageContent.trim()}
${indent}}));`;
          
          fixedLines.push(cleanLog);
          fixCount++;
          console.log(`    ✅ Fixed to use level: "${secondLevel}"`);
        } else {
          // Fallback: try to extract just the message part
          const simpleMatch = line.match(/message:\s*(.+?)\s*\}\)\);?\s*$/);
          if (simpleMatch) {
            const messageContent = simpleMatch[1];
            const cleanLog = `${indent}console.log(JSON.stringify({
${indent}  level: "info",
${indent}  timestamp: new Date().toISOString(),
${indent}  message: ${messageContent.trim()}
${indent}}));`;
            
            fixedLines.push(cleanLog);
            fixCount++;
            console.log(`    ✅ Fixed with fallback pattern`);
          } else {
            console.log(`    ⚠️  Could not automatically fix, keeping original`);
            fixedLines.push(line);
          }
        }
      } catch (error) {
        console.log(`    ❌ Error parsing line: ${error.message}`);
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }
  }
  
  return { content: fixedLines.join('\n'), fixCount };
}

async function main() {
  try {
    const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
    const files = findFiles(functionsDir);
    
    console.log(`🔍 Scanning ${files.length} TypeScript files for remaining broken patterns...`);
    
    let totalFixed = 0;
    let filesFixed = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if file has the broken pattern
        if (content.includes('JSON.stringify({ timestamp: new Date().toISOString(')) {
          console.log(`\n🔧 Processing: ${path.relative(process.cwd(), file)}`);
          
          const { content: fixedContent, fixCount } = fixRemainingLogging(content);
          
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
    
    console.log(`\n🎉 COMPLETED ADDITIONAL FIXES:`);
    console.log(`  📁 Files processed: ${filesFixed}`);
    console.log(`  🔧 Additional fixes applied: ${totalFixed}`);
    
    // Check if there are still broken patterns
    const remainingCount = await checkRemainingPatterns();
    
    if (remainingCount === 0) {
      console.log(`\n✅ SUCCESS: All broken logging patterns have been fixed!`);
    } else {
      console.log(`\n⚠️  ${remainingCount} patterns still need manual review`);
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Review changes: git diff');
    console.log('2. Test functions: supabase functions serve');
    console.log('3. Verify clean logs: check a few functions manually');
    console.log('4. Deploy when satisfied: supabase functions deploy');
    
  } catch (error) {
    console.error('❌ Error fixing logging:', error);
    process.exit(1);
  }
}

async function checkRemainingPatterns() {
  try {
    const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
    const files = findFiles(functionsDir);
    
    let remaining = 0;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = [...content.matchAll(/JSON\.stringify\(\{ timestamp: new Date\(\)\.toISOString\(/g)];
      remaining += matches.length;
    }
    
    return remaining;
  } catch {
    return -1;
  }
}

main();