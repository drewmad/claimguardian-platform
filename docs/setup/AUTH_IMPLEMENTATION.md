# Authentication Implementation Guide

## Overview

We've implemented a comprehensive authentication system with advanced security features, error handling, and user management capabilities for ClaimGuardian.

## Key Components

### 1. **Authentication Service** (`/lib/auth/auth-service.ts`)
- Centralized authentication logic
- Comprehensive error handling
- Supabase integration
- Login activity tracking
- Methods: `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`, `resendConfirmationEmail`

### 2. **Error Handling Infrastructure**

#### App Error Base Class (`/lib/errors/app-error.ts`)
- Standardized error codes
- Error context tracking
- JSON serialization for logging

#### Logger Service (`/lib/logger.ts`)
- Centralized logging with Sentry integration
- Different log levels: debug, info, warn, error, fatal
- User context tracking
- Event tracking for analytics

#### Error Boundary (`/components/error-boundary.tsx`)
- React error boundary for catching UI errors
- User-friendly error display
- Error ID for support reference

### 3. **Enhanced Auth Provider** (`/components/auth/auth-provider.tsx`)
- Global auth state management
- Error handling for all auth operations
- Automatic session restoration
- Session monitoring and refresh
- Auth event tracking
- Loading states
- Session warning state management

### 4. **Session Management** (`/lib/auth/session-manager.ts`)
- Automatic token refresh before expiry
- Configurable refresh thresholds
- Session expiry warnings
- Remember me integration
- Session monitoring with callbacks

### 5. **Authentication Modals**

#### Login Modal
- Email/password authentication
- Remember me checkbox
- Unverified email detection
- Inline email verification resend
- Rate limiting for resends
- Forgot password link

#### Signup Modal
- Full registration form with validation
- Password strength indicator
- Phone number formatting
- Terms acceptance
- Email confirmation messaging
- Resend confirmation with rate limiting

#### Forgot Password Modal
- Email-based password reset
- Clear instructions
- Success messaging

#### Session Warning Modal
- Countdown timer
- Manual refresh option
- Auto-dismiss on refresh

### 6. **Security Features**

#### Rate Limiting (`/hooks/use-rate-limit.ts`)
- Client-side rate limiting
- Configurable cooldown periods
- Persistent across page refreshes
- Visual countdown timers

#### Security Questions (`/lib/auth/security-questions-service.ts`)
- Database-backed security questions
- Answer hashing with bcrypt
- Multi-question verification
- Account recovery flow

#### Login Activity Monitoring (`/lib/auth/login-activity-service.ts`)
- Device detection (UA parser)
- Success/failure tracking
- IP address logging
- Suspicious activity detection
- Activity statistics

### 7. **User Management**

#### Profile Service (`/lib/auth/profile-service.ts`)
- Profile CRUD operations
- Email change with verification
- Password updates with current password verification
- Avatar upload support
- Account deletion

#### Profile Management Page (`/app/account/profile/page.tsx`)
- Tabbed interface (Profile, Security, Email, Danger Zone)
- Profile information updates
- Password changes
- Email changes with verification
- Security questions setup
- Account deletion with confirmation

### 8. **Legal Compliance System** (`/lib/legal/` & `/components/legal/`)

#### Legal Document Management (`/lib/legal/legal-service.ts`)
- Document versioning with SHA-256 hashing
- Tamper-evident document storage
- Consent tracking with audit trail
- GDPR/CCPA/E-SIGN compliance
- Automated document processing pipeline
- Force re-consent on document updates

#### Legal Document Tables
- `legal_documents` - Versioned legal documents with SHA-256 hashes
- `user_legal_acceptance` - Immutable consent records with audit trail
- Document storage integration with Supabase Storage

#### Legal Consent Components
- `LegalConsentForm` - Document display with checkbox consent
- `LegalGuard` - Route protection requiring document acceptance
- `useLegalGuard` - Hook for consent checking

#### API Endpoints
- `/api/legal/documents` - Fetch active legal documents
- `/api/legal/accept` - Record document acceptance

#### GitHub Actions Integration (`/.github/workflows/legal-docs.yml`)
- Automated legal document processing
- Markdown to HTML conversion with minification
- SHA-256 hash generation for document integrity
- Automatic Supabase Storage upload
- Database record creation with metadata

### 9. **Authentication Pages**

#### Email Verification (`/app/auth/verify/page.tsx`)
- Token-based email verification
- Auto-redirect on success
- Error handling with recovery options
- Invalid/expired link handling

#### Account Recovery (`/app/auth/recover/page.tsx`)
- Multi-step recovery flow
- Email verification
- Security questions verification
- Password reset

#### Password Reset (`/app/auth/reset-password/page.tsx`)
- Token-based password reset
- Password validation
- Success confirmation

#### Login Activity (`/app/account/login-activity/page.tsx`)
- Activity timeline
- Device information
- Statistics dashboard
- Security recommendations

### 10. **Protected Routes**
- Enhanced with loading component
- Session checking
- Automatic redirects
- Logging for unauthorized access attempts
- Legal consent verification integration

## Error Codes Reference

```typescript
// Authentication errors
AUTH_INVALID_CREDENTIALS - Wrong email/password
AUTH_USER_EXISTS - Email already registered
AUTH_EMAIL_NOT_VERIFIED - Need email verification
AUTH_SESSION_EXPIRED - Session timeout
AUTH_INVALID_TOKEN - Invalid auth token
AUTH_INVALID_RESPONSE - Unexpected API response
AUTH_UNKNOWN_ERROR - Generic auth error

// Validation errors
VALIDATION_ERROR - General validation failure
INVALID_INPUT - Invalid user input
MISSING_REQUIRED_FIELD - Required field missing

// API errors
API_ERROR - General API error
NETWORK_ERROR - Network connectivity issue
TIMEOUT_ERROR - Request timeout
RATE_LIMIT_ERROR - Too many requests

// Business logic errors
INSUFFICIENT_PERMISSIONS - Unauthorized action
RESOURCE_NOT_FOUND - Resource doesn't exist
```

## Usage Examples

### Sign In
```typescript
const { signIn, loading, error } = useAuth()

await signIn(email, password)
if (error) {
  // Error is automatically displayed in UI
  console.error(error.code) // e.g., 'AUTH_INVALID_CREDENTIALS'
}
```

### Sign Up
```typescript
const { signUp, loading, error } = useAuth()

const success = await signUp({
  email,
  password,
  firstName,
  lastName,
  phone
})

if (success) {
  // User is shown email confirmation message
  // Email with verification link is sent automatically
}
```

### Resend Confirmation Email
```typescript
import { authService } from '@/lib/auth/auth-service'
import { useRateLimit } from '@/hooks/use-rate-limit'

const { isLimited, secondsRemaining, checkLimit } = useRateLimit({
  cooldownMs: 60000,
  key: 'email-resend'
})

const handleResend = async () => {
  if (!checkLimit()) return
  
  const { error } = await authService.resendConfirmationEmail(email)
  if (!error) {
    // Email sent successfully
  }
}
```

### Session Management
```typescript
import { sessionManager } from '@/lib/auth/session-manager'
import { useAuth } from '@/components/auth/auth-provider'

const { sessionWarning, clearSessionWarning } = useAuth()

// Configure session callbacks
sessionManager.config = {
  onSessionExpiring: () => setShowWarning(true),
  onSessionExpired: () => signOut(),
  onSessionRefreshed: () => setShowWarning(false)
}
```

### Security Questions
```typescript
import { securityQuestionsService } from '@/lib/auth/security-questions-service'

// Get available questions
const questions = await securityQuestionsService.getQuestions()

// Save user answers
await securityQuestionsService.saveAnswers(userId, [
  { questionId: 'q1', answer: 'answer1' },
  { questionId: 'q2', answer: 'answer2' },
  { questionId: 'q3', answer: 'answer3' }
])

// Verify answers during recovery
const isValid = await securityQuestionsService.verifyAnswers(userId, answers)
```

### Login Activity
```typescript
import { loginActivityService } from '@/lib/auth/login-activity-service'

// Log login attempt (automatic in auth service)
await loginActivityService.logLoginAttempt(userId, true)

// Get user activity
const activities = await loginActivityService.getUserLoginActivity(userId)

// Get statistics
const stats = await loginActivityService.getLoginStats(userId)

// Check for suspicious activity
const { suspicious, reasons } = await loginActivityService.checkSuspiciousActivity(userId)
```

### Profile Management
```typescript
import { profileService } from '@/lib/auth/profile-service'

// Get profile
const profile = await profileService.getProfile(userId)

// Update profile
const success = await profileService.updateProfile(userId, {
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890'
})

// Change email
const result = await profileService.requestEmailChange(userId, {
  newEmail: 'new@email.com',
  password: 'currentPassword'
})

// Update password
const result = await profileService.updatePassword('oldPass', 'newPass')
```

### Password Reset
```typescript
const { resetPassword } = useAuth()

await resetPassword(email)
// User receives email with reset link
```

### Error Logging
```typescript
import { logger } from '@/lib/logger'

// Info logging
logger.info('User action', { userId, action: 'clicked_button' })

// Error logging
logger.error('Failed to load data', error, { userId, endpoint })

// Track events
logger.track('feature_used', { feature: 'document_upload' })
```

### Legal Compliance
```typescript
import { legalService } from '@/lib/legal/legal-service'
import { LegalGuard, useLegalGuard } from '@/lib/auth/legal-guard'

// Check if user needs to accept documents
const outstandingDocs = await legalService.getDocumentsNeedingAcceptance(userId)

// Get all active legal documents
const documents = await legalService.getActiveLegalDocuments()

// Record consent acceptance
await legalService.recordAcceptances(userId, [
  {
    legal_id: 'doc-id',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    signature_data: {
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    }
  }
])

// Use legal guard hook
const { hasConsent, checking } = useLegalGuard({
  redirectTo: '/legal/update',
  onConsentNeeded: (count) => console.log(`${count} documents need acceptance`)
})

// Protect components with legal consent
<LegalGuard redirectTo="/legal/update">
  <ProtectedContent />
</LegalGuard>
```

## Sentry Configuration

Production error tracking is configured with:
- Automatic error capture
- Session replay on errors
- Sensitive data filtering
- Environment-specific settings

Add to `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Testing the Implementation

1. **Test Sign Up Flow**
   - Try duplicate email (should show error)
   - Try weak password (validation error)
   - Successful signup (shows email confirmation message)
   - Test resend confirmation email button
   - Verify rate limiting (60-second cooldown)
   - Check email for verification link

2. **Test Sign In Flow**
   - Wrong credentials (error display)
   - Unverified email (special yellow warning with resend option)
   - Correct credentials (redirect to dashboard)
   - Remember me checkbox functionality
   - Rate limiting on email resends

3. **Test Email Verification**
   - Click verification link from email
   - Test with invalid/expired tokens
   - Verify auto-redirect to dashboard
   - Test error recovery options

4. **Test Session Management**
   - Login and wait for session warning (5 minutes before expiry)
   - Test manual session refresh
   - Verify auto-refresh functionality
   - Test remember me vs. normal session duration

5. **Test Password Reset**
   - Enter email in forgot password modal
   - Check email for reset link
   - Use reset page to set new password
   - Test with invalid tokens

6. **Test Account Recovery**
   - Set up security questions first
   - Navigate to `/auth/recover`
   - Enter email and verify questions appear
   - Answer questions correctly/incorrectly
   - Complete password reset flow

7. **Test Profile Management**
   - Update profile information
   - Change email address (verify new email)
   - Update password (requires current password)
   - Set up security questions
   - View login activity
   - Test account deletion

8. **Test Login Activity Monitoring**
   - Login from different devices/browsers
   - Check activity appears in `/account/login-activity`
   - Verify device detection
   - Test suspicious activity detection

9. **Test Security Features**
   - Rate limiting on various actions
   - Security questions setup and verification
   - Password strength requirements
   - Error handling and user feedback

10. **Test Error Boundary**
    - Errors are caught and displayed gracefully
    - Error IDs are logged for support

11. **Test Legal Compliance**
    - Add new legal documents to `/legal/` directory
    - Verify GitHub Actions processes documents automatically
    - Test consent form displays correctly
    - Verify consent recording with audit trail
    - Test legal guard protecting routes
    - Verify re-consent required on document updates

12. **Test Protected Routes**
    - Access `/dashboard` without auth (redirects to home)
    - Access `/account/*` without auth
    - Loading states during auth checks
    - Legal consent verification on protected routes

## Next Steps

### Immediate Production Readiness
1. ✅ Email verification flow (completed)
2. ✅ Session timeout warnings (completed)
3. ✅ Account recovery with security questions (completed)
4. ✅ Login activity monitoring (completed)
5. ✅ Profile management (completed)
6. ✅ Legal compliance system with immutable consent tracking (completed)

### Future Enhancements
1. **Two-Factor Authentication (2FA)**
   - TOTP support (Google Authenticator, Authy)
   - SMS backup codes
   - Recovery codes for account access

2. **OAuth Integration**
   - Google Sign-In
   - GitHub OAuth
   - Microsoft/Azure AD
   - Apple Sign-In

3. **Advanced Security**
   - Role-based access control (RBAC)
   - Permission management
   - IP allowlisting/blocking
   - Device management and trust

4. **Enhanced Monitoring**
   - Real-time security alerts
   - Advanced analytics dashboard
   - Compliance reporting
   - Audit trail export

5. **Enterprise Features**
   - Single Sign-On (SSO)
   - SAML integration
   - Directory services (LDAP/AD)
   - Multi-tenant support

## Database Schema

### Required Migrations
```sql
-- Security Questions (already created)
supabase/migrations/20240108_security_questions.sql

-- Login Activity (already created)
supabase/migrations/20240108_login_activity.sql

-- Legal Documents and Consent Tracking (already created)
supabase/migrations/20240109_legal_documents.sql
```

### Tables Created
- `security_questions` - Available security questions
- `user_security_answers` - User's hashed answers
- `login_activity` - Login attempts and device info
- `legal_documents` - Versioned legal documents with SHA-256 hashes
- `user_legal_acceptance` - Immutable consent records with audit trail

## Dependencies Added
- `bcryptjs` - Password hashing for security answers
- `ua-parser-js` - Device and browser detection
- `date-fns` - Date formatting and manipulation

## File Structure
```
apps/web/src/
├── components/
│   ├── auth/
│   │   └── auth-provider.tsx (enhanced)
│   ├── legal/
│   │   └── legal-consent-form.tsx (new)
│   └── modals/
│       ├── login-modal.tsx (enhanced)
│       ├── signup-modal.tsx (enhanced)
│       ├── security-questions-modal.tsx (new)
│       └── session-warning-modal.tsx (new)
├── lib/
│   ├── auth/
│   │   ├── auth-service.ts (enhanced)
│   │   ├── session-manager.ts (new)
│   │   ├── security-questions-service.ts (new)
│   │   ├── login-activity-service.ts (new)
│   │   ├── profile-service.ts (new)
│   │   └── legal-guard.tsx (new)
│   └── legal/
│       └── legal-service.ts (new)
├── hooks/
│   └── use-rate-limit.ts (new)
├── app/
│   ├── auth/
│   │   ├── verify/page.tsx (new)
│   │   └── recover/page.tsx (new)
│   ├── account/
│   │   ├── profile/page.tsx (new)
│   │   └── login-activity/page.tsx (new)
│   └── api/legal/
│       ├── documents/route.ts (new)
│       └── accept/route.ts (new)
├── stores/
│   └── modal-store.ts (enhanced)
├── legal/ (root level)
│   ├── terms-of-service.md (new)
│   └── privacy-policy.md (new)
├── supabase/migrations/
│   ├── 20240108_security_questions.sql (new)
│   ├── 20240108_login_activity.sql (new)
│   └── 20240109_legal_documents.sql (new)
└── .github/workflows/
    └── legal-docs.yml (new)
```