/**
 * GZIP compression utilities for tile responses
 */
import { gzipSync, gunzipSync } from 'zlib';

/**
 * Compress data using gzip
 */
export function compress(data: Buffer | string): Buffer {
  const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return gzipSync(inputBuffer);
}

/**
 * Decompress gzipped data
 */
export function decompress(data: Buffer): Buffer {
  return gunzipSync(data);
}

/**
 * Check if data is already gzipped
 */
export function isGzipped(data: Buffer): boolean {
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}

/**
 * Conditionally compress data only if it's not already compressed
 */
export function conditionalCompress(data: Buffer): Buffer {
  if (isGzipped(data)) {
    return data;
  }
  return compress(data);
}

/**
 * Get compression ratio as percentage
 */
export function getCompressionRatio(original: Buffer, compressed: Buffer): number {
  return ((original.length - compressed.length) / original.length) * 100;
}