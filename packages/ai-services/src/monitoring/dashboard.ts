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
import { CacheManager } from '../cache/cache.manager';
import {
  DashboardData,
  PerformanceMetrics,
  CostMetrics,
  HealthMetrics
} from '../types/index';

import { CostTracker } from './cost-tracker';

interface MetricValue {
  value: number;
  timestamp: Date;
}

export class AIMonitoringDashboard {
  private costTracker: CostTracker;
  private cacheManager: CacheManager;
  private metrics: Map<string, MetricValue[]> = new Map();
  private metricsRetention: number = 3600000; // 1 hour
  
  constructor(costTracker: CostTracker, cacheManager: CacheManager) {
    this.costTracker = costTracker;
    this.cacheManager = cacheManager;
    
    // Clean old metrics periodically
    setInterval(() => this.cleanOldMetrics(), 60000); // Every minute
  }
  
  async getDashboardData(): Promise<DashboardData> {
    const [performance, costs, cache, health] = await Promise.all([
      this.getPerformanceMetrics(),
      this.getCostMetrics(),
      this.cacheManager.getStats(),
      this.getHealthMetrics()
    ]);
    
    return {
      performance,
      costs,
      cache,
      health,
      timestamp: new Date()
    };
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push({ value, timestamp: new Date() });
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      requestsPerMinute: this.getRate('ai.requests', 60),
      averageLatency: this.getAverage('ai.latency', 300),
      p95Latency: this.getPercentile('ai.latency', 95, 300),
      errorRate: this.getErrorRate(300),
      activeRequests: this.getLatestValue('ai.active_requests')
    };
  }
  
  private async getCostMetrics(): Promise<CostMetrics> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    return {
      todayTotal: await this.costTracker.getTotalCost(dayStart, now),
      projectedMonthly: await this.costTracker.getProjectedMonthlyCost(),
      byProvider: await this.costTracker.getCostByProvider('day'),
      byFeature: await this.costTracker.getCostByFeature('day'),
      costPerUser: await this.costTracker.getAverageCostPerUser('day')
    };
  }
  
  private async getHealthMetrics(): Promise<HealthMetrics> {
    const cacheHealthy = await this.cacheManager.healthCheck();
    
    // In a real implementation, you would check each provider
    const providers = {
      gemini: {
        status: 'up' as const,
        lastCheck: new Date(),
        latency: this.getLatestValue('ai.provider.gemini.latency')
      },
      openai: {
        status: 'up' as const,
        lastCheck: new Date(),
        latency: this.getLatestValue('ai.provider.openai.latency')
      }
    };
    
    const allHealthy = cacheHealthy && Object.values(providers).every(p => p.status === 'up');
    
    return {
      status: allHealthy ? 'healthy' : cacheHealthy ? 'degraded' : 'unhealthy',
      providers,
      cache: {
        connected: cacheHealthy,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    };
  }
  
  private getRate(metric: string, seconds: number): number {
    const values = this.getRecentValues(metric, seconds);
    if (values.length === 0) return 0;
    
    const count = values.length;
    
    return (count / seconds) * 60; // Convert to per minute
  }
  
  private getAverage(metric: string, seconds: number): number {
    const values = this.getRecentValues(metric, seconds);
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, v) => acc + v.value, 0);
    return sum / values.length;
  }
  
  private getPercentile(metric: string, percentile: number, seconds: number): number {
    const values = this.getRecentValues(metric, seconds);
    if (values.length === 0) return 0;
    
    const sorted = values.map(v => v.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index] || 0;
  }
  
  private getErrorRate(seconds: number): number {
    const requests = this.getRecentValues('ai.requests', seconds).length;
    const errors = this.getRecentValues('ai.errors', seconds).length;
    
    if (requests === 0) return 0;
    return (errors / requests) * 100;
  }
  
  private getLatestValue(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;
    
    return values[values.length - 1].value;
  }
  
  private getRecentValues(metric: string, seconds: number): MetricValue[] {
    const values = this.metrics.get(metric);
    if (!values) return [];
    
    const cutoff = new Date(Date.now() - seconds * 1000);
    return values.filter(v => v.timestamp > cutoff);
  }
  
  private cleanOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.metricsRetention);
    
    for (const [metric, values] of this.metrics) {
      const filtered = values.filter(v => v.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(metric);
      } else {
        this.metrics.set(metric, filtered);
      }
    }
  }
  
  // Helper method to format dashboard data for display
  formatDashboard(data: DashboardData): string {
    return `
AI Services Dashboard - ${data.timestamp.toLocaleString()}
========================================

Performance Metrics:
- Requests/min: ${data.performance.requestsPerMinute.toFixed(1)}
- Avg Latency: ${data.performance.averageLatency.toFixed(0)}ms
- P95 Latency: ${data.performance.p95Latency.toFixed(0)}ms
- Error Rate: ${data.performance.errorRate.toFixed(2)}%
- Active Requests: ${data.performance.activeRequests}

Cost Metrics:
- Today Total: $${data.costs.todayTotal.toFixed(4)}
- Projected Monthly: $${data.costs.projectedMonthly.toFixed(2)}
- Cost per User: $${data.costs.costPerUser.toFixed(4)}

Cache Performance:
- Hit Rate: ${(data.cache.hitRate * 100).toFixed(1)}%
- Total Hits: ${data.cache.hits}
- Total Misses: ${data.cache.misses}

System Health: ${data.health.status.toUpperCase()}
- Cache: ${data.health.cache.connected ? 'Connected' : 'Disconnected'}
- Memory Usage: ${data.health.cache.memoryUsage.toFixed(1)}MB
`;
  }
}