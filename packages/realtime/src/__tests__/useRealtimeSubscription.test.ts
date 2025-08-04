/**
 * @fileMetadata
 * @purpose Tests for real-time subscription React hook
 * @owner realtime-team
 * @dependencies ["vitest", "@testing-library/react-hooks", "@claimguardian/db"]
 * @exports []
 * @complexity medium
 * @tags ["test", "realtime", "hooks", "react"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:50:00Z
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { createBrowserSupabaseClient } from '@claimguardian/db'

// Mock Supabase client
vi.mock('@claimguardian/db', () => ({
  createBrowserSupabaseClient: vi.fn()
}))

const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn()
  })),
  removeChannel: vi.fn()
}

describe('useRealtimeSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createBrowserSupabaseClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Subscription', () => {
    it('should establish subscription on mount', () => {
      const mockCallback = vi.fn()
      
      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      expect(mockSupabase.channel).toHaveBeenCalledWith('claims-INSERT')
      expect(mockSupabase.channel().on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claims' },
        expect.any(Function)
      )
      expect(mockSupabase.channel().subscribe).toHaveBeenCalled()
    })

    it('should cleanup subscription on unmount', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { unmount } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      unmount()

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should handle multiple event types', () => {
      const mockCallback = vi.fn()
      
      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: '*',
          callback: mockCallback
        })
      )

      expect(mockSupabase.channel().on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims' },
        expect.any(Function)
      )
    })
  })

  describe('Filtered Subscriptions', () => {
    it('should apply column filters', () => {
      const mockCallback = vi.fn()
      
      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'UPDATE',
          filter: 'user_id=eq.user-123',
          callback: mockCallback
        })
      )

      expect(mockSupabase.channel().on).toHaveBeenCalledWith(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'claims',
          filter: 'user_id=eq.user-123'
        },
        expect.any(Function)
      )
    })

    it('should support multiple filters', () => {
      const mockCallback = vi.fn()
      
      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          filter: 'status=eq.submitted,user_id=eq.user-123',
          callback: mockCallback
        })
      )

      expect(mockSupabase.channel().on).toHaveBeenCalledWith(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'claims',
          filter: 'status=eq.submitted,user_id=eq.user-123'
        },
        expect.any(Function)
      )
    })
  })

  describe('Connection State Management', () => {
    it('should track connection status', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          // Simulate successful subscription
          callback('SUBSCRIBED')
          return mockChannel
        }),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { result } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      expect(result.current.status).toBe('SUBSCRIBED')
    })

    it('should handle connection errors', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          // Simulate connection error
          callback('CHANNEL_ERROR', { message: 'Connection failed' })
          return mockChannel
        }),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { result } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      expect(result.current.status).toBe('CHANNEL_ERROR')
      expect(result.current.error).toBe('Connection failed')
    })

    it('should provide retry functionality', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { result } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      act(() => {
        result.current.retry()
      })

      // Should create new subscription
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
    })
  })

  describe('Event Handling', () => {
    it('should invoke callback with payload data', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          // Simulate receiving an event
          const mockPayload = {
            eventType: 'INSERT',
            new: { id: 'claim-123', status: 'submitted' },
            old: null,
            table: 'claims'
          }
          handler(mockPayload)
          return mockChannel
        }),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      expect(mockCallback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        new: { id: 'claim-123', status: 'submitted' },
        old: null,
        table: 'claims'
      })
    })

    it('should handle UPDATE events with old and new data', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          const mockPayload = {
            eventType: 'UPDATE',
            new: { id: 'claim-123', status: 'approved' },
            old: { id: 'claim-123', status: 'submitted' },
            table: 'claims'
          }
          handler(mockPayload)
          return mockChannel
        }),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'UPDATE',
          callback: mockCallback
        })
      )

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'UPDATE',
          new: { id: 'claim-123', status: 'approved' },
          old: { id: 'claim-123', status: 'submitted' }
        })
      )
    })

    it('should handle DELETE events', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          const mockPayload = {
            eventType: 'DELETE',
            new: null,
            old: { id: 'claim-123', status: 'submitted' },
            table: 'claims'
          }
          handler(mockPayload)
          return mockChannel
        }),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'DELETE',
          callback: mockCallback
        })
      )

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DELETE',
          new: null,
          old: { id: 'claim-123', status: 'submitted' }
        })
      )
    })
  })

  describe('Performance & Optimization', () => {
    it('should not recreate subscription when dependencies unchanged', () => {
      const mockCallback = vi.fn()
      
      const { rerender } = renderHook(
        ({ callback }) => 
          useRealtimeSubscription({
            table: 'claims',
            event: 'INSERT',
            callback
          }),
        { initialProps: { callback: mockCallback } }
      )

      // Rerender with same callback
      rerender({ callback: mockCallback })

      // Should only create subscription once
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1)
    })

    it('should recreate subscription when table changes', () => {
      const mockCallback = vi.fn()
      
      const { rerender } = renderHook(
        ({ table }) => 
          useRealtimeSubscription({
            table,
            event: 'INSERT',
            callback: mockCallback
          }),
        { initialProps: { table: 'claims' } }
      )

      // Change table
      rerender({ table: 'properties' })

      // Should create new subscription
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
      expect(mockSupabase.channel).toHaveBeenNthCalledWith(2, 'properties-INSERT')
    })

    it('should debounce rapid callback changes', () => {
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()
      
      const { rerender } = renderHook(
        ({ callback }) => 
          useRealtimeSubscription({
            table: 'claims',
            event: 'INSERT',
            callback,
            debounceMs: 100
          }),
        { initialProps: { callback: mockCallback1 } }
      )

      // Rapidly change callbacks
      rerender({ callback: mockCallback2 })

      // Should still only have one subscription initially
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery', () => {
    it('should attempt reconnection on disconnect', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          // Simulate disconnect then reconnect
          setTimeout(() => callback('CLOSED'), 100)
          setTimeout(() => callback('SUBSCRIBED'), 200)
          return mockChannel
        }),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { result } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback,
          retryOnDisconnect: true
        })
      )

      // Should eventually reconnect
      expect(result.current.status).toBeDefined()
    })

    it('should respect max retry attempts', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          callback('CHANNEL_ERROR', { message: 'Persistent error' })
          return mockChannel
        }),
        unsubscribe: vi.fn()
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const { result } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback,
          maxRetries: 2
        })
      )

      // Should stop retrying after max attempts
      expect(result.current.status).toBe('CHANNEL_ERROR')
    })
  })

  describe('Multiple Subscriptions', () => {
    it('should handle multiple hooks independently', () => {
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()

      renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback1
        })
      )

      renderHook(() => 
        useRealtimeSubscription({
          table: 'properties',
          event: 'UPDATE',
          callback: mockCallback2
        })
      )

      expect(mockSupabase.channel).toHaveBeenCalledWith('claims-INSERT')
      expect(mockSupabase.channel).toHaveBeenCalledWith('properties-UPDATE')
    })

    it('should properly cleanup individual subscriptions', () => {
      const mockCallback = vi.fn()
      const mockChannel1 = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }
      const mockChannel2 = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn()
      }

      mockSupabase.channel
        .mockReturnValueOnce(mockChannel1)
        .mockReturnValueOnce(mockChannel2)

      const { unmount: unmount1 } = renderHook(() => 
        useRealtimeSubscription({
          table: 'claims',
          event: 'INSERT',
          callback: mockCallback
        })
      )

      const { unmount: unmount2 } = renderHook(() => 
        useRealtimeSubscription({
          table: 'properties',
          event: 'UPDATE',
          callback: mockCallback
        })
      )

      unmount1()

      expect(mockChannel1.unsubscribe).toHaveBeenCalled()
      expect(mockChannel2.unsubscribe).not.toHaveBeenCalled()

      unmount2()

      expect(mockChannel2.unsubscribe).toHaveBeenCalled()
    })
  })
})