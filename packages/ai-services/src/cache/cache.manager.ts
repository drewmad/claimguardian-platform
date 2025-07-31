import { createHash } from 'crypto';

import Redis from 'ioredis';

import { 
  AIRequest, 
  AIResponse, 
  ChatRequest, 
  CacheStats,
  CachedResponse 
} from '../types/index';

export class CacheManager {
  protected redis: Redis | null = null;
  private defaultTTL: number = 3600; // 1 hour default
  private enabled: boolean = true;
  
  constructor(redisUrl?: string, enabled: boolean = true) {
    this.enabled = enabled;
    
    if (enabled && redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        });
        
        this.redis.on('error', (err) => {
          console.error('[CacheManager] Redis error:', err);
          // Don't disable cache on errors, just log them
        });
        
        this.redis.on('connect', () => {
          console.log('[CacheManager] Connected to Redis');
        });
      } catch (error) {
        console.error('[CacheManager] Failed to initialize Redis:', error);
        this.enabled = false;
      }
    } else {
      this.enabled = false;
    }
  }
  
  async get(request: AIRequest | ChatRequest): Promise<AIResponse | null> {
    if (!this.enabled || !this.redis) return null;
    
    try {
      const key = this.generateCacheKey(request);
      const cached = await this.redis.get(key);
      
      if (cached) {
        // Track cache hit
        await this.incrementStat('hits');
        
        const response = JSON.parse(cached) as CachedResponse;
        
        // Check if cache is still valid
        if (new Date(response.expiresAt) > new Date()) {
          return {
            ...response,
            cached: true
          };
        } else {
          // Cache expired, delete it
          await this.redis.del(key);
        }
      }
      
      // Track cache miss
      await this.incrementStat('misses');
      return null;
    } catch (error) {
      console.error('[CacheManager] Error getting cache:', error);
      return null;
    }
  }
  
  async set(
    request: AIRequest | ChatRequest, 
    response: AIResponse,
    ttlOverride?: number
  ): Promise<void> {
    if (!this.enabled || !this.redis) return;
    
    try {
      const key = this.generateCacheKey(request);
      const ttl = ttlOverride || this.calculateTTL(request);
      
      const cachedResponse: CachedResponse = {
        ...response,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
        cacheKey: key
      };
      
      await this.redis.set(
        key,
        JSON.stringify(cachedResponse),
        'EX',
        ttl
      );
      
      // Track cache set
      await this.incrementStat('sets');
    } catch (error) {
      console.error('[CacheManager] Error setting cache:', error);
    }
  }
  
  async invalidate(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) return 0;
    
    try {
      const keys = await this.redis.keys(`ai:cache:*${pattern}*`);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('[CacheManager] Error invalidating cache:', error);
      return 0;
    }
  }
  
  async getStats(): Promise<CacheStats> {
    if (!this.enabled || !this.redis) {
      return { hits: 0, misses: 0, sets: 0, hitRate: 0 };
    }
    
    try {
      const stats = await this.redis.hgetall('cache:stats');
      const hits = parseInt(stats.hits || '0');
      const misses = parseInt(stats.misses || '0');
      const sets = parseInt(stats.sets || '0');
      
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;
      
      return { hits, misses, sets, hitRate };
    } catch (error) {
      console.error('[CacheManager] Error getting stats:', error);
      return { hits: 0, misses: 0, sets: 0, hitRate: 0 };
    }
  }
  
  async clear(): Promise<void> {
    if (!this.enabled || !this.redis) return;
    
    try {
      const keys = await this.redis.keys('ai:cache:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      await this.redis.del('cache:stats');
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error);
    }
  }
  
  protected generateCacheKey(request: AIRequest | ChatRequest): string {
    // Normalize request for consistent cache keys
    const normalized: Record<string, unknown> = {
      feature: request.feature,
      temperature: Math.round((request.temperature || 0.7) * 10) / 10,
      maxTokens: request.maxTokens || 2048
    };
    
    // Handle different request types
    if ('prompt' in request) {
      normalized.prompt = request.prompt.trim().toLowerCase();
      normalized.systemPrompt = request.systemPrompt?.trim().toLowerCase();
    } else if ('messages' in request) {
      // For chat requests, include recent message history
      normalized.messages = request.messages
        .slice(-3) // Only last 3 messages for cache key
        .map(m => ({
          role: m.role,
          content: m.content.trim().toLowerCase().substring(0, 100) // First 100 chars
        }));
    }
    
    // Create deterministic hash
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16); // Use first 16 chars of hash
      
    return `ai:cache:${request.feature}:${hash}`;
  }
  
  protected calculateTTL(request: AIRequest | ChatRequest): number {
    // Dynamic TTL based on feature and content type
    const ttlMap: Record<string, number> = {
      'clarity': 7 * 24 * 60 * 60,     // 7 days - calculations rarely change
      'clara': 60 * 60,                // 1 hour - emotional responses need freshness
      'max': 24 * 60 * 60,             // 24 hours - market data changes daily
      'sentinel': 60 * 60,             // 1 hour - deadlines are time-sensitive
      'generic': 3 * 60 * 60,          // 3 hours default
      'document-extractor': 7 * 24 * 60 * 60, // 7 days - documents don't change
      'damage-analyzer': 24 * 60 * 60  // 24 hours - analysis can be reused
    };
    
    return ttlMap[request.feature] || ttlMap.generic;
  }
  
  private async incrementStat(stat: 'hits' | 'misses' | 'sets'): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.hincrby('cache:stats', stat, 1);
    } catch (_error) {
      // Ignore stat tracking errors
    }
  }
  
  async healthCheck(): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;
    
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
  
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}