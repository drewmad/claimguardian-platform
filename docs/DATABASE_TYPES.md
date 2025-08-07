# Database Type Generation

This project uses automated database type generation to ensure TypeScript types always match the Supabase schema.

## Quick Commands

```bash
# Generate types from production database
pnpm db:generate-types

# Generate types from local Supabase
pnpm db:generate-types:local

# Generate types and commit if changed
pnpm db:sync
```

## Automatic Generation

Types are automatically generated in these scenarios:

### 1. Git Post-Merge Hook
When pulling changes that modify database schema, types are automatically regenerated.

### 2. GitHub Actions
When schema files change, a workflow generates and commits updated types.

### 3. VS Code Tasks
Press `Cmd+Shift+P` → "Tasks: Run Task" → "Generate DB Types"

## Manual Generation

### From Production Database
```bash
cd apps/web
pnpm db:types
```

### From Local Supabase
```bash
supabase start
cd apps/web
pnpm db:types:local
```

## When to Regenerate Types

- After modifying `supabase/schema.sql`
- After applying new migrations
- After pulling schema changes from teammates
- When TypeScript shows database-related type errors

## Troubleshooting

### "No such container" Error
```bash
supabase stop
supabase start
```

### Port Already Allocated
```bash
supabase stop --project-id mad-monorepo
supabase stop
supabase start
```

### Types Not Updating
1. Ensure Supabase CLI is logged in: `supabase login`
2. Check project is linked: `supabase link --project-ref tmlrvecuwgppbaynesji`
3. Verify access token in GitHub Actions secrets

## Benefits

- **Type Safety**: All database queries are fully typed
- **Auto-complete**: IDE knows all table and column names
- **Early Error Detection**: Catch schema mismatches at compile time
- **No Manual Maintenance**: Types stay in sync automatically
