'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, CameraOff, RefreshCw, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { cameraLogger } from '@/lib/logger'

interface CameraCaptureProps {
  onCapture: (imageData: string, file: File) => void
  onClose: () => void
  className?: string
}

export function CameraCapture({ onCapture, onClose, className }: CameraCaptureProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(device => device.kind === 'videoinput')
      setHasMultipleCameras(videoInputs.length > 1)
      cameraLogger.info('Camera devices enumerated', {
        videoInputCount: videoInputs.length,
        devices: videoInputs.map(d => ({ id: d.deviceId, label: d.label }))
      })
    }).catch(err => {
      cameraLogger.error('Failed to enumerate devices', {}, err as Error)
    })
  }, [])

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setHasPermission(null) // Reset permission state while checking
    cameraLogger.info('Starting camera initialization', {
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      protocol: window.location.protocol,
      hostname: window.location.hostname
    })
    
    try {
      // Stop any existing stream
      if (stream) {
        cameraLogger.debug('Stopping existing stream')
        stream.getTracks().forEach(track => {
          track.stop()
          cameraLogger.debug('Stopped track', { kind: track.kind, id: track.id })
        })
        setStream(null)
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraLogger.error('MediaDevices not available', {
          mediaDevices: !!navigator.mediaDevices,
          getUserMedia: !!(navigator.mediaDevices?.getUserMedia)
        })
        throw new Error('MediaDevices not supported in this browser')
      }

      cameraLogger.info('Requesting camera access')
      
      // Request camera permission with fallback
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      }
      
      let mediaStream: MediaStream | null = null
      
      try {
        // Try with facingMode first
        cameraLogger.debug('Attempting getUserMedia', { constraints })
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        // Fallback to any available camera
        cameraLogger.warn('Falling back to any available camera')
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        } catch (fallbackErr) {
          cameraLogger.error('Camera fallback failed', {}, fallbackErr as Error)
          throw fallbackErr
        }
      }
      
      if (mediaStream && videoRef.current) {
        cameraLogger.info('Got media stream, setting up video element', {
          streamId: mediaStream.id,
          tracks: mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled }))
        })
        setStream(mediaStream)
        setHasPermission(true)
        
        const video = videoRef.current
        video.srcObject = mediaStream
        
        // Wait for video metadata to load before playing
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            cameraLogger.error('Video loading timeout')
            reject(new Error('Video loading timeout'))
          }, 10000) // 10 second timeout
          
          const handleLoadedMetadata = () => {
            clearTimeout(timeout)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('error', handleError)
            
            cameraLogger.info('Video metadata loaded, attempting to play')
            video.play()
              .then(() => {
                cameraLogger.info('Camera started successfully')
                setIsLoading(false)
                resolve()
              })
              .catch((playErr) => {
                cameraLogger.error('Error playing video', {}, playErr as Error)
                setIsLoading(false)
                reject(playErr)
              })
          }
          
          const handleError = (err: Event) => {
            clearTimeout(timeout)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('error', handleError)
            cameraLogger.error('Video error event', { error: err })
            setIsLoading(false)
            reject(new Error('Video loading failed'))
          }
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata)
          video.addEventListener('error', handleError)
          
          // Force metadata load if not triggered
          if (video.readyState >= 1) {
            handleLoadedMetadata()
          }
        })
      } else {
        throw new Error('Failed to get media stream or video element')
      }
    } catch (err) {
      cameraLogger.error('Error accessing camera', {}, err as Error)
      setHasPermission(false)
      setIsLoading(false)
      
      // More specific error messages
      if (err instanceof DOMException) {
        cameraLogger.error('DOMException details', {
          name: err.name,
          message: err.message,
          code: err.code
        })
        
        if (err.name === 'NotAllowedError') {
          cameraLogger.error('Permission denied by user')
          toast.error('Camera access denied. Please allow camera permissions and refresh the page.')
        } else if (err.name === 'NotFoundError') {
          toast.error('No camera found on this device.')
        } else if (err.name === 'NotReadableError') {
          toast.error('Camera is already in use by another application.')
        } else if (err.name === 'OverconstrainedError') {
          cameraLogger.info('Trying with basic constraints')
          // Try again with minimal constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (basicStream && videoRef.current) {
              setStream(basicStream)
              setHasPermission(true)
              videoRef.current.srcObject = basicStream
              await videoRef.current.play()
              setIsLoading(false)
              return
            }
          } catch (basicErr) {
            cameraLogger.error('Basic constraints also failed', {}, basicErr as Error)
            toast.error('Camera constraints not supported.')
          }
        } else {
          toast.error(`Camera error: ${err.message}`)
        }
      } else {
        cameraLogger.error('Non-DOMException error', { error: err })
        toast.error('Camera error. Please try again.')
      }
    }
  }, [facingMode, stream])

  useEffect(() => {
    cameraLogger.info('Camera component mounted')
    // Start camera when component mounts
    startCamera()
    
    return () => {
      cameraLogger.info('Camera component unmounting, cleaning up streams')
      // Cleanup: stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop()
          cameraLogger.debug('Cleaned up track on unmount', { kind: track.kind })
        })
      }
    }
  }, []) // Remove startCamera dependency to prevent loops

  const switchCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // Restart camera with new facing mode
    setTimeout(() => startCamera(), 100)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        // Save context for transformations
        context.save()
        
        // Mirror image for front camera
        if (facingMode === 'user') {
          context.scale(-1, 1)
          context.translate(-canvas.width, 0)
        }
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Restore context
        context.restore()
        
        // Convert to image data
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        
        // Stop camera stream
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      } else {
        toast.error('Camera not ready. Please wait a moment and try again.')
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setHasPermission(null)
    startCamera()
  }

  const confirmPhoto = () => {
    if (capturedImage) {
      // Convert base64 to blob
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `damage-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(capturedImage, file)
        })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className={cn('w-full max-w-2xl bg-gray-900 border-gray-700', className)}>
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capture Damage Photo
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Camera View */}
          <div className="relative aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
            
            {!hasPermission && hasPermission !== null && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-300 mb-2">Camera access denied</p>
                <p className="text-sm text-gray-500 mb-4">
                  Please enable camera permissions in your browser settings to capture photos.
                </p>
                <div className="space-y-2">
                  <Button onClick={startCamera} variant="outline">
                    Try Again
                  </Button>
                  <p className="text-xs text-gray-500">
                    If camera still doesn't work, try:
                    <br />• Refreshing the page
                    <br />• Checking site permissions in browser settings
                    <br />• Using a different browser
                  </p>
                </div>
              </div>
            )}

            {(hasPermission === true || (hasPermission === null && !isLoading)) && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {/* Camera frame overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              </>
            )}

            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured damage"
                className="w-full h-full object-cover"
              />
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-700">
            {!capturedImage ? (
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {hasMultipleCameras && hasPermission && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Switch Camera
                    </Button>
                  )}
                </div>
                <Button
                  onClick={capturePhoto}
                  disabled={!hasPermission || isLoading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use This Photo
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="px-4 pb-4">
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                <strong>Tips:</strong> Ensure good lighting, capture the full extent of damage, and include scale references when possible.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}