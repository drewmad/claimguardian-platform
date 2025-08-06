/**
 * @fileMetadata
 * @purpose "Enhanced AI results presentation with interactive visualization and export capabilities"
 * @owner ai-team
 * @dependencies ["react", "framer-motion", "@/components/ui", "@/components/charts"]
 * @exports ["ResultsPresentationEnhanced", "ResultsVisualization", "ResultsExport", "ResultsComparison"]
 * @complexity high
 * @tags ["ai", "results", "presentation", "visualization", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye,
  Brain,
  Zap,
  BarChart3,
  TrendingUp,
  Download,
  Share,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Filter,
  Grid,
  List,
  Maximize,
  RefreshCw,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Target,
  Award,
  Camera,
  FileText,
  Image,
  Scan,
  Shield,
  Home
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

export type ResultsType = 'damage-analysis' | 'document-extraction' | 'inventory-scan' | 'claim-processing' | 'policy-analysis'
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very-high'
export type ResultsViewMode = 'detailed' | 'summary' | 'comparison' | 'timeline'

export interface AIResult {
  id: string
  type: ResultsType
  title: string
  description: string
  confidence: number
  timestamp: Date
  processingTime: number
  status: 'completed' | 'partial' | 'needs-review' | 'approved'
  data: Record<string, any>
  insights: string[]
  recommendations: string[]
  metadata: {
    model: string
    version: string
    parameters?: Record<string, any>
  }
  attachments?: {
    type: 'image' | 'document' | 'chart'
    url: string
    caption: string
  }[]
}

interface ResultsPresentationEnhancedProps {
  results: AIResult[]
  viewMode?: ResultsViewMode
  onResultSelect?: (result: AIResult) => void
  onExport?: (results: AIResult[], format: 'pdf' | 'json' | 'csv') => void
  onShare?: (result: AIResult) => void
  showComparison?: boolean
  enableInteraction?: boolean
  className?: string
}

export function ResultsPresentationEnhanced({
  results,
  viewMode = 'detailed',
  onResultSelect,
  onExport,
  onShare,
  showComparison = true,
  enableInteraction = true,
  className
}: ResultsPresentationEnhancedProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<ResultsType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'type'>('timestamp')
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid')
  
  const { success, error, info } = useToast()
  const { addNotification } = useNotifications()

  // Filter and sort results
  const processedResults = useMemo(() => {
    let filtered = results
    
    if (filterType !== 'all') {
      filtered = filtered.filter(result => result.type === filterType)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return b.timestamp.getTime() - a.timestamp.getTime()
      }
    })
  }, [results, filterType, sortBy])

  // Get confidence level
  const getConfidenceLevel = useCallback((confidence: number): ConfidenceLevel => {
    if (confidence >= 95) return 'very-high'
    if (confidence >= 85) return 'high'
    if (confidence >= 70) return 'medium'
    return 'low'
  }, [])

  // Get confidence color
  const getConfidenceColor = useCallback((level: ConfidenceLevel): string => {
    switch (level) {
      case 'very-high': return 'text-emerald-600 bg-emerald-100 border-emerald-200'
      case 'high': return 'text-green-600 bg-green-100 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-red-600 bg-red-100 border-red-200'
    }
  }, [])

  // Get result type icon and color
  const getResultTypeInfo = useCallback((type: ResultsType) => {
    switch (type) {
      case 'damage-analysis':
        return { 
          icon: Scan, 
          color: 'bg-red-500', 
          name: 'Damage Analysis',
          description: 'AI-powered damage assessment and cost estimation'
        }
      case 'document-extraction':
        return { 
          icon: FileText, 
          color: 'bg-blue-500', 
          name: 'Document Extraction',
          description: 'Automated data extraction from insurance documents'
        }
      case 'inventory-scan':
        return { 
          icon: Camera, 
          color: 'bg-green-500', 
          name: 'Inventory Scan',
          description: 'Smart home inventory cataloging and valuation'
        }
      case 'claim-processing':
        return { 
          icon: BarChart3, 
          color: 'bg-purple-500', 
          name: 'Claim Processing',
          description: 'Automated claim analysis and recommendations'
        }
      case 'policy-analysis':
        return { 
          icon: Shield, 
          color: 'bg-indigo-500', 
          name: 'Policy Analysis',
          description: 'Insurance policy review and coverage assessment'
        }
    }
  }, [])

  // Toggle result selection
  const toggleResultSelection = useCallback((resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }, [])

  // Export results
  const handleExport = useCallback((format: 'pdf' | 'json' | 'csv') => {
    const resultsToExport = selectedResults.length > 0 
      ? results.filter(r => selectedResults.includes(r.id))
      : processedResults

    onExport?.(resultsToExport, format)
    
    success(`Exporting ${resultsToExport.length} results as ${format.toUpperCase()}`, {
      subtitle: 'Download will start shortly'
    })

    logger.track('results_exported', {
      format,
      count: resultsToExport.length,
      types: [...new Set(resultsToExport.map(r => r.type))]
    })
  }, [selectedResults, results, processedResults, onExport, success])

  // Copy result summary
  const copyResultSummary = useCallback((result: AIResult) => {
    const summary = `
${result.title}
Confidence: ${result.confidence}%
Processed: ${result.timestamp.toLocaleString()}
Type: ${getResultTypeInfo(result.type).name}

Key Insights:
${result.insights.map(insight => `• ${insight}`).join('\n')}

Recommendations:
${result.recommendations.map(rec => `• ${rec}`).join('\n')}
    `.trim()

    navigator.clipboard.writeText(summary)
    
    success('Result summary copied', {
      subtitle: 'Summary copied to clipboard'
    })
  }, [getResultTypeInfo, success])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Analysis Results</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {processedResults.length} result{processedResults.length !== 1 ? 's' : ''} found
            {selectedResults.length > 0 && ` • ${selectedResults.length} selected`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={displayMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('grid')}
              className="h-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={displayMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('list')}
              className="h-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Options */}
          {enableInteraction && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ResultsType | 'all')}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="damage-analysis">Damage Analysis</option>
                  <option value="document-extraction">Document Extraction</option>
                  <option value="inventory-scan">Inventory Scan</option>
                  <option value="claim-processing">Claim Processing</option>
                  <option value="policy-analysis">Policy Analysis</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="timestamp">Date</option>
                  <option value="confidence">Confidence</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>Avg Confidence: {Math.round(processedResults.reduce((acc, r) => acc + r.confidence, 0) / processedResults.length)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Avg Processing: {Math.round(processedResults.reduce((acc, r) => acc + r.processingTime, 0) / processedResults.length)}s</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid/List */}
      <div className={cn(
        displayMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
      )}>
        <AnimatePresence>
          {processedResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              isSelected={selectedResults.includes(result.id)}
              isExpanded={expandedResult === result.id}
              displayMode={displayMode}
              onToggleSelection={() => enableInteraction && toggleResultSelection(result.id)}
              onToggleExpanded={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
              onSelect={() => onResultSelect?.(result)}
              onShare={() => onShare?.(result)}
              onCopy={() => copyResultSummary(result)}
              getResultTypeInfo={getResultTypeInfo}
              getConfidenceLevel={getConfidenceLevel}
              getConfidenceColor={getConfidenceColor}
              enableInteraction={enableInteraction}
            />
          ))}
        </AnimatePresence>
      </div>

      {processedResults.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or process more files with AI analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Results Summary */}
      {selectedResults.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  {selectedResults.length} result{selectedResults.length !== 1 ? 's' : ''} selected
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Ready for export or bulk operations
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedResults([])}
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleExport('pdf')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Result Card Component
interface ResultCardProps {
  result: AIResult
  isSelected: boolean
  isExpanded: boolean
  displayMode: 'grid' | 'list'
  onToggleSelection: () => void
  onToggleExpanded: () => void
  onSelect: () => void
  onShare: () => void
  onCopy: () => void
  getResultTypeInfo: (type: ResultsType) => any
  getConfidenceLevel: (confidence: number) => ConfidenceLevel
  getConfidenceColor: (level: ConfidenceLevel) => string
  enableInteraction: boolean
}

function ResultCard({
  result,
  isSelected,
  isExpanded,
  displayMode,
  onToggleSelection,
  onToggleExpanded,
  onSelect,
  onShare,
  onCopy,
  getResultTypeInfo,
  getConfidenceLevel,
  getConfidenceColor,
  enableInteraction
}: ResultCardProps) {
  const typeInfo = getResultTypeInfo(result.type)
  const confidenceLevel = getConfidenceLevel(result.confidence)
  const Icon = typeInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className={cn(
        "transition-all cursor-pointer hover:shadow-lg",
        isSelected && "ring-2 ring-blue-500 border-blue-300",
        displayMode === 'list' && "w-full"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Selection Checkbox */}
              {enableInteraction && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelection()
                  }}
                  className={cn(
                    "w-5 h-5 border-2 rounded transition-colors cursor-pointer flex items-center justify-center",
                    isSelected 
                      ? "bg-blue-500 border-blue-500" 
                      : "border-gray-300 hover:border-blue-400"
                  )}
                >
                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              )}

              {/* Type Icon */}
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", typeInfo.color)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-1 truncate">{result.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {result.description}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("text-xs border", getConfidenceColor(confidenceLevel))}>
                    {result.confidence}% confidence
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {typeInfo.name}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {enableInteraction && (
                <>
                  <Button variant="ghost" size="sm" onClick={onShare} className="h-8 w-8 p-0">
                    <Share className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 w-8 p-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleExpanded}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Processing Time</p>
              <p className="font-medium">{result.processingTime}s</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Target className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-medium capitalize">{result.status}</p>
            </div>
          </div>

          {/* Quick Insights */}
          {result.insights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                Key Insights
              </h4>
              <div className="space-y-1">
                {result.insights.slice(0, isExpanded ? undefined : 2).map((insight, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    {insight}
                  </p>
                ))}
                {!isExpanded && result.insights.length > 2 && (
                  <p className="text-xs text-gray-500">
                    +{result.insights.length - 2} more insights
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Award className="w-4 h-4 text-blue-500" />
                      Recommendations
                    </h4>
                    <div className="space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Data */}
                {Object.keys(result.data).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      Analysis Data
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <ResultsVisualization result={result} />
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4 text-gray-500" />
                    Processing Details
                  </h4>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Model: {result.metadata.model} v{result.metadata.version}</p>
                    <p>Processed: {result.timestamp.toLocaleString()}</p>
                    <p>Duration: {result.processingTime} seconds</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={onSelect} className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={onShare}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Results Visualization Component
function ResultsVisualization({ result }: { result: AIResult }) {
  const renderVisualization = () => {
    switch (result.type) {
      case 'damage-analysis':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Damage Severity</span>
              <Badge variant="outline">{result.data.severity}</Badge>
            </div>
            <Progress value={result.data.severityScore || 75} className="h-2" />
            
            {result.data.estimatedCost && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Estimated Cost</span>
                <span className="font-medium">{result.data.estimatedCost}</span>
              </div>
            )}
          </div>
        )
      
      case 'document-extraction':
        return (
          <div className="space-y-2">
            {Object.entries(result.data.extractedFields || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )
      
      case 'inventory-scan':
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Items Detected</span>
              <span className="font-medium">{result.data.itemCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Value</span>
              <span className="font-medium">{result.data.totalValue || '$0'}</span>
            </div>
            {result.data.categories && (
              <div>
                <p className="text-sm mb-1">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {result.data.categories.map((cat: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="text-sm text-gray-600">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )
    }
  }

  return (
    <div>
      {renderVisualization()}
    </div>
  )
}

export { ResultsVisualization }