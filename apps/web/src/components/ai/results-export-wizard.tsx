/**
 * @fileMetadata
 * @purpose "Advanced export wizard for AI analysis results with multiple formats and customization options"
 * @owner ai-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["ResultsExportWizard", "ExportPreview", "ExportSettings"]
 * @complexity high
 * @tags ["ai", "results", "export", "wizard", "pdf", "reports"]
 * @status stable
 */
'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download,
  FileText,
  Image,
  Table,
  Mail,
  Share,
  Settings,
  Eye,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Building,
  Filter,
  Palette,
  Layout,
  FileSpreadsheet,
  FileJson,
  Printer,
  Globe,
  Shield,
  Clock,
  Target,
  Award
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AIResult } from './results-presentation-enhanced'
import { useToast } from '@/components/notifications/toast-system'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

export type ExportFormat = 'pdf-report' | 'pdf-summary' | 'csv' | 'json' | 'excel' | 'html'
export type ExportTemplate = 'professional' | 'detailed' | 'executive' | 'technical' | 'custom'

interface ExportSettings {
  format: ExportFormat
  template: ExportTemplate
  includeImages: boolean
  includeMetadata: boolean
  includeRecommendations: boolean
  includeComparisons: boolean
  customBranding: boolean
  watermark: boolean
  confidential: boolean
}

interface ExportMetadata {
  title: string
  author: string
  company: string
  description: string
  tags: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

interface ResultsExportWizardProps {
  results: AIResult[]
  onExport?: (settings: ExportSettings, metadata: ExportMetadata, results: AIResult[]) => void
  onCancel?: () => void
  className?: string
}

const EXPORT_FORMATS = [
  {
    id: 'pdf-report' as ExportFormat,
    name: 'PDF Report',
    description: 'Comprehensive PDF report with charts and analysis',
    icon: FileText,
    features: ['Professional layout', 'Charts & graphs', 'Executive summary']
  },
  {
    id: 'pdf-summary' as ExportFormat,
    name: 'PDF Summary',
    description: 'Condensed PDF with key insights only',
    icon: FileText,
    features: ['Key findings', 'Quick overview', 'Compact format']
  },
  {
    id: 'csv' as ExportFormat,
    name: 'CSV Data',
    description: 'Raw data in CSV format for analysis',
    icon: FileSpreadsheet,
    features: ['Raw data', 'Import to Excel', 'Data analysis']
  },
  {
    id: 'json' as ExportFormat,
    name: 'JSON Export',
    description: 'Structured data in JSON format',
    icon: FileJson,
    features: ['Full data structure', 'API compatible', 'Developer friendly']
  },
  {
    id: 'excel' as ExportFormat,
    name: 'Excel Workbook',
    description: 'Excel file with multiple worksheets',
    icon: Table,
    features: ['Multiple sheets', 'Charts included', 'Formulas & analysis']
  },
  {
    id: 'html' as ExportFormat,
    name: 'Web Report',
    description: 'Interactive HTML report for web viewing',
    icon: Globe,
    features: ['Interactive charts', 'Web sharing', 'Mobile friendly']
  }
]

const TEMPLATES = [
  {
    id: 'professional' as ExportTemplate,
    name: 'Professional',
    description: 'Clean, business-focused layout with emphasis on key insights',
    preview: '/templates/professional.jpg'
  },
  {
    id: 'detailed' as ExportTemplate,
    name: 'Detailed Analysis',
    description: 'Comprehensive report with full technical details and metadata',
    preview: '/templates/detailed.jpg'
  },
  {
    id: 'executive' as ExportTemplate,
    name: 'Executive Summary',
    description: 'High-level overview optimized for leadership review',
    preview: '/templates/executive.jpg'
  },
  {
    id: 'technical' as ExportTemplate,
    name: 'Technical Report',
    description: 'In-depth technical analysis with processing details',
    preview: '/templates/technical.jpg'
  }
]

export function ResultsExportWizard({
  results,
  onExport,
  onCancel,
  className
}: ResultsExportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedResults, setSelectedResults] = useState<string[]>(results.map(r => r.id))
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'pdf-report',
    template: 'professional',
    includeImages: true,
    includeMetadata: true,
    includeRecommendations: true,
    includeComparisons: false,
    customBranding: false,
    watermark: false,
    confidential: false
  })
  const [metadata, setMetadata] = useState<ExportMetadata>({
    title: 'AI Analysis Results Report',
    author: '',
    company: '',
    description: '',
    tags: [],
    dateRange: { start: null, end: null }
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const { success, error, info } = useToast()

  const steps = [
    'Select Results',
    'Choose Format',
    'Configure Settings',
    'Add Metadata',
    'Preview & Export'
  ]

  // Filtered results based on selection
  const finalResults = useMemo(() => {
    return results.filter(result => selectedResults.includes(result.id))
  }, [results, selectedResults])

  // Update export settings
  const updateSettings = useCallback((updates: Partial<ExportSettings>) => {
    setExportSettings(prev => ({ ...prev, ...updates }))
  }, [])

  // Update metadata
  const updateMetadata = useCallback((updates: Partial<ExportMetadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }))
  }, [])

  // Toggle result selection
  const toggleResultSelection = useCallback((resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }, [])

  // Handle export
  const handleExport = useCallback(async () => {
    if (finalResults.length === 0) {
      error('No results selected', {
        subtitle: 'Please select at least one result to export'
      })
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate export progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setExportProgress(progress)
      }

      onExport?.(exportSettings, metadata, finalResults)

      success('Export completed successfully!', {
        subtitle: `${finalResults.length} results exported as ${exportSettings.format.toUpperCase()}`
      })

      logger.track('results_exported', {
        format: exportSettings.format,
        template: exportSettings.template,
        resultCount: finalResults.length,
        includeImages: exportSettings.includeImages,
        includeMetadata: exportSettings.includeMetadata
      })

    } catch (err) {
      error('Export failed', {
        subtitle: 'Please try again or contact support'
      })
      logger.error('Export failed', { settings: exportSettings }, err as Error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [finalResults, exportSettings, metadata, onExport, success, error])

  // Navigation
  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(steps.length - 1, step)))
  }, [steps.length])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return selectedResults.length > 0
      case 1: return true
      case 2: return true
      case 3: return metadata.title.trim().length > 0
      case 4: return true
      default: return false
    }
  }, [currentStep, selectedResults.length, metadata.title])

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      <Card className="shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Download className="w-6 h-6" />
                Export Results
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Export your AI analysis results in multiple formats with customization options
              </p>
            </div>
            
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => {
              const isActive = currentStep === index
              const isCompleted = currentStep > index
              
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer",
                      isActive 
                        ? "bg-blue-500 text-white" 
                        : isCompleted 
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    )}
                    onClick={() => goToStep(index)}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={cn(
                    "ml-2 text-sm hidden sm:inline",
                    isActive ? "font-medium text-blue-600" : "text-gray-500"
                  )}>
                    {step}
                  </span>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 sm:w-16 h-px mx-2",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {/* Step 0: Select Results */}
            {currentStep === 0 && (
              <ResultSelectionStep
                results={results}
                selectedResults={selectedResults}
                onToggleSelection={toggleResultSelection}
                onSelectAll={() => setSelectedResults(results.map(r => r.id))}
                onClearAll={() => setSelectedResults([])}
              />
            )}

            {/* Step 1: Choose Format */}
            {currentStep === 1 && (
              <FormatSelectionStep
                selectedFormat={exportSettings.format}
                onFormatChange={(format) => updateSettings({ format })}
              />
            )}

            {/* Step 2: Configure Settings */}
            {currentStep === 2 && (
              <SettingsConfigurationStep
                settings={exportSettings}
                onSettingsChange={updateSettings}
              />
            )}

            {/* Step 3: Add Metadata */}
            {currentStep === 3 && (
              <MetadataStep
                metadata={metadata}
                onMetadataChange={updateMetadata}
              />
            )}

            {/* Step 4: Preview & Export */}
            {currentStep === 4 && (
              <PreviewExportStep
                results={finalResults}
                settings={exportSettings}
                metadata={metadata}
                isExporting={isExporting}
                exportProgress={exportProgress}
                onExport={handleExport}
              />
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-2">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleExport}
                  disabled={!canProceed || isExporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Results
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Step Components
function ResultSelectionStep({
  results,
  selectedResults,
  onToggleSelection,
  onSelectAll,
  onClearAll
}: {
  results: AIResult[]
  selectedResults: string[]
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}) {
  return (
    <motion.div
      key="select-results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Results to Export</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose which analysis results to include in your export
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All ({results.length})
          </Button>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.id}
            className={cn(
              "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              selectedResults.includes(result.id)
                ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-200"
            )}
            onClick={() => onToggleSelection(result.id)}
          >
            <div
              className={cn(
                "w-5 h-5 border-2 rounded transition-colors flex items-center justify-center",
                selectedResults.includes(result.id)
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-300"
              )}
            >
              {selectedResults.includes(result.id) && (
                <CheckCircle className="w-3 h-3 text-white" />
              )}
            </div>

            <div className="flex-1">
              <h4 className="font-medium">{result.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {result.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {result.confidence}% confidence
                </Badge>
                <Badge variant="outline">
                  {result.type.replace('-', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {result.timestamp.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Alert>
        <CheckCircle className="w-4 h-4" />
        <AlertDescription>
          {selectedResults.length} result{selectedResults.length !== 1 ? 's' : ''} selected for export
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

function FormatSelectionStep({
  selectedFormat,
  onFormatChange
}: {
  selectedFormat: ExportFormat
  onFormatChange: (format: ExportFormat) => void
}) {
  return (
    <motion.div
      key="format-selection"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Choose Export Format</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select the format that best suits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_FORMATS.map((format) => {
          const Icon = format.icon
          const isSelected = selectedFormat === format.id
          
          return (
            <Card
              key={format.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-2",
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
              )}
              onClick={() => onFormatChange(format.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {format.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {format.description}
                    </p>
                    
                    <div className="space-y-1">
                      {format.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}

function SettingsConfigurationStep({
  settings,
  onSettingsChange
}: {
  settings: ExportSettings
  onSettingsChange: (updates: Partial<ExportSettings>) => void
}) {
  return (
    <motion.div
      key="settings-config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Configure Export Settings</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customize what to include in your export
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'includeImages', label: 'Include Images & Charts', description: 'Add visual elements to the export' },
              { key: 'includeMetadata', label: 'Include Metadata', description: 'Processing details and timestamps' },
              { key: 'includeRecommendations', label: 'Include Recommendations', description: 'AI-generated recommendations' },
              { key: 'includeComparisons', label: 'Include Comparisons', description: 'Side-by-side result comparisons' }
            ].map((option) => (
              <div key={option.key} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded transition-colors cursor-pointer flex items-center justify-center mt-0.5",
                    settings[option.key as keyof ExportSettings]
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 hover:border-blue-400"
                  )}
                  onClick={() => onSettingsChange({ [option.key]: !settings[option.key as keyof ExportSettings] })}
                >
                  {settings[option.key as keyof ExportSettings] && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'customBranding', label: 'Custom Branding', description: 'Add your company logo and colors' },
              { key: 'watermark', label: 'Add Watermark', description: 'ClaimGuardian watermark on pages' },
              { key: 'confidential', label: 'Mark as Confidential', description: 'Add confidentiality notices' }
            ].map((option) => (
              <div key={option.key} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-5 h-5 border-2 rounded transition-colors cursor-pointer flex items-center justify-center mt-0.5",
                    settings[option.key as keyof ExportSettings]
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 hover:border-blue-400"
                  )}
                  onClick={() => onSettingsChange({ [option.key]: !settings[option.key as keyof ExportSettings] })}
                >
                  {settings[option.key as keyof ExportSettings] && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "p-4 border-2 rounded-lg cursor-pointer transition-all",
                  settings.template === template.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                )}
                onClick={() => onSettingsChange({ template: template.id })}
              >
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MetadataStep({
  metadata,
  onMetadataChange
}: {
  metadata: ExportMetadata
  onMetadataChange: (updates: Partial<ExportMetadata>) => void
}) {
  return (
    <motion.div
      key="metadata"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Add Report Metadata</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Provide additional information for your export
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              value={metadata.title}
              onChange={(e) => onMetadataChange({ title: e.target.value })}
              placeholder="Enter report title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={metadata.author}
              onChange={(e) => onMetadataChange({ author: e.target.value })}
              placeholder="Report author"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={metadata.company}
              onChange={(e) => onMetadataChange({ company: e.target.value })}
              placeholder="Company name"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={metadata.description}
              onChange={(e) => onMetadataChange({ description: e.target.value })}
              placeholder="Brief description of the report contents"
              className="mt-1"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={metadata.tags.join(', ')}
              onChange={(e) => onMetadataChange({ tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
              placeholder="damage analysis, insurance, AI"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PreviewExportStep({
  results,
  settings,
  metadata,
  isExporting,
  exportProgress,
  onExport
}: {
  results: AIResult[]
  settings: ExportSettings
  metadata: ExportMetadata
  isExporting: boolean
  exportProgress: number
  onExport: () => void
}) {
  return (
    <motion.div
      key="preview-export"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Preview & Export</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Review your export settings and generate the report
        </p>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  Generating Export...
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Processing {results.length} results
                </p>
              </div>

              <div className="w-full max-w-md mx-auto">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {exportProgress}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Summary */}
      {!isExporting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Format:</span>
                <Badge variant="outline">{settings.format.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Template:</span>
                <span className="text-sm font-medium capitalize">{settings.template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Results:</span>
                <span className="text-sm font-medium">{results.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Images:</span>
                <span className="text-sm">{settings.includeImages ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Metadata:</span>
                <span className="text-sm">{settings.includeMetadata ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Title:</span>
                <p className="font-medium">{metadata.title}</p>
              </div>
              {metadata.author && (
                <div>
                  <span className="text-sm text-gray-600">Author:</span>
                  <p className="font-medium">{metadata.author}</p>
                </div>
              )}
              {metadata.company && (
                <div>
                  <span className="text-sm text-gray-600">Company:</span>
                  <p className="font-medium">{metadata.company}</p>
                </div>
              )}
              {metadata.tags.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Preview */}
      {!isExporting && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results to Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {results.map((result) => (
                <div key={result.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{result.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {result.type.replace('-', ' ')} • {result.confidence}% confidence
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

export type { ExportSettings, ExportMetadata }