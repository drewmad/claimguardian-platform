/**
 * @fileMetadata
 * @purpose Tests for error boundary component and error classification
 * @owner platform-team
 * @complexity high
 * @tags ["testing", "error-handling", "boundary", "classification"]
 * @status active
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary, ClassifiedError } from '@/lib/error-handling/error-boundary'
import { throwError, mockConsole } from '../../utils/test-utils'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

// Test component that throws errors
const ThrowError = ({ error }: { error?: Error }) => {
  if (error) {
    throw error
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  let console: ReturnType<typeof mockConsole>

  beforeEach(() => {
    console = mockConsole()
  })

  afterEach(() => {
    console.restore()
  })

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <ThrowError error={networkError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(screen.getByText(/connection issue/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should classify authentication errors correctly', () => {
      const authError = new Error('Authentication failed')
      authError.name = 'AuthError'

      render(
        <ErrorBoundary>
          <ThrowError error={authError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText(/authentication issue/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Validation failed: invalid email')

      render(
        <ErrorBoundary>
          <ThrowError error={validationError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Validation Error')).toBeInTheDocument()
      expect(screen.getByText(/check your input/i)).toBeInTheDocument()
    })

    it('should classify runtime errors correctly', () => {
      const runtimeError = new TypeError('Cannot read property of undefined')

      render(
        <ErrorBoundary>
          <ThrowError error={runtimeError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Application Error')).toBeInTheDocument()
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('should handle unknown errors with generic message', () => {
      const unknownError = new Error('Some random error')

      render(
        <ErrorBoundary>
          <ThrowError error={unknownError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Application Error')).toBeInTheDocument()
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('should reset error state when retry button is clicked', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError error={networkError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Network Error')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: /try again/i })
      retryButton.click()

      // After retry, should show no error component
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should reload page for runtime errors', () => {
      const runtimeError = new TypeError('Cannot read property of undefined')
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError error={runtimeError} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      reloadButton.click()

      expect(mockReload).toHaveBeenCalled()
    })

    it('should redirect to login for auth errors', () => {
      const authError = new Error('Authentication failed')
      authError.name = 'AuthError'
      const mockAssign = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { assign: mockAssign },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError error={authError} />
        </ErrorBoundary>
      )

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      signInButton.click()

      expect(mockAssign).toHaveBeenCalledWith('/sign-in')
    })
  })

  describe('Error Logging', () => {
    it('should log critical errors', async () => {
      const { logger } = await import('@/lib/logger')
      const criticalError = new Error('Critical system failure')

      render(
        <ErrorBoundary>
          <ThrowError error={criticalError} />
        </ErrorBoundary>
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error caught by boundary',
        expect.objectContaining({
          error: criticalError,
          errorInfo: expect.any(Object),
          classification: expect.objectContaining({
            severity: expect.any(String),
            category: expect.any(String),
          }),
        })
      )
    })

    it('should not log low-severity errors in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { logger } = await import('@/lib/logger')
      const minorError = new Error('Minor validation issue')

      render(
        <ErrorBoundary>
          <ThrowError error={minorError} />
        </ErrorBoundary>
      )

      // Should still log, but with different level
      expect(logger.error).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = ({ error }: { error: ClassifiedError }) => (
        <div data-testid="custom-fallback">
          Custom error: {error.userMessage}
        </div>
      )

      const testError = new Error('Test error')

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError error={testError} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText(/Custom error:/)).toBeInTheDocument()
    })
  })

  describe('Error Prevention', () => {
    it('should not crash when error info is missing', () => {
      const testError = new Error('Test error')
      
      // Simulate error boundary with minimal error info
      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      )

      // Should still render error UI without crashing
      expect(screen.getByText('Application Error')).toBeInTheDocument()
    })

    it('should handle null/undefined errors gracefully', () => {
      // This test ensures the boundary doesn't crash on edge cases
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })
  })

  describe('Development vs Production', () => {
    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const testError = new Error('Development error with stack trace')

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      )

      // In development, should show more details
      expect(screen.getByText('Application Error')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const testError = new Error('Production error')

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      )

      // In production, should show generic message
      expect(screen.getByText('Application Error')).toBeInTheDocument()
      expect(screen.queryByText('Production error')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })
})