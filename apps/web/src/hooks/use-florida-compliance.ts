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

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { useEffect, useState, useCallback } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { useFloridaDisclosures } from '@/components/compliance/florida-disclosures-context'

/**
 * Hook to check and handle Florida insurance compliance requirements
 * Shows disclosures when:
 * 1. User uploads their first insurance policy
 * 2. User creates their first claim
 * 3. User is detected to be in Florida (via property address)
 */
export function useFloridaCompliance() {
  const supabase = createBrowserSupabaseClient()
  const { showDisclosures, hasSeenDisclosures } = useFloridaDisclosures()
  const [isLoading, setIsLoading] = useState(true)
  const [needsDisclosures, setNeedsDisclosures] = useState(false)

  const checkComplianceStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Check if user has already accepted Florida disclosures
      const { data: consents } = await supabase
        .from('user_consents')
        .select('consent_type')
        .eq('user_id', user.id)
        .in('consent_type', ['public_adjuster_notice', 'legal_advice_disclaimer', 'insurance_cooperation'])

      const hasAllDisclosures = consents && consents.length === 3
      setNeedsDisclosures(!hasAllDisclosures && !hasSeenDisclosures)
      setIsLoading(false)
    } catch (error) {
      logger.error('Error checking compliance status:', error)
      setIsLoading(false)
    }
  }, [supabase, hasSeenDisclosures])

  useEffect(() => {
    checkComplianceStatus()
  }, [checkComplianceStatus])

  const triggerDisclosuresIfNeeded = async (context: 'policy_upload' | 'claim_creation' | 'florida_property') => {
    if (!needsDisclosures || hasSeenDisclosures) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Log the context for analytics
    logger.info(`Showing Florida disclosures for context: ${context}`)

    showDisclosures(user.id)
  }

  return {
    isLoading,
    needsDisclosures,
    triggerDisclosuresIfNeeded
  }
}

/**
 * Example usage in a policy upload component:
 *
 * function PolicyUpload() {
 *   const { triggerDisclosuresIfNeeded } = useFloridaCompliance()
 *
 *   const handlePolicyUpload = async (file: File) => {
 *     // Show Florida disclosures before processing the policy
 *     await triggerDisclosuresIfNeeded('policy_upload')
 *
 *     // Continue with policy upload...
 *   }
 * }
 */
