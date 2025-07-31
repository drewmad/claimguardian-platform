/**
 * @fileMetadata
 * @purpose AI-powered learning assistant for development insights
 * @owner dev-tools-team
 * @status active
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface LearningQuery {
  query: string
  context?: {
    errorMessage?: string
    fileName?: string
    lineNumber?: number
    stackTrace?: string
  }
}

export interface LearningSuggestion {
  id: string
  title: string
  problem: string
  solution: string
  confidence: number
  category: string
  tags: string[]
  preventionTips?: string[]
  relatedLearnings?: string[]
}

export interface PatternMatch {
  patternName: string
  autoFixAvailable: boolean
  autoFixScript?: string
  confidence: number
}

export class LearningAssistant {
  private supabase = createClient()
  private cache = new Map<string, LearningSuggestion[]>()

  /**
   * Search for relevant learnings based on error or query
   */
  async searchLearnings(query: LearningQuery): Promise<LearningSuggestion[]> {
    try {
      const cacheKey = this.generateCacheKey(query)
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!
      }

      // Search using full-text search
      const { data: textResults, error: textError } = await this.supabase
        .rpc('search_learnings', {
          p_query: query.query,
          p_limit: 10
        })

      if (textError) {
        logger.error('Failed to search learnings', { query, error: textError })
        return []
      }

      // Enhance results with context
      const suggestions = await this.enhanceResults(textResults || [])
      
      // Cache results
      this.cache.set(cacheKey, suggestions)
      
      return suggestions
    } catch (error) {
      logger.error('Error in learning search', { query }, error as Error)
      return []
    }
  }

  /**
   * Detect patterns in error messages
   */
  async detectPatterns(errorText: string): Promise<PatternMatch[]> {
    try {
      const { data: patterns, error } = await this.supabase
        .rpc('detect_error_pattern', {
          p_error_text: errorText
        })

      if (error) {
        logger.error('Failed to detect patterns', { error })
        return []
      }

      return (patterns || []).map((p: {
        pattern_name: string
        auto_fix_available: boolean
        auto_fix_script?: string
      }) => ({
        patternName: p.pattern_name,
        autoFixAvailable: p.auto_fix_available,
        autoFixScript: p.auto_fix_script,
        confidence: 0.8 // Default confidence
      }))
    } catch (error) {
      logger.error('Error detecting patterns', {}, error as Error)
      return []
    }
  }

  /**
   * Log a new learning to the system
   */
  async logLearning({
    title,
    problem,
    solution,
    category = 'general',
    tags = [],
    severity = 'medium'
  }: {
    title: string
    problem: string
    solution: string
    category?: string
    tags?: string[]
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<{ success: boolean; id?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('add_learning', {
        p_title: title,
        p_problem: problem,
        p_solution: solution,
        p_category: category,
        p_tags: tags,
        p_severity: severity
      })

      if (error) {
        logger.error('Failed to log learning', { error })
        return { success: false }
      }

      // Clear cache as new learning added
      this.cache.clear()

      return { success: true, id: data }
    } catch (error) {
      logger.error('Error logging learning', {}, error as Error)
      return { success: false }
    }
  }

  /**
   * Get learning statistics
   */
  async getStats(period: 'week' | 'month' | 'all' = 'month') {
    try {
      const startDate = this.getStartDate(period)
      
      const { data, error } = await this.supabase
        .from('learnings')
        .select('category_id, severity, created_at')
        .gte('created_at', startDate.toISOString())

      if (error) {
        logger.error('Failed to get stats', { error })
        return null
      }

      // Process stats
      const stats = {
        totalIssues: data?.length || 0,
        bySeverity: this.groupBySeverity(data || []),
        byCategory: await this.groupByCategory(data || []),
        recentTrends: this.calculateTrends(data || [])
      }

      return stats
    } catch (error) {
      logger.error('Error getting stats', {}, error as Error)
      return null
    }
  }

  /**
   * Get suggested fixes for common patterns
   */
  async getSuggestedFixes(errorMessage: string): Promise<string[]> {
    const patterns = await this.detectPatterns(errorMessage)
    const fixes: string[] = []

    // Add auto-fix scripts
    patterns.forEach(pattern => {
      if (pattern.autoFixAvailable && pattern.autoFixScript) {
        fixes.push(pattern.autoFixScript)
      }
    })

    // Add common fixes based on error type
    if (errorMessage.includes('Cannot find module')) {
      fixes.push('npm install', 'Check import path spelling', 'Verify package is installed')
    }
    
    if (errorMessage.includes('Type') && errorMessage.includes('is not assignable')) {
      fixes.push('Check type definitions', 'Verify function return types', 'Add type assertions if needed')
    }

    return fixes
  }

  /**
   * Private helper methods
   */
  private generateCacheKey(query: LearningQuery): string {
    return `${query.query}-${query.context?.fileName || ''}-${query.context?.errorMessage || ''}`
  }

  private async enhanceResults(
    results: Array<{
      id: string
      title: string
      problem: string
      solution: string
      similarity?: number
      severity?: string
      created_at: string
      category_id?: string
    }>
  ): Promise<LearningSuggestion[]> {
    // Get additional data for each result
    const enhanced = await Promise.all(results.map(async (result) => {
      // Get tags
      const { data: tags } = await this.supabase
        .from('learning_tag_map')
        .select('tag:learning_tags(name)')
        .eq('learning_id', result.id)

      // Get category
      const { data: learning } = await this.supabase
        .from('learnings')
        .select('category:learning_categories(name)')
        .eq('id', result.id)
        .single()

      return {
        id: result.id,
        title: result.title,
        problem: result.problem,
        solution: result.solution,
        confidence: result.similarity || 0,
        category: (learning?.category as any)?.name || 'general',
        tags: tags?.map((t: any) => t.tag?.name).filter(Boolean) || []
      }
    }))

    return enhanced.sort((a, b) => b.confidence - a.confidence)
  }

  private getStartDate(period: 'week' | 'month' | 'all'): Date {
    const now = new Date()
    switch (period) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7))
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1))
      case 'all':
        return new Date('2024-01-01')
    }
  }

  private groupBySeverity(data: Array<{ severity?: string }>) {
    const groups = { low: 0, medium: 0, high: 0, critical: 0 }
    data.forEach(item => {
      const severity = item.severity as keyof typeof groups
      if (severity && groups[severity] !== undefined) {
        groups[severity]++
      }
    })
    return groups
  }

  private async groupByCategory(data: Array<{ category_id?: string }>) {
    const categoryMap = new Map<string, number>()
    
    // Get category names
    const categoryIds = [...new Set(data.map(d => d.category_id).filter(Boolean))]
    const { data: categories } = await this.supabase
      .from('learning_categories')
      .select('id, name')
      .in('id', categoryIds)

    // Count by category
    data.forEach(item => {
      const category = categories?.find(c => c.id === item.category_id)
      const name = category?.name || 'general'
      categoryMap.set(name, (categoryMap.get(name) || 0) + 1)
    })

    return Object.fromEntries(categoryMap)
  }

  private calculateTrends(data: Array<{ created_at: string }>) {
    // Group by week
    const weeklyData = new Map<string, number>()
    
    data.forEach(item => {
      const date = new Date(item.created_at)
      const weekKey = `${date.getFullYear()}-W${Math.floor(date.getDate() / 7)}`
      weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + 1)
    })

    // Calculate trend (increasing/decreasing)
    const weeks = Array.from(weeklyData.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    if (weeks.length < 2) return 'stable'

    const recent = weeks.slice(-2)
    const trend = recent[1][1] > recent[0][1] ? 'increasing' : 
                  recent[1][1] < recent[0][1] ? 'decreasing' : 'stable'

    return trend
  }
}

// Singleton instance
export const learningAssistant = new LearningAssistant()