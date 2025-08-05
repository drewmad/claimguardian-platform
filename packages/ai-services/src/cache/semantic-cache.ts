/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { AIRequest, AIResponse, ChatRequest } from '../types/index';

import { CacheManager } from './cache.manager';

interface SemanticCacheEntry {
  embedding: number[];
  request: AIRequest | ChatRequest;
  response: AIResponse;
  timestamp: Date;
  score?: number;
}

export class SemanticCache extends CacheManager {
  private embeddings: Map<string, SemanticCacheEntry> = new Map();
  private similarityThreshold: number = 0.85;
  private maxCacheSize: number = 1000; // Maximum entries in memory
  
  constructor(
    redisUrl?: string, 
    enabled: boolean = true,
    similarityThreshold: number = 0.85
  ) {
    super(redisUrl, enabled);
    this.similarityThreshold = similarityThreshold;
    
    // Load embeddings from Redis on startup
    this.loadEmbeddings();
  }
  
  async findSimilar(
    request: AIRequest | ChatRequest,
    embedding: number[],
    threshold: number = this.similarityThreshold
  ): Promise<AIResponse | null> {
    let bestMatch: { key: string; score: number; entry: SemanticCacheEntry } | null = null;
    
    // Search through embeddings
    for (const [key, entry] of this.embeddings) {
      const similarity = this.cosineSimilarity(embedding, entry.embedding);
      
      if (similarity > threshold && (!bestMatch || similarity > bestMatch.score)) {
        bestMatch = { key, score: similarity, entry };
      }
    }
    
    if (bestMatch) {
      console.log(`[SemanticCache] Found similar request with score ${bestMatch.score.toFixed(3)}`);
      
      // Return the cached response
      return {
        ...bestMatch.entry.response,
        cached: true,
        cacheScore: bestMatch.score
      };
    }
    
    // Fall back to exact match
    return await super.get(request);
  }
  
  async setWithEmbedding(
    request: AIRequest | ChatRequest,
    response: AIResponse,
    embedding: number[],
    ttlOverride?: number
  ): Promise<void> {
    // Store in regular cache
    await super.set(request, response, ttlOverride);
    
    // Store embedding
    const key = this.generateCacheKey(request);
    const entry: SemanticCacheEntry = {
      embedding,
      request,
      response,
      timestamp: new Date()
    };
    
    // Manage cache size
    if (this.embeddings.size >= this.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.embeddings.delete(oldestKey);
      }
    }
    
    this.embeddings.set(key, entry);
    
    // Persist to Redis
    await this.saveEmbedding(key, entry);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.embeddings) {
      const time = entry.timestamp.getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  private async loadEmbeddings(): Promise<void> {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys('ai:embedding:*');
      
      for (const key of keys.slice(0, this.maxCacheSize)) {
        const data = await this.redis.get(key);
        if (data) {
          const entry = JSON.parse(data) as SemanticCacheEntry;
          const cacheKey = key.replace('ai:embedding:', '');
          this.embeddings.set(cacheKey, entry);
        }
      }
      
      console.log(`[SemanticCache] Loaded ${this.embeddings.size} embeddings`);
    } catch (error) {
      console.error('[SemanticCache] Error loading embeddings:', error);
    }
  }
  
  private async saveEmbedding(key: string, entry: SemanticCacheEntry): Promise<void> {
    if (!this.redis) return;
    
    try {
      const ttl = this.calculateTTL(entry.request);
      await this.redis.set(
        `ai:embedding:${key}`,
        JSON.stringify(entry),
        'EX',
        ttl
      );
    } catch (error) {
      console.error('[SemanticCache] Error saving embedding:', error);
    }
  }
  
  // Generate a simple embedding for text (in production, use a real embedding model)
  async generateEmbedding(text: string): Promise<number[]> {
    // This is a placeholder - in production, you would use:
    // - OpenAI's text-embedding-ada-002
    // - Google's embedding models
    // - Or a local model like sentence-transformers
    
    // For now, create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding size
    
    // Simple word frequency based embedding
    for (const word of words) {
      const hash = this.hashString(word);
      const index = Math.abs(hash) % embedding.length;
      embedding[index] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
  
  
  
  async clearSemanticCache(): Promise<void> {
    this.embeddings.clear();
    
    if (this.redis) {
      try {
        const keys = await this.redis.keys('ai:embedding:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('[SemanticCache] Error clearing embeddings:', error);
      }
    }
    
    await super.clear();
  }
}