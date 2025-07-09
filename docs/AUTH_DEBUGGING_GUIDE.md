# Authentication Debugging Guide

## Current Authentication Issue

The AI pages (Damage Analyzer, Policy Advisor, Inventory Scanner) are redirecting to the landing page even when users are authenticated.

## Debugging Steps Implemented

### 1. Enhanced Logging
- Created `enhanced-logger.ts` for comprehensive logging
- Added debug hooks (`use-auth-debug.ts`) to track auth state
- Implemented logging at every auth checkpoint

### 2. Client-Side Hydration Fix
- Created `ClientOnlyAuth` wrapper to prevent SSR/CSR mismatches
- Wrapped `ProtectedRoute` with client-only rendering
- Added proper loading states during hydration

### 3. Authentication Flow Updates
- Separated auth concerns (removed circular dependencies)
- Fixed Supabase client singleton pattern
- Updated all services to use unified client

### 4. Middleware Adjustments
- Temporarily disabled server-side redirects for debugging
- Added comprehensive session logging
- Maintained security headers

## How to Debug Authentication Issues

### 1. Check Browser Console
Open browser DevTools and look for:
```
[DamageAnalyzerPage] Auth Debug
[ProtectedRoute] Rendered with user: ...
[AuthProvider] Rendered with user: ...
```

### 2. Check Network Tab
- Look for Supabase auth requests
- Verify session cookies are being set
- Check for any 401/403 responses

### 3. Check Application Tab
- Verify cookies: `sb-access-token`, `sb-refresh-token`
- Check localStorage for auth data
- Ensure cookies have correct domain/path

### 4. Test Auth Flow
1. Open `/test-auth` page
2. Sign in using the modal
3. Check console for auth state changes
4. Navigate to AI pages
5. Monitor console for redirect triggers

## Common Issues and Solutions

### Issue: User is null despite being logged in
**Solution**: Check if cookies are being properly set and if the domain matches

### Issue: Hydration mismatch errors
**Solution**: Ensure all auth-dependent components use ClientOnlyAuth wrapper

### Issue: Session expires quickly
**Solution**: Check session refresh logic and token expiry settings

### Issue: Redirects happen immediately
**Solution**: Add delay to auth checks to allow session restoration

## Temporary Workarounds

1. **Direct Navigation**: After signing in, navigate directly to `/dashboard` first, then to AI pages
2. **Hard Refresh**: Use Ctrl+F5 to force reload the page after signing in
3. **Check Session**: Use the test page buttons to verify session state

## Next Steps

1. Monitor console logs to identify exact redirect trigger
2. Check if Supabase session is properly restored on navigation
3. Verify cookie settings match deployment environment
4. Test with production build (`pnpm build && pnpm start`)

## Environment Variables to Verify

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Ensure these are properly set and match your Supabase project.

## Rollback Instructions

If issues persist, you can rollback by:
1. Re-enabling middleware redirects (uncomment line in middleware.ts)
2. Removing ClientOnlyAuth wrapper from ProtectedRoute
3. Reverting to previous auth provider implementation

## Support

For persistent issues:
1. Check Supabase dashboard for auth logs
2. Verify RLS policies aren't blocking access
3. Test with a fresh user account
4. Clear all cookies and localStorage