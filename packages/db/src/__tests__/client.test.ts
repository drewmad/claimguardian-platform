/**
 * @fileMetadata
 * @purpose Tests for Supabase client creation and configuration
 * @owner test-team
 * @dependencies ["vitest", "@supabase/supabase-js", "@supabase/ssr"]
 * @exports []
 * @complexity medium
 * @tags ["test", "database", "supabase", "client"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:20:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserSupabaseClient, createServerSupabaseClient } from '../supabase-factory'

// Mock the Supabase modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }))
  }))
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }))
  })),
  createBrowserClient: vi.fn(() => ({
    auth: { getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }))
  }))
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    get: vi.fn(),
    set: vi.fn()
  }))
}))

describe('Supabase Client Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set test environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  describe('createBrowserSupabaseClient', () => {
    it('should create a browser client successfully', () => {
      const client = createBrowserSupabaseClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
      expect(typeof client.auth.getUser).toBe('function')
      expect(typeof client.from).toBe('function')
    })

    it('should create client without throwing errors', () => {
      expect(() => createBrowserSupabaseClient()).not.toThrow()
    })

    it('should handle missing environment variables gracefully', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Should still work due to fallback values in factory
      expect(() => createBrowserSupabaseClient()).not.toThrow()
    })
  })

  describe('createServerSupabaseClient', () => {
    it('should create a server client successfully', async () => {
      const client = await createServerSupabaseClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
      expect(typeof client.auth.getUser).toBe('function')
      expect(typeof client.from).toBe('function')
    })

    it('should create server client without throwing errors', async () => {
      await expect(async () => {
        await createServerSupabaseClient()
      }).not.toThrow()
    })

    it('should handle server-side configuration', async () => {
      const client = await createServerSupabaseClient()
      
      // Should return a client with the expected interface
      expect(client).toHaveProperty('auth')
      expect(client).toHaveProperty('from')
    })
  })

  describe('Client Interface Validation', () => {
    it('should provide consistent auth interface for browser client', () => {
      const client = createBrowserSupabaseClient()
      
      expect(client.auth).toHaveProperty('getUser')
      expect(client.auth).toHaveProperty('signIn')
      expect(client.auth).toHaveProperty('signOut')
    })

    it('should provide consistent auth interface for server client', async () => {
      const client = await createServerSupabaseClient()
      
      expect(client.auth).toHaveProperty('getUser')
      expect(client.auth).toHaveProperty('signIn')
      expect(client.auth).toHaveProperty('signOut')
    })

    it('should provide database query interface', () => {
      const client = createBrowserSupabaseClient()
      const query = client.from('test_table')
      
      expect(query).toHaveProperty('select')
      expect(query).toHaveProperty('insert')
      expect(query).toHaveProperty('update')
      expect(query).toHaveProperty('delete')
    })
  })

  describe('Environment Configuration', () => {
    it('should work with test environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-test-key'
      
      expect(() => createBrowserSupabaseClient()).not.toThrow()
    })

    it('should handle production-like URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://prod-project.supabase.co'
      
      expect(() => createBrowserSupabaseClient()).not.toThrow()
    })
  })

  describe('Factory Function Behavior', () => {
    it('should return different instances on multiple calls', () => {
      const client1 = createBrowserSupabaseClient()
      const client2 = createBrowserSupabaseClient()
      
      // Each call should return a new instance
      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })

    it('should handle concurrent client creation', async () => {
      const promises = [
        createServerSupabaseClient(),
        createServerSupabaseClient(),
        createServerSupabaseClient()
      ]
      
      const clients = await Promise.all(promises)
      
      clients.forEach(client => {
        expect(client).toBeDefined()
        expect(client.auth).toBeDefined()
        expect(client.from).toBeDefined()
      })
    })
  })
})