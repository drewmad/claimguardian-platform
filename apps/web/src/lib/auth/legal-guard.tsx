/**
 * @fileMetadata
 * @purpose Legal consent guard for protecting routes
 * @owner legal-team
 * @dependencies ["@/lib/legal", "@/lib/logger"]
 * @exports ["checkLegalConsent", "LegalGuard"]
 * @complexity medium
 * @tags ["auth", "legal", "guard", "middleware"]
 * @status active
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { legalService } from '@/lib/legal/legal-service'
import { logger } from '@/lib/logger'

/**
 * Check if user has accepted all required legal documents
 */
export async function checkLegalConsent(userId: string): Promise<{
  hasConsent: boolean
  outstandingDocuments: string[]
}> {
  try {
    const outstandingDocs = await legalService.getDocumentsNeedingAcceptance(userId)
    
    return {
      hasConsent: outstandingDocs.length === 0,
      outstandingDocuments: outstandingDocs.map(doc => doc.id)
    }
  } catch (error) {
    logger.error('Failed to check legal consent', { userId, error })
    
    // Fail open for now - don't block users due to service errors
    return {
      hasConsent: true,
      outstandingDocuments: []
    }
  }
}

interface UseLegalGuardOptions {
  redirectTo?: string
  onConsentNeeded?: (documentCount: number) => void
}

export function useLegalGuard({
  redirectTo = '/legal/update',
  onConsentNeeded
}: UseLegalGuardOptions = {}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [hasConsent, setHasConsent] = useState(true)

  useEffect(() => {
    if (!user || authLoading || checking) return

    const checkConsent = async () => {
      try {
        setChecking(true)
        
        const result = await checkLegalConsent(user.id)
        setHasConsent(result.hasConsent)
        
        if (!result.hasConsent) {
          logger.info('User needs legal consent', {
            userId: user.id,
            outstandingCount: result.outstandingDocuments.length
          })
          
          onConsentNeeded?.(result.outstandingDocuments.length)
          router.push(redirectTo)
        }
      } catch (error) {
        logger.error('Legal consent check failed', error)
        // Don't redirect on error - fail open
        setHasConsent(true)
      } finally {
        setChecking(false)
      }
    }

    checkConsent()
  }, [user, authLoading, checking, redirectTo, onConsentNeeded, router])

  return {
    hasConsent,
    checking: checking || authLoading,
    user
  }
}


interface LegalGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * HOC for protecting components with legal consent check
 */
export function LegalGuard({ 
  children, 
  fallback,
  redirectTo = '/legal/update' 
}: LegalGuardProps) {
  const { hasConsent, checking } = useLegalGuard({ redirectTo })

  if (checking) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )
    )
  }

  if (!hasConsent) {
    // Component will redirect, but show loading state
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Checking legal requirements...</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}