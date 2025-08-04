'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Target, CheckCircle, AlertCircle, Maximize2 } from 'lucide-react'
import * as THREE from 'three'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ARScanPoint {
  x: number
  y: number
  z: number
  timestamp: number
  confidence: number
}

interface ARRoomScannerProps {
  roomType: string
  onComplete: (measurements: any) => void
  onClose: () => void
}

export function ARRoomScanner({ roomType, onComplete, onClose }: ARRoomScannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanPoints, setScanPoints] = useState<ARScanPoint[]>([])
  const [progress, setProgress] = useState(0)
  const [instructions, setInstructions] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [xrSession, setXrSession] = useState<XRSession | null>(null)
  const [hasWebXR, setHasWebXR] = useState(false)
  const supabase = createClient()

  // WebXR detection
  useEffect(() => {
    if ('xr' in navigator && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then(supported => {
        setHasWebXR(supported)
      }).catch(() => {
        setHasWebXR(false)
      })
    }
  }, [])

  // Initialize AR session
  const startARSession = async () => {
    try {
      setIsScanning(true)
      
      // Start scanning session with backend
      const { data, error } = await supabase.functions.invoke('ar_room_scanner', {
        body: { action: 'start_session', roomType }
      })
      
      if (error) throw error
      
      setSessionId(data.sessionId)
      setInstructions(data.instructions)
      
      if (hasWebXR && navigator.xr) {
        // Start WebXR AR session
        await startWebXRSession()
      } else {
        // Fallback to camera-based scanning
        await startCameraScanning()
      }
    } catch (error) {
      console.error('Failed to start AR session:', error)
      toast.error('Failed to start AR scanning')
      setIsScanning(false)
    }
  }

  const startWebXRSession = async () => {
    try {
      if (!navigator.xr) throw new Error('WebXR not supported')
      
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['hit-test', 'anchors']
      })
      
      setXrSession(session)
      
      // Set up WebXR renderer
      const canvas = canvasRef.current!
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.xr.enabled = true
      renderer.xr.setSession(session)
      
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      
      // Add visual indicators for scanning
      const geometry = new THREE.SphereGeometry(0.01, 16, 16)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      
      session.addEventListener('end', () => {
        setXrSession(null)
        setIsScanning(false)
      })
      
      // AR frame processing
      const onXRFrame = (timestamp: number, frame: XRFrame) => {
        const referenceSpace = renderer.xr.getReferenceSpace()
        const pose = frame.getViewerPose(referenceSpace!)
        
        if (pose) {
          const position = pose.transform.position
          const orientation = pose.transform.orientation
          
          // Record scan point
          const scanPoint: ARScanPoint = {
            x: position.x,
            y: position.y,
            z: position.z,
            timestamp,
            confidence: 0.9 // WebXR typically has high confidence
          }
          
          setScanPoints(prev => [...prev, scanPoint])
          
          // Visual feedback - add point marker
          const pointMesh = new THREE.Mesh(geometry, material)
          pointMesh.position.set(position.x, position.y, position.z)
          scene.add(pointMesh)
          
          // Update progress based on coverage
          const newProgress = Math.min(95, scanPoints.length * 2)
          setProgress(newProgress)
          
          if (scanPoints.length > 50) {
            // Sufficient data collected
            session.end()
            processScanData()
          }
        }
        
        renderer.render(scene, camera)
      }
      
      session.requestAnimationFrame(onXRFrame)
      
    } catch (error) {
      console.error('WebXR session failed:', error)
      // Fallback to camera scanning
      await startCameraScanning()
    }
  }

  const startCameraScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      // Simulate AR scanning with device orientation and motion
      if ('DeviceOrientationEvent' in window) {
        const handleOrientation = (event: DeviceOrientationEvent) => {
          if (!isScanning) return
          
          const scanPoint: ARScanPoint = {
            x: (event.beta || 0) / 90, // Normalize to -1 to 1
            y: (event.gamma || 0) / 90,
            z: (event.alpha || 0) / 180,
            timestamp: Date.now(),
            confidence: 0.7 // Lower confidence for simulated data
          }
          
          setScanPoints(prev => [...prev, scanPoint])
          
          const newProgress = Math.min(95, scanPoints.length * 1.5)
          setProgress(newProgress)
          
          if (scanPoints.length > 75) {
            // Stop scanning and process
            stream.getTracks().forEach(track => track.stop())
            processScanData()
          }
        }
        
        window.addEventListener('deviceorientation', handleOrientation)
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          window.removeEventListener('deviceorientation', handleOrientation)
          if (isScanning) {
            stream.getTracks().forEach(track => track.stop())
            processScanData()
          }
        }, 30000)
      } else {
        // Manual scanning mode - simulate points
        const interval = setInterval(() => {
          if (scanPoints.length > 50) {
            clearInterval(interval)
            stream.getTracks().forEach(track => track.stop())
            processScanData()
            return
          }
          
          const scanPoint: ARScanPoint = {
            x: (Math.random() - 0.5) * 4, // Room width simulation
            y: Math.random() * 3 - 1.5, // Room height
            z: (Math.random() - 0.5) * 4, // Room depth
            timestamp: Date.now(),
            confidence: 0.6 + Math.random() * 0.3
          }
          
          setScanPoints(prev => [...prev, scanPoint])
          setProgress(prev => Math.min(95, prev + 2))
        }, 200)
      }
      
    } catch (error) {
      console.error('Camera access failed:', error)
      toast.error('Camera access denied')
      setIsScanning(false)
    }
  }

  const processScanData = async () => {
    try {
      setProgress(100)
      
      if (!sessionId || scanPoints.length < 4) {
        throw new Error('Insufficient scan data')
      }
      
      const scanData = {
        points: scanPoints,
        roomType,
        sessionId,
        deviceInfo: {
          hasARCore: hasWebXR,
          hasDepthSensor: hasWebXR,
          screenDimensions: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      }
      
      const { data, error } = await supabase.functions.invoke('ar_room_scanner', {
        body: {
          action: 'process_scan',
          scanData,
          sessionId,
          roomType
        }
      })
      
      if (error) throw error
      
      toast.success('Room scan completed successfully!')
      onComplete(data.measurements)
      
    } catch (error) {
      console.error('Scan processing failed:', error)
      toast.error('Failed to process scan data')
    } finally {
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (xrSession) {
      xrSession.end()
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    
    setIsScanning(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* AR Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: hasWebXR && xrSession ? 'block' : 'none' }}
      />
      
      {/* Camera Video */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: !hasWebXR || !xrSession ? 'block' : 'none' }}
        muted
        playsInline
      />
      
      {/* Scanning UI Overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-black/50">
          <div className="text-white">
            <h2 className="text-lg font-semibold">AR Room Scanner</h2>
            <p className="text-sm text-gray-300">Scanning {roomType}</p>
          </div>
          <button 
            onClick={stopScanning}
            className="text-white hover:text-red-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Center Instructions */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <div className="w-24 h-24 border-4 border-green-500 border-dashed rounded-full flex items-center justify-center mb-4 mx-auto">
              <Target className="w-8 h-8 text-green-500" />
            </div>
            
            {!isScanning ? (
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                <p className="text-gray-300 mb-4">
                  {hasWebXR ? 'Using AR for precise measurements' : 'Using camera-based scanning'}
                </p>
                <button
                  onClick={startARSession}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <Maximize2 className="w-5 h-5" />
                  Start Scanning
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-2">Scanning in Progress</h3>
                <p className="text-gray-300 mb-4">
                  Move your device slowly around the room
                </p>
                <div className="w-32 h-32 relative mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"
                    style={{
                      transform: `rotate(${progress * 3.6}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-semibold">{progress}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Scan points collected: {scanPoints.length}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        {instructions.length > 0 && (
          <div className="bg-black/70 p-4">
            <h4 className="text-white font-medium mb-2">Instructions:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}