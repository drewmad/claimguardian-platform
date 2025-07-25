# How to Safely Delete Old Migrations

## Your Current Situation
- **Remote DB**: Has old migrations applied (20240107, 20250116, etc.)
- **Local**: Has new consolidated migrations (20240101_000001, etc.)
- **Backups**: Old migrations saved in `migrations_backup_20250723_044844/`

## Option 1: Reset Remote Database (CLEANEST - if data loss is acceptable)

```bash
# 1. Backup any important data
supabase db dump --data-only > production_data_backup.sql

# 2. Reset remote database
# WARNING: This will DELETE all data!
supabase db reset --linked

# 3. Your new migrations will be applied fresh
supabase db push

# 4. Restore data if needed
psql "$DATABASE_URL" < production_data_backup.sql
```

## Option 2: Create a Baseline (RECOMMENDED - preserves data)

```bash
# 1. Delete your new local migrations temporarily
mv supabase/migrations/*.sql supabase/migrations_new/

# 2. Pull current remote state as baseline
supabase db pull

# 3. This creates ONE migration with entire current schema
# Look for something like: 20250723120000_remote_schema.sql

# 4. Now you can delete old migrations from remote tracking
supabase db push --dry-run  # See what would happen

# 5. Clear remote migration history (connect to remote DB)
psql "$DATABASE_URL" -c "TRUNCATE supabase_migrations.schema_migrations;"

# 6. Apply baseline
supabase db push
```

## Option 3: Squash Everything (SAFEST - gradual transition)

```bash
# 1. Connect to remote database
psql "$DATABASE_URL"

# 2. Check current migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;

# 3. Create a "squash point" migration
supabase migration new squash_point_july_2025

# 4. Add this content:
-- This migration represents the complete schema as of July 2025
-- All previous migrations have been consolidated
-- No actual changes are made here

# 5. Push this marker
supabase db push

# 6. Now in future, you can reference everything before this as "pre-squash"
```

## Option 4: Manual Migration Table Cleanup (ADVANCED)

```sql
-- Connect to remote database
psql "$DATABASE_URL"

-- View current migrations
SELECT * FROM supabase_migrations.schema_migrations;

-- Remove old migration records
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN ('00', '01', '02', '20240107', ...);

-- Insert your new baseline
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES ('20240101_000001_initial_schema');
```

## Best Path Forward for You

Given your situation, I recommend **Option 2 (Baseline)**:

1. **Keep your new consolidated migrations safe**
   ```bash
   mkdir supabase/migrations_consolidated
   cp supabase/migrations/*.sql supabase/migrations_consolidated/
   ```

2. **Clear migrations folder**
   ```bash
   rm supabase/migrations/*.sql
   ```

3. **Create baseline from remote**
   ```bash
   supabase db pull
   ```

4. **This gives you a fresh start**
   - One migration file with entire current schema
   - No conflicts with remote
   - Can continue development from here

5. **Your beautiful consolidated migrations**
   - Keep them as reference
   - Use them for new projects
   - Or for documentation

## Going Forward

### DO:
- Keep migrations small and focused
- Test locally with `supabase db reset`
- Use baseline approach when consolidating
- Backup before major changes

### DON'T:
- Delete migrations that production depends on
- Change migration files after they're applied
- Skip testing migration changes
- Delete without backing up first

## Quick Decision Tree

```
Has production data? 
├─ Yes → Use Baseline (Option 2)
└─ No → Reset Database (Option 1)

Need gradual transition?
├─ Yes → Squash Point (Option 3)
└─ No → Baseline (Option 2)

Comfortable with SQL?
├─ Yes → Manual Cleanup (Option 4)
└─ No → Baseline (Option 2)
```