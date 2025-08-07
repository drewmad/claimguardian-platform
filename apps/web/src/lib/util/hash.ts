/**
 * Hash utilities for tile versioning and caching
 */
import { createHash } from 'crypto';

/**
 * Generate MD5 hash of data
 */
export function md5(data: Buffer | string): string {
  const hash = createHash('md5');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Generate SHA-256 hash of data
 */
export function sha256(data: Buffer | string): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Generate ETag for HTTP caching
 */
export function generateETag(data: Buffer | string): string {
  return `"${md5(data)}"`;
}

/**
 * Generate weak ETag for HTTP caching
 */
export function generateWeakETag(data: Buffer | string): string {
  return `W/"${md5(data)}"`;
}

/**
 * Generate tile-specific ETag including version signature
 */
export function generateTileETag(
  z: number,
  x: number,
  y: number,
  versionSig: string,
  tileData: Buffer
): string {
  const tileKey = `${versionSig}:${z}:${x}:${y}`;
  const combinedHash = md5(tileKey + md5(tileData));
  return `"${combinedHash}"`;
}

/**
 * Generate version-aware cache key
 */
export function generateVersionedKey(baseKey: string, version: string): string {
  return `${baseKey}:v${md5(version).substring(0, 8)}`;
}