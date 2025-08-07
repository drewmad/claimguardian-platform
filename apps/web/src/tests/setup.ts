/**
 * Test Setup File
 * Global test configuration and mocks
 */

import { vi, beforeEach } from 'vitest';

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.MVT_VERSION_SIG = 'test@v1';
process.env.MVT_DEFAULT_TTL_SECONDS = '3600';
process.env.MVT_ACTIVE_TTL_SECONDS = '600';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock performance API if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
  } as any;
}

// Mock Buffer if not available (for browser-like environments)
if (typeof Buffer === 'undefined') {
  global.Buffer = {
    from: (data: any, encoding?: string) => new Uint8Array(data),
    alloc: (size: number) => new Uint8Array(size),
    isBuffer: (obj: any) => obj instanceof Uint8Array,
  } as any;
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockClear();
});

// Mock successful responses by default
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  headers: new Headers({
    'Content-Type': 'application/vnd.mapbox-vector-tile',
    'Content-Encoding': 'gzip',
  }),
  arrayBuffer: async () => new ArrayBuffer(100),
  json: async () => ({ success: true }),
  text: async () => 'OK',
});

// Export test utilities
export const createMockTileData = (size: number = 100): Buffer => {
  return Buffer.from('mock tile data'.repeat(size / 14));
};

export const createMockTileInfo = (overrides: Partial<any> = {}) => ({
  z: 10,
  x: 263,
  y: 416,
  layerSig: 'test@v1',
  ...overrides,
});

// Async test helper
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock database query responses
export const mockDatabaseResponse = (data: any) => ({
  rows: Array.isArray(data) ? data : [data],
  rowCount: Array.isArray(data) ? data.length : 1,
});

// Test data generators
export const generateTestTiles = (count: number) => {
  const tiles = [];
  for (let i = 0; i < count; i++) {
    tiles.push({
      z: 10 + (i % 8),
      x: 100 + i,
      y: 200 + i,
      layerSig: 'test@v1',
    });
  }
  return tiles;
};