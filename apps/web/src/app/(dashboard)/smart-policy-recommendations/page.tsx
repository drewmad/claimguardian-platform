import { Metadata } from 'next'
import { SmartRecommendationsDashboard } from '@/components/policy/smart-recommendations-dashboard'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export const metadata: Metadata = {
  title: 'Smart Policy Recommendations - ClaimGuardian',
  description: 'AI-powered policy analysis and optimization recommendations to maximize coverage and minimize costs',
}

export default function SmartPolicyRecommendationsPage() {
  // In production, get user ID from authentication
  const userId = 'demo-user' // Replace with actual user ID from auth

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <SmartRecommendationsDashboard 
          userId={userId}
          className="space-y-6"
        />
      </div>
    </DashboardLayout>
  )
}