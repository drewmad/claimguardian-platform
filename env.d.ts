// Environment variables type definitions for ClaimGuardian
declare namespace NodeJS {
  interface ProcessEnv {
    // PUBLIC (exposed to browser if using Next/Vite conventions)
    NEXT_PUBLIC_APP_ENV: "development" | "staging" | "production";
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_DEBUG_AUTH: string;

    // SERVER-ONLY
    SUPABASE_SERVICE_ROLE_KEY: string;
    DATABASE_URL: string;
    OPENAI_API_KEY: string;
    GEMINI_API_KEY: string;
    RESEND_API_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    
    // Optional keys
    GOOGLE_MAPS_API_KEY?: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
  }
}

// Jest global types for testing
declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      (...args: Y): T;
      _isMockFunction: boolean;
      getMockImplementation(): ((...args: Y) => T) | undefined;
      mockClear(): void;
      mockReset(): void;
      mockRestore(): void;
      mockImplementation(fn?: (...args: Y) => T): Mock<T, Y>;
      mockImplementationOnce(fn?: (...args: Y) => T): Mock<T, Y>;
      mockReturnThis(): Mock<T, Y>;
      mockReturnValue(value: T): Mock<T, Y>;
      mockReturnValueOnce(value: T): Mock<T, Y>;
      mockResolvedValue(value: Awaited<T>): Mock<T, Y>;
      mockResolvedValueOnce(value: Awaited<T>): Mock<T, Y>;
      mockRejectedValue(value: any): Mock<T, Y>;
      mockRejectedValueOnce(value: any): Mock<T, Y>;
    }

    interface Expect {
      <T = any>(actual: T): JestMatchers<T>;
    }

    interface JestMatchers<T> {
      toBe(expected: T): void;
      toEqual(expected: T): void;
      toBeNull(): void;
      toBeUndefined(): void;
      toBeDefined(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(expected: any): void;
      toHaveBeenCalled(): void;
      toHaveBeenCalledWith(...args: any[]): void;
      toHaveBeenCalledTimes(times: number): void;
      toThrow(error?: string | Error | RegExp): void;
      toMatchObject(expected: Partial<T>): void;
    }

    function describe(description: string, fn: () => void): void;
    function test(description: string, fn: () => void | Promise<void>): void;
    function it(description: string, fn: () => void | Promise<void>): void;
    function beforeEach(fn: () => void | Promise<void>): void;
    function afterEach(fn: () => void | Promise<void>): void;
    function beforeAll(fn: () => void | Promise<void>): void;
    function afterAll(fn: () => void | Promise<void>): void;
    
    const expect: Expect;
  }

  // Jest globals
  const describe: typeof jest.describe;
  const test: typeof jest.test;
  const it: typeof jest.it;
  const beforeEach: typeof jest.beforeEach;
  const afterEach: typeof jest.afterEach;
  const beforeAll: typeof jest.beforeAll;
  const afterAll: typeof jest.afterAll;
  const expect: typeof jest.expect;

  // Add jest.Mock to global namespace
  namespace global {
    namespace jest {
      type Mock<T = any, Y extends any[] = any> = jest.Mock<T, Y>;
    }
  }
}

export {};