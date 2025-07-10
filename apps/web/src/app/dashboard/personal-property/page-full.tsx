/**
 * @fileMetadata
 * @purpose Personal property inventory dashboard
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "inventory", "personal-property"]
 * @status active
 */
'use client'

import React, { useState } from 'react'
import { 
  Package, Plus, Search, Filter, Camera, DollarSign,
  Shield, AlertCircle, ChevronRight, Grid,
  List, Home, Car, Tv, Shirt, Gem,
  Heart, MoreHorizontal, QrCode, FileText, Download
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent } from '@claimguardian/ui'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

type ViewMode = 'grid' | 'list'
type Category = 'all' | 'electronics' | 'jewelry' | 'furniture' | 'appliances' | 'vehicles' | 'clothing' | 'collectibles' | 'other'

interface InventoryItem {
  id: string
  name: string
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  location: string
  condition: string
  insured: boolean
  photos: string[]
  receipts: string[]
  notes?: string
  tags: string[]
}

function PersonalPropertyContent() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock data - would come from Supabase
  const [items] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'MacBook Pro 16"',
      category: 'electronics',
      brand: 'Apple',
      model: 'A2141',
      serialNumber: 'C02XL123H7JG',
      purchaseDate: '2023-01-15',
      purchasePrice: 2499,
      currentValue: 2200,
      location: 'Home Office',
      condition: 'Excellent',
      insured: true,
      photos: ['📸'],
      receipts: ['📄'],
      tags: ['work', 'computer']
    },
    {
      id: '2',
      name: 'Diamond Engagement Ring',
      category: 'jewelry',
      brand: 'Tiffany & Co',
      purchaseDate: '2020-06-20',
      purchasePrice: 8500,
      currentValue: 9200,
      location: 'Master Bedroom Safe',
      condition: 'Excellent',
      insured: true,
      photos: ['📸'],
      receipts: ['📄'],
      tags: ['valuable', 'jewelry', 'appraisal']
    },
    {
      id: '3',
      name: 'Samsung 65" OLED TV',
      category: 'electronics',
      brand: 'Samsung',
      model: 'QN65S95B',
      serialNumber: '0ABC1234567',
      purchaseDate: '2022-11-25',
      purchasePrice: 1899,
      currentValue: 1400,
      location: 'Living Room',
      condition: 'Very Good',
      insured: true,
      photos: ['📸'],
      receipts: ['📄'],
      tags: ['entertainment', 'electronics']
    }
  ])

  const categories = [
    { id: 'all', label: 'All Items', icon: Package, count: items.length },
    { id: 'electronics', label: 'Electronics', icon: Tv, count: items.filter(i => i.category === 'electronics').length },
    { id: 'jewelry', label: 'Jewelry', icon: Gem, count: items.filter(i => i.category === 'jewelry').length },
    { id: 'furniture', label: 'Furniture', icon: Home, count: 0 },
    { id: 'appliances', label: 'Appliances', icon: Home, count: 0 },
    { id: 'vehicles', label: 'Vehicles', icon: Car, count: 0 },
    { id: 'clothing', label: 'Clothing', icon: Shirt, count: 0 },
    { id: 'collectibles', label: 'Collectibles', icon: Heart, count: 0 },
    { id: 'other', label: 'Other', icon: MoreHorizontal, count: 0 }
  ]

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat ? cat.icon : Package
  }

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0)
  const totalItems = items.length
  const insuredItems = items.filter(item => item.insured).length

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Personal Property Inventory</h1>
              <p className="text-gray-400">Track and manage your valuable belongings</p>
            </div>
            <button 
              onClick={() => router.push('/ai-augmented/inventory-scanner')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Quick Scan
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalItems}</p>
                <p className="text-sm text-gray-400">Items Cataloged</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">+8.2%</span>
                </div>
                <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Value</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs text-cyan-400">{Math.round((insuredItems/totalItems)*100)}%</span>
                </div>
                <p className="text-2xl font-bold text-white">{insuredItems}</p>
                <p className="text-sm text-gray-400">Insured Items</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-orange-400">Action</span>
                </div>
                <p className="text-2xl font-bold text-white">2</p>
                <p className="text-sm text-gray-400">Need Update</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, brands, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
              <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* Categories - Improved Layout */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Categories</h3>
            
            {/* Primary Categories Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.slice(0, 5).map((category) => {
                const Icon = category.icon
                const isActive = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as Category)}
                    className={`p-4 rounded-xl border transition-all group ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                    <p className="text-sm font-medium mb-1">{category.label}</p>
                    <div className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {category.count}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Secondary Categories Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.slice(5).map((category) => {
                const Icon = category.icon
                const isActive = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as Category)}
                    className={`p-3 rounded-lg border transition-all group ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                      <div className="text-left">
                        <p className="text-sm font-medium">{category.label}</p>
                        <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{category.count} items</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {selectedCategory === 'all' 
                  ? `All Items (${filteredItems.length})` 
                  : `${categories.find(c => c.id === selectedCategory)?.label} (${filteredItems.length})`
                }
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Showing {filteredItems.length} of {totalItems} items</span>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No items found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery 
                      ? `No items match "${searchQuery}" in ${selectedCategory === 'all' ? 'any category' : selectedCategory}`
                      : `No items in ${selectedCategory === 'all' ? 'your inventory' : selectedCategory} category`
                    }
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    Add Your First Item
                  </button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const Icon = getCategoryIcon(item.category)
                  return (
                    <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                            <Icon className="w-6 h-6 text-gray-400 group-hover:text-gray-300" />
                          </div>
                          <Badge variant={item.insured ? "default" : "secondary"} className="shrink-0">
                            {item.insured ? 'Insured' : 'Not Insured'}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">{item.name}</h3>
                        {item.brand && <p className="text-sm text-gray-400 mb-3">{item.brand} {item.model}</p>}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Value</span>
                            <span className="text-white font-medium">${item.currentValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Location</span>
                            <span className="text-gray-300">{item.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Condition</span>
                            <span className="text-gray-300">{item.condition}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                              +{item.tags.length - 2}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            {item.photos.length > 0 && (
                              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400 transition-colors">
                                <Camera className="w-4 h-4" />
                              </button>
                            )}
                            {item.receipts.length > 0 && (
                              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400 transition-colors">
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {item.serialNumber && (
                              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400 transition-colors">
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <button className="text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Item</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Category</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Value</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Location</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const Icon = getCategoryIcon(item.category)
                        return (
                          <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{item.name}</p>
                                  {item.brand && <p className="text-sm text-gray-400">{item.brand}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-gray-300 capitalize">{item.category}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium text-white">${item.currentValue.toLocaleString()}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-gray-300">{item.location}</span>
                            </td>
                            <td className="p-4">
                              <Badge variant={item.insured ? "default" : "secondary"}>
                                {item.insured ? 'Insured' : 'Not Insured'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <button className="text-blue-400 hover:text-blue-300">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                      <Download className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Export Inventory</h3>
                      <p className="text-sm text-gray-400">Download as PDF or CSV</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 hover:border-green-500 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Insurance Review</h3>
                      <p className="text-sm text-gray-400">Check coverage gaps</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer group"
                onClick={() => router.push('/ai-augmented/inventory-scanner')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <Camera className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">AI Scanner</h3>
                      <p className="text-sm text-gray-400">Quick catalog items</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
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