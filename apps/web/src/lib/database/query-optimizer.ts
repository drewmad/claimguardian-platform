/**
 * @fileMetadata
 * @purpose "Advanced query optimization for Florida parcels GIS data"
 * @dependencies ["@claimguardian/db","@supabase/supabase-js"]
 * @owner database-team
 * @status stable
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@claimguardian/db'

interface QueryPlan {
  query: string
  parameters?: unknown[]
  indexes: string[]
  estimatedCost: number
  estimatedRows: number
  executionTime?: number
}

interface OptimizationStrategy {
  type: 'index' | 'partition' | 'materialized_view' | 'query_rewrite'
  description: string
  impact: 'high' | 'medium' | 'low'
  implementation: string
}

interface GeoQueryOptions {
  center?: { lat: number; lng: number }
  radius?: number // meters
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  counties?: string[]
  zipCodes?: string[]
  limit?: number
  offset?: number
  includeGeometry?: boolean
  simplifyGeometry?: number // tolerance for geometry simplification
}

interface ParcelQueryOptions extends GeoQueryOptions {
  ownerName?: string
  parcelId?: string
  useCode?: string[]
  yearBuilt?: { min?: number; max?: number }
  livingArea?: { min?: number; max?: number }
  justValue?: { min?: number; max?: number }
  includeOwnerDetails?: boolean
  includeAssessmentHistory?: boolean
  includeSalesHistory?: boolean
}

interface QueryStats {
  executionTime: number
  rowsReturned: number
  cacheHit: boolean
  indexesUsed: string[]
  partitionsAccessed: string[]
}

class FloridaParcelQueryOptimizer {
  private supabase: ReturnType<typeof createClient<Database>> | null = null
  private queryCache = new Map<string, { result: unknown; timestamp: number }>()
  private cacheTTL = 300000 // 5 minutes
  private queryStats = new Map<string, QueryStats[]>()

  constructor() {
    this.initializeSupabase()
  }

  private initializeSupabase(): void {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  }

  /**
   * Search parcels with optimized query strategies
   */
  async searchParcels(options: ParcelQueryOptions): Promise<{
    data: unknown[]
    stats: QueryStats
    plan: QueryPlan
  }> {
    const startTime = Date.now()
    
    // Generate optimized query plan
    const plan = await this.generateQueryPlan(options)
    
    // Check cache first
    const cacheKey = this.generateCacheKey('searchParcels', options)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      const cachedData = cached as unknown[]
      return {
        data: cachedData,
        stats: {
          executionTime: Date.now() - startTime,
          rowsReturned: cachedData.length,
          cacheHit: true,
          indexesUsed: [],
          partitionsAccessed: []
        },
        plan
      }
    }

    // Execute optimized query
    try {
      const result = await this.executeOptimizedQuery(plan)
      
      // Cache result
      this.setCache(cacheKey, result.data)
      
      // Track query statistics
      const stats: QueryStats = {
        executionTime: Date.now() - startTime,
        rowsReturned: result.data.length,
        cacheHit: false,
        indexesUsed: plan.indexes,
        partitionsAccessed: result.partitions || []
      }
      
      this.trackQueryStats('searchParcels', stats)
      
      return {
        data: result.data,
        stats,
        plan
      }
    } catch (error) {
      console.error('Parcel search error:', error)
      throw error
    }
  }

  /**
   * Generate optimized query plan based on search criteria
   */
  private async generateQueryPlan(options: ParcelQueryOptions): Promise<QueryPlan> {
    const indexes: string[] = []
    let estimatedCost = 0
    let estimatedRows = 1000000 // Start with total parcels estimate

    // Build base query
    let query = 'SELECT '
    
    // Optimize column selection
    const columns = this.getOptimizedColumns(options)
    query += columns.join(', ')
    
    query += ' FROM florida_parcels'
    
    // Build WHERE clause with optimal ordering
    const whereConditions: string[] = []
    const parameters: unknown[] = []
    
    // Geographic queries - most selective first
    if (options.counties && options.counties.length > 0) {
      whereConditions.push(`county_name = ANY($${parameters.length + 1})`)
      parameters.push(options.counties)
      indexes.push('idx_florida_parcels_county_name')
      estimatedRows = Math.floor(estimatedRows / 67 * options.counties.length) // 67 counties
      estimatedCost += 10
    }
    
    if (options.zipCodes && options.zipCodes.length > 0) {
      whereConditions.push(`site_zip = ANY($${parameters.length + 1})`)
      parameters.push(options.zipCodes)
      indexes.push('idx_florida_parcels_site_zip')
      estimatedRows = Math.floor(estimatedRows / 1000 * options.zipCodes.length)
      estimatedCost += 15
    }
    
    // Spatial queries
    if (options.bounds) {
      // Use spatial index for bounding box queries
      whereConditions.push(
        `lat BETWEEN $${parameters.length + 1} AND $${parameters.length + 2} ` +
        `AND lng BETWEEN $${parameters.length + 3} AND $${parameters.length + 4}`
      )
      parameters.push(options.bounds.south, options.bounds.north, options.bounds.west, options.bounds.east)
      indexes.push('idx_florida_parcels_lat_lng')
      estimatedRows = Math.floor(estimatedRows * 0.1) // Rough estimate
      estimatedCost += 20
    } else if (options.center && options.radius) {
      // Use PostGIS for radius queries if available
      whereConditions.push(
        `earth_distance(ll_to_earth(lat, lng), ll_to_earth($${parameters.length + 1}, $${parameters.length + 2})) <= $${parameters.length + 3}`
      )
      parameters.push(options.center.lat, options.center.lng, options.radius)
      indexes.push('idx_florida_parcels_lat_lng')
      estimatedRows = Math.floor(estimatedRows * 0.05)
      estimatedCost += 30
    }
    
    // Text search optimization
    if (options.ownerName) {
      // Use trigram index for fuzzy matching
      whereConditions.push(`own_name ILIKE $${parameters.length + 1}`)
      parameters.push(`%${options.ownerName}%`)
      indexes.push('idx_florida_parcels_own_name_trgm')
      estimatedRows = Math.floor(estimatedRows * 0.01)
      estimatedCost += 25
    }
    
    if (options.parcelId) {
      // Exact match on indexed column
      whereConditions.push(`parcel_id = $${parameters.length + 1}`)
      parameters.push(options.parcelId)
      indexes.push('idx_florida_parcels_parcel_id')
      estimatedRows = 1
      estimatedCost += 5
    }
    
    // Numeric range queries
    if (options.justValue) {
      if (options.justValue.min !== undefined) {
        whereConditions.push(`just_value >= $${parameters.length + 1}`)
        parameters.push(options.justValue.min)
      }
      if (options.justValue.max !== undefined) {
        whereConditions.push(`just_value <= $${parameters.length + 1}`)
        parameters.push(options.justValue.max)
      }
      indexes.push('idx_florida_parcels_just_value')
      estimatedRows = Math.floor(estimatedRows * 0.2)
      estimatedCost += 15
    }
    
    // Build final query
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }
    
    // Add ordering for consistent results
    query += ' ORDER BY parcel_id'
    
    // Add pagination
    if (options.limit) {
      query += ` LIMIT ${options.limit}`
      estimatedRows = Math.min(estimatedRows, options.limit)
    }
    if (options.offset) {
      query += ` OFFSET ${options.offset}`
    }
    
    return {
      query,
      parameters,
      indexes: [...new Set(indexes)], // Remove duplicates
      estimatedCost,
      estimatedRows
    }
  }

  /**
   * Get optimized column list based on query requirements
   */
  private getOptimizedColumns(options: ParcelQueryOptions): string[] {
    const baseColumns = [
      'parcel_id',
      'county_name',
      'site_addr',
      'site_city',
      'site_zip',
      'own_name',
      'just_value',
      'land_value',
      'bldg_value'
    ]
    
    const columns = [...baseColumns]
    
    // Add geometry columns only if needed
    if (options.includeGeometry) {
      columns.push('lat', 'lng')
      if (options.simplifyGeometry) {
        // Use simplified geometry for performance
        columns.push(`ST_Simplify(geometry, ${options.simplifyGeometry}) as geometry`)
      } else {
        columns.push('geometry')
      }
    } else if (options.center || options.bounds) {
      // Need coordinates for spatial queries
      columns.push('lat', 'lng')
    }
    
    // Add optional detail columns
    if (options.includeOwnerDetails) {
      columns.push('own_addr1', 'own_addr2', 'own_city', 'own_state', 'own_zip')
    }
    
    if (options.yearBuilt) {
      columns.push('year_built')
    }
    
    if (options.livingArea) {
      columns.push('tot_lvg_area')
    }
    
    if (options.useCode) {
      columns.push('dor_uc', 'pa_uc')
    }
    
    return columns
  }

  /**
   * Execute optimized query with monitoring
   */
  private async executeOptimizedQuery(plan: QueryPlan): Promise<{
    data: unknown[]
    partitions?: string[]
  }> {
    if (!this.supabase) {
      throw new Error('Database connection not available')
    }
    
    const startTime = Date.now()
    
    try {
      // Execute query using typed RPC call
      const { data, error } = await this.supabase.rpc('execute_raw_sql', {
        query: plan.query,
        params: plan.parameters || []
      } as any)
      
      if (error) throw error
      
      // Track execution time
      plan.executionTime = Date.now() - startTime
      
      return {
        data: data || [],
        partitions: [] // Would be populated from query analysis
      }
    } catch (error) {
      console.error('Query execution error:', error)
      throw error
    }
  }

  /**
   * Get optimization recommendations based on query patterns
   */
  async getOptimizationRecommendations(): Promise<OptimizationStrategy[]> {
    const recommendations: OptimizationStrategy[] = []
    
    // Analyze query statistics
    const stats = this.analyzeQueryPatterns()
    
    // Index recommendations
    if (stats.slowQueries.some(q => q.includes('own_name'))) {
      recommendations.push({
        type: 'index',
        description: 'Create trigram index on owner name for faster text search',
        impact: 'high',
        implementation: `
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE INDEX idx_florida_parcels_own_name_trgm 
          ON florida_parcels USING gin(own_name gin_trgm_ops);
        `
      })
    }
    
    // Partitioning recommendations
    if (stats.totalRows > 10000000) {
      recommendations.push({
        type: 'partition',
        description: 'Partition table by county for better query performance',
        impact: 'high',
        implementation: `
          -- Create partitioned table
          CREATE TABLE florida_parcels_partitioned (
            LIKE florida_parcels INCLUDING ALL
          ) PARTITION BY LIST (county_name);
          
          -- Create partitions for each county
          CREATE TABLE florida_parcels_miami_dade 
          PARTITION OF florida_parcels_partitioned 
          FOR VALUES IN ('MIAMI-DADE');
        `
      })
    }
    
    // Materialized view recommendations
    if (stats.frequentAggregations) {
      recommendations.push({
        type: 'materialized_view',
        description: 'Create materialized view for county statistics',
        impact: 'medium',
        implementation: `
          CREATE MATERIALIZED VIEW mv_county_statistics AS
          SELECT 
            county_name,
            COUNT(*) as parcel_count,
            AVG(just_value) as avg_value,
            SUM(just_value) as total_value,
            COUNT(DISTINCT own_name) as unique_owners
          FROM florida_parcels
          GROUP BY county_name;
          
          CREATE INDEX idx_mv_county_stats_county 
          ON mv_county_statistics(county_name);
        `
      })
    }
    
    // Query rewrite recommendations
    if (stats.inefficientPatterns.length > 0) {
      recommendations.push({
        type: 'query_rewrite',
        description: 'Optimize common query patterns',
        impact: 'medium',
        implementation: this.generateQueryRewriteExamples(stats.inefficientPatterns)
      })
    }
    
    return recommendations
  }

  /**
   * Analyze query patterns for optimization opportunities
   */
  private analyzeQueryPatterns(): {
    slowQueries: string[]
    frequentQueries: string[]
    inefficientPatterns: string[]
    totalRows: number
    frequentAggregations: boolean
  } {
    const allStats = Array.from(this.queryStats.values()).flat()
    
    // Find slow queries (> 1 second)
    const slowQueries = allStats
      .filter(s => s.executionTime > 1000)
      .map(() => 'slow_query') // Would map to actual queries in production
    
    // Find frequently used patterns
    
    return {
      slowQueries,
      frequentQueries: [],
      inefficientPatterns: [],
      totalRows: 20000000, // Example count
      frequentAggregations: true
    }
  }

  /**
   * Generate query rewrite examples
   */
  private generateQueryRewriteExamples(patterns: string[]): string {
    const examples: string[] = []
    
    examples.push(`
      -- Instead of multiple OR conditions:
      SELECT * FROM florida_parcels 
      WHERE county_name = 'MIAMI-DADE' 
         OR county_name = 'BROWARD' 
         OR county_name = 'PALM BEACH';
      
      -- Use IN or ANY:
      SELECT * FROM florida_parcels 
      WHERE county_name = ANY(ARRAY['MIAMI-DADE', 'BROWARD', 'PALM BEACH']);
    `)
    
    examples.push(`
      -- Instead of LIKE with leading wildcard:
      SELECT * FROM florida_parcels WHERE own_name LIKE '%SMITH%';
      
      -- Use trigram index with ILIKE:
      SELECT * FROM florida_parcels WHERE own_name ILIKE '%SMITH%';
    `)
    
    return examples.join('\n\n')
  }

  /**
   * Cache management
   */
  private generateCacheKey(operation: string, params: unknown): string { 
    return `${operation}:${JSON.stringify(params)}`
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result
    }
    this.queryCache.delete(key)
    return null
  }

  private setCache(key: string, result: unknown): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now()
    })
    
    // Limit cache size
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value
      this.queryCache.delete(firstKey)
    }
  }

  /**
   * Track query statistics
   */
  private trackQueryStats(operation: string, stats: QueryStats): void {
    const existing = this.queryStats.get(operation) || []
    existing.push(stats)
    
    // Keep last 100 queries per operation
    if (existing.length > 100) {
      existing.shift()
    }
    
    this.queryStats.set(operation, existing)
  }

  /**
   * Get query performance report
   */
  getPerformanceReport(): {
    operations: Array<{
      name: string
      avgExecutionTime: number
      totalQueries: number
      cacheHitRate: number
      avgRowsReturned: number
    }>
    recommendations: OptimizationStrategy[]
  } {
    const operations = Array.from(this.queryStats.entries()).map(([name, stats]) => {
      const totalQueries = stats.length
      const avgExecutionTime = stats.reduce((sum, s) => sum + s.executionTime, 0) / totalQueries
      const cacheHits = stats.filter(s => s.cacheHit).length
      const avgRowsReturned = stats.reduce((sum, s) => sum + s.rowsReturned, 0) / totalQueries
      
      return {
        name,
        avgExecutionTime,
        totalQueries,
        cacheHitRate: (cacheHits / totalQueries) * 100,
        avgRowsReturned
      }
    })
    
    return {
      operations,
      recommendations: []
    }
  }
}

// Export singleton instance
export const parcelQueryOptimizer = new FloridaParcelQueryOptimizer()

export type { 
  ParcelQueryOptions, 
  GeoQueryOptions, 
  QueryPlan, 
  QueryStats, 
  OptimizationStrategy 
}
