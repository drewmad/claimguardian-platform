'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, SwitchCamera } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  className?: string
}

export function CameraCapture({ onCapture, className }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const startCamera = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setHasPermission(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0)
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        onCapture(imageData)
        
        // Stop camera after capture
        stopCamera()
      }
    }
  }

  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    // Camera will restart with new facing mode in useEffect
  }

  useEffect(() => {
    if (isStreaming) {
      startCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [facingMode])

  return (
    <div className={cn("space-y-4", className)}>
      {!isStreaming ? (
        <div className="text-center">
          {hasPermission === false ? (
            <div className="space-y-2">
              <CameraOff className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-sm text-gray-400">Camera permission denied</p>
              <p className="text-xs text-gray-500">Please enable camera access in your browser settings</p>
            </div>
          ) : (
            <Button onClick={startCamera} size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Open Camera
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera controls overlay */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={switchCamera}
                className="bg-gray-800/80 backdrop-blur"
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                onClick={captureImage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={stopCamera}
                className="bg-gray-800/80 backdrop-blur"
              >
                <CameraOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}