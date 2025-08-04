/**
 * @fileMetadata
 * @purpose Damage Documentation Copilot Hook - State management for AI-guided documentation
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/db", "react"]
 * @exports ["useDamageCopilot"]
 * @complexity high
 * @status active
 */

import { useState, useCallback } from 'react'
import { damageCopilotService } from './damageCopilotService'

export interface CapturedImage {
  file: File
  quality: number
  timestamp: string
  guidance: string
}

export interface DocumentationProgress {
  current: number
  total: number
  requiredAngles: string[]
  completedAngles: string[]
}

const REQUIRED_DOCUMENTATION = [
  'overview',
  'close_up',
  'context',
  'surrounding_area',
  'supporting_evidence'
]

export function useDamageCopilot() {
  const [guidance, setGuidance] = useState<string>(
    'Position camera to capture overall damage area. Ensure good lighting and steady hands.'
  )
  const [complete, setComplete] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [qualityScore, setQualityScore] = useState<number>(0)
  const [progress, setProgress] = useState<DocumentationProgress>({
    current: 0,
    total: REQUIRED_DOCUMENTATION.length,
    requiredAngles: REQUIRED_DOCUMENTATION,
    completedAngles: []
  })

  const capture = useCallback(async (file: File) => {
    if (complete || loading) return

    setLoading(true)
    
    try {
      const result = await damageCopilotService.processFrame(file, {
        sessionProgress: progress,
        previousImages: capturedImages.length
      })

      // Update captured images
      const newImage: CapturedImage = {
        file,
        quality: result.quality || 75,
        timestamp: new Date().toISOString(),
        guidance: result.nextStep || 'Image processed'
      }
      
      setCapturedImages(prev => [...prev, newImage])

      // Update guidance
      setGuidance(result.nextStep || 'Continue documentation')

      // Update progress
      if (result.completedAngle) {
        setProgress(prev => {
          const newCompleted = [...prev.completedAngles, result.completedAngle]
          const newCurrent = newCompleted.length
          
          return {
            ...prev,
            current: newCurrent,
            completedAngles: newCompleted
          }
        })
      }

      // Update quality score (average of all images)
      const allQualities = [...capturedImages.map(img => img.quality), newImage.quality]
      const avgQuality = allQualities.reduce((sum, q) => sum + q, 0) / allQualities.length
      setQualityScore(Math.round(avgQuality))

      // Check if documentation is complete
      if (result.done || progress.current + 1 >= progress.total) {
        setComplete(true)
        setGuidance(
          result.completionMessage || 
          '✅ Documentation complete! All required angles captured with good quality.'
        )
      }

    } catch (error) {
      console.error('Error processing frame:', error)
      setGuidance('Error analyzing image. Please try again with better lighting or angle.')
    } finally {
      setLoading(false)
    }
  }, [complete, loading, progress, capturedImages])

  const resetSession = useCallback(() => {
    setGuidance('Position camera to capture overall damage area. Ensure good lighting and steady hands.')
    setComplete(false)
    setLoading(false)
    setCapturedImages([])
    setQualityScore(0)
    setProgress({
      current: 0,
      total: REQUIRED_DOCUMENTATION.length,
      requiredAngles: REQUIRED_DOCUMENTATION,
      completedAngles: []
    })
  }, [])

  return {
    guidance,
    complete,
    loading,
    capturedImages,
    qualityScore,
    progress,
    capture,
    resetSession,
    hasImages: capturedImages.length > 0
  }
}