/**
 * @fileMetadata
 * @purpose "Offline fallback page with cached content and sync features"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["OfflinePage"]
 * @complexity medium
 * @tags ["offline", "pwa", "fallback", "sync"]
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  WifiOff, RefreshCw, Home, FileText, Camera,
  Heart, Bookmark, Clock, CheckCircle, AlertTriangle,
  Smartphone, Monitor, Tablet, ArrowRight, Info
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useOfflineStatus } from '@/hooks/use-pwa'
import { TouchButton } from '@/components/ui/touch-button'
import { TouchCard, TouchCardContent, TouchCardHeader } from '@/components/ui/touch-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CachedItem {
  id: string
  type: 'property' | 'document' | 'photo' | 'report'
  title: string
  subtitle?: string
  timestamp: Date
  size?: string
  thumbnail?: string
}

const offlineFeatures = [
  {
    icon: FileText,
    title: 'View Documents',
    description: 'Access your cached property documents and reports',
    available: true
  },
  {
    icon: Camera,
    title: 'Take Photos',
    description: 'Capture damage photos that will sync when online',
    available: true
  },
  {
    icon: Heart,
    title: 'Favorites',
    description: 'Browse your favorite properties and saved items',
    available: true
  },
  {
    icon: Bookmark,
    title: 'Bookmarks',
    description: 'Access bookmarked content and important documents',
    available: true
  }
]

const limitedFeatures = [
  'AI damage analysis',
  'Real-time property data',
  'Cloud sync',
  'Push notifications',
  'Live chat support'
]

export default function OfflinePage() {
  const { isOnline } = useOfflineStatus()
  const router = useRouter()
  const [cachedItems, setCachedItems] = useState<CachedItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Load cached items from localStorage or IndexedDB
    loadCachedContent()
  }, [])

  useEffect(() => {
    if (isOnline) {
      // Redirect to dashboard when connection is restored
      router.push('/dashboard')
    }
  }, [isOnline, router])

  const loadCachedContent = async () => {
    // Mock cached content - in real app, load from IndexedDB or cache API
    const mockCached: CachedItem[] = [
      {
        id: '1',
        type: 'property',
        title: 'Main Residence',
        subtitle: '123 Palm Street, Miami, FL',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        thumbnail: '/images/property-1.jpg'
      },
      {
        id: '2',
        type: 'document',
        title: 'Insurance Policy',
        subtitle: 'State Farm - Policy #12345',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        size: '2.3 MB'
      },
      {
        id: '3',
        type: 'photo',
        title: 'Roof Damage Photos',
        subtitle: '5 images captured',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        size: '8.7 MB'
      },
      {
        id: '4',
        type: 'report',
        title: 'Property Assessment',
        subtitle: 'Completed analysis report',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        size: '1.4 MB'
      }
    ]

    setCachedItems(mockCached)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Check if we're back online
    if (navigator.onLine && !isOnline) {
      // Trigger a reconnection check
      window.location.reload()
    }

    setTimeout(() => {
      setIsRefreshing(false)
    }, 2000)
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  const getTypeIcon = (type: CachedItem['type']) => {
    switch (type) {
      case 'property': return Home
      case 'document': return FileText
      case 'photo': return Camera
      case 'report': return FileText
      default: return FileText
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            You're Offline
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Don't worry! You can still access your cached content and create new records.
          </p>

          <TouchButton
            onClick={handleRefresh}
            loading={isRefreshing}
            loadingText="Checking connection..."
            variant="outline"
            className="mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </TouchButton>
        </motion.div>

        {/* Available Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                Available Offline
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These features work without an internet connection
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offlineFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cached Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Cached Content
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your recently accessed items are available offline
              </p>
            </CardHeader>
            <CardContent>
              {cachedItems.length > 0 ? (
                <div className="space-y-3">
                  {cachedItems.map((item) => {
                    const Icon = getTypeIcon(item.type)
                    return (
                      <TouchCard
                        key={item.id}
                        variant="outlined"
                        interactive="hover"
                        className="cursor-pointer"
                        onTap={() => {
                          // Handle cached item access
                          console.log('Accessing cached item:', item.id)
                        }}
                      >
                        <TouchCardContent className="flex items-center gap-4 p-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            {item.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(item.timestamp)}
                              </span>
                              {item.size && <span>{item.size}</span>}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </TouchCardContent>
                      </TouchCard>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No cached content available</p>
                  <p className="text-sm">Visit pages while online to cache them for offline access</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Limited Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                Limited While Offline
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These features require an internet connection
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {limitedFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Device-specific Tips */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info className="w-5 h-5" />
                Offline Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Mobile Users</p>
                    <p>Enable airplane mode briefly, then turn it off to reset your connection</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Monitor className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Desktop Users</p>
                    <p>Check your WiFi connection or try refreshing the page</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tablet className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">All Devices</p>
                    <p>Your work is saved locally and will sync automatically when you're back online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
