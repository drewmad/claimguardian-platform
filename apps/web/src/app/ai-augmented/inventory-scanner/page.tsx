'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ImageUploadAnalyzer } from '@/components/ai/image-upload-analyzer'
import { Button } from '@/components/ui/button'
import { Card } from '@claimguardian/ui'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const BarcodeScanner = dynamic(
  () => import('@/components/ui/barcode-scanner').then(mod => mod.BarcodeScanner),
  { ssr: false }
)
import { 
  Package,
  DollarSign,
  Home,
  AlertCircle,
  Sparkles,
  Filter,
  ArrowUpDown,
  Camera,
  Save,
  FileSpreadsheet,
  Scan
} from 'lucide-react'
import { AIClientService } from '@/lib/ai/client-service'
import { AI_PROMPTS } from '@/lib/ai/config'
import { useSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  category: string
  room: string
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_price?: number
  estimated_value: number
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor'
  quantity: number
  notes?: string
  high_value: boolean
  requires_appraisal: boolean
  image_ref?: string
}

interface ScanResult {
  items: InventoryItem[]
  total_value: number
  high_value_items: number
  categories: { [key: string]: number }
  rooms: { [key: string]: number }
  recommendations: string[]
}

const CATEGORY_ICONS = {
  electronics: '📱',
  furniture: '🛋️',
  appliances: '🔌',
  jewelry: '💎',
  art: '🖼️',
  clothing: '👔',
  tools: '🔧',
  sports: '⚽',
  books: '📚',
  other: '📦',
}

export default function InventoryScannerPage() {
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini'>('openai')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [editingItems, setEditingItems] = useState<{ [key: string]: InventoryItem }>({})
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'room'>('value')
  const [isSaving, setIsSaving] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [selectedItemForBarcode, setSelectedItemForBarcode] = useState<string | null>(null)
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const aiClient = new AIClientService()

  const scanImages = async (files: File[]) => {
    try {
      const allItems: InventoryItem[] = []
      
      for (let i = 0; i < files.length; i++) {
        toast.loading(`Scanning image ${i + 1} of ${files.length}...`)

        const base64 = await fileToBase64(files[i])
        const prompt = `${AI_PROMPTS.INVENTORY_SCANNER.SYSTEM}

Analyze this image and identify all items visible. For each item, provide details in this JSON format:
{
  "items": [
    {
      "name": "descriptive name",
      "category": "electronics|furniture|appliances|jewelry|art|clothing|tools|sports|books|other",
      "room": "best guess of room location",
      "brand": "if visible",
      "model": "if visible",
      "estimated_value": number in USD,
      "condition": "new|excellent|good|fair|poor",
      "quantity": number,
      "high_value": boolean (true if over $500),
      "requires_appraisal": boolean (true for art, jewelry, antiques)
    }
  ]
}`

        const response = await aiClient.analyzeImage({
          image: base64,
          prompt,
          model: selectedModel,
        })

        try {
          const parsed = JSON.parse(response)
          const itemsWithIds = parsed.items.map((item: Partial<InventoryItem>, idx: number) => ({
            ...item,
            id: `item-${Date.now()}-${i}-${idx}`,
            image_ref: `Image ${i + 1}`,
          }))
          allItems.push(...itemsWithIds)
        } catch {
          console.error('Parse error')
        }
      }

      // Calculate statistics
      const totalValue = allItems.reduce((sum, item) => sum + (item.estimated_value * item.quantity), 0)
      const highValueCount = allItems.filter(item => item.high_value).length
      
      const categories = allItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const rooms = allItems.reduce((acc, item) => {
        acc[item.room] = (acc[item.room] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const recommendations = [
        totalValue > 100000 ? 'Consider increasing your personal property coverage limit' : '',
        highValueCount > 5 ? 'Schedule high-value items separately on your policy' : '',
        allItems.some(i => i.requires_appraisal) ? 'Get professional appraisals for art, jewelry, and antiques' : '',
        'Take individual photos of high-value items with serial numbers visible',
        'Store receipts and appraisals in a fireproof safe or cloud storage',
      ].filter(Boolean)

      const result: ScanResult = {
        items: allItems,
        total_value: totalValue,
        high_value_items: highValueCount,
        categories,
        rooms,
        recommendations,
      }

      setScanResult(result)

      // Log the scan
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_inventory_scan',
        resource_type: 'inventory',
        metadata: {
          model: selectedModel,
          images_scanned: files.length,
          items_found: allItems.length,
          total_value: totalValue,
        },
      })

      toast.success(`Found ${allItems.length} items worth $${totalValue.toLocaleString()}`)
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Failed to scan images')
      throw error
    }
  }

  const saveInventory = async () => {
    if (!scanResult) return

    setIsSaving(true)
    try {
      // Merge edited items
      const finalItems = scanResult.items.map(item => 
        editingItems[item.id] || item
      )

      // TODO: Save to database
      await supabase.from('inventory_items').insert(
        finalItems.map(item => ({
          ...item,
          user_id: user?.id,
          property_id: 'default', // TODO: Get actual property ID
        }))
      )

      toast.success('Inventory saved successfully!')
    } catch {
      toast.error('Failed to save inventory')
    } finally {
      setIsSaving(false)
    }
  }

  const exportToCSV = () => {
    if (!scanResult) return

    const items = scanResult.items.map(item => editingItems[item.id] || item)
    const csv = [
      ['Name', 'Category', 'Room', 'Brand', 'Model', 'Value', 'Quantity', 'Total Value', 'Condition', 'Notes'],
      ...items.map(item => [
        item.name,
        item.category,
        item.room,
        item.brand || '',
        item.model || '',
        item.estimated_value,
        item.quantity,
        item.estimated_value * item.quantity,
        item.condition,
        item.notes || '',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setEditingItems(prev => ({
      ...prev,
      [id]: { ...(prev[id] || scanResult?.items.find(i => i.id === id) || {} as InventoryItem), ...updates }
    }))
  }

  const handleBarcodeScanned = async (code: string, format: string) => {
    toast.info(`Looking up product: ${code}`)
    
    // In a real app, you'd look up the product in a database
    // For now, we'll use the barcode as a serial number
    if (selectedItemForBarcode) {
      updateItem(selectedItemForBarcode, { 
        serial_number: code,
        notes: `Barcode (${format}): ${code}`
      })
      toast.success('Barcode added to item')
    }
    
    // You could also make an API call to get product details
    // For demo purposes, we'll just add the barcode
    setShowBarcodeScanner(false)
    setSelectedItemForBarcode(null)
  }

  const startBarcodeScanner = (itemId: string) => {
    setSelectedItemForBarcode(itemId)
    setShowBarcodeScanner(true)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  // Filter and sort items
  const filteredItems = scanResult?.items
    .map(item => editingItems[item.id] || item)
    .filter(item => {
      if (filterRoom && item.room !== filterRoom) return false
      if (filterCategory && item.category !== filterCategory) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.estimated_value * b.quantity) - (a.estimated_value * a.quantity)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'room':
          return a.room.localeCompare(b.room)
        default:
          return 0
      }
    }) || []

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Package className="h-6 w-6 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">AI Inventory Scanner</h1>
                <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">
                  AI Enhanced
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Automatically catalog your belongings for insurance documentation. Our AI identifies 
                items, estimates values, and helps ensure you have adequate coverage.
              </p>
            </div>

            {/* Model Selection */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="font-semibold text-white">AI Model:</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedModel === 'openai' ? 'default' : 'outline'}
                      onClick={() => setSelectedModel('openai')}
                      className={selectedModel === 'openai' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                    >
                      GPT-4 Vision
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                      onClick={() => setSelectedModel('gemini')}
                      className={selectedModel === 'gemini' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'}
                    >
                      Gemini Vision
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Upload Section */}
          {!scanResult && (
            <ImageUploadAnalyzer
              onAnalyze={scanImages}
              maxFiles={50}
              maxSize={10}
              title="Upload Room Photos"
              description="Take photos of each room showing your belongings. The AI will identify and catalog individual items."
              className="mb-6"
            />
          )}

          {/* Scan Results */}
          {scanResult && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{scanResult.items.length}</p>
                        <p className="text-sm text-gray-400">Total Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">${scanResult.total_value.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-orange-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{scanResult.high_value_items}</p>
                        <p className="text-sm text-gray-400">High Value Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Home className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{Object.keys(scanResult.rooms).length}</p>
                        <p className="text-sm text-gray-400">Rooms Scanned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {scanResult.recommendations.length > 0 && (
                <Alert className="bg-blue-900/20 border-blue-600/30">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription>
                    <p className="font-semibold mb-2 text-blue-300">Insurance Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {scanResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-300">{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Filters and Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={filterRoom}
                        onChange={(e) => setFilterRoom(e.target.value)}
                        className="text-sm bg-gray-700 border-gray-600 text-white rounded px-2 py-1"
                      >
                        <option value="">All Rooms</option>
                        {Object.keys(scanResult.rooms).map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="text-sm bg-gray-700 border-gray-600 text-white rounded px-2 py-1"
                      >
                        <option value="">All Categories</option>
                        {Object.keys(scanResult.categories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'value' | 'name' | 'room')}
                        className="text-sm bg-gray-700 border-gray-600 text-white rounded px-2 py-1"
                      >
                        <option value="value">Sort by Value</option>
                        <option value="name">Sort by Name</option>
                        <option value="room">Sort by Room</option>
                      </select>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={exportToCSV}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={saveInventory} 
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Inventory
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Inventory Items</h2>
                {filteredItems.map((item) => (
                  <Card key={item.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || '📦'}</span>
                            <div>
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                className="font-semibold mb-1 bg-gray-700 border-gray-600 text-white"
                              />
                              <div className="flex gap-2 text-xs">
                                <Badge variant="outline" className="text-gray-300 border-gray-600">{item.category}</Badge>
                                <Badge variant="outline" className="text-gray-300 border-gray-600">{item.room}</Badge>
                                {item.high_value && <Badge className="bg-red-600/20 text-red-300 border-red-600/30">High Value</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Brand/Model</label>
                          <Input
                            value={item.brand || ''}
                            onChange={(e) => updateItem(item.id, { brand: e.target.value })}
                            placeholder="Brand"
                            className="mb-1 bg-gray-700 border-gray-600 text-white"
                          />
                          <Input
                            value={item.model || ''}
                            onChange={(e) => updateItem(item.id, { model: e.target.value })}
                            placeholder="Model"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Value</label>
                          <Input
                            type="number"
                            value={item.estimated_value}
                            onChange={(e) => updateItem(item.id, { estimated_value: parseFloat(e.target.value) || 0 })}
                            className="mb-1 bg-gray-700 border-gray-600 text-white"
                          />
                          <select
                            value={item.condition}
                            onChange={(e) => updateItem(item.id, { condition: e.target.value as 'new' | 'excellent' | 'good' | 'fair' | 'poor' })}
                            className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded px-2 py-1"
                          >
                            <option value="new">New</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Quantity</label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                          <p className="text-sm font-semibold mt-1 text-white">
                            Total: ${(item.estimated_value * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Notes / Serial #</label>
                          <div className="flex gap-1">
                            <Input
                              value={item.notes || ''}
                              onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                              placeholder="Serial #, notes..."
                              className="flex-1 bg-gray-700 border-gray-600 text-white"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startBarcodeScanner(item.id)}
                              title="Scan barcode"
                              className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                            >
                              <Scan className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.image_ref}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  onClick={() => setScanResult(null)} 
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan More Items
                </Button>
              </div>
            </div>
          )}

          {/* Barcode Scanner Modal */}
          {showBarcodeScanner && (
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onClose={() => {
                setShowBarcodeScanner(false)
                setSelectedItemForBarcode(null)
              }}
            />
          )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}