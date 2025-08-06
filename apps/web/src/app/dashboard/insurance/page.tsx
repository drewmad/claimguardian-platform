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

import { Shield, FileText, DollarSign, CheckCircle, TrendingUp, Phone, Download, Plus, ChevronRight, Home, Car, Heart, Umbrella, AlertTriangle, Info, Building, Users, FileCheck, Package, Search, Filter, Grid, List, ArrowLeft, MapPin, Bed, Bath, Square, Calendar, Tag, ExternalLink, Loader2, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-variants'
import { InsuranceBadge, PolicyStatusBadge, InsurabilityBadge } from '@/components/ui/insurance-badges'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PropertyImage } from '@/components/ui/property-image'
import { InsuranceEmptyState } from '@/components/ui/empty-state'
import { SearchFilterBar, type InsuranceFilterOptions } from '@/components/insurance/search-filter-bar'
import { InsuranceStatsCards } from '@/components/insurance/insurance-stats-cards'
import { PropertyPolicyCard } from '@/components/insurance/property-policy-card'
import { BulkActions, useBulkSelection, BulkCheckbox } from '@/components/ui/bulk-actions'
import { 
  fadeInUp, 
  staggerContainer, 
  staggerItem, 
  cardHover,
  pageTransition
} from '@/lib/animations'


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
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null)
  const [filters, setFilters] = useState<InsuranceFilterOptions>({
    search: '',
    policyTypes: [],
    carriers: [],
    status: [],
    sortBy: 'name',
    sortOrder: 'asc',
    dateRange: {}
  })
  
  // Empty data by default - will be populated from database
  const [policies] = useState<Policy[]>([])
  const [coverages] = useState<Coverage[]>([])
  const [properties] = useState<Property[]>([])
  
  // Bulk selection for policies
  const bulkSelection = useBulkSelection(properties)

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
                <Card variant="elevated">
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
                <Card variant="elevated">
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
      <motion.div 
        className="p-6 bg-gray-900 min-h-screen"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div 
            className="flex justify-between items-start mb-8"
            variants={fadeInUp}
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Dashboard</h1>
              <p className="text-gray-400">An overview of all your insurance policies and coverage.</p>
            </div>
            <motion.button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              Add Policy
            </motion.button>
          </motion.div>

          {/* Search and Filter */}
          <motion.div variants={fadeInUp}>
            <SearchFilterBar 
              onFiltersChange={setFilters}
              availableCarriers={Array.from(new Set(policies.map(p => p.carrier)))}
              availablePolicyTypes={Array.from(new Set(policies.map(p => p.type)))}
              className="mb-8"
            />
          </motion.div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {bulkSelection.selectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <BulkActions
                  selectedCount={bulkSelection.selectedCount}
                  totalCount={properties.length}
                  selectedIds={bulkSelection.selectedIds}
                  onSelectAll={bulkSelection.selectAll}
                  onClearSelection={bulkSelection.clearSelection}
                  actions={[
                    {
                      id: 'export',
                      label: 'Export',
                      icon: Download,
                      action: async (ids) => {
                        console.log('Exporting properties:', ids)
                      }
                    },
                    {
                      id: 'archive',
                      label: 'Archive',
                      icon: Archive,
                      action: async (ids) => {
                        console.log('Archiving properties:', ids)
                      }
                    }
                  ]}
                  className="mb-6"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Overview Cards */}
          <motion.div variants={fadeInUp}>
            <InsuranceStatsCards 
              totalCoverage={totalCoverage}
              totalPremium={totalPremium}
              activePolicies={activePolicies}
            />
          </motion.div>

          {/* Property Grouped Policies */}
          <motion.div 
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {properties.length === 0 ? (
              <motion.div variants={staggerItem}>
                <InsuranceEmptyState 
                  onAddProperty={() => router.push('/dashboard/property')}
                  onAddPolicy={() => {/* TODO: Add policy modal */}}
                />
              </motion.div>
            ) : (
              properties.map((property) => {
              const propertyPolicies = policies.filter(p => property.policies.includes(p.id))
              const isExpanded = expandedProperty === property.id
              
              return (
                <motion.div key={property.id} variants={staggerItem}>
                  <motion.div
                    variants={cardHover}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Card variant="property" className="overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-700/20 transition-colors"
                        onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                              <PropertyImage
                                propertyId={property.id}
                                propertyType={property.type}
                                propertyName={property.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white">{property.name}</h3>
                              <p className="text-sm text-gray-400">{propertyPolicies.length} Policies</p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </div>
                      </CardHeader>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <CardContent className="p-6 space-y-4 border-t border-gray-700/50">
                          <motion.div
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                          >
                            {propertyPolicies.map((policy) => {
                              const Icon = getPolicyIcon(policy.type)
                              const isWindstorm = policy.type.toLowerCase() === 'windstorm'
                              const windDeductible = isWindstorm ? `2% ($${(policy.coverage * 0.02 / 1000).toFixed(0)},000)` : null
                              
                              return (
                                <motion.div 
                                  key={policy.id}
                                  variants={staggerItem}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  <div 
                                    className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/insurance/policy/${policy.id}`)}
                                  >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-white">{policy.carrier}</h4>
                                <p className="text-sm text-gray-400">#{policy.policyNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-white">{formatCurrency(policy.coverage)}</p>
                                <p className="text-sm text-gray-400">Dwelling Coverage</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400 mb-1">Deductible</p>
                                <p className="text-white font-medium">{formatCurrency(policy.deductible)}</p>
                              </div>
                              {windDeductible && (
                                <div>
                                  <p className="text-gray-400 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                                    Wind Deductible
                                  </p>
                                  <p className="text-yellow-400 font-medium">{windDeductible}</p>
                                </div>
                              )}
                              {!windDeductible && (
                                <div>
                                  <p className="text-gray-400 mb-1">Wind Deductible</p>
                                  <p className="text-gray-500 font-medium">N/A</p>
                                </div>
                              )}
                              <div>
                                <p className="text-gray-400 mb-1">Premium</p>
                                <p className="text-white font-medium">${policy.premium}/yr</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Expires</p>
                                <p className="text-white font-medium">{new Date(policy.expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                              </div>
                            </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                            
                            {propertyPolicies.length === 0 && (
                              <motion.div 
                                variants={staggerItem}
                                className="text-center py-8"
                              >
                                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No policies for this property</p>
                                <motion.button 
                                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Add Policy →
                                </motion.button>
                              </motion.div>
                            )}
                          </motion.div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                    </Card>
                  </motion.div>
                </motion.div>
              )
            })
            )}
          </motion.div>

        </div>
      </motion.div>
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