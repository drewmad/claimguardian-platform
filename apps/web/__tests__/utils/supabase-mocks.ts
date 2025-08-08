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

import { jest } from "@jest/globals";

// Simplified mock types to avoid jest function resolution issues
export type MockSupabaseClient = {
  auth: {
    signUp: jest.MockedFunction<any>;
    signInWithPassword: jest.MockedFunction<any>;
    signOut: jest.MockedFunction<any>;
    resetPasswordForEmail: jest.MockedFunction<any>;
    getUser: jest.MockedFunction<any>;
    getSession: jest.MockedFunction<any>;
    onAuthStateChange: jest.MockedFunction<any>;
    signInWithOAuth: jest.MockedFunction<any>;
  };
  from: jest.MockedFunction<any>;
  rpc: jest.MockedFunction<any>;
  storage: {
    from: jest.MockedFunction<any>;
  };
  _mockQuery?: any; // For backward compatibility with existing tests
};

export function createSupabaseMock(): MockSupabaseClient & { _mockQuery: any } {
  // Create mock query builder chain with simpler approach
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
    single: jest.fn(),
    maybeSingle: jest.fn(),
    explain: jest.fn(),
    then: jest.fn(),
  };

  const fromMock = jest.fn().mockReturnValue(mockQuery);

  return {
    auth: {
      signUp: jest.fn() as any,
      signInWithPassword: jest.fn() as any,
      signOut: jest.fn().mockResolvedValue({ error: null }) as any,
      resetPasswordForEmail: jest.fn() as any,
      getUser: jest.fn() as any,
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }) as any,
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }) as any,
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { provider: 'google', url: 'https://example.com' }, error: null }) as any,
    },
    from: fromMock as any,
    rpc: jest.fn() as any,
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
        getPublicUrl: jest.fn(),
      }) as any,
    },
    _mockQuery: mockQuery,
  };
}

// Helper function to create a mock with custom return values
export function createSupabaseMockWithData(data: any, error: any = null) {
  const mock = createSupabaseMock();
  mock._mockQuery.single.mockResolvedValue({ data, error });
  mock._mockQuery.then.mockResolvedValue({ data, error });
  return mock;
}

// Helper function to create a mock that returns an error
export function createSupabaseMockWithError(error: any) {
  return createSupabaseMockWithData(null, error);
}

// Legacy helper functions for backward compatibility
export function mockAuthSuccess() {
  return {
    data: {
      user: { id: "user-123", email: "test@example.com" },
      session: null,
    },
    error: null,
  };
}

export function mockAuthError(message: string = "Authentication failed") {
  return {
    data: { user: null, session: null },
    error: { message },
  };
}
