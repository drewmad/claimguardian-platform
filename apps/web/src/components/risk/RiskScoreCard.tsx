/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  Droplets, 
  Flame, 
  Wind, 
  Waves,
  AlertTriangle,
  Shield,
  ShieldAlert
} from 'lucide-react'

interface RiskScoreCardProps {
  title: string
  score: number
  category: 'flood' | 'wildfire' | 'wind' | 'surge' | 'composite'
  description?: string
  className?: string
}

export function RiskScoreCard({ 
  title, 
  score, 
  category, 
  description,
  className 
}: RiskScoreCardProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'text-red-500', bgColor: 'bg-red-500' }
    if (score >= 0.3) return { level: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500' }
    return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-500' }
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'flood':
        return <Droplets className="h-5 w-5" />
      case 'wildfire':
        return <Flame className="h-5 w-5" />
      case 'wind':
        return <Wind className="h-5 w-5" />
      case 'surge':
        return <Waves className="h-5 w-5" />
      case 'composite':
        return score >= 0.7 ? <ShieldAlert className="h-5 w-5" /> : 
               score >= 0.3 ? <AlertTriangle className="h-5 w-5" /> : 
               <Shield className="h-5 w-5" />
    }
  }

  const { level, color, bgColor } = getRiskLevel(score)
  const percentage = Math.round(score * 100)

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span className={color}>{getCategoryIcon()}</span>
            <span className="text-white">{title}</span>
          </div>
          <span className={cn("text-sm font-medium", color)}>
            {level} Risk
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Risk Score</span>
            <span className="text-white font-medium">{percentage}%</span>
          </div>
          
          <Progress 
            value={percentage} 
            className={cn("h-2 bg-gray-700", bgColor)}
          />
          
          {description && (
            <p className="text-xs text-gray-400 mt-2">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}