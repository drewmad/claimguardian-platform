/**
 * @fileMetadata
 * @purpose Compliance dashboard for monitoring consent and data compliance
 * @owner compliance-team
 * @status active
 */
'use client'

import { AlertCircle, CheckCircle, Shield, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@claimguardian/ui'
import { getComplianceDashboardData } from '@/actions/compliance-dashboard'

interface ComplianceMetrics {
  totalUsers: number
  consentedUsers: number
  cookieAcceptance: {
    accepted: number
    rejected: number
    custom: number
  }
  ageVerified: number
  gdprConsents: number
  recentSignups: number
  dataRequests: {
    exports: number
    deletions: number
    pending: number
  }
}

interface ConsentRecord {
  id: string
  email: string
  created_at: string
  gdpr_consent: boolean
  terms_accepted: boolean
  privacy_accepted: boolean
  age_verified: boolean
  marketing_consent: boolean
}

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [recentConsents, setRecentConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use server action to fetch compliance data with service role access
      const { metrics, recentConsents, error: fetchError } = await getComplianceDashboardData()

      if (fetchError) {
        setError(fetchError)
        return
      }

      setMetrics(metrics)
      setRecentConsents(recentConsents)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to load compliance data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceScore = () => {
    if (!metrics) return 0
    const consentRate = metrics.totalUsers > 0 
      ? (metrics.consentedUsers / metrics.totalUsers) * 100 
      : 0
    return Math.round(consentRate)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor GDPR, CCPA, and data compliance metrics</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : metrics && (
          <>
            {/* Compliance Score */}
            <Card className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border-blue-500/20">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Overall Compliance Score</p>
                    <p className="text-3xl font-bold text-white mt-1">{getComplianceScore()}%</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Based on consent rate
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    getComplianceScore() >= 80 ? 'bg-green-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <Shield className={`w-8 h-8 ${
                      getComplianceScore() >= 80 ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">GDPR Consents</p>
                      <p className="text-2xl font-bold">{metrics.gdprConsents}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Age Verified</p>
                      <p className="text-2xl font-bold">{metrics.ageVerified}</p>
                    </div>
                    <Shield className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Recent Signups</p>
                      <p className="text-2xl font-bold">{metrics.recentSignups}</p>
                      <p className="text-xs text-gray-500">Last 7 days</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-cyan-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Consents Table */}
            <Card>
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Recent Consent Records</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-sm text-gray-400">Email</th>
                        <th className="text-left py-3 px-4 text-sm text-gray-400">Date</th>
                        <th className="text-center py-3 px-4 text-sm text-gray-400">GDPR</th>
                        <th className="text-center py-3 px-4 text-sm text-gray-400">Terms</th>
                        <th className="text-center py-3 px-4 text-sm text-gray-400">Privacy</th>
                        <th className="text-center py-3 px-4 text-sm text-gray-400">Age</th>
                        <th className="text-center py-3 px-4 text-sm text-gray-400">Marketing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentConsents.map((consent) => (
                        <tr key={consent.id} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-sm">{consent.email}</td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {new Date(consent.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consent.gdpr_consent ? (
                              <CheckCircle className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 inline" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consent.terms_accepted ? (
                              <CheckCircle className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 inline" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consent.privacy_accepted ? (
                              <CheckCircle className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 inline" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consent.age_verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 inline" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consent.marketing_consent ? (
                              <CheckCircle className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Compliance Actions */}
            <Card>
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="btn-outline text-sm py-3">
                    Export Consent Records
                  </button>
                  <button className="btn-outline text-sm py-3">
                    Generate GDPR Report
                  </button>
                  <button className="btn-outline text-sm py-3">
                    View Data Requests
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}