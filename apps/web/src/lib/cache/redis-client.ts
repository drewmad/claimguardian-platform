/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "High-performance Redis client with connection pooling and error handling"
 * @dependencies ["ioredis"]
 * @status stable
 */

import Redis from "ioredis";
import { logger } from "@/lib/logger/production-logger";

export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  connectTimeout: number;
  commandTimeout: number;
  enableAutoPipelining: boolean;
};

export class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly module = "redis-client";

  constructor(private config: RedisConfig) {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: this.config.lazyConnect,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
        enableAutoPipelining: this.config.enableAutoPipelining,
      });

      this.setupEventHandlers();
      
      logger.info("Redis client initialized", {
        module: this.module,
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });
    } catch (error) {
      logger.error("Failed to initialize Redis client", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info("Redis connected", { module: this.module });
    });

    this.client.on("ready", () => {
      logger.info("Redis ready", { module: this.module });
    });

    this.client.on("error", (error) => {
      this.isConnected = false;
      logger.error("Redis error", {
        module: this.module,
        error: error.message,
      });
    });

    this.client.on("close", () => {
      this.isConnected = false;
      logger.warn("Redis connection closed", { module: this.module });
    });

    this.client.on("reconnecting", () => {
      this.reconnectAttempts++;
      logger.info("Redis reconnecting", {
        module: this.module,
        attempt: this.reconnectAttempts,
      });
    });
  }

  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not initialized");
    }

    try {
      await this.client.connect();
      logger.info("Redis connection established", { module: this.module });
    } catch (error) {
      logger.error("Failed to connect to Redis", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info("Redis disconnected", { module: this.module });
    }
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    this.ensureConnected();
    try {
      const result = await this.client!.get(key);
      logger.debug("Redis GET", {
        module: this.module,
        key,
        hit: result !== null,
      });
      return result;
    } catch (error) {
      logger.error("Redis GET failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    this.ensureConnected();
    try {
      let result: string;
      if (ttlSeconds) {
        result = await this.client!.set(key, value, "EX", ttlSeconds);
      } else {
        result = await this.client!.set(key, value);
      }
      
      logger.debug("Redis SET", {
        module: this.module,
        key,
        ttl: ttlSeconds,
        success: result === "OK",
      });
      return result === "OK";
    } catch (error) {
      logger.error("Redis SET failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async del(key: string | string[]): Promise<number> {
    this.ensureConnected();
    try {
      const result = Array.isArray(key) 
        ? await this.client!.del(...key)
        : await this.client!.del(key);
      logger.debug("Redis DEL", {
        module: this.module,
        key: Array.isArray(key) ? key : [key],
        deleted: result,
      });
      return result;
    } catch (error) {
      logger.error("Redis DEL failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis EXISTS failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error("Redis EXPIRE failed", {
        module: this.module,
        key,
        seconds,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Advanced operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    this.ensureConnected();
    try {
      const result = await this.client!.mget(...keys);
      logger.debug("Redis MGET", {
        module: this.module,
        keys,
        hits: result.filter(r => r !== null).length,
        total: keys.length,
      });
      return result;
    } catch (error) {
      logger.error("Redis MGET failed", {
        module: this.module,
        keys,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, string>): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.mset(keyValuePairs);
      logger.debug("Redis MSET", {
        module: this.module,
        keys: Object.keys(keyValuePairs),
        success: result === "OK",
      });
      return result === "OK";
    } catch (error) {
      logger.error("Redis MSET failed", {
        module: this.module,
        keys: Object.keys(keyValuePairs),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    this.ensureConnected();
    try {
      return await this.client!.hget(key, field);
    } catch (error) {
      logger.error("Redis HGET failed", {
        module: this.module,
        key,
        field,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.hset(key, field, value);
      return result >= 0;
    } catch (error) {
      logger.error("Redis HSET failed", {
        module: this.module,
        key,
        field,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.ensureConnected();
    try {
      return await this.client!.hgetall(key);
    } catch (error) {
      logger.error("Redis HGETALL failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {};
    }
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    this.ensureConnected();
    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS failed", {
        module: this.module,
        pattern,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  async scan(cursor: string, pattern?: string, count?: number): Promise<[string, string[]]> {
    this.ensureConnected();
    try {
      if (pattern && count) {
        return await this.client!.scan(cursor, "MATCH", pattern, "COUNT", count);
      } else if (pattern) {
        return await this.client!.scan(cursor, "MATCH", pattern);
      } else if (count) {
        return await this.client!.scan(cursor, "COUNT", count);
      } else {
        return await this.client!.scan(cursor);
      }
    } catch (error) {
      logger.error("Redis SCAN failed", {
        module: this.module,
        cursor,
        pattern,
        count,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [cursor, []];
    }
  }

  // Utility methods
  async flushdb(): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.flushdb();
      logger.warn("Redis database flushed", { module: this.module });
      return result === "OK";
    } catch (error) {
      logger.error("Redis FLUSHDB failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async ping(): Promise<boolean> {
    this.ensureConnected();
    try {
      const result = await this.client!.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Redis PING failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Pipeline operations for batch processing
  createPipeline() {
    this.ensureConnected();
    return this.client!.pipeline();
  }

  async executePipeline(pipeline: any): Promise<any[]> {
    try {
      const results = await pipeline.exec();
      logger.debug("Redis pipeline executed", {
        module: this.module,
        commands: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Redis pipeline failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  // Status and health checks
  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  getConnectionInfo(): Record<string, unknown> {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
    };
  }

  private ensureConnected(): void {
    if (!this.client) {
      throw new Error("Redis client not initialized");
    }
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }
  }
}

// Create singleton Redis client instance
let redisClient: RedisClient | null = null;

export function createRedisClient(): RedisClient {
  if (!redisClient) {
    const config: RedisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableAutoPipelining: true,
    };

    redisClient = new RedisClient(config);
  }

  return redisClient;
}

export function getRedisClient(): RedisClient | null {
  return redisClient;
}