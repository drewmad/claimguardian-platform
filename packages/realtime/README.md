# @claimguardian/realtime

Real-time features and subscriptions for ClaimGuardian using Supabase Realtime.

## Installation

```bash
pnpm add @claimguardian/realtime
```

## Features

- 🔄 Real-time database subscriptions
- 👥 Presence tracking for collaboration
- 📡 Broadcast messaging
- 🔔 Live notifications
- ✍️ Typing indicators
- 🎯 Record-specific updates

## Usage Examples

### Basic Table Subscription

```tsx
import { useRealtimeTable } from '@claimguardian/realtime'
import { createClient } from '@claimguardian/db'

function ClaimsList() {
  const supabase = createClient()
  
  const { events, isConnected } = useRealtimeTable(supabase, 'claims', {
    onInsert: (claim) => {
      console.log('New claim created:', claim)
      toast.success('New claim added!')
    },
    onUpdate: ({ old, new: updated }) => {
      console.log('Claim updated:', { old, updated })
    },
    onDelete: (claim) => {
      console.log('Claim deleted:', claim)
    }
  })

  return (
    <div>
      <div>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>Recent events: {events.length}</div>
    </div>
  )
}
```

### Record-Specific Updates

```tsx
import { useClaimUpdates } from '@claimguardian/realtime'

function ClaimDetails({ claimId }: { claimId: string }) {
  const supabase = createClient()
  const { updates, latestStatus, currentClaim } = useClaimUpdates(supabase, claimId)

  return (
    <div>
      <h2>Claim Status: {latestStatus || currentClaim?.status}</h2>
      <div>
        <h3>Update History</h3>
        {updates.map((update, i) => (
          <div key={i}>
            {update.updated_at}: Status changed to {update.status}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Real-time Notifications

```tsx
import { useNotifications } from '@claimguardian/realtime'

function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const { notifications, unreadCount, markAsRead } = useNotifications(supabase, userId)

  return (
    <div className="relative">
      <button className="p-2">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`p-4 ${notif.read ? '' : 'bg-blue-50'}`}
            onClick={() => markAsRead(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Collaborative Editing with Presence

```tsx
import { usePresence, useTypingIndicator } from '@claimguardian/realtime'

function CollaborativeClaimEditor({ claimId, userId, userEmail }: Props) {
  const supabase = createClient()
  
  // Track who's viewing/editing
  const { activeUsers, updateStatus } = usePresence(
    supabase,
    `claim-${claimId}`,
    userId,
    { email: userEmail }
  )

  // Show typing indicators
  const { typingUsers, setTyping } = useTypingIndicator(
    supabase,
    `claim-${claimId}`,
    userId,
    userEmail
  )

  const handleInputChange = (field: string) => {
    setTyping(true, field)
    // Your input handling logic
  }

  useEffect(() => {
    updateStatus({ 
      action: 'editing',
      lastActive: new Date().toISOString()
    })
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span>Active users:</span>
        {activeUsers.map(user => (
          <div key={user} className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{user}</span>
          </div>
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500">
          {typingUsers.map(u => u.user_name).join(', ')} 
          {typingUsers.length === 1 ? ' is' : ' are'} typing...
        </div>
      )}

      <input 
        onChange={() => handleInputChange('description')}
        onBlur={() => setTyping(false)}
      />
    </div>
  )
}
```

### Broadcasting Messages

```tsx
import { useBroadcast } from '@claimguardian/realtime'

function ClaimChat({ claimId }: { claimId: string }) {
  const supabase = createClient()
  const { messages, broadcast } = useBroadcast(supabase, `chat-${claimId}`)
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    await broadcast('message', {
      text: input,
      userId: currentUser.id,
      timestamp: new Date().toISOString()
    })
    setInput('')
  }

  return (
    <div>
      <div className="messages">
        {messages
          .filter(m => m.event === 'message')
          .map((msg, i) => (
            <div key={i}>{msg.payload.text}</div>
          ))}
      </div>
      
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
  )
}
```

### Document Processing Updates

```tsx
import { useDocumentProcessing } from '@claimguardian/realtime'

function DocumentStatus({ documentId }: { documentId: string }) {
  const supabase = createClient()
  const { processingStatus, extractedData } = useDocumentProcessing(supabase, documentId)

  return (
    <div>
      <div className="flex items-center gap-2">
        {processingStatus === 'processing' && <Spinner />}
        <span>Status: {processingStatus}</span>
      </div>
      
      {extractedData && (
        <div className="mt-4">
          <h3>Extracted Information:</h3>
          <pre>{JSON.stringify(extractedData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
```

### Using the RealtimeClient Directly

```tsx
import { RealtimeClient } from '@claimguardian/realtime'

// For advanced use cases
const client = new RealtimeClient(supabase, userId)

// Subscribe to custom events
client.on('claims:insert', (claim) => {
  console.log('New claim:', claim)
})

// Create custom channels
const channel = client.createBroadcastChannel('custom-events')

// Clean up
client.unsubscribeAll()
```

## Channel Naming Conventions

```typescript
import { channels } from '@claimguardian/realtime'

// Pre-defined channel names
const claimChannel = channels.claim('claim-123')
const userNotifs = channels.userNotifications('user-456')
const orgPresence = channels.orgPresence('org-789')
```

## Performance Considerations

1. **Subscription Management**: Unsubscribe when components unmount
2. **Event Throttling**: Consider throttling high-frequency updates
3. **Connection Pooling**: The client reuses connections automatically
4. **Selective Subscriptions**: Only subscribe to data you need

## TypeScript Support

All hooks and functions are fully typed. Import types as needed:

```typescript
import type { 
  RealtimeEvent,
  ClaimUpdate,
  NotificationEvent,
  PresenceState 
} from '@claimguardian/realtime'
```