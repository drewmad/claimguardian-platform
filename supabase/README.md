# Supabase Schema

This directory contains the complete database schema for ClaimGuardian.

## Single Source of Truth

**`schema.sql`** - The complete database schema dumped from production. This is the single source of truth for our database structure.

## Approach

We use a single schema file approach instead of migrations because:

1. **Simplicity** - One file to manage instead of dozens of migration files
2. **Clarity** - See the entire schema at once
3. **No Migration Conflicts** - Avoid Supabase CLI migration history issues
4. **Easy Deployment** - Just run the schema file on a fresh database

## Usage

### Deploy to New Database
```bash
# Create a new Supabase project and run:
psql $DATABASE_URL -f supabase/schema.sql
```

### Update Schema
1. Make changes in development/staging
2. Test thoroughly
3. Dump the new schema:
   ```bash
   supabase db dump --schema public > supabase/schema.sql
   ```
4. Commit the updated schema file

### Local Development
```bash
# Start local Supabase
supabase start

# Apply schema
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/schema.sql
```

## Schema Overview

The schema includes:

- **Core Tables**: users, properties, claims, policies, etc.
- **Property Hierarchy**: properties → land, structures, systems, insurance, damage, contractors
- **Security**: Row-Level Security (RLS) on all user data
- **Performance**: Optimized indexes and materialized views
- **Audit**: Update triggers and versioning capabilities

## Archived Migrations

Previous migration files are archived in:
- `migrations_archive_*` - Historical migrations for reference
- `migrations_backup_*` - Backup folders from previous approaches

These are kept for historical reference but are not used for deployment.