/**
 * Photo Review Screen for Mobile Damage Assessment
 * Advanced photo review with AI-powered damage analysis annotations
 */

import React, { useState, useRef, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'

// Redux
import { useAppDispatch, useAppSelector } from '@/store'
import { updatePhoto, deletePhoto, Photo, PhotoAnnotation } from '@/store/slices/photosSlice'

// Components
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { VoiceRecorder } from '@/components/audio/VoiceRecorder'

// Services
import { aiAnalysisService } from '@/services/aiAnalysisService'
import { syncService } from '@/services/syncService'

// Types
import { AssessmentPhoto } from '@/types/assessment'

interface PhotoReviewProps {
  photoId: string
  assessmentId?: string
  onClose?: () => void
  onNavigateToNext?: () => void
  onNavigateToPrevious?: () => void
}

interface DamageAnnotation {
  id: string
  x: number
  y: number
  width: number
  height: number
  damageType: string
  severity: 'low' | 'medium' | 'high' | 'severe'
  confidence: number
  description: string
  estimatedCost?: number
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export function PhotoReviewScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useAppDispatch()

  const { photoId, assessmentId } = route.params as { photoId: string; assessmentId?: string }

  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedAnnotation, setSelectedAnnotation] = useState<DamageAnnotation | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [imageScale, setImageScale] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [annotations, setAnnotations] = useState<DamageAnnotation[]>([])

  // Redux selectors
  const photo = useAppSelector(state => 
    state.photos.photos.find(p => p.id === photoId)
  )
  const isOffline = useAppSelector(state => state.network.isOffline)

  const scrollViewRef = useRef<ScrollView>(null)

  // Memoized values
  const imageAspectRatio = useMemo(() => {
    if (!photo?.metadata?.width || !photo?.metadata?.height) return 1
    return photo.metadata.width / photo.metadata.height
  }, [photo])

  const displayDimensions = useMemo(() => {
    const maxWidth = SCREEN_WIDTH - 32
    const maxHeight = SCREEN_HEIGHT * 0.6

    if (imageAspectRatio > maxWidth / maxHeight) {
      return {
        width: maxWidth,
        height: maxWidth / imageAspectRatio
      }
    } else {
      return {
        width: maxHeight * imageAspectRatio,
        height: maxHeight
      }
    }
  }, [imageAspectRatio])

  // Load photo data on mount
  React.useEffect(() => {
    if (photo?.notes) {
      setNotes(photo.notes)
    }
    if (photo?.analysis?.annotations) {
      setAnnotations(photo.analysis.annotations as DamageAnnotation[])
    }
  }, [photo])

  const handleAIAnalysis = useCallback(async () => {
    if (!photo) return

    setIsAnalyzing(true)
    try {
      const analysis = await aiAnalysisService.analyzeDamagePhoto({
        photoUri: photo.localUri || photo.uri,
        photoId: photo.id,
        assessmentId: assessmentId || '',
        options: {
          detectDamage: true,
          estimateCost: true,
          identifyMaterials: true,
          generateDescription: true
        }
      })

      // Update photo with analysis results
      const updatedPhoto: Photo = {
        ...photo,
        analysis: {
          ...photo.analysis,
          annotations: analysis.annotations,
          damageScore: analysis.damageScore,
          estimatedCost: analysis.estimatedCost,
          description: analysis.description,
          materials: analysis.materials,
          analyzedAt: new Date().toISOString()
        }
      }

      dispatch(updatePhoto(updatedPhoto))
      setAnnotations(analysis.annotations as DamageAnnotation[])

      // Queue for sync if offline
      if (isOffline) {
        await syncService.queuePhotoUpdate(updatedPhoto)
      }

      Alert.alert('Analysis Complete', 'AI damage analysis has been completed and annotations added.')

    } catch (error) {
      console.error('AI analysis failed:', error)
      Alert.alert('Analysis Failed', 'Could not complete AI damage analysis. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [photo, assessmentId, dispatch, isOffline])

  const handleSaveNotes = useCallback(async () => {
    if (!photo) return

    const updatedPhoto: Photo = {
      ...photo,
      notes,
      updatedAt: new Date().toISOString()
    }

    dispatch(updatePhoto(updatedPhoto))
    setShowNotesModal(false)

    // Queue for sync if offline
    if (isOffline) {
      await syncService.queuePhotoUpdate(updatedPhoto)
    }
  }, [photo, notes, dispatch, isOffline])

  const handleExportPhoto = useCallback(async () => {
    if (!photo) return

    try {
      // Create annotated version if annotations exist
      let exportUri = photo.localUri || photo.uri

      if (annotations.length > 0 && showAnnotations) {
        // TODO: Create annotated version with damage markers
        // This would involve drawing annotations on the image
        exportUri = await createAnnotatedImage(exportUri, annotations)
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Export Damage Assessment Photo'
        })
      } else {
        // Fallback to system share
        await Share.share({
          url: exportUri,
          title: 'Damage Assessment Photo'
        })
      }

    } catch (error) {
      console.error('Export failed:', error)
      Alert.alert('Export Failed', 'Could not export photo. Please try again.')
    }
  }, [photo, annotations, showAnnotations])

  const handleDeletePhoto = useCallback(() => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (photo) {
              dispatch(deletePhoto(photo.id))
              
              // Delete local file
              if (photo.localUri) {
                try {
                  await FileSystem.deleteAsync(photo.localUri, { idempotent: true })
                } catch (error) {
                  console.error('Failed to delete local photo:', error)
                }
              }

              // Queue deletion for sync if offline
              if (isOffline) {
                await syncService.queuePhotoDeletion(photo.id)
              }
            }
            navigation.goBack()
          }
        }
      ]
    )
  }, [photo, dispatch, navigation, isOffline])

  const handleAnnotationPress = useCallback((annotation: DamageAnnotation) => {
    setSelectedAnnotation(annotation)
  }, [])

  const handleVoiceRecordingComplete = useCallback(async (audioUri: string, transcript?: string) => {
    if (!photo) return

    const updatedPhoto: Photo = {
      ...photo,
      audioNotes: {
        uri: audioUri,
        transcript,
        duration: 0, // TODO: Get actual duration
        createdAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }

    dispatch(updatePhoto(updatedPhoto))
    setShowVoiceRecorder(false)

    // Queue for sync if offline
    if (isOffline) {
      await syncService.queuePhotoUpdate(updatedPhoto)
    }
  }, [photo, dispatch, isOffline])

  if (!photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="image-outline" size={64} color="#666" />
          <Text style={styles.errorText}>Photo not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Photo Review</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAnnotations(!showAnnotations)}
          >
            <Ionicons 
              name={showAnnotations ? "eye" : "eye-off"} 
              size={24} 
              color={showAnnotations ? "#4CAF50" : "#fff"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExportPhoto}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Photo Display */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.localUri || photo.uri }}
            style={[
              styles.image,
              {
                width: displayDimensions.width,
                height: displayDimensions.height
              }
            ]}
            contentFit="contain"
          />

          {/* Damage Annotations Overlay */}
          {showAnnotations && annotations.map((annotation) => (
            <TouchableOpacity
              key={annotation.id}
              style={[
                styles.annotationMarker,
                {
                  left: (annotation.x / 100) * displayDimensions.width,
                  top: (annotation.y / 100) * displayDimensions.height,
                  width: (annotation.width / 100) * displayDimensions.width,
                  height: (annotation.height / 100) * displayDimensions.height,
                  borderColor: getSeverityColor(annotation.severity)
                }
              ]}
              onPress={() => handleAnnotationPress(annotation)}
            >
              <View style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(annotation.severity) }
              ]}>
                <Text style={styles.severityText}>
                  {annotation.severity.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Analysis Loading Overlay */}
          {isAnalyzing && (
            <View style={styles.analysisOverlay}>
              <LoadingSpinner size="large" color="#4CAF50" />
              <Text style={styles.analysisText}>Analyzing damage...</Text>
            </View>
          )}
        </View>

        {/* Photo Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {new Date(photo.timestamp).toLocaleString()}
            </Text>
          </View>

          {photo.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {photo.analysis?.damageScore && (
            <View style={styles.infoRow}>
              <Ionicons name="analytics-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Damage Score: {(photo.analysis.damageScore * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {photo.analysis?.estimatedCost && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Estimated Cost: ${photo.analysis.estimatedCost.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="AI Analysis"
            onPress={handleAIAnalysis}
            disabled={isAnalyzing}
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            icon={<Ionicons name="scan" size={20} color="#fff" />}
          />

          <Button
            title="Add Notes"
            onPress={() => setShowNotesModal(true)}
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            icon={<Ionicons name="create-outline" size={20} color="#fff" />}
          />

          <Button
            title="Voice Notes"
            onPress={() => setShowVoiceRecorder(true)}
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            icon={<Ionicons name="mic-outline" size={20} color="#fff" />}
          />

          <Button
            title="Delete"
            onPress={handleDeletePhoto}
            style={[styles.actionButton, { backgroundColor: '#f44336' }]}
            icon={<Ionicons name="trash-outline" size={20} color="#fff" />}
          />
        </View>

        {/* Analysis Results */}
        {photo.analysis?.description && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>AI Analysis</Text>
            <Text style={styles.analysisDescription}>
              {photo.analysis.description}
            </Text>

            {photo.analysis.materials && photo.analysis.materials.length > 0 && (
              <View style={styles.materialsContainer}>
                <Text style={styles.materialsTitle}>Detected Materials:</Text>
                <View style={styles.materialsList}>
                  {photo.analysis.materials.map((material, index) => (
                    <View key={index} style={styles.materialChip}>
                      <Text style={styles.materialText}>{material}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Current Notes */}
        {notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Audio Notes */}
        {photo.audioNotes && (
          <View style={styles.audioNotesContainer}>
            <Text style={styles.audioNotesTitle}>Voice Notes</Text>
            <View style={styles.audioPlayer}>
              <Ionicons name="play-circle" size={32} color="#4CAF50" />
              <Text style={styles.audioDuration}>
                {Math.floor(photo.audioNotes.duration / 60)}:
                {String(photo.audioNotes.duration % 60).padStart(2, '0')}
              </Text>
            </View>
            {photo.audioNotes.transcript && (
              <Text style={styles.transcriptText}>
                {photo.audioNotes.transcript}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity onPress={handleSaveNotes}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this photo..."
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </SafeAreaView>
      </Modal>

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VoiceRecorder
          onComplete={handleVoiceRecordingComplete}
          onCancel={() => setShowVoiceRecorder(false)}
          enableTranscription={true}
        />
      </Modal>

      {/* Annotation Detail Modal */}
      <Modal
        visible={!!selectedAnnotation}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.annotationModal}>
          <View style={styles.annotationDetailContainer}>
            <TouchableOpacity
              style={styles.closeAnnotation}
              onPress={() => setSelectedAnnotation(null)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            {selectedAnnotation && (
              <>
                <Text style={styles.annotationTitle}>
                  {selectedAnnotation.damageType}
                </Text>
                
                <View style={styles.annotationStats}>
                  <View style={styles.annotationStat}>
                    <Text style={styles.annotationLabel}>Severity</Text>
                    <View style={[
                      styles.severityIndicator,
                      { backgroundColor: getSeverityColor(selectedAnnotation.severity) }
                    ]}>
                      <Text style={styles.severityIndicatorText}>
                        {selectedAnnotation.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.annotationStat}>
                    <Text style={styles.annotationLabel}>Confidence</Text>
                    <Text style={styles.annotationValue}>
                      {(selectedAnnotation.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>

                  {selectedAnnotation.estimatedCost && (
                    <View style={styles.annotationStat}>
                      <Text style={styles.annotationLabel}>Est. Cost</Text>
                      <Text style={styles.annotationValue}>
                        ${selectedAnnotation.estimatedCost.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.annotationDescription}>
                  {selectedAnnotation.description}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// Helper function to create annotated image
async function createAnnotatedImage(
  imageUri: string, 
  annotations: DamageAnnotation[]
): Promise<string> {
  // TODO: Implement image annotation overlay
  // This would use a library like react-native-canvas or similar
  // to draw annotations on top of the image
  return imageUri
}

// Helper function to get severity color
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return '#4CAF50'
    case 'medium': return '#FF9800'
    case 'high': return '#FF5722'
    case 'severe': return '#f44336'
    default: return '#666'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerButton: {
    padding: 8,
    borderRadius: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  content: {
    flex: 1
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative'
  },
  image: {
    borderRadius: 8
  },
  annotationMarker: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.1)'
  },
  severityBadge: {
    position: 'absolute',
    top: -12,
    left: -1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  analysisText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8
  },
  infoText: {
    fontSize: 14,
    color: '#ccc'
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8
  },
  analysisContainer: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  analysisDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12
  },
  materialsContainer: {
    marginTop: 12
  },
  materialsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8
  },
  materialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  materialChip: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  materialText: {
    fontSize: 12,
    color: '#ccc'
  },
  notesContainer: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  notesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20
  },
  audioNotesContainer: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16
  },
  audioNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  audioDuration: {
    fontSize: 14,
    color: '#ccc'
  },
  transcriptText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  modalCancel: {
    fontSize: 16,
    color: '#666'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  modalSave: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600'
  },
  notesInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'transparent',
    textAlignVertical: 'top'
  },
  annotationModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  annotationDetailContainer: {
    backgroundColor: '#fff',
    margin: 32,
    borderRadius: 12,
    padding: 24,
    maxWidth: 320,
    width: '100%'
  },
  closeAnnotation: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4
  },
  annotationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textTransform: 'capitalize'
  },
  annotationStats: {
    gap: 12,
    marginBottom: 16
  },
  annotationStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  annotationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  annotationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  severityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  severityIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  annotationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
})

export default PhotoReviewScreen