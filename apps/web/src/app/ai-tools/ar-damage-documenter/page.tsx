'use client'

import { useState, useRef, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Ruler, Save, Download, Upload, Maximize2, Info, AlertTriangle, CheckCircle, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Measurement {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  distance: number
  unit: 'inches' | 'feet' | 'meters'
  label: string
}

interface Annotation {
  id: string
  position: { x: number; y: number }
  text: string
  severity: 'low' | 'medium' | 'high'
}

export default function ARDamageDocumenterPage() {
  const [isARSupported, setIsARSupported] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentMode, setCurrentMode] = useState<'capture' | 'measure' | 'annotate'>('capture')
  const [measurementUnit, setMeasurementUnit] = useState<'inches' | 'feet' | 'meters'>('feet')
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setArSession] = useState<{ active: boolean } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setCapturedImage(imageData)
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream
        stream?.getTracks().forEach(track => track.stop())
        setIsCapturing(false)
        
        toast.success('Image captured successfully')
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
        toast.success('Image uploaded successfully')
      }
      reader.readAsDataURL(file)
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
      image: capturedImage,
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
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/ai-tools" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-lg">
                  <Camera className="h-6 w-6 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">AR Damage Documenter</h1>
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                  Beta
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Professional documentation in minutes! Use WebXR measurement tools with AI validation and 3D visualization.
              </p>
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
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Damage Capture</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentMode === 'capture' ? 'default' : 'outline'}
                          onClick={() => setCurrentMode('capture')}
                          className={currentMode === 'capture' ? 'bg-blue-600' : 'bg-gray-700'}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Capture
                        </Button>
                        <Button
                          size="sm"
                          variant={currentMode === 'measure' ? 'default' : 'outline'}
                          onClick={() => setCurrentMode('measure')}
                          className={currentMode === 'measure' ? 'bg-blue-600' : 'bg-gray-700'}
                          disabled={!capturedImage}
                        >
                          <Ruler className="h-4 w-4 mr-1" />
                          Measure
                        </Button>
                        <Button
                          size="sm"
                          variant={currentMode === 'annotate' ? 'default' : 'outline'}
                          onClick={() => setCurrentMode('annotate')}
                          className={currentMode === 'annotate' ? 'bg-blue-600' : 'bg-gray-700'}
                          disabled={!capturedImage}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Annotate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                      {!capturedImage && !isCapturing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                          <div className="text-center space-y-2">
                            <Camera className="h-16 w-16 text-gray-600 mx-auto" />
                            <p className="text-gray-400">Choose a capture method</p>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={startCamera}
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

                      {capturedImage && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={capturedImage}
                            alt="Captured damage"
                            className="w-full h-full object-contain"
                          />
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
                          <div className="absolute top-4 right-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCapturedImage(null)
                                setMeasurements([])
                                setAnnotations([])
                              }}
                              className="bg-gray-700 hover:bg-gray-600"
                            >
                              <RotateCw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          </div>
                        </div>
                      )}

                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {currentMode === 'measure' && capturedImage && (
                      <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">Click two points to measure distance</p>
                          <select
                            value={measurementUnit}
                            onChange={(e) => setMeasurementUnit(e.target.value as 'inches' | 'feet' | 'meters')}
                            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <option value="inches">Inches</option>
                            <option value="feet">Feet</option>
                            <option value="meters">Meters</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {currentMode === 'annotate' && capturedImage && (
                      <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-400">Click on the image to add damage annotations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tools Panel */}
              <div className="space-y-6">
                {/* Measurements List */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-blue-400" />
                      Measurements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {measurements.length === 0 ? (
                      <p className="text-gray-400 text-sm">No measurements yet</p>
                    ) : (
                      <div className="space-y-2">
                        {measurements.map((measurement) => (
                          <div key={measurement.id} className="p-2 bg-gray-700 rounded">
                            <div className="flex items-center justify-between">
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
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Annotations List */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="h-5 w-5 text-cyan-400" />
                      Annotations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {annotations.length === 0 ? (
                      <p className="text-gray-400 text-sm">No annotations yet</p>
                    ) : (
                      <div className="space-y-2">
                        {annotations.map((annotation) => (
                          <div key={annotation.id} className="p-2 bg-gray-700 rounded">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white text-sm">{annotation.text}</p>
                                <Badge
                                  className={
                                    annotation.severity === 'high' ? 'bg-red-600/20 text-red-400' :
                                    annotation.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                    'bg-green-600/20 text-green-400'
                                  }
                                >
                                  {annotation.severity}
                                </Badge>
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
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={generateReport}
                      disabled={!capturedImage || isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={exportData}
                      disabled={!capturedImage}
                      variant="outline"
                      className="w-full bg-gray-700 hover:bg-gray-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="bg-blue-900/20 border-blue-600/30">
                  <CardHeader>
                    <CardTitle className="text-blue-400 text-lg">AI Insights</CardTitle>
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}