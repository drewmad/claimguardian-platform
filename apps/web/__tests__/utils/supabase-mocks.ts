/**
 * @fileMetadata
 * @purpose "Properly typed Supabase mocks for testing"
 * @owner test-team
 * @dependencies ["@jest/globals", "@supabase/supabase-js"]
 * @exports ["createSupabaseMock", "MockSupabaseClient"]
 * @complexity medium
 * @tags ["test", "mock", "supabase"]
 * @status stable
 */

import { jest } from '@jest/globals'
import type { SupabaseClient, AuthResponse, UserResponse, Session } from '@supabase/supabase-js'
import type { Database } from '@claimguardian/db'

// Create mock types for better type safety
type MockAuthMethods = {
  signUp: jest.MockedFunction<any>
  signInWithPassword: jest.MockedFunction<any>
  signOut: jest.MockedFunction<any>
  resetPasswordForEmail: jest.MockedFunction<any>
  getUser: jest.MockedFunction<any>
  getSession: jest.MockedFunction<any>
}

type MockStorageMethods = {
  from: jest.MockedFunction<any>
}

// Create a properly typed mock for Supabase client
export type MockSupabaseClient = {
  auth: MockAuthMethods
  from: jest.MockedFunction<any>
  rpc: jest.MockedFunction<any>
  storage: MockStorageMethods
}

type SupabaseMockQuery = {
  select: jest.MockedFunction<any>
  insert: jest.MockedFunction<any>
  update: jest.MockedFunction<any>
  delete: jest.MockedFunction<any>
  upsert: jest.MockedFunction<any>
  eq: jest.MockedFunction<any>
  neq: jest.MockedFunction<any>
  gt: jest.MockedFunction<any>
  gte: jest.MockedFunction<any>
  lt: jest.MockedFunction<any>
  lte: jest.MockedFunction<any>
  like: jest.MockedFunction<any>
  ilike: jest.MockedFunction<any>
  is: jest.MockedFunction<any>
  in: jest.MockedFunction<any>
  contains: jest.MockedFunction<any>
  containedBy: jest.MockedFunction<any>
  rangeGt: jest.MockedFunction<any>
  rangeGte: jest.MockedFunction<any>
  rangeLt: jest.MockedFunction<any>
  rangeLte: jest.MockedFunction<any>
  rangeAdjacent: jest.MockedFunction<any>
  overlaps: jest.MockedFunction<any>
  textSearch: jest.MockedFunction<any>
  match: jest.MockedFunction<any>
  not: jest.MockedFunction<any>
  or: jest.MockedFunction<any>
  filter: jest.MockedFunction<any>
  order: jest.MockedFunction<any>
  limit: jest.MockedFunction<any>
  range: jest.MockedFunction<any>
  abortSignal: jest.MockedFunction<any>
  single: jest.MockedFunction<any>
  maybeSingle: jest.MockedFunction<any>
  csv: jest.MockedFunction<any>
  explain: jest.MockedFunction<any>
  rollback: jest.MockedFunction<any>
  returns: jest.MockedFunction<any>
  then: jest.MockedFunction<any>
  remove: jest.MockedFunction<any>
}

export function createSupabaseMock(): MockSupabaseClient & { _mockQuery: SupabaseMockQuery } {
  // Create a shared mock query object for backward compatibility
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    csv: jest.fn().mockReturnThis(),
    explain: jest.fn().mockReturnThis(),
    rollback: jest.fn().mockReturnThis(),
    returns: jest.fn().mockReturnThis(),
    then: jest.fn(),
    remove: jest.fn() // For storage operations
  }

  const fromMock = jest.fn().mockReturnValue(mockQuery as any)

  return {
    auth: {
      signUp: jest.fn().mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signInWithPassword: jest.fn().mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ 
        data: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            aud: 'authenticated',
            role: 'authenticated'
          } 
        }, 
        error: null 
      }),
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      })
    },
    from: fromMock,
    rpc: jest.fn(),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        move: jest.fn(),
        copy: jest.fn(),
        createSignedUrl: jest.fn(),
        createSignedUrls: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } }))
      })
    },
    // Expose the mock query for backward compatibility
    _mockQuery: mockQuery
  } as any
}

// Export a default mock instance
export const mockSupabase = createSupabaseMock()

// Helper functions for common test scenarios
export const mockAuthSuccess = (user?: any) => ({
  data: { 
    user: user || { 
      id: 'user-123', 
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      phone: null,
      phone_confirmed_at: null,
      confirmation_sent_at: null,
      confirmed_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
      recovery_sent_at: null,
      email_change_sent_at: null,
      new_email: null,
      invited_at: null,
      action_link: null,
      email_change: null,
      email_change_confirm_status: 0,
      banned_until: null,
      new_phone: null,
      phone_change: null,
      phone_change_token: null,
      phone_change_sent_at: null,
      is_anonymous: false,
      factors: null
    }, 
    session: { 
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        phone: null,
        phone_confirmed_at: null,
        confirmation_sent_at: null,
        confirmed_at: '2024-01-01T00:00:00Z',
        last_sign_in_at: '2024-01-01T00:00:00Z',
        recovery_sent_at: null,
        email_change_sent_at: null,
        new_email: null,
        invited_at: null,
        action_link: null,
        email_change: null,
        email_change_confirm_status: 0,
        banned_until: null,
        new_phone: null,
        phone_change: null,
        phone_change_token: null,
        phone_change_sent_at: null,
        is_anonymous: false,
        factors: null
      }
    } 
  },
  error: null
})

export const mockAuthError = (message: string) => ({
  data: { user: null, session: null },
  error: { 
    message,
    code: 'mock_error',
    status: 400,
    __isAuthError: true,
    name: 'AuthError'
  }
})

export const mockDbSuccess = <T>(data: T) => ({
  data,
  error: null
})

export const mockDbError = (message: string) => ({
  data: null,
  error: { message }
})

// Mock query builder for fluent API
export function createMockQueryBuilder(mockData?: any, mockError?: any) {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(mockError ? { data: null, error: mockError } : { data: mockData, error: null }),
    maybeSingle: jest.fn().mockResolvedValue(mockError ? { data: null, error: mockError } : { data: mockData, error: null }),
    csv: jest.fn().mockReturnThis(),
    explain: jest.fn().mockReturnThis(),
    rollback: jest.fn().mockReturnThis(),
    returns: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue(mockError ? { data: null, error: mockError } : { data: mockData, error: null }),
    remove: jest.fn().mockReturnThis()
  }
  
  // Make all chain methods return a promise when called at the end
  Object.keys(mockQuery).forEach(key => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      const originalMethod = mockQuery[key as keyof typeof mockQuery]
      mockQuery[key as keyof typeof mockQuery] = jest.fn((...args: any[]) => {
        // Call original method for chaining
        originalMethod.call(mockQuery, ...args)
        return mockQuery
      })
    }
  })
  
  return mockQuery
}

// Create typed mock for specific table operations
export function createTableMock<T>(tableName: string, defaultData?: T, defaultError?: any) {
  return jest.fn(() => createMockQueryBuilder(defaultData, defaultError))
}