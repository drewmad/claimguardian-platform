# Supabase Authentication Setup for Production

## Required Configuration

### 1. Environment Variables

Ensure these are set in your production environment:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Highly Recommended
NEXT_PUBLIC_SITE_URL=https://claimguardianai.com

# For debugging (temporary)
NEXT_PUBLIC_DEBUG_AUTH=true
```

### 2. Supabase Dashboard Configuration

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Set the following:**

   - **Site URL**: `https://claimguardianai.com`

   - **Redirect URLs** (add all of these):
     ```
     https://claimguardianai.com
     https://claimguardianai.com/auth/callback
     https://claimguardianai.com/auth/verify
     https://claimguardianai.com/auth/reset-password
     https://claimguardianai.com/dashboard
     ```

4. **Email Templates** (Authentication > Email Templates):
   - Ensure the confirmation and password reset emails use the correct domain
   - Update the redirect URLs in the templates to use `https://claimguardianai.com`

### 3. CORS Configuration

If you're seeing CORS errors, add these to your Supabase project:

1. Go to **Settings > API**
2. Add `https://claimguardianai.com` to allowed origins

### 4. Testing Authentication

1. **Enable debug mode temporarily**:
   ```bash
   NEXT_PUBLIC_DEBUG_AUTH=true
   ```

2. **Check browser console** for detailed logs:
   - Look for `[ClaimGuardian Auth]` prefixed messages
   - Check for `[ClaimGuardian Auth Error]` for specific errors

3. **Common issues to check**:
   - Network tab: Are requests going to the correct Supabase URL?
   - Console: Any CORS errors?
   - Application tab: Are cookies being set correctly?

### 5. Troubleshooting Checklist

- [ ] Environment variables are set in production
- [ ] Supabase project has production domain in redirect URLs
- [ ] No CORS errors in browser console
- [ ] Email confirmation is working (check spam folder)
- [ ] Password reset emails contain correct domain
- [ ] Cookies are being set on the correct domain
- [ ] No JavaScript errors in console

### 6. Debug Information

If login is still failing, check these in order:

1. **Browser Console** - Look for:
   ```
   [ClaimGuardian Auth] Sign in attempt:
   [ClaimGuardian Auth Error]
   [ClaimGuardian Config Error]
   ```

2. **Network Tab** - Check:
   - Request to Supabase auth endpoint
   - Response status and body
   - Set-Cookie headers in response

3. **Supabase Logs** - In your Supabase dashboard:
   - Check Authentication logs
   - Look for failed login attempts

### 7. Quick Fix Attempts

1. **Clear all cookies** for claimguardianai.com
2. **Try incognito/private mode**
3. **Check if the issue is browser-specific**
4. **Verify the user exists** in Supabase Auth dashboard
5. **Check if email is confirmed** (unconfirmed emails can't log in)

### 8. Emergency Fallback

If you need to bypass auth temporarily for debugging:

```typescript
// In middleware.ts, temporarily comment out the protection
// WARNING: Only for debugging, remove in production!
// if (isProtectedRoute && !session) {
//   return NextResponse.redirect(new URL('/', request.url))
// }
```

## Contact Support

If issues persist after following this guide:
1. Check Supabase status page
2. Contact Supabase support with your project ID
3. Include browser console logs and network traces
