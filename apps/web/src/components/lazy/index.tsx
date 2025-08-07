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
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import React from 'react'

// Define props interfaces locally since they're not exported from components
interface ImageUploadAnalyzerProps {
  onAnalyze: (images: File[]) => Promise<void>
  maxFiles?: number
  maxSize?: number
  acceptedFormats?: string[]
  title?: string
  description?: string
  className?: string
}

interface AIChatInterfaceProps {
  systemPrompt: string
  placeholder?: string
  welcomeMessage?: string
  onSendMessage: (message: string, history: Array<{ role: string; content: string }>) => Promise<string>
  className?: string
}

interface CameraCaptureProps {
  onClose: () => void
  onCapture: (file: File) => void
}

interface ReportSection {
  title: string
  content: string | React.ReactNode
  type?: 'text' | 'table' | 'list' | 'custom'
}

interface ReportGeneratorProps {
  title: string
  subtitle?: string
  sections: ReportSection[]
  metadata?: {
    generatedBy?: string
    date?: Date
    referenceNumber?: string
    status?: string
  }
  className?: string
}

// Loading components for different types
const LoadingCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full" />
)

const LoadingChat = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full" />
)

import { DropzoneOptions } from 'react-dropzone'

// AI Components
export const LazyImageUploadAnalyzer = dynamic<ImageUploadAnalyzerProps>(
  () => import('@/components/ai/image-upload-analyzer').then(mod => ({ default: mod.ImageUploadAnalyzer })),
  { loading: () => <LoadingCard />, ssr: false }
)

export const LazyAIChatInterface = dynamic<AIChatInterfaceProps>(
  () => import('@/components/ai/ai-chat-interface').then(mod => ({ default: mod.AIChatInterface })),
  { loading: () => <LoadingChat />, ssr: false }
)

export const LazyCameraCapture = dynamic<CameraCaptureProps>(
  () => import('@/components/ai/camera-capture').then(mod => ({ default: mod.CameraCapture })),
  { loading: () => <LoadingCard />, ssr: false }
)

// Report Components
export const LazyReportGenerator = dynamic<ReportGeneratorProps>(
  () => import('@/components/reports/report-generator').then(mod => ({ default: mod.ReportGenerator })),
  { loading: () => <LoadingCard />, ssr: false }
)

// Note: PDF and 3D viewer components will be added when implemented

// Dropzone for Evidence Organizer
export const LazyDropzone = dynamic<DropzoneOptions>(
  () => import('react-dropzone').then(mod => ({ default: mod.useDropzone as unknown as ComponentType<DropzoneOptions> })),
  { loading: () => <LoadingCard />, ssr: false }
)

// Map Components - Disabled until map component is implemented
// export const LazyMap = dynamic<MapProps>(
//   () => import('@/components/maps/map').then(mod => ({ default: mod.Map })),
//   { loading: () => <LoadingCard />, ssr: false }
// )
