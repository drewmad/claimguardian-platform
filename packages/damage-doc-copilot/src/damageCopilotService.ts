/**
 * @fileMetadata
 * @purpose Damage Documentation Copilot Service - AI-powered guidance for evidence capture
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/ai-services", "@claimguardian/db"]
 * @exports ["damageCopilotService"]
 * @complexity high
 * @status active
 */

import { aiServices } from '@claimguardian/ai-services'
import { createClient } from '@claimguardian/db'

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
    const supabase = createClient()
    
    try {
      // 1. Upload image to storage
      const fileName = `damage_copilot/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('damage_copilot')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Generate signed URL for AI analysis
      const { data: signedData, error: signedError } = await supabase.storage
        .from('damage_copilot')
        .createSignedUrl(uploadData.path, 600)

      if (signedError) throw signedError

      // 3. Analyze image with AI
      const analysisPrompt = `
You are an expert insurance documentation coach. Analyze this damage photo and provide guidance.

Current session context:
- Progress: ${options.sessionProgress.current}/${options.sessionProgress.total}
- Completed angles: ${options.sessionProgress.completedAngles.join(', ') || 'none'}
- Previous images: ${options.previousImages}

Required documentation angles:
1. overview - Wide shot showing entire damage area
2. close_up - Detailed view of specific damage
3. context - Damage in relation to surrounding area
4. surrounding_area - Undamaged areas for comparison
5. supporting_evidence - Serial numbers, measurements, reference objects

Analyze the image at: ${signedData.signedUrl}

Return JSON:
{
  "nextStep": "Specific instruction for next photo",
  "done": boolean,
  "quality": 0-100,
  "completedAngle": "which angle this photo covers (or null)",
  "completionMessage": "message if done",
  "suggestions": ["improvement suggestion 1", "suggestion 2"]
}

Quality criteria:
- Lighting (good/poor)
- Focus (sharp/blurry)
- Framing (appropriate/too close/too far)
- Damage visibility (clear/obscured)
`

      const result = await aiServices.processWithOptimalProvider({
        prompt: analysisPrompt,
        context: { 
          tool: 'Damage Documentation Copilot',
          sessionId: `session_${Date.now()}`
        },
        options: { costOptimized: true },
      })

      // Parse AI response
      let parsedResult: ProcessFrameResult
      try {
        parsedResult = JSON.parse(result)
      } catch {
        // Fallback if AI doesn't return valid JSON
        parsedResult = this.generateFallbackGuidance(options)
      }

      // 3. Store session data
      await supabase.from('damage_copilot_sessions').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        image_path: uploadData.path,
        analysis_result: parsedResult,
        session_progress: options.sessionProgress,
        created_at: new Date().toISOString()
      })

      return parsedResult

    } catch (error) {
      console.error('Error in damageCopilotService.processFrame:', error)
      
      // Return helpful fallback guidance
      return this.generateFallbackGuidance(options)
    }
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