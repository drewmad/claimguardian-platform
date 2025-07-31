/**
 * @fileMetadata
 * @purpose Error dashboard component for viewing and managing errors
 * @owner monitoring-team
 * @status active
 */
'use client'

import { Card } from '@claimguardian/ui'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, AlertTriangle, Bug, CheckCircle, Clock, Info, RefreshCw, XCircle } from 'lucide-react'
import React, { useEffect, useState, useCallback } from 'react'

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'


interface ErrorLog {
  id: string
  user_id: string
  error_type: string
  error_code?: string
  error_message: string
  error_stack?: string
  context?: Record<string, unknown>
  severity: string
  url?: string
  user_agent?: string
  created_at: string
  resolved_at?: string
  resolution_notes?: string
}

interface ErrorSummary {
  error_type: string
  error_code?: string
  severity: string
  error_count: number
  affected_users: number
  last_occurrence: string
  first_occurrence: string
}

export function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [summary, setSummary] = useState<ErrorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved')
  const supabase = createClient()

  useEffect(() => {
    fetchErrors()
    fetchSummary()
  }, [filter])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'unresolved') {
        query = query.is('resolved_at', null)
      } else if (filter === 'critical') {
        query = query.eq('severity', 'critical')
      }

      const { data, error } = await query

      if (error) throw error
      setErrors(data || [])
    } catch (error) {
      console.error('Failed to fetch errors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('error_summary')
        .select('*')
        .order('error_count', { ascending: false })
        .limit(10)

      if (error) throw error
      setSummary(data || [])
    } catch (error) {
      console.error('Failed to fetch error summary:', error)
    }
  }

  const resolveError = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Resolved via dashboard'
        })
        .eq('id', errorId)

      if (error) throw error
      
      // Refresh the list
      fetchErrors()
    } catch (error) {
      console.error('Failed to resolve error:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Bug className="w-5 h-5 text-gray-500" />
    }
  }

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'auth':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'api':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'database':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'network':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Error Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            All Errors
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'unresolved' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Unresolved
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'critical' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => {
              fetchErrors()
              fetchSummary()
            }}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.slice(0, 4).map((item) => (
          <Card key={`${item.error_type}-${item.error_code}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {item.error_type}
                {item.error_code && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({item.error_code})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{item.error_count}</p>
                  <p className="text-xs text-gray-500">
                    {item.affected_users} users affected
                  </p>
                </div>
                {getSeverityIcon(item.severity)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last: {formatDistanceToNow(new Date(item.last_occurrence), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No errors found
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="border dark:border-gray-700 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getErrorTypeColor(
                              error.error_type
                            )}`}
                          >
                            {error.error_type}
                          </span>
                          {error.error_code && (
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {error.error_code}
                            </code>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{error.error_message}</p>
                        {error.url && (
                          <p className="text-sm text-gray-500 mt-1">
                            URL: {error.url}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="inline w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(error.created_at), {
                            addSuffix: true
                          })}
                        </p>
                      </div>
                    </div>
                    {!error.resolved_at && (
                      <button
                        onClick={() => resolveError(error.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="inline w-4 h-4 mr-1" />
                        Resolve
                      </button>
                    )}
                  </div>
                  {error.error_stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {error.error_stack}
                      </pre>
                    </details>
                  )}
                  {error.context && Object.keys(error.context).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                        View Context
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}