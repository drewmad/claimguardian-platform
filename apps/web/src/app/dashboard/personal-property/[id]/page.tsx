/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Personal property item detail page with edit/photo/delete functionality"
 * @dependencies ["react", "next", "lucide-react", "sonner"]
 * @status stable
 * @ai-integration none
 * @insurance-context personal-property
 * @supabase-integration none
 */
'use client'

import { 
  ArrowLeft, Camera, Edit2, Trash2, Save, X, 
  DollarSign, Calendar, Shield, Tag, Package,
  Upload, Image as ImageIcon, Loader2, CheckCircle,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useNavigateToParent } from '@/lib/utils/navigation'

interface PersonalPropertyItem {
  id: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice: number
  currentValue: number
  location: string
  description?: string
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor'
  insured: boolean
  warrantyExpiry?: string
  photos: string[]
  receipts: string[]
  tags: string[]
  lastUpdated: string
}

// Mock data for demonstration
const mockItems: Record<string, PersonalPropertyItem> = {
  '1': {
    id: '1',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    subcategory: 'Computers',
    brand: 'Apple',
    model: 'A2141',
    serialNumber: 'C02ZR0AAMD6T',
    purchaseDate: '2023-03-15',
    purchasePrice: 2499,
    currentValue: 2200,
    location: 'Home Office',
    description: 'Work laptop with AppleCare+ coverage',
    condition: 'excellent',
    insured: true,
    warrantyExpiry: '2026-03-15',
    photos: ['/api/placeholder/400/300'],
    receipts: ['receipt-001.pdf'],
    tags: ['work', 'electronics', 'high-value'],
    lastUpdated: '2024-11-20'
  },
  '2': {
    id: '2',
    name: 'Diamond Engagement Ring',
    category: 'Jewelry',
    subcategory: 'Rings',
    brand: 'Tiffany & Co.',
    purchaseDate: '2022-06-10',
    purchasePrice: 8500,
    currentValue: 9200,
    location: 'Master Bedroom Safe',
    description: '1.5 carat solitaire diamond ring, platinum band',
    condition: 'excellent',
    insured: true,
    photos: ['/api/placeholder/400/300'],
    receipts: ['tiffany-receipt.pdf', 'appraisal-2024.pdf'],
    tags: ['jewelry', 'high-value', 'safe'],
    lastUpdated: '2024-10-15'
  }
}

function PersonalPropertyDetailContent() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string
  const { navigateToParent, getParentInfo } = useNavigateToParent('personalPropertyItem')
  
  const [item, setItem] = useState<PersonalPropertyItem>(() => {
    return mockItems[itemId] || mockItems['1']
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<PersonalPropertyItem>({ ...item })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingChanges, setSavingChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setSavingChanges(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setItem(editForm)
    setIsEditing(false)
    setSavingChanges(false)
    toast.success('Item details updated successfully')
  }

  const handleCancel = () => {
    setEditForm({ ...item })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Item deleted successfully')
    navigateToParent()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Add mock photo URLs
    const newPhotos = Array.from(files).map((_, index) => 
      `/api/placeholder/400/300?photo=${item.photos.length + index + 1}`
    )
    
    setItem(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }))
    
    setEditForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }))
    
    setUploadingPhoto(false)
    setShowPhotoUpload(false)
    toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully`)
  }

  const handleRemovePhoto = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-600'
      case 'excellent': return 'bg-blue-600'
      case 'good': return 'bg-yellow-600'
      case 'fair': return 'bg-orange-600'
      case 'poor': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const valueChange = item.currentValue - item.purchasePrice
  const valueChangePercent = (valueChange / item.purchasePrice) * 100

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={navigateToParent}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {getParentInfo().parentLabel}
              </Button>
            </div>
            
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={savingChanges}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={savingChanges}
                    className="gap-2"
                  >
                    {savingChanges ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing ? (
                    <>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          {item.subcategory && (
                            <Badge variant="secondary">{item.subcategory}</Badge>
                          )}
                          <Badge className={getConditionColor(item.condition)}>
                            {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} Condition
                          </Badge>
                          {item.insured && (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                              <Shield className="w-3 h-3 mr-1" />
                              Insured
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {item.brand && (
                          <div>
                            <p className="text-sm text-gray-400">Brand</p>
                            <p className="text-white">{item.brand}</p>
                          </div>
                        )}
                        {item.model && (
                          <div>
                            <p className="text-sm text-gray-400">Model</p>
                            <p className="text-white">{item.model}</p>
                          </div>
                        )}
                        {item.serialNumber && (
                          <div>
                            <p className="text-sm text-gray-400">Serial Number</p>
                            <p className="text-white font-mono">{item.serialNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-white">{item.location}</p>
                        </div>
                      </div>

                      {item.description && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Description</p>
                          <p className="text-white">{item.description}</p>
                        </div>
                      )}

                      {item.tags.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                          >
                            <SelectTrigger id="category" className="bg-gray-700 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Jewelry">Jewelry</SelectItem>
                              <SelectItem value="Furniture">Furniture</SelectItem>
                              <SelectItem value="Appliances">Appliances</SelectItem>
                              <SelectItem value="Art">Art</SelectItem>
                              <SelectItem value="Sports">Sports Equipment</SelectItem>
                              <SelectItem value="Tools">Tools</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="condition">Condition</Label>
                          <Select
                            value={editForm.condition}
                            onValueChange={(value) => setEditForm({ ...editForm, condition: value as any })}
                          >
                            <SelectTrigger id="condition" className="bg-gray-700 border-gray-600">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="brand">Brand</Label>
                          <Input
                            id="brand"
                            value={editForm.brand || ''}
                            onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={editForm.model || ''}
                            onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="serialNumber">Serial Number</Label>
                          <Input
                            id="serialNumber"
                            value={editForm.serialNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                            className="bg-gray-700 border-gray-600"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="bg-gray-700 border-gray-600"
                          rows={3}
                          placeholder="Optional notes about this item"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Photos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Photos</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPhotoUpload(true)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Add Photos
                  </Button>
                </CardHeader>
                <CardContent>
                  {item.photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {item.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`${item.name} photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {isEditing && (
                            <button
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No photos added yet</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPhotoUpload(true)}
                        className="mt-2"
                      >
                        Upload Photos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Value Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Value Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-400">Purchase Price</p>
                        <p className="text-2xl font-bold text-white">
                          ${item.purchasePrice.toLocaleString()}
                        </p>
                        {item.purchaseDate && (
                          <p className="text-xs text-gray-500">
                            Purchased {new Date(item.purchaseDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Current Value</p>
                        <p className="text-2xl font-bold text-white">
                          ${item.currentValue.toLocaleString()}
                        </p>
                        <div className={`flex items-center gap-1 text-sm ${valueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {valueChange >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          <span>
                            {valueChange >= 0 ? '+' : ''}{valueChangePercent.toFixed(1)}% 
                            (${Math.abs(valueChange).toLocaleString()})
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          value={editForm.purchasePrice}
                          onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div>
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={editForm.purchaseDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div>
                        <Label htmlFor="currentValue">Current Value</Label>
                        <Input
                          id="currentValue"
                          type="number"
                          value={editForm.currentValue}
                          onChange={(e) => setEditForm({ ...editForm, currentValue: parseFloat(e.target.value) || 0 })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Insurance & Warranty */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Insurance Coverage</span>
                    {!isEditing ? (
                      <Badge className={item.insured ? 'bg-green-600' : 'bg-gray-600'}>
                        {item.insured ? 'Insured' : 'Not Insured'}
                      </Badge>
                    ) : (
                      <input
                        type="checkbox"
                        checked={editForm.insured}
                        onChange={(e) => setEditForm({ ...editForm, insured: e.target.checked })}
                        className="w-4 h-4"
                      />
                    )}
                  </div>

                  {item.warrantyExpiry && (
                    <div>
                      <p className="text-sm text-gray-400">Warranty Expires</p>
                      <p className="text-white">
                        {new Date(item.warrantyExpiry).toLocaleDateString()}
                      </p>
                      {new Date(item.warrantyExpiry) > new Date() ? (
                        <Badge className="mt-1 bg-green-600/20 text-green-400 border-green-600/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="mt-1 bg-red-600/20 text-red-400 border-red-600/30">
                          Expired
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => toast.info('Receipt upload coming soon!')}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Receipt
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => toast.info('Insurance claim feature coming soon!')}
                  >
                    <Shield className="w-4 h-4" />
                    File Insurance Claim
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => toast.info('Export feature coming soon!')}
                  >
                    <Package className="w-4 h-4" />
                    Export Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {uploadingPhoto ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                  <p className="text-gray-400">Uploading photos...</p>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">Drop photos here or click to browse</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    Select Photos
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default function PersonalPropertyDetailPage() {
  return (
    <ProtectedRoute>
      <PersonalPropertyDetailContent />
    </ProtectedRoute>
  )
}