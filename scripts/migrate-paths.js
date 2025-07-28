#!/usr/bin/env node
// Update import paths after reorganization
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pathMappings = {
  '../../../ai/agents/': '../../../ai/agents/',
  '../../ai/context/': '../../ai/context/',
  '../services/workers/': '../services/workers/',
  './services/scraper/': './services/scraper/',
  './services/integrations/': './services/integrations/',
  './archives/legacy/tools/': './archives/legacy/tools/',
  // Add more mappings as needed
};

console.log('🔄 Updating import paths after reorganization...');

try {
  // Get all TypeScript and JavaScript files
  const files = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v archives', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  let totalUpdated = 0;

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let updated = content;
      let fileUpdated = false;
      
      Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
        const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (updated.includes(oldPath)) {
          updated = updated.replace(regex, newPath);
          fileUpdated = true;
        }
      });
      
      if (fileUpdated && content !== updated) {
        fs.writeFileSync(file, updated);
        console.log(`✅ Updated: ${file}`);
        totalUpdated++;
      }
    } catch (error) {
      console.warn(`⚠️  Could not process ${file}: ${error.message}`);
    }
  });

  console.log(`\n🎉 Migration complete! Updated ${totalUpdated} files.`);
  
  if (totalUpdated > 0) {
    console.log('\n📝 Next steps:');
    console.log('1. Run: pnpm type-check');
    console.log('2. Run: pnpm lint');  
    console.log('3. Test your application');
    console.log('4. Commit changes when ready');
  }
} catch (error) {
  console.error('❌ Error during path migration:', error.message);
  process.exit(1);
}