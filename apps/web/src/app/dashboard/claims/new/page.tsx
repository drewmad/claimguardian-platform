'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClaimCreationWizard } from '@/components/claims/claim-creation-wizard'

export default function NewClaimPage() {
  return (
    <ProtectedRoute>
      <ClaimCreationWizard />
    </ProtectedRoute>
  )
}