/**
 * @fileMetadata
 * @purpose Tests for AuthProvider component and authentication flows
 * @owner platform-team
 * @complexity high
 * @tags ["testing", "auth", "provider", "security"]
 * @status active
 */

import React from 'react'
import { act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { 
  render, 
  createMockUser, 
  createMockSession,
  createMockSupabaseResponse,
  mockConsole
} from '../../utils/test-utils'

// Mock the auth service
jest.mock('@/lib/auth/auth-service', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
  },
  AuthError: class AuthError extends Error {
    constructor(message: string, public code: string, public cause?: Error) {
      super(message)
      this.name = 'AuthError'
    }
  }
}))

// Mock the session manager
jest.mock('@/lib/auth/session-manager', () => ({
  sessionManager: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    config: {},
  }
}))

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setUser: jest.fn(),
    track: jest.fn(),
  },
}))

// Mock enhanced logger
jest.mock('@/lib/logger/enhanced-logger', () => ({
  enhancedLogger: {
    info: jest.fn(),
    sessionEvent: jest.fn(),
  },
}))

  // Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="user-id">{auth.user?.id || 'no-user'}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="error">{auth.error?.message || 'no-error'}</div>
      <button onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  let mockSupabase: {
    auth: {
      getSession: jest.Mock
      onAuthStateChange: jest.Mock
    }
  }
  let console: ReturnType<typeof mockConsole>

  beforeEach(() => {
    console = mockConsole()
    
    // Reset Supabase mock
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue(createMockSupabaseResponse({ session: null })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      }
    }

    // Mock createClient to return our mock
    jest.doMock('@/lib/supabase/client', () => ({
      createClient: () => mockSupabase
    }))
  })

  afterEach(() => {
    console.restore()
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should start with loading true and no user', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(getByTestId('loading')).toHaveTextContent('true')
      expect(getByTestId('user-id')).toHaveTextContent('no-user')
      expect(getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should set loading to false after initialization', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('false')
      })
    })
  })

  describe('Session Restoration', () => {
    it('should restore user session on mount', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession({ user: mockUser })
      
      mockSupabase.auth.getSession.mockResolvedValue(
        createMockSupabaseResponse({ session: mockSession })
      )

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(getByTestId('user-id')).toHaveTextContent(mockUser.id)
        expect(getByTestId('loading')).toHaveTextContent('false')
      })
    })

    it('should handle session restoration error', async () => {
      const mockError = new Error('Session restoration failed')
      mockSupabase.auth.getSession.mockResolvedValue(
        createMockSupabaseResponse(null, mockError)
      )

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent('Failed to initialize authentication')
        expect(getByTestId('loading')).toHaveTextContent('false')
      })
    })
  })

  describe('Authentication State Changes', () => {
    it('should handle SIGNED_IN event', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession({ user: mockUser })
      
      let authStateCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('false')
      })

      // Simulate SIGNED_IN event
      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(getByTestId('user-id')).toHaveTextContent(mockUser.id)
      })
    })

    it('should handle SIGNED_OUT event', async () => {
      let authStateCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('false')
      })

      // Simulate SIGNED_OUT event
      act(() => {
        authStateCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(getByTestId('user-id')).toHaveTextContent('no-user')
        expect(getByTestId('loading')).toHaveTextContent('false')
      })
    })
  })

  describe('Authentication Methods', () => {
    it('should handle sign out', async () => {
      const { authService } = await import('@/lib/auth/auth-service')
      
      ;(authService.signOut as jest.Mock).mockResolvedValue({
        error: null
      })

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('false')
      })

      // Click sign out
      act(() => {
        getByText('Sign Out').click()
      })

      await waitFor(() => {
        expect(authService.signOut).toHaveBeenCalled()
        expect(getByTestId('user-id')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent('Failed to initialize authentication')
        expect(getByTestId('loading')).toHaveTextContent('false')
      })
    })

    it('should clear errors when clearError is called', async () => {
      const TestWithClearError = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="error">{auth.error?.message || 'no-error'}</div>
            <button onClick={auth.clearError}>Clear Error</button>
          </div>
        )
      }

      mockSupabase.auth.getSession.mockRejectedValue(new Error('Test error'))

      const { getByText, getByTestId } = render(
        <AuthProvider>
          <TestWithClearError />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent('Failed to initialize authentication')
      })

      act(() => {
        getByText('Clear Error').click()
      })

      expect(getByTestId('error')).toHaveTextContent('no-error')
    })
  })

  describe('Memory Leaks Prevention', () => {
    it('should cleanup subscriptions on unmount', async () => {
      const unsubscribeMock = jest.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponentOutsideProvider = () => {
        useAuth() // This should throw
        return <div>Test</div>
      }

      // Suppress error boundary console error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')

      spy.mockRestore()
    })
  })
})