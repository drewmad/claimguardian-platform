'use client'

import { 
  Code, Map, Building, TrendingUp, DollarSign,
  Layers, Activity, FileText, BarChart,
  Home, TreePine, Car, Users, Zap, Droplets,
  ChevronRight, ExternalLink, Info
} from 'lucide-react'
import { useState } from 'react'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function DevelopmentPage() {
  const [selectedView, setSelectedView] = useState('overview')
  
  const propertyData = {
    address: '9555 Mirror Fountain Cir',
    city: 'Frisco',
    state: 'TX',
    zipCode: '75033-7145',
    parcelId: '245057',
    owner: 'BYRON W GOODMAN',
    lotSize: '8,750 sq ft',
    yearBuilt: 2005,
    zoning: 'Residential',
    assessedValue: 425000,
    marketValue: 485000,
    lastSalePrice: 380000,
    lastSaleDate: '2019-06-15'
  }

  const developmentMetrics = [
    { label: 'Property Value Growth', value: '+27.6%', trend: 'up', since: '2019' },
    { label: 'Neighborhood Avg Price', value: '$525K', trend: 'up', change: '+4.2%' },
    { label: 'Development Activity', value: 'Moderate', trend: 'stable', projects: 3 },
    { label: 'Market Temperature', value: 'Hot', trend: 'up', score: 87 }
  ]

  const nearbyDevelopments = [
    {
      name: 'Kings Garden Mixed-Use',
      type: 'Commercial',
      distance: '0.3 mi',
      status: 'Under Construction',
      impact: 'positive',
      completion: 'Q3 2024'
    },
    {
      name: 'Cobb Middle School Expansion',
      type: 'Educational',
      distance: '0.8 mi',
      status: 'Planning',
      impact: 'positive',
      completion: 'Q1 2025'
    },
    {
      name: 'Freedom Lane Apartments',
      type: 'Residential',
      distance: '1.2 mi',
      status: 'Approved',
      impact: 'neutral',
      completion: 'Q4 2024'
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Code className="w-8 h-8 text-purple-400" />
              Development Dashboard
            </h1>
            <p className="text-gray-400">Property insights, market analysis, and development tracking</p>
          </div>

          {/* View Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'overview' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('map')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'map' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setSelectedView('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'analytics' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Property Summary */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{propertyData.address}</h2>
                <p className="text-gray-400">{propertyData.city}, {propertyData.state} {propertyData.zipCode}</p>
              </div>
              <button className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                View Full Report
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-gray-400">Parcel ID</p>
                <p className="text-lg font-medium text-white">{propertyData.parcelId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Lot Size</p>
                <p className="text-lg font-medium text-white">{propertyData.lotSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Year Built</p>
                <p className="text-lg font-medium text-white">{propertyData.yearBuilt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Zoning</p>
                <p className="text-lg font-medium text-white">{propertyData.zoning}</p>
              </div>
            </div>
          </div>

          {/* Development Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {developmentMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : metric.trend === 'down' ? (
                    <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                  ) : (
                    <Activity className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                {metric.change && (
                  <p className="text-sm text-gray-400 mt-1">{metric.change} YoY</p>
                )}
                {metric.since && (
                  <p className="text-sm text-gray-400 mt-1">Since {metric.since}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Valuation */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Property Valuation
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Assessed Value</p>
                    <p className="text-lg font-medium text-white">${propertyData.assessedValue.toLocaleString()}</p>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Market Value</p>
                    <p className="text-lg font-medium text-white">${propertyData.marketValue.toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-green-400">+14.1%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Last Sale Price</p>
                    <p className="text-lg font-medium text-white">${propertyData.lastSalePrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{propertyData.lastSaleDate}</p>
                  </div>
                  <span className="text-xs text-green-400">+27.6%</span>
                </div>
              </div>
            </div>

            {/* Nearby Developments */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                Nearby Developments
              </h3>
              <div className="space-y-3">
                {nearbyDevelopments.map((dev, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{dev.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-400">{dev.type}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-400">{dev.distance}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            dev.status === 'Under Construction' 
                              ? 'bg-orange-500/20 text-orange-300'
                              : dev.status === 'Planning'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {dev.status}
                          </span>
                          <span className="text-xs text-gray-500">Est. {dev.completion}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Area Statistics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-cyan-400" />
              Area Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Population</p>
                <p className="text-lg font-medium text-white">45,231</p>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <Home className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Households</p>
                <p className="text-lg font-medium text-white">12,847</p>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <TreePine className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Parks</p>
                <p className="text-lg font-medium text-white">8</p>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <Car className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Transit Score</p>
                <p className="text-lg font-medium text-white">72</p>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Grid Reliability</p>
                <p className="text-lg font-medium text-white">99.8%</p>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Flood Zone</p>
                <p className="text-lg font-medium text-white">X</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <Map className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <p className="font-medium text-white">Interactive Map</p>
                <p className="text-sm text-gray-400">Explore area developments</p>
              </div>
            </button>
            
            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="font-medium text-white">Property Report</p>
                <p className="text-sm text-gray-400">Download full analysis</p>
              </div>
            </button>

            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <Layers className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <p className="font-medium text-white">Zoning Info</p>
                <p className="text-sm text-gray-400">View restrictions & permits</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}