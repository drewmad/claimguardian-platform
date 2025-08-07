/**
 * @fileMetadata
 * @purpose "Database connection pool manager with advanced connection optimization and monitoring"
 * @owner backend-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["ConnectionPoolManager", "ConnectionPool", "PoolConfig", "ConnectionMetrics"]
 * @complexity high
 * @tags ["database", "connection-pool", "optimization", "monitoring", "performance"]
 * @status stable
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@claimguardian/db";
import { logger } from "@/lib/logger";

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  propagateCreateError: boolean;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  createdConnections: number;
  destroyedConnections: number;
  failedConnectionAttempts: number;
  averageAcquireTime: number;
  averageConnectionLifetime: number;
  poolUtilization: number;
}

interface PooledConnection {
  id: string;
  client: SupabaseClient<Database>;
  createdAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
  activeQueryCount: number;
  totalQueries: number;
}

interface PendingRequest {
  id: string;
  timestamp: Date;
  resolve: (connection: PooledConnection) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export class ConnectionPoolManager {
  private config: PoolConfig;
  private connections: Map<string, PooledConnection> = new Map();
  private pendingRequests: PendingRequest[] = [];
  private metrics: ConnectionMetrics;
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 10000,
      idleTimeoutMillis: 300000, // 5 minutes
      reapIntervalMillis: 10000, // 10 seconds
      createRetryIntervalMillis: 5000,
      propagateCreateError: true,
      ...config,
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingRequests: 0,
      createdConnections: 0,
      destroyedConnections: 0,
      failedConnectionAttempts: 0,
      averageAcquireTime: 0,
      averageConnectionLifetime: 0,
      poolUtilization: 0,
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    logger.info("Initializing connection pool", { config: this.config });

    try {
      // Create minimum connections
      const initialConnections = Math.min(
        this.config.minConnections,
        this.config.maxConnections,
      );
      const connectionPromises = Array.from(
        { length: initialConnections },
        () => this.createConnection(),
      );

      await Promise.all(connectionPromises);

      // Start cleanup and metrics collection
      this.startCleanup();
      this.startMetricsCollection();

      logger.info("Connection pool initialized successfully", {
        initialConnections: this.connections.size,
        maxConnections: this.config.maxConnections,
      });
    } catch (error) {
      logger.error("Failed to initialize connection pool", {}, error instanceof Error ? error : new Error(String(error)));
      if (this.config.propagateCreateError) {
        throw error;
      }
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error("Connection pool is shutting down");
    }

    const startTime = Date.now();

    // Try to find an idle connection
    const idleConnection = this.findIdleConnection();
    if (idleConnection) {
      idleConnection.isActive = true;
      idleConnection.lastUsedAt = new Date();
      this.updateMetrics();

      logger.debug("Acquired idle connection", {
        connectionId: idleConnection.id,
      });
      return idleConnection;
    }

    // Try to create a new connection if under max limit
    if (this.connections.size < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection();
        newConnection.isActive = true;
        this.updateMetrics();

        logger.debug("Acquired new connection", {
          connectionId: newConnection.id,
        });
        return newConnection;
      } catch (error) {
        logger.warn("Failed to create new connection", { 
          error: error instanceof Error ? error.message : String(error) 
        });
        if (this.config.propagateCreateError) {
          throw error;
        }
      }
    }

    // Wait for a connection to become available
    return this.waitForConnection(startTime);
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: PooledConnection): void {
    const pooledConnection = this.connections.get(connection.id);
    if (!pooledConnection) {
      logger.warn("Attempted to release unknown connection", {
        connectionId: connection.id,
      });
      return;
    }

    pooledConnection.isActive = false;
    pooledConnection.lastUsedAt = new Date();

    // Fulfill pending requests
    const pendingRequest = this.pendingRequests.shift();
    if (pendingRequest) {
      if (pendingRequest.timeout) {
        clearTimeout(pendingRequest.timeout);
      }

      pooledConnection.isActive = true;
      pendingRequest.resolve(pooledConnection);

      logger.debug("Fulfilled pending request with released connection", {
        connectionId: connection.id,
        requestId: pendingRequest.id,
      });
    }

    this.updateMetrics();
    logger.debug("Released connection", { connectionId: connection.id });
  }

  /**
   * Execute a query with automatic connection management
   */
  async execute<T = any>(
    queryFn: (client: SupabaseClient<Database>) => Promise<T>,
    options: {
      retries?: number;
      timeout?: number;
    } = {},
  ): Promise<T> {
    const { retries = 2, timeout = 30000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      let connection: PooledConnection | null = null;

      try {
        // Acquire connection with timeout
        const acquirePromise = this.acquire();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Connection acquire timeout")),
            timeout,
          );
        });

        connection = await Promise.race([acquirePromise, timeoutPromise]);

        // Execute query with timeout
        const queryPromise = queryFn(connection.client);
        const queryTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Query execution timeout")),
            timeout,
          );
        });

        const result = await Promise.race([queryPromise, queryTimeoutPromise]);

        connection.totalQueries++;
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `Query execution failed (attempt ${attempt + 1}/${retries + 1})`,
          {
            error: lastError.message,
            attempt,
            connectionId: connection?.id,
          },
        );

        // If it's a connection error, destroy the connection
        if (connection && this.isConnectionError(error as Error)) {
          await this.destroyConnection(connection.id);
        }

        if (attempt === retries) {
          break;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      } finally {
        if (connection) {
          this.release(connection);
        }
      }
    }

    throw lastError || new Error("Query execution failed after retries");
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): ConnectionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get detailed connection information
   */
  getConnectionInfo(): Array<{
    id: string;
    createdAt: Date;
    lastUsedAt: Date;
    isActive: boolean;
    activeQueryCount: number;
    totalQueries: number;
    age: number;
  }> {
    return Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      createdAt: conn.createdAt,
      lastUsedAt: conn.lastUsedAt,
      isActive: conn.isActive,
      activeQueryCount: conn.activeQueryCount,
      totalQueries: conn.totalQueries,
      age: Date.now() - conn.createdAt.getTime(),
    }));
  }

  /**
   * Gracefully shutdown the pool
   */
  async shutdown(timeoutMs = 30000): Promise<void> {
    logger.info("Shutting down connection pool", { timeout: timeoutMs });

    this.isShuttingDown = true;

    // Stop intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      request.reject(new Error("Connection pool shutting down"));
    });
    this.pendingRequests = [];

    // Wait for active connections to be released or timeout
    const shutdownStart = Date.now();
    while (
      this.getActiveConnectionCount() > 0 &&
      Date.now() - shutdownStart < timeoutMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Force close all connections
    const closePromises = Array.from(this.connections.values()).map((conn) =>
      this.destroyConnection(conn.id, true),
    );

    await Promise.allSettled(closePromises);

    logger.info("Connection pool shutdown complete", {
      remainingConnections: this.connections.size,
      forceClosed: this.connections.size > 0,
    });
  }

  // Private methods
  private async createConnection(): Promise<PooledConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
        db: {
          schema: "public",
        },
      });

      const connection: PooledConnection = {
        id: connectionId,
        client,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isActive: false,
        activeQueryCount: 0,
        totalQueries: 0,
      };

      this.connections.set(connectionId, connection);
      this.metrics.createdConnections++;

      logger.debug("Created new connection", { connectionId });
      return connection;
    } catch (error) {
      this.metrics.failedConnectionAttempts++;
      logger.error(
        "Failed to create connection",
        { connectionId },
        error as Error,
      );
      throw error;
    }
  }

  private async destroyConnection(
    connectionId: string,
    force = false,
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    if (!force && connection.isActive) {
      logger.warn("Attempted to destroy active connection", { connectionId });
      return;
    }

    this.connections.delete(connectionId);
    this.metrics.destroyedConnections++;

    logger.debug("Destroyed connection", { connectionId, force });
  }

  private findIdleConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        return connection;
      }
    }
    return null;
  }

  private async waitForConnection(
    startTime: number,
  ): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timeout = setTimeout(() => {
        const requestIndex = this.pendingRequests.findIndex(
          (req) => req.id === requestId,
        );
        if (requestIndex >= 0) {
          this.pendingRequests.splice(requestIndex, 1);
        }
        reject(
          new Error(
            `Connection acquire timeout after ${this.config.acquireTimeoutMillis}ms`,
          ),
        );
      }, this.config.acquireTimeoutMillis);

      const request: PendingRequest = {
        id: requestId,
        timestamp: new Date(),
        resolve: (connection) => {
          clearTimeout(timeout);
          const acquireTime = Date.now() - startTime;
          this.updateAverageAcquireTime(acquireTime);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      };

      this.pendingRequests.push(request);
    });
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
      this.ensureMinConnections();
    }, this.config.reapIntervalMillis);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
    }, 60000); // Every minute
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToDestroy: string[] = [];

    for (const [id, connection] of this.connections) {
      const idleTime = now - connection.lastUsedAt.getTime();

      if (
        !connection.isActive &&
        idleTime > this.config.idleTimeoutMillis &&
        this.connections.size > this.config.minConnections
      ) {
        connectionsToDestroy.push(id);
      }
    }

    connectionsToDestroy.forEach((id) => this.destroyConnection(id));

    if (connectionsToDestroy.length > 0) {
      logger.debug("Cleaned up idle connections", {
        destroyed: connectionsToDestroy.length,
        remaining: this.connections.size,
      });
    }
  }

  private async ensureMinConnections(): Promise<void> {
    const needed = Math.max(
      0,
      this.config.minConnections - this.connections.size,
    );

    if (needed > 0) {
      const createPromises = Array.from({ length: needed }, () =>
        this.createConnection().catch((error) => {
          logger.warn(
            "Failed to create connection during min connections maintenance",
            { error: (error as Error).message });
          return null;
        }),
      );

      await Promise.allSettled(createPromises);
    }
  }

  private updateMetrics(): void {
    const activeCount = this.getActiveConnectionCount();
    const idleCount = this.connections.size - activeCount;

    this.metrics.totalConnections = this.connections.size;
    this.metrics.activeConnections = activeCount;
    this.metrics.idleConnections = idleCount;
    this.metrics.pendingRequests = this.pendingRequests.length;
    this.metrics.poolUtilization =
      (activeCount / this.config.maxConnections) * 100;

    // Calculate average connection lifetime
    const now = Date.now();
    const totalLifetime = Array.from(this.connections.values()).reduce(
      (sum, conn) => sum + (now - conn.createdAt.getTime()),
      0,
    );

    this.metrics.averageConnectionLifetime =
      this.connections.size > 0 ? totalLifetime / this.connections.size : 0;
  }

  private updateAverageAcquireTime(acquireTime: number): void {
    // Simple moving average
    this.metrics.averageAcquireTime =
      this.metrics.averageAcquireTime * 0.9 + acquireTime * 0.1;
  }

  private getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter((conn) => conn.isActive)
      .length;
  }

  private isConnectionError(error: Error): boolean {
    const connectionErrors = [
      "connection closed",
      "connection terminated",
      "network error",
      "timeout",
      "connect ECONNREFUSED",
    ];

    return connectionErrors.some((errMsg) =>
      error.message.toLowerCase().includes(errMsg),
    );
  }

  private logMetrics(): void {
    logger.info("Connection pool metrics", {
      totalConnections: this.metrics.totalConnections,
      activeConnections: this.metrics.activeConnections,
      idleConnections: this.metrics.idleConnections,
      pendingRequests: this.metrics.pendingRequests,
      poolUtilization: `${this.metrics.poolUtilization.toFixed(1)}%`,
      averageAcquireTime: `${this.metrics.averageAcquireTime.toFixed(1)}ms`,
      averageConnectionLifetime: `${(this.metrics.averageConnectionLifetime / 1000 / 60).toFixed(1)}min`,
    });
  }
}

// Singleton instance
let poolManagerInstance: ConnectionPoolManager | null = null;

export function getConnectionPool(): ConnectionPoolManager {
  if (!poolManagerInstance) {
    poolManagerInstance = new ConnectionPoolManager();
  }
  return poolManagerInstance;
}

export async function shutdownConnectionPool(): Promise<void> {
  if (poolManagerInstance) {
    await poolManagerInstance.shutdown();
    poolManagerInstance = null;
  }
}
