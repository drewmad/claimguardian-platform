/**
 * @fileMetadata
 * @purpose AI Claim Swarm Hook - State management for collaborative damage assessment
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/db", "@claimguardian/realtime", "react", "uuid"]
 * @exports ["useClaimSwarm"]
 * @complexity high
 * @status active
 */

import { useState, useCallback, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { createClient } from '@claimguardian/db'
import { useRealtime } from '@claimguardian/realtime'
import { claimSwarmService } from './claimSwarmService'

export interface SwarmMember {
  id: string
  joined_at: string
}

export interface SwarmUpdate {
  session_id: string
  analysis?: string
  consensus_text?: string
  member_count: SwarmMember[]
}

export function useClaimSwarm() {
  const supabase = createClient()
  const [sessionId] = useState(() => uuid())
  const [media, setMedia] = useState<File[]>([])
  const [analysis, setAnalysis] = useState<string>('')
  const [consensus, setConsensus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Subscribe to realtime consensus updates
  const { data: swarmUpdates } = useRealtime('claim_swarm_updates', {
    filter: `session_id=eq.${sessionId}`,
  })

  // Join the swarm session on mount
  useEffect(() => {
    const joinSwarm = async () => {
      try {
        await supabase.from('claim_swarms').insert({
          session_id: sessionId,
          interim_analysis: null,
          consensus_text: null,
        })
      } catch (error) {
        console.error('Error joining swarm:', error)
      }
    }

    joinSwarm()
  }, [sessionId, supabase])

  // Update consensus when realtime data changes
  useEffect(() => {
    if (swarmUpdates?.length) {
      const latest = swarmUpdates[swarmUpdates.length - 1] as SwarmUpdate
      if (latest.consensus_text) {
        setConsensus(latest.consensus_text)
      }
    }
  }, [swarmUpdates])

  const captureImage = useCallback((file: File) => {
    setMedia((prev) => [...prev, file])
  }, [])

  const submitMedia = useCallback(async () => {
    if (media.length === 0) return

    setLoading(true)
    try {
      const result = await claimSwarmService.processMedia(sessionId, media)
      setAnalysis(result.analysis)
      
      // Clear media after successful submission
      setMedia([])
    } catch (error) {
      console.error('Error processing media:', error)
      setAnalysis('Error processing media. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId, media])

  return {
    sessionId,
    swarmMembers: (swarmUpdates?.[0] as SwarmUpdate)?.member_count ?? [],
    analysis,
    consensus,
    loading,
    captureImage,
    submitMedia,
    hasMedia: media.length > 0,
  }
}