/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Deadline Guardian Dashboard page in main app"
 * @dependencies ["react", "@/components/deadline-guardian/deadline-dashboard"]
 * @status stable
 * @ai-integration deadline-guardian
 * @insurance-context deadline-management
 */

'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DeadlineGuardianDashboard } from '@/components/deadline-guardian/deadline-dashboard'

export default function DeadlineGuardianPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <DeadlineGuardianDashboard />
      </div>
    </DashboardLayout>
  )
}
