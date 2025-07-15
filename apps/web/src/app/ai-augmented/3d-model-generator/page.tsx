/**
 * @fileMetadata
 * @purpose 3D model generator from multiple images using AI
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["ai", "3d-modeling", "image-processing", "reconstruction"]
 * @status active
 */
'use client'

import { useState, useRef } from 'react'
import { 
  Upload, Camera, RotateCcw, Download, Eye, Grid, 
  Play, Pause, Settings, Info, CheckCircle,
  X, Move3D, Zap, Sparkles, Target, Layers,
  Volume2, VolumeX, Maximize, ZoomIn, ZoomOut
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card } from '@claimguardian/ui'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type ProcessingStage = 'upload' | 'analyzing' | 'reconstructing' | 'optimizing' | 'complete'
type ViewMode = '3d' | 'wireframe' | 'textured'
type Quality = 'draft' | 'standard' | 'high' | 'ultra'

interface UploadedImage {
  id: string
  file: File
  preview: string
  analyzed: boolean
  keyPoints?: number
  confidence?: number
}

interface ModelSettings {
  quality: Quality
  includeTextures: boolean
  fillHoles: boolean
  smoothSurfaces: boolean
  generateMeasurements: boolean
  outputFormat: 'obj' | 'fbx' | 'gltf' | 'stl'
}

function ThreeDModelGeneratorContent() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('upload')
  const [progress, setProgress] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    quality: 'standard',
    includeTextures: true,
    fillHoles: true,
    smoothSurfaces: true,
    generateMeasurements: true,
    outputFormat: 'obj'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages: UploadedImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      analyzed: false
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const startProcessing = () => {
    if (images.length < 3) return
    
    setProcessingStage('analyzing')
    setProgress(0)
    
    // Simulate processing stages
    const stages = [
      { stage: 'analyzing', duration: 3000, endProgress: 25 },
      { stage: 'reconstructing', duration: 8000, endProgress: 70 },
      { stage: 'optimizing', duration: 4000, endProgress: 95 },
      { stage: 'complete', duration: 1000, endProgress: 100 }
    ]
    
    let currentTime = 0
    stages.forEach(({ stage, duration, endProgress }) => {
      setTimeout(() => {
        setProcessingStage(stage as ProcessingStage)
        
        const interval = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 2, endProgress)
            if (newProgress >= endProgress) {
              clearInterval(interval)
            }
            return newProgress
          })
        }, 100)
      }, currentTime)
      currentTime += duration
    })
  }

  const getQualityColor = (quality: Quality) => {
    switch(quality) {
      case 'draft': return 'text-gray-400'
      case 'standard': return 'text-blue-400'
      case 'high': return 'text-purple-400'
      case 'ultra': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getQualityDescription = (quality: Quality) => {
    switch(quality) {
      case 'draft': return 'Fast processing, basic detail (2-3 min)'
      case 'standard': return 'Balanced quality and speed (5-8 min)'
      case 'high': return 'High detail, longer processing (10-15 min)'
      case 'ultra': return 'Maximum detail, longest processing (20-30 min)'
      default: return ''
    }
  }

  const getStageDescription = (stage: ProcessingStage) => {
    switch(stage) {
      case 'upload': return 'Upload multiple images of your object from different angles'
      case 'analyzing': return 'AI is analyzing image features and identifying key points'
      case 'reconstructing': return 'Building 3D geometry from image data using photogrammetry'
      case 'optimizing': return 'Refining mesh, applying textures, and optimizing geometry'
      case 'complete': return '3D model generation complete! Review and download your model'
      default: return ''
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">3D Model Generator</h1>
              <p className="text-gray-400">Transform photos into precise 3D models using AI photogrammetry</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Processing Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    processingStage === 'complete' ? 'bg-green-600' :
                    processingStage !== 'upload' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {processingStage === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : processingStage !== 'upload' ? (
                      <Zap className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <Move3D className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white capitalize">{processingStage}</h3>
                    <p className="text-sm text-gray-400">{getStageDescription(processingStage)}</p>
                  </div>
                </div>
                {processingStage !== 'upload' && processingStage !== 'complete' && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{progress}%</p>
                    <p className="text-xs text-gray-400">Processing</p>
                  </div>
                )}
              </div>
              
              {processingStage !== 'upload' && (
                <Progress value={progress} className="h-2" />
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Upload Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    Image Upload ({images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-2">
                      Drop images here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Minimum 3 images, maximum 50
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-300 mb-1">Photo Tips</p>
                        <ul className="text-xs text-blue-200 space-y-1">
                          <li>• Take photos from all angles (360°)</li>
                          <li>• Ensure good lighting and focus</li>
                          <li>• Include overlapping views (30-50%)</li>
                          <li>• Avoid shadows and reflections</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Image Grid */}
                  <div className="space-y-3">
                    {images.map((image) => (
                      <div key={image.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                        <div 
                          className="w-12 h-12 rounded bg-gray-600 flex items-center justify-center text-xs text-gray-300"
                        >
                          IMG
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white truncate">{image.file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(image.file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <button 
                          onClick={() => removeImage(image.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={startProcessing}
                    disabled={images.length < 3 || (processingStage !== 'upload' && processingStage !== 'complete')}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {processingStage === 'upload' ? 'Generate 3D Model' : 
                     processingStage === 'complete' ? 'Generate New Model' : 'Processing...'}
                  </button>
                </CardContent>
              </Card>

              {/* Settings Panel */}
              {showSettings && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Quality</label>
                      <div className="space-y-2">
                        {(['draft', 'standard', 'high', 'ultra'] as Quality[]).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => setModelSettings(prev => ({ ...prev, quality }))}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              modelSettings.quality === quality
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`font-medium capitalize ${getQualityColor(quality)}`}>
                                {quality}
                              </span>
                              {quality === 'ultra' && (
                                <Badge variant="outline" className="text-xs">Premium</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {getQualityDescription(quality)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Output Format</label>
                      <select 
                        value={modelSettings.outputFormat}
                        onChange={(e) => setModelSettings(prev => ({ ...prev, outputFormat: e.target.value as 'obj' | 'fbx' | 'gltf' | 'stl' }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      >
                        <option value="obj">OBJ (Universal)</option>
                        <option value="fbx">FBX (Animation)</option>
                        <option value="gltf">GLTF (Web/AR)</option>
                        <option value="stl">STL (3D Printing)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-white">Options</label>
                      {[
                        { key: 'includeTextures', label: 'Include Textures', desc: 'Apply color and surface details' },
                        { key: 'fillHoles', label: 'Fill Holes', desc: 'Automatically fill gaps in geometry' },
                        { key: 'smoothSurfaces', label: 'Smooth Surfaces', desc: 'Reduce surface roughness' },
                        { key: 'generateMeasurements', label: 'Generate Measurements', desc: 'Include dimensional data' }
                      ].map((option) => (
                        <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={modelSettings[option.key as keyof ModelSettings] as boolean}
                            onChange={(e) => setModelSettings(prev => ({ 
                              ...prev, 
                              [option.key]: e.target.checked 
                            }))}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm text-white">{option.label}</p>
                            <p className="text-xs text-gray-400">{option.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 3D Viewer Section */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700 h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Move3D className="w-5 h-5 text-cyan-400" />
                      3D Model Viewer
                    </CardTitle>
                    {processingStage === 'complete' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewMode(viewMode === '3d' ? 'wireframe' : viewMode === 'wireframe' ? 'textured' : '3d')}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                        >
                          {viewMode === '3d' ? '3D' : viewMode === 'wireframe' ? 'Wireframe' : 'Textured'}
                        </button>
                        <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="h-96">
                  {processingStage === 'upload' ? (
                    <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg">
                      <div className="text-center">
                        <Grid className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Upload images to begin 3D reconstruction</p>
                      </div>
                    </div>
                  ) : processingStage === 'complete' ? (
                    <div className="h-full bg-gray-900 rounded-lg relative overflow-hidden">
                      {/* Mock 3D Viewer */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl mx-auto mb-4 transform rotate-12 animate-pulse" />
                          <p className="text-white font-medium">Interactive 3D Model</p>
                          <p className="text-sm text-gray-400">Click and drag to rotate</p>
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                          <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="text-white hover:text-cyan-400"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button className="text-white hover:text-cyan-400">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white hover:text-cyan-400"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                          <button className="text-white hover:text-cyan-400">
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <button className="text-white hover:text-cyan-400">
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button className="text-white hover:text-cyan-400">
                            <Target className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white font-medium">Generating 3D Model</p>
                        <p className="text-sm text-gray-400">This may take several minutes</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Model Info & Download */}
              {processingStage === 'complete' && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Model Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Vertices</span>
                          <span className="text-white">45,892</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Faces</span>
                          <span className="text-white">89,234</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Texture Size</span>
                          <span className="text-white">2048x2048</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">File Size</span>
                          <span className="text-white">12.4 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quality Score</span>
                          <span className="text-green-400">92%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Download Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Download Model ({modelSettings.outputFormat.toUpperCase()})
                        </button>
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          Preview in AR
                        </button>
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                          <Layers className="w-4 h-4" />
                          Export Measurements
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ThreeDModelGeneratorPage() {
  return (
    <ProtectedRoute>
      <ThreeDModelGeneratorContent />
    </ProtectedRoute>
  )
}