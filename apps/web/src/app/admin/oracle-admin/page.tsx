/**
 * @fileMetadata
 * @owner @admin-team
 * @purpose "Oracle Settlement Analytics Admin Page (ADMIN ONLY)"
 * @dependencies ["react", "@/components/oracle/settlement-analytics-dashboard"]
 * @status stable
 * @ai-integration settlement-prediction
 * @insurance-context settlement-analytics
 * @security-level admin-only
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { SettlementAnalyticsDashboard } from '@/components/oracle/settlement-analytics-dashboard'

export default function OracleAdminPage() {
  return (
    <AdminLayout>
      <SettlementAnalyticsDashboard />
    </AdminLayout>
  )
}