/**
 * @fileMetadata
 * @purpose Utility to update AI pages to match site's UI design
 * @owner frontend-team
 * @dependencies []
 * @exports ["updateAIPageUI"]
 * @complexity low
 * @tags ["ui", "styling", "utility"]
 * @status active
 */

export const AI_UI_PATTERNS = {
  // Replace light theme with dark theme
  BACKGROUND_REPLACEMENTS: [
    { from: 'bg-gray-50', to: 'bg-gray-900' },
    { from: 'bg-white', to: 'bg-gray-800' },
    { from: 'bg-gray-100', to: 'bg-gray-700' },
  ],
  
  // Text color replacements
  TEXT_REPLACEMENTS: [
    { from: 'text-gray-900', to: 'text-white' },
    { from: 'text-gray-800', to: 'text-gray-100' },
    { from: 'text-gray-700', to: 'text-gray-200' },
    { from: 'text-gray-600', to: 'text-gray-400' },
    { from: 'text-gray-500', to: 'text-gray-500' }, // Keep as is
  ],
  
  // Border replacements
  BORDER_REPLACEMENTS: [
    { from: 'border-gray-200', to: 'border-gray-700' },
    { from: 'border-gray-300', to: 'border-gray-600' },
  ],
  
  // Card styling
  CARD_CLASSES: 'bg-gray-800 border-gray-700',
  
  // Button styling
  BUTTON_PRIMARY: 'bg-blue-600 hover:bg-blue-700 text-white',
  BUTTON_SECONDARY: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
  
  // Alert styling
  ALERT_WARNING: 'bg-orange-900/20 border-orange-500/30',
  ALERT_ERROR: 'bg-red-900/20 border-red-500/30',
  ALERT_INFO: 'bg-blue-900/20 border-blue-500/30',
}

export const AI_PAGE_STRUCTURE = {
  WRAPPER: `<DashboardLayout>
  <div className="p-6">
    <div className="max-w-7xl mx-auto space-y-6">`,
  
  HEADER: (icon: string, title: string, description: string) => `
    {/* Header */}
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-${icon}-600/20 rounded-lg">
          <${icon.charAt(0).toUpperCase() + icon.slice(1)} className="h-6 w-6 text-${icon}-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">${title}</h1>
        <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">Beta</Badge>
      </div>
      <p className="text-gray-400 max-w-3xl">
        ${description}
      </p>
    </div>`,
  
  STATS_CARD: (icon: string, value: string, label: string, color: string) => `
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <${icon} className="w-5 h-5 text-${color}-400" />
          <span className="text-xs text-green-400">Status</span>
        </div>
        <p className="text-2xl font-bold text-white">${value}</p>
        <p className="text-sm text-gray-400">${label}</p>
      </CardContent>
    </Card>`,
  
  CLOSING: `
    </div>
  </div>
</DashboardLayout>`
}

export function generateAIPageTemplate(config: {
  title: string
  description: string
  icon: string
  iconColor: string
  features: string[]
}) {
  return `'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ${config.icon},
  AlertTriangle,
  Sparkles,
  Settings
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useAuthDebug } from '@/hooks/use-auth-debug'
import { toast } from 'sonner'
import { aiErrorHelpers, performanceTimer } from '@/lib/error-logger'

function ${config.title.replace(/\s+/g, '')}Content() {
  const { user } = useAuth()
  useAuthDebug('${config.title.replace(/\s+/g, '')}Content')
  
  // Component state and logic here
  
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-${config.iconColor}-600/20 rounded-lg">
              <${config.icon} className="h-6 w-6 text-${config.iconColor}-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">${config.title}</h1>
            <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">Beta</Badge>
          </div>
          <p className="text-gray-400 max-w-3xl">
            ${config.description}
          </p>
        </div>

        {/* Content goes here */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <${config.icon} className="h-16 w-16 text-${config.iconColor}-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">${config.title}</h3>
              <p className="text-gray-400 mb-6">${config.description}</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ${config.title.replace(/\s+/g, '')}Page() {
  useAuthDebug('${config.title.replace(/\s+/g, '')}Page')
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <${config.title.replace(/\s+/g, '')}Content />
      </DashboardLayout>
    </ProtectedRoute>
  )
}`
}