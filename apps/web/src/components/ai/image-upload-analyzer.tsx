'use client'

import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, Camera } from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { CameraCapture } from './camera-capture'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  const [showCamera, setShowCamera] = useState(false)

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

  const handleCameraCapture = (imageData: string, file: File) => {
    setShowCamera(false)
    setError(null)
    
    if (files.length >= maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }
    
    setFiles(prev => [...prev, file])
    setPreviews(prev => [...prev, imageData])
  }

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
    <Card className={cn('p-6 bg-gray-800 border-gray-700', className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-600/30 text-red-300 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {files.length < maxFiles && (
          <>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-blue-500 bg-blue-600/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700/50',
                isAnalyzing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-300">
                {isDragActive
                  ? 'Drop the images here...'
                  : `Drag & drop up to ${maxFiles} images, or click to select`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: JPG, PNG, WebP (max {maxSize}MB each)
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowCamera(true)
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Use Camera
              </Button>
            </div>
          </>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
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
                    className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
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
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || files.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
      
      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(file: File) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              handleCameraCapture(reader.result as string, file)
            }
            reader.readAsDataURL(file)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </Card>
  )
}