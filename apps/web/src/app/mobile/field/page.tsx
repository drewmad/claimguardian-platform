/**
 * @fileMetadata
 * @purpose "Mobile field documentation app page"
 * @dependencies ["@/components"]
 * @owner mobile-team
 * @status stable
 */
'use client'

import { MobileFieldApp } from '@/components/mobile/mobile-field-app'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function MobileFieldPage() {
  return (
    <ProtectedRoute>
      <MobileFieldApp />
    </ProtectedRoute>
  )
}
