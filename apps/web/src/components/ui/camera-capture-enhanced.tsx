/**
 * @fileMetadata
 * @purpose "Enhanced camera capture component with real-time preview and AI processing"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/notifications"]
 * @exports ["CameraCaptureEnhanced", "CameraPreview", "CaptureMode"]
 * @complexity high
 * @tags ["ui", "camera", "capture", "ai", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Video,
  Square,
  Circle,
  RotateCcw,
  Download,
  Trash2,
  Zap,
  Eye,
  Settings,
  Grid3x3,
  ZapOff,
  Zap as Flash,
  CameraOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Maximize,
  Minimize,
  Play,
  Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/notifications/toast-system'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

export type CaptureMode = 'photo' | 'video'
export type CameraFacing = 'user' | 'environment'
export type CaptureQuality = 'low' | 'medium' | 'high'

interface CameraConstraints {
  width: { ideal: number; max: number }
  height: { ideal: number; max: number }
  facingMode: CameraFacing
  frameRate?: { ideal: number }
}

interface CapturedMedia {
  id: string
  type: CaptureMode
  blob: Blob
  url: string
  thumbnail: string
  timestamp: Date
  size: string
  dimensions?: { width: number; height: number }
  duration?: number
  aiAnalysis?: any
}

interface CameraCaptureEnhancedProps {
  mode?: CaptureMode
  onCapture?: (media: CapturedMedia) => void
  onError?: (error: string) => void
  maxCaptures?: number
  quality?: CaptureQuality
  enableAI?: boolean
  autoAnalyze?: boolean
  showGrid?: boolean
  allowModeSwitch?: boolean
  className?: string
}

export function CameraCaptureEnhanced({
  mode = 'photo',
  onCapture,
  onError,
  maxCaptures = 10,
  quality = 'high',
  enableAI = true,
  autoAnalyze = false,
  showGrid = true,
  allowModeSwitch = true,
  className
}: CameraCaptureEnhancedProps) {
  const [currentMode, setCurrentMode] = useState<CaptureMode>(mode)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [captures, setCaptures] = useState<CapturedMedia[]>([])
  const [selectedCapture, setSelectedCapture] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const { success, error: showError, info } = useToast()

  // Camera constraints based on quality setting
  const getCameraConstraints = useCallback((): CameraConstraints => {
    const constraints: Record<CaptureQuality, CameraConstraints> = {
      low: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: facing
      },
      medium: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: facing,
        frameRate: { ideal: 30 }
      },
      high: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        facingMode: facing,
        frameRate: { ideal: 30 }
      }
    }

    return constraints[quality]
  }, [facing, quality])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)

      const constraints = {
        video: getCameraConstraints(),
        audio: currentMode === 'video'
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreamActive(true)

        success('Camera activated', {
          subtitle: `Ready to capture ${currentMode}s`
        })
      }

      logger.track('camera_started', {
        mode: currentMode,
        facing,
        quality
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(errorMessage)
      onError?.(errorMessage)

      showError('Camera access failed', {
        subtitle: errorMessage
      })

      logger.error('Camera start failed', { mode: currentMode, facing }, err as Error)
    }
  }, [currentMode, facing, quality, getCameraConstraints, onError, success, showError])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreamActive(false)
    setIsRecording(false)
  }, [])

  // Switch camera facing
  const switchCamera = useCallback(async () => {
    const newFacing: CameraFacing = facing === 'user' ? 'environment' : 'user'
    setFacing(newFacing)

    if (isStreamActive) {
      stopCamera()
      // Small delay to ensure cleanup
      setTimeout(() => {
        setFacing(newFacing)
        startCamera()
      }, 100)
    }
  }, [facing, isStreamActive, stopCamera, startCamera])

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) return

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.3)

        const capture: CapturedMedia = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'photo',
          blob,
          url,
          thumbnail,
          timestamp: new Date(),
          size: formatFileSize(blob.size),
          dimensions: { width: canvas.width, height: canvas.height }
        }

        setCaptures(prev => [...prev, capture])
        setSelectedCapture(capture.id)
        onCapture?.(capture)

        success('Photo captured!', {
          subtitle: enableAI && autoAnalyze ? 'Starting AI analysis...' : 'Photo saved'
        })

        // Auto-analyze if enabled
        if (enableAI && autoAnalyze) {
          setTimeout(() => analyzeMedia(capture), 500)
        }

        logger.track('photo_captured', {
          dimensions: `${canvas.width}x${canvas.height}`,
          fileSize: blob.size,
          facing
        })

      }, 'image/jpeg', 0.9)

    } catch (err) {
      showError('Capture failed', {
        subtitle: 'Failed to capture photo'
      })
      logger.error('Photo capture failed', {}, err as Error)
    }
  }, [isStreamActive, onCapture, enableAI, autoAnalyze, success, showError, facing])

  // Start/stop video recording
  const toggleVideoRecording = useCallback(async () => {
    if (!isStreamActive || !streamRef.current) return

    try {
      if (!isRecording) {
        // Start recording
        recordedChunksRef.current = []

        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp9'
        })

        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)

          // Create thumbnail from video
          const thumbnail = await createVideoThumbnail(url)

          const capture: CapturedMedia = {
            id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'video',
            blob,
            url,
            thumbnail,
            timestamp: new Date(),
            size: formatFileSize(blob.size),
            duration: (Date.now() - recordingStartTime) / 1000
          }

          setCaptures(prev => [...prev, capture])
          setSelectedCapture(capture.id)
          onCapture?.(capture)

          success('Video recorded!', {
            subtitle: `Duration: ${Math.round(capture.duration!)}s`
          })

          logger.track('video_recorded', {
            duration: capture.duration,
            fileSize: blob.size,
            facing
          })
        }

        const recordingStartTime = Date.now()
        mediaRecorder.start()
        setIsRecording(true)

        info('Recording started', {
          subtitle: 'Tap the record button again to stop'
        })

      } else {
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
      }

    } catch (err) {
      showError('Recording failed', {
        subtitle: 'Failed to record video'
      })
      logger.error('Video recording failed', {}, err as Error)
    }
  }, [isStreamActive, isRecording, onCapture, success, info, showError, facing])

  // Analyze media with AI
  const analyzeMedia = useCallback(async (media: CapturedMedia) => {
    if (!enableAI) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate AI analysis with progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 150))
        setAnalysisProgress(progress)
      }

      // Mock AI results
      const aiAnalysis = {
        confidence: Math.floor(Math.random() * 20) + 80,
        detectedObjects: ['damage', 'structure', 'debris'],
        damageAssessment: {
          severity: 'moderate',
          type: 'water damage',
          affectedArea: 'floor and walls'
        },
        recommendations: [
          'Document from multiple angles',
          'Include reference objects for scale',
          'Capture close-up details'
        ]
      }

      // Update capture with AI results
      setCaptures(prev => prev.map(capture =>
        capture.id === media.id
          ? { ...capture, aiAnalysis }
          : capture
      ))

      success('AI analysis complete!', {
        subtitle: `Confidence: ${aiAnalysis.confidence}%`,
        actions: [{
          label: 'View Results',
          onClick: () => setSelectedCapture(media.id)
        }]
      })

      logger.track('media_analyzed', {
        mediaType: media.type,
        confidence: aiAnalysis.confidence,
        detectedObjects: aiAnalysis.detectedObjects.length
      })

    } catch (err) {
      showError('Analysis failed', {
        subtitle: 'AI analysis could not be completed'
      })
      logger.error('Media analysis failed', { mediaId: media.id }, err as Error)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }, [enableAI, success, showError])

  // Delete capture
  const deleteCapture = useCallback((captureId: string) => {
    setCaptures(prev => {
      const updated = prev.filter(c => c.id !== captureId)

      // Cleanup blob URL
      const capture = prev.find(c => c.id === captureId)
      if (capture) {
        URL.revokeObjectURL(capture.url)
      }

      return updated
    })

    if (selectedCapture === captureId) {
      setSelectedCapture(null)
    }

    info('Capture deleted')
  }, [selectedCapture, info])

  // Download capture
  const downloadCapture = useCallback((capture: CapturedMedia) => {
    const link = document.createElement('a')
    link.href = capture.url
    link.download = `${capture.type}-${capture.timestamp.toISOString()}.${capture.type === 'photo' ? 'jpg' : 'webm'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    success('Download started', {
      subtitle: `Saving ${capture.type} to device`
    })
  }, [success])

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      captures.forEach(capture => {
        URL.revokeObjectURL(capture.url)
      })
    }
  }, [captures])

  return (
    <div className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
      {/* Camera View */}
      <div className={cn(
        "relative",
        isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
      )}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Grid overlay */}
        {showGrid && isStreamActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-sm">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="link"
                  size="sm"
                  onClick={startCamera}
                  className="ml-2 h-auto p-0 text-red-300"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* AI Analysis overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <h4 className="font-medium mb-2">AI Analysis in Progress</h4>
              <Progress value={analysisProgress} className="w-48 mx-auto mb-2" />
              <p className="text-sm text-gray-300">{analysisProgress}% complete</p>
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full"
          >
            <Circle className="w-3 h-3 fill-white" />
            <span className="text-white text-sm font-medium">REC</span>
          </motion.div>
        )}

        {/* Top controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {/* Mode selector */}
          {allowModeSwitch && (
            <div className="flex bg-black/50 rounded-full p-1">
              <Button
                variant={currentMode === 'photo' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('photo')}
                className="rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                variant={currentMode === 'video' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('video')}
                className="rounded-full"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Capture button */}
          <Button
            size="lg"
            onClick={currentMode === 'photo' ? capturePhoto : toggleVideoRecording}
            disabled={!isStreamActive}
            className={cn(
              "w-16 h-16 rounded-full border-4 border-white",
              currentMode === 'photo'
                ? "bg-white hover:bg-gray-100"
                : isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-white hover:bg-gray-100"
            )}
          >
            {currentMode === 'photo' ? (
              <Circle className="w-8 h-8 text-black" />
            ) : isRecording ? (
              <Square className="w-8 h-8 text-white fill-white" />
            ) : (
              <Circle className="w-8 h-8 text-red-600 fill-red-600" />
            )}
          </Button>

          {/* Switch camera */}
          <Button
            variant="ghost"
            size="sm"
            onClick={switchCamera}
            disabled={!isStreamActive}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Captures grid */}
      {captures.length > 0 && (
        <div className="p-4 bg-gray-900">
          <h4 className="text-white font-medium mb-3">
            Captures ({captures.length}/{maxCaptures})
          </h4>

          <div className="grid grid-cols-4 gap-2">
            {captures.map((capture) => (
              <div
                key={capture.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                  selectedCapture === capture.id
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent hover:border-white/30"
                )}
                onClick={() => setSelectedCapture(capture.id)}
              >
                <img
                  src={capture.thumbnail}
                  alt={`${capture.type} capture`}
                  className="w-full h-full object-cover"
                />

                {/* Type indicator */}
                <div className="absolute top-1 left-1">
                  <Badge variant="secondary" className="text-xs">
                    {capture.type === 'photo' ? <Camera className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                  </Badge>
                </div>

                {/* AI indicator */}
                {capture.aiAnalysis && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="default" className="bg-blue-500 text-xs">
                      <Zap className="w-3 h-3" />
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="absolute bottom-1 right-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadCapture(capture)
                    }}
                    className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                  >
                    <Download className="w-3 h-3 text-white" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCapture(capture.id)
                    }}
                    className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected capture details */}
      <AnimatePresence>
        {selectedCapture && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-0 bg-gray-900/95 backdrop-blur-sm p-4"
          >
            {(() => {
              const capture = captures.find(c => c.id === selectedCapture)
              if (!capture) return null

              return (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        {capture.type === 'photo' ? 'Photo' : 'Video'} Details
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {capture.timestamp.toLocaleString()} • {capture.size}
                        {capture.dimensions && ` • ${capture.dimensions.width}x${capture.dimensions.height}`}
                        {capture.duration && ` • ${Math.round(capture.duration)}s`}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCapture(null)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* AI Analysis results */}
                  {capture.aiAnalysis && (
                    <div className="bg-blue-900/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 font-medium">AI Analysis</span>
                        <Badge variant="outline" className="text-blue-300 border-blue-400">
                          {capture.aiAnalysis.confidence}% confidence
                        </Badge>
                      </div>

                      <div className="text-sm text-blue-200 space-y-1">
                        <p>Damage Type: {capture.aiAnalysis.damageAssessment.type}</p>
                        <p>Severity: {capture.aiAnalysis.damageAssessment.severity}</p>
                        <p>Detected: {capture.aiAnalysis.detectedObjects.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {enableAI && !capture.aiAnalysis && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeMedia(capture)}
                        disabled={isAnalyzing}
                        className="text-white border-white/30 hover:bg-white/10"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Analyze with AI
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCapture(capture)}
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper functions
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

async function createVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    video.addEventListener('loadeddata', () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    })

    video.src = videoUrl
  })
}
