'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, CameraOff, RefreshCw, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    })
  }, [])

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    try {
      // Request camera permission
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setHasPermission(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setHasPermission(false)
      toast.error('Unable to access camera. Please check permissions.')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    
    return () => {
      // Cleanup: stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [startCamera])

  const switchCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0)
        
        // Convert to image data
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        
        // Stop camera stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
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
            
            {!hasPermission && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-300 mb-2">Camera access denied</p>
                <p className="text-sm text-gray-500 mb-4">
                  Please enable camera permissions in your browser settings to capture photos.
                </p>
                <Button onClick={startCamera} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {hasPermission && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
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