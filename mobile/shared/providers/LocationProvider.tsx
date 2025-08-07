/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Location services provider with GPS tracking and geofencing support"
 * @dependencies ["expo-location", "react-redux"]
 * @status stable
 */

import React, { useEffect, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import * as Location from 'expo-location'
import { useDispatch, useSelector } from 'react-redux'

import {
  setPermissionStatus,
  setLocationEnabled,
  updateCurrentLocation,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  enableEmergencyMode,
  setError,
  checkGeofences
} from '../store/slices/locationSlice'
import { selectLocation } from '../store'
import type { AppDispatch } from '../store'
import type { LocationData } from '../types'

interface LocationProviderProps {
  children: React.ReactNode
}

export function LocationProvider({ children }: LocationProviderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const locationState = useSelector(selectLocation)
  const watchPositionRef = useRef<Location.LocationSubscription | null>(null)
  const appStateRef = useRef<string>('active')

  // Initialize location services
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Check if location services are enabled
        const isLocationEnabled = await Location.hasServicesEnabledAsync()
        dispatch(setLocationEnabled(isLocationEnabled))

        if (!isLocationEnabled) {
          dispatch(setError('Location services are disabled on this device'))
          return
        }

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync()
        dispatch(setPermissionStatus(status as any))

        if (status !== 'granted') {
          dispatch(setError('Location permission denied'))

          // Show permission explanation
          Alert.alert(
            'Location Permission Required',
            'ClaimGuardian needs location access to add GPS data to damage photos and assessments.',
            [
              { text: 'Cancel' },
              {
                text: 'Settings',
                onPress: () => {
                  // In a real app, we'd open device settings
                  console.log('Open device settings')
                }
              }
            ]
          )
          return
        }

        // Get current location once
        dispatch(getCurrentLocation({ highAccuracy: true }))

        // Request background location permission if needed
        if (locationState.settings.backgroundTracking) {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
          if (backgroundStatus !== 'granted') {
            console.warn('Background location permission denied')
          }
        }

      } catch (error) {
        console.error('Failed to initialize location services:', error)
        dispatch(setError(error instanceof Error ? error.message : 'Failed to initialize location'))
      }
    }

    initializeLocation()
  }, [dispatch])

  // Handle location tracking
  useEffect(() => {
    const startTracking = async () => {
      if (!locationState.hasPermission || !locationState.isEnabled) {
        return
      }

      try {
        const locationOptions: Location.LocationOptions = {
          accuracy: locationState.settings.highAccuracyMode
            ? Location.Accuracy.BestForNavigation
            : Location.Accuracy.Balanced,
          timeInterval: locationState.settings.updateInterval,
          distanceInterval: locationState.settings.distanceFilter,
        }

        watchPositionRef.current = await Location.watchPositionAsync(
          locationOptions,
          (location) => {
            const locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitude: location.coords.altitude || undefined,
              accuracy: location.coords.accuracy || undefined,
              heading: location.coords.heading || undefined,
              speed: location.coords.speed || undefined,
              timestamp: location.timestamp
            }

            dispatch(updateCurrentLocation(locationData))
          }
        )

        dispatch(startLocationTracking())

      } catch (error) {
        console.error('Failed to start location tracking:', error)
        dispatch(setError(error instanceof Error ? error.message : 'Failed to start tracking'))
      }
    }

    const stopTracking = () => {
      if (watchPositionRef.current) {
        watchPositionRef.current.remove()
        watchPositionRef.current = null
        dispatch(stopLocationTracking())
      }
    }

    if (locationState.isTracking && locationState.hasPermission && locationState.isEnabled) {
      startTracking()
    } else if (!locationState.isTracking && watchPositionRef.current) {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
  }, [
    locationState.isTracking,
    locationState.hasPermission,
    locationState.isEnabled,
    locationState.settings.updateInterval,
    locationState.settings.distanceFilter,
    locationState.settings.highAccuracyMode,
    dispatch
  ])

  // Handle app state changes for background location
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      const currentState = appStateRef.current
      appStateRef.current = nextAppState

      if (nextAppState === 'background' && locationState.settings.backgroundTracking) {
        // App went to background, continue tracking if enabled
        console.log('Continuing location tracking in background')
      } else if (nextAppState === 'active' && currentState.match(/inactive|background/)) {
        // App came to foreground, refresh location
        if (locationState.hasPermission && locationState.isEnabled) {
          dispatch(getCurrentLocation({ highAccuracy: true }))
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [locationState.settings.backgroundTracking, locationState.hasPermission, locationState.isEnabled, dispatch])

  // Geofence monitoring
  useEffect(() => {
    if (locationState.current && locationState.geofences.length > 0) {
      dispatch(checkGeofences())
    }
  }, [locationState.current, locationState.geofences.length, dispatch])

  // Emergency mode detection (could be triggered by weather alerts)
  useEffect(() => {
    const checkEmergencyConditions = () => {
      // In a real implementation, this might be triggered by:
      // - Weather alerts
      // - Disaster notifications
      // - User manually enabling emergency mode
      // - Integration with emergency services

      // For now, we'll detect if user is in a hurricane-prone area during hurricane season
      if (locationState.current) {
        const { latitude, longitude } = locationState.current

        // Florida coordinates roughly
        const isInFlorida = latitude >= 24.5 && latitude <= 31 && longitude >= -87.5 && longitude <= -80
        const isHurricaneSeason = (() => {
          const month = new Date().getMonth() + 1
          return month >= 6 && month <= 11 // June through November
        })()

        if (isInFlorida && isHurricaneSeason) {
          // Could enable emergency mode during hurricane season in Florida
          // dispatch(enableEmergencyMode())
        }
      }
    }

    checkEmergencyConditions()
  }, [locationState.current, dispatch])

  // Location accuracy monitoring
  useEffect(() => {
    if (locationState.current && locationState.current.accuracy) {
      const accuracy = locationState.current.accuracy

      // Warn if GPS accuracy is poor (> 50 meters)
      if (accuracy > 50) {
        console.warn(`Poor GPS accuracy: ${accuracy.toFixed(1)}m`)

        // Could suggest user move to better location or enable high accuracy mode
        if (!locationState.settings.highAccuracyMode) {
          // Suggest enabling high accuracy mode
        }
      }
    }
  }, [locationState.current?.accuracy, locationState.settings.highAccuracyMode])

  // Battery optimization warnings
  useEffect(() => {
    if (locationState.settings.backgroundTracking && locationState.settings.highAccuracyMode) {
      // Warn about battery usage
      console.log('Background location tracking with high accuracy enabled - may affect battery life')
    }
  }, [locationState.settings.backgroundTracking, locationState.settings.highAccuracyMode])

  // Location data validation
  useEffect(() => {
    if (locationState.current) {
      const { latitude, longitude, accuracy } = locationState.current

      // Validate coordinates
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        dispatch(setError('Invalid GPS coordinates received'))
        return
      }

      // Check if coordinates seem reasonable (not null island - 0,0)
      if (latitude === 0 && longitude === 0) {
        dispatch(setError('GPS returned invalid coordinates'))
        return
      }

      // Clear any previous errors if location looks good
      if (accuracy && accuracy < 20) { // Good accuracy
        dispatch(setError(null))
      }
    }
  }, [locationState.current, dispatch])

  // Periodic location refresh when app is active
  useEffect(() => {
    if (!locationState.hasPermission || !locationState.isEnabled) return

    const refreshInterval = setInterval(() => {
      if (AppState.currentState === 'active' && !locationState.isTracking) {
        // Refresh location every 5 minutes when not actively tracking
        dispatch(getCurrentLocation({ highAccuracy: false }))
      }
    }, 300000) // 5 minutes

    return () => clearInterval(refreshInterval)
  }, [locationState.hasPermission, locationState.isEnabled, locationState.isTracking, dispatch])

  return <>{children}</>
}
