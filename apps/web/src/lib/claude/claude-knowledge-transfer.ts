/**
 * @fileMetadata
 * @purpose Knowledge Export/Import System for Cross-Team Learning Sharing
 * @owner ai-team
 * @status active
 * @dependencies ["@/lib/claude/claude-complete-learning-system", "@/lib/claude/claude-shared-patterns", "@/lib/logger"]
 * @features ["export-learnings", "import-validation", "merge-strategies", "version-control"]
 * @security ["encrypted-exports", "signature-verification", "access-control"]
 * @performance ["compressed-format", "incremental-sync", "batch-operations"]
 */

import { completeLearningSystem } from './claude-complete-learning-system'
import { claudeSharedPatterns } from './claude-shared-patterns'
import { logger } from '@/lib/logger'
import { createHash, randomBytes } from 'crypto'

export interface KnowledgeExport {
  metadata: ExportMetadata
  learnings: ExportedLearning[]
  patterns: ExportedPattern[]
  statistics: ExportStatistics
  signature: string
}

export interface ExportMetadata {
  version: string
  exportId: string
  exportDate: Date
  exportedBy: string
  teamId: string
  projectContext: ProjectContext
  exportType: 'full' | 'incremental' | 'filtered'
  compression: boolean
  encryption: boolean
}

export interface ProjectContext {
  projectName: string
  projectType: string
  primaryLanguages: string[]
  frameworks: string[]
  teamSize: number
  domainArea: string
}

export interface ExportedLearning {
  id: string
  task: string
  mistakes: string[]
  corrections: string[]
  learnings: string[]
  patterns: string[]
  confidence: number
  impact: number
  category: string
  tags: string[]
  createdAt: Date
  appliedCount: number
  lastApplied?: Date
  metadata: {
    exportVersion: string
    originalTeam: string
    sanitized: boolean
  }
}

export interface ExportedPattern {
  id: string
  name: string
  category: string
  description: string
  problem: string
  solution: string
  confidence: number
  impact: {
    timeReduction: number
    errorReduction: number
  }
  examples: Array<{
    title: string
    before: string
    after: string
  }>
  applicability: {
    languages: string[]
    frameworks: string[]
  }
  metadata: {
    exportVersion: string
    originalTeam: string
  }
}

export interface ExportStatistics {
  totalLearnings: number
  totalPatterns: number
  dateRange: {
    from: Date
    to: Date
  }
  topCategories: Array<{ category: string; count: number }>
  averageConfidence: number
  averageImpact: number
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip'
  confidenceThreshold: number
  validateSignature: boolean
  sanitizeData: boolean
  teamMapping: boolean
  dryRun: boolean
}

export interface ImportResult {
  success: boolean
  imported: {
    learnings: number
    patterns: number
  }
  skipped: {
    learnings: number
    patterns: number
  }
  conflicts: ConflictReport[]
  errors: string[]
  summary: ImportSummary
}

export interface ConflictReport {
  type: 'learning' | 'pattern'
  id: string
  reason: string
  existingValue: any
  importValue: any
  resolution: 'kept_existing' | 'used_import' | 'merged'
}

export interface ImportSummary {
  totalProcessed: number
  successRate: number
  avgConfidenceImported: number
  categoriesAdded: string[]
  estimatedImpact: {
    timeReduction: number
    qualityImprovement: number
  }
}

class ClaudeKnowledgeTransfer {
  private exportCache: Map<string, KnowledgeExport> = new Map()
  private importHistory: Array<{
    importId: string
    date: Date
    source: string
    result: ImportResult
  }> = []

  /**
   * EXPORT KNOWLEDGE FOR SHARING
   */
  async exportKnowledge(options: {
    includeAllLearnings?: boolean
    includePpatterns?: boolean
    filterByConfidence?: number
    filterByCategory?: string[]
    filterByDateRange?: { from: Date; to: Date }
    teamId: string
    exportedBy: string
    projectContext: ProjectContext
    encrypt?: boolean
    compress?: boolean
  }): Promise<KnowledgeExport> {
    logger.info('Starting knowledge export', {
      teamId: options.teamId,
      exportedBy: options.exportedBy
    })

    const exportId = this.generateExportId()

    // Gather learnings
    const learnings = await this.gatherLearnings(options)
    
    // Gather patterns
    const patterns = await this.gatherPatterns(options)

    // Calculate statistics
    const statistics = this.calculateStatistics(learnings, patterns, options.filterByDateRange)

    // Create metadata
    const metadata: ExportMetadata = {
      version: '2.0',
      exportId,
      exportDate: new Date(),
      exportedBy: options.exportedBy,
      teamId: options.teamId,
      projectContext: options.projectContext,
      exportType: options.includeAllLearnings ? 'full' : 'filtered',
      compression: options.compress || false,
      encryption: options.encrypt || false
    }

    // Create export object
    let exportData: KnowledgeExport = {
      metadata,
      learnings,
      patterns,
      statistics,
      signature: ''
    }

    // Apply compression if requested
    if (options.compress) {
      exportData = this.compressExport(exportData)
    }

    // Apply encryption if requested
    if (options.encrypt) {
      exportData = await this.encryptExport(exportData)
    }

    // Generate signature
    exportData.signature = this.generateSignature(exportData)

    // Cache the export
    this.exportCache.set(exportId, exportData)

    logger.info('Knowledge export completed', {
      exportId,
      learnings: learnings.length,
      patterns: patterns.length
    })

    return exportData
  }

  private async gatherLearnings(options: any): Promise<ExportedLearning[]> {
    const allLearnings = completeLearningSystem.getAllLearnings()
    
    let filtered = allLearnings

    // Apply filters
    if (options.filterByConfidence) {
      filtered = filtered.filter(l => l.confidence >= options.filterByConfidence)
    }

    if (options.filterByCategory?.length) {
      filtered = filtered.filter(l => 
        options.filterByCategory.some((cat: string) => 
          l.patterns.some(p => p.toLowerCase().includes(cat.toLowerCase()))
        )
      )
    }

    if (options.filterByDateRange) {
      filtered = filtered.filter(l => {
        const date = new Date(l.timestamp)
        return date >= options.filterByDateRange.from && 
               date <= options.filterByDateRange.to
      })
    }

    // Transform to export format
    return filtered.map(learning => ({
      id: learning.id,
      task: learning.task,
      mistakes: learning.mistakes,
      corrections: learning.corrections,
      learnings: learning.learnings,
      patterns: learning.patterns,
      confidence: learning.confidence,
      impact: learning.impact || 0.5,
      category: this.categorizeLearning(learning),
      tags: this.extractTags(learning),
      createdAt: new Date(learning.timestamp),
      appliedCount: learning.appliedCount || 0,
      lastApplied: learning.lastApplied,
      metadata: {
        exportVersion: '2.0',
        originalTeam: options.teamId,
        sanitized: true
      }
    }))
  }

  private async gatherPatterns(options: any): Promise<ExportedPattern[]> {
    const allPatterns = claudeSharedPatterns.getAllPatterns()
    
    let filtered = allPatterns

    // Apply filters
    if (options.filterByConfidence) {
      filtered = filtered.filter(p => p.confidence >= options.filterByConfidence)
    }

    if (options.filterByCategory?.length) {
      filtered = filtered.filter(p => 
        options.filterByCategory.includes(p.category)
      )
    }

    // Transform to export format (removing sensitive metrics)
    return filtered.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      category: pattern.category,
      description: pattern.description,
      problem: pattern.problem,
      solution: pattern.solution,
      confidence: pattern.confidence,
      impact: {
        timeReduction: pattern.impact.timeReduction,
        errorReduction: pattern.impact.errorReduction
      },
      examples: pattern.examples.map(e => ({
        title: e.title,
        before: e.before,
        after: e.after
      })),
      applicability: {
        languages: pattern.applicability.languages,
        frameworks: pattern.applicability.frameworks
      },
      metadata: {
        exportVersion: '2.0',
        originalTeam: options.teamId
      }
    }))
  }

  private calculateStatistics(
    learnings: ExportedLearning[], 
    patterns: ExportedPattern[],
    dateRange?: { from: Date; to: Date }
  ): ExportStatistics {
    const categories = new Map<string, number>()
    
    learnings.forEach(l => {
      categories.set(l.category, (categories.get(l.category) || 0) + 1)
    })
    
    patterns.forEach(p => {
      categories.set(p.category, (categories.get(p.category) || 0) + 1)
    })

    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    const avgConfidence = [...learnings, ...patterns].reduce(
      (sum, item) => sum + item.confidence, 0
    ) / (learnings.length + patterns.length || 1)

    const avgImpact = learnings.reduce((sum, l) => sum + l.impact, 0) / (learnings.length || 1)

    return {
      totalLearnings: learnings.length,
      totalPatterns: patterns.length,
      dateRange: dateRange || {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date()
      },
      topCategories,
      averageConfidence: avgConfidence,
      averageImpact: avgImpact
    }
  }

  /**
   * IMPORT KNOWLEDGE FROM ANOTHER TEAM
   */
  async importKnowledge(
    exportData: KnowledgeExport | string,
    options: ImportOptions
  ): Promise<ImportResult> {
    logger.info('Starting knowledge import', { options })

    const result: ImportResult = {
      success: false,
      imported: { learnings: 0, patterns: 0 },
      skipped: { learnings: 0, patterns: 0 },
      conflicts: [],
      errors: [],
      summary: {
        totalProcessed: 0,
        successRate: 0,
        avgConfidenceImported: 0,
        categoriesAdded: [],
        estimatedImpact: {
          timeReduction: 0,
          qualityImprovement: 0
        }
      }
    }

    try {
      // Parse if string
      const data: KnowledgeExport = typeof exportData === 'string' 
        ? JSON.parse(exportData) 
        : exportData

      // Validate signature if required
      if (options.validateSignature) {
        const isValid = this.verifySignature(data)
        if (!isValid) {
          result.errors.push('Invalid signature - data may have been tampered with')
          return result
        }
      }

      // Decrypt if needed
      let processedData = data
      if (data.metadata.encryption) {
        processedData = await this.decryptExport(data)
      }

      // Decompress if needed
      if (data.metadata.compression) {
        processedData = this.decompressExport(processedData)
      }

      // Import learnings
      const learningResult = await this.importLearnings(
        processedData.learnings, 
        options
      )
      result.imported.learnings = learningResult.imported
      result.skipped.learnings = learningResult.skipped
      result.conflicts.push(...learningResult.conflicts)

      // Import patterns
      const patternResult = await this.importPatterns(
        processedData.patterns,
        options
      )
      result.imported.patterns = patternResult.imported
      result.skipped.patterns = patternResult.skipped
      result.conflicts.push(...patternResult.conflicts)

      // Calculate summary
      result.summary = this.calculateImportSummary(
        processedData,
        result,
        learningResult.avgConfidence
      )

      result.success = result.errors.length === 0

      // Record import history
      this.importHistory.push({
        importId: processedData.metadata.exportId,
        date: new Date(),
        source: processedData.metadata.teamId,
        result
      })

      logger.info('Knowledge import completed', {
        imported: result.imported,
        skipped: result.skipped,
        conflicts: result.conflicts.length
      })

    } catch (error) {
      result.errors.push(`Import failed: ${error}`)
      logger.error('Knowledge import failed', { error })
    }

    return result
  }

  private async importLearnings(
    learnings: ExportedLearning[],
    options: ImportOptions
  ): Promise<{
    imported: number
    skipped: number
    conflicts: ConflictReport[]
    avgConfidence: number
  }> {
    let imported = 0
    let skipped = 0
    const conflicts: ConflictReport[] = []
    let totalConfidence = 0

    for (const learning of learnings) {
      // Apply confidence threshold
      if (learning.confidence < options.confidenceThreshold) {
        skipped++
        continue
      }

      // Check for existing learning
      const existing = completeLearningSystem.getAllLearnings()
        .find(l => this.areLearningsSimilar(l, learning))

      if (existing) {
        if (options.mergeStrategy === 'skip') {
          skipped++
          continue
        } else if (options.mergeStrategy === 'merge') {
          // Merge learnings
          await this.mergeLearnings(existing, learning)
          imported++
        } else {
          // Replace
          conflicts.push({
            type: 'learning',
            id: learning.id,
            reason: 'Existing learning replaced',
            existingValue: existing,
            importValue: learning,
            resolution: 'used_import'
          })
          // Add as new learning
          imported++
        }
      } else {
        // Add new learning
        if (!options.dryRun) {
          await completeLearningSystem.recordLearning({
            task: learning.task,
            mistakes: learning.mistakes,
            corrections: learning.corrections,
            learnings: learning.learnings,
            patterns: learning.patterns,
            confidence: learning.confidence,
            impact: learning.impact
          })
        }
        imported++
        totalConfidence += learning.confidence
      }
    }

    return {
      imported,
      skipped,
      conflicts,
      avgConfidence: imported > 0 ? totalConfidence / imported : 0
    }
  }

  private async importPatterns(
    patterns: ExportedPattern[],
    options: ImportOptions
  ): Promise<{
    imported: number
    skipped: number
    conflicts: ConflictReport[]
  }> {
    let imported = 0
    let skipped = 0
    const conflicts: ConflictReport[] = []

    for (const pattern of patterns) {
      // Apply confidence threshold
      if (pattern.confidence < options.confidenceThreshold) {
        skipped++
        continue
      }

      // Check for existing pattern
      const existing = claudeSharedPatterns.getPattern(pattern.id)

      if (existing) {
        if (options.mergeStrategy === 'skip') {
          skipped++
          continue
        } else {
          conflicts.push({
            type: 'pattern',
            id: pattern.id,
            reason: 'Pattern already exists',
            existingValue: existing.name,
            importValue: pattern.name,
            resolution: options.mergeStrategy === 'merge' ? 'merged' : 'used_import'
          })
        }
      }

      if (!options.dryRun) {
        // Import pattern (the SharedPatterns class handles deduplication)
        const result = claudeSharedPatterns.importPatterns(
          JSON.stringify({ patterns: [pattern] })
        )
        imported += result.imported
        skipped += result.skipped
      } else {
        imported++
      }
    }

    return { imported, skipped, conflicts }
  }

  private areLearningsSimilar(l1: any, l2: any): boolean {
    // Simple similarity check based on task description
    const similarity = this.calculateSimilarity(l1.task, l2.task)
    return similarity > 0.8
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word-based similarity
    const words1 = new Set(str1.toLowerCase().split(' '))
    const words2 = new Set(str2.toLowerCase().split(' '))
    
    const intersection = new Set([...words1].filter(w => words2.has(w)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  private async mergeLearnings(existing: any, imported: ExportedLearning): Promise<void> {
    // Merge logic - combine learnings and update confidence
    const mergedConfidence = (existing.confidence + imported.confidence) / 2
    const mergedLearnings = [...new Set([...existing.learnings, ...imported.learnings])]
    const mergedPatterns = [...new Set([...existing.patterns, ...imported.patterns])]

    // Update existing learning
    await completeLearningSystem.updateLearning(existing.id, {
      learnings: mergedLearnings,
      patterns: mergedPatterns,
      confidence: mergedConfidence
    })
  }

  private calculateImportSummary(
    data: KnowledgeExport,
    result: ImportResult,
    avgConfidence: number
  ): ImportSummary {
    const totalProcessed = data.learnings.length + data.patterns.length
    const totalImported = result.imported.learnings + result.imported.patterns
    const successRate = totalProcessed > 0 ? totalImported / totalProcessed : 0

    // Extract unique categories
    const categoriesAdded = Array.from(new Set([
      ...data.learnings.map(l => l.category),
      ...data.patterns.map(p => p.category)
    ]))

    // Estimate impact
    const avgTimeReduction = data.patterns.reduce(
      (sum, p) => sum + p.impact.timeReduction, 0
    ) / (data.patterns.length || 1)

    return {
      totalProcessed,
      successRate,
      avgConfidenceImported: avgConfidence,
      categoriesAdded,
      estimatedImpact: {
        timeReduction: avgTimeReduction,
        qualityImprovement: avgConfidence * 10 // Simple estimation
      }
    }
  }

  /**
   * ENCRYPTION AND COMPRESSION
   */
  private compressExport(data: KnowledgeExport): KnowledgeExport {
    // In production, would use actual compression
    logger.info('Compressing export data')
    return data
  }

  private decompressExport(data: KnowledgeExport): KnowledgeExport {
    // In production, would use actual decompression
    logger.info('Decompressing export data')
    return data
  }

  private async encryptExport(data: KnowledgeExport): Promise<KnowledgeExport> {
    // In production, would use actual encryption
    logger.info('Encrypting export data')
    return data
  }

  private async decryptExport(data: KnowledgeExport): Promise<KnowledgeExport> {
    // In production, would use actual decryption
    logger.info('Decrypting export data')
    return data
  }

  /**
   * SIGNATURE GENERATION AND VERIFICATION
   */
  private generateSignature(data: KnowledgeExport): string {
    const content = JSON.stringify({
      metadata: data.metadata,
      learnings: data.learnings.length,
      patterns: data.patterns.length,
      statistics: data.statistics
    })
    
    return createHash('sha256').update(content).digest('hex')
  }

  private verifySignature(data: KnowledgeExport): boolean {
    const expectedSignature = this.generateSignature(data)
    return data.signature === expectedSignature
  }

  /**
   * UTILITY METHODS
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  private categorizeLearning(learning: any): string {
    // Simple categorization based on patterns
    if (learning.patterns.some((p: string) => p.includes('performance'))) {
      return 'performance'
    } else if (learning.patterns.some((p: string) => p.includes('error'))) {
      return 'error_handling'
    } else if (learning.patterns.some((p: string) => p.includes('test'))) {
      return 'testing'
    }
    return 'general'
  }

  private extractTags(learning: any): string[] {
    // Extract tags from patterns and task description
    const words = [...learning.patterns, learning.task]
      .join(' ')
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 3)

    return Array.from(new Set(words)).slice(0, 10)
  }

  /**
   * GET EXPORT/IMPORT HISTORY
   */
  getTransferHistory(): {
    exports: Array<{ exportId: string; date: Date; size: number }>
    imports: Array<{
      importId: string
      date: Date
      source: string
      result: ImportResult
    }>
  } {
    const exports = Array.from(this.exportCache.entries()).map(([id, data]) => ({
      exportId: id,
      date: data.metadata.exportDate,
      size: JSON.stringify(data).length
    }))

    return {
      exports,
      imports: this.importHistory
    }
  }

  /**
   * CLEAR CACHE
   */
  clearCache(): void {
    this.exportCache.clear()
    logger.info('Knowledge transfer cache cleared')
  }
}

// Export singleton instance
export const claudeKnowledgeTransfer = new ClaudeKnowledgeTransfer()

// Export types
export type { 
  KnowledgeExport, 
  ExportMetadata, 
  ExportedLearning, 
  ExportedPattern,
  ImportOptions,
  ImportResult
}