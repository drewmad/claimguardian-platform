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
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@claimguardian/db'

// Create a properly typed mock for Supabase client
export type MockSupabaseClient = {
  auth: {
    signUp: jest.MockedFunction<SupabaseClient['auth']['signUp']>
    signInWithPassword: jest.MockedFunction<SupabaseClient['auth']['signInWithPassword']>
    signOut: jest.MockedFunction<SupabaseClient['auth']['signOut']>
    resetPasswordForEmail: jest.MockedFunction<SupabaseClient['auth']['resetPasswordForEmail']>
    getUser: jest.MockedFunction<SupabaseClient['auth']['getUser']>
    getSession: jest.MockedFunction<SupabaseClient['auth']['getSession']>
  }
  from: jest.MockedFunction<SupabaseClient<Database>['from']>
  rpc: jest.MockedFunction<SupabaseClient['rpc']>
  storage: {
    from: jest.MockedFunction<SupabaseClient['storage']['from']>
  }
}

export function createSupabaseMock(): MockSupabaseClient & { _mockQuery: any } {
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

  const fromMock = jest.fn() as jest.MockedFunction<SupabaseClient<Database>['from']>
  
  // Set up default chain methods for from() - return the shared mockQuery
  fromMock.mockReturnValue(mockQuery as any)

  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
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