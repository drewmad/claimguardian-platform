'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileImageUploadProps {
  onImageSelect: (file: File) => void
  onImageRemove?: () => void
  currentImage?: string | null
  accept?: string
  maxSize?: number // in MB
  className?: string
  loading?: boolean
}

export function MobileImageUpload({
  onImageSelect,
  onImageRemove,
  currentImage,
  accept = 'image/*',
  maxSize = 10,
  className,
  loading = false
}: MobileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }, [maxSize, onImageSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    onImageRemove?.()
  }

  if (preview && !loading) {
    return (
      <div className={cn("relative", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden bg-gray-800"
        >
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-colors",
        isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-600 bg-gray-800",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="p-8 text-center">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">Processing image...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className="p-4 bg-gray-700 rounded-full">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              <div>
                <p className="text-white font-medium mb-1">Upload an image</p>
                <p className="text-sm text-gray-400">or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Max size: {maxSize}MB</p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-700 border-gray-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-gray-700 border-gray-600"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}