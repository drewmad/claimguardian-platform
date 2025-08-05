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
import { Badge } from '@/components/ui/badge'
import { 
  Droplets, 
  Flame, 
  Wind, 
  Waves,
  AlertTriangle
} from 'lucide-react'

interface HazardZone {
  id: string
  name: string
  category: 'flood' | 'fire' | 'wind' | 'surge' | 'earthquake'
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
  description: string
  geometry?: {
    type: 'polygon' | 'circle'
    coordinates: number[][]
  }
  affectedProperties?: number
  lastUpdated: Date
}

interface HazardZonesListProps {
  hazardZones: HazardZone[]
}

export function HazardZonesList({ hazardZones }: HazardZonesListProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flood':
        return <Droplets className="h-4 w-4" />
      case 'fire':
        return <Flame className="h-4 w-4" />
      case 'wind':
        return <Wind className="h-4 w-4" />
      case 'surge':
        return <Waves className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flood':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'fire':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'wind':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'surge':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getRiskBadge = (riskWeight: number) => {
    if (riskWeight >= 0.7) {
      return <Badge variant="destructive" className="text-xs">High Risk</Badge>
    }
    if (riskWeight >= 0.4) {
      return <Badge variant="outline" className="text-xs">Medium Risk</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Low Risk</Badge>
  }

  if (hazardZones.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No hazard zones detected for this property</p>
          <p className="text-sm text-gray-500 mt-2">
            This is good news! The property is not located in any identified hazard zones.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Hazard Zones ({hazardZones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hazardZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(zone.category)}`}>
                    {getCategoryIcon(zone.category)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{zone.hazardType}</p>
                    <p className="text-sm text-gray-400">{zone.zoneName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${getCategoryColor(zone.category)}`}
                  >
                    {zone.category}
                  </Badge>
                  {getRiskBadge(zone.riskWeight)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['flood', 'fire', 'wind', 'surge'].map((category) => {
              const count = hazardZones.filter(z => z.category === category).length
              return (
                <div key={category} className="text-center">
                  <div className={`inline-flex p-3 rounded-lg mb-2 ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-gray-400 capitalize">{category} Zones</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}