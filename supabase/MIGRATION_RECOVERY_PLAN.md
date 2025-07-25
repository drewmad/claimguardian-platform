# Migration Recovery Plan

## Current Situation
- Remote database has old migrations applied
- Local has new consolidated migrations
- Cannot push due to conflicts

## Recommended Solution: Baseline Approach

### Step 1: Create Current State Baseline
```bash
# Pull current remote schema as baseline
supabase db pull --schema public,core,security,external,external_florida

# This will create a new migration file with timestamp
```

### Step 2: Clear Migration History (Carefully)
```bash
# Connect to remote database
supabase db remote commit

# Mark old migrations as reverted
supabase migration repair --status reverted 00
supabase migration repair --status reverted 01
# ... (for all old migrations)
```

### Step 3: Apply Baseline
```bash
# Push the baseline migration
supabase db push

# This establishes new starting point
```

### Step 4: Continue Development
```bash
# Now you can create new migrations
supabase migration new add_new_feature

# And push normally
supabase db push
```

## Alternative: Squash Migration

### If baseline doesn't work, create a squash migration:

1. **Export current remote schema**
```bash
supabase db dump --schema-only > current_schema.sql
```

2. **Create squash migration**
```bash
# Create new migration
supabase migration new initial_squash

# Copy your complete_schema.sql content
# But only include CREATE statements, no DROP/ALTER
```

3. **Manual cleanup**
```sql
-- Connect to remote and run:
TRUNCATE supabase_migrations.schema_migrations;

-- Insert your new migration
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES ('20240101_000000_initial_squash');
```

## Going Forward

### Development Workflow
1. Always work with local Supabase first
2. Test migrations with `supabase db reset`
3. Use meaningful migration names
4. Keep migrations small and focused
5. Document breaking changes

### Team Guidelines
- One migration per feature
- Review migrations in PRs
- Test on staging before production
- Keep rollback scripts ready

### Migration Checklist
- [ ] Migration is idempotent (IF NOT EXISTS)
- [ ] Tested locally with `db reset`
- [ ] Includes appropriate indexes
- [ ] RLS policies included
- [ ] No hardcoded IDs
- [ ] Rollback plan documented