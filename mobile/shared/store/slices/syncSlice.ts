/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for sync state management and offline queue"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { SyncQueue, SyncResult, SyncEvent } from '../../types'

interface SyncState {
  isAutoSyncEnabled: boolean
  lastSyncTime: string | null
  isSyncing: boolean
  syncProgress: number
  queue: SyncQueue[]
  recentEvents: SyncEvent[]
  settings: {
    syncOnWifi: boolean
    syncOnCellular: boolean
    maxRetries: number
    retryDelay: number
    batchSize: number
  }
  stats: {
    totalSyncedToday: number
    totalFailedToday: number
    syncSuccessRate: number
    averageSyncTime: number
  }
}

const initialState: SyncState = {
  isAutoSyncEnabled: true,
  lastSyncTime: null,
  isSyncing: false,
  syncProgress: 0,
  queue: [],
  recentEvents: [],
  settings: {
    syncOnWifi: true,
    syncOnCellular: false,
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 10,
  },
  stats: {
    totalSyncedToday: 0,
    totalFailedToday: 0,
    syncSuccessRate: 100,
    averageSyncTime: 0,
  }
}

// Async thunks for sync operations
export const performFullSync = createAsyncThunk<
  SyncResult,
  void,
  { rejectValue: string }
>(
  'sync/performFullSync',
  async (_, { rejectWithValue }) => {
    try {
      // Implementation will call sync service
      const result: SyncResult = {
        success: true,
        synced_count: 0,
        failed_count: 0,
        errors: []
      }
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sync failed')
    }
  }
)

export const syncSingleItem = createAsyncThunk<
  { success: boolean; itemId: string },
  { entityType: string; entityId: string },
  { rejectValue: string }
>(
  'sync/syncSingleItem',
  async ({ entityType, entityId }, { rejectWithValue }) => {
    try {
      // Implementation will sync single item
      return { success: true, itemId: entityId }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Item sync failed')
    }
  }
)

export const retryFailedSyncs = createAsyncThunk<
  SyncResult,
  void,
  { rejectValue: string }
>(
  'sync/retryFailedSyncs',
  async (_, { rejectWithValue }) => {
    try {
      // Implementation will retry failed items
      const result: SyncResult = {
        success: true,
        synced_count: 0,
        failed_count: 0,
        errors: []
      }
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Retry sync failed')
    }
  }
)

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Queue management
    addToQueue: (state, action: PayloadAction<Omit<SyncQueue, 'id' | 'retry_count' | 'created_at'>>) => {
      const queueItem: SyncQueue = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        retry_count: 0,
        created_at: new Date().toISOString(),
        ...action.payload
      }

      // Check for duplicate operations
      const existingIndex = state.queue.findIndex(
        item => item.entity_type === queueItem.entity_type &&
                item.entity_id === queueItem.entity_id &&
                item.operation === queueItem.operation
      )

      if (existingIndex !== -1) {
        // Update existing item with newer data
        state.queue[existingIndex] = queueItem
      } else {
        state.queue.push(queueItem)
      }
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload)
    },

    clearQueue: (state) => {
      state.queue = []
    },

    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload)
      if (item) {
        item.retry_count += 1
      }
    },

    setLastError: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const item = state.queue.find(item => item.id === action.payload.id)
      if (item) {
        item.last_error = action.payload.error
      }
    },

    // Sync state management
    setSyncProgress: (state, action: PayloadAction<number>) => {
      state.syncProgress = action.payload
    },

    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload
    },

    setAutoSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAutoSyncEnabled = action.payload
    },

    // Settings management
    updateSyncSettings: (state, action: PayloadAction<Partial<SyncState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },

    // Events management
    addSyncEvent: (state, action: PayloadAction<Omit<SyncEvent, 'timestamp'>>) => {
      const event: SyncEvent = {
        timestamp: new Date().toISOString(),
        ...action.payload
      }

      state.recentEvents.unshift(event)

      // Keep only last 50 events
      if (state.recentEvents.length > 50) {
        state.recentEvents = state.recentEvents.slice(0, 50)
      }
    },

    clearSyncEvents: (state) => {
      state.recentEvents = []
    },

    // Stats management
    updateSyncStats: (state, action: PayloadAction<Partial<SyncState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },

    resetDailyStats: (state) => {
      state.stats.totalSyncedToday = 0
      state.stats.totalFailedToday = 0
      state.stats.syncSuccessRate = 100
    },
  },

  extraReducers: (builder) => {
    // Full sync
    builder
      .addCase(performFullSync.pending, (state) => {
        state.isSyncing = true
        state.syncProgress = 0
        state.recentEvents.unshift({
          type: 'sync_started',
          timestamp: new Date().toISOString()
        })
      })
      .addCase(performFullSync.fulfilled, (state, action) => {
        state.isSyncing = false
        state.syncProgress = 100
        state.lastSyncTime = new Date().toISOString()
        state.stats.totalSyncedToday += action.payload.synced_count
        state.stats.totalFailedToday += action.payload.failed_count

        // Update success rate
        const total = state.stats.totalSyncedToday + state.stats.totalFailedToday
        if (total > 0) {
          state.stats.syncSuccessRate = (state.stats.totalSyncedToday / total) * 100
        }

        // Clear successfully synced items from queue
        if (action.payload.success) {
          state.queue = state.queue.filter(item => item.retry_count >= state.settings.maxRetries)
        }

        state.recentEvents.unshift({
          type: 'sync_completed',
          timestamp: new Date().toISOString(),
          progress: 100
        })
      })
      .addCase(performFullSync.rejected, (state, action) => {
        state.isSyncing = false
        state.syncProgress = 0
        state.stats.totalFailedToday += 1

        state.recentEvents.unshift({
          type: 'sync_failed',
          timestamp: new Date().toISOString(),
          error: action.payload || 'Unknown sync error'
        })
      })

    // Single item sync
    builder
      .addCase(syncSingleItem.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.queue = state.queue.filter(item => item.entity_id !== action.payload.itemId)
          state.stats.totalSyncedToday += 1
        }

        state.recentEvents.unshift({
          type: 'entity_synced',
          timestamp: new Date().toISOString(),
          entity_id: action.payload.itemId
        })
      })
      .addCase(syncSingleItem.rejected, (state, action) => {
        state.stats.totalFailedToday += 1

        state.recentEvents.unshift({
          type: 'entity_failed',
          timestamp: new Date().toISOString(),
          error: action.payload || 'Item sync failed'
        })
      })

    // Retry failed syncs
    builder
      .addCase(retryFailedSyncs.pending, (state) => {
        state.isSyncing = true
        state.recentEvents.unshift({
          type: 'sync_started',
          timestamp: new Date().toISOString()
        })
      })
      .addCase(retryFailedSyncs.fulfilled, (state, action) => {
        state.isSyncing = false
        state.stats.totalSyncedToday += action.payload.synced_count
        state.stats.totalFailedToday += action.payload.failed_count

        state.recentEvents.unshift({
          type: 'sync_completed',
          timestamp: new Date().toISOString()
        })
      })
      .addCase(retryFailedSyncs.rejected, (state, action) => {
        state.isSyncing = false
        state.recentEvents.unshift({
          type: 'sync_failed',
          timestamp: new Date().toISOString(),
          error: action.payload || 'Retry sync failed'
        })
      })
  }
})

export const {
  addToQueue,
  removeFromQueue,
  clearQueue,
  incrementRetryCount,
  setLastError,
  setSyncProgress,
  setLastSyncTime,
  setAutoSyncEnabled,
  updateSyncSettings,
  addSyncEvent,
  clearSyncEvents,
  updateSyncStats,
  resetDailyStats,
} = syncSlice.actions

export default syncSlice.reducer
