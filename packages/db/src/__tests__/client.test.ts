/**
 * @fileMetadata
 * @purpose Tests for Supabase client creation and configuration
 * @owner test-team
 * @dependencies ["vitest", "@supabase/supabase-js", "next/headers"]
 * @exports []
 * @complexity medium
 * @tags ["test", "database", "supabase", "client"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:19:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserSupabaseClient, createServerSupabaseClient } from '../supabase-factory'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
}

// Create a mock for createClient that can be spied on
const mockCreateClient = vi.fn(() => ({
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }))
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    get: vi.fn(),
    set: vi.fn()
  }))
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value
    })
  })

  describe('createBrowserSupabaseClient', () => {
    it('should create client with correct configuration', () => {
      const client = createBrowserSupabaseClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('should use environment variables', () => {
      createBrowserSupabaseClient()
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: true,
            autoRefreshToken: true
          })
        })
      )
    })

    it('should configure auth settings correctly', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createBrowserSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.auth).toMatchObject({
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      })
    })

    it('should throw error if environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(() => createBrowserSupabaseClient()).toThrow('Missing Supabase environment variables')
    })
  })

  describe('createServerSupabaseClient', () => {
    it('should create server client with service role key', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createServerSupabaseClient()
      
      expect(createClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.SUPABASE_SERVICE_ROLE_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
            autoRefreshToken: false
          })
        })
      )
    })

    it('should configure server-specific auth settings', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createServerSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.auth).toMatchObject({
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      })
    })

    it('should configure database options', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createServerSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.db).toMatchObject({
        schema: 'public'
      })
    })

    it('should throw error if service role key is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      
      expect(() => createServerSupabaseClient()).toThrow('Missing Supabase service role key')
    })
  })

  describe('Environment Validation', () => {
    it('should validate all required environment variables for browser client', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      expect(() => createBrowserSupabaseClient()).toThrow('Missing Supabase environment variables')
    })

    it('should validate URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'
      
      expect(() => createBrowserSupabaseClient()).toThrow('Invalid Supabase URL format')
    })

    it('should validate key format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'invalid-key'
      
      expect(() => createBrowserSupabaseClient()).toThrow('Invalid Supabase key format')
    })
  })

  describe('Client Configuration', () => {
    it('should set correct global options', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createBrowserSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.global).toMatchObject({
        headers: expect.objectContaining({
          'X-Client-Info': expect.stringContaining('claimguardian')
        })
      })
    })

    it('should configure realtime settings', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createBrowserSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.realtime).toMatchObject({
        params: expect.objectContaining({
          eventsPerSecond: 10
        })
      })
    })

    it('should configure storage settings', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      createBrowserSupabaseClient()
      
      const config = createClient.mock.calls[0][2]
      expect(config.storage).toMatchObject({
        bucketId: 'property-documents'
      })
    })
  })
})