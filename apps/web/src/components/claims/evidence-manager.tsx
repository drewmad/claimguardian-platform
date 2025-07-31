'use client'

import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  Grid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface Evidence {
  id: string
  claimId: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  category: EvidenceCategory
  uploadedAt: string
  takenAt?: string
  description?: string
  tags: string[]
  metadata?: {
    location?: string
    weather?: string
    damageType?: string
    severity?: string
  }
  aiAnalysis?: {
    summary: string
    detectedDamage: string[]
    estimatedCost?: number
    confidence: number
  }
}

type EvidenceCategory = 
  | 'damage_photos' 
  | 'repair_estimates' 
  | 'invoices' 
  | 'receipts' 
  | 'correspondence' 
  | 'policy_documents' 
  | 'weather_reports' 
  | 'expert_reports'
  | 'other'

const CATEGORY_CONFIG = {
  damage_photos: { label: 'Damage Photos', icon: Camera, color: 'bg-red-600' },
  repair_estimates: { label: 'Repair Estimates', icon: FileText, color: 'bg-blue-600' },
  invoices: { label: 'Invoices', icon: FileText, color: 'bg-green-600' },
  receipts: { label: 'Receipts', icon: FileText, color: 'bg-purple-600' },
  correspondence: { label: 'Correspondence', icon: FileText, color: 'bg-yellow-600' },
  policy_documents: { label: 'Policy Documents', icon: FileText, color: 'bg-indigo-600' },
  weather_reports: { label: 'Weather Reports', icon: FileText, color: 'bg-cyan-600' },
  expert_reports: { label: 'Expert Reports', icon: FileText, color: 'bg-pink-600' },
  other: { label: 'Other', icon: FileText, color: 'bg-gray-600' }
}

interface EvidenceManagerProps {
  claimId: string
  onUpdate?: (evidence: Evidence[]) => void
}

export function EvidenceManager({ claimId, onUpdate }: EvidenceManagerProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Evidence | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Mock data for demonstration
  useState(() => {
    const mockEvidence: Evidence[] = [
      {
        id: '1',
        claimId,
        fileUrl: '/placeholder-damage-1.jpg',
        fileName: 'kitchen-water-damage-1.jpg',
        fileSize: 2457600,
        fileType: 'image/jpeg',
        category: 'damage_photos',
        uploadedAt: '2024-11-20T10:30:00Z',
        takenAt: '2024-11-20T09:00:00Z',
        description: 'Water damage to kitchen ceiling from burst pipe',
        tags: ['kitchen', 'ceiling', 'water-damage'],
        metadata: {
          location: 'Kitchen',
          damageType: 'Water Damage',
          severity: 'Severe'
        },
        aiAnalysis: {
          summary: 'Significant water damage visible on kitchen ceiling with staining and potential structural damage',
          detectedDamage: ['Water staining', 'Ceiling sagging', 'Paint peeling'],
          estimatedCost: 3500,
          confidence: 0.92
        }
      },
      {
        id: '2',
        claimId,
        fileUrl: '/placeholder-estimate.pdf',
        fileName: 'contractor-estimate.pdf',
        fileSize: 156789,
        fileType: 'application/pdf',
        category: 'repair_estimates',
        uploadedAt: '2024-11-21T14:00:00Z',
        description: 'Initial repair estimate from ABC Contractors',
        tags: ['estimate', 'contractor', 'repairs'],
        metadata: {
          location: 'Kitchen',
          damageType: 'Water Damage'
        }
      }
    ]
    setEvidence(mockEvidence)
  })

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createBrowserSupabaseClient()
      const uploadedEvidence: Evidence[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${claimId}/${Date.now()}-${file.name}`
        
        // Simulate upload progress
        setUploadProgress((i + 0.5) / files.length * 100)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-evidence')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('claim-evidence')
          .getPublicUrl(fileName)

        // Create evidence record
        const newEvidence: Evidence = {
          id: `temp-${Date.now()}-${i}`,
          claimId,
          fileUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          category: categorizeFile(file),
          uploadedAt: new Date().toISOString(),
          tags: [],
          description: ''
        }

        uploadedEvidence.push(newEvidence)
        setUploadProgress((i + 1) / files.length * 100)
      }

      setEvidence(prev => [...prev, ...uploadedEvidence])
      toast.success(`Uploaded ${uploadedEvidence.length} files successfully`)
      
      if (onUpdate) {
        onUpdate([...evidence, ...uploadedEvidence])
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [claimId, evidence, onUpdate])

  const categorizeFile = (file: File): EvidenceCategory => {
    if (file.type.startsWith('image/')) return 'damage_photos'
    if (file.name.includes('estimate')) return 'repair_estimates'
    if (file.name.includes('invoice')) return 'invoices'
    if (file.name.includes('receipt')) return 'receipts'
    if (file.name.includes('policy')) return 'policy_documents'
    return 'other'
  }

  const handleCategoryUpdate = async (evidenceId: string, category: EvidenceCategory) => {
    setEvidence(prev => prev.map(e => 
      e.id === evidenceId ? { ...e, category } : e
    ))
    toast.success('Category updated')
  }

  const handleDescriptionUpdate = async (evidenceId: string, description: string) => {
    setEvidence(prev => prev.map(e => 
      e.id === evidenceId ? { ...e, description } : e
    ))
  }

  const handleDelete = async (evidenceId: string) => {
    setEvidence(prev => prev.filter(e => e.id !== evidenceId))
    toast.success('Evidence removed')
  }

  const filteredEvidence = evidence.filter(e => {
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      e.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredEvidence.map(item => {
        const config = CATEGORY_CONFIG[item.category]
        const Icon = config.icon
        
        return (
          <Card key={item.id} className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="relative aspect-video bg-gray-900">
              {item.fileType.startsWith('image/') ? (
                <img 
                  src={item.fileUrl} 
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-16 h-16 text-gray-600" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedFile(item)}
                  className="bg-gray-900/80 backdrop-blur-sm"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>

              {item.aiAnalysis && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400">AI Analysis</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {item.aiAnalysis.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm truncate">
                    {item.fileName}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`${config.color} text-white text-xs`}>
                  {config.label}
                </Badge>
              </div>

              {item.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={item.fileUrl} download={item.fileName}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      {filteredEvidence.map(item => {
        const config = CATEGORY_CONFIG[item.category]
        const Icon = config.icon
        
        return (
          <Card key={item.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-white">{item.fileName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {item.aiAnalysis && (
                      <Badge className="bg-yellow-600 text-white text-xs">
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    {item.description && (
                      <>
                        <span>•</span>
                        <span className="truncate">{item.description}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(item)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={item.fileUrl} download={item.fileName}>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderTimelineView = () => {
    const groupedByDate = filteredEvidence.reduce((acc, item) => {
      const date = new Date(item.uploadedAt).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(item)
      return acc
    }, {} as Record<string, Evidence[]>)

    return (
      <div className="space-y-8">
        {Object.entries(groupedByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-white">{date}</h3>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              
              <div className="ml-9 space-y-4">
                {items.map(item => {
                  const config = CATEGORY_CONFIG[item.category]
                  const Icon = config.icon
                  
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute top-10 left-5 w-px h-full bg-gray-700" />
                      </div>
                      
                      <Card className="flex-1 bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-white">{item.fileName}</h4>
                              <p className="text-sm text-gray-400">
                                {new Date(item.uploadedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge className={`${config.color} text-white text-xs`}>
                              {config.label}
                            </Badge>
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                          )}
                          
                          {item.aiAnalysis && (
                            <div className="bg-gray-700/50 rounded-lg p-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-400">AI Analysis</span>
                              </div>
                              <p className="text-sm text-gray-300">{item.aiAnalysis.summary}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Evidence Management</h2>
          <p className="text-gray-400">
            {evidence.length} files • {(evidence.reduce((sum, e) => sum + e.fileSize, 0) / 1024 / 1024).toFixed(2)} MB total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-gray-700"
            onClick={() => {
              const input = document.getElementById('evidence-upload') as HTMLInputElement
              input?.click()
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Evidence
          </Button>
          
          <input
            id="evidence-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Uploading files...</span>
            <span className="text-sm text-gray-400">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? '' : 'border-gray-700'}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? '' : 'border-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className={viewMode === 'timeline' ? '' : 'border-gray-700'}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Evidence Display */}
      {filteredEvidence.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No evidence uploaded yet</h3>
            <p className="text-gray-400 mb-6">
              Upload photos, documents, and other files to support your claim
            </p>
            <Button
              onClick={() => {
                const input = document.getElementById('evidence-upload') as HTMLInputElement
                input?.click()
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Evidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'timeline' && renderTimelineView()}
        </>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">{selectedFile.fileName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {selectedFile.fileType.startsWith('image/') ? (
                <img
                  src={selectedFile.fileUrl}
                  alt={selectedFile.fileName}
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Preview not available</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 border-gray-700"
                      asChild
                    >
                      <a href={selectedFile.fileUrl} download={selectedFile.fileName}>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="file-category">Category</Label>
                  <Select
                    value={selectedFile.category}
                    onValueChange={(v) => {
                      handleCategoryUpdate(selectedFile.id, v as EvidenceCategory)
                      setSelectedFile({ ...selectedFile, category: v as EvidenceCategory })
                    }}
                  >
                    <SelectTrigger id="file-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="file-description">Description</Label>
                  <Textarea
                    id="file-description"
                    value={selectedFile.description || ''}
                    onChange={(e) => {
                      handleDescriptionUpdate(selectedFile.id, e.target.value)
                      setSelectedFile({ ...selectedFile, description: e.target.value })
                    }}
                    placeholder="Add a description..."
                    rows={3}
                  />
                </div>
                
                {selectedFile.aiAnalysis && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      AI Analysis
                    </h4>
                    <p className="text-sm text-gray-300 mb-3">{selectedFile.aiAnalysis.summary}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Detected Damage:</span>
                        <ul className="mt-1">
                          {selectedFile.aiAnalysis.detectedDamage.map((damage, i) => (
                            <li key={i} className="text-gray-300">• {damage}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-gray-400">Estimated Cost:</span>
                        <p className="text-gray-300">
                          ${selectedFile.aiAnalysis.estimatedCost?.toLocaleString() || 'N/A'}
                        </p>
                        <span className="text-gray-400">Confidence:</span>
                        <p className="text-gray-300">
                          {Math.round(selectedFile.aiAnalysis.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}