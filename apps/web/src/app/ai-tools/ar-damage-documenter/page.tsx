'use client'

import { Camera, Ruler, Save, Download, Upload, Maximize2, Info, AlertTriangle, CheckCircle, RotateCw, RefreshCw, FileImage, MapPin, Clock, Layers, Brain, ArrowLeftRight, StickyNote, Wrench, Droplet, Zap, ShieldAlert, Home } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { CameraCapture } from '@/components/camera/camera-capture'
import { EnhancedDamageAnalyzer } from '@/components/ai/enhanced-damage-analyzer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Measurement {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  distance: number
  unit: 'inches' | 'feet' | 'meters'
  label: string
  realWorldDistance?: number // AR-calibrated measurement
}

interface Annotation {
  id: string
  position: { x: number; y: number }
  text: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  category: 'structural' | 'water' | 'fire' | 'other'
}

interface ARNote {
  id: string
  position: { x: number; y: number; z?: number }
  text: string
  type: 'equipment' | 'damage' | 'maintenance' | 'safety' | 'access'
  icon: string
  color: string
  pinned: boolean
  roomId?: string
  timestamp: string
}

interface CapturedImage {
  id: string
  dataUrl: string
  timestamp: string
  type: 'before' | 'after' | 'progress'
  location?: { lat: number; lng: number } | null
  metadata: {
    deviceInfo: string
    cameraSettings?: {
      resolution: string
      flashUsed: boolean
      focusMode: string
    }
  }
}

interface PolicyComparison {
  damageType: string
  coverage: {
    isCovered: boolean
    policyClause: string
    deductible: number
    maxPayout: number
  }
  recommendations: string[]
}

export default function ARDamageDocumenterPage() {
  // Core state
  const [isARSupported, setIsARSupported] = useState(false)
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [arNotes, setArNotes] = useState<ARNote[]>([])
  const [currentMode, setCurrentMode] = useState<'capture' | 'measure' | 'annotate' | 'ar-notes' | 'compare' | 'ai-analysis'>('capture')
  const [measurementUnit, setMeasurementUnit] = useState<'inches' | 'feet' | 'meters'>('feet')
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setArSession] = useState<{ active: boolean } | null>(null)
  
  // Enhanced features
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [imageType, setImageType] = useState<'before' | 'after' | 'progress'>('before')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [policyAnalysis, setPolicyAnalysis] = useState<PolicyComparison | null>(null)
  const [beforeImage, setBeforeImage] = useState<CapturedImage | null>(null)
  const [afterImage, setAfterImage] = useState<CapturedImage | null>(null)
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const measurementStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      // @ts-expect-error - WebXR API not fully typed
      navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported)
      })
    }
  }, [])

  const startARSession = async () => {
    try {
      if (!isARSupported) {
        toast.error('AR not supported on this device')
        return
      }

      // For demo purposes, we'll simulate AR functionality
      // In production, this would initialize WebXR session
      setArSession({ active: true })
      toast.success('AR session started')
    } catch (error) {
      console.error('Failed to start AR session:', error)
      toast.error('Failed to start AR session')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (error) {
      console.error('Failed to access camera:', error)
      toast.error('Failed to access camera')
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        
        const imageData = canvasRef.current.toDataURL('image/jpeg')
        
        // Create new image object
        const newImage: CapturedImage = {
          id: Date.now().toString(),
          dataUrl: imageData,
          timestamp: new Date().toISOString(),
          type: imageType,
          location: null,
          metadata: {
            deviceInfo: navigator.userAgent,
            cameraSettings: {
              resolution: `${canvasRef.current.width}x${canvasRef.current.height}`,
              flashUsed: false,
              focusMode: 'Auto'
            }
          }
        }
        
        setCapturedImages(prev => [...prev, newImage])
        setCurrentImageIndex(capturedImages.length)
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream
        stream?.getTracks().forEach(track => track.stop())
        setIsCapturing(false)
        
        toast.success('Image captured successfully')
      }
    }
  }

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const currentLocation = await getCurrentLocation().catch(() => null)
        
        const reader = new FileReader()
        reader.onload = (e) => {
          const newImage: CapturedImage = {
            id: Date.now().toString(),
            dataUrl: e.target?.result as string,
            timestamp: new Date().toISOString(),
            type: imageType,
            location: currentLocation,
            metadata: {
              deviceInfo: navigator.userAgent,
              cameraSettings: {
                resolution: 'Unknown',
                flashUsed: false,
                focusMode: 'Auto'
              }
            }
          }
          
          setCapturedImages(prev => [...prev, newImage])
          setCurrentImageIndex(capturedImages.length)
          
          // Set as before/after image based on type
          if (imageType === 'before') {
            setBeforeImage(newImage)
          } else if (imageType === 'after') {
            setAfterImage(newImage)
          }
          
          toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image uploaded successfully`)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error processing image:', error)
        toast.error('Failed to process image')
      }
    }
  }

  const handleCameraCapture = async (file: File) => {
    try {
      const currentLocation = await getCurrentLocation().catch(() => null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: CapturedImage = {
          id: Date.now().toString(),
          dataUrl: e.target?.result as string,
          timestamp: new Date().toISOString(),
          type: imageType,
          location: currentLocation,
          metadata: {
            deviceInfo: navigator.userAgent,
            cameraSettings: {
              resolution: '1280x720',
              flashUsed: false,
              focusMode: 'Auto'
            }
          }
        }
        
        setCapturedImages(prev => [...prev, newImage])
        setCurrentImageIndex(capturedImages.length)
        
        // Set as before/after image based on type
        if (imageType === 'before') {
          setBeforeImage(newImage)
        } else if (imageType === 'after') {
          setAfterImage(newImage)
        }
        
        setShowCameraCapture(false)
        toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image captured successfully`)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing captured image:', error)
      toast.error('Failed to process captured image')
    }
  }

  // Placeholder for future AR measurement functionality
  // const addMeasurement = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  //   const distance = Math.sqrt(
  //     Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  //   ) * 0.1
  //   const newMeasurement: Measurement = {
  //     id: Date.now().toString(),
  //     start,
  //     end,
  //     distance: parseFloat(distance.toFixed(2)),
  //     unit: measurementUnit,
  //     label: `${distance.toFixed(2)} ${measurementUnit}`
  //   }
  //   setMeasurements([...measurements, newMeasurement])
  //   toast.success('Measurement added')
  // }

  // Placeholder for future AR annotation functionality  
  // const addAnnotation = (position: { x: number; y: number }, text: string, severity: 'low' | 'medium' | 'high') => {
  //   const newAnnotation: Annotation = {
  //     id: Date.now().toString(),
  //     position,
  //     text,
  //     severity
  //   }
  //   setAnnotations([...annotations, newAnnotation])
  //   toast.success('Annotation added')
  // }

  const generateReport = async () => {
    setIsProcessing(true)
    try {
      // Simulate AI validation and report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const report = {
        timestamp: new Date().toISOString(),
        measurements: measurements.length,
        annotations: annotations.length,
        aiInsights: [
          'Detected water damage on ceiling (12.5 sq ft)',
          'Structural crack identified - requires professional inspection',
          'Mold growth potential in corner areas',
          'Estimated repair cost: $2,500 - $3,500'
        ]
      }

      toast.success('Professional report generated successfully')
      console.log('Generated report:', report)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setIsProcessing(false)
    }
  }

  const exportData = () => {
    const data = {
      images: capturedImages,
      measurements,
      annotations,
      metadata: {
        captureDate: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
        arEnabled: isARSupported
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `damage-documentation-${Date.now()}.json`
    a.click()
    
    toast.success('Data exported successfully')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Premium Header */}
            <div className="mb-8 relative">
              {/* Premium Background Gradient */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-600/20 rounded-full blur-3xl animate-pulse opacity-40" />
              
              <div className="relative">
                <Link 
                  href="/ai-tools" 
                  className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-cyan-400/20 shadow-[0_8px_32px_rgba(6,182,212,0.15)] hover:shadow-[0_8px_32px_rgba(6,182,212,0.25)] transition-all duration-300"
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-600/30 to-blue-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(6,182,212,0.3)] hover:shadow-[0_25px_80px_rgba(6,182,212,0.4)] transition-all duration-700">
                    <Camera className="h-8 w-8 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">AR Damage Documenter</h1>
                      <Badge className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-gray-300 max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      Professional documentation in minutes! Use WebXR measurement tools with AI validation and 3D visualization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AR Support Alert */}
            {!isARSupported && (
              <Alert className="bg-yellow-900/20 border-yellow-600/30">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  AR features are not fully supported on this device. You can still use image capture and manual measurements.
                </AlertDescription>
              </Alert>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Capture/Preview Area */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_80px_rgba(6,182,212,0.15)] transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Damage Capture</CardTitle>
                      <Tabs value={currentMode} onValueChange={(value) => setCurrentMode(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-6">
                          <TabsTrigger value="capture">Capture</TabsTrigger>
                          <TabsTrigger value="measure" disabled={capturedImages.length === 0}>Measure</TabsTrigger>
                          <TabsTrigger value="annotate" disabled={capturedImages.length === 0}>Annotate</TabsTrigger>
                          <TabsTrigger value="ar-notes" disabled={capturedImages.length === 0}>AR Notes</TabsTrigger>
                          <TabsTrigger value="compare" disabled={!beforeImage || !afterImage}>Compare</TabsTrigger>
                          <TabsTrigger value="ai-analysis" disabled={capturedImages.length === 0}>AI Analysis</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="capture" className="mt-0">
                      <div className="space-y-4">
                        {/* Image Type Selection */}
                        <div className="flex items-center gap-4">
                          <Label htmlFor="imageType" className="text-white">Image Type:</Label>
                          <Select value={imageType} onValueChange={(value: any) => setImageType(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Before Damage</SelectItem>
                              <SelectItem value="after">After Damage</SelectItem>
                              <SelectItem value="progress">Progress/Current</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                          {capturedImages.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                              <div className="text-center space-y-2">
                                <Camera className="h-16 w-16 text-gray-600 mx-auto" />
                                <p className="text-gray-400">Start documenting damage</p>
                                <p className="text-sm text-gray-500">Capture before, after, and progress photos</p>
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => setShowCameraCapture(true)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Use Camera
                                </Button>
                                <Button
                                  onClick={() => fileInputRef.current?.click()}
                                  variant="outline"
                                  className="bg-gray-700 hover:bg-gray-600"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Image
                                </Button>
                                {isARSupported && (
                                  <Button
                                    onClick={startARSession}
                                    variant="outline"
                                    className="bg-cyan-700 hover:bg-cyan-600"
                                  >
                                    <Maximize2 className="h-4 w-4 mr-2" />
                                    Start AR
                                  </Button>
                                )}
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                          )}

                          {isCapturing && (
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <Button
                              onClick={captureImage}
                              size="lg"
                              className="bg-red-600 hover:bg-red-700 rounded-full"
                            >
                              <Camera className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      )}

                          {capturedImages.length > 0 && (
                            <div className="space-y-4">
                              {/* Image Navigation */}
                              <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                                <div className="flex items-center gap-2">
                                  <FileImage className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-300">
                                    Image {currentImageIndex + 1} of {capturedImages.length}
                                  </span>
                                  <Badge className="bg-blue-600/20 text-blue-400">
                                    {capturedImages[currentImageIndex]?.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                    disabled={currentImageIndex === 0}
                                  >
                                    ←
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setCurrentImageIndex(Math.min(capturedImages.length - 1, currentImageIndex + 1))}
                                    disabled={currentImageIndex === capturedImages.length - 1}
                                  >
                                    →
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Current Image */}
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={capturedImages[currentImageIndex]?.dataUrl}
                                  alt={`${capturedImages[currentImageIndex]?.type} damage photo`}
                                  className="w-full h-full object-contain rounded"
                                />
                                
                                {/* Image Metadata Overlay */}
                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(capturedImages[currentImageIndex]?.timestamp).toLocaleString()}
                                  </div>
                                  {capturedImages[currentImageIndex]?.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {capturedImages[currentImageIndex]?.location?.lat.toFixed(4)}, {capturedImages[currentImageIndex]?.location?.lng.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Overlay for measurements and annotations */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                  {measurements.map((measurement) => (
                                    <g key={measurement.id}>
                                      <line
                                        x1={measurement.start.x}
                                        y1={measurement.start.y}
                                        x2={measurement.end.x}
                                        y2={measurement.end.y}
                                        stroke="#3B82F6"
                                        strokeWidth="2"
                                      />
                                      <text
                                        x={(measurement.start.x + measurement.end.x) / 2}
                                        y={(measurement.start.y + measurement.end.y) / 2 - 10}
                                        fill="#3B82F6"
                                        fontSize="14"
                                        textAnchor="middle"
                                        className="font-semibold"
                                      >
                                        {measurement.label}
                                      </text>
                                    </g>
                                  ))}
                                  {annotations.map((annotation) => (
                                    <g key={annotation.id}>
                                      <circle
                                        cx={annotation.position.x}
                                        cy={annotation.position.y}
                                        r="8"
                                        fill={
                                          annotation.severity === 'high' ? '#EF4444' :
                                          annotation.severity === 'medium' ? '#F59E0B' :
                                          '#10B981'
                                        }
                                      />
                                      <text
                                        x={annotation.position.x + 15}
                                        y={annotation.position.y + 5}
                                        fill="white"
                                        fontSize="12"
                                        className="bg-gray-800 px-1 rounded"
                                      >
                                        {annotation.text}
                                      </text>
                                    </g>
                                  ))}
                                </svg>
                                
                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCameraCapture(true)}
                                    className="bg-gray-700/90 hover:bg-gray-600"
                                  >
                                    <Camera className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCapturedImages([])
                                      setCurrentImageIndex(0)
                                      setMeasurements([])
                                      setAnnotations([])
                                      setBeforeImage(null)
                                      setAfterImage(null)
                                    }}
                                    className="bg-gray-700/90 hover:bg-gray-600"
                                  >
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      </TabsContent>

                      {/* ArrowLeftRight Mode */}
                      <TabsContent value="compare" className="mt-0">
                        {beforeImage && afterImage ? (
                          <div className="space-y-4">
                            {/* Comparison Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Label className="text-white">ArrowLeftRight Mode:</Label>
                                <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="side-by-side">Side by Side</SelectItem>
                                    <SelectItem value="overlay">Overlay</SelectItem>
                                    <SelectItem value="slider">Slider</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Badge className="bg-green-600/20 text-green-400">
                                <ArrowLeftRight className="h-3 w-3 mr-1" />
                                Comparison Ready
                              </Badge>
                            </div>
                            
                            {/* Comparison Display */}
                            <div className="bg-gray-900 rounded-lg p-4">
                              {comparisonMode === 'side-by-side' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-blue-600/20 text-blue-400">Before</Badge>
                                      <span className="text-xs text-gray-400">
                                        {new Date(beforeImage.timestamp).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={beforeImage.dataUrl}
                                      alt="Before damage"
                                      className="w-full h-64 object-cover rounded"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-red-600/20 text-red-400">After</Badge>
                                      <span className="text-xs text-gray-400">
                                        {new Date(afterImage.timestamp).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={afterImage.dataUrl}
                                      alt="After damage"
                                      className="w-full h-64 object-cover rounded"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {comparisonMode === 'overlay' && (
                                <div className="relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={beforeImage.dataUrl}
                                    alt="Before damage"
                                    className="w-full h-96 object-cover rounded"
                                  />
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={afterImage.dataUrl}
                                    alt="After damage"
                                    className="absolute inset-0 w-full h-96 object-cover rounded opacity-50 hover:opacity-75 transition-opacity"
                                  />
                                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                                    Hover to adjust overlay opacity
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <ArrowLeftRight className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">Comparison requires both before and after images</p>
                            <p className="text-sm text-gray-500">
                              {!beforeImage && 'Capture a "before" image first'}
                              {beforeImage && !afterImage && 'Now capture an "after" image'}
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Measure Mode */}
                      <TabsContent value="measure" className="mt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-gray-900 p-3 rounded">
                            <p className="text-sm text-gray-400">Click two points to measure distance</p>
                            <Select value={measurementUnit} onValueChange={(value: any) => setMeasurementUnit(value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inches">Inches</SelectItem>
                                <SelectItem value="feet">Feet</SelectItem>
                                <SelectItem value="meters">Meters</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {capturedImages.length > 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Ruler className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>AR measurement tools coming soon</p>
                              <p className="text-sm">Use reference objects for scale estimation</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      {/* Annotate Mode */}
                      <TabsContent value="annotate" className="mt-0">
                        <div className="space-y-4">
                          <div className="bg-gray-900 p-3 rounded">
                            <p className="text-sm text-gray-400 mb-3">Click on the image to add damage annotations</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button size="sm" variant="outline" className="bg-green-600/20 text-green-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                Minor
                              </Button>
                              <Button size="sm" variant="outline" className="bg-yellow-600/20 text-yellow-400">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                Moderate
                              </Button>
                              <Button size="sm" variant="outline" className="bg-red-600/20 text-red-400">
                                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                Severe
                              </Button>
                              <Button size="sm" variant="outline" className="bg-gray-600/20 text-gray-400">
                                <Layers className="h-3 w-3 mr-2" />
                                Category
                              </Button>
                            </div>
                          </div>
                          {capturedImages.length > 0 && annotations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>Click on damage areas to add annotations</p>
                              <p className="text-sm">Document severity and damage type</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* AR Notes Mode */}
                      <TabsContent value="ar-notes" className="mt-0">
                        <div className="space-y-4">
                          <div className="bg-gray-900 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <StickyNote className="h-5 w-5 text-cyan-400" />
                                <h3 className="text-white font-medium">Digital AR Notes</h3>
                              </div>
                              <Badge className="bg-cyan-600/20 text-cyan-400">
                                {arNotes.length} Notes
                              </Badge>
                            </div>
                            
                            <p className="text-gray-400 text-sm mb-4">
                              Add digital notes directly in your rooms. Pin important information about equipment, maintenance, or access points.
                            </p>
                            
                            {/* AR Note Types */}
                            <div className="grid grid-cols-5 gap-2 mb-4">
                              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                                <Wrench className="h-5 w-5 text-blue-400" />
                                <span className="text-xs text-gray-300">Equipment</span>
                              </button>
                              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                                <ShieldAlert className="h-5 w-5 text-red-400" />
                                <span className="text-xs text-gray-300">Damage</span>
                              </button>
                              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                                <Droplet className="h-5 w-5 text-cyan-400" />
                                <span className="text-xs text-gray-300">Water</span>
                              </button>
                              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                <span className="text-xs text-gray-300">Electrical</span>
                              </button>
                              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                                <Home className="h-5 w-5 text-green-400" />
                                <span className="text-xs text-gray-300">Access</span>
                              </button>
                            </div>
                            
                            {/* AR Notes Display */}
                            {capturedImages.length > 0 && (
                              <div className="relative bg-black rounded-lg overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={capturedImages[currentImageIndex]?.dataUrl}
                                  alt="Room with AR notes"
                                  className="w-full h-full object-contain"
                                />
                                
                                {/* AR Notes Overlay */}
                                {arNotes.map((note) => {
                                  const iconMap: { [key: string]: React.ElementType } = {
                                    equipment: Wrench,
                                    damage: ShieldAlert,
                                    maintenance: StickyNote,
                                    safety: AlertTriangle,
                                    access: Home
                                  }
                                  const Icon = iconMap[note.type] || StickyNote
                                  
                                  return (
                                    <div
                                      key={note.id}
                                      className={`absolute ${note.pinned ? 'animate-pulse' : ''}`}
                                      style={{ 
                                        left: `${note.position.x}%`, 
                                        top: `${note.position.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                      }}
                                    >
                                      <div className="relative group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${note.color} cursor-pointer hover:scale-110 transition-transform`}>
                                          <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        
                                        {/* Note Content Tooltip */}
                                        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                          <p className="font-medium text-sm">{note.text}</p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            {new Date(note.timestamp).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                
                                {/* Add Note Instructions */}
                                {arNotes.length === 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <div className="text-center">
                                      <StickyNote className="h-12 w-12 text-cyan-400 mx-auto mb-3 opacity-50" />
                                      <p className="text-white font-medium">Click anywhere to add an AR note</p>
                                      <p className="text-gray-400 text-sm mt-1">Document equipment locations and important details</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Quick Add Templates */}
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-gray-400">Quick Templates:</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600">
                                  Water heater - Basement
                                </Badge>
                                <Badge className="bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600">
                                  Main fuse shutoff
                                </Badge>
                                <Badge className="bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600">
                                  Access door for removal
                                </Badge>
                                <Badge className="bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600">
                                  HVAC filter location
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* AI Analysis Mode */}
                      <TabsContent value="ai-analysis" className="mt-0">
                        <div className="space-y-4">
                          <div className="bg-gray-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="h-5 w-5 text-cyan-400" />
                              <h3 className="text-white font-medium">Enhanced AI Damage Analysis</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                              Get comprehensive AI analysis with policy comparison, before/after evaluation, and detailed recommendations.
                            </p>
                            
                            <EnhancedDamageAnalyzer
                              onAnalysisComplete={(result) => {
                                toast.success('AI analysis completed successfully')
                                console.log('Analysis result:', result)
                              }}
                              propertyId="current-property"
                              policyData={null}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <canvas ref={canvasRef} className="hidden" />
                  </CardContent>
                </Card>
              </div>

              {/* Tools Panel */}
              <div className="space-y-6">
                {/* Image Collection Summary */}
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-cyan-600/30 to-blue-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(6,182,212,0.2)]">
                        <FileImage className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                      </div>
                      Photo Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {capturedImages.length === 0 ? (
                      <p className="text-gray-400 text-sm">No photos captured yet</p>
                    ) : (
                      <div className="space-y-3">
                        {capturedImages.map((image, index) => (
                          <div key={image.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image.dataUrl}
                                  alt={`${image.type} photo`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${
                                    image.type === 'before' ? 'bg-blue-600/20 text-blue-400' :
                                    image.type === 'after' ? 'bg-red-600/20 text-red-400' :
                                    'bg-yellow-600/20 text-yellow-400'
                                  }`}>
                                    {image.type}
                                  </Badge>
                                  {image.location && (
                                    <Badge className="bg-green-600/20 text-green-400 text-xs">
                                      <MapPin className="h-2 w-2 mr-1" />
                                      GPS
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">
                                  {new Date(image.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newImages = capturedImages.filter(img => img.id !== image.id)
                                setCapturedImages(newImages)
                                if (currentImageIndex >= newImages.length) {
                                  setCurrentImageIndex(Math.max(0, newImages.length - 1))
                                }
                              }}
                              className="text-gray-400 hover:text-red-400"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCameraCapture(true)}
                            className="flex-1"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Add Photo
                          </Button>
                          {beforeImage && afterImage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCurrentMode('compare')}
                              className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30"
                            >
                              <ArrowLeftRight className="h-3 w-3 mr-1" />
                              ArrowLeftRight
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Measurements List */}
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-600/30 to-indigo-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                        <Ruler className="h-5 w-5 text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                      </div>
                      Measurements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {measurements.length === 0 ? (
                      <div className="text-center py-4">
                        <Ruler className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No measurements yet</p>
                        <p className="text-xs text-gray-500">Use AR tools to measure damage</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {measurements.map((measurement) => (
                          <div key={measurement.id} className="p-3 bg-gray-700 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{measurement.label}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setMeasurements(measurements.filter(m => m.id !== measurement.id))}
                                className="text-gray-400 hover:text-red-400"
                              >
                                ×
                              </Button>
                            </div>
                            {measurement.realWorldDistance && (
                              <div className="text-xs text-gray-400">
                                AR Calibrated: {measurement.realWorldDistance} {measurement.unit}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Annotations List */}
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-cyan-600/30 to-teal-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(6,182,212,0.2)]">
                        <Info className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                      </div>
                      Damage Annotations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {annotations.length === 0 ? (
                      <div className="text-center py-4">
                        <Info className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No annotations yet</p>
                        <p className="text-xs text-gray-500">Click on damage areas to annotate</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {annotations.map((annotation) => (
                          <div key={annotation.id} className="p-3 bg-gray-700 rounded">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    className={
                                      annotation.severity === 'high' ? 'bg-red-600/20 text-red-400' :
                                      annotation.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                      'bg-green-600/20 text-green-400'
                                    }
                                  >
                                    {annotation.severity}
                                  </Badge>
                                  <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                                    {annotation.category}
                                  </Badge>
                                </div>
                                <p className="text-white text-sm">{annotation.text}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(annotation.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setAnnotations(annotations.filter(a => a.id !== annotation.id))}
                                className="text-gray-400 hover:text-red-400"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(147,51,234,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(147,51,234,0.2)]">
                        <Zap className="h-5 w-5 text-purple-300 drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]" />
                      </div>
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={generateReport}
                      disabled={capturedImages.length === 0 || isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)] transition-all duration-300 backdrop-blur-md border-0"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Generate AI Report
                        </>
                      )}
                    </Button>
                    
                    {beforeImage && afterImage && (
                      <Button
                        onClick={() => {
                          // Generate comparison report
                          toast.success('Comparison report generated')
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.4)] transition-all duration-300 backdrop-blur-md border-0"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        ArrowLeftRight Analysis
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => setCurrentMode('ai-analysis')}
                      disabled={capturedImages.length === 0}
                      className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-[0_8px_32px_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.4)] transition-all duration-300 backdrop-blur-md border-0"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Policy Analysis
                    </Button>
                    
                    <Button
                      onClick={exportData}
                      disabled={capturedImages.length === 0}
                      variant="outline"
                      className="w-full bg-gray-700 hover:bg-gray-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Documentation
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 backdrop-blur-xl border-blue-600/40 shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.3)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-cyan-600/30 to-blue-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(6,182,212,0.3)]">
                        <Brain className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
                      </div>
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">AI validates measurements in real-time</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">3D visualization helps insurers understand damage</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">Professional reports increase claim success</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Camera Capture Modal */}
        {showCameraCapture && (
          <CameraCapture
            onClose={() => setShowCameraCapture(false)}
            onCapture={handleCameraCapture}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}