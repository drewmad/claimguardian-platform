# Repository Reorganization Guide

## 🎯 Overview

The ClaimGuardian repository has been comprehensively reorganized to improve maintainability, reduce clutter, and provide better separation of concerns. This guide explains the changes and how to work with the new structure.

## 📁 New Repository Structure

### Before vs After

**Before (Old Structure):**

```
ClaimGuardian/
├── many scattered files in root/
├── edge_functions/
├── data_integrations/
├── scraper/
├── tools/
├── scripts/ (deeply nested)
└── supabase/ (cluttered)
```

**After (New Structure):**

```
ClaimGuardian/
├── services/              # External services
├── scripts/               # Simplified core scripts
├── config/                # Centralized configuration
├── data/                  # Organized data
├── archives/              # Historical files
├── apps/web/              # Next.js app (unchanged)
├── packages/              # Shared packages (cleaned)
└── supabase/              # Clean database structure
```

## 🚀 Key Changes

### 1. Services Organization

- **Moved**: `scraper/` → `services/scraper/`
- **Moved**: `data_integrations/` → `services/integrations/`
- **Archived**: `edge_functions/` → `archives/legacy/edge_functions/` (now in `supabase/functions/`)

### 2. Script Simplification

**New Core Scripts:**

- `./scripts/dev.sh` - Development utilities (setup, clean, lint)
- `./scripts/build.sh` - Build operations (all, web, packages)
- `./scripts/data.sh` - Data management (import, verify, clean)
- `./scripts/db.sh` - Database operations (schema, backup, migrate)

**Complex Scripts Moved:**

- All automation, data-import, and database scripts moved to `scripts/utils/`

### 3. Configuration Centralization

- **Created**: `config/` directory
- **Moved**: Environment examples to `config/environments/`
- **Moved**: CI/CD configs to `config/ci/`
- **Added**: Central environment loader (`config/load-env.js`)

### 4. Data Organization

- **Created**: `data/` structure with `samples/`, `schemas/`, `florida/`
- **Archived**: Large datasets moved to `archives/data/large_datasets/`
- **Moved**: Sample data to appropriate locations

### 5. Archive System

- **Created**: Comprehensive `archives/` structure
- **Archived**: Historical migrations, old scripts, legacy configs
- **Preserved**: All functionality while reducing active directory clutter

## 📋 Migration Guide for Developers

### Updated Commands

**Old → New Script Commands:**

```bash
# Old way
./scripts/run-parallel-import.sh
python scripts/analyze_cadastral_gdb.py

# New way (simplified)
./scripts/data.sh import
./scripts/data.sh verify

# Or direct access to utils
./scripts/utils/data-import/run-parallel-import.sh
python ./scripts/utils/data-import/analyze_cadastral_gdb.py
```

**Development Commands:**

```bash
# Quick development operations
./scripts/dev.sh setup      # Setup environment
./scripts/dev.sh clean      # Clean artifacts
./scripts/dev.sh lint       # Smart lint fix

# Build operations
./scripts/build.sh all      # Build everything
./scripts/build.sh web      # Web app only
./scripts/build.sh packages # Packages only

# Database operations
./scripts/db.sh schema dump     # Export schema
./scripts/db.sh schema apply    # Apply schema
./scripts/db.sh backup          # Create backup
```

### Path Updates

**Import Paths (if any):**

- Services moved: Update any references to `scraper/` or `data_integrations/`
- Scripts moved: Update any references to direct script paths

**Configuration:**

- Environment files now in `config/environments/`
- Use `config/load-env.js` for centralized environment loading

## 🛠️ Development Workflow Changes

### 1. Working with Scripts

```bash
# Use core scripts for common operations
./scripts/dev.sh setup  # Instead of multiple setup commands
./scripts/data.sh import # Instead of remembering complex import paths

# For advanced operations, scripts are in utils
./scripts/utils/automation/
./scripts/utils/data-import/
./scripts/utils/database/
```

### 2. Configuration Management

```bash
# Environment variables
cp config/environments/.env.example .env.local

# Use centralized loader in code
const env = require('./config/load-env');
```

### 3. Data Management

```bash
# Sample data is organized
ls data/samples/           # Development datasets
ls data/schemas/           # Data schemas
ls data/florida/           # Florida-specific data

# Large datasets are archived (not in git)
ls archives/data/large_datasets/
```

## 📚 Documentation Updates

### Updated Files

- `CLAUDE.md` - Updated with new structure and commands
- `README.md` - Updated with new workflow
- Individual package `README.md` files - Standardized documentation

### New Documentation

- `supabase/README.md` - Comprehensive Supabase architecture guide
- `data/README.md` - Data organization guide
- Service-specific READMEs in services directories

## 🔧 Troubleshooting

### Common Issues After Reorganization

**1. Script Not Found**

```bash
# Error: ./scripts/some-script.sh not found
# Solution: Check if it's in utils or archives
find scripts -name "*some-script*"
find archives -name "*some-script*"
```

**2. Import Path Issues**

```bash
# Run the path migration script
node scripts/migrate-paths.js
```

**3. Environment Variables**

```bash
# Use the new centralized loader
const env = require('./config/load-env');
```

**4. CI/CD Pipeline Issues**

- CI configs moved to `config/ci/`
- Workflows automatically symlinked to `.github/workflows/`

## 🎉 Benefits of New Structure

### For Developers

- **Cleaner Navigation**: Intuitive directory structure
- **Faster Operations**: Simplified core scripts
- **Better Organization**: Clear separation of concerns
- **Reduced Confusion**: Less root directory clutter

### For Maintenance

- **Easier Updates**: Centralized configuration
- **Better History**: Archived historical files without losing them
- **Cleaner Git**: Organized structure for future development
- **Improved Testing**: Clear separation of test environments

### For New Team Members

- **Intuitive Structure**: Easy to understand organization
- **Clear Documentation**: Comprehensive guides for each area
- **Standard Patterns**: Consistent organization throughout

## 🚨 Important Notes

1. **All Functionality Preserved**: No features were removed, only reorganized
2. **Git History Intact**: All file history preserved through moves
3. **Backwards Compatibility**: Archive structure maintains access to old files
4. **Gradual Migration**: Old paths archived but accessible during transition

## 📞 Support

If you encounter issues with the new structure:

1. **Check Archives**: Old files are in `archives/` with `.gitkeep` files
2. **Use Migration Script**: Run `node scripts/migrate-paths.js`
3. **Consult Documentation**: Updated `CLAUDE.md` and service READMEs
4. **Ask Questions**: Team lead can help with specific migration issues

---

**Next Steps:**

1. Pull the latest changes: `git pull origin main`
2. Run setup: `./scripts/dev.sh setup`
3. Test your workflow with new commands
4. Update any local scripts or bookmarks
5. Enjoy the cleaner, more organized repository! 🎉
