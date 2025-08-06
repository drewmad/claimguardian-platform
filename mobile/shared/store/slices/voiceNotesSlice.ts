/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for voice note management with transcription and upload support"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { VoiceNote } from '../../types'

interface VoiceNotesState {
  items: VoiceNote[]
  currentlyRecording: boolean
  currentRecordingId: string | null
  currentlyPlaying: string | null
  uploading: string[] // Voice note IDs currently being uploaded
  transcribing: string[] // Voice note IDs currently being transcribed
  loading: boolean
  error: string | null
  lastUpdated: string | null
  filters: {
    assessmentId: string | null
    damageItemId: string | null
    uploadStatus: VoiceNote['upload_status'] | null
    hasTranscription: boolean | null
    dateRange: {
      start: string | null
      end: string | null
    }
    sortBy: 'created_at' | 'duration_seconds' | 'file_size'
    sortOrder: 'asc' | 'desc'
  }
  stats: {
    totalVoiceNotes: number
    totalDurationMinutes: number
    pendingUpload: number
    uploadedNotes: number
    failedUploads: number
    transcribedNotes: number
    totalSizeMB: number
  }
  settings: {
    audioQuality: 'low' | 'medium' | 'high'
    autoTranscribe: boolean
    maxRecordingDuration: number // in seconds
    compressionEnabled: boolean
  }
}

const initialState: VoiceNotesState = {
  items: [],
  currentlyRecording: false,
  currentRecordingId: null,
  currentlyPlaying: null,
  uploading: [],
  transcribing: [],
  loading: false,
  error: null,
  lastUpdated: null,
  filters: {
    assessmentId: null,
    damageItemId: null,
    uploadStatus: null,
    hasTranscription: null,
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'created_at',
    sortOrder: 'desc'
  },
  stats: {
    totalVoiceNotes: 0,
    totalDurationMinutes: 0,
    pendingUpload: 0,
    uploadedNotes: 0,
    failedUploads: 0,
    transcribedNotes: 0,
    totalSizeMB: 0
  },
  settings: {
    audioQuality: 'high',
    autoTranscribe: true,
    maxRecordingDuration: 300, // 5 minutes
    compressionEnabled: true
  }
}

// Async thunks
export const loadVoiceNotesFromDatabase = createAsyncThunk<
  VoiceNote[],
  { assessmentId?: string; damageItemId?: string },
  { rejectValue: string }
>(
  'voiceNotes/loadFromDatabase',
  async (filters, { rejectWithValue }) => {
    try {
      // Implementation would load from SQLite with optional filters
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load voice notes')
    }
  }
)

export const startRecording = createAsyncThunk<
  { recordingId: string; uri: string },
  { assessmentId?: string; damageItemId?: string },
  { rejectValue: string }
>(
  'voiceNotes/startRecording',
  async (params, { rejectWithValue, getState }) => {
    try {
      // Implementation would start audio recording
      const recordingId = `voice_note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const uri = `${require('expo-file-system').FileSystem.documentDirectory}voice_notes/${recordingId}.m4a`
      
      return { recordingId, uri }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start recording')
    }
  }
)

export const stopRecording = createAsyncThunk<
  VoiceNote,
  void,
  { rejectValue: string }
>(
  'voiceNotes/stopRecording',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any
      const recordingId = state.voiceNotes.currentRecordingId
      
      if (!recordingId) {
        throw new Error('No active recording')
      }

      // Implementation would stop recording and get file info
      const now = new Date().toISOString()
      const voiceNote: VoiceNote = {
        id: recordingId,
        local_uri: `${require('expo-file-system').FileSystem.documentDirectory}voice_notes/${recordingId}.m4a`,
        filename: `${recordingId}.m4a`,
        file_size: 1024 * 50, // Mock 50KB
        duration_seconds: 30, // Mock 30 seconds
        upload_status: 'pending',
        created_at: now,
        synced: false
      }

      return voiceNote
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to stop recording')
    }
  }
)

export const transcribeVoiceNote = createAsyncThunk<
  { voiceNoteId: string; transcription: string },
  string,
  { rejectValue: string }
>(
  'voiceNotes/transcribe',
  async (voiceNoteId, { rejectWithValue }) => {
    try {
      // Implementation would use speech-to-text API
      // For now return mock transcription
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate processing
      
      return {
        voiceNoteId,
        transcription: 'This is a mock transcription of the voice note.'
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to transcribe voice note')
    }
  }
)

export const uploadVoiceNote = createAsyncThunk<
  VoiceNote,
  string,
  { rejectValue: string }
>(
  'voiceNotes/upload',
  async (voiceNoteId, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any
      const voiceNote = state.voiceNotes.items.find((note: VoiceNote) => note.id === voiceNoteId)
      
      if (!voiceNote) {
        throw new Error('Voice note not found')
      }

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const uploadedNote: VoiceNote = {
        ...voiceNote,
        remote_url: `https://storage.claimguardianai.com/voice_notes/${voiceNote.filename}`,
        upload_status: 'completed',
        synced: true
      }

      return uploadedNote
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload voice note')
    }
  }
)

const voiceNotesSlice = createSlice({
  name: 'voiceNotes',
  initialState,
  reducers: {
    // CRUD operations
    addVoiceNote: (state, action: PayloadAction<VoiceNote>) => {
      const existingIndex = state.items.findIndex(note => note.id === action.payload.id)
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload
      } else {
        state.items.push(action.payload)
      }
      state.lastUpdated = new Date().toISOString()
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    updateVoiceNote: (state, action: PayloadAction<VoiceNote>) => {
      const index = state.items.findIndex(note => note.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
        state.lastUpdated = new Date().toISOString()
        voiceNotesSlice.caseReducers.updateStats(state)
      }
    },

    removeVoiceNote: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(note => note.id !== action.payload)
      state.uploading = state.uploading.filter(id => id !== action.payload)
      state.transcribing = state.transcribing.filter(id => id !== action.payload)
      
      if (state.currentlyPlaying === action.payload) {
        state.currentlyPlaying = null
      }
      
      state.lastUpdated = new Date().toISOString()
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    markVoiceNoteSynced: (state, action: PayloadAction<string>) => {
      const note = state.items.find(note => note.id === action.payload)
      if (note) {
        note.synced = true
        voiceNotesSlice.caseReducers.updateStats(state)
      }
    },

    // Recording state management
    setCurrentlyRecording: (state, action: PayloadAction<boolean>) => {
      state.currentlyRecording = action.payload
    },

    setCurrentRecordingId: (state, action: PayloadAction<string | null>) => {
      state.currentRecordingId = action.payload
    },

    // Playback state management
    setCurrentlyPlaying: (state, action: PayloadAction<string | null>) => {
      state.currentlyPlaying = action.payload
    },

    // Upload status management
    setUploadStatus: (state, action: PayloadAction<{ voiceNoteId: string; status: VoiceNote['upload_status'] }>) => {
      const note = state.items.find(note => note.id === action.payload.voiceNoteId)
      if (note) {
        note.upload_status = action.payload.status
        voiceNotesSlice.caseReducers.updateStats(state)
      }
    },

    setRemoteUrl: (state, action: PayloadAction<{ voiceNoteId: string; url: string }>) => {
      const note = state.items.find(note => note.id === action.payload.voiceNoteId)
      if (note) {
        note.remote_url = action.payload.url
        note.upload_status = 'completed'
        note.synced = true
        voiceNotesSlice.caseReducers.updateStats(state)
      }
    },

    // Transcription management
    setTranscription: (state, action: PayloadAction<{ voiceNoteId: string; transcription: string }>) => {
      const note = state.items.find(note => note.id === action.payload.voiceNoteId)
      if (note) {
        note.transcription = action.payload.transcription
        note.synced = false
        voiceNotesSlice.caseReducers.updateStats(state)
      }
    },

    clearTranscription: (state, action: PayloadAction<string>) => {
      const note = state.items.find(note => note.id === action.payload)
      if (note) {
        note.transcription = undefined
        note.synced = false
      }
    },

    // Batch operations
    bulkAddVoiceNotes: (state, action: PayloadAction<VoiceNote[]>) => {
      const newNotes = action.payload.filter(
        newNote => !state.items.some(existing => existing.id === newNote.id)
      )
      state.items.push(...newNotes)
      state.lastUpdated = new Date().toISOString()
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    bulkUpdateUploadStatus: (state, action: PayloadAction<{ voiceNoteIds: string[]; status: VoiceNote['upload_status'] }>) => {
      action.payload.voiceNoteIds.forEach(voiceNoteId => {
        const note = state.items.find(note => note.id === voiceNoteId)
        if (note) {
          note.upload_status = action.payload.status
        }
      })
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    markAllSynced: (state) => {
      state.items.forEach(note => {
        note.synced = true
      })
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    // Filter management
    setAssessmentFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.assessmentId = action.payload
    },

    setDamageItemFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.damageItemId = action.payload
    },

    setUploadStatusFilter: (state, action: PayloadAction<VoiceNote['upload_status'] | null>) => {
      state.filters.uploadStatus = action.payload
    },

    setTranscriptionFilter: (state, action: PayloadAction<boolean | null>) => {
      state.filters.hasTranscription = action.payload
    },

    setDateRangeFilter: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload
    },

    setSortBy: (state, action: PayloadAction<{ sortBy: VoiceNotesState['filters']['sortBy'], sortOrder: 'asc' | 'desc' }>) => {
      state.filters.sortBy = action.payload.sortBy
      state.filters.sortOrder = action.payload.sortOrder
    },

    clearFilters: (state) => {
      state.filters = {
        assessmentId: null,
        damageItemId: null,
        uploadStatus: null,
        hasTranscription: null,
        dateRange: {
          start: null,
          end: null
        },
        sortBy: 'created_at',
        sortOrder: 'desc'
      }
    },

    // Settings management
    updateSettings: (state, action: PayloadAction<Partial<VoiceNotesState['settings']>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      }
    },

    setAudioQuality: (state, action: PayloadAction<VoiceNotesState['settings']['audioQuality']>) => {
      state.settings.audioQuality = action.payload
    },

    toggleAutoTranscribe: (state) => {
      state.settings.autoTranscribe = !state.settings.autoTranscribe
    },

    setMaxRecordingDuration: (state, action: PayloadAction<number>) => {
      state.settings.maxRecordingDuration = action.payload
    },

    toggleCompression: (state) => {
      state.settings.compressionEnabled = !state.settings.compressionEnabled
    },

    // Statistics calculation
    updateStats: (state) => {
      const totalSizeBytes = state.items.reduce((sum, note) => sum + note.file_size, 0)
      const totalDurationSeconds = state.items.reduce((sum, note) => sum + note.duration_seconds, 0)
      
      state.stats = {
        totalVoiceNotes: state.items.length,
        totalDurationMinutes: Math.round((totalDurationSeconds / 60) * 100) / 100,
        pendingUpload: state.items.filter(note => note.upload_status === 'pending').length,
        uploadedNotes: state.items.filter(note => note.upload_status === 'completed').length,
        failedUploads: state.items.filter(note => note.upload_status === 'failed').length,
        transcribedNotes: state.items.filter(note => note.transcription).length,
        totalSizeMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100
      }
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    // Data management
    clearAllVoiceNotes: (state) => {
      state.items = []
      state.currentlyRecording = false
      state.currentRecordingId = null
      state.currentlyPlaying = null
      state.uploading = []
      state.transcribing = []
      state.lastUpdated = new Date().toISOString()
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    // Clean up orphaned voice notes
    removeOrphanedVoiceNotes: (state) => {
      state.items = state.items.filter(note => 
        note.assessment_id || note.damage_item_id
      )
      voiceNotesSlice.caseReducers.updateStats(state)
    },

    // Emergency stop for recording
    emergencyStopRecording: (state) => {
      state.currentlyRecording = false
      state.currentRecordingId = null
    }
  },

  extraReducers: (builder) => {
    // Load from database
    builder
      .addCase(loadVoiceNotesFromDatabase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadVoiceNotesFromDatabase.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastUpdated = new Date().toISOString()
        voiceNotesSlice.caseReducers.updateStats(state)
      })
      .addCase(loadVoiceNotesFromDatabase.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load voice notes'
      })

    // Start recording
    builder
      .addCase(startRecording.pending, (state) => {
        state.error = null
      })
      .addCase(startRecording.fulfilled, (state, action) => {
        state.currentlyRecording = true
        state.currentRecordingId = action.payload.recordingId
      })
      .addCase(startRecording.rejected, (state, action) => {
        state.error = action.payload || 'Failed to start recording'
        state.currentlyRecording = false
        state.currentRecordingId = null
      })

    // Stop recording
    builder
      .addCase(stopRecording.fulfilled, (state, action) => {
        state.currentlyRecording = false
        state.currentRecordingId = null
        state.items.push(action.payload)
        state.lastUpdated = new Date().toISOString()
        voiceNotesSlice.caseReducers.updateStats(state)
        
        // Auto-transcribe if enabled
        if (state.settings.autoTranscribe) {
          state.transcribing.push(action.payload.id)
        }
      })
      .addCase(stopRecording.rejected, (state, action) => {
        state.error = action.payload || 'Failed to stop recording'
        state.currentlyRecording = false
        state.currentRecordingId = null
      })

    // Transcribe voice note
    builder
      .addCase(transcribeVoiceNote.pending, (state, action) => {
        const voiceNoteId = action.meta.arg
        if (!state.transcribing.includes(voiceNoteId)) {
          state.transcribing.push(voiceNoteId)
        }
      })
      .addCase(transcribeVoiceNote.fulfilled, (state, action) => {
        const { voiceNoteId, transcription } = action.payload
        state.transcribing = state.transcribing.filter(id => id !== voiceNoteId)
        
        const note = state.items.find(note => note.id === voiceNoteId)
        if (note) {
          note.transcription = transcription
          note.synced = false
        }
        voiceNotesSlice.caseReducers.updateStats(state)
      })
      .addCase(transcribeVoiceNote.rejected, (state, action) => {
        const voiceNoteId = action.meta.arg
        state.transcribing = state.transcribing.filter(id => id !== voiceNoteId)
        state.error = action.payload || 'Failed to transcribe voice note'
      })

    // Upload voice note
    builder
      .addCase(uploadVoiceNote.pending, (state, action) => {
        const voiceNoteId = action.meta.arg
        if (!state.uploading.includes(voiceNoteId)) {
          state.uploading.push(voiceNoteId)
        }
        const note = state.items.find(note => note.id === voiceNoteId)
        if (note) {
          note.upload_status = 'uploading'
        }
      })
      .addCase(uploadVoiceNote.fulfilled, (state, action) => {
        const voiceNoteId = action.payload.id
        state.uploading = state.uploading.filter(id => id !== voiceNoteId)
        
        const index = state.items.findIndex(note => note.id === voiceNoteId)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        voiceNotesSlice.caseReducers.updateStats(state)
      })
      .addCase(uploadVoiceNote.rejected, (state, action) => {
        const voiceNoteId = action.meta.arg
        state.uploading = state.uploading.filter(id => id !== voiceNoteId)
        
        const note = state.items.find(note => note.id === voiceNoteId)
        if (note) {
          note.upload_status = 'failed'
        }
        state.error = action.payload || 'Failed to upload voice note'
        voiceNotesSlice.caseReducers.updateStats(state)
      })
  }
})

export const {
  addVoiceNote,
  updateVoiceNote,
  removeVoiceNote,
  markVoiceNoteSynced,
  setCurrentlyRecording,
  setCurrentRecordingId,
  setCurrentlyPlaying,
  setUploadStatus,
  setRemoteUrl,
  setTranscription,
  clearTranscription,
  bulkAddVoiceNotes,
  bulkUpdateUploadStatus,
  markAllSynced,
  setAssessmentFilter,
  setDamageItemFilter,
  setUploadStatusFilter,
  setTranscriptionFilter,
  setDateRangeFilter,
  setSortBy,
  clearFilters,
  updateSettings,
  setAudioQuality,
  toggleAutoTranscribe,
  setMaxRecordingDuration,
  toggleCompression,
  updateStats,
  setError,
  clearError,
  setLoading,
  clearAllVoiceNotes,
  removeOrphanedVoiceNotes,
  emergencyStopRecording,
} = voiceNotesSlice.actions

export default voiceNotesSlice.reducer