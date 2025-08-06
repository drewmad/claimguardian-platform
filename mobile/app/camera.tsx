/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Camera screen for capturing damage assessment photos with GPS and metadata"
 * @dependencies ["expo-camera", "expo-location", "expo-file-system"]
 * @status stable
 */

import { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import * as FileSystem from 'expo-file-system'
import { router, useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'

import { selectLocation, selectUser } from '../shared/store'
import { addToQueue } from '../shared/store/slices/syncSlice'
import type { Photo } from '../shared/types'

export default function CameraScreen() {
  const params = useLocalSearchParams<{
    assessment_id?: string
    damage_item_id?: string
    return_screen: string
  }>()
  
  const dispatch = useDispatch()
  const location = useSelector(selectLocation)
  const user = useSelector(selectUser)
  
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto')
  
  const cameraRef = useRef<CameraView>(null)

  useEffect(() => {
    requestPermission()
  }, [])

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permissions...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#9CA3AF" />
          <Text style={styles.message}>Camera access is required to capture damage photos</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'auto'
        case 'auto': return 'on'
        case 'on': return 'off'
        default: return 'auto'
      }
    })
  }

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return

    try {
      setIsCapturing(true)

      // Get current location if available
      let currentLocation = location.current
      if (!currentLocation && location.hasPermission) {
        try {
          const locationResult = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            maximumAge: 30000, // 30 seconds
          })
          currentLocation = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy || 0,
            timestamp: Date.now()
          }
        } catch (error) {
          console.warn('Failed to get location:', error)
        }
      }

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      })

      if (!photo) throw new Error('Failed to capture photo')

      // Generate unique filename
      const timestamp = new Date().toISOString()
      const filename = `damage_photo_${Date.now()}.jpg`
      
      // Create permanent file path
      const documentsDir = FileSystem.documentDirectory
      const permanentUri = `${documentsDir}photos/${filename}`
      
      // Ensure photos directory exists
      await FileSystem.makeDirectoryAsync(`${documentsDir}photos/`, { intermediates: true })
      
      // Move photo to permanent location
      await FileSystem.moveAsync({
        from: photo.uri,
        to: permanentUri
      })

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(permanentUri)
      
      // Create photo record
      const photoRecord: Photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assessment_id: params.assessment_id,
        damage_item_id: params.damage_item_id,
        local_uri: permanentUri,
        filename,
        file_size: fileInfo.size || 0,
        mime_type: 'image/jpeg',
        width: photo.width || 0,
        height: photo.height || 0,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        timestamp,
        upload_status: 'pending',
        created_at: timestamp,
        synced: false
      }

      // Add to sync queue
      dispatch(addToQueue({
        entity_type: 'photo',
        entity_id: photoRecord.id,
        operation: 'create',
        data: photoRecord
      }))

      // Navigate to photo review
      router.replace({
        pathname: '/photo-review',
        params: {
          uri: permanentUri,
          assessment_id: params.assessment_id,
          damage_item_id: params.damage_item_id,
        }
      })

    } catch (error) {
      console.error('Failed to capture photo:', error)
      Alert.alert(
        'Capture Failed', 
        'Failed to capture photo. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsCapturing(false)
    }
  }

  const handleClose = () => {
    if (params.return_screen === 'dashboard') {
      router.replace('/(tabs)/')
    } else {
      router.back()
    }
  }

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return 'flash'
      case 'off': return 'flash-off'
      case 'auto': return 'flash-auto'
      default: return 'flash-auto'
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <MaterialCommunityIcons name={getFlashIcon()} size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Capture Overlay */}
        <View style={styles.captureOverlay}>
          <View style={styles.viewfinder} />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.controlSpacer} />
          
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <MaterialCommunityIcons name="loading" size={32} color="white" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <MaterialCommunityIcons name="camera-flip" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons 
              name={location.current ? "map-marker" : "map-marker-off"} 
              size={16} 
              color={location.current ? "#10B981" : "#9CA3AF"} 
            />
            <Text style={styles.infoText}>
              {location.current ? "GPS Active" : "No GPS"}
            </Text>
          </View>
          
          {params.assessment_id && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clipboard-check" size={16} color="#3B82F6" />
              <Text style={styles.infoText}>Assessment Photo</Text>
            </View>
          )}
          
          {params.damage_item_id && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
              <Text style={styles.infoText}>Damage Item Photo</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  rightControls: {
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  captureOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlSpacer: {
    width: 50,
  },
  captureButton: {
    backgroundColor: 'white',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  infoBar: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
})