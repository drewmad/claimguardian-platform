/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Statistics cards component for insurance dashboard"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { Shield, DollarSign, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card-variants'

interface InsuranceStatsProps {
  totalCoverage: number
  totalPremium: number
  activePolicies: number
}

export function InsuranceStatsCards({ totalCoverage, totalPremium, activePolicies }: InsuranceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card variant="insurance">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {totalCoverage > 0 ? `$${(totalCoverage / 1000000).toFixed(2)}M` : '$0'}
              </p>
              <p className="text-sm text-gray-400">Total Dwelling Coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="insurance">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {totalPremium > 0 ? `$${totalPremium.toLocaleString()}` : '$0'}
              </p>
              <p className="text-sm text-gray-400">Total Annual Premium</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="insurance">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{activePolicies}</p>
              <p className="text-sm text-gray-400">Active Policies</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}