/**
 * @fileMetadata
 * @purpose "NIMS Compliance Dashboard Page"
 * @dependencies ["@/components/nims/NIMSComplianceDashboard"]
 * @owner emergency-management-team
 * @status stable
 */

import { NIMSComplianceDashboard } from '@/components/nims/NIMSComplianceDashboard'

export default function NIMSPage() {
  return <NIMSComplianceDashboard />
}

export const metadata = {
  title: 'NIMS Compliance - ClaimGuardian',
  description: 'Federal Emergency Management System Integration Dashboard'
}
