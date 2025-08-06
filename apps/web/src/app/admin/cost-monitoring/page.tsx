/**
 * Admin Cost Monitoring Page
 * Complete real-time AI cost monitoring dashboard with live updates
 */

import { Metadata } from 'next'
import { LiveCostDashboard } from '@/components/admin/live-cost-dashboard'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'

export const metadata: Metadata = {
  title: 'AI Cost Monitoring - Admin Dashboard | ClaimGuardian',
  description: 'Real-time AI cost monitoring, alerts, and usage analytics dashboard for administrators.'
}

export default function CostMonitoringPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <LiveCostDashboard />
      </div>
    </DashboardLayout>
  )
}