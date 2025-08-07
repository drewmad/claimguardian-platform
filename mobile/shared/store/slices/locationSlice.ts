/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for location services and GPS data management"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { LocationData } from '../../types'

interface LocationState {
  hasPermission: boolean
  permissionStatus: 'undetermined' | 'granted' | 'denied' | 'restricted'
  isEnabled: boolean
  isTracking: boolean
  current: LocationData | null
  accuracy: 'lowest' | 'low' | 'balanced' | 'high' | 'highest'
  lastKnownLocation: LocationData | null
  locationHistory: LocationData[]
  settings: {
    backgroundTracking: boolean
    highAccuracyMode: boolean
    updateInterval: number // in milliseconds
    distanceFilter: number // minimum distance in meters for updates
    timeout: number // location request timeout in milliseconds
    maximumAge: number // maximum age of cached location in milliseconds
    enableSpeedTracking: boolean
    enableHeadingTracking: boolean
  }
  stats: {
    totalLocationUpdates: number
    averageAccuracy: number
    totalDistanceTraveled: number // in meters
    trackingStartTime: string | null
    lastUpdateTime: string | null
  }
  geofences: {
    id: string
    name: string
    latitude: number
    longitude: number
    radius: number // in meters
    isActive: boolean
    lastTriggered: string | null
  }[]
  error: string | null
  loading: boolean
}

const initialState: LocationState = {
  hasPermission: false,
  permissionStatus: 'undetermined',
  isEnabled: false,
  isTracking: false,
  current: null,
  accuracy: 'high',
  lastKnownLocation: null,
  locationHistory: [],
  settings: {
    backgroundTracking: false,
    highAccuracyMode: true,
    updateInterval: 10000, // 10 seconds
    distanceFilter: 10, // 10 meters
    timeout: 15000, // 15 seconds
    maximumAge: 60000, // 1 minute
    enableSpeedTracking: false,
    enableHeadingTracking: false
  },
  stats: {
    totalLocationUpdates: 0,
    averageAccuracy: 0,
    totalDistanceTraveled: 0,
    trackingStartTime: null,
    lastUpdateTime: null
  },
  geofences: [],
  error: null,
  loading: false
}

// Async thunks
export const getCurrentLocation = createAsyncThunk<
  LocationData,
  { highAccuracy?: boolean; timeout?: number },
  { rejectValue: string }
>(
  'location/getCurrent',
  async (options = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any
      const settings = state.location.settings

      // Implementation would use expo-location
      // For now return mock location data
      const mockLocation: LocationData = {
        latitude: 26.1224 + (Math.random() - 0.5) * 0.01, // Near Fort Myers, FL
        longitude: -81.7937 + (Math.random() - 0.5) * 0.01,
        altitude: 10 + Math.random() * 20,
        accuracy: options.highAccuracy ? 5 + Math.random() * 5 : 10 + Math.random() * 10,
        heading: Math.random() * 360,
        speed: Math.random() * 5, // 0-5 m/s walking speed
        timestamp: Date.now()
      }

      return mockLocation
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get location')
    }
  }
)

export const startLocationTracking = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>(
  'location/startTracking',
  async (_, { rejectWithValue }) => {
    try {
      // Implementation would start location tracking
      return 'tracking_session_' + Date.now()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start tracking')
    }
  }
)

export const stopLocationTracking = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'location/stopTracking',
  async (_, { rejectWithValue }) => {
    try {
      // Implementation would stop location tracking
      return
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to stop tracking')
    }
  }
)

// Utility function to calculate distance between two points
const calculateDistance = (loc1: LocationData, loc2: LocationData): number => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = loc1.latitude * Math.PI / 180
  const φ2 = loc2.latitude * Math.PI / 180
  const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180
  const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Permission management
    setPermissionStatus: (state, action: PayloadAction<LocationState['permissionStatus']>) => {
      state.permissionStatus = action.payload
      state.hasPermission = action.payload === 'granted'
    },

    setHasPermission: (state, action: PayloadAction<boolean>) => {
      state.hasPermission = action.payload
      state.permissionStatus = action.payload ? 'granted' : 'denied'
    },

    // Location services management
    setLocationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload
    },

    setLocationTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload
      if (action.payload) {
        state.stats.trackingStartTime = new Date().toISOString()
      }
    },

    // Location data updates
    updateCurrentLocation: (state, action: PayloadAction<LocationData>) => {
      const newLocation = action.payload

      // Update current location
      if (state.current) {
        state.lastKnownLocation = state.current
      }
      state.current = newLocation

      // Add to history (keep last 100 locations)
      state.locationHistory.unshift(newLocation)
      if (state.locationHistory.length > 100) {
        state.locationHistory = state.locationHistory.slice(0, 100)
      }

      // Update statistics
      state.stats.totalLocationUpdates += 1
      state.stats.lastUpdateTime = new Date().toISOString()

      // Calculate distance traveled
      if (state.lastKnownLocation) {
        const distance = calculateDistance(state.lastKnownLocation, newLocation)
        if (distance > state.settings.distanceFilter) {
          state.stats.totalDistanceTraveled += distance
        }
      }

      // Update average accuracy
      const totalAccuracy = state.stats.averageAccuracy * (state.stats.totalLocationUpdates - 1) + (newLocation.accuracy || 0)
      state.stats.averageAccuracy = totalAccuracy / state.stats.totalLocationUpdates

      // Check geofences
      locationSlice.caseReducers.checkGeofences(state)
    },

    setAccuracy: (state, action: PayloadAction<LocationState['accuracy']>) => {
      state.accuracy = action.payload
    },

    // Settings management
    updateLocationSettings: (state, action: PayloadAction<Partial<LocationState['settings']>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      }
    },

    setBackgroundTracking: (state, action: PayloadAction<boolean>) => {
      state.settings.backgroundTracking = action.payload
    },

    toggleBackgroundTracking: (state) => {
      state.settings.backgroundTracking = !state.settings.backgroundTracking
    },

    setHighAccuracyMode: (state, action: PayloadAction<boolean>) => {
      state.settings.highAccuracyMode = action.payload
    },

    toggleHighAccuracyMode: (state) => {
      state.settings.highAccuracyMode = !state.settings.highAccuracyMode
    },

    setUpdateInterval: (state, action: PayloadAction<number>) => {
      state.settings.updateInterval = Math.max(1000, action.payload) // Minimum 1 second
    },

    setDistanceFilter: (state, action: PayloadAction<number>) => {
      state.settings.distanceFilter = Math.max(0, action.payload)
    },

    setTimeout: (state, action: PayloadAction<number>) => {
      state.settings.timeout = Math.max(5000, action.payload) // Minimum 5 seconds
    },

    setMaximumAge: (state, action: PayloadAction<number>) => {
      state.settings.maximumAge = Math.max(0, action.payload)
    },

    toggleSpeedTracking: (state) => {
      state.settings.enableSpeedTracking = !state.settings.enableSpeedTracking
    },

    toggleHeadingTracking: (state) => {
      state.settings.enableHeadingTracking = !state.settings.enableHeadingTracking
    },

    // Geofence management
    addGeofence: (state, action: PayloadAction<Omit<LocationState['geofences'][0], 'id' | 'lastTriggered'>>) => {
      const geofence = {
        ...action.payload,
        id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastTriggered: null
      }
      state.geofences.push(geofence)
    },

    removeGeofence: (state, action: PayloadAction<string>) => {
      state.geofences = state.geofences.filter(g => g.id !== action.payload)
    },

    toggleGeofence: (state, action: PayloadAction<string>) => {
      const geofence = state.geofences.find(g => g.id === action.payload)
      if (geofence) {
        geofence.isActive = !geofence.isActive
      }
    },

    updateGeofence: (state, action: PayloadAction<{ id: string; updates: Partial<LocationState['geofences'][0]> }>) => {
      const geofence = state.geofences.find(g => g.id === action.payload.id)
      if (geofence) {
        Object.assign(geofence, action.payload.updates)
      }
    },

    checkGeofences: (state) => {
      if (!state.current) return

      state.geofences.forEach(geofence => {
        if (!geofence.isActive) return

        const distance = calculateDistance(state.current!, {
          latitude: geofence.latitude,
          longitude: geofence.longitude,
          accuracy: 0,
          timestamp: Date.now()
        })

        const wasInside = geofence.lastTriggered !== null
        const isInside = distance <= geofence.radius

        if (!wasInside && isInside) {
          geofence.lastTriggered = new Date().toISOString()
          // Could dispatch a geofence enter event here
        } else if (wasInside && !isInside) {
          geofence.lastTriggered = null
          // Could dispatch a geofence exit event here
        }
      })
    },

    clearGeofences: (state) => {
      state.geofences = []
    },

    // History management
    clearLocationHistory: (state) => {
      state.locationHistory = []
    },

    limitLocationHistory: (state, action: PayloadAction<number>) => {
      const limit = Math.max(1, action.payload)
      if (state.locationHistory.length > limit) {
        state.locationHistory = state.locationHistory.slice(0, limit)
      }
    },

    // Statistics management
    resetLocationStats: (state) => {
      state.stats = {
        totalLocationUpdates: 0,
        averageAccuracy: 0,
        totalDistanceTraveled: 0,
        trackingStartTime: null,
        lastUpdateTime: null
      }
    },

    // Utility actions
    setLastKnownLocation: (state, action: PayloadAction<LocationData | null>) => {
      state.lastKnownLocation = action.payload
    },

    // Emergency/disaster mode
    enableEmergencyMode: (state) => {
      state.settings.highAccuracyMode = true
      state.settings.updateInterval = 5000 // 5 seconds for emergency
      state.settings.distanceFilter = 5 // 5 meters
      state.settings.backgroundTracking = true
    },

    disableEmergencyMode: (state) => {
      state.settings.highAccuracyMode = false
      state.settings.updateInterval = 10000 // 10 seconds normal
      state.settings.distanceFilter = 10 // 10 meters
      state.settings.backgroundTracking = false
    },

    // Power saving mode
    enablePowerSavingMode: (state) => {
      state.settings.highAccuracyMode = false
      state.settings.updateInterval = 30000 // 30 seconds
      state.settings.distanceFilter = 50 // 50 meters
      state.settings.backgroundTracking = false
      state.accuracy = 'low'
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

    // Reset state
    resetLocationState: (state) => {
      Object.assign(state, {
        ...initialState,
        hasPermission: state.hasPermission,
        permissionStatus: state.permissionStatus
      })
    }
  },

  extraReducers: (builder) => {
    // Get current location
    builder
      .addCase(getCurrentLocation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.loading = false
        locationSlice.caseReducers.updateCurrentLocation(state, action)
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to get location'
      })

    // Start location tracking
    builder
      .addCase(startLocationTracking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startLocationTracking.fulfilled, (state, action) => {
        state.loading = false
        state.isTracking = true
        state.stats.trackingStartTime = new Date().toISOString()
      })
      .addCase(startLocationTracking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to start tracking'
      })

    // Stop location tracking
    builder
      .addCase(stopLocationTracking.fulfilled, (state) => {
        state.isTracking = false
        state.loading = false
      })
      .addCase(stopLocationTracking.rejected, (state, action) => {
        state.error = action.payload || 'Failed to stop tracking'
        state.loading = false
      })
  }
})

export const {
  setPermissionStatus,
  setHasPermission,
  setLocationEnabled,
  setLocationTracking,
  updateCurrentLocation,
  setAccuracy,
  updateLocationSettings,
  setBackgroundTracking,
  toggleBackgroundTracking,
  setHighAccuracyMode,
  toggleHighAccuracyMode,
  setUpdateInterval,
  setDistanceFilter,
  setTimeout,
  setMaximumAge,
  toggleSpeedTracking,
  toggleHeadingTracking,
  addGeofence,
  removeGeofence,
  toggleGeofence,
  updateGeofence,
  checkGeofences,
  clearGeofences,
  clearLocationHistory,
  limitLocationHistory,
  resetLocationStats,
  setLastKnownLocation,
  enableEmergencyMode,
  disableEmergencyMode,
  enablePowerSavingMode,
  setError,
  clearError,
  setLoading,
  resetLocationState,
} = locationSlice.actions

export default locationSlice.reducer
