# Realtime Package - Claude.md

## Overview
The `@claimguardian/realtime` package provides WebSocket-based real-time subscriptions and live updates using Supabase's Realtime Engine.

## Architecture
- **WebSocket Connections**: Persistent connections for live updates
- **Supabase Realtime**: Built on PostgreSQL's logical replication
- **React Hooks**: Declarative real-time data subscriptions
- **Type Safety**: Full TypeScript support for real-time events
- **Connection Management**: Automatic reconnection and error handling

## Key Features

### Real-time Table Subscriptions
```typescript
import { useRealtimeTable } from '@claimguardian/realtime'

// Subscribe to table changes
const { data, error, loading } = useRealtimeTable(supabase, 'claims', {
  onInsert: (record) => {
    toast.success(`New claim created: ${record.claim_number}`)
  },
  onUpdate: ({ old, new: updated }) => {
    toast.info(`Claim ${updated.claim_number} updated`)
  },
  onDelete: (record) => {
    toast.warning(`Claim ${record.claim_number} deleted`)
  },
  enabled: true // Can be toggled based on component state
})
```

### Real-time Channels
```typescript
import { useRealtimeChannel } from '@claimguardian/realtime'

// Create custom channels for specific features
const { channel, send, connected } = useRealtimeChannel(supabase, 'claim-updates', {
  onMessage: (payload) => {
    console.log('Received message:', payload)
  },
  onJoin: () => {
    console.log('Joined channel')
  },
  onLeave: () => {
    console.log('Left channel')
  }
})

// Send messages to channel participants
const notifyClaimUpdate = (claimId: string, status: string) => {
  send('claim-status-change', {
    claimId,
    status,
    timestamp: new Date().toISOString()
  })
}
```

### Presence Tracking
```typescript
import { usePresence } from '@claimguardian/realtime'

// Track who's currently viewing a claim
const { presences, track, untrack } = usePresence(supabase, 'claim-123', {
  userId: user.id,
  userName: user.name,
  avatar: user.avatar
})

// Show active users
const activeUsers = Object.values(presences).map(presence => presence.userName)
```

## Hook Patterns

### useRealtimeTable
Primary hook for table-level subscriptions.

```typescript
interface UseRealtimeTableOptions<T> {
  onInsert?: (record: T) => void
  onUpdate?: (data: { old: T; new: T }) => void
  onDelete?: (record: T) => void
  enabled?: boolean
  filter?: string // SQL filter expression
}

const useRealtimeTable = <T = unknown>(
  supabase: SupabaseClient,
  table: string,
  options?: UseRealtimeTableOptions<T>
) => {
  // Implementation handles subscription lifecycle
  // Returns: { data, error, loading, subscription }
}
```

### useRealtimeSubscription
Alias for `useRealtimeTable` for backward compatibility.

```typescript
// These are equivalent:
const result1 = useRealtimeTable(supabase, 'properties', options)
const result2 = useRealtimeSubscription(supabase, 'properties', options)
```

### useRealtimeChannel
For custom channel-based communication.

```typescript
const useRealtimeChannel = (
  supabase: SupabaseClient,
  channelName: string,
  options: {
    onMessage?: (payload: any) => void
    onJoin?: () => void
    onLeave?: () => void
    onError?: (error: Error) => void
  }
) => {
  // Returns: { channel, send, connected, error }
}
```

## Real-time Use Cases

### Collaborative Claim Editing
```typescript
const ClaimEditor = ({ claimId }: { claimId: string }) => {
  const [claim, setClaim] = useState<Claim | null>(null)

  // Real-time updates when others edit the claim
  useRealtimeTable(supabase, 'claims', {
    onUpdate: ({ new: updatedClaim }) => {
      if (updatedClaim.id === claimId) {
        setClaim(updatedClaim)
        toast.info('Claim updated by another user')
      }
    },
    filter: `id=eq.${claimId}`
  })

  return (
    <div>
      <h1>Claim {claim?.claim_number}</h1>
      {/* Edit form with real-time conflict resolution */}
    </div>
  )
}
```

### Live Status Updates
```typescript
const ClaimStatusTracker = () => {
  const [claims, setClaims] = useState<Claim[]>([])

  useRealtimeTable(supabase, 'claims', {
    onUpdate: ({ new: updated }) => {
      setClaims(prev => prev.map(claim =>
        claim.id === updated.id ? updated : claim
      ))

      // Show notification for status changes
      if (updated.status === 'approved') {
        toast.success(`Claim ${updated.claim_number} approved!`)
      }
    }
  })

  return (
    <div>
      {claims.map(claim => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  )
}
```

### Activity Feed
```typescript
const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([])

  useRealtimeTable(supabase, 'activities', {
    onInsert: (newActivity) => {
      setActivities(prev => [newActivity, ...prev.slice(0, 99)]) // Keep last 100
    },
    filter: `user_id=eq.${user.id}`
  })

  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}
```

## Connection Management

### Automatic Reconnection
```typescript
// Built-in reconnection logic
const { connected, reconnecting } = useRealtimeTable(supabase, 'claims', {
  onInsert: handleInsert,
  // Automatically handles connection drops and reconnection
})

if (reconnecting) {
  return <div>Reconnecting to real-time updates...</div>
}
```

### Connection Status
```typescript
const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const channel = supabase.channel('connection-status')

    channel
      .on('system', { event: 'connected' }, () => setIsConnected(true))
      .on('system', { event: 'disconnected' }, () => setIsConnected(false))
      .subscribe()

    return () => channel.unsubscribe()
  }, [])

  return (
    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  )
}
```

## Performance Optimization

### Selective Subscriptions
```typescript
// Only subscribe to specific columns to reduce bandwidth
const { data } = useRealtimeTable(supabase, 'claims', {
  onUpdate: ({ new: updated }) => {
    // Only status and updated_at columns are sent
    handleStatusChange(updated.status)
  },
  // Note: Column filtering requires database configuration
})
```

### Conditional Subscriptions
```typescript
const ClaimDetails = ({ claimId, isActive }: Props) => {
  // Only subscribe when component is active
  useRealtimeTable(supabase, 'claims', {
    onUpdate: handleUpdate,
    enabled: isActive, // Stops subscription when false
    filter: `id=eq.${claimId}`
  })
}
```

### Debounced Updates
```typescript
import { useDebouncedCallback } from 'use-debounce'

const ClaimForm = () => {
  const debouncedUpdate = useDebouncedCallback((claim: Claim) => {
    // Update UI after 500ms of no new changes
    updateClaimDisplay(claim)
  }, 500)

  useRealtimeTable(supabase, 'claims', {
    onUpdate: ({ new: updated }) => {
      debouncedUpdate(updated)
    }
  })
}
```

## Error Handling

### Subscription Errors
```typescript
const { error } = useRealtimeTable(supabase, 'claims', {
  onInsert: handleInsert,
  onError: (error) => {
    console.error('Realtime subscription error:', error)
    toast.error('Lost connection to real-time updates')
  }
})

if (error) {
  return <div>Failed to connect to real-time updates</div>
}
```

### Network Resilience
```typescript
// Handle temporary network issues
const [networkStatus, setNetworkStatus] = useState('online')

useEffect(() => {
  const handleOnline = () => setNetworkStatus('online')
  const handleOffline = () => setNetworkStatus('offline')

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])

// Show appropriate UI based on network status
if (networkStatus === 'offline') {
  return <div>Offline - real-time updates paused</div>
}
```

## Testing

### Mock Realtime Events
```typescript
// packages/realtime/src/__tests__/useRealtimeSubscription.test.ts
import { renderHook } from '@testing-library/react'
import { useRealtimeSubscription } from '../hooks'

describe('useRealtimeSubscription', () => {
  it('should handle table updates', () => {
    const mockSupabase = createMockSupabaseClient()
    const onUpdate = vi.fn()

    const { result } = renderHook(() =>
      useRealtimeSubscription(mockSupabase, 'claims', { onUpdate })
    )

    // Simulate realtime update
    mockSupabase.channel().trigger('postgres_changes', {
      eventType: 'UPDATE',
      new: { id: '1', status: 'approved' },
      old: { id: '1', status: 'pending' }
    })

    expect(onUpdate).toHaveBeenCalledWith({
      new: { id: '1', status: 'approved' },
      old: { id: '1', status: 'pending' }
    })
  })
})
```

## Security Considerations

### Row Level Security
```sql
-- Enable RLS on tables with real-time subscriptions
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Users can only see their own claims
CREATE POLICY "Users can view own claims" ON public.claims
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime respects RLS policies
```

### Channel Security
```typescript
// Secure channels with proper authorization
const secureChannel = supabase.channel(`claim-${claimId}`, {
  config: {
    presence: {
      key: user.id,
    }
  }
})

// Verify user has access to claim before joining channel
if (await userCanAccessClaim(user.id, claimId)) {
  secureChannel.subscribe()
}
```

## Dependencies
- `@supabase/supabase-js ^2.53.0` - Supabase client
- `react ^18.3.1` - React hooks
- `@testing-library/react ^14.0.0` - Testing utilities

## Build Configuration
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  }
}
```

## Common Issues & Solutions

### Subscription Not Working
- **Issue**: Real-time updates not received
- **Fix**: Check RLS policies, verify user authentication, ensure table has real-time enabled

### Memory Leaks
- **Issue**: Subscriptions not cleaned up
- **Fix**: Use hooks properly, ensure components unmount correctly

### Too Many Connections
- **Issue**: Exceeding connection limits
- **Fix**: Use conditional subscriptions, unsubscribe when not needed

### Performance Issues
- **Issue**: Too many updates causing lag
- **Fix**: Use debouncing, filter subscriptions, limit update frequency
