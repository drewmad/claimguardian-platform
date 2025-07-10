/**
 * @fileMetadata
 * @purpose Backup of original personal property page
 * @owner frontend-team
 * @status backup
 */
'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'

function PersonalPropertyContent() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Personal Property Inventory</h1>
              <p className="text-gray-400">Track and manage your valuable belongings</p>
            </div>
          </div>
          
          <div className="text-white">
            <p>Personal property inventory page - under development</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PersonalPropertyPage() {
  return (
    <ProtectedRoute>
      <PersonalPropertyContent />
    </ProtectedRoute>
  )
}