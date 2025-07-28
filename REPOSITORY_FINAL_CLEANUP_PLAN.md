# Repository Final Cleanup Plan

Based on comprehensive analysis, here's the cleanup plan for the entire repository:

## 1. Scripts Folder (157 files)
### Issues Found:
- 35 archived scripts in `scripts/archive/`
- 21 duplicate Charlotte import scripts
- 25 redundant migration scripts
- 5 duplicate scraper scripts
- 8 duplicate verification scripts

### Actions:
```bash
# Remove archive folder
rm -rf scripts/archive/

# Remove duplicate import scripts
rm -f scripts/charlotte-simple-import.js
rm -f scripts/phase1-charlotte-*.js
rm -f scripts/extract-charlotte-*.sh
rm -f scripts/import-cleaned-split-*.js
rm -f scripts/import-florida-parcels-csv.js
rm -f scripts/import-florida-parcels-streaming.js
rm -f scripts/import-parcels-batch.js
rm -f scripts/import-remaining-fast.js
rm -f scripts/import-subset.js

# Remove old migration scripts (keep only essential ones)
rm -f scripts/apply-ai-migration*.js
rm -f scripts/apply-column-enhancements.js
rm -f scripts/apply-critical-fixes.js
rm -f scripts/apply-csv-import-*.js
rm -f scripts/apply-final-enhancements.js
rm -f scripts/apply-fixes-via-api.js
rm -f scripts/apply-florida-counties-*.js
rm -f scripts/apply-florida-parcels-*.js
rm -f scripts/apply-inventory-migrations.js
rm -f scripts/apply-learnings.js
rm -f scripts/apply-parcels-*.js
rm -f scripts/apply-property-schema.*
rm -f scripts/apply-remaining-schema.sh
rm -f scripts/apply-schema-direct.js
rm -f scripts/apply-single-table-merge.js
rm -f scripts/apply-uppercase-*.js
```

## 2. Data Directories (~40GB)
### Issues Found:
- `Cadastral_Statewide.gdb 2/` - 19.8 GB
- `temp_extract/Cadastral_Statewide.gdb/` - 19.8 GB
- `CleanedSplit/` - 73 CSV files
- `data/charlotte_county/` - Large CSV files

### Actions:
```bash
# Remove GDB directories
rm -rf "Cadastral_Statewide.gdb 2"
rm -rf temp_extract/

# Remove CSV split files (keep original if needed)
rm -rf CleanedSplit/

# Add to .gitignore
echo "*.gdb/" >> .gitignore
echo "*.gdb" >> .gitignore
echo "CleanedSplit/" >> .gitignore
echo "temp_extract/" >> .gitignore
```

## 3. Supabase Organization
### Issues Found:
- 5 backup/archive directories
- Multiple migration folders with duplicates
- Redundant schema files

### Actions:
```bash
# Remove backup directories
rm -rf supabase/migrations_archive_20250723_220534/
rm -rf supabase/migrations_backup/
rm -rf supabase/migrations_backup_20250723_044844/
rm -rf supabase/migrations-backup/
rm -rf supabase/config.toml.bak

# Archive old migrations
mkdir -p supabase/migrations_archive
mv supabase/migrations_ai/* supabase/migrations_archive/ 2>/dev/null || true
mv supabase/migrations_consolidated/* supabase/migrations_archive/ 2>/dev/null || true
```

## 4. Root Level Files
### Issues Found:
- 9 SQL files at root level
- 2 test files at root
- Multiple deployment configs scattered

### Actions:
```bash
# Create organized structure
mkdir -p supabase/sql-archive
mkdir -p scripts/tests

# Move SQL files
mv *.sql supabase/sql-archive/ 2>/dev/null || true

# Move test files
mv test-*.sh scripts/tests/ 2>/dev/null || true
mv test-*.js scripts/tests/ 2>/dev/null || true

# Keep essential root files
# Keep: package.json, tsconfig.json, turbo.json, vercel.json, README.md, etc.
```

## 5. Documentation Organization
### Issues Found:
- Deployment docs in scripts folder
- AI context scattered
- Missing clear documentation structure

### Actions:
```bash
# Documentation already organized in previous steps:
# - docs/deployment/ - deployment guides
# - docs/florida-platform/ - Florida platform docs
# - .ai-context/ - AI context files
# - docs/architecture/ - architecture docs
```

## 6. Large Files & Logs
### Issues Found:
- 87 files over 10MB
- Import logs taking space
- Deployment logs accumulating

### Actions:
```bash
# Clean up logs
rm -rf import_logs/
rm -rf deployment_logs/

# Add to .gitignore
echo "import_logs/" >> .gitignore
echo "deployment_logs/" >> .gitignore
echo "*.log" >> .gitignore
```

## Summary Impact
- **Files to remove**: ~200 files
- **Space to recover**: ~40 GB
- **Repository structure**: Significantly improved
- **Build performance**: Faster due to less files

## Execution Order
1. Backup important files first
2. Clean scripts folder
3. Remove large data directories
4. Organize Supabase structure
5. Clean root level
6. Update .gitignore
7. Commit changes
8. Verify application still works

## Post-Cleanup Checklist
- [ ] Run `pnpm install` to ensure dependencies work
- [ ] Run `pnpm build` to verify build succeeds
- [ ] Run `pnpm test` to ensure tests pass
- [ ] Deploy to staging to verify deployment
- [ ] Update CI/CD if needed