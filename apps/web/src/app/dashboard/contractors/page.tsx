/**
 * @fileMetadata
 * @purpose "Contractors management and directory dashboard"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "contractors", "vendors"]
 * @status stable
 */
'use client'

import { 
  Users, Plus, Star, Phone,
  CheckCircle, DollarSign, FileText, MessageSquare,
  Filter, Search, ChevronRight, Shield, Award, TrendingUp,
  ExternalLink, Share2, Heart
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContractorCategory = 'all' | 'hvac' | 'plumbing' | 'electrical' | 'roofing' | 'general' | 'landscaping' | 'cleaning'
type ContractorStatus = 'active' | 'pending' | 'inactive'

interface Contractor {
  id: string
  name: string
  category: string
  specialties: string[]
  status: ContractorStatus
  rating: number
  reviewCount: number
  phone: string
  email: string
  address: string
  license?: string
  insurance: boolean
  bonded: boolean
  yearsInBusiness: number
  completedJobs: number
  totalSpent: number
  lastJobDate?: string
  notes?: string
  favorite: boolean
}

interface RecentJob {
  id: string
  contractorId: string
  contractorName: string
  description: string
  date: string
  cost: number
  rating?: number
  status: 'completed' | 'in_progress' | 'scheduled'
}

function ContractorsDashboardContent() {
  const router = useRouter() // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedCategory, setSelectedCategory] = useState<ContractorCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock data
  const [contractors] = useState<Contractor[]>([
    {
      id: '1',
      name: 'Cool Air Pros',
      category: 'hvac',
      specialties: ['AC Repair', 'Heating', 'Installation'],
      status: 'active',
      rating: 4.8,
      reviewCount: 24,
      phone: '(555) 123-4567',
      email: 'info@coolairpros.com',
      address: '123 Main St, Miami, FL 33101',
      license: 'CAC1234567',
      insurance: true,
      bonded: true,
      yearsInBusiness: 12,
      completedJobs: 15,
      totalSpent: 3200,
      lastJobDate: '2024-10-15',
      favorite: true
    },
    {
      id: '2',
      name: 'Rapid Plumbing Solutions',
      category: 'plumbing',
      specialties: ['Emergency Repairs', 'Water Heaters', 'Drain Cleaning'],
      status: 'active',
      rating: 4.9,
      reviewCount: 31,
      phone: '(555) 234-5678',
      email: 'service@rapidplumbing.com',
      address: '456 Oak Ave, Fort Lauderdale, FL 33301',
      license: 'CFC1428999',
      insurance: true,
      bonded: true,
      yearsInBusiness: 8,
      completedJobs: 8,
      totalSpent: 1850,
      lastJobDate: '2024-09-20',
      favorite: true
    },
    {
      id: '3',
      name: 'ProClean Services',
      category: 'cleaning',
      specialties: ['Pressure Washing', 'Gutter Cleaning', 'Window Cleaning'],
      status: 'active',
      rating: 4.7,
      reviewCount: 18,
      phone: '(555) 345-6789',
      email: 'hello@proclean.com',
      address: '789 Pine Rd, Boca Raton, FL 33432',
      insurance: true,
      bonded: false,
      yearsInBusiness: 5,
      completedJobs: 12,
      totalSpent: 2400,
      lastJobDate: '2024-11-01',
      favorite: false
    },
    {
      id: '4',
      name: 'Elite Roofing Co',
      category: 'roofing',
      specialties: ['Shingle Repair', 'Tile Roofing', 'Inspections'],
      status: 'pending',
      rating: 4.6,
      reviewCount: 42,
      phone: '(555) 456-7890',
      email: 'quotes@eliteroofing.com',
      address: '321 Elm St, West Palm Beach, FL 33401',
      license: 'CCC1234567',
      insurance: true,
      bonded: true,
      yearsInBusiness: 15,
      completedJobs: 0,
      totalSpent: 0,
      favorite: false
    }
  ])

  const [recentJobs] = useState<RecentJob[]>([
    {
      id: '1',
      contractorId: '1',
      contractorName: 'Cool Air Pros',
      description: 'Annual AC maintenance and filter replacement',
      date: '2024-10-15',
      cost: 150,
      rating: 5,
      status: 'completed'
    },
    {
      id: '2',
      contractorId: '3',
      contractorName: 'ProClean Services',
      description: 'Bi-annual gutter cleaning',
      date: '2024-11-01',
      cost: 200,
      rating: 4,
      status: 'completed'
    },
    {
      id: '3',
      contractorId: '1',
      contractorName: 'Cool Air Pros',
      description: 'AC repair - capacitor replacement',
      date: '2024-08-20',
      cost: 350,
      rating: 5,
      status: 'completed'
    }
  ])

  const categories = [
    { id: 'all', label: 'All', count: contractors.length },
    { id: 'hvac', label: 'HVAC', count: contractors.filter(c => c.category === 'hvac').length },
    { id: 'plumbing', label: 'Plumbing', count: contractors.filter(c => c.category === 'plumbing').length },
    { id: 'electrical', label: 'Electrical', count: contractors.filter(c => c.category === 'electrical').length },
    { id: 'roofing', label: 'Roofing', count: contractors.filter(c => c.category === 'roofing').length },
    { id: 'general', label: 'General', count: contractors.filter(c => c.category === 'general').length },
    { id: 'landscaping', label: 'Landscaping', count: contractors.filter(c => c.category === 'landscaping').length },
    { id: 'cleaning', label: 'Cleaning', count: contractors.filter(c => c.category === 'cleaning').length }
  ]

  const filteredContractors = contractors.filter(contractor => {
    const matchesCategory = selectedCategory === 'all' || contractor.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const totalContractors = contractors.length
  const activeContractors = contractors.filter(c => c.status === 'active').length
  const totalSpent = contractors.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgRating = contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Contractors</h1>
              <p className="text-gray-400">Manage your trusted service providers</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Contractor
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalContractors}</p>
                <p className="text-sm text-gray-400">Contractors</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">Active</span>
                </div>
                <p className="text-2xl font-bold text-white">{activeContractors}</p>
                <p className="text-sm text-gray-400">Verified</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white">${totalSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Spent</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Avg</span>
                </div>
                <p className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-400">Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contractors or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as ContractorCategory)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contractors List */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {filteredContractors.map((contractor) => (
                  <Card key={contractor.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white text-lg">{contractor.name}</h3>
                              {contractor.favorite && (
                                <Heart className="w-4 h-4 text-red-400 fill-current" />
                              )}
                              <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                                {contractor.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2 capitalize">{contractor.category}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {contractor.specialties.map((specialty, index) => (
                                <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold text-white">{contractor.rating}</span>
                            <span className="text-xs text-gray-400">({contractor.reviewCount})</span>
                          </div>
                          <p className="text-sm text-gray-400">{contractor.completedJobs} jobs</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Contact</p>
                          <div className="space-y-1">
                            <a href={`tel:${contractor.phone}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contractor.phone}
                            </a>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Experience</p>
                          <p className="text-white">{contractor.yearsInBusiness} years</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Total Spent</p>
                          <p className="text-white font-medium">${contractor.totalSpent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Credentials</p>
                          <div className="flex gap-1">
                            {contractor.license && <Badge variant="outline" className="text-xs">Licensed</Badge>}
                            {contractor.insurance && <Badge variant="outline" className="text-xs">Insured</Badge>}
                            {contractor.bonded && <Badge variant="outline" className="text-xs">Bonded</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                        <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          View Profile
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Jobs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white text-sm">{job.contractorName}</p>
                            <p className="text-xs text-gray-400">{job.description}</p>
                          </div>
                          <span className="text-sm font-medium text-white">${job.cost}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {new Date(job.date).toLocaleDateString()}
                          </span>
                          {job.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${
                                    i < (job.rating || 0) 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-600'
                                  }`} 
                                />
                              ))}
                            </div>
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
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-white">Request Quotes</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-white">Verify Licenses</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white">Find New Pros</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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

export default function ContractorsPage() {
  return (
    <ProtectedRoute>
      <ContractorsDashboardContent />
    </ProtectedRoute>
  )
}