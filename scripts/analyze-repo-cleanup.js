#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const analysis = {
  scripts: {
    migration: [],
    import: [],
    scraper: [],
    utility: [],
    deprecated: [],
    documentation: [],
    testing: []
  },
  data: {
    csv: [],
    gdb: [],
    logs: []
  },
  config: {
    root: [],
    supabase: [],
    deployment: []
  },
  duplicates: [],
  largeFiles: [],
  temporaryFiles: []
};

// Categorize scripts
function categorizeScripts(dir) {
  const scripts = fs.readdirSync(dir);
  
  scripts.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file === 'archive') {
        const archiveFiles = fs.readdirSync(fullPath);
        archiveFiles.forEach(f => {
          analysis.scripts.deprecated.push(path.join('archive', f));
        });
      }
      return;
    }
    
    // Categorize by filename patterns
    if (file.includes('migration') || file.includes('apply-') || file.includes('schema')) {
      analysis.scripts.migration.push(file);
    } else if (file.includes('import') || file.includes('charlotte') || file.includes('parcels')) {
      analysis.scripts.import.push(file);
    } else if (file.includes('scrape') || file.includes('scraper')) {
      analysis.scripts.scraper.push(file);
    } else if (file.includes('test') || file.includes('verify')) {
      analysis.scripts.testing.push(file);
    } else if (file.endsWith('.md') || file.includes('setup')) {
      analysis.scripts.documentation.push(file);
    } else {
      analysis.scripts.utility.push(file);
    }
  });
}

// Check for duplicate functionality
function findDuplicates() {
  const scriptGroups = {
    'import-charlotte': [],
    'apply-migration': [],
    'scrape-florida': [],
    'import-parcels': [],
    'verify': []
  };
  
  const allScripts = [
    ...analysis.scripts.migration,
    ...analysis.scripts.import,
    ...analysis.scripts.scraper,
    ...analysis.scripts.utility,
    ...analysis.scripts.deprecated
  ];
  
  allScripts.forEach(script => {
    Object.keys(scriptGroups).forEach(pattern => {
      if (script.includes(pattern.replace('-', '-'))) {
        scriptGroups[pattern].push(script);
      }
    });
  });
  
  Object.entries(scriptGroups).forEach(([pattern, scripts]) => {
    if (scripts.length > 1) {
      analysis.duplicates.push({
        pattern,
        count: scripts.length,
        files: scripts
      });
    }
  });
}

// Analyze data directories
function analyzeDataDirs() {
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    walkDir(dataDir, (file, stat) => {
      if (file.endsWith('.csv')) {
        analysis.data.csv.push({
          path: path.relative(process.cwd(), file),
          size: (stat.size / 1024 / 1024).toFixed(2) + ' MB'
        });
      }
    });
  }
  
  // Check for GDB files
  const gdbDirs = ['Cadastral_Statewide.gdb 2', 'temp_extract/Cadastral_Statewide.gdb'];
  gdbDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const size = getDirSize(fullPath);
      analysis.data.gdb.push({
        path: dir,
        size: (size / 1024 / 1024).toFixed(2) + ' MB'
      });
    }
  });
  
  // Check logs
  const logDirs = ['import_logs', 'deployment_logs'];
  logDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        const stat = fs.statSync(path.join(fullPath, file));
        analysis.data.logs.push({
          path: path.join(dir, file),
          size: (stat.size / 1024).toFixed(2) + ' KB'
        });
      });
    }
  });
}

// Analyze root config files
function analyzeRootConfigs() {
  const rootFiles = fs.readdirSync(process.cwd());
  
  rootFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      // SQL files at root
      if (file.endsWith('.sql')) {
        analysis.config.root.push({
          file,
          type: 'SQL',
          shouldMove: true,
          suggestedLocation: 'supabase/migrations/'
        });
      }
      // Test files at root
      else if (file.includes('test') && (file.endsWith('.js') || file.endsWith('.sh'))) {
        analysis.config.root.push({
          file,
          type: 'Test',
          shouldMove: true,
          suggestedLocation: 'scripts/tests/'
        });
      }
      // Deployment configs
      else if (file.includes('vercel') || file.includes('sentry')) {
        analysis.config.deployment.push(file);
      }
    }
  });
}

// Analyze Supabase structure
function analyzeSupabase() {
  const supabaseDir = path.join(process.cwd(), 'supabase');
  
  // Check for backup/archive folders
  const dirs = fs.readdirSync(supabaseDir);
  dirs.forEach(dir => {
    if (dir.includes('backup') || dir.includes('archive')) {
      const fullPath = path.join(supabaseDir, dir);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const size = getDirSize(fullPath);
        analysis.config.supabase.push({
          type: 'backup',
          path: dir,
          size: (size / 1024 / 1024).toFixed(2) + ' MB',
          recommendation: 'Remove or move to external backup'
        });
      }
    }
  });
}

// Find large files
function findLargeFiles() {
  walkDir(process.cwd(), (file, stat) => {
    if (stat.size > 10 * 1024 * 1024) { // Files > 10MB
      analysis.largeFiles.push({
        path: path.relative(process.cwd(), file),
        size: (stat.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    }
  });
}

// Helper functions
function walkDir(dir, callback) {
  if (shouldSkipDir(dir)) return;
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, callback);
      } else {
        callback(fullPath, stat);
      }
    });
  } catch (e) {
    // Skip permission errors
  }
}

function shouldSkipDir(dir) {
  const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.turbo'];
  return skipDirs.some(skip => dir.includes(skip));
}

function getDirSize(dir) {
  let size = 0;
  walkDir(dir, (file, stat) => {
    size += stat.size;
  });
  return size;
}

// Generate recommendations
function generateRecommendations() {
  const recommendations = [];
  
  // Scripts recommendations
  if (analysis.scripts.deprecated.length > 0) {
    recommendations.push({
      category: 'Scripts',
      issue: `Found ${analysis.scripts.deprecated.length} archived scripts`,
      action: 'Remove scripts/archive folder',
      impact: 'Reduce clutter'
    });
  }
  
  analysis.duplicates.forEach(dup => {
    if (dup.count > 3) {
      recommendations.push({
        category: 'Scripts',
        issue: `${dup.count} scripts with "${dup.pattern}" pattern`,
        action: `Consolidate to single script or remove old versions`,
        files: dup.files
      });
    }
  });
  
  // Data recommendations
  if (analysis.data.gdb.length > 0) {
    const totalSize = analysis.data.gdb.reduce((sum, item) => 
      sum + parseFloat(item.size), 0);
    recommendations.push({
      category: 'Data',
      issue: `GDB directories using ${totalSize.toFixed(2)} MB`,
      action: 'Remove or gitignore GDB data files',
      files: analysis.data.gdb.map(g => g.path)
    });
  }
  
  // Config recommendations
  if (analysis.config.root.filter(c => c.shouldMove).length > 0) {
    recommendations.push({
      category: 'Organization',
      issue: 'SQL and test files at root level',
      action: 'Move to appropriate subdirectories',
      files: analysis.config.root.filter(c => c.shouldMove)
    });
  }
  
  // Supabase recommendations
  analysis.config.supabase.forEach(item => {
    recommendations.push({
      category: 'Supabase',
      issue: `${item.type} directory using ${item.size}`,
      action: item.recommendation,
      path: item.path
    });
  });
  
  // Large files
  if (analysis.largeFiles.length > 0) {
    recommendations.push({
      category: 'Large Files',
      issue: `${analysis.largeFiles.length} files over 10MB`,
      action: 'Review and gitignore if appropriate',
      files: analysis.largeFiles
    });
  }
  
  return recommendations;
}

// Run analysis
console.log('🔍 Analyzing repository structure...\n');

categorizeScripts(path.join(process.cwd(), 'scripts'));
findDuplicates();
analyzeDataDirs();
analyzeRootConfigs();
analyzeSupabase();
findLargeFiles();

const recommendations = generateRecommendations();

// Output results
console.log('📊 Repository Analysis Results\n');
console.log('='.repeat(50));

console.log('\n📁 Scripts Summary:');
console.log(`  Migration scripts: ${analysis.scripts.migration.length}`);
console.log(`  Import scripts: ${analysis.scripts.import.length}`);
console.log(`  Scraper scripts: ${analysis.scripts.scraper.length}`);
console.log(`  Testing scripts: ${analysis.scripts.testing.length}`);
console.log(`  Utility scripts: ${analysis.scripts.utility.length}`);
console.log(`  Documentation: ${analysis.scripts.documentation.length}`);
console.log(`  Archived/Deprecated: ${analysis.scripts.deprecated.length}`);

if (analysis.duplicates.length > 0) {
  console.log('\n🔄 Duplicate Patterns Found:');
  analysis.duplicates.forEach(dup => {
    console.log(`  ${dup.pattern}: ${dup.count} files`);
  });
}

console.log('\n💾 Data Files:');
console.log(`  CSV files: ${analysis.data.csv.length}`);
console.log(`  GDB directories: ${analysis.data.gdb.length}`);
console.log(`  Log files: ${analysis.data.logs.length}`);

console.log('\n⚙️  Configuration:');
console.log(`  Root-level configs to move: ${analysis.config.root.filter(c => c.shouldMove).length}`);
console.log(`  Deployment configs: ${analysis.config.deployment.length}`);
console.log(`  Supabase backups: ${analysis.config.supabase.length}`);

console.log('\n📈 Large Files: ${analysis.largeFiles.length}');

console.log('\n\n🎯 Recommendations:');
console.log('='.repeat(50));

recommendations.forEach((rec, index) => {
  console.log(`\n${index + 1}. [${rec.category}] ${rec.issue}`);
  console.log(`   Action: ${rec.action}`);
  if (rec.files) {
    if (Array.isArray(rec.files) && rec.files.length > 3) {
      console.log(`   Files: ${rec.files.slice(0, 3).join(', ')} ... and ${rec.files.length - 3} more`);
    } else if (rec.files) {
      console.log(`   Files: ${JSON.stringify(rec.files, null, 2)}`);
    }
  }
  if (rec.path) {
    console.log(`   Path: ${rec.path}`);
  }
});

// Summary
const potentialRemovals = 
  analysis.scripts.deprecated.length +
  analysis.data.gdb.length +
  analysis.config.supabase.length +
  analysis.config.root.filter(c => c.shouldMove).length;

console.log('\n\n📊 Summary:');
console.log('='.repeat(50));
console.log(`Total potential removals: ${potentialRemovals} items`);
console.log(`Duplicate script patterns: ${analysis.duplicates.length}`);
console.log(`Large files to review: ${analysis.largeFiles.length}`);

// Export detailed report
const report = {
  timestamp: new Date().toISOString(),
  analysis,
  recommendations,
  summary: {
    totalScripts: Object.values(analysis.scripts).flat().length,
    potentialRemovals,
    duplicatePatterns: analysis.duplicates.length,
    largeFiles: analysis.largeFiles.length
  }
};

fs.writeFileSync(
  path.join(process.cwd(), 'REPO_CLEANUP_ANALYSIS.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Detailed report saved to REPO_CLEANUP_ANALYSIS.json');