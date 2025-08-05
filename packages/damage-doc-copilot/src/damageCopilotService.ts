/**
 * @fileMetadata
 * @purpose "Damage Documentation Copilot Service - AI-powered guidance for evidence capture"
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/ai-services", "@claimguardian/db"]
 * @exports ["damageCopilotService"]
 * @complexity high
 * @status stable
 */

// Client-side service - simplified for build compatibility
// TODO: Move to server actions for full functionality

export interface ProcessFrameOptions {
  sessionProgress: {
    current: number
    total: number
    completedAngles: string[]
  }
  previousImages: number
}

export interface ProcessFrameResult {
  nextStep: string
  done: boolean
  quality?: number
  completedAngle?: string
  completionMessage?: string
  suggestions?: string[]
}

export const damageCopilotService = {
  async processFrame(file: File, options: ProcessFrameOptions): Promise<ProcessFrameResult> {
    // Mock implementation for build compatibility
    // TODO: Move to server actions for full functionality
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return this.generateFallbackGuidance(options)
  },

  generateFallbackGuidance(options: ProcessFrameOptions): ProcessFrameResult {
    const { current, total, completedAngles } = options.sessionProgress
    
    // Determine next required angle
    const allAngles = ['overview', 'close_up', 'context', 'surrounding_area', 'supporting_evidence']
    const nextAngle = allAngles.find(angle => !completedAngles.includes(angle))
    
    if (!nextAngle || current >= total) {
      return {
        nextStep: '✅ Documentation appears complete! Review your images and submit when ready.',
        done: true,
        quality: 75,
        completionMessage: 'All required documentation angles have been captured.'
      }
    }

    const guidanceMap = {
      overview: 'Capture a wide shot showing the entire damage area and surrounding context.',
      close_up: 'Take a detailed close-up photo of the specific damage. Get close enough to see material details.',
      context: 'Show how the damage relates to the surrounding area. Step back to include more context.',
      surrounding_area: 'Photograph undamaged areas nearby for comparison. This helps establish the extent of damage.',
      supporting_evidence: 'Capture any serial numbers, measurements, or reference objects that help document the damage.'
    }

    return {
      nextStep: guidanceMap[nextAngle as keyof typeof guidanceMap] || 'Continue documenting the damage area.',
      done: false,
      quality: 70,
      completedAngle: current > 0 ? completedAngles[completedAngles.length - 1] : undefined,
      suggestions: [
        'Ensure good lighting for clear visibility',
        'Keep the camera steady to avoid blur',
        'Include reference objects for scale when possible'
      ]
    }
  }
}