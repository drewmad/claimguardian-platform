'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadAnalyzerProps {
  onAnalyze: (images: File[]) => Promise<void>
  maxFiles?: number
  maxSize?: number // in MB
  acceptedFormats?: string[]
  title?: string
  description?: string
  className?: string
}

export function ImageUploadAnalyzer({
  onAnalyze,
  maxFiles = 10,
  maxSize = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  title = 'Upload Images',
  description = 'Drag and drop images here or click to browse',
  className,
}: ImageUploadAnalyzerProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    
    // Validate file count
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }

    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${maxSize}MB limit`)
      return
    }

    // Create previews
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
    
    setFiles(prev => [...prev, ...acceptedFiles])
    setPreviews(prev => [...prev, ...newPreviews])
  }, [files.length, maxFiles, maxSize])

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    if (files.length === 0) return

    setIsAnalyzing(true)
    setError(null)

    try {
      await onAnalyze(files)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({
      ...acc,
      [format]: [],
    }), {}),
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles || isAnalyzing,
  })

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {files.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400',
              isAnalyzing && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the images here...'
                : `Drag & drop up to ${maxFiles} images, or click to select`}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, WebP (max {maxSize}MB each)
            </p>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={previews[index]}
                      alt={file.name}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {files.length} image{files.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    previews.forEach(URL.revokeObjectURL)
                    setFiles([])
                    setPreviews([])
                  }}
                  disabled={isAnalyzing}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || files.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Analyze Images
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}