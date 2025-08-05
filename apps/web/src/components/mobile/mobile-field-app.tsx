/**
 * @fileMetadata
 * @purpose "Mobile-optimized field documentation app with permission-based access"
 * @dependencies ["@/actions","@/components","@/lib","react"]
 * @owner mobile-team
 * @status stable
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Camera, MapPin, Save, Upload, Clock, Wifi, WifiOff, Battery, Signal, Home, Shield, FileText, Image, Users, Lock, Crown, TrendingUp, Zap, X, Plus, Eye } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { UserTier } from '@/lib/permissions/permission-checker'
import { getUserTierInfo, getUserUsageStats } from '@/actions/user-tiers'
interface FieldDocumentation {
  id: string
  type: 'damage' | 'inspection' | 'inventory' | 'maintenance'
  title: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  media: {
    type: 'photo' | 'video' | 'audio'
    url: string
    thumbnail?: string
    duration?: number
    size: number
  }[]
  metadata: {
    timestamp: Date
    weather?: string
    temperature?: number
    deviceInfo: string
    inspector: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'syncing' | 'synced' | 'failed'
  propertyId?: string
  claimId?: string
  tags: string[]
}

interface MobileAppState {
  isOnline: boolean
  battery: number
  gpsEnabled: boolean
  cameraPermission: boolean
  microphonePermission: boolean
  storageUsed: number
  syncQueue: FieldDocumentation[]
  currentDoc?: FieldDocumentation
}

interface UserLimits {
  aiRequestsThisMonth: number
  storageUsedMB: number
  propertiesCount: number
  claimsCount: number
  tier: UserTier
  limits: {
    aiRequests: number
    storage: number
    properties: number
    claims: number
  }
}

export function MobileFieldApp() {
  const { user } = useAuth()
  const [appState, setAppState] = useState<MobileAppState>({
    isOnline: navigator.onLine,
    battery: 100,
    gpsEnabled: false,
    cameraPermission: false,
    microphonePermission: false,
    storageUsed: 0,
    syncQueue: [],
    currentDoc: undefined
  })
  
  const [docs, setDocs] = useState<FieldDocumentation[]>([])
  const [activeDoc, setActiveDoc] = useState<FieldDocumentation | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [showNewDocForm, setShowNewDocForm] = useState(false)
  const [newDocType, setNewDocType] = useState<'damage' | 'inspection' | 'inventory' | 'maintenance'>('damage')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    initializeApp()
    setupEventListeners()
    
    return () => {
      cleanupEventListeners()
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadUserLimits()
    }
  }, [user])

  const initializeApp = async () => {
    try {
      // Check permissions
      const cameraPermission = await checkPermission('camera')
      const micPermission = await checkPermission('microphone')
      const gpsPermission = await checkPermission('geolocation')
      
      // Get battery info
      const batteryInfo = await getBatteryInfo()
      
      // Load stored documentation
      const storedDocs = loadStoredDocs()
      
      setAppState(prev => ({
        ...prev,
        cameraPermission,
        microphonePermission: micPermission,
        gpsEnabled: gpsPermission,
        battery: batteryInfo,
        syncQueue: storedDocs.filter(doc => doc.status === 'syncing')
      }))
      
      setDocs(storedDocs)
    } catch (error) {
      console.error('Failed to initialize mobile app:', error)
    }
  }

  const loadUserLimits = async () => {
    if (!user) return

    try {
      const [tierResult, usageResult] = await Promise.all([
        getUserTierInfo(user.id),
        getUserUsageStats(user.id)
      ])

      if (tierResult.data && usageResult.data) {
        const tierData = tierResult.data.user_tiers
        setUserLimits({
          aiRequestsThisMonth: usageResult.data.aiRequestsThisMonth,
          storageUsedMB: usageResult.data.storageUsedMB,
          propertiesCount: usageResult.data.propertiesCount,
          claimsCount: usageResult.data.claimsCount,
          tier: tierResult.data.tier as UserTier,
          limits: {
            aiRequests: tierData?.ai_requests_limit || 100,
            storage: tierData?.storage_limit_mb || 100,
            properties: tierData?.properties_limit || 3,
            claims: tierData?.claims_limit || 5
          }
        })
      }
    } catch (error) {
      console.error('Failed to load user limits:', error)
    }
  }

  const checkPermission = async (type: 'camera' | 'microphone' | 'geolocation'): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: type as PermissionName })
      return result.state === 'granted'
    } catch {
      return false
    }
  }

  const getBatteryInfo = async (): Promise<number> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as unknown).getBattery()
        return Math.round(battery.level * 100)
      }
    } catch {
      // Battery API not supported
    }
    return 100
  }

  const loadStoredDocs = (): FieldDocumentation[] => {
    try {
      const stored = localStorage.getItem('claimguardian-field-docs')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const setupEventListeners = () => {
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
  }

  const cleanupEventListeners = () => {
    window.removeEventListener('online', handleOnlineStatus)
    window.removeEventListener('offline', handleOnlineStatus)
  }

  const handleOnlineStatus = () => {
    const isOnline = navigator.onLine
    setAppState(prev => ({ ...prev, isOnline }))
    
    if (isOnline && appState.syncQueue.length > 0) {
      syncPendingDocuments()
    }
  }

  const syncPendingDocuments = async () => {
    for (const doc of appState.syncQueue) {
      try {
        await syncDocumentToServer(doc)
        
        setAppState(prev => ({
          ...prev,
          syncQueue: prev.syncQueue.filter(d => d.id !== doc.id)
        }))
        
        setDocs(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'synced' } : d
        ))
      } catch (error) {
        console.error('Failed to sync document:', doc.id, error)
        
        setDocs(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'failed' } : d
        ))
      }
    }
  }

  const syncDocumentToServer = async (doc: FieldDocumentation) => {
    // Sync document to Supabase in production
    try {
      const supabase = createClient()
      
      // Create field documentation record
      const { data, error } = await supabase
        .from('field_documentation')
        .insert({
          user_id: user?.id,
          type: doc.type,
          title: doc.title,
          description: doc.description,
          location: doc.location,
          metadata: doc.metadata,
          priority: doc.priority,
          property_id: doc.propertyId,
          claim_id: doc.claimId,
          tags: doc.tags,
          media_count: doc.media.length,
          status: 'synced'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Upload media files if any
      if (doc.media.length > 0) {
        for (const media of doc.media) {
          const file = await fetch(media.url).then(r => r.blob())
          const fileName = `${data.id}/${Date.now()}-${media.type}.jpg`
          
          const { error: uploadError } = await supabase.storage
            .from('field-documentation')
            .upload(fileName, file)
          
          if (uploadError) {
            console.warn('Failed to upload media:', uploadError)
          }
        }
      }
      
      return data
    } catch (error) {
      console.error('Failed to sync to server:', error)
      throw error
    }
  }

  const startDocumentation = async (type: 'damage' | 'inspection' | 'inventory' | 'maintenance') => {
    if (!user || !userLimits) return

    // Check permissions
    const requiredPermissions = {
      damage: ['access_damage_analyzer', 'upload_documents'],
      inspection: ['create_properties', 'upload_documents'],
      inventory: ['access_inventory_scanner', 'upload_documents'],
      maintenance: ['create_properties', 'upload_documents']
    }

    // Simplified permission check for now - full async check would be done on server
    const canAccess = userLimits.tier !== 'free' || type === 'damage'

    if (!canAccess) {
      alert(`Your ${userLimits.tier} plan doesn't include access to ${type} documentation. Please upgrade your plan.`)
      return
    }

    // Check storage limits
    if (userLimits.storageUsedMB >= userLimits.limits.storage) {
      alert(`Storage limit reached (${userLimits.limits.storage}MB). Please upgrade or free up space.`)
      return
    }

    const newDoc: FieldDocumentation = {
      id: `doc_${Date.now()}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Documentation`,
      description: '',
      location: {
        lat: 0,
        lng: 0,
        address: 'Getting location...'
      },
      media: [],
      metadata: {
        timestamp: new Date(),
        deviceInfo: navigator.userAgent,
        inspector: user.email || 'Unknown'
      },
      priority: 'medium',
      status: 'draft',
      tags: []
    }

    // Get current location if permission granted
    if (appState.gpsEnabled) {
      try {
        const position = await getCurrentPosition()
        newDoc.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: 'Resolving address...'
        }
      } catch (error) {
        console.error('Failed to get location:', error)
      }
    }

    setActiveDoc(newDoc)
    setShowNewDocForm(false)
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })
  }

  const capturePhoto = async () => {
    if (!activeDoc) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Failed to access camera:', error)
      alert('Camera access denied. Please enable camera permissions.')
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !activeDoc) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    ctx?.drawImage(videoRef.current, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const newMedia = {
          type: 'photo' as const,
          url,
          size: blob.size
        }
        
        setActiveDoc(prev => prev ? {
          ...prev,
          media: [...prev.media, newMedia]
        } : null)
      }
    }, 'image/jpeg', 0.9)

    // Stop camera stream
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
  }

  const saveDocumentation = () => {
    if (!activeDoc) return

    const finalDoc = {
      ...activeDoc,
      status: appState.isOnline ? 'syncing' : 'draft'
    } as FieldDocumentation

    const updatedDocs = [...docs, finalDoc]
    setDocs(updatedDocs)
    
    // Save to localStorage
    localStorage.setItem('claimguardian-field-docs', JSON.stringify(updatedDocs))
    
    if (appState.isOnline) {
      setAppState(prev => ({
        ...prev,
        syncQueue: [...prev.syncQueue, finalDoc]
      }))
      
      syncDocumentToServer(finalDoc)
    }

    setActiveDoc(null)
  }

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case 'free': return <Users className="h-4 w-4" />
      case 'renter': return <Home className="h-4 w-4" />
      case 'essential': return <Zap className="h-4 w-4" />
      case 'plus': return <TrendingUp className="h-4 w-4" />
      case 'pro': return <Crown className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'free': return 'border-gray-500 text-gray-500'
      case 'renter': return 'border-blue-500 text-blue-500'
      case 'essential': return 'border-green-500 text-green-500'
      case 'plus': return 'border-purple-500 text-purple-500'
      case 'pro': return 'border-yellow-500 text-yellow-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'damage': return <Shield className="h-5 w-5" />
      case 'inspection': return <Eye className="h-5 w-5" />
      case 'inventory': return <FileText className="h-5 w-5" />
      case 'maintenance': return <Home className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-500'
      case 'syncing': return 'text-blue-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Status Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {appState.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Signal className="h-4 w-4 text-gray-400" />
          </div>
          <span>ClaimGuardian Field</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{appState.battery}%</span>
          <Battery className={`h-4 w-4 ${appState.battery > 20 ? 'text-green-500' : 'text-red-500'}`} />
        </div>
      </div>

      {/* Header with User Info */}
      {userLimits && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTierColor(userLimits.tier)}>
                <div className="flex items-center gap-1">
                  {getTierIcon(userLimits.tier)}
                  <span className="capitalize">{userLimits.tier}</span>
                </div>
              </Badge>
              <span className="text-sm text-gray-400">Field Documentation</span>
            </div>
            <div className="text-sm text-gray-400">
              {appState.syncQueue.length} pending sync
            </div>
          </div>
          
          {/* Quick Limits Overview */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Storage:</span>
              <span>{userLimits.storageUsedMB}/{userLimits.limits.storage}MB</span>
            </div>
            <div className="flex justify-between">
              <span>AI Requests:</span>
              <span>{userLimits.aiRequestsThisMonth}/{userLimits.limits.aiRequests}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Documentation Form */}
      {activeDoc && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {getDocumentIcon(activeDoc.type)}
              {activeDoc.title}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setActiveDoc(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={activeDoc.description}
                  onChange={(e) => setActiveDoc(prev => prev ? {
                    ...prev,
                    description: e.target.value
                  } : null)}
                  placeholder="Describe what you're documenting..."
                  className="bg-gray-900 border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{activeDoc.location.address}</span>
                </div>
              </div>

              {/* Camera View */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Photo Documentation</label>
                <div className="bg-gray-900 rounded-lg p-4">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg mb-2"
                    style={{ display: videoRef.current?.srcObject ? 'block' : 'none' }}
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={capturePhoto} 
                      size="sm" 
                      className="flex-1"
                      disabled={!appState.cameraPermission}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {appState.cameraPermission ? 'Start Camera' : 'Camera Disabled'}
                    </Button>
                    {videoRef.current?.srcObject && (
                      <Button onClick={captureFrame} size="sm" variant="outline">
                        <Camera className="h-4 w-4 mr-1" />
                        Capture
                      </Button>
                    )}
                  </div>
                  
                  {!appState.cameraPermission && (
                    <div className="mt-2 p-2 bg-yellow-900/50 rounded text-xs text-yellow-400">
                      Camera permission required for photo documentation
                    </div>
                  )}
                </div>
              </div>

              {/* Media Preview */}
              {activeDoc.media.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Captured Media ({activeDoc.media.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {activeDoc.media.map((media, index) => (
                      <div key={index} className="relative">
                        <img
                          src={media.url}
                          alt={`Capture ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <div className="absolute top-1 right-1">
                          <Badge variant="secondary" className="text-xs">
                            {media.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={saveDocumentation} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Documentation Selection */}
      {showNewDocForm && (
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold">New Field Documentation</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'damage', icon: Shield, label: 'Damage Assessment', permission: 'access_damage_analyzer' },
              { type: 'inspection', icon: Eye, label: 'Property Inspection', permission: 'create_properties' },
              { type: 'inventory', icon: FileText, label: 'Inventory Scan', permission: 'access_inventory_scanner' },
              { type: 'maintenance', icon: Home, label: 'Maintenance Log', permission: 'create_properties' }
            ].map(({ type, icon: Icon, label, permission }) => {
              const canAccess = userLimits ? (userLimits.tier !== 'free' || type === 'damage') : false
              
              return (
                <Card 
                  key={type}
                  className={`cursor-pointer transition-colors ${
                    canAccess 
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                      : 'bg-gray-900 border-gray-800 opacity-50'
                  }`}
                  onClick={() => canAccess && startDocumentation(type as 'damage' | 'inspection' | 'inventory' | 'maintenance')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-3 rounded-lg ${canAccess ? 'bg-blue-600/20' : 'bg-gray-700'}`}>
                        <Icon className={`h-6 w-6 ${canAccess ? 'text-blue-400' : 'text-gray-500'}`} />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                      {!canAccess && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Lock className="h-3 w-3" />
                          <span>Upgrade Required</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowNewDocForm(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Documentation List */}
      {!activeDoc && !showNewDocForm && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Field Documentation</h2>
            <Button onClick={() => setShowNewDocForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          {docs.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Documentation Yet</h3>
                <p className="text-gray-400 mb-4">
                  Start documenting property damage, inspections, or maintenance in the field.
                </p>
                <Button onClick={() => setShowNewDocForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Documentation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <Card key={doc.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(doc.type)}
                        <span className="font-medium">{doc.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2">{doc.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{doc.metadata.timestamp.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        <span>{doc.media.length} files</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}