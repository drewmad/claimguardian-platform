/**
 * @fileMetadata
 * @purpose "Community engagement and neighborhood resources dashboard"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "community", "social"]
 * @status stable
 */
'use client'

import {
  Users, MessageSquare, AlertTriangle, Shield, Calendar,
  MapPin, Phone, Globe, ChevronRight, Bell, ThumbsUp,
  Share2, Heart, TrendingUp, Info, Building,
  Megaphone, ExternalLink, UserPlus, Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PostCategory = 'alert' | 'tip' | 'question' | 'recommendation' | 'event'
type AlertType = 'weather' | 'crime' | 'maintenance' | 'general'

interface CommunityPost {
  id: string
  author: string
  authorAvatar?: string
  category: PostCategory
  title: string
  content: string
  timestamp: string
  likes: number
  replies: number
  hasLiked: boolean
  tags: string[]
}

interface NeighborhoodAlert {
  id: string
  type: AlertType
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  location?: string
  affectedHomes?: number
}

interface LocalResource {
  id: string
  name: string
  category: string
  description: string
  contact: string
  website?: string
  recommended: boolean
}

function CommunityDashboardContent() {
  const router = useRouter() // eslint-disable-line @typescript-eslint/no-unused-vars

  // Mock data
  const [posts] = useState<CommunityPost[]>([
    {
      id: '1',
      author: 'Sarah Johnson',
      category: 'alert',
      title: 'Storm Damage - Tree Down on Oak Street',
      content: 'Large oak tree fell during last night\'s storm. Blocking part of Oak Street near 123. City crews have been notified.',
      timestamp: '2 hours ago',
      likes: 12,
      replies: 5,
      hasLiked: false,
      tags: ['storm-damage', 'oak-street']
    },
    {
      id: '2',
      author: 'Mike Chen',
      category: 'recommendation',
      title: 'Great Roofer - Elite Roofing Co',
      content: 'Just had my roof repaired by Elite Roofing after the hurricane. Professional, fair pricing, and warranty included. Highly recommend!',
      timestamp: '1 day ago',
      likes: 8,
      replies: 3,
      hasLiked: true,
      tags: ['contractor', 'roofing', 'recommendation']
    },
    {
      id: '3',
      author: 'Emily Rodriguez',
      category: 'tip',
      title: 'Hurricane Prep Checklist',
      content: 'With season starting, here\'s my checklist: trim trees, clean gutters, secure outdoor items, stock supplies, review insurance. What am I missing?',
      timestamp: '2 days ago',
      likes: 24,
      replies: 11,
      hasLiked: false,
      tags: ['hurricane-prep', 'tips']
    }
  ])

  const [alerts] = useState<NeighborhoodAlert[]>([
    {
      id: '1',
      type: 'weather',
      title: 'Tropical Storm Watch',
      description: 'Tropical Storm Warning issued for our area. Expected to arrive Thursday evening.',
      severity: 'high',
      timestamp: '30 minutes ago',
      affectedHomes: 450
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'Water Main Work - Elm Street',
      description: 'Scheduled water main maintenance Tuesday 9AM-3PM. Water pressure may be affected.',
      severity: 'medium',
      timestamp: '3 hours ago',
      location: 'Elm Street (100-300 blocks)'
    },
    {
      id: '3',
      type: 'crime',
      title: 'Package Theft Alert',
      description: 'Multiple reports of package thefts in the area. Consider using package lockboxes.',
      severity: 'medium',
      timestamp: '1 day ago',
      affectedHomes: 15
    }
  ])

  const [resources] = useState<LocalResource[]>([
    {
      id: '1',
      name: 'Miami-Dade Emergency Management',
      category: 'Emergency Services',
      description: '24/7 emergency preparedness and response coordination',
      contact: '(305) 468-5900',
      website: 'https://miamidade.gov/emergency',
      recommended: true
    },
    {
      id: '2',
      name: 'Neighborhood Watch Program',
      category: 'Community Safety',
      description: 'Local crime prevention and community safety initiatives',
      contact: 'watch@ourneighborhood.org',
      recommended: true
    }
  ])

  const getCategoryIcon = (category: PostCategory) => {
    switch(category) {
      case 'alert': return AlertTriangle
      case 'tip': return Info
      case 'question': return MessageSquare
      case 'recommendation': return ThumbsUp
      case 'event': return Calendar
      default: return MessageSquare
    }
  }

  const getCategoryColor = (category: PostCategory) => {
    switch(category) {
      case 'alert': return 'text-red-400'
      case 'tip': return 'text-blue-400'
      case 'question': return 'text-purple-400'
      case 'recommendation': return 'text-green-400'
      case 'event': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getAlertSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-red-900/20 border-red-500/30 text-red-300'
      case 'medium': return 'bg-orange-900/20 border-orange-500/30 text-orange-300'
      case 'low': return 'bg-blue-900/20 border-blue-500/30 text-blue-300'
      default: return 'bg-gray-900/20 border-gray-500/30 text-gray-300'
    }
  }

  const totalMembers = 1245
  const activeDiscussions = posts.reduce((sum, post) => sum + post.replies, 0)
  const neighborhoodScore = 4.2

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Community Hub</h1>
              <p className="text-gray-400">Connect with neighbors and local resources</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Subscribe
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                New Post
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Members</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalMembers.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Neighborhood</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">Active</span>
                </div>
                <p className="text-2xl font-bold text-white">{activeDiscussions}</p>
                <p className="text-sm text-gray-400">Discussions</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{neighborhoodScore}</p>
                <p className="text-sm text-gray-400">Safety Score</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-orange-400">Active</span>
                </div>
                <p className="text-2xl font-bold text-white">{alerts.length}</p>
                <p className="text-sm text-gray-400">Alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Active Alerts</h2>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card key={alert.id} className={`border ${getAlertSeverityColor(alert.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'high' ? 'bg-red-600' :
                          alert.severity === 'medium' ? 'bg-orange-600' : 'bg-blue-600'
                        }`}>
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-white">{alert.title}</h3>
                              <p className="text-sm text-gray-300 mt-1">{alert.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>{alert.timestamp}</span>
                                {alert.location && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {alert.location}
                                    </span>
                                  </>
                                )}
                                {alert.affectedHomes && (
                                  <>
                                    <span>•</span>
                                    <span>{alert.affectedHomes} homes affected</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Community Feed */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Community Feed</CardTitle>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts.map((post) => {
                      const Icon = getCategoryIcon(post.category)
                      return (
                        <div key={post.id} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {post.author.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-white">{post.author}</p>
                                    <Icon className={`w-4 h-4 ${getCategoryColor(post.category)}`} />
                                    <Badge variant="outline" className="text-xs">
                                      {post.category}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-white mb-1">{post.title}</h3>
                                  <p className="text-sm text-gray-300">{post.content}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                {post.tags.map((tag, index) => (
                                  <span key={index} className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <button className={`flex items-center gap-1 ${
                                    post.hasLiked ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                                  }`}>
                                    <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                                    <span className="text-sm">{post.likes}</span>
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-sm">{post.replies}</span>
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-sm">Share</span>
                                  </button>
                                </div>
                                <span className="text-xs text-gray-400">{post.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button className="w-full mt-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-gray-300">
                    Load More Posts
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Local Resources */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Local Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white text-sm">{resource.name}</p>
                            <p className="text-xs text-gray-400">{resource.category}</p>
                          </div>
                          {resource.recommended && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 mb-2">{resource.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <a href={`tel:${resource.contact}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                          {resource.website && (
                            <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Get Involved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white">Join Watch Group</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">Report Issue</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-white">Community Events</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-white">HOA Portal</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
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

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityDashboardContent />
    </ProtectedRoute>
  )
}
