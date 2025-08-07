import { Metadata } from 'next'
import { CrisisResponseDashboard } from '@/components/crisis/crisis-response-dashboard'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export const metadata: Metadata = {
  title: 'Crisis Response Coordinator - ClaimGuardian',
  description: 'Emergency response coordination and crisis management system with real-time alerts and action plans',
}

export default function CrisisResponsePage() {
  // In production, get user ID from authentication
  const userId = 'demo-user' // Replace with actual user ID from auth

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Crisis Response Coordinator</h1>
          <p className="text-gray-400 mt-2">
            Emergency detection, response coordination, and crisis management system
          </p>
        </div>

        <CrisisResponseDashboard
          userId={userId}
          className="space-y-6"
        />
      </div>
    </DashboardLayout>
  )
}
