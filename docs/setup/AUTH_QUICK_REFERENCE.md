# Authentication System Quick Reference

## 🚀 Getting Started

### Basic Authentication Hook
```typescript
import { useAuth } from '@/components/auth/auth-provider'

function MyComponent() {
  const { user, loading, error, signIn, signUp, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Welcome, {user.email}!</div>
}
```

### Opening Authentication Modals
```typescript
import { useModalStore } from '@/stores/modal-store'

function Header() {
  const { openModal } = useModalStore()
  
  return (
    <div>
      <button onClick={() => openModal('login')}>Login</button>
      <button onClick={() => openModal('signup')}>Sign Up</button>
      <button onClick={() => openModal('securityQuestions')}>Security Questions</button>
    </div>
  )
}
```

## 🔐 Core Services

### Authentication Service
```typescript
import { authService } from '@/lib/auth/auth-service'

// Sign up
const { data, error } = await authService.signUp({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
})

// Sign in with remember me
const result = await authService.signIn({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true
})

// Resend verification
await authService.resendConfirmationEmail('user@example.com')
```

### Profile Management
```typescript
import { profileService } from '@/lib/auth/profile-service'

// Get profile
const profile = await profileService.getProfile(userId)

// Update profile
await profileService.updateProfile(userId, {
  firstName: 'Jane',
  phone: '+1234567890'
})

// Change email
const result = await profileService.requestEmailChange(userId, {
  newEmail: 'new@example.com',
  password: 'currentPassword'
})
```

### Security Questions
```typescript
import { securityQuestionsService } from '@/lib/auth/security-questions-service'

// Get available questions
const questions = await securityQuestionsService.getQuestions()

// Save answers
await securityQuestionsService.saveAnswers(userId, [
  { questionId: 'q1', answer: 'My first pet' },
  { questionId: 'q2', answer: 'New York' },
  { questionId: 'q3', answer: 'Smith' }
])
```

## ⏱️ Rate Limiting

### Using Rate Limit Hook
```typescript
import { useRateLimit } from '@/hooks/use-rate-limit'

function EmailResendButton() {
  const { isLimited, secondsRemaining, checkLimit } = useRateLimit({
    cooldownMs: 60000, // 60 seconds
    key: 'email-resend'
  })
  
  const handleResend = async () => {
    if (!checkLimit()) return
    // Perform resend action
  }
  
  return (
    <button disabled={isLimited}>
      {isLimited ? `Wait ${secondsRemaining}s` : 'Resend Email'}
    </button>
  )
}
```

## 🔄 Session Management

### Session Hook Usage
```typescript
import { useAuth } from '@/components/auth/auth-provider'

function App() {
  const { sessionWarning, clearSessionWarning } = useAuth()
  
  return (
    <div>
      {sessionWarning && (
        <SessionWarningModal 
          isOpen={sessionWarning} 
          onClose={clearSessionWarning} 
        />
      )}
    </div>
  )
}
```

### Manual Session Refresh
```typescript
import { sessionManager } from '@/lib/auth/session-manager'

// Force refresh session
await sessionManager.forceRefresh()

// Get time until expiry
const seconds = await sessionManager.getTimeUntilExpiry()
```

## 📊 Login Activity

### Tracking Login Activity
```typescript
import { loginActivityService } from '@/lib/auth/login-activity-service'

// Get user's login activity
const activities = await loginActivityService.getUserLoginActivity(userId, 20)

// Get statistics
const stats = await loginActivityService.getLoginStats(userId)

// Check for suspicious activity
const { suspicious, reasons } = await loginActivityService.checkSuspiciousActivity(userId)
```

## 🛡️ Protected Routes

### Creating Protected Pages
```typescript
'use client'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  if (loading) return <div>Loading...</div>
  if (!user) return null
  
  return <div>Protected content</div>
}
```

## 🎨 UI Components

### Authentication Modals Available
- `LoginModal` - Email/password login with remember me
- `SignupModal` - Registration with email verification
- `ForgotPasswordModal` - Password reset request
- `SecurityQuestionsModal` - Security questions setup
- `SessionWarningModal` - Session expiry warning

### Using Modals
```typescript
// Modal store provides these types
type ModalType = 'login' | 'signup' | 'forgotPassword' | 'securityQuestions' | 'sessionWarning'

const { activeModal, openModal, closeModal } = useModalStore()
```

## ⚠️ Error Handling

### Error Types
```typescript
// All auth errors extend AppError
interface AuthError {
  message: string
  code: ErrorCode
  originalError?: Error
}

// Common error codes
'AUTH_INVALID_CREDENTIALS'
'AUTH_EMAIL_NOT_VERIFIED'
'AUTH_USER_EXISTS'
'RATE_LIMIT_ERROR'
'VALIDATION_ERROR'
```

### Handling Errors
```typescript
const { error, clearError } = useAuth()

useEffect(() => {
  if (error) {
    console.error(`Auth error (${error.code}):`, error.message)
    // Show user-friendly message
  }
}, [error])
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Session Manager Config
```typescript
import { sessionManager } from '@/lib/auth/session-manager'

sessionManager.config = {
  refreshThresholdMinutes: 10,
  warningThresholdMinutes: 5,
  onSessionExpiring: () => showWarning(),
  onSessionExpired: () => forceLogout(),
  onSessionRefreshed: () => hideWarning()
}
```

## 📱 Pages & Routes

### Authentication Pages
- `/auth/verify` - Email verification callback
- `/auth/recover` - Account recovery with security questions
- `/auth/reset-password` - Password reset

### Account Management
- `/account/profile` - Profile settings and management
- `/account/login-activity` - Login history and security

## 🧪 Testing Utilities

### Test Authentication State
```typescript
// Mock authenticated user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

// Mock auth provider in tests
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    error: null
  })
}))
```

## 🚨 Common Pitfalls

1. **Always check loading state** before rendering auth-dependent content
2. **Use absolute paths** for file imports, not relative
3. **Handle rate limiting** for all email operations
4. **Verify user permissions** before allowing actions
5. **Clear sensitive data** from state on logout
6. **Use environment variables** for configuration

## 📞 Support

For issues or questions:
1. Check error logs in Sentry
2. Review login activity for security issues
3. Verify environment configuration
4. Test in incognito mode to rule out cache issues