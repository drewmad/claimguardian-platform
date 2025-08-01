'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function MlOperationsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">ML Operations Dashboard</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Disaster Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Alert</AlertTitle>
              <AlertDescription>
                Image recognition model performance has degraded by 30% in the last hour. Immediate action required.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <p className="text-gray-400">
                This is the disaster zone for troubleshooting live AI/ML models. Monitor model health, view real-time performance metrics, and take corrective actions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
