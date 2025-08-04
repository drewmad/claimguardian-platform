'use client'

import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { logger } from "@/lib/logger/production-logger"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { EvidenceManager } from '@/components/claims/evidence-manager'
import { Button } from '@/components/ui/button'
import { logger } from "@/lib/logger/production-logger"

export default function ClaimEvidencePage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Claim
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Claim Evidence</h1>
            <p className="text-gray-400">
              Upload and manage all supporting documents for claim #{claimId}
            </p>
          </div>

          {/* Evidence Manager */}
          <EvidenceManager 
            claimId={claimId}
            onUpdate={(evidence) => {
              logger.info('Evidence updated:', evidence)
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}