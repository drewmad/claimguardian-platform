# Database Package - Claude.md

## Overview

The `@claimguardian/db` package provides centralized Supabase client management with factory patterns, type safety, and connection optimization.

## Architecture

- **Client Factory**: Single source for Supabase clients
- **Environment Detection**: Browser vs server client creation
- **Type Safety**: Generated TypeScript types from database schema
- **Connection Pooling**: Optimized for serverless environments
- **PostgreSQL 17**: Latest version with PostGIS for geographic data
- **Row Level Security**: User-based data access control

## Key Files

- `src/index.ts` - Main exports and client factory
- `src/types.ts` - Generated database types
- `src/client.ts` - Client creation logic
- `package.json` - Build configuration

## Client Creation Patterns

### Browser Client (Client-Side)

```typescript
import { createBrowserSupabaseClient } from "@claimguardian/db";

// ✅ Correct usage in components
const supabase = createBrowserSupabaseClient();

// Use for client-side operations
const { data, error } = await supabase
  .from("properties")
  .select("*")
  .eq("user_id", user.id);
```

### Server Client (Server-Side)

```typescript
import { createClient } from "@/lib/supabase/server";

// ✅ Correct usage in server actions/components
const supabase = await createClient();

// Use for server-side operations with service role access
const { data, error } = await supabase
  .from("properties")
  .insert({ user_id: userId, name: "Property" });
```

### Edge Functions Client

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

// ✅ Correct usage in Edge Functions
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
```

## Database Schema Management

### Single Schema File Approach

- Use `supabase/schema.sql` as source of truth (NOT migrations)
- Avoid CLI migrations to prevent conflicts
- Apply changes via Supabase Dashboard
- Generate types after schema changes

### Schema Update Workflow

```bash
# 1. Update schema in Supabase Dashboard
# 2. Export current schema
./scripts/db.sh schema dump

# 3. Generate TypeScript types
pnpm db:generate-types

# 4. Commit updated schema.sql and types
git add supabase/schema.sql packages/db/src/types.ts
git commit -m "update: database schema and types"
```

## Type Safety

### Generated Types Usage

```typescript
import type { Database } from "@claimguardian/db";

// Use generated types for queries
type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// Type-safe queries
const { data } = await supabase
  .from("properties")
  .select("*")
  .returns<Property[]>();
```

### Row Level Security (RLS)

```sql
-- All tables should have RLS enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Common Table Patterns

### User-Owned Resources

```sql
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS policies
CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id);
```

### Automatic Timestamps

```sql
-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### JSON Data Storage

```sql
-- Use JSONB for structured data
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  details jsonb DEFAULT '{}' NOT NULL,
  -- Query JSON fields with ->>, ->, @>, etc.
);

-- Index JSON fields for performance
CREATE INDEX idx_properties_details_type ON public.properties
  USING GIN ((details->>'type'));
```

## Connection Configuration

### Environment Variables

```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Client Configuration

```typescript
// packages/db/src/index.ts
export const createBrowserSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
};
```

## Performance Optimization

### Query Optimization

```typescript
// ✅ Select only needed columns
const { data } = await supabase
  .from("properties")
  .select("id, name, created_at")
  .eq("user_id", userId);

// ✅ Use proper indexing
// CREATE INDEX idx_properties_user_id ON properties(user_id);

// ✅ Limit results for pagination
const { data } = await supabase.from("properties").select("*").range(0, 9); // First 10 items
```

### Connection Pooling

- Use `createClient` function instead of direct instantiation
- Reuse clients within same request context
- Avoid creating multiple clients unnecessarily

## Error Handling

### Database Errors

```typescript
try {
  const { data, error } = await supabase
    .from("properties")
    .insert(propertyData);

  if (error) {
    console.error("Database error:", error);
    if (error.code === "23505") {
      throw new Error("Property already exists");
    }
    throw error;
  }

  return data;
} catch (error) {
  // Handle network errors, permission errors, etc.
  throw new Error(`Failed to create property: ${error.message}`);
}
```

### RLS Policy Errors

```typescript
// RLS violations return empty results, not errors
const { data, error } = await supabase.from("properties").select("*");

if (!error && data.length === 0) {
  // Could be RLS blocking access or genuinely no data
  console.log("No accessible properties found");
}
```

## Testing Database Operations

### Unit Tests

```typescript
import { createBrowserSupabaseClient } from "@claimguardian/db";

describe("Database operations", () => {
  const supabase = createBrowserSupabaseClient();

  test("should create property", async () => {
    const { data, error } = await supabase
      .from("properties")
      .insert({ name: "Test Property" })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty("id");
    expect(data.name).toBe("Test Property");
  });
});
```

### Mock Data

```typescript
// Use for testing without real database calls
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
};
```

## Common Issues & Solutions

### "Cannot read properties of undefined"

- **Cause**: Client not properly initialized
- **Fix**: Use factory functions, check environment variables

### "Row Level Security violation"

- **Cause**: Missing or incorrect RLS policies
- **Fix**: Check user authentication, verify policy conditions

### "Connection refused"

- **Cause**: Wrong SUPABASE_URL or network issues
- **Fix**: Verify environment variables, check network connectivity

### Type errors with generated types

- **Cause**: Outdated type definitions
- **Fix**: Regenerate types after schema changes

## Build Configuration

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "type-check": "tsc --noEmit",
    "generate-types": "supabase gen types typescript --project-id $PROJECT_ID > src/types.ts"
  }
}
```
