/**
 * @fileMetadata
 * @purpose "Enhanced personal property inventory management page"
 * @dependencies ["@/components","@/lib","next","react","sonner"]
 * @owner frontend-team
 * @status stable
 */
'use client'

import {
  AlertCircle, BarChart3, Camera, Car, ChevronRight, Diamond,
  DollarSign, Download, Edit, Eye, FileText, Gamepad, Grid,
  List, Music, Package, Plus, Search, Shield, Shirt, Sofa,
  Sparkles, Trash2, Tv, Watch, Home, ScanLine,
  MapPin, Tag, Filter, Share2, CheckCircle,
  Upload, QrCode, History, TrendingUp, TrendingDown, Star, Info
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DepreciationAlerts } from '@/components/property/depreciation-alerts'
import { DepreciationTracker } from '@/components/property/depreciation-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { calculateDepreciation, getDepreciationAlerts } from '@/lib/depreciation'

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
  tags?: string[]
  condition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor'
  barcode?: string
  lastUpdated?: string
  location?: {
    room: string
    specific?: string
    coordinates?: { x: number; y: number }
  }
}

interface Room {
  id: string
  name: string
  icon: React.ElementType
  itemCount: number
  totalValue: number
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
  { id: 'kitchen', name: 'Kitchen & Dining', icon: Package, color: 'cyan' },
  { id: 'tools', name: 'Tools & Equipment', icon: Package, color: 'gray' },
]

// Enhanced mock data
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
    notes: 'Extended warranty purchased',
    tags: ['entertainment', 'warranty', 'high-value'],
    condition: 'excellent',
    barcode: '123456789012',
    lastUpdated: '2024-01-15',
    location: { room: 'Living Room', specific: 'North wall' }
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
    notes: '1.5 carat, VVS1 clarity, E color',
    tags: ['high-value', 'appraisal', 'safe'],
    condition: 'excellent',
    lastUpdated: '2024-01-10'
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
    insured: true,
    condition: 'good',
    tags: ['living-room', 'leather']
  },
  {
    id: '4',
    name: 'Kitchen Aid Stand Mixer',
    category: 'kitchen',
    room: 'Kitchen',
    purchasePrice: 450,
    currentValue: 380,
    purchaseDate: '2022-12-25',
    brand: 'KitchenAid',
    model: 'Artisan 5Qt',
    images: ['/mixer.jpg'],
    receipts: ['/receipt-mixer.pdf'],
    insured: false,
    condition: 'excellent',
    tags: ['appliance', 'gift']
  }
]

const mockRooms: Room[] = [
  { id: '1', name: 'Living Room', icon: Sofa, itemCount: 12, totalValue: 8500 },
  { id: '2', name: 'Master Bedroom', icon: Home, itemCount: 8, totalValue: 12000 },
  { id: '3', name: 'Kitchen', icon: Package, itemCount: 15, totalValue: 3200 },
  { id: '4', name: 'Garage', icon: Car, itemCount: 6, totalValue: 25000 },
]

function PersonalPropertyContent() {
  const router = useRouter()
  const [items, setItems] = useState<PropertyItem[]>(mockItems)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PropertyItem | null>(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showBatchActions, setShowBatchActions] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate statistics
  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0)
  const totalItems = items.length
  const insuredItems = items.filter(item => item.insured).length
  const highValueItems = items.filter(item => item.currentValue >= 5000).length
  const totalPurchaseValue = items.reduce((sum, item) => sum + item.purchasePrice, 0)
  const valueChange = totalValue - totalPurchaseValue

  // Calculate depreciation values and alerts
  const itemsWithDepreciation = items.map(item => {
    const depreciation = calculateDepreciation(item.purchasePrice, item.purchaseDate, item.category)
    return {
      ...item,
      currentValue: depreciation.currentValue, // Update with calculated value
      depreciationData: depreciation
    }
  })

  // Get all depreciation alerts
  const allAlerts = items.flatMap(item =>
    getDepreciationAlerts({
      purchasePrice: item.purchasePrice,
      purchaseDate: item.purchaseDate,
      category: item.category,
      name: item.name
    })
  )

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesRoom = selectedRoom === 'all' || item.room === selectedRoom
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch && matchesRoom
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

  const startBarcodeScanning = () => {
    setIsScanning(true)
    setScanProgress(0)

    // Store interval ID to clear on cancel
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          // Only show success if scanning completed (not cancelled)
          toast.success('Item scanned successfully!')
          setShowAddModal(true) // Open add modal with scanned data
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Store interval ID for cancellation
    ;(window as any).scanInterval = interval
  }

  const handleQuickAdd = (category: string) => {
    setSelectedCategory(category)
    setShowAddModal(true)
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'new': return 'text-green-400'
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Selection handlers
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
    setShowBatchActions(newSelection.size > 0)
  }

  const selectAllItems = () => {
    const allItemIds = new Set(filteredItems.map(item => item.id))
    setSelectedItems(allItemIds)
    setShowBatchActions(true)
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
    setShowBatchActions(false)
    setIsSelectionMode(false)
  }

  const handleBatchDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      setItems(items.filter(item => !selectedItems.has(item.id)))
      clearSelection()
      toast.success(`${selectedItems.size} items deleted`)
    }
  }

  const handleBatchExport = () => {
    const exportItems = items.filter(item => selectedItems.has(item.id))
    const data = {
      exportDate: new Date().toISOString(),
      itemCount: exportItems.length,
      totalValue: exportItems.reduce((sum, item) => sum + item.currentValue, 0),
      items: exportItems
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-property-export-${Date.now()}.json`
    a.click()
    toast.success(`Exported ${selectedItems.size} items`)
  }

  // const handleBatchUpdateRoom = (newRoom: string) => {
  //   setItems(items.map(item =>
  //     selectedItems.has(item.id) ? { ...item, room: newRoom } : item
  //   ))
  //   toast.success(`Updated room for ${selectedItems.size} items`)
  //   clearSelection()
  // }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Enhanced Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Package className="w-8 h-8 text-purple-400" />
                Personal Property Inventory
              </h1>
              <p className="text-gray-400">Your complete home inventory management system</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Link href="/ai-tools/inventory-scanner">
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

          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <p className="text-2xl font-bold text-white">${itemsWithDepreciation.reduce((sum, item) => sum + item.currentValue, 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Value</p>
                    <p className={`text-xs mt-1 ${valueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {valueChange >= 0 ? '+' : ''}${Math.abs(valueChange).toLocaleString()} {valueChange >= 0 ? 'appreciation' : 'depreciation'}
                    </p>
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
                    <Progress
                      value={(insuredItems / totalItems) * 100}
                      className="mt-2 h-1 bg-gray-700"
                    />
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

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{mockRooms.length}</p>
                    <p className="text-sm text-gray-400">Rooms</p>
                  </div>
                  <Home className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="rooms">By Room</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
                  onClick={startBarcodeScanning}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600/20 rounded-lg">
                        <ScanLine className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Quick Scan</h3>
                        <p className="text-sm text-gray-400">Scan barcode</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
                  onClick={() => toast.info('Photo capture feature coming soon!')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-600/20 rounded-lg">
                        <Camera className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Photo Capture</h3>
                        <p className="text-sm text-gray-400">Document items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
                  onClick={() => toast.info('Report generation feature coming soon!')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-600/20 rounded-lg">
                        <FileText className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Generate Report</h3>
                        <p className="text-sm text-gray-400">For insurance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
                  onClick={() => toast.info('Sharing feature coming soon!')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-cyan-600/20 rounded-lg">
                        <Share2 className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Share Access</h3>
                        <p className="text-sm text-gray-400">With family</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <p className="text-sm text-gray-300">Added "Kitchen Aid Stand Mixer" to Kitchen</p>
                      <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <p className="text-sm text-gray-300">Updated value for "65" OLED TV"</p>
                      <span className="text-xs text-gray-500 ml-auto">Yesterday</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <p className="text-sm text-gray-300">Generated insurance report</p>
                      <span className="text-xs text-gray-500 ml-auto">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Depreciation Alerts */}
              {allAlerts.length > 0 && (
                <DepreciationAlerts
                  alerts={allAlerts}
                  onDismiss={(alert) => {
                    toast.info(`Dismissed alert: ${alert.title}`)
                  }}
                  onAction={(alert) => {
                    if (alert.type === 'maintenance') {
                      toast.info('Opening maintenance schedule...')
                    } else if (alert.type === 'replacement') {
                      toast.info('Opening replacement options...')
                    } else {
                      toast.info(`Taking action on: ${alert.title}`)
                    }
                  }}
                />
              )}

              {/* Top Categories */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Add by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {CATEGORIES.slice(0, 10).map(category => {
                      const Icon = category.icon
                      const count = itemsByCategory[category.id] || 0
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleQuickAdd(category.id)}
                          className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-all group"
                        >
                          <Icon className={`h-8 w-8 mx-auto mb-2 text-${category.color}-400 group-hover:scale-110 transition-transform`} />
                          <p className="text-xs text-white font-medium">{category.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{count} items</p>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-6">
              {/* Batch Actions Bar */}
              {showBatchActions && (
                <Card className="bg-blue-900/20 border-blue-600/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <p className="text-white font-medium">
                          {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={selectAllItems}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Select All ({filteredItems.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearSelection}
                          className="text-gray-400 hover:text-white"
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleBatchExport}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tags
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Move to Room
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleBatchDelete}
                          className="bg-red-600/20 hover:bg-red-600/30 border-red-600/30 text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Filters and Search */}
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
                          placeholder="Search items, brands, rooms, or tags..."
                          className="pl-10 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                        <SelectValue placeholder="All Rooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {mockRooms.map(room => (
                          <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1">
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
                      variant={isSelectionMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode)
                        if (isSelectionMode) {
                          clearSelection()
                        }
                      }}
                      className={isSelectionMode
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isSelectionMode ? 'Done' : 'Select'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Items Display */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => {
                    const Icon = getCategoryIcon(item.category)
                    const categoryColor = getCategoryColor(item.category)

                    return (
                      <Card
                        key={item.id}
                        className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer relative ${
                          isSelectionMode && selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleItemSelection(item.id)
                          } else {
                            router.push(`/dashboard/personal-property/${item.id}`)
                          }
                        }}
                      >
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        <CardContent className="p-4">
                          {/* Item Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 bg-${categoryColor}-600/20 rounded-lg`}>
                                <Icon className={`h-5 w-5 text-${categoryColor}-400`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{item.name}</h3>
                                {item.brand && (
                                  <p className="text-sm text-gray-400">{item.brand}</p>
                                )}
                              </div>
                            </div>
                            {item.condition && (
                              <Star className={`h-4 w-4 ${getConditionColor(item.condition)}`} />
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="h-3 w-3" />
                              <span>{item.room}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Value:</span>
                              <DepreciationTracker
                                purchasePrice={item.purchasePrice}
                                purchaseDate={item.purchaseDate}
                                category={item.category}
                                compact={true}
                              />
                            </div>
                          </div>

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} className="text-xs bg-gray-700 text-gray-300">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 2 && (
                                <Badge className="text-xs bg-gray-700 text-gray-300">
                                  +{item.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Status Badges */}
                          <div className="flex items-center gap-2 mt-3">
                            {item.insured && (
                              <Badge className="bg-green-600/20 text-green-300 border-green-600/30 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Insured
                              </Badge>
                            )}
                            {item.warrantyExpires && new Date(item.warrantyExpires) > new Date() && (
                              <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Warranty
                              </Badge>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                // View action
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Edit action
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Photo action
                              }}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                // QR Code action
                              }}
                            >
                              <QrCode className="h-4 w-4" />
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
                          <div
                            key={item.id}
                            className={`p-4 hover:bg-gray-700/50 transition-all cursor-pointer ${
                              isSelectionMode && selectedItems.has(item.id) ? 'bg-blue-900/20' : ''
                            }`}
                            onClick={() => {
                              if (isSelectionMode) {
                                toggleItemSelection(item.id)
                              } else {
                                router.push(`/dashboard/personal-property/${item.id}`)
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              {/* Selection Checkbox */}
                              {isSelectionMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                              <div className={`p-2 bg-${categoryColor}-600/20 rounded-lg`}>
                                <Icon className={`h-5 w-5 text-${categoryColor}-400`} />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-semibold text-white">{item.name}</h3>
                                  {item.condition && (
                                    <Star className={`h-4 w-4 ${getConditionColor(item.condition)}`} />
                                  )}
                                  {item.insured && (
                                    <Badge className="bg-green-600/20 text-green-300 border-green-600/30 text-xs">
                                      Insured
                                    </Badge>
                                  )}
                                  {item.tags && item.tags.map(tag => (
                                    <Badge key={tag} className="text-xs bg-gray-700 text-gray-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  {item.brand && <span>{item.brand}</span>}
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.room}
                                  </span>
                                  <span>Purchased {new Date(item.purchaseDate).toLocaleDateString()}</span>
                                  {item.serialNumber && (
                                    <span className="font-mono text-xs">SN: {item.serialNumber}</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-semibold text-white">
                                  ${item.currentValue.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {item.currentValue > item.purchasePrice ? (
                                    <span className="text-green-400">
                                      <TrendingUp className="inline h-3 w-3 mr-1" />
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
            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockRooms.map(room => {
                  const roomItems = items.filter(item => item.room === room.name)

                  return (
                    <Card key={room.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600/20 rounded-lg">
                              <Home className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{room.name}</h3>
                              <p className="text-sm text-gray-400">{room.itemCount} items</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-2xl font-bold text-white">${room.totalValue.toLocaleString()}</p>
                            <p className="text-sm text-gray-400">Total value</p>
                          </div>

                          {/* Recent items in room */}
                          <div className="space-y-2">
                            {roomItems.slice(0, 3).map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{item.name}</span>
                                <span className="text-gray-400">${item.currentValue.toLocaleString()}</span>
                              </div>
                            ))}
                            {roomItems.length > 3 && (
                              <p className="text-xs text-gray-500">+{roomItems.length - 3} more items</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {CATEGORIES.map(category => {
                  const Icon = category.icon
                  const categoryItems = items.filter(item => item.category === category.id)
                  const categoryValue = categoryItems.reduce((sum, item) => sum + item.currentValue, 0)

                  return (
                    <Card key={category.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className={`p-4 bg-${category.color}-600/20 rounded-lg inline-flex mb-4`}>
                            <Icon className={`h-8 w-8 text-${category.color}-400`} />
                          </div>
                          <h3 className="font-semibold text-white mb-2">{category.name}</h3>
                          <p className="text-2xl font-bold text-white">{categoryItems.length}</p>
                          <p className="text-sm text-gray-400">items</p>
                          <p className="text-lg font-semibold text-green-400 mt-2">
                            ${categoryValue.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Photo Gallery</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.filter(item => item.images.length > 0).map(item => (
                      <div key={item.id} className="space-y-2">
                        {item.images.map((image, idx) => (
                          <div
                            key={`${item.id}-${idx}`}
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDetailModal(true)
                            }}
                          >
                            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="h-12 w-12 text-gray-500" />
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
                              <p className="text-white text-sm font-medium text-center line-clamp-2">{item.name}</p>
                              <p className="text-gray-300 text-xs">{item.room}</p>
                              <p className="text-green-400 text-sm font-semibold mt-1">${item.currentValue.toLocaleString()}</p>
                            </div>
                            {item.insured && (
                              <div className="absolute top-2 right-2">
                                <Shield className="h-4 w-4 text-green-400 drop-shadow-lg" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {items.filter(item => item.images.length > 0).length === 0 && (
                    <div className="text-center py-12">
                      <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No photos uploaded yet</p>
                      <p className="text-gray-500 text-sm mt-2">Add photos to your items to see them here</p>
                      <Button
                        onClick={() => {
                          setCurrentTab('items')
                          toast.info('Select an item and add photos')
                        }}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Photos to Items
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Photo Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {items.reduce((sum, item) => sum + item.images.length, 0)}
                        </p>
                        <p className="text-sm text-gray-400">Total Photos</p>
                      </div>
                      <Camera className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {items.filter(item => item.images.length > 0).length}
                        </p>
                        <p className="text-sm text-gray-400">Items with Photos</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {items.filter(item => item.images.length === 0).length}
                        </p>
                        <p className="text-sm text-gray-400">Need Photos</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Value Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {CATEGORIES.map(category => {
                        const categoryItems = itemsWithDepreciation.filter(item => item.category === category.id)
                        const categoryValue = categoryItems.reduce((sum, item) => sum + item.currentValue, 0)
                        const categoryPurchaseValue = categoryItems.reduce((sum, item) => sum + item.purchasePrice, 0)
                        const depreciationAmount = categoryPurchaseValue - categoryValue
                        const currentTotalValue = itemsWithDepreciation.reduce((sum, item) => sum + item.currentValue, 0)
                        const percentage = (categoryValue / currentTotalValue) * 100

                        return (
                          <div key={category.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-300">{category.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">${categoryValue.toLocaleString()}</span>
                                {depreciationAmount !== 0 && (
                                  <span className={`text-xs ${depreciationAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {depreciationAmount > 0 ? '-' : '+'}${Math.abs(depreciationAmount).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2 bg-gray-700" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Insurance Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6 text-green-400" />
                          <div>
                            <p className="font-semibold text-white">Insured Items</p>
                            <p className="text-sm text-gray-400">{insuredItems} of {totalItems} items</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          {Math.round((insuredItems / totalItems) * 100)}%
                        </p>
                      </div>

                      <div className="p-4 bg-orange-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-orange-400" />
                          <p className="font-medium text-orange-300">Coverage Gap</p>
                        </div>
                        <p className="text-sm text-gray-300">
                          {totalItems - insuredItems} items worth ${
                            items.filter(i => !i.insured)
                              .reduce((sum, item) => sum + item.currentValue, 0)
                              .toLocaleString()
                          } are not insured
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Depreciation Analytics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-400" />
                    Depreciation Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        ${Math.abs(totalPurchaseValue - itemsWithDepreciation.reduce((sum, item) => sum + item.currentValue, 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Total Depreciation</p>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {Math.round(((totalPurchaseValue - itemsWithDepreciation.reduce((sum, item) => sum + item.currentValue, 0)) / totalPurchaseValue) * 100)}%
                      </p>
                      <p className="text-sm text-gray-400">Average Depreciation Rate</p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                      <p className="font-medium text-yellow-300">Maintenance Alerts</p>
                    </div>
                    <p className="text-sm text-gray-300">
                      {allAlerts.filter(a => a.type === 'maintenance').length} items need maintenance soon
                    </p>
                  </div>

                  <div className="p-4 bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      <p className="font-medium text-red-300">Replacement Consideration</p>
                    </div>
                    <p className="text-sm text-gray-300">
                      {allAlerts.filter(a => a.type === 'replacement').length} items may need replacement
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Value Items */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Highest Value Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...itemsWithDepreciation]
                      .sort((a, b) => b.currentValue - a.currentValue)
                      .slice(0, 5)
                      .map(item => {
                        const Icon = getCategoryIcon(item.category)
                        const depreciationPercent = item.depreciationData ? item.depreciationData.depreciationPercent : 0
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">{item.room}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">${item.currentValue.toLocaleString()}</p>
                              <div className="flex items-center gap-2">
                                {item.insured ? (
                                  <Badge className="text-xs bg-green-600/20 text-green-300">Insured</Badge>
                                ) : (
                                  <Badge className="text-xs bg-orange-600/20 text-orange-300">Not Insured</Badge>
                                )}
                                <Badge className={`text-xs ${depreciationPercent > 0 ? 'bg-red-600/20 text-red-300' : 'bg-green-600/20 text-green-300'}`}>
                                  {depreciationPercent > 0 ? '-' : '+'}{Math.abs(depreciationPercent)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-900/20 border-blue-600/30 hover:bg-blue-900/30 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">Insurance Report</h3>
                    <p className="text-sm text-gray-400">Generate detailed inventory report</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/20 border-purple-600/30 hover:bg-purple-900/30 transition-all cursor-pointer">
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

            <Card className="bg-green-900/20 border-green-600/30 hover:bg-green-900/30 transition-all cursor-pointer">
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

      {/* Barcode Scanning Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 max-w-md w-full mx-4">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                  <ScanLine className="h-10 w-10 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-white">Scanning Barcode...</h3>
                <p className="text-gray-400">Position the barcode within the frame</p>
                <Progress value={scanProgress} className="h-2 bg-gray-700" />
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear the scanning interval
                    if ((window as any).scanInterval) {
                      clearInterval((window as any).scanInterval)
                      delete (window as any).scanInterval
                    }
                    setIsScanning(false)
                    setScanProgress(0)
                  }}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                {(() => {
                  const Icon = getCategoryIcon(selectedItem.category)
                  return <Icon className="h-6 w-6 text-gray-400" />
                })()}
                {selectedItem.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Brand</Label>
                  <p className="text-white">{selectedItem.brand || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Model</Label>
                  <p className="text-white">{selectedItem.model || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Purchase Date</Label>
                  <p className="text-white">{new Date(selectedItem.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Location</Label>
                  <p className="text-white">{selectedItem.room}</p>
                </div>
              </div>

              {/* Value Info */}
              <div className="space-y-4">
                <DepreciationTracker
                  purchasePrice={selectedItem.purchasePrice}
                  purchaseDate={selectedItem.purchaseDate}
                  category={selectedItem.category}
                  showDetails={true}
                />
              </div>

              {/* Additional Details */}
              {selectedItem.serialNumber && (
                <div>
                  <Label className="text-gray-400">Serial Number</Label>
                  <p className="text-white font-mono">{selectedItem.serialNumber}</p>
                </div>
              )}

              {selectedItem.notes && (
                <div>
                  <Label className="text-gray-400">Notes</Label>
                  <p className="text-white">{selectedItem.notes}</p>
                </div>
              )}

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div>
                  <Label className="text-gray-400">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedItem.tags.map(tag => (
                      <Badge key={tag} className="bg-gray-700 text-gray-300">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button variant="outline" className="flex-1 bg-gray-700 hover:bg-gray-600">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">Add New Item</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Quick Category Selection */}
              <div>
                <Label className="text-gray-400 mb-2">Quick Select Category</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.slice(0, 8).map(category => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedCategory === category.id
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs">{category.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName" className="text-gray-400">Item Name *</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Samsung 65 inch TV"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="brand" className="text-gray-400">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Samsung"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="model" className="text-gray-400">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., QN65Q80B"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="serialNumber" className="text-gray-400">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., SN123456789"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Location and Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room" className="text-gray-400">Room *</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockRooms.map(room => (
                        <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="condition" className="text-gray-400">Condition</Label>
                  <Select defaultValue="excellent">
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Value Information */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchasePrice" className="text-gray-400">Purchase Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="purchasePrice"
                      type="number"
                      placeholder="0.00"
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="currentValue" className="text-gray-400">Current Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentValue"
                      type="number"
                      placeholder="0.00"
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="purchaseDate" className="text-gray-400">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Warranty Information */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  Warranty Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warrantyExpires" className="text-gray-400">Warranty Expires</Label>
                    <Input
                      id="warrantyExpires"
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded bg-gray-700 border-gray-600" />
                      <span className="text-gray-300">Insured Item</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-400" />
                  Photos & Documents
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button className="aspect-square bg-gray-600 rounded-lg hover:bg-gray-500 transition-all flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-400">Take Photo</span>
                  </button>
                  <button className="aspect-square bg-gray-600 rounded-lg hover:bg-gray-500 transition-all flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-400">Upload</span>
                  </button>
                  <button className="aspect-square bg-gray-600 rounded-lg hover:bg-gray-500 transition-all flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-400">Receipt</span>
                  </button>
                </div>
              </div>

              {/* Tags and Notes */}
              <div>
                <Label htmlFor="tags" className="text-gray-400">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., electronics, warranty, gift)"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-gray-400">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this item..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              {/* Barcode Scanner */}
              <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm text-blue-300">Quick Add with Barcode</p>
                  <p className="text-xs text-gray-400">Scan product barcode to auto-fill item details</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startBarcodeScanning}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-600/30 text-blue-400"
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  Scan Barcode
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="bg-gray-700 hover:bg-gray-600 border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Add item logic here
                  toast.success('Item added successfully!')
                  setShowAddModal(false)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={() => {
          // Handle file import
          toast.success('Import feature coming soon!')
        }}
        className="hidden"
      />
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
