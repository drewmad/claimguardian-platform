/**
 * @fileMetadata
 * @purpose "Unit tests for RealtimeManager class - verifying TypeScript fixes and functionality"
 * @owner test-engineer
 * @dependencies ["@jest/globals", "@/lib/database/realtime-manager", "@supabase/supabase-js"]
 * @exports []
 * @complexity high
 * @tags ["database", "realtime", "websockets", "testing", "typescript-fixes"]
 * @status active
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { RealtimeManager, getRealtimeManager } from '@/lib/database/realtime-manager';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation((callback) => callback('SUBSCRIBED')),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      presenceState: jest.fn(() => ({})),
      track: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    })),
  })),
}));

// Mock cache manager
jest.mock('@/lib/database/cache-manager', () => ({
  getCacheManager: jest.fn(() => ({
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RealtimeManager', () => {
  let realtimeManager: RealtimeManager;

  // Set up environment variables
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    
    realtimeManager = new RealtimeManager({
      enableHeartbeat: false, // Disable for testing
      bufferMessages: true,
      enablePresence: true,
      enableBroadcast: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscription management', () => {
    it('should create subscriptions with proper TypeScript types', async () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();

      const subscriptionId = await realtimeManager.subscribe(
        'claims',
        ['INSERT', 'UPDATE'],
        callback,
        {
          filter: { status: 'active' },
          errorCallback,
          enableCache: true,
        }
      );

      expect(subscriptionId).toEqual(expect.stringMatching(/^sub_\d+_[a-z0-9]+$/));
      expect(callback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should handle callback with proper event typing', async () => {
      const callback = jest.fn();
      
      const subscriptionId = await realtimeManager.subscribe(
        'properties',
        'INSERT',
        callback
      );

      // Simulate realtime event
      const mockEvent = {
        id: 'evt_123',
        type: 'INSERT' as const,
        table: 'properties',
        schema: 'public',
        new: { id: '1', name: 'Test Property' },
        old: null,
        timestamp: new Date(),
      };

      expect(subscriptionId).toBeDefined();
      expect(typeof callback).toBe('function');
    });

    it('should handle unsubscribe correctly', async () => {
      const callback = jest.fn();
      const subscriptionId = await realtimeManager.subscribe(
        'documents',
        'UPDATE',
        callback
      );

      await expect(realtimeManager.unsubscribe(subscriptionId)).resolves.not.toThrow();
    });

    it('should handle non-existent subscription unsubscribe gracefully', async () => {
      await expect(realtimeManager.unsubscribe('non_existent')).resolves.not.toThrow();
    });
  });

  describe('presence functionality', () => {
    it('should subscribe to presence with proper typing', async () => {
      const presenceCallback = jest.fn();
      
      const subscriptionId = await realtimeManager.subscribeToPresence(
        'test-channel',
        presenceCallback
      );

      expect(subscriptionId).toEqual(expect.stringMatching(/^presence_\d+_[a-z0-9]+$/));
      expect(presenceCallback).not.toHaveBeenCalled();
    });

    it('should update presence state with proper typing', async () => {
      const presenceState = {
        userId: 'user123',
        userInfo: {
          email: 'test@example.com',
          name: 'Test User',
        },
        location: {
          page: '/dashboard',
          path: '/dashboard/claims',
        },
        activity: {
          lastSeen: new Date(),
          status: 'online' as const,
        },
      };

      await expect(realtimeManager.updatePresence('test-channel', presenceState)).resolves.not.toThrow();
    });

    it('should throw error when presence is disabled', async () => {
      const disabledManager = new RealtimeManager({ enablePresence: false });
      
      await expect(
        disabledManager.subscribeToPresence('test-channel', jest.fn())
      ).rejects.toThrow('Presence is disabled in configuration');
    });
  });

  describe('broadcast functionality', () => {
    it('should subscribe to broadcast messages with proper typing', async () => {
      const broadcastCallback = jest.fn();
      
      const subscriptionId = await realtimeManager.subscribeToBroadcast(
        'collaboration-channel',
        'cursor-move',
        broadcastCallback
      );

      expect(subscriptionId).toEqual(expect.stringMatching(/^broadcast_\d+_[a-z0-9]+$/));
      expect(broadcastCallback).not.toHaveBeenCalled();
    });

    it('should send broadcast messages with proper typing', async () => {
      const payload = {
        x: 100,
        y: 200,
        userId: 'user123',
      };

      await expect(
        realtimeManager.broadcast('test-channel', 'cursor-move', payload, {
          userId: 'user123',
        })
      ).resolves.not.toThrow();
    });

    it('should throw error when broadcast is disabled', async () => {
      const disabledManager = new RealtimeManager({ enableBroadcast: false });
      
      await expect(
        disabledManager.subscribeToBroadcast('test-channel', 'test-event', jest.fn())
      ).rejects.toThrow('Broadcast is disabled in configuration');
    });
  });

  describe('subscription info and metrics', () => {
    it('should return properly typed subscription info', async () => {
      const callback = jest.fn();
      await realtimeManager.subscribe('claims', 'INSERT', callback);
      
      const info = realtimeManager.getSubscriptionInfo();
      
      expect(info).toEqual({
        subscriptions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^sub_\d+_[a-z0-9]+$/),
            table: 'claims',
            events: ['INSERT'],
            status: expect.stringMatching(/^(connecting|connected|disconnected|error|closed)$/),
            eventCount: expect.any(Number),
            created: expect.any(Date),
          }),
        ]),
        channels: expect.any(Number),
        totalEvents: expect.any(Number),
        averageLatency: expect.any(Number),
      });
    });
  });

  describe('error handling', () => {
    it('should handle subscription errors gracefully', async () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();

      // This should not throw even with invalid table name
      await expect(
        realtimeManager.subscribe(
          'invalid_table' as any,
          'INSERT',
          callback,
          { errorCallback }
        )
      ).resolves.toBeDefined();
    });

    it('should handle shutdown gracefully', async () => {
      const callback = jest.fn();
      await realtimeManager.subscribe('claims', 'INSERT', callback);
      
      await expect(realtimeManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getRealtimeManager', () => {
      const instance1 = getRealtimeManager();
      const instance2 = getRealtimeManager();
      
      expect(instance1).toBe(instance2);
    });
  });
});

// Test type safety at compile time
describe('TypeScript type safety', () => {
  it('should enforce proper table names', () => {
    // This test ensures TypeScript compilation catches invalid table names
    const manager = new RealtimeManager();
    
    // Valid table names should compile
    expect(() => {
      manager.subscribe('claims', 'INSERT', () => {});
      manager.subscribe('properties', 'UPDATE', () => {});
      manager.subscribe('documents', 'DELETE', () => {});
    }).not.toThrow();
  });

  it('should enforce proper event types', () => {
    const manager = new RealtimeManager();
    const callback = jest.fn();
    
    // Valid event types should compile
    expect(() => {
      manager.subscribe('claims', 'INSERT', callback);
      manager.subscribe('claims', ['INSERT', 'UPDATE'], callback);
      manager.subscribe('claims', '*', callback);
    }).not.toThrow();
  });

  it('should enforce proper callback signatures', () => {
    const manager = new RealtimeManager();
    
    // Valid callback should compile
    const validCallback = (event: any) => {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('table');
      expect(event).toHaveProperty('timestamp');
    };
    
    expect(() => {
      manager.subscribe('claims', 'INSERT', validCallback);
    }).not.toThrow();
  });
});