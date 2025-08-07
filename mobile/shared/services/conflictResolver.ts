/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Conflict resolution system for handling offline changes and data synchronization"
 * @dependencies ["expo-sqlite"]
 * @status stable
 */

import * as SQLite from 'expo-sqlite'
import type { Property, DamageAssessment, DamageItem, Photo, VoiceNote } from '../types'

export interface ConflictData<T = any> {
  conflictId: string
  entityType: 'property' | 'assessment' | 'damage_item' | 'photo' | 'voice_note'
  entityId: string
  localVersion: T
  remoteVersion: T
  conflictFields: string[]
  conflictType: 'timestamp' | 'content' | 'deleted'
  created_at: string
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merged'
  resolved_at?: string
}

export interface ConflictResolution<T = any> {
  action: 'keep_local' | 'keep_remote' | 'merge' | 'manual_review'
  mergedData?: T
  confidence: number // 0-1 scale
  reason: string
}

export interface MergeStrategy {
  preferLocal: string[]
  preferRemote: string[]
  requireManualReview: string[]
  autoMergeRules: Record<string, (local: any, remote: any) => any>
}

class ConflictResolver {
  private db: SQLite.SQLiteDatabase | null = null

  async initialize(database: SQLite.SQLiteDatabase) {
    this.db = database
    await this.createConflictsTable()
    console.log('ConflictResolver initialized with database')
  }

  private async createConflictsTable(): Promise<void> {
    if (!this.db) return

    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_conflicts (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          local_version TEXT NOT NULL,
          remote_version TEXT NOT NULL,
          conflict_fields TEXT NOT NULL,
          conflict_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          resolved INTEGER DEFAULT 0,
          resolution TEXT,
          resolved_at TEXT,
          resolved_data TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_conflicts_entity ON sync_conflicts(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON sync_conflicts(resolved);
      `)
    } catch (error) {
      console.error('Failed to create conflicts table:', error)
    }
  }

  // Main conflict detection and resolution
  async detectAndResolveConflicts<T>(
    entityType: ConflictData['entityType'],
    entityId: string,
    localVersion: T,
    remoteVersion: T
  ): Promise<ConflictResolution<T>> {
    try {
      // Detect conflicts
      const conflicts = this.detectConflicts(localVersion, remoteVersion)

      if (conflicts.length === 0) {
        return {
          action: 'keep_remote',
          confidence: 1.0,
          reason: 'No conflicts detected, using remote version'
        }
      }

      // Store conflict for potential manual resolution
      const conflict: ConflictData<T> = {
        conflictId: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityType,
        entityId,
        localVersion,
        remoteVersion,
        conflictFields: conflicts,
        conflictType: this.determineConflictType(localVersion, remoteVersion, conflicts),
        created_at: new Date().toISOString(),
        resolved: false
      }

      await this.storeConflict(conflict)

      // Attempt automatic resolution
      const resolution = await this.attemptAutoResolution(conflict)

      if (resolution.action !== 'manual_review') {
        await this.markConflictResolved(conflict.conflictId, resolution)
      }

      return resolution

    } catch (error) {
      console.error('Conflict resolution failed:', error)
      return {
        action: 'keep_local',
        confidence: 0.3,
        reason: 'Error during conflict resolution, keeping local version'
      }
    }
  }

  private detectConflicts(local: any, remote: any): string[] {
    const conflicts: string[] = []
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])

    for (const key of allKeys) {
      if (key === 'updated_at' || key === 'synced') continue // Skip sync metadata

      const localValue = local[key]
      const remoteValue = remote[key]

      if (this.valuesConflict(localValue, remoteValue)) {
        conflicts.push(key)
      }
    }

    return conflicts
  }

  private valuesConflict(localValue: any, remoteValue: any): boolean {
    // Handle null/undefined comparisons
    if (localValue == null && remoteValue == null) return false
    if (localValue == null || remoteValue == null) return true

    // Deep comparison for objects/arrays
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return JSON.stringify(localValue) !== JSON.stringify(remoteValue)
    }

    // Direct comparison for primitives
    return localValue !== remoteValue
  }

  private determineConflictType(local: any, remote: any, conflictFields: string[]): ConflictData['conflictType'] {
    // Check if one version is marked as deleted
    if (local.deleted || remote.deleted) {
      return 'deleted'
    }

    // Check if it's primarily a timestamp conflict
    const timestampFields = ['updated_at', 'created_at', 'assessment_date']
    const hasTimestampConflict = conflictFields.some(field => timestampFields.includes(field))
    const hasContentConflict = conflictFields.some(field => !timestampFields.includes(field))

    if (hasTimestampConflict && !hasContentConflict) {
      return 'timestamp'
    }

    return 'content'
  }

  private async attemptAutoResolution<T>(conflict: ConflictData<T>): Promise<ConflictResolution<T>> {
    const strategy = this.getStrategyForEntityType(conflict.entityType)
    const local = conflict.localVersion
    const remote = conflict.remoteVersion

    // Try automatic merge based on strategy
    if (conflict.conflictType === 'timestamp') {
      return this.resolveTimestampConflict(local, remote)
    }

    if (conflict.conflictType === 'deleted') {
      return this.resolveDeletedConflict(local, remote)
    }

    // Content conflicts - try smart merge
    const mergeResult = this.attemptSmartMerge(local, remote, conflict.conflictFields, strategy)

    if (mergeResult.success) {
      return {
        action: 'merge',
        mergedData: mergeResult.data,
        confidence: mergeResult.confidence,
        reason: mergeResult.reason
      }
    }

    // Check if conflicts are in fields that can be auto-resolved
    const canAutoResolve = conflict.conflictFields.every(field =>
      strategy.preferLocal.includes(field) ||
      strategy.preferRemote.includes(field) ||
      strategy.autoMergeRules[field]
    )

    if (canAutoResolve) {
      return this.applyStrategyRules(local, remote, conflict.conflictFields, strategy)
    }

    // Require manual review
    return {
      action: 'manual_review',
      confidence: 0.0,
      reason: `Conflicts in fields requiring manual review: ${conflict.conflictFields.join(', ')}`
    }
  }

  private resolveTimestampConflict<T>(local: T, remote: T): ConflictResolution<T> {
    const localTime = new Date((local as any).updated_at || 0).getTime()
    const remoteTime = new Date((remote as any).updated_at || 0).getTime()

    if (localTime > remoteTime) {
      return {
        action: 'keep_local',
        confidence: 0.9,
        reason: 'Local version is newer'
      }
    } else {
      return {
        action: 'keep_remote',
        confidence: 0.9,
        reason: 'Remote version is newer'
      }
    }
  }

  private resolveDeletedConflict<T>(local: T, remote: T): ConflictResolution<T> {
    const localDeleted = (local as any).deleted
    const remoteDeleted = (remote as any).deleted

    if (localDeleted && !remoteDeleted) {
      return {
        action: 'keep_local',
        confidence: 0.8,
        reason: 'Local version was deleted, maintaining deletion'
      }
    } else if (!localDeleted && remoteDeleted) {
      return {
        action: 'keep_remote',
        confidence: 0.8,
        reason: 'Remote version was deleted, maintaining deletion'
      }
    } else {
      // Both deleted or both not deleted - use timestamp
      return this.resolveTimestampConflict(local, remote)
    }
  }

  private attemptSmartMerge<T>(
    local: T,
    remote: T,
    conflictFields: string[],
    strategy: MergeStrategy
  ): { success: boolean; data?: T; confidence: number; reason: string } {
    try {
      const merged = { ...remote } // Start with remote as base

      let mergedFields = 0
      let totalFields = conflictFields.length

      for (const field of conflictFields) {
        const localValue = (local as any)[field]
        const remoteValue = (remote as any)[field]

        if (strategy.autoMergeRules[field]) {
          // Apply custom merge rule
          (merged as any)[field] = strategy.autoMergeRules[field](localValue, remoteValue)
          mergedFields++
        } else if (field === 'notes' || field === 'description') {
          // Smart text merge for notes/descriptions
          (merged as any)[field] = this.mergeTextFields(localValue, remoteValue)
          mergedFields++
        } else if (typeof localValue === 'number' && typeof remoteValue === 'number') {
          // For numeric fields, prefer the higher value (often more complete data)
          (merged as any)[field] = Math.max(localValue, remoteValue)
          mergedFields++
        } else if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
          // Merge arrays by combining unique elements
          (merged as any)[field] = this.mergeArrays(localValue, remoteValue)
          mergedFields++
        }
      }

      const confidence = totalFields > 0 ? (mergedFields / totalFields) : 0

      if (confidence >= 0.7) {
        return {
          success: true,
          data: merged,
          confidence,
          reason: `Successfully merged ${mergedFields}/${totalFields} conflicting fields`
        }
      } else {
        return {
          success: false,
          confidence,
          reason: `Could only merge ${mergedFields}/${totalFields} fields automatically`
        }
      }

    } catch (error) {
      return {
        success: false,
        confidence: 0,
        reason: 'Smart merge failed due to error'
      }
    }
  }

  private mergeTextFields(local: string, remote: string): string {
    if (!local) return remote || ''
    if (!remote) return local || ''

    // If one contains the other, use the longer one
    if (local.includes(remote)) return local
    if (remote.includes(local)) return remote

    // Otherwise combine both with separator
    return `${local}\n\n[Remote]: ${remote}`
  }

  private mergeArrays(localArray: any[], remoteArray: any[]): any[] {
    const merged = [...localArray]

    for (const item of remoteArray) {
      if (!merged.some(existing => JSON.stringify(existing) === JSON.stringify(item))) {
        merged.push(item)
      }
    }

    return merged
  }

  private applyStrategyRules<T>(
    local: T,
    remote: T,
    conflictFields: string[],
    strategy: MergeStrategy
  ): ConflictResolution<T> {
    const result = { ...remote } // Start with remote
    let appliedRules = 0

    for (const field of conflictFields) {
      if (strategy.preferLocal.includes(field)) {
        (result as any)[field] = (local as any)[field]
        appliedRules++
      } else if (strategy.autoMergeRules[field]) {
        (result as any)[field] = strategy.autoMergeRules[field](
          (local as any)[field],
          (remote as any)[field]
        )
        appliedRules++
      }
      // Fields in preferRemote are already used (result starts with remote)
      if (strategy.preferRemote.includes(field)) {
        appliedRules++
      }
    }

    return {
      action: 'merge',
      mergedData: result,
      confidence: appliedRules / conflictFields.length,
      reason: `Applied strategy rules for ${appliedRules}/${conflictFields.length} fields`
    }
  }

  private getStrategyForEntityType(entityType: ConflictData['entityType']): MergeStrategy {
    switch (entityType) {
      case 'property':
        return {
          preferLocal: ['name', 'notes'], // User-entered data
          preferRemote: ['latitude', 'longitude'], // System-generated data
          requireManualReview: ['street1', 'city', 'state'], // Critical address fields
          autoMergeRules: {
            estimated_value: (local: number, remote: number) => Math.max(local || 0, remote || 0)
          }
        }

      case 'assessment':
        return {
          preferLocal: ['notes', 'weather_conditions'], // Field observations
          preferRemote: ['estimated_total_damage'], // Calculated values
          requireManualReview: ['overall_condition', 'priority_level'], // Critical assessments
          autoMergeRules: {}
        }

      case 'damage_item':
        return {
          preferLocal: ['description', 'notes'], // Detailed observations
          preferRemote: ['estimated_cost'], // Calculated costs
          requireManualReview: ['severity', 'repair_priority'], // Critical classifications
          autoMergeRules: {
            measurements: (local: any, remote: any) => ({ ...remote, ...local }) // Merge measurement objects
          }
        }

      case 'photo':
        return {
          preferLocal: ['filename', 'local_uri'], // Local file info
          preferRemote: ['remote_url', 'upload_status'], // Server-managed fields
          requireManualReview: [], // Photos rarely have complex conflicts
          autoMergeRules: {}
        }

      case 'voice_note':
        return {
          preferLocal: ['filename', 'local_uri', 'duration_seconds'], // Local recording info
          preferRemote: ['remote_url', 'upload_status', 'transcription'], // Server-processed fields
          requireManualReview: [],
          autoMergeRules: {}
        }

      default:
        return {
          preferLocal: [],
          preferRemote: [],
          requireManualReview: ['*'], // Unknown entities require manual review
          autoMergeRules: {}
        }
    }
  }

  // Database operations for conflicts
  private async storeConflict<T>(conflict: ConflictData<T>): Promise<void> {
    if (!this.db) return

    try {
      await this.db.runAsync(
        `INSERT INTO sync_conflicts
         (id, entity_type, entity_id, local_version, remote_version, conflict_fields, conflict_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conflict.conflictId,
          conflict.entityType,
          conflict.entityId,
          JSON.stringify(conflict.localVersion),
          JSON.stringify(conflict.remoteVersion),
          JSON.stringify(conflict.conflictFields),
          conflict.conflictType,
          conflict.created_at
        ]
      )
    } catch (error) {
      console.error('Failed to store conflict:', error)
    }
  }

  private async markConflictResolved<T>(
    conflictId: string,
    resolution: ConflictResolution<T>
  ): Promise<void> {
    if (!this.db) return

    try {
      await this.db.runAsync(
        `UPDATE sync_conflicts
         SET resolved = 1, resolution = ?, resolved_at = ?, resolved_data = ?
         WHERE id = ?`,
        [
          resolution.action,
          new Date().toISOString(),
          resolution.mergedData ? JSON.stringify(resolution.mergedData) : null,
          conflictId
        ]
      )
    } catch (error) {
      console.error('Failed to mark conflict resolved:', error)
    }
  }

  // Public methods for conflict management
  async getPendingConflicts(): Promise<ConflictData[]> {
    if (!this.db) return []

    try {
      const result = await this.db.getAllAsync(
        `SELECT id as conflictId, entity_type, entity_id, local_version, remote_version,
                conflict_fields, conflict_type, created_at
         FROM sync_conflicts
         WHERE resolved = 0
         ORDER BY created_at DESC`
      ) as any[]

      return result.map(row => ({
        ...row,
        localVersion: JSON.parse(row.local_version),
        remoteVersion: JSON.parse(row.remote_version),
        conflictFields: JSON.parse(row.conflict_fields),
        resolved: false
      }))
    } catch (error) {
      console.error('Failed to get pending conflicts:', error)
      return []
    }
  }

  async resolveConflictManually<T>(
    conflictId: string,
    resolution: 'local' | 'remote' | 'custom',
    customData?: T
  ): Promise<boolean> {
    if (!this.db) return false

    try {
      const resolvedData = resolution === 'custom' ? customData : null

      await this.db.runAsync(
        `UPDATE sync_conflicts
         SET resolved = 1, resolution = ?, resolved_at = ?, resolved_data = ?
         WHERE id = ?`,
        [
          resolution,
          new Date().toISOString(),
          resolvedData ? JSON.stringify(resolvedData) : null,
          conflictId
        ]
      )

      return true
    } catch (error) {
      console.error('Failed to resolve conflict manually:', error)
      return false
    }
  }

  async getConflictStats(): Promise<{
    total: number
    pending: number
    autoResolved: number
    manuallyResolved: number
  }> {
    if (!this.db) {
      return { total: 0, pending: 0, autoResolved: 0, manuallyResolved: 0 }
    }

    try {
      const totalResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_conflicts'
      ) as { count: number } | null

      const pendingResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_conflicts WHERE resolved = 0'
      ) as { count: number } | null

      const autoResolvedResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM sync_conflicts
         WHERE resolved = 1 AND resolution IN ('merge', 'keep_local', 'keep_remote')`
      ) as { count: number } | null

      const manualResolvedResult = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM sync_conflicts
         WHERE resolved = 1 AND resolution IN ('local', 'remote', 'custom')`
      ) as { count: number } | null

      return {
        total: totalResult?.count || 0,
        pending: pendingResult?.count || 0,
        autoResolved: autoResolvedResult?.count || 0,
        manuallyResolved: manualResolvedResult?.count || 0
      }
    } catch (error) {
      console.error('Failed to get conflict stats:', error)
      return { total: 0, pending: 0, autoResolved: 0, manuallyResolved: 0 }
    }
  }

  async cleanupOldConflicts(olderThanDays: number = 30): Promise<void> {
    if (!this.db) return

    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()

      await this.db.runAsync(
        'DELETE FROM sync_conflicts WHERE resolved = 1 AND resolved_at < ?',
        [cutoffDate]
      )

      console.log(`Cleaned up resolved conflicts older than ${olderThanDays} days`)
    } catch (error) {
      console.error('Failed to cleanup old conflicts:', error)
    }
  }
}

export const conflictResolver = new ConflictResolver()
export default conflictResolver
