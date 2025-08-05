/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { SupabaseClient } from '@supabase/supabase-js'

import { recordDatabaseQuery, recordAPICall } from './metrics'

interface QueryInfo {
  table: string
  operation: string
  startTime: number
}

export function monitorSupabaseClient(client: SupabaseClient): SupabaseClient {
  // Store original methods
  const originalFrom = client.from.bind(client)
  const originalRpc = client.rpc.bind(client)
  const originalAuth = client.auth
  const originalStorage = client.storage

  // Monitor database queries
  client.from = function(table: string) {
    const queryBuilder = originalFrom(table)
    const queryInfo: QueryInfo = {
      table,
      operation: 'unknown',
      startTime: Date.now()
    }

    // Wrap query methods with type safety
    const methods = ['select', 'insert', 'update', 'upsert', 'delete'] as const
    
    methods.forEach(method => {
      if (queryBuilder[method]) {
        const original = (queryBuilder as unknown)[method].bind(queryBuilder)
        
        ;(queryBuilder as unknown)[method] = function(...args: unknown[]) {
          queryInfo.operation = method
          queryInfo.startTime = Date.now()
          
          const result = original(...args)
          
          // Monitor the promise
          if (result && typeof result.then === 'function') {
            return result
              .then((response: unknown) => {
                const duration = Date.now() - queryInfo.startTime
                
                recordDatabaseQuery({
                  queryName: `${queryInfo.table}.${queryInfo.operation}`,
                  duration,
                  rowCount: response.data?.length,
                  timestamp: Date.now()
                })
                
                return response
              })
              .catch((error: unknown) => {
                const duration = Date.now() - queryInfo.startTime
                
                recordDatabaseQuery({
                  queryName: `${queryInfo.table}.${queryInfo.operation}`,
                  duration,
                  error: error.message,
                  timestamp: Date.now()
                })
                
                throw error
              })
          }
          
          return result
        }
      }
    })

    return queryBuilder
  }

  // Monitor RPC calls
  const originalRpcTyped = originalRpc as unknown
  ;(client as unknown).rpc = function(fn: string, args?: unknown, options?: unknown) {
    const startTime = Date.now()
    
    const queryBuilder = originalRpcTyped(fn, args, options)
    
    // Wrap the execute methods for query builders
    if (queryBuilder && typeof queryBuilder.then === 'function') {
      const originalThen = queryBuilder.then.bind(queryBuilder)
      queryBuilder.then = function(onFulfilled?: unknown, onRejected?: unknown) {
        return originalThen(
          (response: unknown) => {
            recordAPICall({
              endpoint: `/rpc/${fn}`,
              method: 'POST',
              statusCode: 200,
              duration: Date.now() - startTime,
              timestamp: Date.now()
            })
            return onFulfilled ? onFulfilled(response) : response
          },
          (error: unknown) => {
            recordAPICall({
              endpoint: `/rpc/${fn}`,
              method: 'POST',
              statusCode: error.status || 500,
              duration: Date.now() - startTime,
              timestamp: Date.now()
            })
            return onRejected ? onRejected(error) : Promise.reject(error)
          }
        )
      }
    }
    
    return queryBuilder
  }

  // Monitor auth operations with correct method names
  const authMethods = ['signInWithPassword', 'signUp', 'signOut', 'resetPasswordForEmail'] as const
  
  authMethods.forEach(method => {
    if (originalAuth[method]) {
      const original = (originalAuth as unknown)[method].bind(originalAuth)
      
      ;(originalAuth as unknown)[method] = function(...args: unknown[]) {
        const startTime = Date.now()
        
        const result = original(...args)
        
        // Handle both sync and async results
        if (result && typeof result.then === 'function') {
          return result
            .then((response: unknown) => {
              recordAPICall({
                endpoint: `/auth/${method}`,
                method: 'POST',
                statusCode: 200,
                duration: Date.now() - startTime,
                timestamp: Date.now()
              })
              
              return response
            })
            .catch((error: unknown) => {
              recordAPICall({
                endpoint: `/auth/${method}`,
                method: 'POST',
                statusCode: error.status || 500,
                duration: Date.now() - startTime,
                timestamp: Date.now()
              })
              
              throw error
            })
        }
        
        return result
      }
    }
  })

  // Monitor storage operations
  if (originalStorage) {
    const storageMethods = ['upload', 'download', 'remove', 'list'] as const
    
    const monitorBucket = (bucket: unknown) => {
      storageMethods.forEach(method => {
        if (bucket[method]) {
          const original = bucket[method].bind(bucket)
          
          bucket[method] = function(...args: unknown[]) {
            const startTime = Date.now()
            
            const result = original(...args)
            
            if (result && typeof result.then === 'function') {
              return result
                .then((response: unknown) => {
                  recordAPICall({
                    endpoint: `/storage/${method}`,
                    method: method === 'download' ? 'GET' : 'POST',
                    statusCode: 200,
                    duration: Date.now() - startTime,
                    size: response.data?.size,
                    timestamp: Date.now()
                  })
                  
                  return response
                })
                .catch((error: unknown) => {
                  recordAPICall({
                    endpoint: `/storage/${method}`,
                    method: method === 'download' ? 'GET' : 'POST',
                    statusCode: error.status || 500,
                    duration: Date.now() - startTime,
                    timestamp: Date.now()
                  })
                  
                  throw error
                })
            }
            
            return result
          }
        }
      })
      
      return bucket
    }

    const originalFromStorage = originalStorage.from.bind(originalStorage)
    originalStorage.from = function(bucket: string) {
      return monitorBucket(originalFromStorage(bucket))
    }
  }

  return client
}