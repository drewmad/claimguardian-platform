'use client'

import { 
  Package, Camera, Upload,
  Building, Plus,
  X, Info, Heart, TrendingUp, Receipt, Shield
} from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { CameraCapture } from '@/components/camera/camera-capture'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface DonationItem {
  id: string
  name: string
  description: string
  category: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  quantity: number
  estimatedValue: number
  fairMarketValue: number
  imageUrl?: string
  dateAcquired?: string
  originalPrice?: number
}

interface Charity {
  id: string
  name: string
  ein: string
  category: string
  deductible: boolean
}

export default function DonationAssistantPage() {
  const [items, setItems] = useState<DonationItem[]>([])
  const [currentItem, setCurrentItem] = useState<Partial<DonationItem>>({
    condition: 'good',
    quantity: 1
  })
  const [selectedCharity, setSelectedCharity] = useState<string>('')
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0])
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Clothing & Accessories',
    'Furniture',
    'Electronics',
    'Books & Media',
    'Household Items',
    'Toys & Games',
    'Sports Equipment',
    'Kitchen & Dining',
    'Art & Collectibles',
    'Other'
  ]

  const sampleCharities: Charity[] = [
    { id: '1', name: 'Goodwill Industries', ein: '53-0196517', category: 'General', deductible: true },
    { id: '2', name: 'The Salvation Army', ein: '13-1637695', category: 'General', deductible: true },
    { id: '3', name: 'Habitat for Humanity', ein: '91-1914868', category: 'Housing', deductible: true },
    { id: '4', name: 'American Red Cross', ein: '53-0196605', category: 'Humanitarian', deductible: true },
    { id: '5', name: 'Local Food Bank', ein: '00-0000000', category: 'Food', deductible: true }
  ]

  const calculateFairMarketValue = (item: Partial<DonationItem>) => {
    // Simplified FMV calculation based on condition and category
    const conditionMultiplier = {
      excellent: 0.4,
      good: 0.25,
      fair: 0.15,
      poor: 0.05
    }
    
    const baseValue = item.originalPrice || item.estimatedValue || 0
    const fmv = baseValue * (conditionMultiplier[item.condition as keyof typeof conditionMultiplier] || 0.25)
    
    return Math.round(fmv * 100) / 100
  }

  const handleImageCapture = async (file: File) => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      // Mock AI detection results
      const mockResults = {
        name: 'Winter Coat',
        category: 'Clothing & Accessories',
        estimatedValue: 150,
        condition: 'good' as const
      }
      
      setCurrentItem({
        ...currentItem,
        ...mockResults,
        fairMarketValue: calculateFairMarketValue({ ...currentItem, ...mockResults })
      })
      
      // Convert file to data URL for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentItem(prev => ({ ...prev, imageUrl: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
      
      setIsAnalyzing(false)
      setShowCameraCapture(false)
      toast.success('Item analyzed successfully!')
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageCapture(file)
    }
  }

  const addItem = () => {
    if (!currentItem.name || !currentItem.category) {
      toast.error('Please provide item name and category')
      return
    }
    
    const newItem: DonationItem = {
      id: Date.now().toString(),
      name: currentItem.name,
      description: currentItem.description || '',
      category: currentItem.category,
      condition: currentItem.condition as DonationItem['condition'],
      quantity: currentItem.quantity || 1,
      estimatedValue: currentItem.estimatedValue || 0,
      fairMarketValue: currentItem.fairMarketValue || calculateFairMarketValue(currentItem),
      imageUrl: currentItem.imageUrl,
      dateAcquired: currentItem.dateAcquired,
      originalPrice: currentItem.originalPrice
    }
    
    setItems([...items, newItem])
    setCurrentItem({ condition: 'good', quantity: 1 })
    toast.success('Item added to donation list')
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.fairMarketValue * item.quantity), 0)
  }

  const generateReceipt = () => {
    const charity = sampleCharities.find(c => c.id === selectedCharity)
    if (!charity) {
      toast.error('Please select a charity')
      return
    }
    
    const receiptData = {
      donorName: 'John Doe', // Would come from user profile
      donorAddress: '123 Main St, City, ST 12345',
      charity: charity,
      donationDate: donationDate,
      items: items,
      totalValue: getTotalValue(),
      receiptNumber: `DON-${Date.now()}`,
      taxYear: new Date(donationDate).getFullYear()
    }
    
    // Generate PDF or download JSON
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donation-receipt-${receiptData.receiptNumber}.json`
    a.click()
    
    toast.success('Donation receipt generated!')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/ai-tools" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-lg">
                  <Package className="h-6 w-6 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Donation Assistant</h1>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                  Tax Deductible
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Create tax-deductible donation forms by taking pictures of items. AI estimates Fair Market Value automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Item Form */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Add Donation Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Image Capture */}
                      <div>
                        <Label className="text-white mb-2">Item Photo</Label>
                        <div className="flex gap-3">
                          {currentItem.imageUrl ? (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={currentItem.imageUrl}
                                alt="Item"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => setCurrentItem({ ...currentItem, imageUrl: undefined })}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <Button
                                onClick={() => setShowCameraCapture(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Take Photo
                              </Button>
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="bg-gray-700 hover:bg-gray-600"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                        {isAnalyzing && (
                          <p className="text-sm text-cyan-400 mt-2">AI is analyzing your item...</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Item Name */}
                        <div>
                          <Label htmlFor="itemName" className="text-white">Item Name</Label>
                          <Input
                            id="itemName"
                            value={currentItem.name || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                            placeholder="e.g., Winter Coat"
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <Label htmlFor="category" className="text-white">Category</Label>
                          <Select 
                            value={currentItem.category || ''} 
                            onValueChange={(value) => setCurrentItem({ ...currentItem, category: value })}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Condition */}
                        <div>
                          <Label htmlFor="condition" className="text-white">Condition</Label>
                          <Select 
                            value={currentItem.condition} 
                            onValueChange={(value) => {
                              setCurrentItem({ ...currentItem, condition: value as DonationItem['condition'] })
                              if (currentItem.originalPrice || currentItem.estimatedValue) {
                                setCurrentItem(prev => ({
                                  ...prev,
                                  fairMarketValue: calculateFairMarketValue({ ...prev, condition: value as DonationItem['condition'] })
                                }))
                              }
                            }}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <Label htmlFor="quantity" className="text-white">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={currentItem.quantity || 1}
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        {/* Original Price */}
                        <div>
                          <Label htmlFor="originalPrice" className="text-white">Original Price ($)</Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            step="0.01"
                            value={currentItem.originalPrice || ''}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0
                              setCurrentItem({ 
                                ...currentItem, 
                                originalPrice: price,
                                fairMarketValue: calculateFairMarketValue({ ...currentItem, originalPrice: price })
                              })
                            }}
                            placeholder="Optional"
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>

                        {/* Fair Market Value */}
                        <div>
                          <Label htmlFor="fmv" className="text-white">Fair Market Value ($)</Label>
                          <div className="relative">
                            <Input
                              id="fmv"
                              type="number"
                              step="0.01"
                              value={currentItem.fairMarketValue || ''}
                              onChange={(e) => setCurrentItem({ ...currentItem, fairMarketValue: parseFloat(e.target.value) || 0 })}
                              className="bg-gray-700 border-gray-600"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Badge className="bg-green-600/20 text-green-400 text-xs">
                                AI Estimated
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={currentItem.description || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                          placeholder="Additional details about the item..."
                          className="bg-gray-700 border-gray-600"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={addItem}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!currentItem.name || !currentItem.category}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Donation List
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Charity Selection */}
                <Card className="bg-gray-800 border-gray-700 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Donation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="charity" className="text-white">Select Charity</Label>
                        <Select value={selectedCharity} onValueChange={setSelectedCharity}>
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue placeholder="Choose a charity" />
                          </SelectTrigger>
                          <SelectContent>
                            {sampleCharities.map(charity => (
                              <SelectItem key={charity.id} value={charity.id}>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{charity.name}</span>
                                  <Badge className="text-xs">EIN: {charity.ein}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="donationDate" className="text-white">Donation Date</Label>
                        <Input
                          id="donationDate"
                          type="date"
                          value={donationDate}
                          onChange={(e) => setDonationDate(e.target.value)}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Donation Summary */}
              <div className="space-y-6">
                {/* Items List */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Donation Items</CardTitle>
                      <Badge className="bg-blue-600/20 text-blue-400">
                        {items.length} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No items added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.id} className="p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-start gap-3">
                              {item.imageUrl && (
                                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-white">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className="text-xs bg-gray-600/20">
                                        {item.condition}
                                      </Badge>
                                      <span className="text-xs text-gray-400">
                                        Qty: {item.quantity}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-gray-400 hover:text-red-400"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <p className="text-green-400 font-medium mt-1">
                                  ${(item.fairMarketValue * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Total Value */}
                <Card className="bg-green-900/20 border-green-600/30">
                  <CardHeader>
                    <CardTitle className="text-green-400">Total Deduction Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">${getTotalValue().toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-2">Fair Market Value</p>
                  </CardContent>
                </Card>

                {/* Generate Receipt */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Generate Receipt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={generateReceipt}
                      disabled={items.length === 0 || !selectedCharity}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Generate Tax Receipt
                    </Button>
                    
                    <Alert className="mt-4 bg-blue-900/20 border-blue-600/30">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        Save this receipt for your tax records. Donations over $250 require written acknowledgment from the charity.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Tax Tips */}
                <Card className="bg-purple-900/20 border-purple-600/30">
                  <CardHeader>
                    <CardTitle className="text-purple-400 text-lg">Tax Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">Keep photos and receipts for all donations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">FMV based on thrift store prices</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Heart className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">Only donate to qualified 501(c)(3) organizations</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Camera Capture Modal */}
        {showCameraCapture && (
          <CameraCapture
            onClose={() => setShowCameraCapture(false)}
            onCapture={handleImageCapture}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}