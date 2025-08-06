/**
 * @fileMetadata
 * @purpose "Advanced time-series analytics for AI performance tracking and optimization"
 * @dependencies ["@claimguardian/db","@supabase/supabase-js"]
 * @owner analytics-team
 * @status stable
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@claimguardian/db'

interface TimeSeriesDataPoint {
  timestamp: Date
  value: number
  metadata?: Record<string, any>
}

interface TimeSeriesMetrics {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  percentile95: number
  percentile99: number
  trend: 'increasing' | 'decreasing' | 'stable'
  seasonality?: SeasonalityPattern
}

interface SeasonalityPattern {
  detected: boolean
  period: number // in milliseconds
  amplitude: number
  confidence: number
}

interface AnomalyPoint {
  timestamp: Date
  value: number
  expectedValue: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'drop' | 'drift' | 'pattern_break'
  confidence: number
}

interface PerformanceTrend {
  metric: string
  timeframe: string
  direction: 'improving' | 'degrading' | 'stable'
  rate: number // % change per unit time
  significance: number // statistical significance
  forecast: TimeSeriesDataPoint[]
}

interface AIPerformanceAnalysis {
  timeframe: {
    start: Date
    end: Date
    resolution: string
  }
  metrics: {
    responseTime: TimeSeriesMetrics
    throughput: TimeSeriesMetrics
    errorRate: TimeSeriesMetrics
    cost: TimeSeriesMetrics
    accuracy: TimeSeriesMetrics
  }
  trends: PerformanceTrend[]
  anomalies: AnomalyPoint[]
  recommendations: string[]
  forecast: {
    nextHour: TimeSeriesDataPoint[]
    nextDay: TimeSeriesDataPoint[]
    nextWeek: TimeSeriesDataPoint[]
  }
}

interface ComparisonAnalysis {
  baselineId: string
  comparisonId: string
  significantChanges: Array<{
    metric: string
    baselineValue: number
    comparisonValue: number
    percentChange: number
    pValue: number
    isSignificant: boolean
  }>
  overallImprovement: number
  recommendations: string[]
}

class AITimeSeriesAnalyzer {
  private supabase: any
  private analysisCache = new Map<string, { result: any; timestamp: number }>()
  private cacheTTL = 900000 // 15 minutes
  private modelCache = new Map<string, any>()

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
   * Comprehensive AI performance analysis
   */
  async analyzeAIPerformance(options: {
    startTime: Date
    endTime: Date
    resolution?: '1m' | '5m' | '15m' | '1h' | '1d'
    features?: string[]
    models?: string[]
    includeForecasting?: boolean
    includeAnomalyDetection?: boolean
  }): Promise<AIPerformanceAnalysis> {
    const cacheKey = this.generateCacheKey('aiPerformanceAnalysis', options)
    const cached = this.getFromCache<AIPerformanceAnalysis>(cacheKey)
    if (cached) return cached

    const { startTime, endTime, resolution = '15m' } = options

    // Fetch time-series data
    const timeSeriesData = await this.fetchTimeSeriesData({ ...options, resolution })
    
    // Calculate metrics for each dimension
    const responseTimeMetrics = this.calculateMetrics(
      timeSeriesData.responseTime.map(d => d.value)
    )
    const throughputMetrics = this.calculateMetrics(
      timeSeriesData.throughput.map(d => d.value)
    )
    const errorRateMetrics = this.calculateMetrics(
      timeSeriesData.errorRate.map(d => d.value)
    )
    const costMetrics = this.calculateMetrics(
      timeSeriesData.cost.map(d => d.value)
    )
    const accuracyMetrics = this.calculateMetrics(
      timeSeriesData.accuracy.map(d => d.value)
    )

    // Analyze trends
    const trends = await this.analyzeTrends(timeSeriesData, resolution)

    // Detect anomalies
    const anomalies = options.includeAnomalyDetection 
      ? await this.detectAnomalies(timeSeriesData)
      : []

    // Generate forecasts
    const forecast = options.includeForecasting
      ? await this.generateForecasts(timeSeriesData)
      : { nextHour: [], nextDay: [], nextWeek: [] }

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      metrics: {
        responseTime: responseTimeMetrics,
        throughput: throughputMetrics,
        errorRate: errorRateMetrics,
        cost: costMetrics,
        accuracy: accuracyMetrics
      },
      trends,
      anomalies
    })

    const analysis: AIPerformanceAnalysis = {
      timeframe: {
        start: startTime,
        end: endTime,
        resolution
      },
      metrics: {
        responseTime: responseTimeMetrics,
        throughput: throughputMetrics,
        errorRate: errorRateMetrics,
        cost: costMetrics,
        accuracy: accuracyMetrics
      },
      trends,
      anomalies,
      recommendations,
      forecast
    }

    this.setCache<AIPerformanceAnalysis>(cacheKey, analysis)
    return analysis
  }

  /**
   * Fetch time-series data from multiple sources
   */
  private async fetchTimeSeriesData(options: {
    startTime: Date
    endTime: Date
    resolution: string
    features?: string[]
    models?: string[]
  }): Promise<{
    responseTime: TimeSeriesDataPoint[]
    throughput: TimeSeriesDataPoint[]
    errorRate: TimeSeriesDataPoint[]
    cost: TimeSeriesDataPoint[]
    accuracy: TimeSeriesDataPoint[]
  }> {
    if (!this.supabase) {
      // Return mock data for development
      return this.generateMockTimeSeriesData(options)
    }

    try {
      // Build dynamic query based on resolution
      const timeUnit = this.getTimeUnit(options.resolution)
      
      const query = `
        SELECT 
          date_trunc('${timeUnit}', created_at) as time_bucket,
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) as request_count,
          COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as error_rate,
          AVG(cost_usd) as avg_cost,
          AVG(accuracy_score) as avg_accuracy
        FROM ai_model_usage
        WHERE created_at BETWEEN $1 AND $2
        ${options.features?.length ? 'AND feature_id = ANY($3)' : ''}
        ${options.models?.length ? 'AND model = ANY($4)' : ''}
        GROUP BY time_bucket
        ORDER BY time_bucket
      `

      const params = [options.startTime.toISOString(), options.endTime.toISOString()]
      if (options.features?.length) params.push(...options.features)
      if (options.models?.length) params.push(...options.models)

      const { data, error } = await this.supabase.rpc('execute_raw_sql', {
        query,
        params
      })

      if (error) throw error

      // Transform data into time series format
      const responseTime: TimeSeriesDataPoint[] = []
      const throughput: TimeSeriesDataPoint[] = []
      const errorRate: TimeSeriesDataPoint[] = []
      const cost: TimeSeriesDataPoint[] = []
      const accuracy: TimeSeriesDataPoint[] = []

      for (const row of data || []) {
        const timestamp = new Date(row.time_bucket)
        
        responseTime.push({
          timestamp,
          value: parseFloat(row.avg_response_time) || 0
        })
        
        throughput.push({
          timestamp,
          value: parseInt(row.request_count) || 0
        })
        
        errorRate.push({
          timestamp,
          value: parseFloat(row.error_rate) || 0
        })
        
        cost.push({
          timestamp,
          value: parseFloat(row.avg_cost) || 0
        })
        
        accuracy.push({
          timestamp,
          value: parseFloat(row.avg_accuracy) || 0
        })
      }

      return { responseTime, throughput, errorRate, cost, accuracy }
    } catch (error) {
      console.error('Failed to fetch time series data:', error)
      return this.generateMockTimeSeriesData(options)
    }
  }

  /**
   * Calculate comprehensive metrics for a time series
   */
  private calculateMetrics(values: number[]): TimeSeriesMetrics {
    if (values.length === 0) {
      return {
        mean: 0, median: 0, stdDev: 0, min: 0, max: 0,
        percentile95: 0, percentile99: 0, trend: 'stable'
      }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const median = this.getPercentile(sorted, 50)
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Detect trend using linear regression
    const trend = this.detectTrend(values)
    
    // Detect seasonality
    const seasonality = this.detectSeasonality(values)

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentile95: this.getPercentile(sorted, 95),
      percentile99: this.getPercentile(sorted, 99),
      trend,
      seasonality
    }
  }

  /**
   * Analyze trends across all metrics
   */
  private async analyzeTrends(
    data: any,
    resolution: string
  ): Promise<PerformanceTrend[]> {
    const trends: PerformanceTrend[] = []

    // Analyze each metric
    for (const [metricName, timeSeries] of Object.entries(data)) {
      const values = (timeSeries as TimeSeriesDataPoint[]).map(d => d.value)
      const timestamps = (timeSeries as TimeSeriesDataPoint[]).map(d => d.timestamp)
      
      if (values.length < 3) continue

      // Calculate trend direction and rate
      const { slope, rSquared } = this.calculateLinearRegression(values)
      const direction = slope > 0.01 ? 'improving' : 
                      slope < -0.01 ? 'degrading' : 'stable'
      
      // Generate forecast
      const forecast = this.generateLinearForecast(values, timestamps, 24) // 24 future points

      trends.push({
        metric: metricName,
        timeframe: resolution,
        direction,
        rate: Math.abs(slope) * 100, // Convert to percentage
        significance: rSquared,
        forecast
      })
    }

    return trends
  }

  /**
   * Detect anomalies using statistical methods
   */
  private async detectAnomalies(data: any): Promise<AnomalyPoint[]> {
    const anomalies: AnomalyPoint[] = []

    for (const [metricName, timeSeries] of Object.entries(data)) {
      const points = timeSeries as TimeSeriesDataPoint[]
      const values = points.map(d => d.value)
      
      if (values.length < 10) continue

      // Calculate statistical bounds
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      )

      // Detect outliers using z-score method
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const zScore = Math.abs(point.value - mean) / stdDev

        if (zScore > 3) { // 3-sigma outlier
          const severity = zScore > 5 ? 'critical' : 
                          zScore > 4 ? 'high' : 
                          zScore > 3.5 ? 'medium' : 'low'
          
          const type = point.value > mean ? 'spike' : 'drop'

          anomalies.push({
            timestamp: point.timestamp,
            value: point.value,
            expectedValue: mean,
            severity,
            type,
            confidence: Math.min(zScore / 5, 1) // Normalize to 0-1
          })
        }
      }

      // Detect pattern breaks using moving average
      const windowSize = Math.min(10, Math.floor(values.length / 4))
      const movingAverage = this.calculateMovingAverage(values, windowSize)
      
      for (let i = windowSize; i < points.length; i++) {
        const deviation = Math.abs(points[i].value - movingAverage[i - windowSize])
        const threshold = stdDev * 2
        
        if (deviation > threshold) {
          anomalies.push({
            timestamp: points[i].timestamp,
            value: points[i].value,
            expectedValue: movingAverage[i - windowSize],
            severity: deviation > threshold * 2 ? 'high' : 'medium',
            type: 'pattern_break',
            confidence: Math.min(deviation / (threshold * 2), 1)
          })
        }
      }
    }

    // Sort by severity and timestamp
    return anomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity] ||
             b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  /**
   * Generate forecasts for different time horizons
   */
  private async generateForecasts(data: any): Promise<{
    nextHour: TimeSeriesDataPoint[]
    nextDay: TimeSeriesDataPoint[]
    nextWeek: TimeSeriesDataPoint[]
  }> {
    const forecasts = {
      nextHour: [] as TimeSeriesDataPoint[],
      nextDay: [] as TimeSeriesDataPoint[],
      nextWeek: [] as TimeSeriesDataPoint[]
    }

    // Use the most important metric (response time) for forecasting
    const responseTimeData = data.responseTime as TimeSeriesDataPoint[]
    if (responseTimeData.length < 5) return forecasts

    const values = responseTimeData.map(d => d.value)
    const timestamps = responseTimeData.map(d => d.timestamp)
    const lastTimestamp = timestamps[timestamps.length - 1]

    // Generate forecasts using exponential smoothing
    const alpha = 0.3 // Smoothing parameter
    const trend = this.calculateExponentialTrend(values, alpha)
    
    // Next hour (12 points at 5-minute intervals)
    forecasts.nextHour = this.generateForecastPoints(
      lastTimestamp, 12, 5 * 60 * 1000, trend, values[values.length - 1]
    )

    // Next day (24 points at 1-hour intervals)
    forecasts.nextDay = this.generateForecastPoints(
      lastTimestamp, 24, 60 * 60 * 1000, trend * 0.8, values[values.length - 1]
    )

    // Next week (7 points at 1-day intervals)
    forecasts.nextWeek = this.generateForecastPoints(
      lastTimestamp, 7, 24 * 60 * 60 * 1000, trend * 0.5, values[values.length - 1]
    )

    return forecasts
  }

  /**
   * Generate actionable recommendations based on analysis
   */
  private generateRecommendations(analysis: {
    metrics: any
    trends: PerformanceTrend[]
    anomalies: AnomalyPoint[]
  }): string[] {
    const recommendations: string[] = []

    // Response time recommendations
    if (analysis.metrics.responseTime.mean > 2000) {
      recommendations.push(
        'Average response time is high (>2s). Consider optimizing model inference or implementing caching.'
      )
    }

    if (analysis.metrics.responseTime.percentile99 > 10000) {
      recommendations.push(
        'P99 response time is very high (>10s). Investigate tail latency issues and implement request timeouts.'
      )
    }

    // Error rate recommendations
    if (analysis.metrics.errorRate.mean > 5) {
      recommendations.push(
        'Error rate is above acceptable threshold (>5%). Review error logs and implement better error handling.'
      )
    }

    // Cost recommendations
    if (analysis.metrics.cost.trend === 'increasing') {
      recommendations.push(
        'AI costs are trending upward. Consider implementing cost controls and usage optimization.'
      )
    }

    // Trend-based recommendations
    const degradingTrends = analysis.trends.filter(t => t.direction === 'degrading')
    if (degradingTrends.length > 0) {
      recommendations.push(
        `Performance is degrading in ${degradingTrends.length} metrics. Investigate recent changes and consider scaling resources.`
      )
    }

    // Anomaly-based recommendations
    const criticalAnomalies = analysis.anomalies.filter(a => a.severity === 'critical')
    if (criticalAnomalies.length > 0) {
      recommendations.push(
        `${criticalAnomalies.length} critical anomalies detected. Immediate investigation required.`
      )
    }

    // Accuracy recommendations
    if (analysis.metrics.accuracy.mean < 0.8) {
      recommendations.push(
        'Model accuracy is below optimal (80%). Consider retraining models or adjusting prompts.'
      )
    }

    return recommendations
  }

  /**
   * Compare two time periods for A/B testing or change analysis
   */
  async comparePerformance(
    baselineStart: Date,
    baselineEnd: Date,
    comparisonStart: Date,
    comparisonEnd: Date,
    options?: {
      features?: string[]
      models?: string[]
      confidenceLevel?: number
    }
  ): Promise<ComparisonAnalysis> {
    const confidenceLevel = options?.confidenceLevel || 0.95

    // Get data for both periods
    const baselineData = await this.fetchTimeSeriesData({
      startTime: baselineStart,
      endTime: baselineEnd,
      resolution: '15m',
      features: options?.features,
      models: options?.models
    })

    const comparisonData = await this.fetchTimeSeriesData({
      startTime: comparisonStart,
      endTime: comparisonEnd,
      resolution: '15m',
      features: options?.features,
      models: options?.models
    })

    const significantChanges: ComparisonAnalysis['significantChanges'] = []

    // Compare each metric
    for (const metric of ['responseTime', 'throughput', 'errorRate', 'cost', 'accuracy']) {
      const baselineValues = (baselineData as any)[metric].map((d: TimeSeriesDataPoint) => d.value)
      const comparisonValues = (comparisonData as any)[metric].map((d: TimeSeriesDataPoint) => d.value)

      if (baselineValues.length === 0 || comparisonValues.length === 0) continue

      const baselineValue = baselineValues.reduce((sum: number, v: number) => sum + v, 0) / baselineValues.length
      const comparisonValue = comparisonValues.reduce((sum: number, v: number) => sum + v, 0) / comparisonValues.length
      const percentChange = ((comparisonValue - baselineValue) / baselineValue) * 100

      // Perform t-test for statistical significance
      const pValue = this.performTTest(baselineValues, comparisonValues)
      const isSignificant = pValue < (1 - confidenceLevel)

      significantChanges.push({
        metric,
        baselineValue,
        comparisonValue,
        percentChange,
        pValue,
        isSignificant
      })
    }

    // Calculate overall improvement score
    const significantImprovements = significantChanges.filter(c => 
      c.isSignificant && (
        (c.metric === 'throughput' && c.percentChange > 0) ||
        (c.metric === 'accuracy' && c.percentChange > 0) ||
        (c.metric === 'responseTime' && c.percentChange < 0) ||
        (c.metric === 'errorRate' && c.percentChange < 0) ||
        (c.metric === 'cost' && c.percentChange < 0)
      )
    )

    const overallImprovement = significantImprovements.length / significantChanges.length * 100

    // Generate recommendations
    const recommendations = this.generateComparisonRecommendations(significantChanges)

    return {
      baselineId: `${baselineStart.toISOString()}_${baselineEnd.toISOString()}`,
      comparisonId: `${comparisonStart.toISOString()}_${comparisonEnd.toISOString()}`,
      significantChanges,
      overallImprovement,
      recommendations
    }
  }

  // Helper methods for statistical calculations
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return sortedArray[lower]
    }
    
    return sortedArray[lower] * (upper - index) + sortedArray[upper] * (index - lower)
  }

  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable'
    
    const { slope } = this.calculateLinearRegression(values)
    
    if (slope > 0.05) return 'increasing'
    if (slope < -0.05) return 'decreasing'
    return 'stable'
  }

  private detectSeasonality(values: number[]): SeasonalityPattern {
    // Simplified seasonality detection using autocorrelation
    if (values.length < 20) {
      return { detected: false, period: 0, amplitude: 0, confidence: 0 }
    }

    const autocorrelations = this.calculateAutocorrelation(values, Math.floor(values.length / 4))
    const maxCorrelation = Math.max(...autocorrelations.slice(1))
    const maxIndex = autocorrelations.indexOf(maxCorrelation)

    if (maxCorrelation > 0.5) {
      return {
        detected: true,
        period: maxIndex * 15 * 60 * 1000, // Convert to milliseconds (assuming 15-minute resolution)
        amplitude: maxCorrelation,
        confidence: maxCorrelation
      }
    }

    return { detected: false, period: 0, amplitude: 0, confidence: 0 }
  }

  private calculateLinearRegression(values: number[]): { slope: number; rSquared: number } {
    const n = values.length
    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, v) => sum + v, 0)
    const xySum = values.reduce((sum, v, i) => sum + v * i, 0)
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
    
    // Calculate R-squared
    const yMean = ySum / n
    const totalSumSquares = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0)
    const residualSumSquares = values.reduce((sum, v, i) => {
      const predicted = slope * i + (ySum - slope * xSum) / n
      return sum + Math.pow(v - predicted, 2)
    }, 0)
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares)

    return { slope, rSquared }
  }

  private calculateAutocorrelation(values: number[], maxLag: number): number[] {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    
    const autocorrelations: number[] = []
    
    for (let lag = 0; lag <= maxLag; lag++) {
      let covariance = 0
      const n = values.length - lag
      
      for (let i = 0; i < n; i++) {
        covariance += (values[i] - mean) * (values[i + lag] - mean)
      }
      
      covariance /= n
      autocorrelations.push(covariance / variance)
    }
    
    return autocorrelations
  }

  private calculateMovingAverage(values: number[], windowSize: number): number[] {
    const movingAverage: number[] = []
    
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1)
      const average = window.reduce((sum, v) => sum + v, 0) / windowSize
      movingAverage.push(average)
    }
    
    return movingAverage
  }

  private calculateExponentialTrend(values: number[], alpha: number): number {
    if (values.length < 2) return 0
    
    let trend = values[1] - values[0]
    
    for (let i = 2; i < values.length; i++) {
      const newTrend = values[i] - values[i - 1]
      trend = alpha * newTrend + (1 - alpha) * trend
    }
    
    return trend
  }

  private generateLinearForecast(
    values: number[], 
    timestamps: Date[], 
    steps: number
  ): TimeSeriesDataPoint[] {
    const { slope } = this.calculateLinearRegression(values)
    const lastValue = values[values.length - 1]
    const lastTimestamp = timestamps[timestamps.length - 1]
    const timeInterval = timestamps.length > 1 
      ? timestamps[1].getTime() - timestamps[0].getTime()
      : 15 * 60 * 1000 // Default 15 minutes

    const forecast: TimeSeriesDataPoint[] = []
    
    for (let i = 1; i <= steps; i++) {
      forecast.push({
        timestamp: new Date(lastTimestamp.getTime() + i * timeInterval),
        value: Math.max(0, lastValue + slope * i) // Prevent negative values
      })
    }
    
    return forecast
  }

  private generateForecastPoints(
    startTime: Date,
    count: number,
    interval: number,
    trend: number,
    baseValue: number
  ): TimeSeriesDataPoint[] {
    const points: TimeSeriesDataPoint[] = []
    
    for (let i = 1; i <= count; i++) {
      points.push({
        timestamp: new Date(startTime.getTime() + i * interval),
        value: Math.max(0, baseValue + trend * i + Math.random() * trend * 0.1) // Add small noise
      })
    }
    
    return points
  }

  private performTTest(sample1: number[], sample2: number[]): number {
    // Simplified t-test implementation
    const mean1 = sample1.reduce((sum, v) => sum + v, 0) / sample1.length
    const mean2 = sample2.reduce((sum, v) => sum + v, 0) / sample2.length
    
    const var1 = sample1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (sample1.length - 1)
    const var2 = sample2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (sample2.length - 1)
    
    const pooledVar = ((sample1.length - 1) * var1 + (sample2.length - 1) * var2) / 
                     (sample1.length + sample2.length - 2)
    
    const standardError = Math.sqrt(pooledVar * (1/sample1.length + 1/sample2.length))
    const tStatistic = (mean1 - mean2) / standardError
    
    // Return approximate p-value (simplified)
    return Math.exp(-0.5 * Math.abs(tStatistic))
  }

  private generateComparisonRecommendations(changes: ComparisonAnalysis['significantChanges']): string[] {
    const recommendations: string[] = []
    
    const significantChanges = changes.filter(c => c.isSignificant)
    
    if (significantChanges.length === 0) {
      recommendations.push('No statistically significant changes detected.')
      return recommendations
    }

    for (const change of significantChanges) {
      if (change.metric === 'responseTime' && change.percentChange > 10) {
        recommendations.push('Response time has significantly increased. Investigate performance degradation.')
      }
      
      if (change.metric === 'errorRate' && change.percentChange > 20) {
        recommendations.push('Error rate has significantly increased. Review recent changes and error logs.')
      }
      
      if (change.metric === 'cost' && change.percentChange > 15) {
        recommendations.push('Costs have significantly increased. Review usage patterns and optimize expensive operations.')
      }
      
      if (change.metric === 'accuracy' && change.percentChange < -5) {
        recommendations.push('Model accuracy has decreased. Consider retraining or prompt optimization.')
      }
    }

    return recommendations
  }

  private getTimeUnit(resolution: string): string {
    const unitMap: Record<string, string> = {
      '1m': 'minute',
      '5m': 'minute',
      '15m': 'minute', 
      '1h': 'hour',
      '1d': 'day'
    }
    return unitMap[resolution] || 'minute'
  }

  private generateMockTimeSeriesData(options: any): any {
    // Generate realistic mock data for development
    const points = 100
    const now = new Date()
    const data: any = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      cost: [],
      accuracy: []
    }

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(now.getTime() - (points - i) * 15 * 60 * 1000)
      
      data.responseTime.push({
        timestamp,
        value: 1500 + Math.sin(i / 10) * 300 + Math.random() * 200
      })
      
      data.throughput.push({
        timestamp,
        value: 50 + Math.sin(i / 8) * 10 + Math.random() * 5
      })
      
      data.errorRate.push({
        timestamp,
        value: Math.max(0, 2 + Math.sin(i / 15) * 1 + Math.random() * 1)
      })
      
      data.cost.push({
        timestamp,
        value: 0.05 + Math.sin(i / 12) * 0.01 + Math.random() * 0.005
      })
      
      data.accuracy.push({
        timestamp,
        value: 0.85 + Math.sin(i / 20) * 0.05 + Math.random() * 0.02
      })
    }

    return data
  }

  // Cache management
  private generateCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.analysisCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result as T
    }
    this.analysisCache.delete(key)
    return null
  }

  private setCache<T>(key: string, result: T): void {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now()
    })
    
    // Limit cache size
    if (this.analysisCache.size > 100) {
      const firstKey = this.analysisCache.keys().next().value
      if (firstKey) {
        this.analysisCache.delete(firstKey)
      }
    }
  }
}

// Export singleton instance
export const aiTimeSeriesAnalyzer = new AITimeSeriesAnalyzer()

export type {
  TimeSeriesDataPoint,
  TimeSeriesMetrics,
  AIPerformanceAnalysis,
  PerformanceTrend,
  AnomalyPoint,
  ComparisonAnalysis
}
