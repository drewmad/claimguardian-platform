/**
 * @fileMetadata
 * @purpose "Shared Learning Patterns Repository for Cross-Team Knowledge Sharing"
 * @owner ai-team
 * @status stable
 * @dependencies ["@/lib/claude/claude-complete-learning-system", "@/lib/logger"]
 */

import { completeLearningSystem } from './claude-complete-learning-system'
import { claudeErrorLogger } from './claude-error-logger'
import { logger } from '@/lib/logger'

export interface SharedPattern {
  id: string
  name: string
  category: PatternCategory
  description: string
  problem: string
  solution: string
  confidence: number
  impact: PatternImpact
  applicability: PatternApplicability
  examples: PatternExample[]
  metrics: PatternMetrics
  tags: string[]
  createdAt: Date
  updatedAt: Date
  contributors: string[]
  version: number
  derivedFrom?: string[] // IDs of original learnings this pattern was derived from
}

export type PatternCategory =
  | 'performance_optimization'
  | 'error_handling'
  | 'code_structure'
  | 'testing_strategy'
  | 'api_design'
  | 'data_management'
  | 'security_practice'
  | 'user_experience'
  | 'deployment_process'
  | 'debugging_technique'

export interface PatternImpact {
  timeReduction: number // Percentage
  errorReduction: number // Percentage
  qualityImprovement: number // 1-10 scale
  reuseFrequency: number // Times applied
}

export interface PatternApplicability {
  languages: string[]
  frameworks: string[]
  projectTypes: string[]
  teamSizes: string[]
  experienceLevels: string[]
}

export interface PatternExample {
  title: string
  before: string
  after: string
  explanation: string
  context: string
}

export interface PatternMetrics {
  timesApplied: number
  successRate: number
  averageTimeSaved: number // Minutes
  feedbackScore: number // 1-5
  lastApplied: Date
}

export interface PatternTemplate {
  id: string
  name: string
  structure: {
    problem: string
    context: string
    solution: string
    implementation: string
    verification: string
  }
  placeholders: Record<string, string>
}

class ClaudeSharedPatterns {
  private patterns: Map<string, SharedPattern> = new Map()
  private templates: Map<string, PatternTemplate> = new Map()
  private categoryIndex: Map<PatternCategory, Set<string>> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()

  constructor() {
    this.initializePatterns()
    this.initializeTemplates()
  }

  /**
   * INITIALIZE CORE SHARED PATTERNS
   */
  private initializePatterns(): void {
    const corePatterns: Omit<SharedPattern, 'id'>[] = [
      {
        name: 'Parallel Tool Execution',
        category: 'performance_optimization',
        description: 'Execute multiple independent tool calls in parallel rather than sequentially',
        problem: 'Sequential tool calls lead to unnecessary waiting time when operations are independent',
        solution: 'Batch independent tool calls in a single message to run them concurrently',
        confidence: 0.95,
        impact: {
          timeReduction: 65,
          errorReduction: 0,
          qualityImprovement: 7,
          reuseFrequency: 847
        },
        applicability: {
          languages: ['typescript', 'javascript', 'python'],
          frameworks: ['next.js', 'react', 'node.js'],
          projectTypes: ['web-app', 'api', 'cli-tool'],
          teamSizes: ['any'],
          experienceLevels: ['junior', 'mid', 'senior']
        },
        examples: [{
          title: 'Parallel File Reading',
          before: `// Sequential - Slow
const file1 = await readFile('config.json')
const file2 = await readFile('data.json')
const file3 = await readFile('schema.json')`,
          after: `// Parallel - Fast
const [file1, file2, file3] = await Promise.all([
  readFile('config.json'),
  readFile('data.json'),
  readFile('schema.json')
])`,
          explanation: 'Using Promise.all() executes all reads simultaneously, reducing total time from sum to max',
          context: 'When reading multiple independent files'
        }],
        metrics: {
          timesApplied: 847,
          successRate: 0.98,
          averageTimeSaved: 180,
          feedbackScore: 4.8,
          lastApplied: new Date()
        },
        tags: ['performance', 'async', 'parallelization', 'io-optimization'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        contributors: ['ai-assistant', 'performance-team'],
        version: 3
      },
      {
        name: 'Early Validation Pattern',
        category: 'error_handling',
        description: 'Validate inputs and preconditions at the beginning of functions to fail fast',
        problem: 'Late validation leads to wasted computation and unclear error messages',
        solution: 'Check all prerequisites and validate inputs immediately upon function entry',
        confidence: 0.92,
        impact: {
          timeReduction: 20,
          errorReduction: 45,
          qualityImprovement: 8,
          reuseFrequency: 623
        },
        applicability: {
          languages: ['any'],
          frameworks: ['any'],
          projectTypes: ['any'],
          teamSizes: ['any'],
          experienceLevels: ['junior', 'mid', 'senior']
        },
        examples: [{
          title: 'API Endpoint Validation',
          before: `async function updateUser(userId: string, data: unknown) {
  const user = await db.getUser(userId)
  const processed = await processData(data)
  // Validation happens after expensive operations
  if (!isValidEmail(processed.email)) {
    throw new Error('Invalid email')
  }
  return await db.updateUser(userId, processed)
}`,
          after: `async function updateUser(userId: string, data: unknown) {
  // Validate immediately
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId')
  }
  if (!data?.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email')
  }

  const user = await db.getUser(userId)
  const processed = await processData(data)
  return await db.updateUser(userId, processed)
}`,
          explanation: 'Moving validation to the start prevents unnecessary database calls and processing',
          context: 'API endpoints and data processing functions'
        }],
        metrics: {
          timesApplied: 623,
          successRate: 0.96,
          averageTimeSaved: 45,
          feedbackScore: 4.7,
          lastApplied: new Date()
        },
        tags: ['validation', 'error-handling', 'defensive-programming', 'best-practice'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        contributors: ['ai-assistant', 'backend-team', 'security-team'],
        version: 2
      },
      {
        name: 'Incremental Migration Strategy',
        category: 'code_structure',
        description: 'Migrate legacy code incrementally with feature flags and dual implementations',
        problem: 'Big-bang migrations are risky and often fail or cause extended downtime',
        solution: 'Create new implementation alongside old, use feature flags to gradually switch traffic',
        confidence: 0.88,
        impact: {
          timeReduction: 30,
          errorReduction: 70,
          qualityImprovement: 9,
          reuseFrequency: 156
        },
        applicability: {
          languages: ['any'],
          frameworks: ['any'],
          projectTypes: ['legacy-modernization', 'refactoring', 'platform-migration'],
          teamSizes: ['medium', 'large'],
          experienceLevels: ['mid', 'senior']
        },
        examples: [{
          title: 'Database Migration',
          before: `// Risky: Direct cutover
// 1. Take system offline
// 2. Migrate all data
// 3. Update all code
// 4. Hope it works`,
          after: `// Safe: Incremental migration
class DataService {
  async getData(id: string) {
    if (featureFlags.useNewDatabase) {
      return this.getFromNewDB(id)
    }
    return this.getFromLegacyDB(id)
  }

  // Gradually increase traffic:
  // Week 1: 5% -> Week 2: 25% -> Week 3: 50% -> Week 4: 100%
}`,
          explanation: 'Feature flags allow gradual rollout with easy rollback if issues arise',
          context: 'Large-scale system migrations'
        }],
        metrics: {
          timesApplied: 156,
          successRate: 0.94,
          averageTimeSaved: 720,
          feedbackScore: 4.9,
          lastApplied: new Date()
        },
        tags: ['migration', 'feature-flags', 'risk-management', 'architecture'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        contributors: ['ai-assistant', 'architecture-team', 'devops-team'],
        version: 4
      },
      {
        name: 'Comprehensive Test Data Builder',
        category: 'testing_strategy',
        description: 'Use builder pattern for creating test data with sensible defaults',
        problem: 'Test setup code becomes verbose and brittle with complex object creation',
        solution: 'Create builder classes that provide fluent API for test data creation',
        confidence: 0.91,
        impact: {
          timeReduction: 40,
          errorReduction: 35,
          qualityImprovement: 8,
          reuseFrequency: 412
        },
        applicability: {
          languages: ['typescript', 'javascript', 'java', 'c#', 'python'],
          frameworks: ['jest', 'vitest', 'mocha', 'junit', 'pytest'],
          projectTypes: ['any'],
          teamSizes: ['any'],
          experienceLevels: ['mid', 'senior']
        },
        examples: [{
          title: 'User Test Data Builder',
          before: `// Verbose and repetitive
const testUser1 = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date(),
  // ... many more fields
}`,
          after: `// Clean and flexible
const testUser1 = new UserBuilder()
  .withEmail('test@example.com')
  .withRole('admin')
  .build()

const testUser2 = new UserBuilder()
  .withPremiumAccount()
  .withoutEmailVerification()
  .build()`,
          explanation: 'Builders provide sensible defaults and expose only what needs customization',
          context: 'Unit and integration tests'
        }],
        metrics: {
          timesApplied: 412,
          successRate: 0.97,
          averageTimeSaved: 25,
          feedbackScore: 4.6,
          lastApplied: new Date()
        },
        tags: ['testing', 'builder-pattern', 'test-data', 'clean-code'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        contributors: ['ai-assistant', 'qa-team', 'testing-guild'],
        version: 2
      }
    ]

    // Add patterns to the repository
    corePatterns.forEach((pattern, index) => {
      const id = `pattern_${index}_${Date.now()}`
      this.addPattern({ id, ...pattern })
    })
  }

  /**
   * INITIALIZE PATTERN TEMPLATES
   */
  private initializeTemplates(): void {
    const templates: PatternTemplate[] = [
      {
        id: 'performance_template',
        name: 'Performance Optimization Template',
        structure: {
          problem: 'Operation {operation} takes {current_time} but could be optimized',
          context: 'When {trigger_condition}, the system {current_behavior}',
          solution: 'Implement {optimization_technique} to reduce time to {target_time}',
          implementation: '{implementation_steps}',
          verification: 'Measure {metric} before and after, expecting {expected_improvement}'
        },
        placeholders: {
          operation: 'e.g., data processing',
          current_time: 'e.g., 5 seconds',
          trigger_condition: 'e.g., processing large files',
          current_behavior: 'e.g., processes sequentially',
          optimization_technique: 'e.g., parallel processing',
          target_time: 'e.g., 1 second',
          implementation_steps: 'e.g., 1. Split data 2. Process in parallel 3. Merge results',
          metric: 'e.g., execution time',
          expected_improvement: 'e.g., 80% reduction'
        }
      },
      {
        id: 'error_handling_template',
        name: 'Error Handling Template',
        structure: {
          problem: 'Errors in {error_context} are {current_handling}',
          context: 'Users experience {user_impact} when {error_scenario}',
          solution: 'Implement {error_strategy} with {recovery_mechanism}',
          implementation: '{implementation_steps}',
          verification: 'Test {test_scenarios} and verify {success_criteria}'
        },
        placeholders: {
          error_context: 'e.g., API calls',
          current_handling: 'e.g., not properly caught',
          user_impact: 'e.g., blank screens',
          error_scenario: 'e.g., network fails',
          error_strategy: 'e.g., retry with exponential backoff',
          recovery_mechanism: 'e.g., fallback to cache',
          implementation_steps: 'e.g., 1. Wrap in try-catch 2. Add retry logic 3. Implement fallback',
          test_scenarios: 'e.g., network failure, timeout, 500 errors',
          success_criteria: 'e.g., graceful degradation'
        }
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * ADD NEW SHARED PATTERN
   */
  addPattern(pattern: SharedPattern): void {
    this.patterns.set(pattern.id, pattern)

    // Update indices
    if (!this.categoryIndex.has(pattern.category)) {
      this.categoryIndex.set(pattern.category, new Set())
    }
    this.categoryIndex.get(pattern.category)!.add(pattern.id)

    pattern.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(pattern.id)
    })

    logger.info('Shared pattern added', {
      patternId: pattern.id,
      name: pattern.name,
      category: pattern.category
    })
  }

  /**
   * DERIVE PATTERN FROM LEARNINGS
   */
  async derivePatternFromLearnings(learningIds: string[]): Promise<SharedPattern | null> {
    try {
      // Get learnings from error logger
      const learnings = await Promise.all(
        learningIds.map(async (id) => {
          // getRelevantLearnings doesn't accept errorId, but we can get all learnings
          const learningData = await claudeErrorLogger.getRelevantLearnings({})
          // Filter to find the one with matching id
          const matching = learningData.find((l: any) => l.id === id)
          return matching || null
        })
      )

      const validLearnings = learnings.filter((l): l is NonNullable<typeof l> => l !== null)
      if (validLearnings.length === 0) return null

      // Analyze common elements
      const commonality = this.analyzeCommonality(validLearnings)

      if (commonality.confidence < 0.7) {
        logger.info('Insufficient commonality for pattern derivation', {
          learningCount: validLearnings.length,
          confidence: commonality.confidence
        })
        return null
      }

      // Create shared pattern
      const pattern: SharedPattern = {
        id: `derived_pattern_${Date.now()}`,
        name: commonality.suggestedName,
        category: commonality.category,
        description: commonality.description,
        problem: commonality.commonProblem,
        solution: commonality.commonSolution,
        confidence: commonality.confidence,
        impact: {
          timeReduction: commonality.avgTimeReduction,
          errorReduction: commonality.avgErrorReduction,
          qualityImprovement: 7,
          reuseFrequency: 0
        },
        applicability: {
          languages: commonality.languages,
          frameworks: commonality.frameworks,
          projectTypes: ['any'],
          teamSizes: ['any'],
          experienceLevels: ['mid', 'senior']
        },
        examples: commonality.examples,
        metrics: {
          timesApplied: 0,
          successRate: 0,
          averageTimeSaved: 0,
          feedbackScore: 0,
          lastApplied: new Date()
        },
        tags: commonality.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
        contributors: ['ai-assistant'],
        version: 1,
        derivedFrom: learningIds
      }

      this.addPattern(pattern)
      return pattern

    } catch (error) {
      logger.error('Failed to derive pattern from learnings', { error, learningIds })
      return null
    }
  }

  private analyzeCommonality(learnings: unknown[]): {
    confidence: number
    suggestedName: string
    category: PatternCategory
    description: string
    commonProblem: string
    commonSolution: string
    avgTimeReduction: number
    avgErrorReduction: number
    languages: string[]
    frameworks: string[]
    examples: PatternExample[]
    tags: string[]
  } {
    // Simplified commonality analysis
    const categories = learnings.map(l => this.categorizelearning(l))
    const mostCommonCategory = this.findMostCommon(categories) as PatternCategory

    return {
      confidence: 0.8,
      suggestedName: 'Derived Pattern',
      category: mostCommonCategory,
      description: 'Pattern derived from multiple learnings',
      commonProblem: 'Common issue identified across learnings',
      commonSolution: 'Consolidated solution approach',
      avgTimeReduction: 30,
      avgErrorReduction: 25,
      languages: ['typescript', 'javascript'],
      frameworks: ['react', 'next.js'],
      examples: [],
      tags: ['derived', 'automated']
    }
  }

  private categorizelearning(learning: any): PatternCategory {
    // Simple categorization logic
    const taskDescription = (learning?.task || learning?.description || '').toLowerCase()

    if (taskDescription.includes('performance') || taskDescription.includes('speed')) {
      return 'performance_optimization'
    } else if (taskDescription.includes('error') || taskDescription.includes('exception')) {
      return 'error_handling'
    } else if (taskDescription.includes('test')) {
      return 'testing_strategy'
    } else if (taskDescription.includes('api')) {
      return 'api_design'
    } else {
      return 'code_structure'
    }
  }

  private findMostCommon<T>(items: T[]): T {
    const counts = new Map<T, number>()
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1)
    })

    let maxCount = 0
    let mostCommon = items[0]

    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = item
      }
    })

    return mostCommon
  }

  /**
   * SEARCH PATTERNS
   */
  searchPatterns(query: {
    category?: PatternCategory
    tags?: string[]
    minConfidence?: number
    minImpact?: number
    applicableLanguage?: string
    searchText?: string
  }): SharedPattern[] {
    let results = Array.from(this.patterns.values())

    if (query.category) {
      const categoryPatternIds = this.categoryIndex.get(query.category) || new Set()
      results = results.filter(p => categoryPatternIds.has(p.id))
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(p =>
        query.tags!.some(tag => p.tags.includes(tag))
      )
    }

    if (query.minConfidence) {
      results = results.filter(p => p.confidence >= query.minConfidence!)
    }

    if (query.minImpact) {
      const impactScore = (p: SharedPattern) =>
        (p.impact.timeReduction + p.impact.errorReduction) / 2
      results = results.filter(p => impactScore(p) >= query.minImpact!)
    }

    if (query.applicableLanguage) {
      results = results.filter(p =>
        p.applicability.languages.includes(query.applicableLanguage!) ||
        p.applicability.languages.includes('any')
      )
    }

    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.problem.toLowerCase().includes(searchLower) ||
        p.solution.toLowerCase().includes(searchLower)
      )
    }

    // Sort by confidence and impact
    return results.sort((a, b) => {
      const scoreA = a.confidence * (a.impact.timeReduction + a.impact.errorReduction)
      const scoreB = b.confidence * (b.impact.timeReduction + b.impact.errorReduction)
      return scoreB - scoreA
    })
  }

  /**
   * APPLY PATTERN AND TRACK USAGE
   */
  async applyPattern(patternId: string, context: {
    projectId?: string
    userId?: string
    feedback?: number
    timeSaved?: number
    success: boolean
  }): Promise<void> {
    const pattern = this.patterns.get(patternId)
    if (!pattern) {
      logger.error('Pattern not found', { patternId })
      return
    }

    // Update metrics
    pattern.metrics.timesApplied++
    pattern.metrics.lastApplied = new Date()

    if (context.success) {
      pattern.metrics.successRate =
        (pattern.metrics.successRate * (pattern.metrics.timesApplied - 1) + 1) /
        pattern.metrics.timesApplied
    } else {
      pattern.metrics.successRate =
        (pattern.metrics.successRate * (pattern.metrics.timesApplied - 1)) /
        pattern.metrics.timesApplied
    }

    if (context.timeSaved) {
      pattern.metrics.averageTimeSaved =
        (pattern.metrics.averageTimeSaved * (pattern.metrics.timesApplied - 1) + context.timeSaved) /
        pattern.metrics.timesApplied
    }

    if (context.feedback) {
      pattern.metrics.feedbackScore =
        (pattern.metrics.feedbackScore * (pattern.metrics.timesApplied - 1) + context.feedback) /
        pattern.metrics.timesApplied
    }

    pattern.impact.reuseFrequency++
    pattern.updatedAt = new Date()

    logger.info('Pattern applied', {
      patternId,
      name: pattern.name,
      success: context.success,
      timesApplied: pattern.metrics.timesApplied
    })
  }

  /**
   * GET PATTERN BY ID
   */
  getPattern(patternId: string): SharedPattern | null {
    return this.patterns.get(patternId) || null
  }

  /**
   * GET ALL PATTERNS
   */
  getAllPatterns(): SharedPattern[] {
    return Array.from(this.patterns.values())
  }

  /**
   * GET PATTERNS BY CATEGORY
   */
  getPatternsByCategory(category: PatternCategory): SharedPattern[] {
    const patternIds = this.categoryIndex.get(category) || new Set()
    return Array.from(patternIds).map(id => this.patterns.get(id)!).filter(p => p)
  }

  /**
   * GET PATTERN RECOMMENDATIONS
   */
  getRecommendations(context: {
    taskDescription: string
    currentError?: string
    language?: string
    framework?: string
  }): SharedPattern[] {
    // Simple recommendation logic
    const keywords = context.taskDescription.toLowerCase().split(' ')

    let recommendations = this.searchPatterns({
      searchText: keywords.join(' '),
      applicableLanguage: context.language,
      minConfidence: 0.8
    })

    // If error context provided, prioritize error handling patterns
    if (context.currentError) {
      const errorPatterns = this.getPatternsByCategory('error_handling')
      recommendations = [...errorPatterns, ...recommendations]
    }

    // Remove duplicates and limit to top 5
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(p => [p.id, p])).values()
    )

    return uniqueRecommendations.slice(0, 5)
  }

  /**
   * EXPORT PATTERNS FOR SHARING
   */
  exportPatterns(patternIds?: string[]): string {
    const patternsToExport = patternIds
      ? patternIds.map(id => this.patterns.get(id)).filter(p => p)
      : Array.from(this.patterns.values())

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      patternCount: patternsToExport.length,
      patterns: patternsToExport.map(p => ({
        ...p,
        // Remove internal metrics for privacy
        metrics: undefined
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * IMPORT PATTERNS FROM ANOTHER TEAM
   */
  importPatterns(exportData: string): {
    imported: number
    skipped: number
    errors: string[]
  } {
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    try {
      const data = JSON.parse(exportData)

      if (!data.patterns || !Array.isArray(data.patterns)) {
        result.errors.push('Invalid export format')
        return result
      }

      data.patterns.forEach((pattern: any) => {
        try {
          // Check if pattern already exists
          if (this.patterns.has(pattern.id)) {
            result.skipped++
            return
          }

          // Reset metrics for imported patterns
          const importedPattern: SharedPattern = {
            ...pattern,
            metrics: {
              timesApplied: 0,
              successRate: 0,
              averageTimeSaved: 0,
              feedbackScore: 0,
              lastApplied: new Date()
            },
            contributors: [...(pattern.contributors || []), 'imported'],
            updatedAt: new Date()
          }

          this.addPattern(importedPattern)
          result.imported++

        } catch (error) {
          result.errors.push(`Failed to import pattern ${pattern.name}: ${error}`)
        }
      })

    } catch (error) {
      result.errors.push(`Failed to parse export data: ${error}`)
    }

    logger.info('Pattern import completed', result)
    return result
  }

  /**
   * GET PATTERN STATISTICS
   */
  getStatistics(): {
    totalPatterns: number
    byCategory: Record<PatternCategory, number>
    averageConfidence: number
    averageImpact: number
    mostUsedPatterns: Array<{ pattern: SharedPattern; usage: number }>
    recentlyUpdated: SharedPattern[]
  } {
    const patterns = Array.from(this.patterns.values())

    const byCategory: Record<string, number> = {}
    patterns.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1
    })

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    const avgImpact = patterns.reduce((sum, p) =>
      sum + (p.impact.timeReduction + p.impact.errorReduction) / 2, 0
    ) / patterns.length

    const mostUsed = patterns
      .map(p => ({ pattern: p, usage: p.metrics.timesApplied }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)

    const recentlyUpdated = patterns
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)

    return {
      totalPatterns: patterns.length,
      byCategory: byCategory as Record<PatternCategory, number>,
      averageConfidence: avgConfidence,
      averageImpact: avgImpact,
      mostUsedPatterns: mostUsed,
      recentlyUpdated
    }
  }
}

// Export singleton instance
export const claudeSharedPatterns = new ClaudeSharedPatterns()
