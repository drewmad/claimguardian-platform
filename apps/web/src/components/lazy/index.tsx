import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading components for different types
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
)

const LoadingCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full" />
)

const LoadingChat = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full" />
)

// AI Components
export const LazyImageUploadAnalyzer = dynamic(
  () => import('@/components/ai/image-upload-analyzer').then(mod => ({ default: mod.ImageUploadAnalyzer })),
  { loading: () => <LoadingCard />, ssr: false }
)

export const LazyAIChatInterface = dynamic(
  () => import('@/components/ai/ai-chat-interface').then(mod => ({ default: mod.AIChatInterface })),
  { loading: () => <LoadingChat />, ssr: false }
)

export const LazyCameraCapture = dynamic(
  () => import('@/components/ai/camera-capture').then(mod => ({ default: mod.CameraCapture })),
  { loading: () => <LoadingCard />, ssr: false }
)

// Report Components
export const LazyReportGenerator = dynamic(
  () => import('@/components/reports/report-generator').then(mod => ({ default: mod.ReportGenerator })),
  { loading: () => <LoadingCard />, ssr: false }
)

// Note: PDF and 3D viewer components will be added when implemented

// Dropzone for Evidence Organizer
export const LazyDropzone = dynamic(
  () => import('react-dropzone').then(mod => ({ default: mod.useDropzone as unknown as ComponentType<any> })),
  { loading: () => <LoadingCard />, ssr: false }
)