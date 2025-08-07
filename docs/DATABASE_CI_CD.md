# Database CI/CD Documentation

## Overview

ClaimGuardian uses an advanced database CI/CD pipeline that automatically validates, tests, and deploys schema changes. This ensures database changes are as safe and automated as application code changes.

## Architecture

### Single Schema Approach
- **Source of Truth**: `supabase/schema.sql`
- **No Migrations**: We use a single schema file to avoid Supabase CLI conflicts
- **Version Control**: All changes tracked in Git with full history

### CI/CD Workflows

#### 1. Database CI (`database-ci.yml`) - Free Tier
- Runs on every PR that modifies database files
- Uses local PostgreSQL for validation
- Auto-approves safe changes
- Blocks breaking changes without manual approval

#### 2. Database Review (`database-review.yml`) - Pro Tier
- Creates isolated branch databases for testing
- Tests schema changes in real Supabase environment
- Validates Edge Functions against new schema
- Provides detailed PR comments with analysis

## Workflow Process

### 1. Developer Makes Schema Changes
```bash
# Edit schema
vim supabase/schema.sql

# Validate locally
./scripts/db.sh schema validate

# Create PR
git checkout -b feat/new-schema
git commit -m "feat: add new tables for X feature"
git push origin feat/new-schema
```

### 2. Automated PR Validation
When you create a PR, the CI automatically:

1. **Detects Changes**: Identifies what changed in schema.sql
2. **Safety Analysis**:
   - ✅ Safe changes (ADD): Auto-approved
   - ❌ Breaking changes (DROP): Requires manual approval
3. **Best Practices Check**:
   - Tables without RLS policies
   - Missing indexes on foreign keys
   - Dangerous operations
4. **Branch Database** (Pro only):
   - Creates isolated test environment
   - Applies schema changes
   - Tests Edge Functions

### 3. PR Review Process

#### For Safe Changes:
- CI adds `database-auto-approved` label
- PR can be merged immediately
- Comment shows change summary

#### For Breaking Changes:
- CI blocks merge
- Requires `database-migration-approved` label
- Review includes:
  - Data loss warnings
  - Migration guide
  - Rollback plan

### 4. Post-Merge Deployment
After merge to main:
1. Schema automatically applied to staging (if configured)
2. Production deployment requires manual trigger
3. TypeScript types regenerated

## GitHub Setup

### Required Secrets
```bash
SUPABASE_ACCESS_TOKEN    # From: npx supabase login
SUPABASE_PROJECT_ID      # Your project ID
SUPABASE_DB_PASSWORD     # Database password (Pro only)
STAGING_DATABASE_URL     # Optional staging environment
```

### Required Labels
Run this script to create labels:
```bash
./scripts/setup-database-labels.sh
```

Creates:
- `database-auto-approved` (green) - Safe changes
- `database-migration-approved` (red) - Manual approval
- `database-changes` (blue) - Contains DB changes

## Local Development

### Validate Schema
```bash
# Check if schema is valid
./scripts/db.sh schema validate

# Compare with production
./scripts/db.sh schema diff production.sql local.sql
```

### Apply Schema
```bash
# Apply to local database
./scripts/db.sh schema apply

# Generate TypeScript types
pnpm db:generate-types
```

### Create Backup
```bash
# Before major changes
./scripts/db.sh backup
```

## Best Practices

### 1. Always Test Locally First
```bash
# Validate before committing
./scripts/db.sh schema validate
```

### 2. Use Descriptive PR Titles
```
feat: add user_preferences table with RLS
fix: add missing index on properties.user_id
breaking: remove deprecated claims_old table
```

### 3. Include RLS Policies
Every new table should have RLS:
```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own data" ON my_table
  FOR SELECT USING (auth.uid() = user_id);
```

### 4. Add Indexes for Foreign Keys
```sql
CREATE INDEX idx_my_table_user_id ON my_table(user_id);
```

### 5. Document Breaking Changes
Include migration instructions in PR:
```markdown
## Migration Guide
1. Backup data from old_table
2. Run migration script
3. Verify data integrity
```

## Troubleshooting

### CI Fails with "Schema application failed"
- Check syntax errors in schema.sql
- Verify all extensions are created
- Check for circular dependencies

### "Tables without RLS" warning
- Add RLS policies for new tables
- Or explicitly document why RLS isn't needed

### Branch database creation fails
- Verify Supabase Pro subscription
- Check SUPABASE_ACCESS_TOKEN is valid
- Ensure project has available branches

## Emergency Procedures

### Rollback Schema
```bash
# Restore from backup
./scripts/db.sh backup restore <backup-file>

# Or revert Git commit
git revert <commit-hash>
./scripts/db.sh schema apply
```

### Skip CI Temporarily
Add `[skip ci]` to commit message:
```bash
git commit -m "fix: emergency schema fix [skip ci]"
```

## Future Enhancements

1. **Automated Performance Testing**: Run query benchmarks
2. **Data Migration Scripts**: Automated data transformation
3. **Schema Versioning**: Tagged releases for schema versions
4. **Rollback Automation**: One-click schema rollback
5. **Multi-Environment Support**: Dev/Staging/Prod pipelines
