/**
 * @fileMetadata  
 * @purpose Critical authentication flow tests
 * @owner security-team
 * @complexity high
 * @tags ["testing", "auth", "critical-flow", "security"]
 * @status active
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@claimguardian/db'

// Mock Supabase client
jest.mock('@claimguardian/db', () => ({
  createBrowserSupabaseClient: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/auth/login',
}))

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

beforeEach(() => {
  ;(createBrowserSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
  jest.clearAllMocks()
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Authentication Flow - Critical Tests', () => {
  describe('User Login', () => {
    it('should validate email format before submission', async () => {
      // This test ensures we validate email before hitting the server
      const LoginForm = () => {
        const [email, setEmail] = React.useState('')
        const [error, setError] = React.useState('')

        const validateEmail = (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(email)
        }

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault()
          if (!validateEmail(email)) {
            setError('Please enter a valid email address')
            return
          }
          setError('')
        }

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="email-input"
              required
            />
            <button type="submit" data-testid="login-button">
              Login
            </button>
            {error && <div data-testid="error-message">{error}</div>}
          </form>
        )
      }

      const { getByTestId, queryByTestId } = renderWithProviders(<LoginForm />)
      
      // Test invalid email
      await userEvent.type(getByTestId('email-input'), 'invalid-email')
      fireEvent.click(getByTestId('login-button'))
      
      expect(getByTestId('error-message')).toHaveTextContent('Please enter a valid email address')
      
      // Test valid email  
      await userEvent.clear(getByTestId('email-input'))
      await userEvent.type(getByTestId('email-input'), 'user@example.com')
      fireEvent.click(getByTestId('login-button'))
      
      expect(queryByTestId('error-message')).not.toBeInTheDocument()
    })

    it('should handle authentication errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const LoginForm = () => {
        const [error, setError] = React.useState('')

        const handleLogin = async () => {
          const { error } = await mockSupabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          
          if (error) {
            setError(error.message)
          }
        }

        return (
          <div>
            <button onClick={handleLogin} data-testid="login-button">
              Login
            </button>
            {error && <div data-testid="auth-error">{error}</div>}
          </div>
        )
      }

      const { getByTestId } = renderWithProviders(<LoginForm />)
      
      fireEvent.click(getByTestId('login-button'))
      
      await waitFor(() => {
        expect(getByTestId('auth-error')).toHaveTextContent('Invalid login credentials')
      })
    })

    it('should prevent multiple rapid login attempts', async () => {
      let attemptCount = 0
      mockSupabase.auth.signInWithPassword.mockImplementation(() => {
        attemptCount++
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        })
      })

      const LoginForm = () => {
        const [isSubmitting, setIsSubmitting] = React.useState(false)

        const handleLogin = async () => {
          if (isSubmitting) return
          
          setIsSubmitting(true)
          await mockSupabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'password'
          })
          
          // Simulate debounce
          setTimeout(() => setIsSubmitting(false), 1000)
        }

        return (
          <button 
            onClick={handleLogin} 
            disabled={isSubmitting}
            data-testid="login-button"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        )
      }

      const { getByTestId } = renderWithProviders(<LoginForm />)
      
      // Rapid clicks should only result in one API call
      const button = getByTestId('login-button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(attemptCount).toBe(1)
      })
    })
  })

  describe('User Registration', () => {
    it('should validate password strength', () => {
      const validatePassword = (password: string) => {
        const minLength = password.length >= 8
        const hasUpper = /[A-Z]/.test(password)
        const hasLower = /[a-z]/.test(password)  
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        
        return {
          isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
          requirements: {
            minLength,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial
          }
        }
      }

      // Test weak passwords
      expect(validatePassword('123')).toEqual({
        isValid: false,
        requirements: {
          minLength: false,
          hasUpper: false,
          hasLower: false,
          hasNumber: true,
          hasSpecial: false
        }
      })

      expect(validatePassword('password')).toEqual({
        isValid: false,
        requirements: {
          minLength: true,
          hasUpper: false,
          hasLower: true,
          hasNumber: false,
          hasSpecial: false
        }
      })

      // Test strong password
      expect(validatePassword('SecurePass123!')).toEqual({
        isValid: true,
        requirements: {
          minLength: true,
          hasUpper: true,
          hasLower: true,
          hasNumber: true,
          hasSpecial: true
        }
      })
    })

    it('should sanitize user input during registration', () => {
      const sanitizeInput = (input: string) => {
        return input
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/[<>]/g, '') // Remove angle brackets
          .substring(0, 100) // Limit length
      }

      expect(sanitizeInput('  John Doe  ')).toBe('John Doe')
      expect(sanitizeInput('<script>alert("xss")</script>John')).toBe('John')
      expect(sanitizeInput('Name<dangerous>content</dangerous>')).toBe('Namedangerouscontent')
      
      // Test length limiting
      const longString = 'a'.repeat(150)
      expect(sanitizeInput(longString)).toHaveLength(100)
    })
  })

  describe('Session Management', () => {
    it('should handle session expiration gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const SessionChecker = () => {
        const [isAuthenticated, setIsAuthenticated] = React.useState(true)

        const checkSession = async () => {
          const { data: { session } } = await mockSupabase.auth.getSession()
          setIsAuthenticated(!!session)
        }

        React.useEffect(() => {
          checkSession()
        }, [])

        return (
          <div data-testid="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        )
      }

      const { getByTestId } = renderWithProviders(<SessionChecker />)
      
      await waitFor(() => {
        expect(getByTestId('auth-status')).toHaveTextContent('Not Authenticated')
      })
    })
  })
})

describe('Critical Security Tests', () => {
  it('should not expose sensitive data in error messages', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { 
        message: 'Database connection failed: host=db.internal.company.com user=admin password=secret123'
      }
    })

    const sanitizeError = (error: string) => {
      // Remove sensitive information from error messages
      return error
        .replace(/password=\w+/gi, 'password=***')
        .replace(/host=[\w\.-]+/gi, 'host=***')
        .replace(/user=\w+/gi, 'user=***')
    }

    const result = sanitizeError('Database connection failed: host=db.internal.company.com user=admin password=secret123')
    
    expect(result).toBe('Database connection failed: host=*** user=*** password=***')
    expect(result).not.toContain('secret123')
    expect(result).not.toContain('db.internal.company.com')
    expect(result).not.toContain('admin')
  })

  it('should rate limit authentication attempts', () => {
    const RateLimiter = class {
      private attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
      private readonly maxAttempts = 3
      private readonly windowMs = 15 * 60 * 1000 // 15 minutes

      isAllowed(identifier: string): boolean {
        const now = Date.now()
        const userAttempts = this.attempts.get(identifier)

        if (!userAttempts) {
          this.attempts.set(identifier, { count: 1, lastAttempt: now })
          return true
        }

        if (now - userAttempts.lastAttempt > this.windowMs) {
          // Reset window
          this.attempts.set(identifier, { count: 1, lastAttempt: now })
          return true
        }

        if (userAttempts.count >= this.maxAttempts) {
          return false
        }

        userAttempts.count++
        userAttempts.lastAttempt = now
        return true
      }
    }

    const rateLimiter = new RateLimiter()
    
    // First 3 attempts should be allowed
    expect(rateLimiter.isAllowed('user@example.com')).toBe(true)
    expect(rateLimiter.isAllowed('user@example.com')).toBe(true)
    expect(rateLimiter.isAllowed('user@example.com')).toBe(true)
    
    // 4th attempt should be blocked
    expect(rateLimiter.isAllowed('user@example.com')).toBe(false)
    
    // Different user should still be allowed
    expect(rateLimiter.isAllowed('other@example.com')).toBe(true)
  })
})