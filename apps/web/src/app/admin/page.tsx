'use client'

import { Suspense } from 'react'

import { AdminDashboardImproved } from './admin-dashboard-improved'

function AdminDashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    }>
      <AdminDashboardImproved />
    </Suspense>
  )
}

export default function AdminPage() {
  return <AdminDashboardWrapper />
}
