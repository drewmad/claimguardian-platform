/**
 * @fileMetadata
 * @purpose Testing utilities with custom render function and mocks
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "utilities", "render", "mocks"]
 * @status active
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock AuthProvider for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>
}

// Mock ErrorBoundary for testing
const MockErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-error-boundary">{children}</div>
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockErrorBoundary>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </MockErrorBoundary>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> => render(ui, { wrapper: AllTheProviders, ...options })

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    firstName: 'Test',
    lastName: 'User',
  },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockAuthState = (overrides = {}): {
  user: null | any;
  loading: boolean;
  error: null | any;
  sessionWarning: boolean;
  signIn: jest.Mock;
  signUp: jest.Mock;
  signOut: jest.Mock;
  resetPassword: jest.Mock;
  updatePassword: jest.Mock;
  clearError: jest.Mock;
  clearSessionWarning: jest.Mock;
  [key: string]: any;
} => ({
  user: null,
  loading: false,
  error: null,
  sessionWarning: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  clearError: jest.fn(),
  clearSessionWarning: jest.fn(),
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: createMockUser(),
  ...overrides,
})

export const createMockSupabaseResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  const response: any = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn(() => Promise.resolve(data)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    formData: jest.fn(() => Promise.resolve(new FormData())),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    type: 'basic' as ResponseType,
    url: '',
    redirected: false,
  }
  response.clone = jest.fn(() => ({ ...response }))
  const typedResponse = response as Response
  
  ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(typedResponse)
  return typedResponse
}

// Mock error responses
export const mockApiError = (error: string, status = 500) => {
  const response: any = {
    ok: false,
    status,
    statusText: 'Error',
    json: jest.fn(() => Promise.resolve({ error })),
    text: jest.fn(() => Promise.resolve(JSON.stringify({ error }))),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    formData: jest.fn(() => Promise.resolve(new FormData())),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    type: 'basic' as ResponseType,
    url: '',
    redirected: false,
  }
  response.clone = jest.fn(() => ({ ...response }))
  const typedResponse = response as Response
  
  ;(global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error(error))
  return typedResponse
}

// Wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock timer helpers
export const advanceTimersByTime = (ms: number) => {
  jest.advanceTimersByTime(ms)
}

export const runAllTimers = () => {
  jest.runAllTimers()
}

// Test environment helpers
export const mockLocalStorage = (): Storage & {
  getItem: jest.MockedFunction<(key: string) => string | null>;
  setItem: jest.MockedFunction<(key: string, value: string) => void>;
  removeItem: jest.MockedFunction<(key: string) => void>;
  clear: jest.MockedFunction<() => void>;
  key: jest.MockedFunction<(index: number) => string | null>;
} => {
  const store: Record<string, string> = {}
  
  const localStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    },
  }
  
  return localStorage as Storage & typeof localStorage
}

// Mock console for testing logging
export const mockConsole = (): {
  log: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
  restore: () => void;
} => {
  const originalConsole = { ...console }
  const consoleMock = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
  
  Object.assign(console, consoleMock)
  
  return {
    ...consoleMock,
    restore: () => Object.assign(console, originalConsole),
  }
}

// Helper to test async error boundaries
export const throwError = (message: string) => {
  throw new Error(message)
}

// Helper to simulate network delays
export const delay = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Helper to simulate user interactions
export const simulateTyping = async (element: HTMLElement, text: string) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()
  await user.clear(element)
  await user.type(element, text)
}

export const simulateClick = async (element: HTMLElement) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()
  await user.click(element)
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { customRender as render }