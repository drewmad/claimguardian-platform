import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Usage, CostEntry, UserCosts } from '../types/index';

export class CostTracker {
  private supabase: SupabaseClient | null = null;
  private costBuffer: CostEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  private maxBufferSize: number = 100;
  
  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    autoFlush: boolean = true
  ) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    
    if (autoFlush && this.supabase) {
      this.startAutoFlush();
    }
  }
  
  async track(
    userId: string,
    usage: Usage,
    feature: string,
    provider: string = 'unknown'
  ): Promise<void> {
    const entry: CostEntry = {
      userId,
      feature,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalCost: usage.totalCost,
      provider: provider,
      model: usage.model,
      timestamp: new Date()
    };
    
    this.costBuffer.push(entry);
    
    // Flush if buffer is getting large
    if (this.costBuffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.costBuffer.length === 0 || !this.supabase) return;
    
    const entries = [...this.costBuffer];
    this.costBuffer = [];
    
    try {
      // Transform entries for database
      const dbEntries = entries.map(entry => ({
        user_id: entry.userId,
        feature: entry.feature,
        prompt_tokens: entry.promptTokens,
        completion_tokens: entry.completionTokens,
        total_cost: entry.totalCost,
        provider: entry.provider,
        model: entry.model,
        created_at: entry.timestamp.toISOString()
      }));
      
      const { error } = await this.supabase
        .from('ai_interactions')
        .insert(dbEntries);
        
      if (error) {
        console.error('[CostTracker] Failed to insert costs:', error);
        // Re-add to buffer for retry
        this.costBuffer.unshift(...entries);
      } else {
        console.log(`[CostTracker] Flushed ${entries.length} cost entries`);
      }
      
      // Also update aggregated costs
      await this.updateAggregatedCosts(entries);
    } catch (error) {
      console.error('[CostTracker] Error flushing costs:', error);
      // Re-add to buffer for retry
      this.costBuffer.unshift(...entries);
    }
  }
  
  private async updateAggregatedCosts(entries: CostEntry[]): Promise<void> {
    if (!this.supabase) return;
    
    // Group by user, feature, and period
    const aggregated = new Map<string, {
      userId: string;
      feature: string;
      period: string;
      totalCost: number;
      requestCount: number;
      totalTokens: number;
    }>();
    
    for (const entry of entries) {
      const period = entry.timestamp.toISOString().split('T')[0]; // Daily aggregation
      const key = `${entry.userId}:${entry.feature}:${period}`;
      
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          userId: entry.userId,
          feature: entry.feature,
          period,
          totalCost: 0,
          requestCount: 0,
          totalTokens: 0
        });
      }
      
      const agg = aggregated.get(key)!;
      agg.totalCost += entry.totalCost;
      agg.requestCount += 1;
      agg.totalTokens += entry.promptTokens + entry.completionTokens;
    }
    
    // Upsert aggregated data
    for (const agg of aggregated.values()) {
      try {
        const { error } = await this.supabase
          .from('ai_usage_costs')
          .upsert({
            user_id: agg.userId,
            period_start: agg.period,
            feature: agg.feature,
            request_count: agg.requestCount,
            total_tokens: agg.totalTokens,
            total_cost: agg.totalCost
          }, {
            onConflict: 'user_id,period_start,feature',
            count: 'exact'
          });
          
        if (error) {
          console.error('[CostTracker] Failed to update aggregated costs:', error);
        }
      } catch (error) {
        console.error('[CostTracker] Error updating aggregated costs:', error);
      }
    }
  }
  
  async getUserCosts(
    userId: string, 
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<UserCosts> {
    if (!this.supabase) {
      return { period, total: 0, byFeature: {} };
    }
    
    const startDate = this.getPeriodStart(period);
    
    try {
      const { data, error } = await this.supabase
        .from('ai_usage_costs')
        .select('feature, total_cost, request_count')
        .eq('user_id', userId)
        .gte('period_start', startDate.toISOString().split('T')[0]);
        
      if (error) throw error;
      
      const total = data?.reduce((sum, row) => sum + (row.total_cost || 0), 0) || 0;
      const byFeature = data?.reduce((acc, row) => ({
        ...acc,
        [row.feature]: {
          cost: row.total_cost || 0,
          requests: row.request_count || 0
        }
      }), {}) || {};
      
      return { period, total, byFeature };
    } catch (error) {
      console.error('[CostTracker] Error getting user costs:', error);
      return { period, total: 0, byFeature: {} };
    }
  }
  
  async getTotalCost(start: Date, end: Date): Promise<number> {
    if (!this.supabase) return 0;
    
    try {
      const { data, error } = await this.supabase
        .from('ai_interactions')
        .select('total_cost')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
        
      if (error) throw error;
      
      return data?.reduce((sum, row) => sum + (row.total_cost || 0), 0) || 0;
    } catch (error) {
      console.error('[CostTracker] Error getting total cost:', error);
      return 0;
    }
  }
  
  async getProjectedMonthlyCost(): Promise<number> {
    if (!this.supabase) return 0;
    
    try {
      // Get last 7 days of costs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const weekCost = await this.getTotalCost(sevenDaysAgo, new Date());
      
      // Project to 30 days
      return (weekCost / 7) * 30;
    } catch (error) {
      console.error('[CostTracker] Error calculating projected cost:', error);
      return 0;
    }
  }
  
  async getCostByProvider(period: 'day' | 'week' | 'month' = 'day'): Promise<Record<string, number>> {
    if (!this.supabase) return {};
    
    const startDate = this.getPeriodStart(period);
    
    try {
      const { data, error } = await this.supabase
        .from('ai_interactions')
        .select('provider, total_cost')
        .gte('created_at', startDate.toISOString());
        
      if (error) throw error;
      
      return data?.reduce((acc, row) => ({
        ...acc,
        [row.provider]: (acc[row.provider] || 0) + (row.total_cost || 0)
      }), {} as Record<string, number>) || {};
    } catch (error) {
      console.error('[CostTracker] Error getting cost by provider:', error);
      return {};
    }
  }
  
  async getCostByFeature(period: 'day' | 'week' | 'month' = 'day'): Promise<Record<string, number>> {
    if (!this.supabase) return {};
    
    const startDate = this.getPeriodStart(period);
    
    try {
      const { data, error } = await this.supabase
        .from('ai_usage_costs')
        .select('feature, total_cost')
        .gte('period_start', startDate.toISOString().split('T')[0]);
        
      if (error) throw error;
      
      return data?.reduce((acc, row) => ({
        ...acc,
        [row.feature]: (acc[row.feature] || 0) + (row.total_cost || 0)
      }), {} as Record<string, number>) || {};
    } catch (error) {
      console.error('[CostTracker] Error getting cost by feature:', error);
      return {};
    }
  }
  
  async getAverageCostPerUser(period: 'day' | 'week' | 'month' = 'day'): Promise<number> {
    if (!this.supabase) return 0;
    
    const startDate = this.getPeriodStart(period);
    
    try {
      const { data, error } = await this.supabase
        .from('ai_usage_costs')
        .select('user_id, total_cost')
        .gte('period_start', startDate.toISOString().split('T')[0]);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return 0;
      
      // Group by user
      const userCosts = new Map<string, number>();
      for (const row of data) {
        const current = userCosts.get(row.user_id) || 0;
        userCosts.set(row.user_id, current + (row.total_cost || 0));
      }
      
      const totalCost = Array.from(userCosts.values()).reduce((sum, cost) => sum + cost, 0);
      return totalCost / userCosts.size;
    } catch (error) {
      console.error('[CostTracker] Error calculating average cost per user:', error);
      return 0;
    }
  }
  
  private getPeriodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    const start = new Date(now);
    
    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return start;
  }
  
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('[CostTracker] Auto-flush error:', error);
      });
    }, this.flushInterval);
  }
  
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    await this.flush();
  }
}