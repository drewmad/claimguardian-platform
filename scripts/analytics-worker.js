#!/usr/bin/env node

/**
 * Analytics Worker - Background processing for AI metrics
 * 
 * This worker performs:
 * - Metric aggregation (every 5 minutes)
 * - Anomaly detection (every 15 minutes)
 * - Insight generation (every hour)
 * - Data cleanup (daily)
 */

const { createClient } = require('@supabase/supabase-js')
const { program } = require('commander')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

class AnalyticsWorker {
  constructor() {
    this.isRunning = false
    this.intervals = new Map()
    this.stats = {
      aggregationsRun: 0,
      anomaliesDetected: 0,
      insightsGenerated: 0,
      lastRun: null,
      errors: []
    }
  }

  /**
   * Start the analytics worker
   */
  async start() {
    if (this.isRunning) {
      console.log('Analytics worker is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting Analytics Worker...')

    // Schedule periodic tasks
    this.scheduleAggregation()
    this.scheduleAnomalyDetection()
    this.scheduleInsightGeneration()
    this.scheduleCleanup()

    // Initial run
    await this.runAggregation()
    await this.runAnomalyDetection()

    console.log('✅ Analytics Worker started successfully')
    this.printStatus()
  }

  /**
   * Stop the analytics worker
   */
  stop() {
    if (!this.isRunning) {
      console.log('Analytics worker is not running')
      return
    }

    this.isRunning = false
    
    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval)
      console.log(`Stopped ${name} task`)
    }
    
    this.intervals.clear()
    console.log('⏹️  Analytics Worker stopped')
  }

  /**
   * Schedule metric aggregation every 5 minutes
   */
  scheduleAggregation() {
    const interval = setInterval(async () => {
      await this.runAggregation()
    }, 5 * 60 * 1000) // 5 minutes

    this.intervals.set('aggregation', interval)
    console.log('📊 Scheduled metric aggregation every 5 minutes')
  }

  /**
   * Schedule anomaly detection every 15 minutes
   */
  scheduleAnomalyDetection() {
    const interval = setInterval(async () => {
      await this.runAnomalyDetection()
    }, 15 * 60 * 1000) // 15 minutes

    this.intervals.set('anomaly-detection', interval)
    console.log('🔍 Scheduled anomaly detection every 15 minutes')
  }

  /**
   * Schedule insight generation every hour
   */
  scheduleInsightGeneration() {
    const interval = setInterval(async () => {
      await this.runInsightGeneration()
    }, 60 * 60 * 1000) // 1 hour

    this.intervals.set('insight-generation', interval)
    console.log('💡 Scheduled insight generation every hour')
  }

  /**
   * Schedule data cleanup daily at 2 AM
   */
  scheduleCleanup() {
    const scheduleNextCleanup = () => {
      const now = new Date()
      const next2AM = new Date()
      next2AM.setHours(2, 0, 0, 0)
      
      if (next2AM <= now) {
        next2AM.setDate(next2AM.getDate() + 1)
      }
      
      const msUntil2AM = next2AM.getTime() - now.getTime()
      
      setTimeout(async () => {
        await this.runCleanup()
        scheduleNextCleanup() // Schedule next day
      }, msUntil2AM)
      
      console.log(`🧹 Scheduled cleanup at ${next2AM.toLocaleString()}`)
    }

    scheduleNextCleanup()
  }

  /**
   * Run metric aggregation
   */
  async runAggregation() {
    try {
      console.log('📊 Running metric aggregation...')
      
      // Aggregate for different time windows
      const windows = [
        { interval: '1 minute', lookback: '10 minutes' },
        { interval: '5 minutes', lookback: '1 hour' },
        { interval: '15 minutes', lookback: '4 hours' },
        { interval: '1 hour', lookback: '1 day' }
      ]

      for (const window of windows) {
        const { data, error } = await supabase.rpc('aggregate_ai_metrics', {
          window_interval: window.interval,
          lookback_period: window.lookback
        })

        if (error) {
          throw error
        }

        console.log(`  ✓ Aggregated ${window.interval} metrics (lookback: ${window.lookback})`)
      }

      this.stats.aggregationsRun++
      this.stats.lastRun = new Date().toISOString()
      
    } catch (error) {
      console.error('❌ Aggregation failed:', error.message)
      this.stats.errors.push({
        type: 'aggregation',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Run anomaly detection
   */
  async runAnomalyDetection() {
    try {
      console.log('🔍 Running anomaly detection...')
      
      // Detect anomalies with different sensitivity levels
      const configurations = [
        { lookback: 24, sensitivity: 3.0, name: 'standard' },
        { lookback: 12, sensitivity: 2.5, name: 'sensitive' },
        { lookback: 6, sensitivity: 4.0, name: 'conservative' }
      ]

      let totalAnomalies = 0

      for (const config of configurations) {
        const { data, error } = await supabase.rpc('detect_ai_anomalies', {
          lookback_hours: config.lookback,
          sensitivity: config.sensitivity
        })

        if (error) {
          throw error
        }

        totalAnomalies += data || 0
        console.log(`  ✓ ${config.name} detection: ${data || 0} anomalies (${config.lookback}h, σ=${config.sensitivity})`)
      }

      this.stats.anomaliesDetected += totalAnomalies
      
      if (totalAnomalies > 0) {
        console.log(`🚨 Total anomalies detected: ${totalAnomalies}`)
      }
      
    } catch (error) {
      console.error('❌ Anomaly detection failed:', error.message)
      this.stats.errors.push({
        type: 'anomaly-detection',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Run insight generation
   */
  async runInsightGeneration() {
    try {
      console.log('💡 Running insight generation...')
      
      // Generate insights based on recent trends and anomalies
      const insights = await this.generateInsights()
      
      for (const insight of insights) {
        const { error } = await supabase
          .from('ai_performance_insights')
          .insert(insight)

        if (error) {
          console.error('Failed to save insight:', error.message)
        }
      }

      this.stats.insightsGenerated += insights.length
      console.log(`💡 Generated ${insights.length} insights`)
      
    } catch (error) {
      console.error('❌ Insight generation failed:', error.message)
      this.stats.errors.push({
        type: 'insight-generation',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Generate performance insights based on data analysis
   */
  async generateInsights() {
    const insights = []
    
    try {
      // Analyze recent metrics for trends
      const { data: recentMetrics } = await supabase
        .from('ai_metrics_aggregated')
        .select('*')
        .gte('time_bucket', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('time_bucket', { ascending: false })

      if (!recentMetrics?.length) return insights

      // Group by metric name
      const metricGroups = recentMetrics.reduce((groups, metric) => {
        const key = `${metric.metric_name}_${metric.feature_id || 'all'}_${metric.model_name || 'all'}`
        if (!groups[key]) groups[key] = []
        groups[key].push(metric)
        return groups
      }, {})

      // Analyze each metric group for trends
      for (const [key, metrics] of Object.entries(metricGroups)) {
        if (metrics.length < 3) continue

        const values = metrics.map(m => m.avg_value).slice(0, 10) // Last 10 data points
        const trend = this.calculateTrend(values)
        
        if (Math.abs(trend.slope) > 0.1) {
          insights.push({
            insight_type: 'trend',
            title: `${metrics[0].metric_name} Trend Alert`,
            description: `${metrics[0].metric_name} is ${trend.slope > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend.slope * 100).toFixed(1)}% per hour`,
            analysis_period_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            analysis_period_end: new Date().toISOString(),
            confidence_score: Math.min(Math.abs(trend.rSquared), 1),
            impact_score: Math.min(Math.abs(trend.slope), 1),
            recommendations: [
              trend.slope > 0 && metrics[0].metric_name === 'response_time' 
                ? 'Consider scaling resources or optimizing queries'
                : trend.slope < 0 && metrics[0].metric_name === 'response_time'
                ? 'Performance improvements detected - monitor for sustainability'
                : 'Monitor trend continuation and investigate root causes'
            ],
            feature_id: metrics[0].feature_id,
            model_name: metrics[0].model_name,
            provider: metrics[0].provider,
            related_metrics: [metrics[0].metric_name],
            generated_by: 'analytics-worker'
          })
        }
      }

      // Check for cost anomalies
      const { data: costMetrics } = await supabase
        .from('ai_metrics_aggregated')
        .select('*')
        .eq('metric_name', 'cost')
        .gte('time_bucket', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('time_bucket', { ascending: false })
        .limit(24)

      if (costMetrics?.length > 10) {
        const costs = costMetrics.map(m => m.avg_value)
        const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length
        const recentAvg = costs.slice(0, 6).reduce((sum, c) => sum + c, 0) / 6
        
        if (recentAvg > avgCost * 1.5) {
          insights.push({
            insight_type: 'cost_analysis',
            title: 'AI Cost Spike Detected',
            description: `AI costs have increased by ${((recentAvg / avgCost - 1) * 100).toFixed(1)}% in the last 6 hours`,
            analysis_period_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            analysis_period_end: new Date().toISOString(),
            confidence_score: 0.9,
            impact_score: Math.min((recentAvg / avgCost - 1), 1),
            recommendations: [
              'Review recent AI usage patterns',
              'Check for inefficient prompts or model usage',
              'Consider implementing cost limits'
            ],
            related_metrics: ['cost'],
            generated_by: 'analytics-worker'
          })
        }
      }

    } catch (error) {
      console.error('Error generating insights:', error)
    }

    return insights
  }

  /**
   * Calculate linear trend for a series of values
   */
  calculateTrend(values) {
    const n = values.length
    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, v) => sum + v, 0)
    const xySum = values.reduce((sum, v, i) => sum + v * i, 0)
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
    
    const yMean = ySum / n
    const totalSumSquares = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0)
    const residualSumSquares = values.reduce((sum, v, i) => {
      const predicted = slope * i + (ySum - slope * xSum) / n
      return sum + Math.pow(v - predicted, 2)
    }, 0)
    
    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares)

    return { slope, rSquared }
  }

  /**
   * Run data cleanup
   */
  async runCleanup() {
    try {
      console.log('🧹 Running data cleanup...')
      
      // Clean up old raw metrics (keep 7 days)
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())

      if (error) {
        throw error
      }

      console.log('✓ Cleaned up old performance metrics')

      // Clean up old aggregated data (keep 30 days)
      const aggregatedCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      await supabase
        .from('ai_metrics_aggregated')
        .delete()
        .lt('time_bucket', aggregatedCutoff.toISOString())

      console.log('✓ Cleaned up old aggregated metrics')

      // Clean up resolved anomalies (keep 30 days)
      await supabase
        .from('ai_anomalies')
        .delete()
        .eq('status', 'resolved')
        .lt('detected_at', aggregatedCutoff.toISOString())

      console.log('✓ Cleaned up resolved anomalies')
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message)
      this.stats.errors.push({
        type: 'cleanup',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Print worker status
   */
  printStatus() {
    console.log('\n📈 Analytics Worker Status:')
    console.log(`  Running: ${this.isRunning}`)
    console.log(`  Aggregations: ${this.stats.aggregationsRun}`)
    console.log(`  Anomalies detected: ${this.stats.anomaliesDetected}`)
    console.log(`  Insights generated: ${this.stats.insightsGenerated}`)
    console.log(`  Last run: ${this.stats.lastRun || 'Never'}`)
    console.log(`  Errors: ${this.stats.errors.length}`)
    
    if (this.stats.errors.length > 0) {
      console.log('\nRecent errors:')
      this.stats.errors.slice(-3).forEach(error => {
        console.log(`  ❌ ${error.type}: ${error.error} (${error.timestamp})`)
      })
    }
    console.log('')
  }

  /**
   * Run a single operation
   */
  async runOnce(operation) {
    switch (operation) {
      case 'aggregate':
        await this.runAggregation()
        break
      case 'anomalies':
        await this.runAnomalyDetection()
        break
      case 'insights':
        await this.runInsightGeneration()
        break
      case 'cleanup':
        await this.runCleanup()
        break
      default:
        console.error(`Unknown operation: ${operation}`)
    }
  }
}

// CLI setup
program
  .name('analytics-worker')
  .description('ClaimGuardian Analytics Worker')
  .version('1.0.0')

program
  .command('start')
  .description('Start the analytics worker daemon')
  .action(async () => {
    const worker = new AnalyticsWorker()
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT, shutting down gracefully...')
      worker.stop()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...')
      worker.stop()
      process.exit(0)
    })

    await worker.start()
    
    // Keep process alive
    process.stdin.resume()
  })

program
  .command('run')
  .description('Run a specific operation once')
  .argument('<operation>', 'Operation to run: aggregate, anomalies, insights, cleanup')
  .action(async (operation) => {
    const worker = new AnalyticsWorker()
    await worker.runOnce(operation)
    console.log(`✅ Completed ${operation}`)
  })

program
  .command('status')
  .description('Show worker status')
  .action(() => {
    // This would connect to a running worker to get status
    console.log('Status check not implemented for standalone runs')
  })

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Run CLI
if (require.main === module) {
  program.parse()
}