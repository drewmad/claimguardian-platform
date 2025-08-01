'use client'

import { FolderOpen, Upload, Search, FileText, Video, File, Download, Trash2, Eye, Grid, List, Check, Image as ImageIcon, Sparkles, Calendar, Hash, Clock } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EnhancedAIService } from '@/lib/ai/enhanced-ai-service'

interface Evidence {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'other'
  category: string
  tags: string[]
  date: Date
  location?: string
  description?: string
  size: number
  url?: string
  thumbnail?: string
  aiAnalysis?: {
    autoCategory: string
    suggestedTags: string[]
    documentType?: string
    severity?: 'low' | 'medium' | 'high'
    relevanceScore: number
  }
  chainOfCustody?: {
    uploadedBy: string
    uploadedAt: Date
    modifications: Array<{
      action: string
      timestamp: Date
      user: string
    }>
  }
}

const EVIDENCE_CATEGORIES = [
  { value: 'damage-photos', label: 'Damage Photos', icon: ImageIcon, color: 'blue' },
  { value: 'receipts', label: 'Receipts & Invoices', icon: FileText, color: 'green' },
  { value: 'estimates', label: 'Repair Estimates', icon: FileText, color: 'yellow' },
  { value: 'correspondence', label: 'Correspondence', icon: FileText, color: 'purple' },
  { value: 'reports', label: 'Reports & Assessments', icon: FileText, color: 'orange' },
  { value: 'videos', label: 'Video Evidence', icon: Video, color: 'red' },
  { value: 'other', label: 'Other Documents', icon: File, color: 'gray' }
]

export default function EvidenceOrganizerPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const { user } = useAuth()
  const aiService = new EnhancedAIService()

  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    try {
      const newEvidence: Evidence[] = await Promise.all(acceptedFiles.map(async file => {
        // Determine file type
        let type: Evidence['type'] = 'other'
        if (file.type.startsWith('image/')) type = 'image'
        else if (file.type.startsWith('video/')) type = 'video'
        else if (file.type.includes('pdf') || file.type.includes('document')) type = 'document'

        // Basic auto-categorize based on filename
        let category = 'other'
        const filename = file.name.toLowerCase()
        if (filename.includes('damage') || filename.includes('photo')) category = 'damage-photos'
        else if (filename.includes('receipt') || filename.includes('invoice')) category = 'receipts'
        else if (filename.includes('estimate') || filename.includes('quote')) category = 'estimates'
        else if (filename.includes('report') || filename.includes('assessment')) category = 'reports'

        const evidenceItem: Evidence = {
          id: `evidence-${Date.now()}-${Math.random()}`,
          name: file.name,
          type,
          category,
          tags: [],
          date: new Date(file.lastModified),
          size: file.size,
          url: URL.createObjectURL(file),
          thumbnail: type === 'image' ? URL.createObjectURL(file) : undefined,
          chainOfCustody: {
            uploadedBy: user?.email || 'Unknown',
            uploadedAt: new Date(),
            modifications: []
          }
        }

        // AI-powered analysis if enabled
        if (aiEnabled && type === 'image') {
          try {
            setIsAnalyzing(true)
            const analysis = await analyzeEvidenceWithAI()
            evidenceItem.aiAnalysis = analysis
            evidenceItem.category = analysis?.autoCategory || category
            evidenceItem.tags = analysis?.suggestedTags || []
          } catch (error) {
            console.error('AI analysis failed:', error)
          } finally {
            setIsAnalyzing(false)
          }
        }

        return evidenceItem
      }))

      setEvidence(prev => [...prev, ...newEvidence])
      toast.success(`${acceptedFiles.length} files added successfully${aiEnabled ? ' with AI enhancement' : ''}`)
      
      // Preload predicted next actions
      if (user) {
        await aiService.preloadPredictiveData(user.id, 'evidence-upload')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const analyzeEvidenceWithAI = async (): Promise<Evidence['aiAnalysis']> => {
    try {
      // TODO: Replace with actual AI service call
      // const analysis = await aiService.analyzeEvidence(file)
      
      // Simulate AI analysis with potential failures
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate occasional AI service failures
          if (Math.random() < 0.05) {
            reject(new Error('AI analysis service temporarily unavailable'))
            return
          }
          resolve(undefined)
        }, 1500)
      })
      
      const mockAnalysis: Evidence['aiAnalysis'] = {
        autoCategory: 'damage-photos',
        suggestedTags: ['water-damage', 'ceiling', 'severe', 'immediate-attention'],
        documentType: 'damage-documentation',
        severity: 'high',
        relevanceScore: 0.95
      }

      return mockAnalysis
    } catch (error) {
      console.error('AI analysis failed:', error)
      toast.error('AI enhancement failed - files uploaded without AI categorization')
      // Return basic analysis without AI enhancement
      return {
        autoCategory: 'uncategorized',
        suggestedTags: [],
        severity: 'medium',
        relevanceScore: 0.5
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  const filteredEvidence = evidence.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    if (!searchQuery) return matchesCategory
    
    const query = searchQuery.toLowerCase()
    
    // Enhanced semantic search
    const matchesName = item.name.toLowerCase().includes(query)
    const matchesDescription = item.description?.toLowerCase().includes(query)
    const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(query))
    
    // AI-enhanced search - check AI-generated tags and categories
    const matchesAITags = item.aiAnalysis?.suggestedTags?.some(tag => 
      tag.toLowerCase().includes(query)
    )
    const matchesAICategory = item.aiAnalysis?.autoCategory?.toLowerCase().includes(query)
    const matchesDocType = item.aiAnalysis?.documentType?.toLowerCase().includes(query)
    
    // Semantic matching for damage-related queries
    const semanticMatches: Record<string, string[]> = {
      'water': ['flood', 'leak', 'moisture', 'wet', 'rain'],
      'damage': ['broken', 'destroyed', 'ruined', 'cracked'],
      'roof': ['ceiling', 'attic', 'shingle', 'gutter'],
      'urgent': ['severe', 'high', 'immediate', 'critical']
    }
    
    let matchesSemantic = false
    for (const [key, synonyms] of Object.entries(semanticMatches)) {
      if (query.includes(key)) {
        matchesSemantic = synonyms.some(synonym => 
          item.name.toLowerCase().includes(synonym) ||
          item.tags.some(tag => tag.toLowerCase().includes(synonym))
        )
        if (matchesSemantic) break
      }
    }
    
    const matchesSearch = matchesName || matchesDescription || matchesTags || 
                         matchesAITags || matchesAICategory || matchesDocType || 
                         matchesSemantic
    
    return matchesCategory && matchesSearch
  })

  const getCategoryCount = (category: string) => {
    if (category === 'all') return evidence.length
    return evidence.filter(item => item.category === category).length
  }

  const getTotalSize = () => {
    const totalBytes = evidence.reduce((sum, item) => sum + item.size, 0)
    return formatFileSize(totalBytes)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const deleteEvidence = (id: string) => {
    setEvidence(prev => prev.filter(item => item.id !== id))
    setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    toast.success('Evidence removed')
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const exportEvidence = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      claimant: user?.email,
      totalItems: evidence.length,
      evidence: evidence.map(item => ({
        ...item,
        url: undefined, // Remove blob URLs from export
        thumbnail: undefined
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claim-evidence-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Evidence list exported')
  }

  const getFileIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'document': return FileText
      default: return File
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-600/20 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Evidence Organizer</h1>
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                  Beta
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Smart organization with AI-powered auto-categorization, tagging, and advanced search capabilities. Includes chain of custody tracking.
              </p>
              
              {/* AI Toggle */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={aiEnabled ? 'default' : 'outline'}
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={aiEnabled ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Enhancement {aiEnabled ? 'On' : 'Off'}
                </Button>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-teal-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400" />
                    Analyzing with AI...
                  </div>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{evidence.length}</p>
                      <p className="text-sm text-gray-400">Total Files</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {evidence.filter(e => e.type === 'image').length}
                      </p>
                      <p className="text-sm text-gray-400">Photos</p>
                    </div>
                    <ImageIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {evidence.filter(e => e.type === 'document').length}
                      </p>
                      <p className="text-sm text-gray-400">Documents</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{getTotalSize()}</p>
                      <p className="text-sm text-gray-400">Total Size</p>
                    </div>
                    <File className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-blue-600/20 border border-blue-600/30'
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderOpen className={`h-4 w-4 ${
                              selectedCategory === 'all' ? 'text-blue-400' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              selectedCategory === 'all' ? 'text-white' : 'text-gray-300'
                            }`}>
                              All Evidence
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryCount('all')}
                          </Badge>
                        </div>
                      </button>

                      {EVIDENCE_CATEGORIES.map((category) => {
                        const Icon = category.icon
                        const count = getCategoryCount(category.value)
                        
                        return (
                          <button
                            key={category.value}
                            onClick={() => setSelectedCategory(category.value)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              selectedCategory === category.value
                                ? 'bg-blue-600/20 border border-blue-600/30'
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 text-${category.color}-400`} />
                                <span className={`font-medium ${
                                  selectedCategory === category.value ? 'text-white' : 'text-gray-300'
                                }`}>
                                  {category.label}
                                </span>
                              </div>
                              {count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {count}
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Upload Area */}
                <div
                  {...getRootProps()}
                  className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-300 font-medium">
                    {isDragActive
                      ? 'Drop files here...'
                      : 'Drag & drop evidence files here, or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports images, videos, PDFs, and documents
                  </p>
                </div>

                {/* Toolbar */}
                <Card className="bg-gray-800 border-gray-700 mb-6">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search evidence..."
                            className="pl-10 bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                            }
                          >
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                            }
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {selectedItems.length > 0 && (
                          <Badge variant="outline" className="px-3 py-1">
                            {selectedItems.length} selected
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportEvidence}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence Grid/List */}
                {filteredEvidence.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {searchQuery || selectedCategory !== 'all'
                          ? 'No evidence found matching your filters'
                          : 'No evidence uploaded yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvidence.map((item) => {
                      const Icon = getFileIcon(item.type)
                      const isSelected = selectedItems.includes(item.id)
                      
                      return (
                        <Card
                          key={item.id}
                          className={`bg-gray-800 border-gray-700 overflow-hidden cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => toggleSelection(item.id)}
                        >
                          <div className="relative">
                            {item.thumbnail ? (
                              <Image
                                src={item.thumbnail}
                                alt={item.name}
                                width={400}
                                height={192}
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                                <Icon className="h-12 w-12 text-gray-500" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 p-1 bg-blue-600 rounded-full">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-medium text-white truncate">{item.name}</h4>
                            
                            {/* AI Analysis Tags */}
                            {item.aiAnalysis && (
                              <div className="mt-2 space-y-2">
                                {item.aiAnalysis.severity && (
                                  <Badge 
                                    className={
                                      item.aiAnalysis.severity === 'high' ? 'bg-red-600/20 text-red-400' :
                                      item.aiAnalysis.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                      'bg-green-600/20 text-green-400'
                                    }
                                  >
                                    {item.aiAnalysis.severity} severity
                                  </Badge>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 3).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      <Hash className="h-2 w-2 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatFileSize(item.size)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {EVIDENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Preview functionality
                                }}
                                className="flex-1"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteEvidence(item.id)
                                }}
                                className="flex-1 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-700">
                        {filteredEvidence.map((item) => {
                          const Icon = getFileIcon(item.type)
                          const isSelected = selectedItems.includes(item.id)
                          
                          return (
                            <div
                              key={item.id}
                              className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-all ${
                                isSelected ? 'bg-blue-900/20' : ''
                              }`}
                              onClick={() => toggleSelection(item.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                  {isSelected ? (
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                      <Check className="h-5 w-5 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                      <Icon className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-white truncate">{item.name}</h4>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                    <span>{formatFileSize(item.size)}</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {item.date.toLocaleDateString()}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {EVIDENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                    </Badge>
                                    {item.chainOfCustody && (
                                      <span className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        by {item.chainOfCustody.uploadedBy.split('@')[0]}
                                      </span>
                                    )}
                                  </div>
                                  {/* AI Tags in List View */}
                                  {item.aiAnalysis && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {item.tags.slice(0, 5).map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          <Hash className="h-2 w-2 mr-1" />
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Preview functionality
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteEvidence(item.id)
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}