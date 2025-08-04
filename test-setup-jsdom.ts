/**
 * @fileMetadata
 * @purpose JSDOM-specific test setup for React component testing
 * @owner test-team
 * @dependencies ["vitest", "@testing-library/jest-dom", "jsdom"]
 * @exports []
 * @complexity low
 * @tags ["test", "setup", "jsdom", "react"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T21:52:00Z
 */

import { vi, expect, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import React from 'react'

// Make React available globally for JSX
global.React = React

expect.extend(matchers)

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn()
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => [])
  }),
  headers: () => ({
    get: vi.fn(),
    has: vi.fn(),
    entries: vi.fn(() => [])
  })
}))

// Mock Web APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests (but allow console.error for debugging)
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  // Reset fetch mock
  if (global.fetch && typeof global.fetch === 'function') {
    vi.mocked(global.fetch).mockClear()
  }
})

// Global test utilities
export const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['x'.repeat(size)], name, { type })
  return file
}

export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))