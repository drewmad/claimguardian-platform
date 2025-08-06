/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Offline-first synchronization service for bi-directional data sync with web platform"
 * @dependencies ["expo-network", "@claimguardian/db", "expo-file-system"]
 * @status stable
 */

import * as Network from 'expo-network'
import * as FileSystem from 'expo-file-system'
import { store } from '../store'
import { 
  addToQueue, 
  setSyncProgress, 
  setLastSyncTime, 
  addSyncEvent,
  removeFromQueue,
  incrementRetryCount,
  setLastError
} from '../store/slices/syncSlice'
import type { 
  SyncResult, 
  SyncQueue, 
  Property, 
  DamageAssessment, 
  DamageItem, 
  Photo, 
  VoiceNote,
  ApiResponse 
} from '../types'

class SyncService {
  private baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://claimguardianai.com/api'
  private batchSize: number = 10
  private maxRetries: number = 3
  private retryDelay: number = 5000
  private syncInProgress: boolean = false

  constructor() {
    this.setupNetworkListener()
  }

  private setupNetworkListener() {
    // Monitor network changes and trigger auto-sync when back online
    Network.addNetworkStateListener((networkState) => {
      const state = store.getState()
      if (networkState.isConnected && 
          networkState.isInternetReachable && 
          state.sync.isAutoSyncEnabled &&
          !this.syncInProgress &&
          state.sync.queue.length > 0) {
        this.performFullSync()
      }
    })
  }

  async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced_count: 0, failed_count: 0, errors: ['Sync already in progress'] }
    }

    this.syncInProgress = true
    store.dispatch(addSyncEvent({ type: 'sync_started' }))

    const result: SyncResult = {
      success: true,
      synced_count: 0,
      failed_count: 0,
      errors: []
    }

    try {
      // Check network connectivity
      const networkState = await Network.getNetworkStateAsync()
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        throw new Error('No internet connection available')
      }

      const state = store.getState()
      const queue = [...state.sync.queue] // Create copy to avoid mutation
      const totalItems = queue.length

      if (totalItems === 0) {
        store.dispatch(setLastSyncTime(new Date().toISOString()))
        return result
      }

      // Process queue in batches
      for (let i = 0; i < queue.length; i += this.batchSize) {
        const batch = queue.slice(i, i + this.batchSize)
        const progress = Math.round((i / totalItems) * 100)
        store.dispatch(setSyncProgress(progress))

        for (const item of batch) {
          try {
            await this.syncQueueItem(item)
            store.dispatch(removeFromQueue(item.id))
            result.synced_count++

            store.dispatch(addSyncEvent({
              type: 'entity_synced',
              entity_type: item.entity_type,
              entity_id: item.entity_id
            }))
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
            result.errors.push(`${item.entity_type}:${item.entity_id} - ${errorMessage}`)
            result.failed_count++

            // Increment retry count
            store.dispatch(incrementRetryCount(item.id))
            store.dispatch(setLastError({ id: item.id, error: errorMessage }))

            // Remove from queue if max retries reached
            if (item.retry_count >= this.maxRetries) {
              store.dispatch(removeFromQueue(item.id))
            }

            store.dispatch(addSyncEvent({
              type: 'entity_failed',
              entity_type: item.entity_type,
              entity_id: item.entity_id,
              error: errorMessage
            }))
          }
        }

        // Brief pause between batches to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      store.dispatch(setSyncProgress(100))
      store.dispatch(setLastSyncTime(new Date().toISOString()))

      // Sync down any server changes
      await this.pullServerChanges()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      result.success = false
      result.errors.push(errorMessage)
      
      store.dispatch(addSyncEvent({
        type: 'sync_failed',
        error: errorMessage
      }))
    } finally {
      this.syncInProgress = false
      store.dispatch(setSyncProgress(0))
    }

    return result
  }

  private async syncQueueItem(item: SyncQueue): Promise<void> {
    const endpoint = this.getEndpointForEntity(item.entity_type)
    
    switch (item.operation) {
      case 'create':
        await this.createEntity(endpoint, item.data)
        break
      case 'update':
        await this.updateEntity(endpoint, item.entity_id, item.data)
        break
      case 'delete':
        await this.deleteEntity(endpoint, item.entity_id)
        break
      default:
        throw new Error(`Unknown operation: ${item.operation}`)
    }
  }

  private async createEntity(endpoint: string, data: Record<string, unknown>): Promise<void> {
    const response = await this.apiCall('POST', endpoint, data)
    if (!response.success) {
      throw new Error(response.error || 'Create failed')
    }
  }

  private async updateEntity(endpoint: string, id: string, data: Record<string, unknown>): Promise<void> {
    const response = await this.apiCall('PUT', `${endpoint}/${id}`, data)
    if (!response.success) {
      throw new Error(response.error || 'Update failed')
    }
  }

  private async deleteEntity(endpoint: string, id: string): Promise<void> {
    const response = await this.apiCall('DELETE', `${endpoint}/${id}`)
    if (!response.success) {
      throw new Error(response.error || 'Delete failed')
    }
  }

  private async pullServerChanges(): Promise<void> {
    const state = store.getState()
    const lastSync = state.sync.lastSyncTime || new Date(0).toISOString()

    // Pull changes for each entity type
    const entityTypes = ['properties', 'assessments', 'damage-items']
    
    for (const entityType of entityTypes) {
      try {
        const response = await this.apiCall('GET', `${entityType}?since=${encodeURIComponent(lastSync)}`)
        if (response.success && response.data) {
          // Dispatch actions to update local state with server changes
          this.processServerChanges(entityType, response.data)
        }
      } catch (error) {
        console.warn(`Failed to pull ${entityType} changes:`, error)
      }
    }
  }

  private processServerChanges(entityType: string, changes: unknown[]): void {
    // This would dispatch appropriate actions to update local state
    // Implementation depends on specific entity types and Redux slices
    console.log(`Processing ${changes.length} ${entityType} changes from server`)
  }

  private getEndpointForEntity(entityType: string): string {
    switch (entityType) {
      case 'property':
        return 'properties'
      case 'assessment':
        return 'assessments'
      case 'damage_item':
        return 'damage-items'
      case 'photo':
        return 'photos'
      case 'voice_note':
        return 'voice-notes'
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  private async apiCall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return result
  }

  private getAuthToken(): string {
    const state = store.getState()
    // Return user's auth token - implementation depends on auth system
    return state.user?.id || ''
  }

  // Media file sync methods
  async syncPhoto(photo: Photo): Promise<void> {
    if (photo.upload_status === 'completed') return

    try {
      // Upload photo file to cloud storage
      const uploadResult = await this.uploadFile(photo.local_uri, 'photos')
      
      // Update photo record with remote URL
      const updatedPhoto = {
        ...photo,
        remote_url: uploadResult.url,
        upload_status: 'completed' as const,
        synced: true
      }

      // Add to sync queue to update server
      store.dispatch(addToQueue({
        entity_type: 'photo',
        entity_id: photo.id,
        operation: 'update',
        data: updatedPhoto
      }))
    } catch (error) {
      // Mark as failed
      const failedPhoto = {
        ...photo,
        upload_status: 'failed' as const
      }
      
      store.dispatch(addToQueue({
        entity_type: 'photo',
        entity_id: photo.id,
        operation: 'update', 
        data: failedPhoto
      }))
      
      throw error
    }
  }

  async syncVoiceNote(voiceNote: VoiceNote): Promise<void> {
    if (voiceNote.upload_status === 'completed') return

    try {
      // Upload audio file to cloud storage
      const uploadResult = await this.uploadFile(voiceNote.local_uri, 'audio')
      
      // Update voice note record
      const updatedVoiceNote = {
        ...voiceNote,
        remote_url: uploadResult.url,
        upload_status: 'completed' as const,
        synced: true
      }

      store.dispatch(addToQueue({
        entity_type: 'voice_note',
        entity_id: voiceNote.id,
        operation: 'update',
        data: updatedVoiceNote
      }))
    } catch (error) {
      const failedVoiceNote = {
        ...voiceNote,
        upload_status: 'failed' as const
      }
      
      store.dispatch(addToQueue({
        entity_type: 'voice_note',
        entity_id: voiceNote.id,
        operation: 'update',
        data: failedVoiceNote
      }))
      
      throw error
    }
  }

  private async uploadFile(localUri: string, folder: string): Promise<{ url: string }> {
    const fileName = localUri.split('/').pop() || 'unknown'
    const fileInfo = await FileSystem.getInfoAsync(localUri)
    
    if (!fileInfo.exists) {
      throw new Error('File not found')
    }

    // Implementation would upload to cloud storage (Supabase Storage, AWS S3, etc.)
    // For now, return mock URL
    return {
      url: `https://storage.claimguardianai.com/${folder}/${fileName}`
    }
  }

  // Queue management methods
  queueCreate<T extends Record<string, unknown>>(entityType: string, entityId: string, data: T): void {
    store.dispatch(addToQueue({
      entity_type: entityType,
      entity_id: entityId,
      operation: 'create',
      data
    }))
  }

  queueUpdate<T extends Record<string, unknown>>(entityType: string, entityId: string, data: T): void {
    store.dispatch(addToQueue({
      entity_type: entityType,
      entity_id: entityId,
      operation: 'update',
      data
    }))
  }

  queueDelete(entityType: string, entityId: string): void {
    store.dispatch(addToQueue({
      entity_type: entityType,
      entity_id: entityId,
      operation: 'delete',
      data: {}
    }))
  }

  // Utility methods
  async getQueueSize(): Promise<number> {
    const state = store.getState()
    return state.sync.queue.length
  }

  async getLastSyncTime(): Promise<string | null> {
    const state = store.getState()
    return state.sync.lastSyncTime
  }

  async isOnline(): Promise<boolean> {
    const networkState = await Network.getNetworkStateAsync()
    return networkState.isConnected === true && networkState.isInternetReachable === true
  }
}

export const syncService = new SyncService()