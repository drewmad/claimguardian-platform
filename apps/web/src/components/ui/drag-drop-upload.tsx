/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Drag-and-drop file upload component with progress and preview"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './card-variants'
import { Button } from './button'
import { Progress } from './progress'

export interface UploadedFile {
  id: string
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>
  onRemove?: (fileId: string) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  className?: string
  disabled?: boolean
}

export function DragDropUpload({
  onUpload,
  onRemove,
  accept = 'image/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
  className,
  disabled = false
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFiles = (fileList: FileList | File[]): File[] => {
    const validFiles: File[] = []
    const filesArray = Array.from(fileList)

    for (const file of filesArray) {
      // Check file count
      if (files.length + validFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        break
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is ${maxSize}MB`)
        continue
      }

      // Check file type if accept is specified
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        alert(`${file.name} is not an accepted file type`)
        continue
      }

      validFiles.push(file)
    }

    return validFiles
  }

  const processFiles = async (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending' as const
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload with progress
    for (const uploadFile of newFiles) {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ))

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, progress } : f
        ))
      }

      try {
        await onUpload([uploadFile.file])
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
        ))
      } catch (error) {
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ))
      }
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (disabled) return

    const validFiles = validateFiles(e.dataTransfer.files)
    if (validFiles.length > 0) {
      await processFiles(validFiles)
    }
  }, [disabled, files.length, maxFiles, maxSize, accept])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return

    const validFiles = validateFiles(e.target.files)
    if (validFiles.length > 0) {
      await processFiles(validFiles)
    }

    // Reset input
    e.target.value = ''
  }

  const removeFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }
    setFiles(prev => prev.filter(f => f.id !== fileId))
    onRemove?.(fileId)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    return FileText
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      case 'uploading': return Loader2
      default: return Upload
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'uploading': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
          isDragging ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={cn(
            'w-12 h-12 mb-4 transition-colors',
            isDragging ? 'text-blue-400' : 'text-gray-500'
          )} />

          <p className="text-white font-medium mb-2">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>

          <p className="text-sm text-gray-400 mb-4">
            or <span className="text-blue-400">browse</span> to choose files
          </p>

          <p className="text-xs text-gray-500">
            Max {maxSize}MB per file • {multiple ? `Up to ${maxFiles} files` : 'Single file only'}
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => {
            const Icon = getFileIcon(uploadFile.file)
            const StatusIcon = getStatusIcon(uploadFile.status)
            const statusColor = getStatusColor(uploadFile.status)

            return (
              <Card key={uploadFile.id} variant="elevated" className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview or Icon */}
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                      <Icon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(uploadFile.file.size / 1024).toFixed(1)} KB
                    </p>

                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}

                    {/* Error Message */}
                    {uploadFile.error && (
                      <p className="text-xs text-red-400 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <StatusIcon className={cn(
                    'w-5 h-5',
                    statusColor,
                    uploadFile.status === 'uploading' && 'animate-spin'
                  )} />

                  {/* Remove Button */}
                  {uploadFile.status !== 'uploading' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(uploadFile.id)
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Simplified version for single image upload
export function ImageDropUpload({
  onUpload,
  currentImage,
  className
}: {
  onUpload: (file: File) => Promise<void>
  currentImage?: string
  className?: string
}) {
  const [preview, setPreview] = useState<string | undefined>(currentImage)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    const file = files[0]

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className}>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <button
            onClick={() => setPreview(undefined)}
            className="absolute top-2 right-2 p-1 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isUploading}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <DragDropUpload
          onUpload={handleUpload}
          accept="image/*"
          multiple={false}
          maxSize={5}
          disabled={isUploading}
        />
      )}
    </div>
  )
}
