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

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MlOperationsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin dashboard with ML Operations tab selected
    router.push('/admin?tab=ml-operations')
  }, [router])

  return null
}
