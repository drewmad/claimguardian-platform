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

import { FolderOpen, Search, Tag, FileText, Image, VideoIcon, Upload, Brain, Sparkles, CheckCircle, Clock, Archive, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface EvidenceItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'audio'
  category: 'damage' | 'before' | 'after' | 'receipts' | 'correspondence' | 'reports'
  tags: string[]
  dateCreated: string
  fileSize: string
  aiAnalysis?: string
  thumbnail?: string
  priority: 'high' | 'medium' | 'low'
}

const mockEvidenceItems: EvidenceItem[] = [
  {
    id: '1',
    name: 'Kitchen Water Damage Overview.jpg',
    type: 'image',
    category: 'damage',
    tags: ['water damage', 'kitchen', 'ceiling'],
    dateCreated: '2024-01-15',
    fileSize: '2.3 MB',
    aiAnalysis: 'Water staining detected on ceiling. Estimated damage area: 12 sq ft. Severity: Moderate to severe.',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Contractor Estimate - ABC Restoration.pdf',
    type: 'document',
    category: 'reports',
    tags: ['estimate', 'contractor', 'repair cost'],
    dateCreated: '2024-01-16',
    fileSize: '456 KB',
    aiAnalysis: 'Professional repair estimate: $8,750. Includes water damage remediation and ceiling repair.',
    priority: 'high'
  },
  {
    id: '3',
    name: 'Before - Kitchen Original State.jpg',
    type: 'image',
    category: 'before',
    tags: ['kitchen', 'original condition'],
    dateCreated: '2023-12-01',
    fileSize: '1.8 MB',
    aiAnalysis: 'Clean, undamaged kitchen ceiling for comparison. Good baseline documentation.',
    priority: 'medium'
  },
  {
    id: '4',
    name: 'Insurance Adjuster Call Recording.mp3',
    type: 'audio',
    category: 'correspondence',
    tags: ['adjuster', 'call', 'discussion'],
    dateCreated: '2024-01-18',
    fileSize: '12.4 MB',
    aiAnalysis: 'Discussion about coverage limits and next steps. Adjuster confirmed coverage for water damage.',
    priority: 'high'
  }
]

export default function EvidenceOrganizerPage() {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(mockEvidenceItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const filteredItems = evidenceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.aiAnalysis?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const runAIAnalysis = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsAnalyzing(false)
    toast.success('AI analysis complete! Evidence auto-categorized and tagged.')
  }

  const handleFileUpload = () => {
    toast.success('Files uploaded successfully! AI analysis started.')
    // Simulate adding new files
    const newItem: EvidenceItem = {
      id: Date.now().toString(),
      name: 'New Evidence File.jpg',
      type: 'image',
      category: 'damage',
      tags: ['ai-generated', 'recent'],
      dateCreated: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      aiAnalysis: 'Analyzing... AI categorization in progress.',
      priority: 'medium'
    }
    setEvidenceItems(prev => [newItem, ...prev])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <VideoIcon className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'audio': return <Archive className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'damage': return 'bg-red-600/20 text-red-400 border-red-600/30'
      case 'before': return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
      case 'after': return 'bg-green-600/20 text-green-400 border-green-600/30'
      case 'receipts': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
      case 'correspondence': return 'bg-purple-600/20 text-purple-400 border-purple-600/30'
      case 'reports': return 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30'
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header with Advanced Liquid Glass */}
            <div className="mb-8 relative">
              {/* Premium Background Orb */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-teal-400/25 via-cyan-500/20 to-blue-600/25 rounded-full blur-3xl animate-pulse opacity-40" />
              
              <div className="relative">
                <Link 
                  href="/ai-tools" 
                  className="text-teal-400 hover:text-teal-300 text-sm mb-6 inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-teal-400/20 shadow-[0_8px_32px_rgba(20,184,166,0.15)] hover:shadow-[0_8px_32px_rgba(20,184,166,0.25)] transition-all duration-300"
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-teal-600/30 to-cyan-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(20,184,166,0.3)] hover:shadow-[0_25px_80px_rgba(20,184,166,0.4)] transition-all duration-700">
                    <FolderOpen className="h-8 w-8 text-teal-300 drop-shadow-[0_0_20px_rgba(20,184,166,0.8)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">Evidence Organizer</h1>
                      <Badge className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-gray-300 max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      Smart organization with AI-powered auto-categorization, tagging, and advanced search capabilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(20,184,166,0.15)] transition-all duration-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-teal-600/30 to-cyan-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(20,184,166,0.2)]">
                      <Archive className="h-6 w-6 text-teal-300 drop-shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{evidenceItems.length}</p>
                      <p className="text-sm text-gray-400">Total Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.15)] transition-all duration-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-600/30 to-emerald-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(34,197,94,0.2)]">
                      <CheckCircle className="h-6 w-6 text-green-300 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{evidenceItems.filter(item => item.aiAnalysis).length}</p>
                      <p className="text-sm text-gray-400">AI Analyzed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)] transition-all duration-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-yellow-600/30 to-orange-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                      <Clock className="h-6 w-6 text-yellow-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{evidenceItems.filter(item => item.priority === 'high').length}</p>
                      <p className="text-sm text-gray-400">High Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(147,51,234,0.15)] transition-all duration-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(147,51,234,0.2)]">
                      <Tag className="h-6 w-6 text-purple-300 drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{[...new Set(evidenceItems.flatMap(item => item.tags))].length}</p>
                      <p className="text-sm text-gray-400">Unique Tags</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Premium Search and Controls */}
            <Card className="bg-gray-800/60 backdrop-blur-xl border-gray-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_80px_rgba(20,184,166,0.15)] transition-all duration-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                    {/* Semantic Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Semantic search: 'water damage ceiling' or 'contractor estimates'..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'damage', 'before', 'after', 'receipts', 'correspondence', 'reports'].map((category) => (
                        <Button
                          key={category}
                          size="sm"
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          onClick={() => setSelectedCategory(category)}
                          className={selectedCategory === category 
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(20,184,166,0.3)] backdrop-blur-md border-0' 
                            : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 backdrop-blur-md'
                          }
                        >
                          {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* View Controls */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewMode('grid')}
                      className={`${viewMode === 'grid' ? 'bg-teal-600/20 text-teal-400' : 'bg-gray-700/50 text-gray-400'} border-gray-600/50 backdrop-blur-md`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewMode('list')}
                      className={`${viewMode === 'list' ? 'bg-teal-600/20 text-teal-400' : 'bg-gray-700/50 text-gray-400'} border-gray-600/50 backdrop-blur-md`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={handleFileUpload}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_40px_rgba(20,184,166,0.4)] transition-all duration-300 backdrop-blur-md border-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </Button>
              
              <Button
                onClick={runAIAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-[0_8px_32px_rgba(147,51,234,0.3)] hover:shadow-[0_12px_40px_rgba(147,51,234,0.4)] transition-all duration-300 backdrop-blur-md border-0"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Run AI Analysis
                  </>
                )}
              </Button>
            </div>

            {/* Evidence Items */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
              : 'space-y-4'
            }>
              {filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 overflow-hidden transition-all duration-500 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-gray-600/70 hover:shadow-[0_20px_60px_rgba(20,184,166,0.2)] hover:bg-gray-800/80 hover:scale-[1.02] hover:-translate-y-1"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-700/50 backdrop-blur-md rounded-lg border border-white/10">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                          <p className="text-xs text-gray-400">{item.fileSize} • {item.dateCreated}</p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-gray-700/30 text-gray-300 border-gray-600/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* AI Analysis */}
                    {item.aiAnalysis && (
                      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 backdrop-blur-md border border-blue-600/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3 w-3 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-300">AI Analysis</span>
                        </div>
                        <p className="text-xs text-gray-300">{item.aiAnalysis}</p>
                      </div>
                    )}

                    {/* Priority Badge */}
                    <div className="flex justify-between items-center">
                      <Badge className={
                        item.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                        item.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-green-600/20 text-green-400'
                      }>
                        {item.priority} priority
                      </Badge>
                      
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Premium AI Insights */}
            <Card className="bg-gradient-to-br from-teal-900/30 to-cyan-900/20 backdrop-blur-xl border-teal-600/40 shadow-[0_20px_60px_rgba(20,184,166,0.2)] hover:shadow-[0_25px_80px_rgba(20,184,166,0.3)] transition-all duration-500">
              <CardHeader>
                <CardTitle className="text-teal-300 text-lg flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-teal-600/30 to-cyan-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(20,184,166,0.3)]">
                    <Brain className="h-5 w-5 text-teal-300 drop-shadow-[0_0_12px_rgba(20,184,166,0.7)]" />
                  </div>
                  AI Organization Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Smart Categorization:</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Auto-detects damage types and severity</li>
                      <li>• Chronological timeline organization</li>
                      <li>• Semantic search across content</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Evidence Quality:</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Missing documentation suggestions</li>
                      <li>• Chain of custody tracking</li>
                      <li>• Quality scoring and optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}