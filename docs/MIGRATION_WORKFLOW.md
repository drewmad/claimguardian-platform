# Database Migration Workflow

This guide documents the best practices for database migrations in ClaimGuardian using Supabase CLI.

## Prerequisites

- Supabase CLI installed
- Local Supabase instance running (`supabase start`)
- Project linked to remote database (`supabase link`)

## Quick Commands

```bash
# Generate types from database
cd apps/web && pnpm db:types          # From production
cd apps/web && pnpm db:types:local    # From local

# Database operations
pnpm db:diff        # Show differences between local and remote
pnpm db:lint        # Lint schema for errors
pnpm db:push:dry    # Preview what would be pushed
pnpm db:dump        # Backup current schema
pnpm db:status      # Check migration status
pnpm db:validate    # Run full validation suite
```

## Migration Workflow

### 1. Before Making Changes

Always ensure your local environment is in sync:

```bash
# Check current status
cd apps/web && pnpm db:status

# Pull latest changes if needed
supabase db pull

# Validate current state
./scripts/db-validate.sh
```

### 2. Creating a New Migration

```bash
# Create migration file
supabase migration new descriptive_name

# Edit the migration file
code supabase/migrations/[timestamp]_descriptive_name.sql
```

### 3. Testing Locally

```bash
# Apply migration locally
supabase db reset

# Verify changes
supabase db lint --local
cd apps/web && pnpm db:types:local

# Test your application
pnpm dev
```

### 4. Type Generation

Types are automatically generated during:
- Pre-commit hooks (if Supabase is running)
- CI/CD pipeline (on migration changes)
- Manual generation with `pnpm db:types`

**Important**: Always commit generated type changes with your migration.

### 5. Pushing to Production

```bash
# Preview what will be pushed
cd apps/web && pnpm db:push:dry

# Push migrations
supabase db push

# Generate production types
pnpm db:types

# Commit type changes
git add packages/db/src/types/database.types.ts
git commit -m "chore: update database types"
```

## Common Issues and Solutions

### Issue: Migration Conflicts

**Symptom**: Migrations fail due to conflicting changes

**Solution**:
```bash
# Check migration history
supabase migration list

# Repair if needed
supabase migration repair --status applied

# Or reset and reapply
supabase db reset
```

### Issue: Type Generation Fails

**Symptom**: `pnpm db:types` errors

**Solution**:
```bash
# Ensure you're linked
supabase link --project-ref tmlrvecuwgppbaynesji

# Check credentials
echo $SUPABASE_ACCESS_TOKEN

# Try with explicit project
supabase gen types typescript --project-id tmlrvecuwgppbaynesji
```

### Issue: Schema Drift

**Symptom**: Local and remote schemas out of sync

**Solution**:
```bash
# See differences
supabase db diff --linked

# Pull remote changes
supabase db pull

# Or push local changes
supabase db push
```

### Issue: Lint Errors

**Symptom**: `db:lint` finds schema issues

**Solution**:
```bash
# Run with details
supabase db lint --local --level warning

# Common fixes:
# - Add missing indexes on foreign keys
# - Remove unused indexes
# - Fix function syntax errors
# - Add proper role permissions
```

## Best Practices

### 1. Migration Naming

Use descriptive names with underscores:
- ✅ `create_user_profiles_table`
- ✅ `add_property_search_index`
- ❌ `fix`
- ❌ `update-schema`

### 2. Migration Content

- One logical change per migration
- Include rollback statements when possible
- Add comments explaining complex changes
- Always consider existing data

### 3. Testing

- Test migrations on a fresh database (`supabase db reset`)
- Verify with `db:lint` before committing
- Check generated types compile correctly
- Test application functionality

### 4. Type Safety

- Never edit `database.types.ts` manually
- Commit type changes with migrations
- Use the generated types in your code:

```typescript
import { Database, Tables } from '@claimguardian/db'

type Property = Tables<'properties'>
type ClaimStatus = Database['public']['Enums']['claim_status']
```

### 5. Backup Strategy

Before major changes:
```bash
# Backup schema
pnpm db:dump

# Backup data (if needed)
supabase db dump --data-only -f backup-data.sql

# Tag the commit
git tag pre-migration-backup
```

## CI/CD Integration

The GitHub Actions workflow automatically:
1. Generates types when migrations change
2. Creates a PR if types are outdated
3. Runs on a weekly schedule for drift detection

To trigger manually:
```bash
gh workflow run database-types.yml
```

## Troubleshooting Checklist

- [ ] Is Supabase running? (`supabase status`)
- [ ] Are you in the correct directory? (`cd apps/web`)
- [ ] Is the project linked? (`supabase link`)
- [ ] Are credentials set? (`echo $SUPABASE_ACCESS_TOKEN`)
- [ ] Is the schema valid? (`pnpm db:lint`)
- [ ] Are types up to date? (`pnpm db:types:local`)

## Emergency Procedures

### Rollback a Migration

```bash
# Identify the problematic migration
supabase migration list

# Create a rollback migration
supabase migration new rollback_[original_name]

# Write the rollback SQL
# Then push
supabase db push
```

### Reset Remote Database

⚠️ **DANGER**: This will delete all data!

```bash
# Backup everything first
supabase db dump --data-only -f production-backup.sql

# Reset (requires confirmation)
supabase db reset --linked
```

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Best Practices](https://supabase.com/docs/guides/cli/managing-environments)
- [Type Generation Guide](https://supabase.com/docs/guides/api/generating-types)