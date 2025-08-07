'use client'

/**
 * @fileMetadata
 * @purpose "AI Claim Swarm Hook - State management for collaborative damage assessment"
 * @owner ai-innovation-team
 * @dependencies ["@claimguardian/db", "@claimguardian/realtime", "react", "uuid"]
 * @exports ["useClaimSwarm"]
 * @complexity high
 * @status stable
 */

import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'

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
  const [sessionId] = useState(() => uuid())
  const [media, setMedia] = useState<File[]>([])
  const [analysis, setAnalysis] = useState<string>('')
  const [consensus, setConsensus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Mock swarm members for build compatibility
  const mockSwarmMembers: SwarmMember[] = [
    { id: '1', joined_at: new Date().toISOString() }
  ]

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
    swarmMembers: mockSwarmMembers,
    analysis,
    consensus,
    loading,
    captureImage,
    submitMedia,
    hasMedia: media.length > 0,
  }
}
