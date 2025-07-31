/**
 * @fileMetadata
 * @purpose Personal property inventory management page
 * @owner frontend-team
 * @status active
 */
'use client'

import { AlertCircle, BarChart3, Camera, Car, ChevronRight, Diamond, DollarSign, Download, Edit, Eye, FileText, Gamepad, Grid, List, Music, Package, Plus, Search, Shield, Shirt, Sofa, Sparkles, Trash2, Tv, Watch } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
interface PropertyItem {
  id: string
  name: string
  category: string
  room: string
  purchasePrice: number
  currentValue: number
  purchaseDate: string
  brand?: string
  model?: string
  serialNumber?: string
  images: string[]
  receipts: string[]
  warrantyExpires?: string
  insured: boolean
  notes?: string
}

// Category configuration with icons
const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: Tv, color: 'blue' },
  { id: 'jewelry', name: 'Jewelry & Watches', icon: Watch, color: 'purple' },
  { id: 'furniture', name: 'Furniture', icon: Sofa, color: 'green' },
  { id: 'clothing', name: 'Clothing & Accessories', icon: Shirt, color: 'pink' },
  { id: 'collectibles', name: 'Art & Collectibles', icon: Diamond, color: 'yellow' },
  { id: 'vehicles', name: 'Vehicles', icon: Car, color: 'red' },
  { id: 'instruments', name: 'Musical Instruments', icon: Music, color: 'indigo' },
  { id: 'sports', name: 'Sports & Recreation', icon: Gamepad, color: 'orange' },
]

// Mock data - in production this would come from the database
const mockItems: PropertyItem[] = [
  {
    id: '1',
    name: '65" OLED TV',
    category: 'electronics',
    room: 'Living Room',
    purchasePrice: 2499,
    currentValue: 2100,
    purchaseDate: '2023-03-15',
    brand: 'LG',
    model: 'OLED65C2PUA',
    serialNumber: 'SN123456789',
    images: ['/tv-front.jpg'],
    receipts: ['/receipt-tv.pdf'],
    warrantyExpires: '2025-03-15',
    insured: true,
    notes: 'Extended warranty purchased'
  },
  {
    id: '2',
    name: 'Diamond Engagement Ring',
    category: 'jewelry',
    room: 'Master Bedroom',
    purchasePrice: 8500,
    currentValue: 9200,
    purchaseDate: '2021-06-10',
    brand: 'Tiffany & Co.',
    images: ['/ring.jpg'],
    receipts: ['/receipt-ring.pdf', '/appraisal-ring.pdf'],
    insured: true,
    notes: '1.5 carat, VVS1 clarity, E color'
  },
  {
    id: '3',
    name: 'Leather Sectional Sofa',
    category: 'furniture',
    room: 'Living Room',
    purchasePrice: 3200,
    currentValue: 2400,
    purchaseDate: '2022-11-20',
    brand: 'West Elm',
    model: 'Andes 3-Piece',
    images: ['/sofa.jpg'],
    receipts: ['/receipt-sofa.pdf'],
    insured: true
  }
]

function PersonalPropertyContent() {
  const [items] = useState<PropertyItem[]>(mockItems)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [, setShowAddModal] = useState(false)

  // Calculate statistics
  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0)
  const totalItems = items.length
  const insuredItems = items.filter(item => item.insured).length
  const highValueItems = items.filter(item => item.currentValue >= 5000).length

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group items by category for summary
  const itemsByCategory = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    return category?.icon || Package
  }

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    return category?.color || 'gray'
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Personal Property Inventory</h1>
              <p className="text-gray-400">Track and manage your valuable belongings for insurance documentation</p>
            </div>
            <div className="flex gap-3">
              <Link href="/ai-augmented/inventory-scanner">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Scanner
                </Button>
              </Link>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{totalItems}</p>
                    <p className="text-sm text-gray-400">Total Items</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Value</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{insuredItems}</p>
                    <p className="text-sm text-gray-400">Insured Items</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{highValueItems}</p>
                    <p className="text-sm text-gray-400">High Value (≥$5k)</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Overview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {CATEGORIES.map(category => {
                  const Icon = category.icon
                  const count = itemsByCategory[category.id] || 0
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedCategory === category.id
                          ? 'bg-blue-600/20 border-blue-600'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 text-${category.color}-400`} />
                      <p className="text-xs text-white font-medium">{category.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{count} items</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search items, brands, or rooms..."
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                  >
                    All Categories
                  </Button>
                  
                  <div className="flex gap-1 ml-4">
                    <Button
                      size="icon"
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 ml-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const Icon = getCategoryIcon(item.category)
                const categoryColor = getCategoryColor(item.category)
                
                return (
                  <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-${categoryColor}-600/20 rounded-lg`}>
                            <Icon className={`h-5 w-5 text-${categoryColor}-400`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{item.name}</h3>
                            {item.brand && (
                              <p className="text-sm text-gray-400">{item.brand} {item.model}</p>
                            )}
                          </div>
                        </div>
                        {item.insured && (
                          <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                            Insured
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location:</span>
                          <span className="text-white">{item.room}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Purchase Price:</span>
                          <span className="text-white">${item.purchasePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Value:</span>
                          <span className={`font-semibold ${
                            item.currentValue > item.purchasePrice ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            ${item.currentValue.toLocaleString()}
                          </span>
                        </div>
                        {item.serialNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Serial:</span>
                            <span className="text-white font-mono text-xs">{item.serialNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                        <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white">
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {filteredItems.map(item => {
                    const Icon = getCategoryIcon(item.category)
                    const categoryColor = getCategoryColor(item.category)
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-gray-700/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 bg-${categoryColor}-600/20 rounded-lg`}>
                            <Icon className={`h-5 w-5 text-${categoryColor}-400`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white">{item.name}</h3>
                              {item.insured && (
                                <Badge className="bg-green-600/20 text-green-300 border-green-600/30 text-xs">
                                  Insured
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              {item.brand && <span>{item.brand}</span>}
                              <span>{item.room}</span>
                              <span>Purchased {new Date(item.purchaseDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold text-white">
                              ${item.currentValue.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400">
                              {item.currentValue > item.purchasePrice ? (
                                <span className="text-green-400">
                                  +${(item.currentValue - item.purchasePrice).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-orange-400">
                                  -${(item.purchasePrice - item.currentValue).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-900/20 border-blue-600/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">Insurance Report</h3>
                    <p className="text-sm text-gray-400">Generate a detailed inventory report</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/20 border-purple-600/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Camera className="h-8 w-8 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-white">Bulk Photo Upload</h3>
                    <p className="text-sm text-gray-400">Add photos to multiple items</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-purple-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-900/20 border-green-600/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-white">Value Analysis</h3>
                    <p className="text-sm text-gray-400">Track depreciation and trends</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-green-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
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