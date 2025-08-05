# Automated Database Type Generation

## Overview

ClaimGuardian uses automated TypeScript type generation from the Supabase database schema to ensure type safety across the application. This system runs automatically on GitHub Actions and can also be triggered manually.

## How It Works

1. **Automatic Triggers**:
   - **Daily Schedule**: Runs every day at midnight UTC to catch any manual database changes
   - **Schema Changes**: Triggers when `supabase/schema.sql` or migration files are modified
   - **Manual Dispatch**: Can be triggered manually from GitHub Actions tab

2. **Generation Process**:
   - GitHub Actions workflow runs `supabase gen types typescript`
   - Types are generated from the linked Supabase project (tmlrvecuwgppbaynesji)
   - Includes schemas: `public`, `claims`, `properties`
   - Output is saved to `packages/db/src/types/database.types.ts`

3. **Automatic Commits**:
   - If types have changed, the workflow automatically commits and pushes them
   - Commit message: `chore(db): Auto-generate database types`
   - Committed by: `github-actions[bot]`

## Configuration

### GitHub Actions Workflow

**File**: `.github/workflows/generate-database-types.yml`

Key features:
- Uses pnpm 10.13.1 and Node.js 24
- Runs type compilation check after generation
- Creates detailed summary in GitHub Actions
- Supports debug mode for troubleshooting

### Required Secrets

Set these in Repository Settings > Secrets and variables > Actions:

1. **SUPABASE_ACCESS_TOKEN** (Required)
   - Get from: https://app.supabase.com/account/tokens
   - Used to authenticate with Supabase CLI

2. **SUPABASE_DB_PASSWORD** (Optional)
   - Only needed for direct database connections
   - Get from Supabase project settings

## Manual Commands

### Generate Types Locally
```bash
# From project root
pnpm db:generate-types

# Or from web app directory
cd apps/web && pnpm db:types
```

### Generate Types (Local Database)
```bash
# If running Supabase locally
pnpm db:generate-types:local
```

### Trigger GitHub Actions Manually
```bash
# Using GitHub CLI
gh workflow run generate-database-types.yml

# With debug mode
gh workflow run generate-database-types.yml -f debug=true

# View recent runs
gh run list --workflow=generate-database-types.yml
```

## Type Usage

The generated types are available in the `@claimguardian/db` package:

```typescript
import { Database } from '@claimguardian/db/types'

// Table types
type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

// Use with Supabase client
import { createClient } from '@supabase/supabase-js'
const supabase = createClient<Database>(url, key)

// Type-safe queries
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('user_id', userId)
// data is typed as Property[] | null
```

## Troubleshooting

### Types Not Generating

1. **Check Supabase Link**:
   ```bash
   cd apps/web
   supabase projects list
   # Should show tmlrvecuwgppbaynesji
   ```

2. **Re-link if Needed**:
   ```bash
   supabase link --project-ref tmlrvecuwgppbaynesji
   ```

3. **Check Access Token**:
   ```bash
   # Set in environment
   export SUPABASE_ACCESS_TOKEN='your-token'
   ```

### GitHub Actions Failing

1. **Check Secrets**: Ensure SUPABASE_ACCESS_TOKEN is set in repository secrets
2. **Enable Debug Mode**: Run workflow with debug=true
3. **Check Logs**: Look for specific error messages in Actions logs

### Type Compilation Errors

1. **Verify Generated File**:
   ```bash
   # Check if file exists and has content
   ls -la packages/db/src/types/database.types.ts
   ```

2. **Test Compilation**:
   ```bash
   pnpm --filter @claimguardian/db type-check
   ```

3. **Clear and Regenerate**:
   ```bash
   rm -f packages/db/src/types/database.types.ts
   pnpm db:generate-types
   ```

## Best Practices

1. **Never Edit Generated Files**: The `database.types.ts` file is auto-generated and should not be edited manually

2. **Keep Schema Updated**: Always apply schema changes through migrations or `schema.sql`

3. **Monitor Workflow**: Check GitHub Actions periodically to ensure types are being generated

4. **Local Development**: Run type generation after database changes to catch issues early

5. **Type Imports**: Always import from `@claimguardian/db/types` for consistency

## Integration with Development Workflow

1. **Pre-commit Hooks**: Types are checked during pre-commit validation
2. **CI/CD Pipeline**: Type checking runs on all pull requests
3. **IDE Support**: TypeScript language server provides auto-completion
4. **Build Process**: Types are validated during `pnpm build`

## Future Enhancements

1. **Webhook Integration**: Trigger type generation on database DDL changes
2. **Type Versioning**: Track type changes over time
3. **Custom Type Extensions**: Add domain-specific type helpers
4. **Type Documentation**: Auto-generate documentation from types