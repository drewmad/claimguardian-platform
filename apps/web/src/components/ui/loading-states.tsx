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

import { Loader2, Camera, FileText, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

export interface LoadingStateProps {
  message?: string
  progress?: number
  showProgress?: boolean
  className?: string
}

export function AILoadingState({ 
  message = 'Processing...', 
  progress = 0, 
  showProgress = false,
  className = ''
}: LoadingStateProps) {
  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-center flex-col space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-pulse" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-white font-medium">{message}</p>
            {showProgress && (
              <div className="w-64 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-400">{progress}% complete</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ImageAnalysisLoading({ 
  currentImage = 1, 
  totalImages = 1, 
  className = '' 
}: { 
  currentImage?: number
  totalImages?: number
  className?: string 
}) {
  const progress = (currentImage / totalImages) * 100

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Camera className="h-6 w-6 text-orange-400" />
              <Loader2 className="h-4 w-4 animate-spin text-orange-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <p className="text-white font-medium">Analyzing Images</p>
              <p className="text-sm text-gray-400">
                Processing image {currentImage} of {totalImages}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Image {currentImage}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChatLoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span className="text-sm text-gray-400">AI is thinking...</span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function DocumentProcessingLoading({ 
  fileName = 'document', 
  className = '' 
}: { 
  fileName?: string
  className?: string 
}) {
  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FileText className="h-5 w-5 text-blue-400" />
            <Loader2 className="h-3 w-3 animate-spin text-blue-400 absolute -top-1 -right-1" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Processing Document</p>
            <p className="text-xs text-gray-400 truncate">{fileName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}