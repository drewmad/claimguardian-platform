/**
 * @fileMetadata
 * @purpose "Production-grade database connection pooling and performance optimization"
 * @dependencies ["@supabase/supabase-js"]
 * @owner platform-team
 * @complexity high
 * @tags ["database", "performance", "connection-pooling", "caching"]
 * @status stable
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger/production-logger'
import { asyncErrorHandler, withRetry, Result } from '@/lib/error-handling/async-error-handler'

export interface ConnectionPoolConfig {
  minConnections: number
  maxConnections: number
  acquireTimeoutMillis: number
  idleTimeoutMillis: number
  reapIntervalMillis: number
  createRetryIntervalMillis: number
  createTimeoutMillis: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  pendingAcquires: number
  acquiredConnections: number
  createdConnections: number
  failedCreations: number
  timedOutAcquires: number
}

interface Connection {
  client: SupabaseClient
  id: string
  created: number
  lastUsed: number
  isActive: boolean
  acquiredAt?: number
}

interface PendingAcquire {
  resolve: (connection: Connection) => void
  reject: (error: Error) => void
  timestamp: number
}

export class DatabaseConnectionPool {
  private connections: Connection[] = []
  private pendingAcquires: PendingAcquire[] = []
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    pendingAcquires: 0,
    acquiredConnections: 0,
    createdConnections: 0,
    failedCreations: 0,
    timedOutAcquires: 0
  }

  private reapInterval: NodeJS.Timeout | null = null
  private isShuttingDown = false

  constructor(private config: ConnectionPoolConfig) {
    this.startReaping()
    this.initializePool()
  }

  private async initializePool(): Promise<void> {
    logger.info('Initializing database connection pool', {
      minConnections: this.config.minConnections,
      maxConnections: this.config.maxConnections
    })

    // Create minimum number of connections
    const initialConnections = Math.min(this.config.minConnections, 3)

    for (let i = 0; i < initialConnections; i++) {
      try {
        await this.createConnection()
      } catch (error) {
        logger.error(`Failed to create initial connection ${i + 1}`, error)
      }
    }

    logger.info(`Database pool initialized with ${this.connections.length} connections`)
  }

  private async createConnection(): Promise<Connection> {
    const startTime = Date.now()

    try {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            schema: 'public'
          },
          realtime: {
            enabled: false
          }
        }
      )

      // Test connection
      const { error } = await client.from('health_checks').select('1').limit(1)
      if (error && !error.message.includes('relation "health_checks" does not exist')) {
        throw new Error(`Connection test failed: ${error.message}`)
      }

      const connection: Connection = {
        client,
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created: Date.now(),
        lastUsed: Date.now(),
        isActive: false
      }

      this.connections.push(connection)
      this.stats.totalConnections++
      this.stats.createdConnections++
      this.stats.idleConnections++

      const duration = Date.now() - startTime
      logger.debug(`Created new database connection`, {
        connectionId: connection.id,
        duration,
        totalConnections: this.stats.totalConnections
      })

      return connection

    } catch (error) {
      this.stats.failedCreations++
      logger.error('Failed to create database connection', error)
      throw error
    }
  }

  async acquire(): Promise<Connection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down')
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from pending queue
        const index = this.pendingAcquires.findIndex(p => p.resolve === resolve)
        if (index !== -1) {
          this.pendingAcquires.splice(index, 1)
          this.stats.pendingAcquires--
        }

        this.stats.timedOutAcquires++
        reject(new Error(`Connection acquire timeout after ${this.config.acquireTimeoutMillis}ms`))
      }, this.config.acquireTimeoutMillis)

      const pendingAcquire: PendingAcquire = {
        resolve: (connection: Connection) => {
          clearTimeout(timeoutId)
          resolve(connection)
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        timestamp: Date.now()
      }

      this.pendingAcquires.push(pendingAcquire)
      this.stats.pendingAcquires++

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    while (this.pendingAcquires.length > 0 && !this.isShuttingDown) {
      // Find available connection
      let availableConnection = this.connections.find(conn => !conn.isActive)

      if (!availableConnection && this.connections.length < this.config.maxConnections) {
        // Create new connection if under limit
        try {
          availableConnection = await this.createConnection()
        } catch (error) {
          logger.error('Failed to create connection for queue processing', error)
          break
        }
      }

      if (!availableConnection) {
        // No connections available and at max limit
        break
      }

      // Assign connection to next in queue
      const pendingAcquire = this.pendingAcquires.shift()
      if (!pendingAcquire) break

      this.stats.pendingAcquires--

      availableConnection.isActive = true
      availableConnection.acquiredAt = Date.now()
      availableConnection.lastUsed = Date.now()

      this.stats.activeConnections++
      this.stats.idleConnections--
      this.stats.acquiredConnections++

      logger.debug('Connection acquired from pool', {
        connectionId: availableConnection.id,
        activeConnections: this.stats.activeConnections,
        queueLength: this.pendingAcquires.length
      })

      pendingAcquire.resolve(availableConnection)
    }
  }

  release(connection: Connection): void {
    if (!connection || !connection.isActive) {
      logger.warn('Attempted to release inactive or null connection')
      return
    }

    connection.isActive = false
    connection.lastUsed = Date.now()
    delete connection.acquiredAt

    this.stats.activeConnections--
    this.stats.idleConnections++

    logger.debug('Connection released to pool', {
      connectionId: connection.id,
      activeConnections: this.stats.activeConnections,
      idleConnections: this.stats.idleConnections
    })

    // Process any pending acquires
    setImmediate(() => this.processQueue())
  }

  private startReaping(): void {
    this.reapInterval = setInterval(() => {
      this.reapIdleConnections()
    }, this.config.reapIntervalMillis)
  }

  private reapIdleConnections(): void {
    const now = Date.now()
    const connectionsToReap: Connection[] = []

    for (const connection of this.connections) {
      if (!connection.isActive &&
          now - connection.lastUsed > this.config.idleTimeoutMillis &&
          this.connections.length > this.config.minConnections) {
        connectionsToReap.push(connection)
      }
    }

    for (const connection of connectionsToReap) {
      this.destroyConnection(connection)
    }

    if (connectionsToReap.length > 0) {
      logger.debug(`Reaped ${connectionsToReap.length} idle connections`, {
        totalConnections: this.stats.totalConnections,
        activeConnections: this.stats.activeConnections,
        idleConnections: this.stats.idleConnections
      })
    }
  }

  private destroyConnection(connection: Connection): void {
    const index = this.connections.findIndex(conn => conn.id === connection.id)
    if (index === -1) return

    this.connections.splice(index, 1)

    this.stats.totalConnections--
    if (connection.isActive) {
      this.stats.activeConnections--
    } else {
      this.stats.idleConnections--
    }

    logger.debug('Destroyed connection', {
      connectionId: connection.id,
      age: Date.now() - connection.created,
      totalConnections: this.stats.totalConnections
    })
  }

  getStats(): PoolStats {
    return { ...this.stats }
  }

  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    try {
      const connection = await this.acquire()

      const startTime = Date.now()
      const { error } = await connection.client.from('health_checks').select('1').limit(1)
      const queryTime = Date.now() - startTime

      this.release(connection)

      const healthy = !error || error.message.includes('relation "health_checks" does not exist')

      return {
        healthy,
        details: {
          queryTime,
          stats: this.getStats(),
          error: error?.message
        }
      }
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stats: this.getStats()
        }
      }
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down database connection pool')

    this.isShuttingDown = true

    // Clear reap interval
    if (this.reapInterval) {
      clearInterval(this.reapInterval)
      this.reapInterval = null
    }

    // Reject all pending acquires
    for (const pending of this.pendingAcquires) {
      pending.reject(new Error('Connection pool is shutting down'))
    }
    this.pendingAcquires = []

    // Wait for active connections to be released (with timeout)
    const shutdownStart = Date.now()
    const shutdownTimeout = 30000 // 30 seconds

    while (this.stats.activeConnections > 0 && Date.now() - shutdownStart < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (this.stats.activeConnections > 0) {
      logger.warn(`Forcibly closing ${this.stats.activeConnections} active connections during shutdown`)
    }

    // Destroy all connections
    for (const connection of [...this.connections]) {
      this.destroyConnection(connection)
    }

    logger.info('Database connection pool shutdown complete')
  }
}

// Production-grade connection pool configuration
const PRODUCTION_CONFIG: ConnectionPoolConfig = {
  minConnections: 2,
  maxConnections: 20,
  acquireTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 10 * 60 * 1000, // 10 minutes
  reapIntervalMillis: 60 * 1000, // 1 minute
  createRetryIntervalMillis: 200,
  createTimeoutMillis: 20000, // 20 seconds
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

// Development configuration
const DEVELOPMENT_CONFIG: ConnectionPoolConfig = {
  minConnections: 1,
  maxConnections: 5,
  acquireTimeoutMillis: 15000,
  idleTimeoutMillis: 5 * 60 * 1000,
  reapIntervalMillis: 30 * 1000,
  createRetryIntervalMillis: 200,
  createTimeoutMillis: 10000,
  logLevel: 'debug'
}

// Global connection pool instance
export const connectionPool = new DatabaseConnectionPool(
  process.env.NODE_ENV === 'production' ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG
)

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down connection pool')
  await connectionPool.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down connection pool')
  await connectionPool.shutdown()
  process.exit(0)
})

// High-level database operations with connection pooling
export class PooledDatabaseOperations {
  static async executeQuery<T = unknown>(
    operation: (client: SupabaseClient) => Promise<T>,
    context?: string
  ): Promise<Result<T>> {
    return asyncErrorHandler.executeWithFullResilience(
      async () => {
        const connection = await connectionPool.acquire()
        try {
          const startTime = Date.now()
          const result = await operation(connection.client)
          const duration = Date.now() - startTime

          logger.debug('Database query executed', {
            context,
            duration,
            connectionId: connection.id
          })

          return result
        } finally {
          connectionPool.release(connection)
        }
      },
      {
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          exponential: true,
          jitter: true,
          retryCondition: (error: Error) => {
            // Retry on connection errors, timeouts, but not on data validation errors
            const retryableErrors = [
              'connection',
              'timeout',
              'network',
              'unavailable',
              'overloaded'
            ]
            return retryableErrors.some(keyword =>
              error.message.toLowerCase().includes(keyword)
            )
          }
        },
        timeoutConfig: {
          timeoutMs: 30000,
          timeoutMessage: 'Database operation timed out'
        },
        circuitBreakerKey: 'database-operations',
        circuitBreakerConfig: {
          failureThreshold: 5,
          resetTimeoutMs: 60000,
          monitoringPeriodMs: 10000
        },
        context
      }
    )
  }

  // Common database operations with connection pooling

  static async select<T = unknown>(
    table: string,
    query: string,
    params?: Record<string, unknown>
  ): Promise<Result<T[]>> {
    return this.executeQuery(
      async (client) => {
        const { data, error } = await client.from(table).select(query)
        if (error) throw error
        return data as T[]
      },
      `select-${table}`
    )
  }

  static async insert<T = unknown>(
    table: string,
    data: Record<string, unknown>
  ): Promise<Result<T>> {
    return this.executeQuery(
      async (client) => {
        const { data: result, error } = await client
          .from(table)
          .insert(data)
          .select()
          .single()

        if (error) throw error
        return result as T
      },
      `insert-${table}`
    )
  }

  static async update<T = unknown>(
    table: string,
    updates: Record<string, unknown>,
    conditions: Record<string, unknown>
  ): Promise<Result<T>> {
    return this.executeQuery(
      async (client) => {
        let query = client.from(table).update(updates)

        for (const [key, value] of Object.entries(conditions)) {
          query = query.eq(key, value)
        }

        const { data, error } = await query.select().single()
        if (error) throw error
        return data as T
      },
      `update-${table}`
    )
  }

  static async healthCheck(): Promise<boolean> {
    const result = await this.executeQuery(
      async (client) => {
        const { error } = await client.from('users').select('id').limit(1)
        return !error
      },
      'health-check'
    )

    return result.success && result.data
  }
}

// Export connection pool for monitoring and management
export { connectionPool as dbPool }
