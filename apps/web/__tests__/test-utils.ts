/**
 * @fileMetadata
 * @purpose "Comprehensive test utilities for ClaimGuardian test suite"
 * @owner test-team
 * @dependencies ["@testing-library/react", "jest"]
 * @complexity medium
 * @tags ["testing", "utils", "mocks"]
 * @status stable
 */

import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  user_metadata: { full_name: "Test User" },
  ...overrides,
});

export const createMockProperty = (overrides = {}) => ({
  id: "prop-123",
  address: "123 Test Street",
  city: "Miami",
  state: "FL",
  zip: "33101",
  user_id: "user-123",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockClaim = (overrides = {}) => ({
  id: "claim-123",
  property_id: "prop-123",
  user_id: "user-123",
  title: "Test Claim",
  description: "Test claim description",
  status: "draft",
  created_at: new Date().toISOString(),
  ...overrides,
});

// Enhanced Supabase mock with better typing
export const createMockSupabaseClient = (mockData = {}) => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    }),
    getUser: jest.fn().mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ 
      data: { user: createMockUser() }, 
      error: null 
    }),
    signUp: jest.fn().mockResolvedValue({ 
      data: { user: createMockUser() }, 
      error: null 
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue({ 
      data: { user: createMockUser() }, 
      error: null 
    }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    strictlyLeft: jest.fn().mockReturnThis(),
    strictlyRight: jest.fn().mockReturnThis(),
    notStrictlyLeft: jest.fn().mockReturnThis(),
    notStrictlyRight: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: mockData[table] || null, 
      error: null 
    }),
    maybeSingle: jest.fn().mockResolvedValue({ 
      data: mockData[table] || null, 
      error: null 
    }),
    then: jest.fn().mockResolvedValue({ 
      data: mockData[table] || [], 
      error: null 
    }),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ 
        data: { path: "test-path" }, 
        error: null 
      }),
      download: jest.fn().mockResolvedValue({ 
        data: new Blob(), 
        error: null 
      }),
      list: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      remove: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: "https://test.com/file.jpg" } 
      }),
    })),
  },
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
});

// Mock fetch responses
export const createMockFetchResponse = (data: unknown, ok = true) => {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response);
};

// Test wrapper with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Form data helper
export const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Async test helper
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock console methods
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mockMethods = {
    log: jest.spyOn(console, "log").mockImplementation(),
    info: jest.spyOn(console, "info").mockImplementation(),
    warn: jest.spyOn(console, "warn").mockImplementation(),
    error: jest.spyOn(console, "error").mockImplementation(),
  };

  return {
    ...mockMethods,
    restore: () => {
      Object.assign(console, originalConsole);
      Object.values(mockMethods).forEach(mock => mock.mockRestore());
    },
  };
};

// Mock AI response helper
export const createMockAIResponse = (content: string, usage = {}) => ({
  choices: [
    {
      message: {
        content,
        role: "assistant",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
    ...usage,
  },
  model: "gpt-4",
  created: Date.now(),
});

// Environment variable mock helper
export const mockEnvVar = (key: string, value: string) => {
  const original = process.env[key];
  process.env[key] = value;
  return () => {
    if (original !== undefined) {
      process.env[key] = original;
    } else {
      delete process.env[key];
    }
  };
};

// Custom matchers for testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidZipCode(): R;
    }
  }
}

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? "not " : ""}to be a valid email`,
      pass,
    };
  },
  
  toBeValidZipCode(received: string) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    const pass = zipRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? "not " : ""}to be a valid ZIP code`,
      pass,
    };
  },
});

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";