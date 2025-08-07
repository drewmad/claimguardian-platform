/**
 * @fileMetadata
 * @purpose "Enhanced file upload component with drag-and-drop, progress tracking, and AI processing"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/notifications"]
 * @exports ["FileUploadEnhanced", "FileUploadZone", "FilePreview", "UploadProgress"]
 * @complexity high
 * @tags ["ui", "file-upload", "drag-drop", "ai", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  Image,
  FileText,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Camera,
  Scan,
  Zap,
  Brain,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Play,
  Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

export type FileType = 'image' | 'document' | 'pdf' | 'unknown'
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
export type ProcessingType = 'damage-analysis' | 'document-extraction' | 'inventory-scan' | 'general'

export interface EnhancedFile {
  id: string
  file: File
  type: FileType
  size: string
  uploadProgress: number
  processingProgress: number
  status: UploadStatus
  preview?: string
  thumbnail?: string
  aiResults?: any
  error?: string
  uploadedUrl?: string
  processingType?: ProcessingType
}

interface FileUploadEnhancedProps {
  onFilesChange: (files: EnhancedFile[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  processingType?: ProcessingType
  enableAI?: boolean
  autoProcess?: boolean
  className?: string
  children?: React.ReactNode
}

export function FileUploadEnhanced({
  onFilesChange,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  processingType = 'general',
  enableAI = true,
  autoProcess = false,
  className,
  children
}: FileUploadEnhancedProps) {
  const [files, setFiles] = useState<EnhancedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error, info } = useToast()
  const { addNotification } = useNotifications()

  // File type detection
  const getFileType = useCallback((file: File): FileType => {
    const type = file.type.toLowerCase()
    if (type.startsWith('image/')) return 'image'
    if (type === 'application/pdf') return 'pdf'
    if (type.includes('document') || type.includes('word') || type.includes('text')) return 'document'
    return 'unknown'
  }, [])

  // File size formatting
  const formatFileSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }, [])

  // Create file preview
  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }, [])

  // Process uploaded files
  const processFile = useCallback(async (enhancedFile: EnhancedFile): Promise<void> => {
    if (!enableAI) return

    try {
      setFiles(prev => prev.map(f =>
        f.id === enhancedFile.id
          ? { ...f, status: 'processing', processingProgress: 0 }
          : f
      ))

      // Simulate AI processing with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setFiles(prev => prev.map(f =>
          f.id === enhancedFile.id
            ? { ...f, processingProgress: progress }
            : f
        ))
      }

      // Mock AI results based on processing type
      const mockResults = generateMockAIResults(enhancedFile.file, processingType)

      setFiles(prev => prev.map(f =>
        f.id === enhancedFile.id
          ? {
              ...f,
              status: 'completed',
              processingProgress: 100,
              aiResults: mockResults
            }
          : f
      ))

      success(`AI processing completed for ${enhancedFile.file.name}`, {
        subtitle: 'Results are ready for review',
        actions: [{
          label: 'View Results',
          onClick: () => logger.info('View AI results', { fileId: enhancedFile.id })
        }]
      })

      logger.track('file_processing_completed', {
        fileName: enhancedFile.file.name,
        fileType: enhancedFile.type,
        processingType,
        fileSize: enhancedFile.file.size
      })

    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.id === enhancedFile.id
          ? {
              ...f,
              status: 'error',
              error: 'AI processing failed. Please try again.'
            }
          : f
      ))

      error('Processing failed', {
        subtitle: `Failed to process ${enhancedFile.file.name}`,
        actions: [{
          label: 'Retry',
          onClick: () => processFile(enhancedFile)
        }]
      })

      logger.error('File processing failed', {
        fileName: enhancedFile.file.name,
        processingType
      }, err as Error)
    }
  }, [enableAI, processingType, success, error])

  // Handle file uploads
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList)

    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      error('Too many files', {
        subtitle: `Maximum ${maxFiles} files allowed`,
      })
      return
    }

    // Validate and process files
    const validFiles: EnhancedFile[] = []

    for (const file of newFiles) {
      // Size validation
      if (file.size > maxSize) {
        error('File too large', {
          subtitle: `${file.name} exceeds ${formatFileSize(maxSize)} limit`
        })
        continue
      }

      // Type validation
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.includes(type.split('*')[0])
        }
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type === type
      })

      if (!isValidType) {
        error('Invalid file type', {
          subtitle: `${file.name} is not supported`
        })
        continue
      }

      // Create enhanced file object
      const enhancedFile: EnhancedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: getFileType(file),
        size: formatFileSize(file.size),
        uploadProgress: 0,
        processingProgress: 0,
        status: 'pending',
        preview: await createPreview(file),
        processingType
      }

      validFiles.push(enhancedFile)
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)

      // Start upload simulation
      validFiles.forEach(file => {
        simulateUpload(file)
      })

      success(`Added ${validFiles.length} file(s)`, {
        subtitle: enableAI ? 'AI processing will begin automatically' : 'Files ready for upload'
      })

      logger.track('files_added', {
        count: validFiles.length,
        types: validFiles.map(f => f.type),
        processingType
      })
    }
  }, [files, maxFiles, maxSize, acceptedTypes, getFileType, formatFileSize, createPreview, processingType, onFilesChange, enableAI, success, error])

  // Simulate file upload
  const simulateUpload = useCallback(async (enhancedFile: EnhancedFile) => {
    setFiles(prev => prev.map(f =>
      f.id === enhancedFile.id ? { ...f, status: 'uploading' } : f
    ))

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += Math.random() * 15) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setFiles(prev => prev.map(f =>
        f.id === enhancedFile.id
          ? { ...f, uploadProgress: Math.min(100, Math.round(progress)) }
          : f
      ))
    }

    // Mark upload complete
    setFiles(prev => prev.map(f =>
      f.id === enhancedFile.id
        ? {
            ...f,
            status: autoProcess && enableAI ? 'processing' : 'completed',
            uploadProgress: 100,
            uploadedUrl: `https://example.com/uploads/${enhancedFile.file.name}`
          }
        : f
    ))

    // Auto-process if enabled
    if (autoProcess && enableAI) {
      setTimeout(() => processFile(enhancedFile), 500)
    }
  }, [autoProcess, enableAI, processFile])

  // Drag and drop handlers
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [handleFiles])

  // File input change handler
  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // Reset input value to allow same file selection
    e.target.value = ''
  }, [handleFiles])

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)

    info('File removed')
  }, [files, onFilesChange, info])

  // Retry processing
  const retryProcessing = useCallback((file: EnhancedFile) => {
    processFile(file)
  }, [processFile])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <FileUploadZone
        isDragActive={isDragActive}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        maxFiles={maxFiles}
        currentFileCount={files.length}
        acceptedTypes={acceptedTypes}
        processingType={processingType}
        enableAI={enableAI}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>

          <AnimatePresence>
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                onRetry={() => retryProcessing(file)}
                enableAI={enableAI}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {children}
    </div>
  )
}

// Mock AI results generator
function generateMockAIResults(file: File, processingType: ProcessingType) {
  switch (processingType) {
    case 'damage-analysis':
      return {
        damageType: 'Water Damage',
        severity: 'Moderate',
        confidence: 85,
        affectedAreas: ['Living Room', 'Kitchen'],
        estimatedCost: '$3,500 - $5,000',
        recommendations: [
          'Contact water damage restoration specialist',
          'Document all affected areas',
          'Check for mold growth'
        ]
      }

    case 'document-extraction':
      return {
        documentType: 'Insurance Policy',
        extractedData: {
          policyNumber: 'INS-123456789',
          coverageAmount: '$250,000',
          deductible: '$1,000',
          expirationDate: '2024-12-31'
        },
        confidence: 92,
        keyFields: 4
      }

    case 'inventory-scan':
      return {
        itemsDetected: 12,
        categories: ['Electronics', 'Furniture', 'Appliances'],
        estimatedValue: '$15,750',
        confidence: 88,
        items: [
          { name: 'Smart TV', value: '$800' },
          { name: 'Laptop', value: '$1,200' },
          { name: 'Sofa', value: '$1,500' }
        ]
      }

    default:
      return {
        processed: true,
        confidence: 90,
        summary: 'File successfully processed with AI analysis'
      }
  }
}

// Upload Zone Component
interface FileUploadZoneProps {
  isDragActive: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  maxFiles: number
  currentFileCount: number
  acceptedTypes: string[]
  processingType: ProcessingType
  enableAI: boolean
}

function FileUploadZone({
  isDragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  maxFiles,
  currentFileCount,
  acceptedTypes,
  processingType,
  enableAI
}: FileUploadZoneProps) {
  const getProcessingIcon = () => {
    switch (processingType) {
      case 'damage-analysis': return Scan
      case 'document-extraction': return FileText
      case 'inventory-scan': return Camera
      default: return Brain
    }
  }

  const ProcessingIcon = getProcessingIcon()

  return (
    <Card
      className={cn(
        "border-2 border-dashed cursor-pointer transition-all duration-200",
        isDragActive
          ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
          : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      <CardContent className="p-8 text-center">
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          className="space-y-4"
        >
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            {enableAI ? (
              <ProcessingIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Files'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {maxFiles - currentFileCount} of {maxFiles} slots available
            </p>
          </div>

          {enableAI && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI-Powered {processingType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Files will be automatically analyzed for insights
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Supported: {acceptedTypes.join(', ')}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// File Preview Component
interface FilePreviewProps {
  file: EnhancedFile
  onRemove: () => void
  onRetry: () => void
  enableAI: boolean
}

function FilePreview({ file, onRemove, onRetry, enableAI }: FilePreviewProps) {
  const getFileIcon = () => {
    switch (file.type) {
      case 'image': return Image
      case 'pdf': return FileText
      case 'document': return File
      default: return File
    }
  }

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed': return Check
      case 'error': return AlertTriangle
      case 'uploading':
      case 'processing': return Loader2
      default: return null
    }
  }

  const FileIcon = getFileIcon()
  const StatusIcon = getStatusIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start gap-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {file.preview ? (
            <img
              src={file.preview}
              alt={file.file.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {file.file.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file.size} • {file.type}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {file.status === 'completed' && (
                <Badge variant="default" className="bg-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}

              {file.status === 'error' && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}

              {(file.status === 'uploading' || file.status === 'processing') && (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {file.status === 'uploading' ? 'Uploading' : 'Processing'}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bars */}
          {(file.status === 'uploading' || file.uploadProgress < 100) && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Upload Progress</span>
                <span>{file.uploadProgress}%</span>
              </div>
              <Progress value={file.uploadProgress} className="h-2" />
            </div>
          )}

          {enableAI && file.status === 'processing' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>AI Processing</span>
                <span>{file.processingProgress}%</span>
              </div>
              <Progress value={file.processingProgress} className="h-2 bg-purple-200">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                  style={{ width: `${file.processingProgress}%` }}
                />
              </Progress>
            </div>
          )}

          {/* AI Results */}
          {enableAI && file.status === 'completed' && file.aiResults && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  AI Analysis Complete
                </span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                {file.processingType === 'damage-analysis' && (
                  <>
                    <p>Damage: {file.aiResults.damageType}</p>
                    <p>Severity: {file.aiResults.severity}</p>
                    <p>Estimated Cost: {file.aiResults.estimatedCost}</p>
                  </>
                )}
                {file.processingType === 'document-extraction' && (
                  <>
                    <p>Document: {file.aiResults.documentType}</p>
                    <p>Fields Extracted: {file.aiResults.keyFields}</p>
                    <p>Confidence: {file.aiResults.confidence}%</p>
                  </>
                )}
                {file.processingType === 'inventory-scan' && (
                  <>
                    <p>Items Detected: {file.aiResults.itemsDetected}</p>
                    <p>Estimated Value: {file.aiResults.estimatedValue}</p>
                    <p>Categories: {file.aiResults.categories?.join(', ')}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {file.status === 'error' && file.error && (
            <div className="mt-3">
              <Alert variant="destructive" className="p-3">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  {file.error}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={onRetry}
                    className="h-auto p-0 ml-2 text-xs"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export { FileUploadZone, FilePreview }
