/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Sync queue management system for offline-first architecture"
 * @dependencies ["expo-sqlite", "expo-network"]
 * @status stable
 */

import * as SQLite from 'expo-sqlite'
import * as Network from 'expo-network'
import { supabaseService } from './supabaseService'
import type { Property, DamageAssessment, DamageItem, Photo, VoiceNote } from '../types'

export interface SyncQueueItem {
  id: string
  entity_type: 'property' | 'assessment' | 'damage_item' | 'photo' | 'voice_note'
  entity_id: string
  operation: 'create' | 'update' | 'delete'
  data: string // JSON string
  retry_count: number
  last_error: string | null
  created_at: string
}

export interface SyncProgress {
  total: number
  completed: number
  failed: number
  inProgress: boolean
}

export interface SyncMetrics {
  totalSynced: number
  totalPending: number
  totalFailed: number
  lastSyncTime?: string
  averageSyncTime: number
  networkLatency: number
}

class SyncService {
  private db: SQLite.SQLiteDatabase | null = null
  private syncInProgress = false
  private syncProgressCallback?: (progress: SyncProgress) => void

  async initialize(database: SQLite.SQLiteDatabase) {
    this.db = database
    console.log('SyncService initialized with database')
  }

  // Queue management methods
  async addToSyncQueue(
    entityType: SyncQueueItem['entity_type'],
    entityId: string,
    operation: SyncQueueItem['operation'],
    data: any
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const queueItem: Omit<SyncQueueItem, 'id'> = {
      entity_type: entityType,
      entity_id: entityId,
      operation,
      data: JSON.stringify(data),
      retry_count: 0,
      last_error: null,
      created_at: new Date().toISOString()
    }

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO sync_queue
         (entity_type, entity_id, operation, data, retry_count, last_error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          queueItem.entity_type,
          queueItem.entity_id,
          queueItem.operation,
          queueItem.data,
          queueItem.retry_count,
          queueItem.last_error,
          queueItem.created_at
        ]
      )

      console.log(`Added ${entityType}:${entityId} to sync queue`)
    } catch (error) {
      console.error('Failed to add item to sync queue:', error)
      throw error
    }
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) {
      return []
    }

    try {
      const result = await this.db.getAllAsync(
        `SELECT
           rowid as id,
           entity_type,
           entity_id,
           operation,
           data,
           retry_count,
           last_error,
           created_at
         FROM sync_queue
         ORDER BY created_at ASC`
      ) as SyncQueueItem[]

      return result || []
    } catch (error) {
      console.error('Failed to get pending sync items:', error)
      return []
    }
  }

  async removeSyncItem(itemId: string): Promise<void> {
    if (!this.db) {
      return
    }

    try {
      await this.db.runAsync(
        'DELETE FROM sync_queue WHERE rowid = ?',
        [itemId]
      )
    } catch (error) {
      console.error('Failed to remove sync item:', error)
    }
  }

  async updateSyncItemError(itemId: string, error: string): Promise<void> {
    if (!this.db) {
      return
    }

    try {
      await this.db.runAsync(
        `UPDATE sync_queue
         SET retry_count = retry_count + 1,
             last_error = ?
         WHERE rowid = ?`,
        [error, itemId]
      )
    } catch (dbError) {
      console.error('Failed to update sync item error:', dbError)
    }
  }

  // Network status checking
  async isNetworkAvailable(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync()
      return networkState.isConnected === true
    } catch (error) {
      console.warn('Failed to check network status:', error)
      return false
    }
  }

  // Main sync methods
  async performIncrementalSync(
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ success: boolean; errors: string[] }> {
    if (this.syncInProgress) {
      return { success: false, errors: ['Sync already in progress'] }
    }

    const isOnline = await this.isNetworkAvailable()
    if (!isOnline) {
      return { success: false, errors: ['No network connection available'] }
    }

    this.syncInProgress = true
    this.syncProgressCallback = onProgress

    try {
      const pendingItems = await this.getPendingSyncItems()
      const errors: string[] = []

      const progress: SyncProgress = {
        total: pendingItems.length,
        completed: 0,
        failed: 0,
        inProgress: true
      }

      this.reportProgress(progress)

      console.log(`Starting sync of ${pendingItems.length} items`)

      // Process items by type to maintain referential integrity
      const itemsByType = this.groupItemsByType(pendingItems)

      // Process in order: properties -> assessments -> damage_items -> photos -> voice_notes
      const processingOrder: SyncQueueItem['entity_type'][] = [
        'property', 'assessment', 'damage_item', 'photo', 'voice_note'
      ]

      for (const entityType of processingOrder) {
        const items = itemsByType[entityType] || []

        for (const item of items) {
          try {
            const success = await this.processSyncItem(item)

            if (success) {
              await this.removeSyncItem(item.id)
              progress.completed++
            } else {
              await this.updateSyncItemError(item.id, 'Sync failed')
              progress.failed++
              errors.push(`Failed to sync ${item.entity_type}:${item.entity_id}`)
            }

            this.reportProgress(progress)

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100))

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            await this.updateSyncItemError(item.id, errorMessage)
            progress.failed++
            errors.push(`Error syncing ${item.entity_type}:${item.entity_id}: ${errorMessage}`)
            this.reportProgress(progress)
          }
        }
      }

      progress.inProgress = false
      this.reportProgress(progress)

      console.log(`Sync completed. Success: ${progress.completed}, Failed: ${progress.failed}`)

      return {
        success: progress.failed === 0,
        errors
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      console.error('Sync failed:', errorMessage)

      if (this.syncProgressCallback) {
        this.syncProgressCallback({
          total: 0,
          completed: 0,
          failed: 1,
          inProgress: false
        })
      }

      return {
        success: false,
        errors: [errorMessage]
      }
    } finally {
      this.syncInProgress = false
      this.syncProgressCallback = undefined
    }
  }

  private groupItemsByType(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return items.reduce((groups, item) => {
      const type = item.entity_type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(item)
      return groups
    }, {} as Record<string, SyncQueueItem[]>)
  }

  private async processSyncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const data = JSON.parse(item.data)

      switch (item.entity_type) {
        case 'property':
          return await this.syncProperty(item.operation, data as Property)

        case 'assessment':
          return await this.syncAssessment(item.operation, data as DamageAssessment)

        case 'damage_item':
          return await this.syncDamageItem(item.operation, data as DamageItem)

        case 'photo':
          return await this.syncPhoto(item.operation, data as Photo)

        case 'voice_note':
          return await this.syncVoiceNote(item.operation, data as VoiceNote)

        default:
          console.warn(`Unknown entity type: ${item.entity_type}`)
          return false
      }
    } catch (error) {
      console.error(`Failed to process sync item:`, error)
      return false
    }
  }

  private async syncProperty(operation: string, property: Property): Promise<boolean> {
    try {
      if (operation === 'create' || operation === 'update') {
        const result = await supabaseService.syncProperties([property])
        return result.success
      } else if (operation === 'delete') {
        // Handle property deletion
        const client = supabaseService.getClient()
        const { error } = await client
          .from('properties')
          .delete()
          .eq('id', property.id)
        return !error
      }
      return false
    } catch (error) {
      console.error('Property sync failed:', error)
      return false
    }
  }

  private async syncAssessment(operation: string, assessment: DamageAssessment): Promise<boolean> {
    try {
      if (operation === 'create' || operation === 'update') {
        const result = await supabaseService.syncAssessments([assessment])
        return result.success
      } else if (operation === 'delete') {
        const client = supabaseService.getClient()
        const { error } = await client
          .from('damage_assessments')
          .delete()
          .eq('id', assessment.id)
        return !error
      }
      return false
    } catch (error) {
      console.error('Assessment sync failed:', error)
      return false
    }
  }

  private async syncDamageItem(operation: string, damageItem: DamageItem): Promise<boolean> {
    try {
      if (operation === 'create' || operation === 'update') {
        const result = await supabaseService.syncDamageItems([damageItem])
        return result.success
      } else if (operation === 'delete') {
        const client = supabaseService.getClient()
        const { error } = await client
          .from('damage_items')
          .delete()
          .eq('id', damageItem.id)
        return !error
      }
      return false
    } catch (error) {
      console.error('Damage item sync failed:', error)
      return false
    }
  }

  private async syncPhoto(operation: string, photo: Photo): Promise<boolean> {
    try {
      if (operation === 'create' || operation === 'update') {
        if (photo.local_uri && photo.upload_status === 'pending') {
          const result = await supabaseService.uploadPhoto(photo, photo.local_uri)
          return result.success
        }
        return true
      } else if (operation === 'delete') {
        const client = supabaseService.getClient()

        // Delete from storage if remote URL exists
        if (photo.remote_url) {
          const fileName = photo.remote_url.split('/').pop()
          if (fileName) {
            await client.storage
              .from('damage-photos')
              .remove([fileName])
          }
        }

        // Delete database record
        const { error } = await client
          .from('photos')
          .delete()
          .eq('id', photo.id)
        return !error
      }
      return false
    } catch (error) {
      console.error('Photo sync failed:', error)
      return false
    }
  }

  private async syncVoiceNote(operation: string, voiceNote: VoiceNote): Promise<boolean> {
    try {
      if (operation === 'create' || operation === 'update') {
        if (voiceNote.local_uri && voiceNote.upload_status === 'pending') {
          const result = await supabaseService.uploadVoiceNote(voiceNote, voiceNote.local_uri)
          return result.success
        }
        return true
      } else if (operation === 'delete') {
        const client = supabaseService.getClient()

        // Delete from storage if remote URL exists
        if (voiceNote.remote_url) {
          const fileName = voiceNote.remote_url.split('/').pop()
          if (fileName) {
            await client.storage
              .from('voice-notes')
              .remove([fileName])
          }
        }

        // Delete database record
        const { error } = await client
          .from('voice_notes')
          .delete()
          .eq('id', voiceNote.id)
        return !error
      }
      return false
    } catch (error) {
      console.error('Voice note sync failed:', error)
      return false
    }
  }

  private reportProgress(progress: SyncProgress) {
    if (this.syncProgressCallback) {
      this.syncProgressCallback(progress)
    }
  }

  // Sync metrics and monitoring
  async getSyncMetrics(): Promise<SyncMetrics> {
    if (!this.db) {
      return {
        totalSynced: 0,
        totalPending: 0,
        totalFailed: 0,
        averageSyncTime: 0,
        networkLatency: 0
      }
    }

    try {
      // Get pending items count
      const pendingResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue'
      ) as { count: number } | null

      // Get failed items count (retry_count > 3)
      const failedResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue WHERE retry_count > 3'
      ) as { count: number } | null

      // Get network latency from Supabase health check
      const healthCheck = await supabaseService.healthCheck()

      return {
        totalSynced: 0, // Would be tracked in a separate metrics table
        totalPending: pendingResult?.count || 0,
        totalFailed: failedResult?.count || 0,
        lastSyncTime: undefined, // Would be stored in user settings
        averageSyncTime: 0, // Would be calculated from sync history
        networkLatency: healthCheck.latency || 0
      }

    } catch (error) {
      console.error('Failed to get sync metrics:', error)
      return {
        totalSynced: 0,
        totalPending: 0,
        totalFailed: 0,
        averageSyncTime: 0,
        networkLatency: 0
      }
    }
  }

  // Cleanup methods
  async cleanupFailedItems(): Promise<void> {
    if (!this.db) {
      return
    }

    try {
      // Remove items that have failed more than 5 times and are older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      await this.db.runAsync(
        `DELETE FROM sync_queue
         WHERE retry_count > 5
         AND created_at < ?`,
        [sevenDaysAgo]
      )

      console.log('Cleaned up failed sync items')
    } catch (error) {
      console.error('Failed to cleanup failed items:', error)
    }
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) {
      return
    }

    try {
      await this.db.runAsync('DELETE FROM sync_queue')
      console.log('Sync queue cleared')
    } catch (error) {
      console.error('Failed to clear sync queue:', error)
    }
  }

  // Retry failed items
  async retryFailedItems(): Promise<{ success: boolean; errors: string[] }> {
    if (!this.db) {
      return { success: false, errors: ['Database not initialized'] }
    }

    try {
      // Reset retry count for items that failed less than 3 times
      await this.db.runAsync(
        `UPDATE sync_queue
         SET retry_count = 0,
             last_error = NULL
         WHERE retry_count < 3`
      )

      // Perform sync
      return await this.performIncrementalSync()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, errors: [errorMessage] }
    }
  }

  // Status check
  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  // Force stop sync (for emergency situations)
  stopSync(): void {
    this.syncInProgress = false
    this.syncProgressCallback = undefined
    console.log('Sync forcibly stopped')
  }


}

// Export singleton instance
export const syncService = new SyncService()
export default syncService

export const syncService = new SyncService()
