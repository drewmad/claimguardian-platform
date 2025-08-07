/**
 * Voice Recording Component for Mobile Damage Assessment
 * Advanced voice recording with real-time transcription and audio processing
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'

// Redux
import { useAppSelector } from '@/store'

// Services
import { transcriptionService } from '@/services/transcriptionService'
import { audioProcessingService } from '@/services/audioProcessingService'

// Components
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface VoiceRecorderProps {
  onComplete: (audioUri: string, transcript?: string, metadata?: AudioMetadata) => void
  onCancel: () => void
  enableTranscription?: boolean
  enableNoiseReduction?: boolean
  maxDuration?: number // seconds
  quality?: 'low' | 'medium' | 'high'
  autoSave?: boolean
}

interface AudioMetadata {
  duration: number
  fileSize: number
  format: string
  sampleRate: number
  bitRate: number
  channels: number
  createdAt: string
  location?: {
    latitude: number
    longitude: number
  }
}

interface TranscriptionResult {
  text: string
  confidence: number
  segments: Array<{
    start: number
    end: number
    text: string
    confidence: number
  }>
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const WAVEFORM_BARS = 40
const MAX_RECORDING_TIME = 300 // 5 minutes default

export function VoiceRecorder({
  onComplete,
  onCancel,
  enableTranscription = true,
  enableNoiseReduction = true,
  maxDuration = MAX_RECORDING_TIME,
  quality = 'medium',
  autoSave = true
}: VoiceRecorderProps) {
  // State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioUri, setAudioUri] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>(Array(WAVEFORM_BARS).fill(0))
  const [audioLevel, setAudioLevel] = useState(0)

  // Redux
  const isOffline = useAppSelector(state => state.network.isOffline)
  const userLocation = useAppSelector(state => state.location.currentLocation)

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const durationTimer = useRef<NodeJS.Timeout | null>(null)
  const waveformAnimation = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current

  // Audio configuration based on quality
  const recordingOptions = useMemo(() => {
    const baseOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        numberOfChannels: 1,
        bitRate: quality === 'high' ? 128000 : quality === 'medium' ? 64000 : 32000,
        sampleRate: quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 16000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: quality === 'high'
          ? Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX
          : quality === 'medium'
          ? Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM
          : Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW,
        sampleRate: quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 16000,
        numberOfChannels: 1,
        bitRate: quality === 'high' ? 128000 : quality === 'medium' ? 64000 : 32000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    }

    return baseOptions
  }, [quality])

  // Initialize audio permissions and settings
  useEffect(() => {
    Audio.requestPermissionsAsync()
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    })

    return () => {
      cleanup()
    }
  }, [])

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    } else {
      if (durationTimer.current) {
        clearInterval(durationTimer.current)
        durationTimer.current = null
      }
    }

    return () => {
      if (durationTimer.current) {
        clearInterval(durationTimer.current)
      }
    }
  }, [isRecording, maxDuration])

  // Waveform animation
  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        Animated.timing(waveformAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        }).start(() => {
          waveformAnimation.setValue(0)
          if (isRecording) {
            animate()
          }
        })
      }
      animate()

      // Pulse animation for recording indicator
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ]).start(() => {
          if (isRecording) {
            pulse()
          }
        })
      }
      pulse()
    }
  }, [isRecording])

  // Simulate waveform data (in production, this would come from actual audio analysis)
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const newWaveformData = Array(WAVEFORM_BARS).fill(0).map(() =>
          Math.random() * (audioLevel + 0.1)
        )
        setWaveformData(newWaveformData)

        // Simulate audio level from microphone
        setAudioLevel(Math.random() * 0.8 + 0.2)
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isRecording, audioLevel])

  const startRecording = useCallback(async () => {
    try {
      // Check permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio.')
        return
      }

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(recordingOptions)
      recordingRef.current = recording

      setIsRecording(true)
      setRecordingDuration(0)
      setAudioLevel(0)

    } catch (error) {
      console.error('Failed to start recording:', error)
      Alert.alert('Recording Error', 'Could not start audio recording. Please try again.')
    }
  }, [recordingOptions])

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return

      setIsRecording(false)

      await recordingRef.current.stopAndUnloadAsync()
      const uri = recordingRef.current.getURI()

      if (uri) {
        setAudioUri(uri)

        // Get audio file info
        const fileInfo = await FileSystem.getInfoAsync(uri)
        const audioInfo = await Audio.Sound.createAsync({ uri })
        const status = await audioInfo.sound.getStatusAsync()

        if (status.isLoaded) {
          setTotalDuration(status.durationMillis ? status.durationMillis / 1000 : 0)
        }

        audioInfo.sound.unloadAsync()

        // Start transcription if enabled and online
        if (enableTranscription && !isOffline) {
          transcribeAudio(uri)
        }

        // Process audio if noise reduction is enabled
        if (enableNoiseReduction) {
          try {
            const processedUri = await audioProcessingService.reduceNoise(uri, {
              strength: 0.5,
              preserveQuality: quality === 'high'
            })
            setAudioUri(processedUri)
          } catch (error) {
            console.warn('Audio processing failed, using original:', error)
          }
        }
      }

      recordingRef.current = null

    } catch (error) {
      console.error('Failed to stop recording:', error)
      Alert.alert('Recording Error', 'Could not stop recording properly.')
    }
  }, [enableTranscription, enableNoiseReduction, isOffline, quality])

  const transcribeAudio = useCallback(async (uri: string) => {
    setIsTranscribing(true)
    try {
      const result = await transcriptionService.transcribeAudio({
        audioUri: uri,
        language: 'en-US',
        includeTimestamps: true,
        includeConfidence: true
      })

      setTranscription(result)

    } catch (error) {
      console.error('Transcription failed:', error)
      Alert.alert('Transcription Failed', 'Could not transcribe audio. The recording will still be saved.')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const playAudio = useCallback(async () => {
    try {
      if (!audioUri) return

      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync()
          setIsPlaying(false)
        } else {
          await soundRef.current.playAsync()
          setIsPlaying(true)
        }
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, isLooping: false }
        )

        soundRef.current = sound
        setIsPlaying(true)

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis ? status.positionMillis / 1000 : 0)

            if (status.didJustFinish) {
              setIsPlaying(false)
              setPlaybackPosition(0)
              sound.unloadAsync()
              soundRef.current = null
            }
          }
        })
      }

    } catch (error) {
      console.error('Playback failed:', error)
      Alert.alert('Playback Error', 'Could not play the recording.')
    }
  }, [audioUri, isPlaying])

  const handleComplete = useCallback(async () => {
    if (!audioUri) return

    try {
      // Get audio metadata
      const fileInfo = await FileSystem.getInfoAsync(audioUri)
      const metadata: AudioMetadata = {
        duration: totalDuration,
        fileSize: fileInfo.size || 0,
        format: 'm4a',
        sampleRate: recordingOptions.ios.sampleRate,
        bitRate: recordingOptions.ios.bitRate,
        channels: recordingOptions.ios.numberOfChannels,
        createdAt: new Date().toISOString(),
        location: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        } : undefined
      }

      // Auto-save to permanent location if enabled
      let finalUri = audioUri
      if (autoSave) {
        const documentsDir = FileSystem.documentDirectory + 'audio/'
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true })

        const fileName = `voice_note_${Date.now()}.m4a`
        const permanentUri = documentsDir + fileName

        await FileSystem.moveAsync({
          from: audioUri,
          to: permanentUri
        })

        finalUri = permanentUri
      }

      onComplete(finalUri, transcription?.text, metadata)

    } catch (error) {
      console.error('Failed to complete recording:', error)
      Alert.alert('Save Error', 'Could not save the recording properly.')
    }
  }, [audioUri, totalDuration, transcription, userLocation, autoSave, recordingOptions, onComplete])

  const handleCancel = useCallback(async () => {
    await cleanup()
    onCancel()
  }, [onCancel])

  const cleanup = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync()
        recordingRef.current = null
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      if (durationTimer.current) {
        clearInterval(durationTimer.current)
        durationTimer.current = null
      }

      // Clean up temporary audio file
      if (audioUri && !autoSave) {
        try {
          await FileSystem.deleteAsync(audioUri, { idempotent: true })
        } catch (error) {
          console.warn('Could not delete temporary audio file:', error)
        }
      }

    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }, [audioUri, autoSave])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Voice Notes</Text>

        {audioUri && (
          <TouchableOpacity onPress={handleComplete}>
            <Text style={[styles.headerButton, styles.saveButton]}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Recording Status */}
        <View style={styles.statusContainer}>
          {isRecording && (
            <Animated.View style={[
              styles.recordingIndicator,
              { transform: [{ scale: pulseAnimation }] }
            ]}>
              <View style={styles.recordingDot} />
            </Animated.View>
          )}

          <Text style={styles.statusText}>
            {isRecording
              ? 'Recording...'
              : audioUri
              ? 'Recording Complete'
              : 'Ready to Record'
            }
          </Text>

          <Text style={styles.durationText}>
            {formatDuration(isRecording ? recordingDuration : totalDuration)}
          </Text>

          {maxDuration > 0 && (
            <Text style={styles.maxDurationText}>
              Max: {formatDuration(maxDuration)}
            </Text>
          )}
        </View>

        {/* Waveform Visualization */}
        <View style={styles.waveformContainer}>
          {waveformData.map((amplitude, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, amplitude * 80),
                  backgroundColor: isRecording ? '#4CAF50' : '#666',
                  opacity: waveformAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })
                }
              ]}
            />
          ))}
        </View>

        {/* Audio Level Indicator */}
        {isRecording && (
          <View style={styles.audioLevelContainer}>
            <Text style={styles.audioLevelLabel}>Level</Text>
            <View style={styles.audioLevelBar}>
              <View
                style={[
                  styles.audioLevelFill,
                  {
                    width: `${audioLevel * 100}%`,
                    backgroundColor: audioLevel > 0.8 ? '#f44336' : audioLevel > 0.5 ? '#FF9800' : '#4CAF50'
                  }
                ]}
              />
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!audioUri ? (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={playAudio}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(playbackPosition / totalDuration) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {formatDuration(playbackPosition)} / {formatDuration(totalDuration)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.rerecordButton}
                onPress={() => {
                  setAudioUri(null)
                  setTranscription(null)
                  setRecordingDuration(0)
                  setTotalDuration(0)
                  setPlaybackPosition(0)
                }}
              >
                <Ionicons name="refresh" size={24} color="#FF9800" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Transcription */}
        {enableTranscription && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionTitle}>Transcription</Text>

            {isTranscribing && (
              <View style={styles.transcriptionLoading}>
                <LoadingSpinner size="small" color="#4CAF50" />
                <Text style={styles.transcriptionLoadingText}>
                  {isOffline ? 'Will transcribe when online' : 'Transcribing audio...'}
                </Text>
              </View>
            )}

            {transcription && (
              <View style={styles.transcriptionResult}>
                <Text style={styles.transcriptionText}>{transcription.text}</Text>
                <Text style={styles.transcriptionConfidence}>
                  Confidence: {(transcription.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            )}

            {!transcription && !isTranscribing && audioUri && isOffline && (
              <Text style={styles.transcriptionOffline}>
                Transcription will be available when you're back online
              </Text>
            )}
          </View>
        )}

        {/* Recording Tips */}
        {!isRecording && !audioUri && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Recording Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>• Hold device 6-8 inches from your mouth</Text>
              <Text style={styles.tip}>• Speak clearly and at normal volume</Text>
              <Text style={styles.tip}>• Find a quiet location to minimize background noise</Text>
              <Text style={styles.tip}>• Describe damage details, locations, and observations</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerButton: {
    fontSize: 16,
    color: '#666'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  saveButton: {
    color: '#4CAF50',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 20
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8
  },
  durationText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#4CAF50',
    fontFamily: 'monospace'
  },
  maxDurationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    marginBottom: 32,
    gap: 2
  },
  waveformBar: {
    width: (SCREEN_WIDTH - 80) / WAVEFORM_BARS,
    borderRadius: 1,
    minHeight: 4
  },
  audioLevelContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  audioLevelLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  audioLevelBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden'
  },
  audioLevelFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.1s ease'
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  recordButtonActive: {
    backgroundColor: '#f44336'
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 16
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressContainer: {
    flex: 1
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50'
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  rerecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center'
  },
  transcriptionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12
  },
  transcriptionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  transcriptionLoadingText: {
    fontSize: 14,
    color: '#666'
  },
  transcriptionResult: {
    gap: 8
  },
  transcriptionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22
  },
  transcriptionConfidence: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'right'
  },
  transcriptionOffline: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16
  },
  tipsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12
  },
  tipsList: {
    gap: 8
  },
  tip: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20
  }
})

export default VoiceRecorder
