#!/bin/bash

# Safe Repository Cleanup Script
# This script only removes clearly redundant files without breaking functionality

set -e

echo "🧹 Starting safe repository cleanup..."
echo "=================================="

# 1. Remove only the archive folder (safe - these are deprecated)
echo "📁 Removing archived scripts..."
if [ -d "scripts/archive" ]; then
  echo "  - Removing scripts/archive (35 deprecated files)"
  rm -rf scripts/archive
fi

# 2. Remove backup directories in supabase (safe - these are backups)
echo "🗄️  Cleaning up Supabase backups..."
SUPABASE_BACKUPS=(
  "supabase/migrations_archive_20250723_220534"
  "supabase/migrations_backup"
  "supabase/migrations_backup_20250723_044844"
  "supabase/migrations-backup"
  "supabase/config.toml.bak"
)

for backup in "${SUPABASE_BACKUPS[@]}"; do
  if [ -e "$backup" ]; then
    echo "  - Removing $backup"
    rm -rf "$backup"
  fi
done

# 3. Remove empty backups directory
if [ -d "supabase/backups" ] && [ -z "$(ls -A supabase/backups 2>/dev/null)" ]; then
  echo "  - Removing empty supabase/backups"
  rmdir supabase/backups
fi

# 4. Clean up logs (safe - these are just logs)
echo "📊 Cleaning up log files..."
if [ -d "import_logs" ]; then
  echo "  - Removing import_logs directory"
  rm -rf import_logs
fi

if [ -d "deployment_logs" ]; then
  echo "  - Removing deployment_logs directory"
  rm -rf deployment_logs
fi

# 5. Remove GDB directories (safe - these are data files that shouldn't be in git)
echo "💾 Removing GDB data directories..."
if [ -d "Cadastral_Statewide.gdb 2" ]; then
  echo "  - Removing Cadastral_Statewide.gdb 2 (19.8 GB)"
  rm -rf "Cadastral_Statewide.gdb 2"
fi

if [ -d "temp_extract" ]; then
  echo "  - Removing temp_extract directory"
  rm -rf temp_extract
fi

# 6. Remove documentation duplicates from scripts
echo "📄 Moving documentation files..."
DOC_FILES=(
  "scripts/digital-ocean-setup.md"
  "scripts/do-complete-steps.md"
  "scripts/do-terminal-setup.md"
  "scripts/csv-import-optimization.md"
  "scripts/enhanced-automation-pipeline.md"
)

mkdir -p docs/deployment

for doc in "${DOC_FILES[@]}"; do
  if [ -f "$doc" ]; then
    echo "  - Moving $(basename "$doc") to docs/deployment/"
    mv "$doc" "docs/deployment/" 2>/dev/null || true
  fi
done

# 7. Remove specific known duplicate scripts (safe list)
echo "🔄 Removing known duplicate scripts..."
SAFE_TO_REMOVE=(
  "scripts/run-parallel-import-v1-backup.sh"
  "scripts/apply-ai-migration.js"
  "scripts/apply-ai-migrations-sequential.js"
  "scripts/test-import-sample.js"
  "test-fixes.sh"
)

for script in "${SAFE_TO_REMOVE[@]}"; do
  if [ -f "$script" ]; then
    echo "  - Removing $script"
    rm -f "$script"
  fi
done

# 8. Update .gitignore
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Repository cleanup entries
*.gdb
*.gdb/
temp_extract/
CleanedSplit/
import_logs/
deployment_logs/
*.log
repo_backup_*/
supabase/migrations_backup*/
supabase/migrations_archive*/
EOF

# 9. Generate summary
REMOVED_COUNT=$(find . -name "*.removed_by_cleanup" 2>/dev/null | wc -l || echo "0")
echo ""
echo "✅ Safe cleanup completed!"
echo "=================================="
echo ""
echo "Summary:"
echo "  - Removed archive scripts folder"
echo "  - Cleaned up Supabase backups"
echo "  - Removed GDB data directories"
echo "  - Cleaned up log directories"
echo "  - Moved documentation to proper location"
echo "  - Updated .gitignore"
echo ""
echo "⚠️  Next steps:"
echo "  1. Run 'git status' to review changes"
echo "  2. Test with 'pnpm dev' to ensure nothing broke"
echo "  3. Commit changes when ready"