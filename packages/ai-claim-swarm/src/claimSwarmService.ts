/**
 * @fileMetadata
 * @purpose AI Claim Swarm Service - Core logic for collaborative damage assessment
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/ai-services", "@claimguardian/db"]
 * @exports ["claimSwarmService"]
 * @complexity high
 * @status active
 */

import { aiServices } from '@claimguardian/ai-services'
import { createClient } from '@claimguardian/db'

export interface ProcessMediaResult {
  analysis: string
  confidence: number
}

export const claimSwarmService = {
  async processMedia(sessionId: string, media: File[]): Promise<ProcessMediaResult> {
    const supabase = createClient()
    
    try {
      // 1. Upload media files to Supabase Storage
      const uploads = await Promise.all(
        media.map(async (file, index) => {
          const fileName = `${sessionId}/${Date.now()}_${index}_${file.name}`
          const { data, error } = await supabase.storage
            .from('claim_swarms')
            .upload(fileName, file, { upsert: true })
          
          if (error) throw error
          return data.path
        })
      )

      // 2. Generate signed URLs for AI processing
      const signedUrls = await Promise.all(
        uploads.map(async (path) => {
          const { data, error } = await supabase.storage
            .from('claim_swarms')
            .createSignedUrl(path, 600) // 10 minutes
          
          if (error) throw error
          return data.signedUrl
        })
      )

      // 3. Invoke Edge Function for AI analysis
      const { data, error } = await supabase.functions.invoke('claim-swarm', {
        body: { 
          sessionId, 
          imageUrls: signedUrls,
          timestamp: new Date().toISOString()
        },
      })

      if (error) throw error

      return {
        analysis: data.analysis || 'Analysis completed',
        confidence: data.confidence || 0.8
      }

    } catch (error) {
      console.error('Error in claimSwarmService.processMedia:', error)
      throw new Error('Failed to process media for swarm analysis')
    }
  },

  async generateConsensus(sessionId: string): Promise<string> {
    const supabase = createClient()
    
    try {
      // Get all analyses for this session
      const { data: analyses, error } = await supabase
        .from('claim_swarms')
        .select('interim_analysis')
        .eq('session_id', sessionId)
        .not('interim_analysis', 'is', null)

      if (error) throw error
      if (!analyses || analyses.length === 0) return ''

      // Use AI to generate consensus from multiple analyses
      const prompt = `
You are a collaborative insurance damage assessment coordinator. 
Multiple users have submitted damage analyses for the same property.
Generate a consensus report that combines the following analyses:

${analyses.map((a, i) => `Analysis ${i + 1}: ${JSON.stringify(a.interim_analysis)}`).join('\n')}

Return a JSON object with:
{
  "consensusSeverity": "minor|moderate|major|severe",
  "confidence": 0-1,
  "keyFindings": ["finding1", "finding2"],
  "recommendedActions": ["action1", "action2"],
  "estimatedCost": number
}
`

      const result = await aiServices.processWithOptimalProvider({
        prompt,
        context: { tool: 'AI Claim Swarm Consensus', sessionId },
        options: { costOptimized: true },
      })

      return result

    } catch (error) {
      console.error('Error generating consensus:', error)
      return 'Unable to generate consensus at this time'
    }
  }
}