/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { Camera, Upload, Palette, Home, Sparkles, CheckCircle, Info, Download, Layers, Sun, Shield, ChevronRight, Package, Building, Wrench, Grid } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { CameraCapture } from '@/components/camera/camera-capture'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
interface MaterialAnalysis {
  id: string
  imageUrl: string
  timestamp: Date
  room: string
  surface: string
  material: {
    type: string
    subType?: string
    brand?: string
    grade?: string
    confidence: number
  }
  finish: {
    type: string
    sheen?: string
    texture?: string
    color?: string
    pattern?: string
  }
  condition: {
    rating: 'excellent' | 'good' | 'fair' | 'poor'
    issues: string[]
    age?: string
  }
  specifications: {
    thickness?: string
    dimensions?: string
    installation?: string
    certification?: string[]
  }
  valuation: {
    replacementCost: number
    repairCost?: number
    lifeExpectancy: string
    maintenanceFrequency: string
  }
  recommendations: {
    maintenance: string[]
    repairs: string[]
    upgrades: string[]
  }
}

export default function MaterialFinishAnalyzerPage() {
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<MaterialAnalysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<MaterialAnalysis | null>(null)
  const [selectedRoom, setSelectedRoom] = useState('all')
  const [selectedSurface, setSelectedSurface] = useState('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const rooms = [
    'Kitchen', 'Bathroom', 'Living Room', 'Bedroom',
    'Dining Room', 'Office', 'Garage', 'Exterior'
  ]

  const surfaces = [
    { id: 'flooring', label: 'Flooring', icon: Grid },
    { id: 'walls', label: 'Walls', icon: Building },
    { id: 'countertops', label: 'Countertops', icon: Layers },
    { id: 'cabinets', label: 'Cabinets', icon: Package },
    { id: 'fixtures', label: 'Fixtures', icon: Wrench },
    { id: 'roofing', label: 'Roofing', icon: Home }
  ]

  const handleImageCapture = async (file: File) => {
    setIsAnalyzing(true)

    // Convert file to data URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setCurrentImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Simulate AI analysis
    setTimeout(() => {
      const mockAnalysis: MaterialAnalysis = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(file),
        timestamp: new Date(),
        room: 'Kitchen',
        surface: 'countertops',
        material: {
          type: 'Natural Stone',
          subType: 'Granite',
          brand: 'Premium Stone Co.',
          grade: 'Level 3',
          confidence: 0.92
        },
        finish: {
          type: 'Polished',
          sheen: 'High Gloss',
          texture: 'Smooth',
          color: 'Black Galaxy',
          pattern: 'Speckled with gold flecks'
        },
        condition: {
          rating: 'excellent',
          issues: ['Minor surface scratches near sink'],
          age: '3-5 years'
        },
        specifications: {
          thickness: '3cm (1.25 inches)',
          dimensions: 'Standard slab',
          installation: 'Professional edge finishing',
          certification: ['NSF Certified', 'Radon Safe']
        },
        valuation: {
          replacementCost: 4500,
          repairCost: 350,
          lifeExpectancy: '25-30 years',
          maintenanceFrequency: 'Annual sealing'
        },
        recommendations: {
          maintenance: [
            'Apply granite sealer annually',
            'Use pH-neutral cleaners only',
            'Avoid acidic substances'
          ],
          repairs: [
            'Professional polishing for scratch removal',
            'Re-seal high-use areas'
          ],
          upgrades: [
            'Consider undermount sink upgrade',
            'Add LED under-cabinet lighting'
          ]
        }
      }

      setAnalyses([mockAnalysis, ...analyses])
      setSelectedAnalysis(mockAnalysis)
      setIsAnalyzing(false)
      setShowCameraCapture(false)
      toast.success('Material analysis complete!')
    }, 3000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageCapture(file)
    }
  }

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      propertyAddress: '1234 Main Street',
      totalAnalyses: analyses.length,
      analyses: analyses,
      totalReplacementValue: analyses.reduce((sum, a) => sum + a.valuation.replacementCost, 0),
      recommendations: {
        immediate: analyses.filter(a => a.condition.rating === 'poor').length,
        routine: analyses.filter(a => a.condition.rating === 'fair').length,
        preventive: analyses.filter(a => a.condition.rating === 'good' || a.condition.rating === 'excellent').length
      }
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `material-analysis-report-${Date.now()}.json`
    a.click()

    toast.success('Report generated successfully!')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/ai-tools"
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Material & Finish Analyzer</h1>
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                  AI Powered
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Instantly identify materials, finishes, and get replacement cost estimates. Perfect for insurance documentation and home improvement planning.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Analysis Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upload/Capture Section */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Analyze Material</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!currentImage ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setShowCameraCapture(true)}
                            className="aspect-video bg-gray-700 rounded-lg hover:bg-gray-600 transition-all flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-600"
                          >
                            <Camera className="h-12 w-12 text-blue-400" />
                            <span className="text-white font-medium">Take Photo</span>
                            <span className="text-xs text-gray-400">Use camera</span>
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-video bg-gray-700 rounded-lg hover:bg-gray-600 transition-all flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-600"
                          >
                            <Upload className="h-12 w-12 text-purple-400" />
                            <span className="text-white font-medium">Upload Photo</span>
                            <span className="text-xs text-gray-400">JPG, PNG up to 10MB</span>
                          </button>
                        </div>

                        <Alert className="bg-blue-900/20 border-blue-600/30">
                          <Info className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-blue-200">
                            For best results, capture materials in good lighting with clear texture visible. Include any labels or markings.
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isAnalyzing ? (
                          <div className="relative">
                            <img
                              src={currentImage}
                              alt="Material"
                              className="w-full rounded-lg opacity-50"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="bg-black/80 rounded-lg p-6">
                                <Sparkles className="h-8 w-8 text-purple-400 animate-pulse mx-auto mb-3" />
                                <p className="text-white font-medium mb-3">Analyzing Material...</p>
                                <Progress value={66} className="w-48" />
                                <p className="text-xs text-gray-400 mt-2">Identifying patterns and textures</p>
                              </div>
                            </div>
                          </div>
                        ) : selectedAnalysis ? (
                          <div className="space-y-6">
                            <div className="relative">
                              <img
                                src={currentImage}
                                alt="Material"
                                className="w-full rounded-lg"
                              />
                              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
                                <p className="text-white text-sm font-medium flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  {Math.round(selectedAnalysis.material.confidence * 100)}% Confidence
                                </p>
                              </div>
                            </div>

                            {/* Analysis Results */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-sm text-gray-400 mb-1">Material Type</h4>
                                <p className="text-lg font-semibold text-white">{selectedAnalysis.material.type}</p>
                                <p className="text-sm text-gray-300">{selectedAnalysis.material.subType}</p>
                              </div>
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-sm text-gray-400 mb-1">Finish</h4>
                                <p className="text-lg font-semibold text-white">{selectedAnalysis.finish.type}</p>
                                <p className="text-sm text-gray-300">{selectedAnalysis.finish.sheen}</p>
                              </div>
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-sm text-gray-400 mb-1">Condition</h4>
                                <Badge className={`text-sm ${
                                  selectedAnalysis.condition.rating === 'excellent' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                                  selectedAnalysis.condition.rating === 'good' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                                  selectedAnalysis.condition.rating === 'fair' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                                  'bg-red-600/20 text-red-400 border-red-600/30'
                                }`}>
                                  {selectedAnalysis.condition.rating}
                                </Badge>
                                <p className="text-sm text-gray-300 mt-1">{selectedAnalysis.condition.age}</p>
                              </div>
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-sm text-gray-400 mb-1">Replacement Cost</h4>
                                <p className="text-lg font-semibold text-green-400">
                                  ${selectedAnalysis.valuation.replacementCost.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-300">Per installation</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => {
                                setCurrentImage(null)
                                setSelectedAnalysis(null)
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Analyze Another Material
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {/* Recent Analyses */}
                {analyses.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Recent Analyses</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateReport}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all cursor-pointer"
                            onClick={() => setSelectedAnalysis(analysis)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden">
                                  <img
                                    src={analysis.imageUrl}
                                    alt={analysis.material.type}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    {analysis.material.type} - {analysis.material.subType}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {analysis.room} • {analysis.surface}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="text-xs">{analysis.condition.rating}</Badge>
                                    <span className="text-xs text-green-400">
                                      ${analysis.valuation.replacementCost.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400">Total Analyses</span>
                          <span className="text-lg font-semibold text-white">{analyses.length}</span>
                        </div>
                        <Progress value={analyses.length * 10} className="h-2" />
                      </div>

                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Total Value</span>
                          <span className="text-lg font-semibold text-green-400">
                            ${analyses.reduce((sum, a) => sum + a.valuation.replacementCost, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Excellent</span>
                          <span className="text-sm text-green-400">
                            {analyses.filter(a => a.condition.rating === 'excellent').length} items
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Needs Repair</span>
                          <span className="text-sm text-orange-400">
                            {analyses.filter(a => a.condition.rating === 'fair' || a.condition.rating === 'poor').length} items
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Surface Types */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Surface Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {surfaces.map((surface) => {
                        const Icon = surface.icon
                        return (
                          <button
                            key={surface.id}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-center"
                          >
                            <Icon className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                            <p className="text-xs text-white">{surface.label}</p>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-purple-900/20 border-purple-600/30">
                  <CardHeader>
                    <CardTitle className="text-purple-400 text-lg">Pro Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Sun className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span className="text-gray-300">Natural lighting reveals true colors and textures</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Camera className="h-4 w-4 text-blue-400 mt-0.5" />
                        <span className="text-gray-300">Include edges and joints for accurate identification</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">Document for insurance claims and renovations</span>
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
            onCapture={handleImageCapture}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
