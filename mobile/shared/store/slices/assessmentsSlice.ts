/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for damage assessment management with offline support"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { DamageAssessment } from '../../types'

interface AssessmentsState {
  items: DamageAssessment[]
  currentAssessmentId: string | null
  activeAssessmentId: string | null // Currently being worked on
  loading: boolean
  error: string | null
  lastUpdated: string | null
  filters: {
    propertyId: string | null
    condition: DamageAssessment['overall_condition'] | null
    priority: DamageAssessment['priority_level'] | null
    dateRange: {
      start: string | null
      end: string | null
    }
    sortBy: 'assessment_date' | 'created_at' | 'estimated_total_damage' | 'priority_level'
    sortOrder: 'asc' | 'desc'
  }
  stats: {
    totalAssessments: number
    pendingSync: number
    avgDamageAmount: number
    highPriorityCount: number
  }
}

const initialState: AssessmentsState = {
  items: [],
  currentAssessmentId: null,
  activeAssessmentId: null,
  loading: false,
  error: null,
  lastUpdated: null,
  filters: {
    propertyId: null,
    condition: null,
    priority: null,
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'assessment_date',
    sortOrder: 'desc'
  },
  stats: {
    totalAssessments: 0,
    pendingSync: 0,
    avgDamageAmount: 0,
    highPriorityCount: 0
  }
}

// Async thunks
export const loadAssessmentsFromDatabase = createAsyncThunk<
  DamageAssessment[],
  string | undefined,
  { rejectValue: string }
>(
  'assessments/loadFromDatabase',
  async (propertyId, { rejectWithValue }) => {
    try {
      // Implementation would load from SQLite, optionally filtered by property
      return []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load assessments')
    }
  }
)

export const createAssessment = createAsyncThunk<
  DamageAssessment,
  Omit<DamageAssessment, 'id' | 'created_at' | 'updated_at' | 'synced'>,
  { rejectValue: string }
>(
  'assessments/create',
  async (assessmentData, { rejectWithValue }) => {
    try {
      const assessment: DamageAssessment = {
        ...assessmentData,
        id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      }

      // Save to SQLite and add to sync queue
      // Implementation would save to database

      return assessment
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create assessment')
    }
  }
)

export const updateAssessmentProgress = createAsyncThunk<
  { assessmentId: string; progress: Partial<DamageAssessment> },
  { assessmentId: string; progress: Partial<DamageAssessment> },
  { rejectValue: string }
>(
  'assessments/updateProgress',
  async ({ assessmentId, progress }, { rejectWithValue }) => {
    try {
      // Implementation would update in SQLite
      return { assessmentId, progress }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update assessment')
    }
  }
)

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {
    // Assessment CRUD operations
    addAssessment: (state, action: PayloadAction<DamageAssessment>) => {
      const existingIndex = state.items.findIndex(a => a.id === action.payload.id)
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload
      } else {
        state.items.push(action.payload)
      }
      state.lastUpdated = new Date().toISOString()
      assessmentsSlice.caseReducers.updateStats(state)
    },

    updateAssessment: (state, action: PayloadAction<DamageAssessment>) => {
      const index = state.items.findIndex(a => a.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updated_at: new Date().toISOString()
        }
        state.lastUpdated = new Date().toISOString()
        assessmentsSlice.caseReducers.updateStats(state)
      }
    },

    removeAssessment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(a => a.id !== action.payload)
      if (state.currentAssessmentId === action.payload) {
        state.currentAssessmentId = null
      }
      if (state.activeAssessmentId === action.payload) {
        state.activeAssessmentId = null
      }
      state.lastUpdated = new Date().toISOString()
      assessmentsSlice.caseReducers.updateStats(state)
    },

    markAssessmentSynced: (state, action: PayloadAction<string>) => {
      const assessment = state.items.find(a => a.id === action.payload)
      if (assessment) {
        assessment.synced = true
        assessmentsSlice.caseReducers.updateStats(state)
      }
    },

    markAssessmentUnsynced: (state, action: PayloadAction<string>) => {
      const assessment = state.items.find(a => a.id === action.payload)
      if (assessment) {
        assessment.synced = false
        assessmentsSlice.caseReducers.updateStats(state)
      }
    },

    // Active assessment management
    setCurrentAssessment: (state, action: PayloadAction<string | null>) => {
      state.currentAssessmentId = action.payload
    },

    setActiveAssessment: (state, action: PayloadAction<string | null>) => {
      state.activeAssessmentId = action.payload
    },

    // Assessment progress updates
    updateEstimatedDamage: (state, action: PayloadAction<{ assessmentId: string; amount: number }>) => {
      const assessment = state.items.find(a => a.id === action.payload.assessmentId)
      if (assessment) {
        assessment.estimated_total_damage = action.payload.amount
        assessment.updated_at = new Date().toISOString()
        assessment.synced = false
        assessmentsSlice.caseReducers.updateStats(state)
      }
    },

    updateOverallCondition: (state, action: PayloadAction<{ assessmentId: string; condition: DamageAssessment['overall_condition'] }>) => {
      const assessment = state.items.find(a => a.id === action.payload.assessmentId)
      if (assessment) {
        assessment.overall_condition = action.payload.condition
        assessment.updated_at = new Date().toISOString()
        assessment.synced = false
      }
    },

    updatePriority: (state, action: PayloadAction<{ assessmentId: string; priority: DamageAssessment['priority_level'] }>) => {
      const assessment = state.items.find(a => a.id === action.payload.assessmentId)
      if (assessment) {
        assessment.priority_level = action.payload.priority
        assessment.updated_at = new Date().toISOString()
        assessment.synced = false
        assessmentsSlice.caseReducers.updateStats(state)
      }
    },

    addNotes: (state, action: PayloadAction<{ assessmentId: string; notes: string }>) => {
      const assessment = state.items.find(a => a.id === action.payload.assessmentId)
      if (assessment) {
        const existingNotes = assessment.notes || ''
        const newNotes = existingNotes ? `${existingNotes}\n\n${action.payload.notes}` : action.payload.notes
        assessment.notes = newNotes
        assessment.updated_at = new Date().toISOString()
        assessment.synced = false
      }
    },

    // Filter management
    setPropertyFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.propertyId = action.payload
    },

    setConditionFilter: (state, action: PayloadAction<DamageAssessment['overall_condition'] | null>) => {
      state.filters.condition = action.payload
    },

    setPriorityFilter: (state, action: PayloadAction<DamageAssessment['priority_level'] | null>) => {
      state.filters.priority = action.payload
    },

    setDateRangeFilter: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload
    },

    setSortBy: (state, action: PayloadAction<{ sortBy: AssessmentsState['filters']['sortBy'], sortOrder: 'asc' | 'desc' }>) => {
      state.filters.sortBy = action.payload.sortBy
      state.filters.sortOrder = action.payload.sortOrder
    },

    clearFilters: (state) => {
      state.filters = {
        propertyId: null,
        condition: null,
        priority: null,
        dateRange: {
          start: null,
          end: null
        },
        sortBy: 'assessment_date',
        sortOrder: 'desc'
      }
    },

    // Bulk operations
    bulkAddAssessments: (state, action: PayloadAction<DamageAssessment[]>) => {
      const newAssessments = action.payload.filter(
        newAssessment => !state.items.some(existing => existing.id === newAssessment.id)
      )
      state.items.push(...newAssessments)
      state.lastUpdated = new Date().toISOString()
      assessmentsSlice.caseReducers.updateStats(state)
    },

    markAllSynced: (state) => {
      state.items.forEach(assessment => {
        assessment.synced = true
      })
      assessmentsSlice.caseReducers.updateStats(state)
    },

    // Statistics calculation
    updateStats: (state) => {
      state.stats = {
        totalAssessments: state.items.length,
        pendingSync: state.items.filter(a => !a.synced).length,
        avgDamageAmount: state.items.length > 0
          ? state.items.reduce((sum, a) => sum + a.estimated_total_damage, 0) / state.items.length
          : 0,
        highPriorityCount: state.items.filter(a => a.priority_level === 'high' || a.priority_level === 'critical').length
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
    clearAllAssessments: (state) => {
      state.items = []
      state.currentAssessmentId = null
      state.activeAssessmentId = null
      state.lastUpdated = new Date().toISOString()
      assessmentsSlice.caseReducers.updateStats(state)
    }
  },

  extraReducers: (builder) => {
    // Load from database
    builder
      .addCase(loadAssessmentsFromDatabase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadAssessmentsFromDatabase.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.lastUpdated = new Date().toISOString()
        assessmentsSlice.caseReducers.updateStats(state)
      })
      .addCase(loadAssessmentsFromDatabase.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load assessments'
      })

    // Create assessment
    builder
      .addCase(createAssessment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAssessment.fulfilled, (state, action) => {
        state.loading = false
        state.items.push(action.payload)
        state.activeAssessmentId = action.payload.id
        state.currentAssessmentId = action.payload.id
        state.lastUpdated = new Date().toISOString()
        assessmentsSlice.caseReducers.updateStats(state)
      })
      .addCase(createAssessment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create assessment'
      })

    // Update progress
    builder
      .addCase(updateAssessmentProgress.fulfilled, (state, action) => {
        const { assessmentId, progress } = action.payload
        const assessment = state.items.find(a => a.id === assessmentId)
        if (assessment) {
          Object.assign(assessment, progress)
          assessment.updated_at = new Date().toISOString()
          assessment.synced = false
          assessmentsSlice.caseReducers.updateStats(state)
        }
      })
  }
})

export const {
  addAssessment,
  updateAssessment,
  removeAssessment,
  markAssessmentSynced,
  markAssessmentUnsynced,
  setCurrentAssessment,
  setActiveAssessment,
  updateEstimatedDamage,
  updateOverallCondition,
  updatePriority,
  addNotes,
  setPropertyFilter,
  setConditionFilter,
  setPriorityFilter,
  setDateRangeFilter,
  setSortBy,
  clearFilters,
  bulkAddAssessments,
  markAllSynced,
  updateStats,
  setError,
  clearError,
  setLoading,
  clearAllAssessments,
} = assessmentsSlice.actions

export default assessmentsSlice.reducer
