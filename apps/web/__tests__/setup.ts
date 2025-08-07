/**
 * @fileMetadata
 * @purpose "Jest test setup configuration with mocks and utilities"
 * @dependencies []
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "jest", "setup", "mocks"]
 * @status stable
 */

import '@testing-library/jest-dom' // Re-enabled for runtime testing

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/mock-path',
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'

// Mock window properties using global assignment
;(global as any).window = {
  ...global.window,
  location: {
    href: 'http://localhost:3000',
    pathname: '/test',
    search: '',
    hash: '',
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
  },
  navigator: {
    userAgent: 'jest-test-environment',
    platform: 'test',
    language: 'en-US',
  },
}

// Mock localStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
}

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null
  rootMargin: string = ''
  thresholds: ReadonlyArray<number> = []

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = options?.root || null
    this.rootMargin = options?.rootMargin || ''
    this.thresholds = options?.threshold ? (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : []
  }

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock fetch
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()

  // Reset fetch mock
  ;(global.fetch as jest.Mock).mockClear()

  // Suppress console outputs during tests unless explicitly testing them
  console.log = jest.fn()
  console.info = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  // Restore console after each test
  console.log = originalConsole.log
  console.info = originalConsole.info
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

// Global test timeout
jest.setTimeout(10000)
