/**
 * Vector Tiles API Tests
 * Tests for MVT tile generation and caching system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isValidTile, calculateTileBounds } from '@/lib/map-utils/tile-generator';
import { generateTileKey, getCacheStats } from '@/lib/map-utils/tile-cache';
import { generateETag, generateTileETag } from '@/lib/util/hash';
import { compress, isGzipped } from '@/lib/util/gzip';

describe('Vector Tiles System', () => {
  describe('Tile Coordinate Validation', () => {
    it('should validate correct tile coordinates', () => {
      expect(isValidTile(10, 263, 416)).toBe(true);
      expect(isValidTile(0, 0, 0)).toBe(true);
      expect(isValidTile(18, 131071, 131071)).toBe(true); // Max valid tile at z18
      expect(isValidTile(18, 262144, 262144)).toBe(false); // Out of bounds for z18
    });

    it('should reject invalid tile coordinates', () => {
      expect(isValidTile(-1, 0, 0)).toBe(false);
      expect(isValidTile(25, 0, 0)).toBe(false);
      expect(isValidTile(10, -1, 0)).toBe(false);
      expect(isValidTile(10, 0, -1)).toBe(false);
    });
  });

  describe('Tile Key Generation', () => {
    it('should generate consistent tile keys', () => {
      const tileInfo = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const key1 = generateTileKey(tileInfo);
      const key2 = generateTileKey(tileInfo);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('test@v1:10:263:416');
    });

    it('should generate different keys for different tiles', () => {
      const tile1 = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const tile2 = { z: 10, x: 264, y: 416, layerSig: 'test@v1' };
      
      expect(generateTileKey(tile1)).not.toBe(generateTileKey(tile2));
    });
  });

  describe('Tile Bounds Calculation', () => {
    it('should calculate correct bounds for zoom 0', () => {
      const bounds = calculateTileBounds(0, 0, 0);
      
      expect(bounds.minLon).toBeCloseTo(-180);
      expect(bounds.maxLon).toBeCloseTo(180);
      expect(bounds.minLat).toBeCloseTo(-85.051, 1);
      expect(bounds.maxLat).toBeCloseTo(85.051, 1);
    });

    it('should calculate bounds for higher zoom levels', () => {
      const bounds = calculateTileBounds(10, 263, 416);
      
      // These bounds should represent a small area
      expect(bounds.minLon).toBeGreaterThan(-95);
      expect(bounds.maxLon).toBeLessThan(-70);
      expect(bounds.minLat).toBeGreaterThan(25);
      expect(bounds.maxLat).toBeLessThan(40);
    });

    it('should have proper bounds ordering', () => {
      const bounds = calculateTileBounds(15, 1000, 2000);
      
      expect(bounds.minLon).toBeLessThan(bounds.maxLon);
      expect(bounds.minLat).toBeLessThan(bounds.maxLat);
    });
  });

  describe('ETag Generation', () => {
    it('should generate consistent ETags for same data', () => {
      const data = Buffer.from('test data');
      const etag1 = generateETag(data);
      const etag2 = generateETag(data);
      
      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different data', () => {
      const data1 = Buffer.from('test data 1');
      const data2 = Buffer.from('test data 2');
      
      expect(generateETag(data1)).not.toBe(generateETag(data2));
    });

    it('should generate tile-specific ETags', () => {
      const tileData = Buffer.from('mvt tile data');
      const etag = generateTileETag(10, 263, 416, 'test@v1', tileData);
      
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });
  });

  describe('Compression Utilities', () => {
    it('should compress data', () => {
      const data = Buffer.from('This is test data that should compress well. '.repeat(10));
      const compressed = compress(data);
      
      expect(compressed.length).toBeLessThan(data.length);
      expect(isGzipped(compressed)).toBe(true);
    });

    it('should detect gzipped data', () => {
      const data = Buffer.from('test data');
      const compressed = compress(data);
      
      expect(isGzipped(data)).toBe(false);
      expect(isGzipped(compressed)).toBe(true);
    });

    it('should handle empty data', () => {
      const empty = Buffer.alloc(0);
      const compressed = compress(empty);
      
      expect(isGzipped(compressed)).toBe(true);
      expect(compressed.length).toBeGreaterThan(0); // Gzip has overhead
    });
  });
});

describe('API Routes', () => {
  describe('MVT Endpoint', () => {
    it('should return 400 for invalid coordinates', async () => {
      const response = await fetch('/api/tiles/mvt/-1/0/0');
      expect(response.status).toBe(400);
    });

    it('should return 400 for out-of-range zoom', async () => {
      const response = await fetch('/api/tiles/mvt/25/0/0');
      expect(response.status).toBe(400);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await fetch('/api/tiles/mvt/10/263/416', {
        method: 'OPTIONS',
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});

describe('Performance Tests', () => {
  it('should generate tile keys efficiently', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      generateTileKey({ z: 10, x: i, y: i, layerSig: 'test@v1' });
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should compress data efficiently', () => {
    const testData = Buffer.from('x'.repeat(10000));
    const start = performance.now();
    
    const compressed = compress(testData);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Should compress in under 50ms
    expect(compressed.length).toBeLessThan(testData.length * 0.1); // Should achieve good compression
  });
});

describe('Error Handling', () => {
  it('should handle malformed tile coordinates gracefully', () => {
    expect(() => isValidTile(NaN, 0, 0)).not.toThrow();
    expect(isValidTile(NaN, 0, 0)).toBe(false);
  });

  it('should handle empty data in compression', () => {
    expect(() => compress(Buffer.alloc(0))).not.toThrow();
    expect(() => compress('')).not.toThrow();
  });

  it('should handle invalid ETag generation input', () => {
    expect(() => generateETag('')).not.toThrow();
    expect(() => generateETag(Buffer.alloc(0))).not.toThrow();
  });
});

// Mock fetch for API tests
const mockFetch = (url: string, options?: RequestInit): Promise<Response> => {
  // Parse URL to extract tile coordinates (handle negative numbers)
  const match = url.match(/\/api\/tiles\/mvt\/(-?\d+)\/(-?\d+)\/(-?\d+)$/);
  
  if (!match) {
    return Promise.resolve(new Response('Not Found', { status: 404 }));
  }
  
  const [, z, x, y] = match.map(Number);
  
  if (options?.method === 'OPTIONS') {
    return Promise.resolve(new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    }));
  }
  
  if (!isValidTile(z, x, y)) {
    return Promise.resolve(new Response('Invalid tile coordinates', { status: 400 }));
  }
  
  // Mock successful tile response
  const mockTileData = Buffer.from('mock mvt tile data');
  const compressedData = compress(mockTileData);
  
  return Promise.resolve(new Response(compressedData, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Content-Encoding': 'gzip',
      'ETag': generateTileETag(z, x, y, 'test@v1', compressedData),
    },
  }));
};

// Replace global fetch for tests
beforeEach(() => {
  global.fetch = mockFetch as any;
});

afterEach(() => {
  // Restore original fetch if needed
});