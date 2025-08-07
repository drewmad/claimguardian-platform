/**
 * Tile Generator Tests
 * Unit tests for the vector tile generation system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateTile,
  generateCompressedTile,
  estimateTileComplexity,
  calculateTileBounds,
  isValidTile,
  getNeighboringTiles,
  calculateTilePriority,
} from '@/lib/map-utils/tile-generator';

// Mock the database connection
vi.mock('@/lib/db/pg', () => ({
  query: vi.fn(),
}));

import { query } from '@/lib/db/pg';

describe('Tile Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTile', () => {
    it('should generate tile data from database', async () => {
      const mockTileData = Buffer.from('mock mvt data');
      (query as any).mockResolvedValue({
        rows: [{ tile_data: mockTileData }]
      });

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await generateTile(tile);

      expect(result).toEqual(mockTileData);
      expect(query).toHaveBeenCalledWith(
        'SELECT public.get_parcel_tile_mvt($1, $2, $3) as tile_data',
        [10, 263, 416]
      );
    });

    it('should handle empty tile data', async () => {
      (query as any).mockResolvedValue({
        rows: [{ tile_data: null }]
      });

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await generateTile(tile);

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should handle database errors', async () => {
      (query as any).mockRejectedValue(new Error('Database connection failed'));

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };

      await expect(generateTile(tile)).rejects.toThrow('Database connection failed');
    });
  });

  describe('generateCompressedTile', () => {
    it('should generate and compress tile data', async () => {
      const mockTileData = Buffer.from('mock mvt data that should compress');
      (query as any).mockResolvedValue({
        rows: [{ tile_data: mockTileData }]
      });

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await generateCompressedTile(tile);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      
      // Check if it's gzipped (starts with gzip magic bytes)
      expect(result[0]).toBe(0x1f);
      expect(result[1]).toBe(0x8b);
    });

    it('should compress empty tiles', async () => {
      (query as any).mockResolvedValue({
        rows: [{ tile_data: null }]
      });

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await generateCompressedTile(tile);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0); // Gzip header even for empty data
    });
  });

  describe('estimateTileComplexity', () => {
    it('should estimate parcel count for tile', async () => {
      (query as any).mockResolvedValue({
        rows: [{ parcel_count: 150 }]
      });

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await estimateTileComplexity(tile);

      expect(result).toBe(150);
      expect(query).toHaveBeenCalledWith(
        'SELECT public.estimate_tile_parcel_count($1, $2, $3) as parcel_count',
        [10, 263, 416]
      );
    });

    it('should handle estimation errors', async () => {
      (query as any).mockRejectedValue(new Error('Estimation failed'));

      const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
      const result = await estimateTileComplexity(tile);

      expect(result).toBe(0); // Should return 0 on error
    });
  });

  describe('calculateTileBounds', () => {
    it('should calculate correct bounds for world tile', () => {
      const bounds = calculateTileBounds(0, 0, 0);
      
      expect(bounds.minLon).toBeCloseTo(-180, 1);
      expect(bounds.maxLon).toBeCloseTo(180, 1);
      expect(bounds.minLat).toBeCloseTo(-85.051, 1);
      expect(bounds.maxLat).toBeCloseTo(85.051, 1);
    });

    it('should calculate bounds for Florida tile', () => {
      // This tile should cover part of the US
      const bounds = calculateTileBounds(10, 263, 416);
      
      expect(bounds.minLon).toBeGreaterThan(-95);
      expect(bounds.maxLon).toBeLessThan(-70);
      expect(bounds.minLat).toBeGreaterThan(25);
      expect(bounds.maxLat).toBeLessThan(40);
    });

    it('should have proper coordinate ordering', () => {
      const bounds = calculateTileBounds(12, 1000, 1500);
      
      expect(bounds.minLon).toBeLessThan(bounds.maxLon);
      expect(bounds.minLat).toBeLessThan(bounds.maxLat);
      expect(bounds.center.lon).toBeGreaterThan(bounds.minLon);
      expect(bounds.center.lon).toBeLessThan(bounds.maxLon);
      expect(bounds.center.lat).toBeGreaterThan(bounds.minLat);
      expect(bounds.center.lat).toBeLessThan(bounds.maxLat);
    });
  });

  describe('isValidTile', () => {
    it('should validate correct tiles', () => {
      expect(isValidTile(0, 0, 0)).toBe(true);
      expect(isValidTile(10, 512, 512)).toBe(true);
      expect(isValidTile(18, 131071, 131071)).toBe(true);
    });

    it('should reject invalid tiles', () => {
      expect(isValidTile(-1, 0, 0)).toBe(false);
      expect(isValidTile(25, 0, 0)).toBe(false);
      expect(isValidTile(10, -1, 0)).toBe(false);
      expect(isValidTile(10, 1024, 0)).toBe(false);
      expect(isValidTile(10, 0, 1024)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidTile(0, 1, 0)).toBe(false); // Only one tile at z0
      expect(isValidTile(1, 1, 1)).toBe(true);  // Four tiles at z1
      expect(isValidTile(22, 0, 0)).toBe(true); // Max zoom level
    });
  });

  describe('getNeighboringTiles', () => {
    it('should get 8 neighbors for center tile', () => {
      const neighbors = getNeighboringTiles(10, 500, 500, 'test@v1');
      
      expect(neighbors).toHaveLength(8);
      expect(neighbors.every(tile => tile.z === 10)).toBe(true);
      expect(neighbors.every(tile => tile.layerSig === 'test@v1')).toBe(true);
    });

    it('should handle edge tiles', () => {
      const neighbors = getNeighboringTiles(10, 0, 0, 'test@v1');
      
      // Should only return valid neighbors (not negative coordinates)
      expect(neighbors.length).toBeLessThan(8);
      expect(neighbors.every(tile => tile.x >= 0 && tile.y >= 0)).toBe(true);
    });

    it('should handle corner tiles', () => {
      const maxTile = Math.pow(2, 10) - 1;
      const neighbors = getNeighboringTiles(10, maxTile, maxTile, 'test@v1');
      
      expect(neighbors.length).toBeLessThan(8);
      expect(neighbors.every(tile => tile.x < Math.pow(2, 10))).toBe(true);
      expect(neighbors.every(tile => tile.y < Math.pow(2, 10))).toBe(true);
    });
  });

  describe('calculateTilePriority', () => {
    it('should prioritize lower zoom levels', () => {
      const lowZoom = calculateTilePriority(6, 16, 16);
      const highZoom = calculateTilePriority(16, 16, 16);
      
      expect(lowZoom).toBeGreaterThan(highZoom);
    });

    it('should prioritize center tiles', () => {
      const centerTile = calculateTilePriority(10, 512, 512); // Center of z10
      const edgeTile = calculateTilePriority(10, 0, 0);       // Edge of z10
      
      expect(centerTile).toBeGreaterThanOrEqual(edgeTile);
    });

    it('should return values in valid range', () => {
      for (let z = 6; z <= 18; z++) {
        for (let x = 0; x < 10; x++) {
          for (let y = 0; y < 10; y++) {
            const priority = calculateTilePriority(z, x, y);
            expect(priority).toBeGreaterThanOrEqual(1);
            expect(priority).toBeLessThanOrEqual(10);
          }
        }
      }
    });

    it('should handle edge cases', () => {
      expect(calculateTilePriority(0, 0, 0)).toBeGreaterThan(0);
      expect(calculateTilePriority(22, 0, 0)).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should calculate bounds efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateTileBounds(10, i % 1024, i % 1024);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should validate tiles efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        isValidTile(i % 23, i % 1024, i % 1024);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Integration Tests', () => {
    it('should generate tiles for Florida coordinates', async () => {
      const mockTileData = Buffer.from('florida parcel data');
      (query as any).mockResolvedValue({
        rows: [{ tile_data: mockTileData }]
      });

      // Miami area tile
      const tile = { z: 12, x: 1174, y: 1803, layerSig: 'properties@v1' };
      const result = await generateTile(tile);

      expect(result).toEqual(mockTileData);
    });

    it('should handle tiles with no parcel data', async () => {
      (query as any).mockResolvedValue({
        rows: [{ tile_data: Buffer.alloc(0) }]
      });

      // Ocean tile (should have no parcels)
      const tile = { z: 10, x: 200, y: 200, layerSig: 'properties@v1' };
      const result = await generateTile(tile);

      expect(result.length).toBe(0);
    });
  });
});

describe('Tile System Error Handling', () => {
  it('should gracefully handle malformed database responses', async () => {
    (query as any).mockResolvedValue({
      rows: [{ tile_data: 'not a buffer' }]
    });

    const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };
    const result = await generateTile(tile);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle missing database function', async () => {
    (query as any).mockRejectedValue(new Error('function public.get_parcel_tile_mvt does not exist'));

    const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };

    await expect(generateTile(tile)).rejects.toThrow('function public.get_parcel_tile_mvt does not exist');
  });

  it('should handle network timeouts', async () => {
    (query as any).mockRejectedValue(new Error('connection timeout'));

    const tile = { z: 10, x: 263, y: 416, layerSig: 'test@v1' };

    await expect(generateTile(tile)).rejects.toThrow('connection timeout');
  });
});