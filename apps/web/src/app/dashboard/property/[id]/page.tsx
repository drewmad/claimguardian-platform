/**
 * @fileMetadata
 * @purpose Individual property detail page with subtabs
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "property", "detail", "page"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Info, Building, Wrench, TreePine, Zap, FileText, Clock,
  MapPin, Shield, CheckCircle, Wind, Award, Plus,
  AlertCircle, Camera, ChevronRight, Edit, ArrowLeft,
  Home, Save, X, Loader2
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getProperty, updateProperty } from '@/actions/properties'

type SubTab = 'detail' | 'home-systems' | 'structures'

function PropertyDetailContent() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('detail')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Property state - will be loaded from Supabase
  const [property, setProperty] = useState<any>(null)

  // Edit form state
  const [editForm, setEditForm] = useState<any>({})

  // Load property data on mount
  useEffect(() => {
    const loadProperty = async () => {
      try {
        // Handle demo property UUID - use mock data directly
        if (propertyId === 'demo-property-uuid') {
          const mockData = {
            id: propertyId,
            name: 'Main Residence',
            address: '1234 Main Street, Austin, TX 78701',
            type: 'Single Family Home',
            value: 450000,
            sqft: 2800,
            yearBuilt: 2010,
            bedrooms: 4,
            bathrooms: 3,
            lotSize: 0.25,
            insurabilityScore: 92,
            image: '🏠'
          }
          setProperty(mockData)
          setEditForm(mockData)
          return
        }

        const { data, error } = await getProperty({ propertyId })
        if (error) throw error
        
        if (data) {
          // Transform database data to display format
          const transformedData = {
            id: data.id,
            name: data.name || 'Unnamed Property',
            address: data.address?.street || '',
            type: data.type || 'Single Family Home',
            value: data.value || 0,
            sqft: data.square_feet || 0,
            yearBuilt: data.year_built || new Date().getFullYear(),
            bedrooms: data.details?.bedrooms || 0,
            bathrooms: data.details?.bathrooms || 0,
            lotSize: data.details?.lot_size || 0,
            insurabilityScore: data.insurability_score || 0,
            image: '🏠'
          }
          setProperty(transformedData)
          setEditForm(transformedData)
        } else {
          // If no property found, use mock data for now
          const mockData = {
            id: propertyId,
            name: 'Main Residence',
            address: '1234 Main Street, Austin, TX 78701',
            type: 'Single Family Home',
            value: 450000,
            sqft: 2800,
            yearBuilt: 2010,
            bedrooms: 4,
            bathrooms: 3,
            lotSize: 0.25,
            insurabilityScore: 92,
            image: '🏠'
          }
          setProperty(mockData)
          setEditForm(mockData)
        }
      } catch (error) {
        console.error('Error loading property:', error)
        toast.error('Failed to load property details')
        // Use mock data as fallback
        const mockData = {
          id: propertyId,
          name: 'Main Residence',
          address: '1234 Main Street, Austin, TX 78701',
          type: 'Single Family Home',
          value: 450000,
          sqft: 2800,
          yearBuilt: 2010,
          bedrooms: 4,
          bathrooms: 3,
          lotSize: 0.25,
          insurabilityScore: 92,
          image: '🏠'
        }
        setProperty(mockData)
        setEditForm(mockData)
      } finally {
        setLoading(false)
      }
    }
    
    loadProperty()
  }, [propertyId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = {
        name: editForm.name,
        address: editForm.address,
        type: editForm.type,
        year_built: editForm.yearBuilt,
        square_feet: editForm.sqft,
        details: {
          bedrooms: editForm.bedrooms,
          bathrooms: editForm.bathrooms,
          lot_size: editForm.lotSize
        }
      }
      
      const { data, error } = await updateProperty({ propertyId, updates })
      
      if (error) throw error
      
      // Update local state with saved data
      setProperty(editForm)
      setIsEditing(false)
      toast.success('Property details updated successfully')
    } catch (error) {
      console.error('Error saving property:', error)
      toast.error('Failed to save property details')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditForm(property)
    setIsEditing(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setActiveSubTab('detail')
  }

  const [systems] = useState([
    {
      id: 1,
      name: 'HVAC System',
      type: 'Central Air',
      brand: 'Carrier',
      model: 'Infinity 19VS',
      installDate: '2020-05-15',
      lastMaintenance: '2024-03-10',
      warrantyExpiration: '2030-05-15',
      status: 'Good',
      efficiency: 'SEER 19',
      value: 8500
    },
    {
      id: 2,
      name: 'Water Heater',
      type: 'Tank',
      brand: 'Rheem',
      model: 'Performance Platinum',
      installDate: '2021-08-20',
      lastMaintenance: '2024-01-15',
      warrantyExpiration: '2031-08-20',
      status: 'Excellent',
      efficiency: '0.95 UEF',
      value: 1200
    },
    {
      id: 3,
      name: 'Electrical Panel',
      type: 'Main Panel',
      brand: 'Square D',
      model: 'QO Load Center',
      installDate: '2019-12-10',
      lastMaintenance: '2023-06-05',
      warrantyExpiration: '2039-12-10',
      status: 'Good',
      efficiency: '200 Amp',
      value: 2500
    }
  ])

  const [structures] = useState([
    {
      id: 1,
      name: 'Architectural Shingle Roof',
      type: 'Roof',
      material: 'GAF Timberline HDZ',
      installDate: '2019-08-20',
      warrantyExpiration: '2044-08-20',
      windRating: 'Class F',
      insuranceScore: 98,
      value: 15000
    },
    {
      id: 2,
      name: 'Impact Windows - Front',
      type: 'Windows',
      material: 'PGT WinGuard Impact',
      installDate: '2021-11-10',
      warrantyExpiration: '2041-11-10',
      windRating: 'Miami-Dade NOA',
      insuranceScore: 100,
      value: 25000
    }
  ])

  const subTabs = [
    { id: 'detail', label: 'Detail', icon: Info },
    { id: 'home-systems', label: 'Home Systems', icon: Wrench },
    { id: 'structures', label: 'Structures', icon: Building }
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading property details...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-gray-400">Property not found</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span>/</span>
            <Home className="w-4 h-4" />
            <span>Properties</span>
            <span>/</span>
            <span className="text-white">{property.name}</span>
          </div>

          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{property.name}</h1>
              <p className="text-gray-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {property.address}
              </p>
            </div>
            {!isEditing && (
              <Button 
                onClick={handleEditClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            )}
          </div>

          {/* Property Header Card */}
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6">
            <div className="h-48 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center text-6xl">
              {property.image}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Value</p>
                  <p className="text-lg font-bold text-cyan-300">${(property.value / 1000).toFixed(0)}k</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm text-white font-medium">{property.type}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Size</p>
                  <p className="text-sm text-white font-medium">{property.sqft.toLocaleString()} sqft</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Built</p>
                  <p className="text-sm text-white font-medium">{property.yearBuilt}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Score</p>
                  <p className="text-sm text-white font-medium">{property.insurabilityScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {subTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as SubTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSubTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sub-tab Content */}
          {activeSubTab === 'detail' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Property Details
                    {isEditing && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={saving}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Property Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Address</Label>
                        <Input
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Property Type</Label>
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                        >
                          <option value="Single Family Home">Single Family Home</option>
                          <option value="Condo">Condo</option>
                          <option value="Townhouse">Townhouse</option>
                          <option value="Multi-Family">Multi-Family</option>
                          <option value="Vacation Home">Vacation Home</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Year Built</Label>
                          <Input
                            type="number"
                            value={editForm.yearBuilt}
                            onChange={(e) => setEditForm({ ...editForm, yearBuilt: parseInt(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Square Footage</Label>
                          <Input
                            type="number"
                            value={editForm.sqft}
                            onChange={(e) => setEditForm({ ...editForm, sqft: parseInt(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Bedrooms</Label>
                          <Input
                            type="number"
                            value={editForm.bedrooms}
                            onChange={(e) => setEditForm({ ...editForm, bedrooms: parseInt(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Bathrooms</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={editForm.bathrooms}
                            onChange={(e) => setEditForm({ ...editForm, bathrooms: parseFloat(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Lot Size (acres)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.lotSize}
                            onChange={(e) => setEditForm({ ...editForm, lotSize: parseFloat(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Property Value</Label>
                          <Input
                            type="number"
                            value={editForm.value}
                            onChange={(e) => setEditForm({ ...editForm, value: parseInt(e.target.value) || 0 })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Property Type</span>
                        <span className="text-white">{property.type}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Year Built</span>
                        <span className="text-white">{property.yearBuilt}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Square Footage</span>
                        <span className="text-white">{property.sqft.toLocaleString()} sqft</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Lot Size</span>
                        <span className="text-white">{property.lotSize} acres</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Bedrooms</span>
                        <span className="text-white">{property.bedrooms}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Bathrooms</span>
                        <span className="text-white">{property.bathrooms}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-cyan-400" />
                        <span>Update Property Photos</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span>View Insurance Documents</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    <button 
                      onClick={handleEditClick}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-3">
                        <Edit className="w-5 h-5 text-green-400" />
                        <span>Edit Property Details</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Property Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Wrench className="w-5 h-5 text-blue-400" />
                    <span className="text-xs text-green-400">All Good</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{systems.length}</p>
                  <p className="text-xs text-gray-400">Systems Tracked</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Building className="w-5 h-5 text-cyan-400" />
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{structures.length}</p>
                  <p className="text-xs text-gray-400">Structures</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-xs text-green-400">35% Saved</span>
                  </div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-xs text-gray-400">Wind Features</p>
                </Card>
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <span className="text-xs text-orange-400">1 Alert</span>
                  </div>
                  <p className="text-2xl font-bold text-white">2</p>
                  <p className="text-xs text-gray-400">Action Items</p>
                </Card>
              </div>
            </div>
          )}

          {activeSubTab === 'home-systems' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Home Systems</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Add System
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {systems.map((system) => (
                  <Card key={system.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-white">{system.name}</h4>
                          <p className="text-sm text-gray-400">{system.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-cyan-300">${(system.value / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-gray-400">Value</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Brand</span>
                          <span className="text-gray-300">{system.brand}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Model</span>
                          <span className="text-gray-300">{system.model}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Efficiency</span>
                          <span className="text-green-300">{system.efficiency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Status</span>
                          <span className={getStatusColor(system.status)}>{system.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Last Service</span>
                          <span className="text-gray-300">{new Date(system.lastMaintenance).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Details</button>
                        <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Service</button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'structures' && (
            <div className="space-y-6">
              {/* Wind Mitigation Summary */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-400" />
                    Wind Mitigation Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-xl p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="font-medium text-white">Impact Windows</p>
                      <p className="text-xs text-gray-400 mt-1">100% Coverage</p>
                    </div>
                    <div className="bg-gray-700 rounded-xl p-4 text-center">
                      <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <p className="font-medium text-white">Reinforced Roof</p>
                      <p className="text-xs text-gray-400 mt-1">Class F Rating</p>
                    </div>
                    <div className="bg-gray-700 rounded-xl p-4 text-center">
                      <Award className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="font-medium text-white">Insurance Discount</p>
                      <p className="text-xs text-green-400 mt-1">35% Savings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Structures List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Building Structures</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Add Structure
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {structures.map((structure) => (
                    <Card key={structure.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-white">{structure.name}</h4>
                            <p className="text-sm text-gray-400">{structure.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-cyan-300">${(structure.value / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-gray-400">Value</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Material</span>
                            <span className="text-gray-300">{structure.material}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Wind Rating</span>
                            <span className="text-green-300">{structure.windRating}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Insurance Score</span>
                            <span className="text-white">{structure.insuranceScore}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Warranty Expires</span>
                            <span className="text-gray-300">{new Date(structure.warrantyExpiration).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Details</button>
                          <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Documents</button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PropertyDetailPage() {
  return (
    <ProtectedRoute>
      <PropertyDetailContent />
    </ProtectedRoute>
  )
}