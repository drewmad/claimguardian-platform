# Authentication System - Claude.md

## Overview

ClaimGuardian's authentication system uses Supabase Auth with custom error handling, session management, and compliance tracking.

## Architecture

- **Primary Auth**: Supabase GoTrue with JWT tokens
- **Session Management**: Real-time monitoring with auto-refresh
- **Profile Creation**: Database triggers (NOT manual inserts)
- **Compliance**: Legal consent tracking and audit trails
- **Version**: Updated for Supabase 2.53.0 and Next.js 15.3.5
- **Testing**: 100% passing authentication tests

## Critical Files

- `basic-signup-form.tsx` - Simple email/password signup
- `multi-step-signup-form.tsx` - Full compliance signup flow
- `actions.ts` - Server actions for auth operations
- `middleware.ts` - Route protection and validation

## Database Schema

```sql
-- Profiles are created automatically via trigger
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Trigger handles profile creation automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Key Patterns

### ✅ Correct Profile Creation

```typescript
// DON'T manually insert profiles - triggers handle this
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      first_name: formData.firstName,
      last_name: formData.lastName,
    },
  },
});
// Profile automatically created by database trigger
```

### ❌ Incorrect Profile Creation

```typescript
// NEVER do this - causes "Database error saving new user"
await supabase.from("user_profiles").upsert({
  user_id: data.user.id,
  // ... manual profile data
});
```

### Error Handling Pattern

```typescript
try {
  const { data, error } = await authService.signUp(userData);
  if (error) {
    setError(error);
    return false;
  }
  return true;
} catch (err) {
  setError(new AuthError("Unexpected error", "AUTH_UNKNOWN_ERROR", err));
  return false;
}
```

## Common Issues & Solutions

### "Database error saving new user"

- **Cause**: Manual profile insertion to wrong table
- **Fix**: Remove manual inserts, rely on database triggers
- **Files**: `basic-signup-form.tsx`, `multi-step-signup-form.tsx`

### Session Management

- Use `AuthProvider` context for global state
- Session monitoring handles auto-refresh
- Redirect on expiry to avoid auth loops

### Route Protection

- `ProtectedRoute` component wraps authenticated pages
- Middleware validates sessions for server routes
- Public pages listed in `publicPages` array

## Testing Auth Changes

1. Test signup flow end-to-end
2. Verify profile creation in database
3. Check session persistence across reloads
4. Test error handling for various scenarios

## Dependencies

- `@supabase/supabase-js` - Primary auth client
- `@claimguardian/db` - Database client factory
- `next/navigation` - Router for redirects
- Custom auth service layer for error handling

## Legal Compliance

- GDPR consent tracking via metadata
- Age verification (18+) required
- Terms of Service acceptance mandatory
- Audit trail for all consent decisions
