'use client'

import { AdminLayout } from '@/components/admin/admin-layout'

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Welcome to the admin dashboard. Use the sidebar to navigate to different admin sections.
        </p>
      </div>
    </AdminLayout>
  )
}
