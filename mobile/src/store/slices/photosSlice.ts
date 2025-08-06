/**
 * Photos Redux Slice
 * Manages photo data for damage assessment with AI analysis
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface PhotoLocation {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
}

export interface PhotoAnalysis {
  annotations?: PhotoAnnotation[]
  damageScore?: number
  estimatedCost?: number
  description?: string
  materials?: string[]
  analyzedAt?: string
  confidence?: number
}

export interface PhotoAnnotation {
  id: string
  x: number // percentage
  y: number // percentage
  width: number // percentage
  height: number // percentage
  damageType: string
  severity: 'low' | 'medium' | 'high' | 'severe'
  confidence: number
  description: string
  estimatedCost?: number
}

export interface AudioNotes {
  uri: string
  transcript?: string
  duration: number
  createdAt: string
}

export interface PhotoMetadata {
  width: number
  height: number
  fileSize: number
  format: string
  orientation?: number
  exif?: Record<string, unknown>
}

export interface Photo {
  id: string
  uri: string
  localUri?: string
  thumbnail?: string
  filename: string
  timestamp: string
  location?: PhotoLocation
  metadata?: PhotoMetadata
  
  // Assessment context
  assessmentId?: string
  propertyId?: string
  roomName?: string
  category?: string
  subcategory?: string
  
  // User annotations
  notes?: string
  tags?: string[]
  audioNotes?: AudioNotes
  
  // AI analysis
  analysis?: PhotoAnalysis
  
  // Sync status
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  lastSyncAttempt?: string
  syncError?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface PhotosState {
  photos: Photo[]
  selectedPhotos: string[]
  currentPhoto?: string
  
  // Loading states
  isLoading: boolean
  isAnalyzing: boolean
  isSyncing: boolean
  
  // Filters and sorting
  filters: {
    assessmentId?: string
    propertyId?: string
    category?: string
    syncStatus?: string
    hasAnalysis?: boolean
    dateRange?: {
      start: string
      end: string
    }
  }
  sortBy: 'timestamp' | 'filename' | 'damageScore' | 'estimatedCost'
  sortOrder: 'asc' | 'desc'
  
  // Error handling
  error: string | null
  
  // Statistics
  stats: {
    totalPhotos: number
    analyzedPhotos: number
    pendingSyncPhotos: number
    totalEstimatedDamage: number
    averageDamageScore: number
  }
}

const initialState: PhotosState = {
  photos: [],
  selectedPhotos: [],
  isLoading: false,
  isAnalyzing: false,
  isSyncing: false,
  filters: {},
  sortBy: 'timestamp',
  sortOrder: 'desc',
  error: null,
  stats: {
    totalPhotos: 0,
    analyzedPhotos: 0,
    pendingSyncPhotos: 0,
    totalEstimatedDamage: 0,
    averageDamageScore: 0
  }
}

// Async thunks
export const loadPhotos = createAsyncThunk(
  'photos/loadPhotos',
  async (filters: Partial<PhotosState['filters']> = {}) => {
    // This would load photos from local storage or database
    // For now, return empty array
    return []
  }
)

export const syncPhotos = createAsyncThunk(
  'photos/syncPhotos',
  async (photoIds?: string[]) => {
    // This would sync photos with the server
    // For now, return empty array
    return []
  }
)

export const analyzePhoto = createAsyncThunk(
  'photos/analyzePhoto',
  async (photoId: string) => {
    // This would trigger AI analysis
    // Implementation would be in the component using the aiAnalysisService
    return { photoId, analysis: {} }
  }
)

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    addPhoto: (state, action: PayloadAction<Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const photo: Photo = {
        ...action.payload,
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      state.photos.unshift(photo)
      state.stats.totalPhotos = state.photos.length
      state.stats.pendingSyncPhotos = state.photos.filter(p => p.syncStatus === 'pending').length
    },

    updatePhoto: (state, action: PayloadAction<Photo>) => {
      const index = state.photos.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.photos[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString()
        }
        updateStats(state)
      }
    },

    deletePhoto: (state, action: PayloadAction<string>) => {
      state.photos = state.photos.filter(p => p.id !== action.payload)
      state.selectedPhotos = state.selectedPhotos.filter(id => id !== action.payload)
      if (state.currentPhoto === action.payload) {
        state.currentPhoto = undefined
      }
      updateStats(state)
    },

    selectPhoto: (state, action: PayloadAction<string>) => {
      const photoId = action.payload
      if (!state.selectedPhotos.includes(photoId)) {
        state.selectedPhotos.push(photoId)
      }
    },

    deselectPhoto: (state, action: PayloadAction<string>) => {
      state.selectedPhotos = state.selectedPhotos.filter(id => id !== action.payload)
    },

    selectAllPhotos: (state) => {
      const visiblePhotoIds = getFilteredPhotos(state).map(p => p.id)
      state.selectedPhotos = [...new Set([...state.selectedPhotos, ...visiblePhotoIds])]
    },

    deselectAllPhotos: (state) => {
      state.selectedPhotos = []
    },

    setCurrentPhoto: (state, action: PayloadAction<string | undefined>) => {
      state.currentPhoto = action.payload
    },

    updatePhotoNotes: (state, action: PayloadAction<{ photoId: string; notes: string }>) => {
      const photo = state.photos.find(p => p.id === action.payload.photoId)
      if (photo) {
        photo.notes = action.payload.notes
        photo.updatedAt = new Date().toISOString()
        photo.syncStatus = 'pending'
      }
    },

    updatePhotoTags: (state, action: PayloadAction<{ photoId: string; tags: string[] }>) => {
      const photo = state.photos.find(p => p.id === action.payload.photoId)
      if (photo) {
        photo.tags = action.payload.tags
        photo.updatedAt = new Date().toISOString()
        photo.syncStatus = 'pending'
      }
    },

    updatePhotoAnalysis: (state, action: PayloadAction<{ photoId: string; analysis: PhotoAnalysis }>) => {
      const photo = state.photos.find(p => p.id === action.payload.photoId)
      if (photo) {
        photo.analysis = action.payload.analysis
        photo.updatedAt = new Date().toISOString()
        photo.syncStatus = 'pending'
        updateStats(state)
      }
    },

    updatePhotoSyncStatus: (state, action: PayloadAction<{ 
      photoId: string 
      status: Photo['syncStatus']
      error?: string 
    }>) => {
      const photo = state.photos.find(p => p.id === action.payload.photoId)
      if (photo) {
        photo.syncStatus = action.payload.status
        photo.lastSyncAttempt = new Date().toISOString()
        photo.syncError = action.payload.error
        updateStats(state)
      }
    },

    setFilters: (state, action: PayloadAction<Partial<PhotosState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = {}
    },

    setSorting: (state, action: PayloadAction<{ 
      sortBy: PhotosState['sortBy']
      sortOrder: PhotosState['sortOrder'] 
    }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload
    },

    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload
    },

    // Batch operations
    batchUpdatePhotos: (state, action: PayloadAction<Photo[]>) => {
      action.payload.forEach(updatedPhoto => {
        const index = state.photos.findIndex(p => p.id === updatedPhoto.id)
        if (index !== -1) {
          state.photos[index] = {
            ...updatedPhoto,
            updatedAt: new Date().toISOString()
          }
        }
      })
      updateStats(state)
    },

    batchDeletePhotos: (state, action: PayloadAction<string[]>) => {
      state.photos = state.photos.filter(p => !action.payload.includes(p.id))
      state.selectedPhotos = state.selectedPhotos.filter(id => !action.payload.includes(id))
      if (state.currentPhoto && action.payload.includes(state.currentPhoto)) {
        state.currentPhoto = undefined
      }
      updateStats(state)
    },

    // Reset state
    resetPhotos: (state) => {
      return { ...initialState }
    }
  },

  extraReducers: (builder) => {
    builder
      // Load photos
      .addCase(loadPhotos.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadPhotos.fulfilled, (state, action) => {
        state.isLoading = false
        state.photos = action.payload
        updateStats(state)
      })
      .addCase(loadPhotos.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to load photos'
      })

      // Sync photos
      .addCase(syncPhotos.pending, (state) => {
        state.isSyncing = true
        state.error = null
      })
      .addCase(syncPhotos.fulfilled, (state, action) => {
        state.isSyncing = false
        // Update synced photos
        action.payload.forEach(syncedPhoto => {
          const index = state.photos.findIndex(p => p.id === syncedPhoto.id)
          if (index !== -1) {
            state.photos[index] = syncedPhoto
          }
        })
        updateStats(state)
      })
      .addCase(syncPhotos.rejected, (state, action) => {
        state.isSyncing = false
        state.error = action.error.message || 'Failed to sync photos'
      })

      // Analyze photo
      .addCase(analyzePhoto.pending, (state) => {
        state.isAnalyzing = true
        state.error = null
      })
      .addCase(analyzePhoto.fulfilled, (state, action) => {
        state.isAnalyzing = false
        const photo = state.photos.find(p => p.id === action.payload.photoId)
        if (photo) {
          photo.analysis = action.payload.analysis as PhotoAnalysis
          photo.updatedAt = new Date().toISOString()
          photo.syncStatus = 'pending'
        }
        updateStats(state)
      })
      .addCase(analyzePhoto.rejected, (state, action) => {
        state.isAnalyzing = false
        state.error = action.error.message || 'Failed to analyze photo'
      })
  }
})

// Helper functions
function updateStats(state: PhotosState) {
  state.stats.totalPhotos = state.photos.length
  state.stats.analyzedPhotos = state.photos.filter(p => p.analysis).length
  state.stats.pendingSyncPhotos = state.photos.filter(p => p.syncStatus === 'pending').length
  
  const photosWithDamage = state.photos.filter(p => p.analysis?.estimatedCost)
  state.stats.totalEstimatedDamage = photosWithDamage.reduce(
    (sum, p) => sum + (p.analysis?.estimatedCost || 0), 
    0
  )
  
  const photosWithScore = state.photos.filter(p => p.analysis?.damageScore)
  state.stats.averageDamageScore = photosWithScore.length > 0
    ? photosWithScore.reduce((sum, p) => sum + (p.analysis?.damageScore || 0), 0) / photosWithScore.length
    : 0
}

function getFilteredPhotos(state: PhotosState): Photo[] {
  let filtered = [...state.photos]
  const { filters } = state

  if (filters.assessmentId) {
    filtered = filtered.filter(p => p.assessmentId === filters.assessmentId)
  }

  if (filters.propertyId) {
    filtered = filtered.filter(p => p.propertyId === filters.propertyId)
  }

  if (filters.category) {
    filtered = filtered.filter(p => p.category === filters.category)
  }

  if (filters.syncStatus) {
    filtered = filtered.filter(p => p.syncStatus === filters.syncStatus)
  }

  if (filters.hasAnalysis !== undefined) {
    filtered = filtered.filter(p => !!p.analysis === filters.hasAnalysis)
  }

  if (filters.dateRange) {
    filtered = filtered.filter(p => {
      const photoDate = new Date(p.timestamp)
      const startDate = new Date(filters.dateRange!.start)
      const endDate = new Date(filters.dateRange!.end)
      return photoDate >= startDate && photoDate <= endDate
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (state.sortBy) {
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime()
        bValue = new Date(b.timestamp).getTime()
        break
      case 'filename':
        aValue = a.filename.toLowerCase()
        bValue = b.filename.toLowerCase()
        break
      case 'damageScore':
        aValue = a.analysis?.damageScore || 0
        bValue = b.analysis?.damageScore || 0
        break
      case 'estimatedCost':
        aValue = a.analysis?.estimatedCost || 0
        bValue = b.analysis?.estimatedCost || 0
        break
      default:
        aValue = a.timestamp
        bValue = b.timestamp
    }

    if (state.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
}

// Selectors (for use with useAppSelector)
export const selectAllPhotos = (state: { photos: PhotosState }) => state.photos.photos
export const selectFilteredPhotos = (state: { photos: PhotosState }) => getFilteredPhotos(state.photos)
export const selectSelectedPhotos = (state: { photos: PhotosState }) => 
  state.photos.photos.filter(p => state.photos.selectedPhotos.includes(p.id))
export const selectCurrentPhoto = (state: { photos: PhotosState }) => 
  state.photos.photos.find(p => p.id === state.photos.currentPhoto)
export const selectPhotoById = (photoId: string) => (state: { photos: PhotosState }) =>
  state.photos.photos.find(p => p.id === photoId)
export const selectPhotosStats = (state: { photos: PhotosState }) => state.photos.stats
export const selectPhotosLoading = (state: { photos: PhotosState }) => state.photos.isLoading
export const selectPhotosError = (state: { photos: PhotosState }) => state.photos.error

export const {
  addPhoto,
  updatePhoto,
  deletePhoto,
  selectPhoto,
  deselectPhoto,
  selectAllPhotos,
  deselectAllPhotos,
  setCurrentPhoto,
  updatePhotoNotes,
  updatePhotoTags,
  updatePhotoAnalysis,
  updatePhotoSyncStatus,
  setFilters,
  clearFilters,
  setSorting,
  setError,
  setLoading,
  setAnalyzing,
  setSyncing,
  batchUpdatePhotos,
  batchDeletePhotos,
  resetPhotos
} = photosSlice.actions

export default photosSlice.reducer