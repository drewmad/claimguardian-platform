/**
 * @fileMetadata
 * @purpose "Insurance policies and coverage management dashboard"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "insurance", "policies"]
 * @status stable
 */
'use client'

import { Shield, FileText, DollarSign, CheckCircle, TrendingUp, Phone, Download, Plus, ChevronRight, Home, Car, Heart, Umbrella, AlertTriangle, Info, Building, Users, FileCheck, Package, Search, Filter, Grid, List, ArrowLeft, MapPin, Bed, Bath, Square, Calendar, Tag, ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PropertyImage } from '@/components/ui/property-image'


interface Policy {
  id: string
  type: string
  carrier: string
  policyNumber: string
  premium: number
  deductible: number
  coverage: number
  status: 'active' | 'pending' | 'expired'
  effectiveDate: string
  expirationDate: string
  nextPayment: string
  documents: number
  claims: number
}

interface Coverage {
  type: string
  limit: number
  used: number
  deductible: number
  icon: React.ComponentType<{ className?: string }>
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  type: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize: number
  yearBuilt: number
  estimatedValue: number
  lastSalePrice?: number
  lastSaleDate?: string
  propertyTaxes?: number
  hoaFees?: number
  insurability: 'low' | 'medium' | 'high'
  policies: string[] // Policy IDs associated with this property
  images?: string[]
}

function InsuranceDashboardContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('policies')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Mock data - empty by default
  const [policies] = useState<Policy[]>([])

  const [coverages] = useState<Coverage[]>([])

  const [properties] = useState<Property[]>([])

  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0)
  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverage, 0)
  const activePolicies = policies.filter(p => p.status === 'active').length
  const totalClaims = policies.reduce((sum, policy) => sum + policy.claims, 0)

  const getPolicyIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'homeowners': return Home
      case 'flood': return Umbrella
      case 'auto': return Car
      default: return Shield
    }
  }

  // Removed unused function - getStatusColor

  const getDaysUntil = (date: string) => {
    const target = new Date(date)
    const today = new Date()
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getPropertyTypeIcon = (type: string) => {
    switch(type) {
      case 'single-family': return Home
      case 'condo': return Building
      case 'townhouse': return Building
      case 'multi-family': return Building
      case 'commercial': return Building
      default: return Home
    }
  }

  const getInsurabilityColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Render property detail view if a property is selected
  if (selectedProperty) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Property Detail Header */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
              </button>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{selectedProperty.name}</h1>
                  <p className="text-gray-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                    Edit
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                    Share
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Property Images Carousel */}
            <div className="mb-8">
              <div className="relative h-96 bg-gray-800 rounded-lg overflow-hidden">
                <PropertyImage
                  propertyId={selectedProperty.id}
                  propertyType={selectedProperty.type}
                  propertyName={selectedProperty.name}
                  size="full"
                  className="w-full h-full object-cover"
                />
                {/* Carousel dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Property Overview Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Property Overview</h2>
              </div>
              <p className="text-gray-300 mb-6">
                A stunning modern villa located in the heart of Metropolis, offering luxurious living with breathtaking views and state-of-the-art amenities. This property boasts an open floor plan, gourmet kitchen, and a spacious master suite. The exterior features a beautifully landscaped yard with a private pool and patio area, perfect for entertaining. Close to shopping, dining, and top-rated schools.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Property Type</p>
                    <p className="text-white capitalize">{selectedProperty.type.replace('-', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Year Built</p>
                    <p className="text-white">{selectedProperty.yearBuilt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Lot Size</p>
                    <p className="text-white">{selectedProperty.lotSize.toLocaleString()} sq ft ({(selectedProperty.lotSize / 43560).toFixed(2)} acres)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Bedrooms</p>
                    <p className="text-white">{selectedProperty.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Living Area</p>
                    <p className="text-white">{selectedProperty.squareFeet.toLocaleString()} sq ft</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Bathrooms</p>
                    <p className="text-white">{selectedProperty.bathrooms} Full, 1 Half</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Snapshot */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Financial Snapshot</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Listing Price</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(selectedProperty.estimatedValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Estimated AVM</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(selectedProperty.estimatedValue)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Last Sale ({selectedProperty.lastSaleDate ? new Date(selectedProperty.lastSaleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'})</p>
                          <p className="text-lg text-white">{selectedProperty.lastSalePrice ? formatCurrency(selectedProperty.lastSalePrice) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Property Taxes (2023)</p>
                          <p className="text-lg text-white">{selectedProperty.propertyTaxes ? formatCurrency(selectedProperty.propertyTaxes) : 'N/A'}</p>
                        </div>
                      </div>
                      {selectedProperty.hoaFees && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-1">HOA Fee</p>
                          <p className="text-lg text-white">${selectedProperty.hoaFees} / monthly</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Associated Policies */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Insurance Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProperty.policies.map(policyId => {
                        const policy = policies.find(p => p.id === policyId)
                        if (!policy) return null
                        const Icon = getPolicyIcon(policy.type)
                        return (
                          <div key={policy.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="font-medium text-white">{policy.type}</p>
                                <p className="text-sm text-gray-400">{policy.carrier}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-white">{formatCurrency(policy.coverage)}</p>
                              <p className="text-sm text-gray-400">${policy.premium}/year</p>
                            </div>
                          </div>
                        )
                      })}
                      <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Policy
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar sections would go here - similar to the image */}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Policies</h1>
              <p className="text-gray-400">Manage and analyze your insurance portfolio.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Policy
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Total: {policies.length}</span>
                </div>
                <p className="text-2xl font-bold text-white">{activePolicies}</p>
                <p className="text-sm text-gray-400">Active Policies</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-gray-400">Total: ${(totalPremium * 12 / 1000).toFixed(0)}k/year</span>
                </div>
                <p className="text-2xl font-bold text-white">${(totalPremium / 12).toFixed(0).toLocaleString()}</p>
                <p className="text-sm text-gray-400">Average Premium</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-yellow-400">!</span>
                </div>
                <p className="text-2xl font-bold text-white">2</p>
                <p className="text-sm text-gray-400">Expiring in 90 Days</p>
                <p className="text-xs text-gray-500 mt-1">Renewals coming up</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-red-400">!</span>
                </div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-sm text-gray-400">Coverage Gaps</p>
                <p className="text-xs text-gray-500 mt-1">AI-detected issues</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="policies" className="data-[state=active]:bg-gray-700">Policies</TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-gray-700">Portfolio</TabsTrigger>
              </TabsList>
              
              {activeTab === 'portfolio' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/property')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Portfolio
                  </button>
                </div>
              )}
            </div>

            {/* Policies Tab Content */}
            <TabsContent value="policies" className="space-y-6">
              {policies.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No policies yet</h3>
                  <p className="text-gray-400 mb-6">Start by adding your first insurance policy</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Your First Policy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map((policy) => {
                    const Icon = getPolicyIcon(policy.type)
                    const statusColor = policy.status === 'active' ? 'bg-green-600' : 
                                      policy.status === 'expired' ? 'bg-red-600' : 'bg-yellow-600'
                    const statusText = policy.status.charAt(0).toUpperCase() + policy.status.slice(1)
                    
                    return (
                      <Card key={policy.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{policy.type}</h3>
                                <p className="text-xs text-gray-400">{policy.carrier}</p>
                              </div>
                            </div>
                            <Badge className={`${statusColor} text-white`}>{statusText}</Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Policy Number</span>
                              <span className="text-gray-300 font-mono text-xs">{policy.policyNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Coverage</span>
                              <span className="text-white font-medium">{formatCurrency(policy.coverage)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Premium</span>
                              <span className="text-white">${policy.premium}/year</span>
                            </div>
                          </div>

                          {policy.status === 'active' && (
                            <div className="text-xs text-gray-400">
                              Renews {new Date(policy.expirationDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                            <div className="flex gap-2 text-xs text-gray-400">
                              {policy.claims > 0 && <span>{policy.claims} claims</span>}
                              <span>No claims</span>
                            </div>
                            <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Portfolio Tab Content */}
            <TabsContent value="portfolio" className="space-y-6">
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No properties in your portfolio</h3>
                  <p className="text-gray-400 mb-6">Add properties to track their insurance coverage and value</p>
                  <button 
                    onClick={() => router.push('/dashboard/property')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Property
                  </button>
                </div>
              ) : (
                <>
                  {/* Portfolio Header Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">{properties.length}</p>
                            <p className="text-sm text-gray-400">Total Properties</p>
                          </div>
                          <Building className="w-8 h-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(properties.reduce((sum, p) => sum + p.estimatedValue, 0))}</p>
                            <p className="text-sm text-gray-400">Total Value</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">{properties.filter(p => p.policies.length > 0).length}</p>
                            <p className="text-sm text-gray-400">Insured Properties</p>
                          </div>
                          <Shield className="w-8 h-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">{properties.filter(p => p.insurability === 'high').length}</p>
                            <p className="text-sm text-gray-400">High Insurability</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Property Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <Card 
                        key={property.id} 
                        className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group"
                        onClick={() => setSelectedProperty(property)}
                      >
                        <div className="relative h-48 bg-gray-900 overflow-hidden">
                          <PropertyImage
                            propertyId={property.id}
                            propertyType={property.type}
                            propertyName={property.name}
                            size="medium"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className={`${getInsurabilityColor(property.insurability)} backdrop-blur-sm`}>
                              {property.insurability} insurability
                            </Badge>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-white mb-1">{property.name}</h3>
                          <p className="text-sm text-gray-400 flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" />
                            {property.city}, {property.state}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div className="text-gray-400">
                              Added:
                            </div>
                            <div className="text-gray-300">
                              -
                            </div>
                            <div className="text-gray-400">
                              Est. Value:
                            </div>
                            <div className="text-gray-300">
                              {formatCurrency(property.estimatedValue)}
                            </div>
                            <div className="text-gray-400">
                              Insurability:
                            </div>
                            <div className="text-gray-300">
                              -
                            </div>
                          </div>
                          
                          <div className="flex justify-center pt-3 border-t border-gray-700">
                            <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm">
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function InsuranceDashboardPage() {
  return (
    <ProtectedRoute>
      <InsuranceDashboardContent />
    </ProtectedRoute>
  )
}