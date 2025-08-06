/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Camera provider for permission management and settings initialization"
 * @dependencies ["expo-camera", "react-redux"]
 * @status stable
 */

import React, { useEffect } from 'react'
import { Alert, Linking } from 'react-native'
import { Camera } from 'expo-camera'
import { useDispatch, useSelector } from 'react-redux'

import {
  initializeCamera,
  setPermissionStatus,
  setCameraAvailable,
  setSupportedRatios,
  setSupportedResolutions,
  setError,
  recordCaptureAttempt
} from '../store/slices/cameraSlice'
import { selectCamera } from '../store'
import type { AppDispatch } from '../store'

interface CameraProviderProps {
  children: React.ReactNode
}

export function CameraProvider({ children }: CameraProviderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const cameraState = useSelector(selectCamera)

  // Initialize camera permissions and capabilities
  useEffect(() => {
    const initializeCameraServices = async () => {
      try {
        // Check if camera is available on device
        const isAvailable = await Camera.isAvailableAsync()
        dispatch(setCameraAvailable(isAvailable))

        if (!isAvailable) {
          dispatch(setError('Camera is not available on this device'))
          return
        }

        // Request camera permissions
        const { status } = await Camera.requestCameraPermissionsAsync()
        dispatch(setPermissionStatus(status as any))

        if (status !== 'granted') {
          dispatch(setError('Camera permission denied'))
          
          // Show permission explanation
          Alert.alert(
            'Camera Permission Required',
            'ClaimGuardian needs camera access to capture damage photos for insurance assessments.',
            [
              { text: 'Cancel' },
              { 
                text: 'Settings', 
                onPress: () => {
                  Linking.openSettings()
                }
              }
            ]
          )
          return
        }

        // Get camera capabilities
        try {
          const supportedRatios = await Camera.getSupportedRatiosAsync()
          const supportedResolutions = [] // Camera.getSupportedResolutionsAsync() might not be available
          
          dispatch(setSupportedRatios(supportedRatios || []))
          dispatch(setSupportedResolutions(supportedResolutions))
        } catch (capabilityError) {
          console.warn('Could not get camera capabilities:', capabilityError)
          // Continue without capabilities - not critical
        }

        // Initialize camera state
        dispatch(initializeCamera({
          hasPermission: status === 'granted',
          supportedRatios: [],
          supportedResolutions: []
        }))

        dispatch(setError(null))

      } catch (error) {
        console.error('Failed to initialize camera services:', error)
        dispatch(setError(error instanceof Error ? error.message : 'Failed to initialize camera'))
      }
    }

    initializeCameraServices()
  }, [dispatch])

  // Handle permission changes
  useEffect(() => {
    if (cameraState.permissionStatus === 'denied') {
      // Could show a persistent notification or guide user to settings
      console.log('Camera permission denied - some features will be limited')
    }
  }, [cameraState.permissionStatus])

  // Monitor camera performance
  useEffect(() => {
    const monitorCameraPerformance = () => {
      // Log camera statistics for monitoring
      const { successfulCaptures, failedCaptures, totalPhotos } = cameraState.captureStats
      
      if (totalPhotos > 0) {
        const successRate = (successfulCaptures / totalPhotos) * 100
        console.log(`Camera success rate: ${successRate.toFixed(1)}%`)
        
        // Alert if success rate is low
        if (totalPhotos >= 10 && successRate < 80) {
          console.warn('Low camera success rate detected')
          
          Alert.alert(
            'Camera Performance Issue',
            'Some photos may not be capturing properly. Try restarting the app or check your device storage.',
            [{ text: 'OK' }]
          )
        }
      }
    }

    // Check performance every 20 captures
    if (cameraState.captureStats.totalPhotos > 0 && cameraState.captureStats.totalPhotos % 20 === 0) {
      monitorCameraPerformance()
    }
  }, [cameraState.captureStats.totalPhotos])

  // Handle storage warnings
  useEffect(() => {
    const checkStorageSpace = async () => {
      // In a real implementation, we'd check available storage
      // For now, just simulate checking
      
      // Could use expo-file-system to check available space
      // const storageInfo = await FileSystem.getFreeDiskStorageAsync()
      
      // Warn if storage is low (< 100MB for example)
      // if (storageInfo < 100 * 1024 * 1024) {
      //   Alert.alert(
      //     'Low Storage',
      //     'Device storage is running low. Photos may not save properly.',
      //     [{ text: 'OK' }]
      //   )
      // }
    }

    // Check storage periodically
    const storageCheckInterval = setInterval(checkStorageSpace, 300000) // Every 5 minutes

    return () => clearInterval(storageCheckInterval)
  }, [])

  // Camera quality optimization based on device capabilities
  useEffect(() => {
    if (cameraState.supportedResolutions.length > 0) {
      // Could automatically optimize camera quality based on available resolutions
      // This helps balance file size vs quality for different devices
      console.log('Available camera resolutions:', cameraState.supportedResolutions)
    }
  }, [cameraState.supportedResolutions])

  // Error recovery
  useEffect(() => {
    if (cameraState.error) {
      // Attempt to recover from camera errors
      const attemptRecovery = () => {
        if (cameraState.error?.includes('permission')) {
          // Permission error - can't auto-recover
          return
        }
        
        if (cameraState.error?.includes('not available')) {
          // Device doesn't have camera - can't recover
          return
        }

        // For other errors, try clearing error after 5 seconds
        setTimeout(() => {
          dispatch(setError(null))
        }, 5000)
      }

      attemptRecovery()
    }
  }, [cameraState.error, dispatch])

  // Performance optimization tips
  useEffect(() => {
    const provideOptimizationTips = () => {
      const { averageCaptureTime, failedCaptures, totalPhotos } = cameraState.captureStats
      
      if (averageCaptureTime > 3000) { // More than 3 seconds average
        console.log('Camera capture time is slow - consider lowering quality setting')
      }
      
      if (totalPhotos > 5 && (failedCaptures / totalPhotos) > 0.1) { // More than 10% failure rate
        console.log('High camera failure rate - check device storage and restart app if needed')
      }
    }

    // Provide tips periodically
    if (cameraState.captureStats.totalPhotos > 10) {
      provideOptimizationTips()
    }
  }, [cameraState.captureStats])

  // Disaster mode optimizations
  useEffect(() => {
    const optimizeForEmergency = () => {
      // In emergency situations, prioritize reliability over quality
      // This could be triggered by weather alerts or user settings
      
      // For now, just log that we could optimize for emergency
      console.log('Camera ready for emergency mode optimization if needed')
    }

    optimizeForEmergency()
  }, [])

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, clear any camera errors
        if (cameraState.error && !cameraState.error.includes('permission')) {
          dispatch(setError(null))
        }
      }
    }

    // Note: In a real implementation, we'd use AppState from react-native
    // For now, just set up the handler structure

    return () => {
      // Cleanup if needed
    }
  }, [cameraState.error, dispatch])

  return <>{children}</>
}