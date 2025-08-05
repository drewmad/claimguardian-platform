/**
 * @fileMetadata
 * @purpose "Centralized type definitions for analytics data structures and metrics"
 * @dependencies []
 * @owner data-team
 * @status stable
 */

// Core analytics data types
export interface AnalyticsMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface TimeSeriesDataPoint {
  timestamp: Date
  value: number
  label?: string
  metadata?: Record<string, unknown>
}

export interface TimeSeriesData {
  series: string
  data: TimeSeriesDataPoint[]
  unit: string
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count'
}

// Dashboard and visualization types
export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'map' | 'gauge'
  title: string
  description?: string
  config: WidgetConfig
  data: AnalyticsData
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  refreshInterval?: number // milliseconds
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  yAxisFormat?: string
  xAxisFormat?: string
  threshold?: {
    value: number
    color: string
    label: string
  }
  filters?: AnalyticsFilter[]
}

export type AnalyticsData = 
  | AnalyticsMetric
  | AnalyticsMetric[]
  | TimeSeriesData
  | TimeSeriesData[]
  | TableData
  | MapData

// Table data structure
export interface TableData {
  columns: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'date' | 'boolean'
    format?: string
    sortable?: boolean
  }>
  rows: Array<Record<string, unknown>>
  totalRows: number
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

// Map data structure
export interface MapData {
  type: 'points' | 'regions' | 'heatmap'
  features: MapFeature[]
  center?: {
    lat: number
    lng: number
    zoom: number
  }
}

export interface MapFeature {
  id: string
  type: 'point' | 'polygon'
  coordinates: number[] | number[][]
  properties: {
    name: string
    value: number
    color?: string
    popup?: string
    metadata?: Record<string, unknown>
  }
}

// Filter and query types
export interface AnalyticsFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'between'
  value: unknown
  label?: string
}

export interface AnalyticsQuery {
  metrics: string[]
  dimensions?: string[]
  filters?: AnalyticsFilter[]
  timeRange?: {
    start: Date
    end: Date
    granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  }
  limit?: number
  offset?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }[]
}

// Business-specific analytics types
export interface ClaimsAnalytics {
  totalClaims: number
  totalValue: number
  averageValue: number
  processedClaims: number
  pendingClaims: number
  rejectedClaims: number
  processingTime: {
    average: number
    median: number
    p95: number
  }
  byStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  byType: Array<{
    type: string
    count: number
    totalValue: number
  }>
  timeline: TimeSeriesData[]
}

export interface PropertyAnalytics {
  totalProperties: number
  activeProperties: number
  riskDistribution: Array<{
    level: 'low' | 'medium' | 'high' | 'critical'
    count: number
    percentage: number
  }>
  averageValue: number
  byState: Array<{
    state: string
    count: number
    totalValue: number
  }>
  byCounty: Array<{
    county: string
    state: string
    count: number
    averageRisk: number
  }>
  geospatial: MapData
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  byPlan: Array<{
    plan: string
    count: number
    revenue: number
  }>
  engagement: {
    sessionsPerUser: number
    averageSessionDuration: number
    bounceRate: number
  }
  timeline: TimeSeriesData[]
}

export interface PerformanceAnalytics {
  responseTime: {
    average: number
    p50: number
    p95: number
    p99: number
  }
  throughput: number
  errorRate: number
  uptime: number
  by_endpoint: Array<{
    endpoint: string
    calls: number
    averageTime: number
    errorRate: number
  }>
  infrastructure: {
    cpu: number
    memory: number
    storage: number
    network: number
  }
  timeline: TimeSeriesData[]
}

// Real-time analytics types
export interface RealtimeEvent {
  id: string
  type: string
  timestamp: Date
  data: Record<string, unknown>
  source: string
  userId?: string
  sessionId?: string
}

export interface RealtimeMetrics {
  activeUsers: number
  activeConnections: number
  eventsPerSecond: number
  latency: number
  errors: number
  lastUpdated: Date
}

// Analytics configuration
export interface AnalyticsConfig {
  trackingId?: string
  enabledFeatures: ('pageviews' | 'events' | 'performance' | 'errors' | 'realtime')[]
  samplingRate: number
  batchSize: number
  flushInterval: number // milliseconds
  retentionDays: number
  anonymizeIp: boolean
  customDimensions?: Record<string, string>
}

// Export/import types
export interface AnalyticsExport {
  format: 'csv' | 'json' | 'xlsx' | 'pdf'
  query: AnalyticsQuery
  filename: string
  includeMetadata: boolean
  compression?: 'gzip' | 'zip'
}

export interface AnalyticsReport {
  id: string
  name: string
  description?: string
  query: AnalyticsQuery
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string // HH:MM
    timezone: string
    recipients: string[]
  }
  format: AnalyticsExport['format']
  createdAt: Date
  updatedAt: Date
  lastRun?: Date
  nextRun?: Date
}

// Utility types for data processing
export type AggregationFunction = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'std' | 'var'

export interface DataTransformation {
  type: 'aggregate' | 'filter' | 'sort' | 'group' | 'join'
  params: Record<string, unknown>
}

export interface ProcessedData<T = unknown> {
  data: T
  metadata: {
    processedAt: Date
    rowCount: number
    transformations: DataTransformation[]
    cacheKey?: string
    ttl?: number // seconds
  }
}

// Error and validation types
export interface AnalyticsError {
  code: string
  message: string
  field?: string
  value?: unknown
  timestamp: Date
}

export interface ValidationResult {
  isValid: boolean
  errors: AnalyticsError[]
  warnings: AnalyticsError[]
}