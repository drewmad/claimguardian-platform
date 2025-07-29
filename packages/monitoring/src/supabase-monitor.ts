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

    // Wrap query methods
    const methods = ['select', 'insert', 'update', 'upsert', 'delete'] as const
    
    methods.forEach(method => {
      const original = queryBuilder[method].bind(queryBuilder)
      
      queryBuilder[method] = function(...args: any[]) {
        queryInfo.operation = method
        queryInfo.startTime = Date.now()
        
        const result = original(...args)
        
        // Monitor the promise
        if (result && typeof result.then === 'function') {
          return result
            .then((response: any) => {
              const duration = Date.now() - queryInfo.startTime
              
              recordDatabaseQuery({
                queryName: `${queryInfo.table}.${queryInfo.operation}`,
                duration,
                rowCount: response.data?.length,
                timestamp: Date.now()
              })
              
              return response
            })
            .catch((error: any) => {
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
    })

    return queryBuilder
  }

  // Monitor RPC calls
  client.rpc = function(fn: string, args?: any, options?: any) {
    const startTime = Date.now()
    
    return originalRpc(fn, args, options)
      .then((response: any) => {
        recordAPICall({
          endpoint: `/rpc/${fn}`,
          method: 'POST',
          statusCode: 200,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        })
        
        return response
      })
      .catch((error: any) => {
        recordAPICall({
          endpoint: `/rpc/${fn}`,
          method: 'POST',
          statusCode: error.status || 500,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        })
        
        throw error
      })
  }

  // Monitor auth operations
  const authMethods = ['signIn', 'signUp', 'signOut', 'resetPasswordForEmail'] as const
  
  authMethods.forEach(method => {
    const original = originalAuth[method].bind(originalAuth)
    
    ;(originalAuth as any)[method] = function(...args: any[]) {
      const startTime = Date.now()
      
      return original(...args)
        .then((response: any) => {
          recordAPICall({
            endpoint: `/auth/${method}`,
            method: 'POST',
            statusCode: 200,
            duration: Date.now() - startTime,
            timestamp: Date.now()
          })
          
          return response
        })
        .catch((error: any) => {
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
  })

  // Monitor storage operations
  if (originalStorage) {
    const storageMethods = ['upload', 'download', 'remove', 'list'] as const
    
    const monitorBucket = (bucket: any) => {
      storageMethods.forEach(method => {
        if (bucket[method]) {
          const original = bucket[method].bind(bucket)
          
          bucket[method] = function(...args: any[]) {
            const startTime = Date.now()
            
            const result = original(...args)
            
            if (result && typeof result.then === 'function') {
              return result
                .then((response: any) => {
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
                .catch((error: any) => {
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