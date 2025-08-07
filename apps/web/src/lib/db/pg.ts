/**
 * PostgreSQL connection utility for vector tile generation
 * Provides a connection pool for efficient database queries
 */
import { Pool, PoolConfig } from 'pg';

// Global connection pool to reuse across requests
let pool: Pool | null = null;

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 10, // maximum number of connections
  min: 2,  // minimum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

/**
 * Get or create the PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });

    // Handle client connection errors
    pool.on('connect', (client) => {
      // Set statement timeout to prevent hanging queries
      client.query('SET statement_timeout = 30000'); // 30 seconds
    });
  }
  
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool (useful for cleanup in tests)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Health check function for the database connection
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT 1 as healthy, NOW() as timestamp');
    return {
      healthy: true,
      timestamp: result.rows[0].timestamp,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}