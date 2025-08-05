/**
 * @fileMetadata
 * @purpose "Billing dashboard for subscription management"
 * @dependencies ["@/components","@/lib","next"]
 * @owner billing-team
 * @status stable
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingDashboard } from '@/components/billing/billing-dashboard'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export const metadata: Metadata = {
  title: 'Billing | ClaimGuardian',
  description: 'Manage your subscription and billing',
}

export default async function BillingPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin?redirect=/dashboard/billing')
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription, payment methods, and billing history</p>
        </div>
        
        <BillingDashboard userId={user.id} />
      </div>
    </DashboardLayout>
  )
}