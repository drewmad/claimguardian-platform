import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

import { ImageUploadAnalyzerProps } from '@/components/ai/image-upload-analyzer'

// Loading components for different types
const LoadingCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full" />
)

const LoadingChat = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full" />
)

import { AIChatInterfaceProps } from '@/components/ai/ai-chat-interface'
import { CameraCaptureProps } from '@/components/ai/camera-capture'
import { ReportGeneratorProps } from '@/components/reports/report-generator'
import { DropzoneOptions } from 'react-dropzone'
import { MapProps } from '@/components/maps/map'

// Loading components for different types
const LoadingCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full" />
)

const LoadingChat = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full" />
)

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

// Map Components
export const LazyMap = dynamic<MapProps>(
  () => import('@/components/maps/map').then(mod => ({ default: mod.Map })),
  { loading: () => <LoadingCard />, ssr: false }
)