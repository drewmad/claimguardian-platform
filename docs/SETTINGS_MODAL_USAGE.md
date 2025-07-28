# Settings Modal Usage Guide

The settings modal is a pop-out form that can be opened from anywhere in the application. It provides a comprehensive interface for managing user profile, preferences, notifications, security, and privacy settings.

## Basic Usage

### 1. Using the Hook

```tsx
import { useSettingsModal } from '@/hooks/use-settings-modal'
import { SettingsModal } from '@/components/modals/settings-modal'

function MyComponent() {
  const { isOpen, openSettings, closeSettings } = useSettingsModal()

  return (
    <>
      <button onClick={() => openSettings()}>
        Open Settings
      </button>
      
      <SettingsModal isOpen={isOpen} onClose={closeSettings} />
    </>
  )
}
```

### 2. Opening Specific Tabs

```tsx
// Open to profile tab
openSettings('profile')

// Open to security tab
openSettings('security')

// Open to notifications tab
openSettings('notifications')

// Open to preferences tab
openSettings('preferences')

// Open to privacy tab
openSettings('privacy')
```

### 3. Using the Quick Settings Button

```tsx
import { QuickSettingsButton } from '@/components/ui/quick-settings-button'

function MyComponent() {
  return (
    <div>
      {/* Basic settings button */}
      <QuickSettingsButton />
      
      {/* Settings button with label */}
      <QuickSettingsButton showLabel />
      
      {/* Settings button opening to security tab */}
      <QuickSettingsButton defaultTab="security" />
      
      {/* Custom styled settings button */}
      <QuickSettingsButton 
        variant="outline" 
        size="lg" 
        className="border-blue-500" 
      />
    </div>
  )
}
```

## Features

### Settings Tabs

1. **Profile** - Update personal information (name, phone, email)
2. **Preferences** - Theme, language, timezone, sound settings
3. **Notifications** - Email and push notification preferences
4. **Security** - Password changes, 2FA, security questions
5. **Privacy** - Data management, privacy controls

### Key Features

- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Matches the application's dark theme
- **Form Validation** - Real-time validation with error messages
- **Auto-save** - Preferences are saved automatically
- **Loading States** - Shows loading indicators during operations
- **Error Handling** - Comprehensive error handling with user feedback

### Security Features

- **Password Visibility Toggle** - Show/hide password fields
- **Password Requirements** - Minimum 8 characters
- **2FA Management** - Enable/disable two-factor authentication
- **Current Password Verification** - Required for sensitive changes

## Integration Examples

### Dashboard Integration

The settings modal is already integrated into the dashboard layout:

```tsx
// Header settings button
<button onClick={() => openSettings('profile')}>
  <Settings className="h-5 w-5" />
</button>

// Sidebar settings button
<button onClick={() => openSettings('profile')}>
  <Settings className="w-5 h-5" />
  <span>Settings</span>
</button>
```

### AI Pages Integration

You can add settings access to AI pages:

```tsx
import { QuickSettingsButton } from '@/components/ui/quick-settings-button'

function AIPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1>AI Feature</h1>
        <QuickSettingsButton defaultTab="preferences" />
      </div>
      {/* Rest of your AI page content */}
    </div>
  )
}
```

### Profile Quick Access

Add quick access to specific settings:

```tsx
function UserProfile() {
  const { openSettings } = useSettingsModal()

  return (
    <div>
      <button onClick={() => openSettings('security')}>
        Change Password
      </button>
      
      <button onClick={() => openSettings('notifications')}>
        Notification Settings
      </button>
      
      <button onClick={() => openSettings('privacy')}>
        Privacy Settings
      </button>
    </div>
  )
}
```

## Customization

### Custom Styling

```tsx
<QuickSettingsButton 
  variant="outline"
  size="lg"
  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
  showLabel
/>
```

### Custom Behavior

```tsx
function CustomSettingsAccess() {
  const { openSettings } = useSettingsModal()

  const handleSecurityCheck = () => {
    // Perform security check
    if (userHasSecurityClearance) {
      openSettings('security')
    } else {
      toast.error('Security clearance required')
    }
  }

  return (
    <button onClick={handleSecurityCheck}>
      Advanced Security Settings
    </button>
  )
}
```

## Best Practices

1. **Contextual Access** - Open to the most relevant tab for the user's current context
2. **Visual Consistency** - Use the provided components for consistent styling
3. **Error Handling** - Always handle errors gracefully with user feedback
4. **Loading States** - Show loading indicators for better UX
5. **Mobile Responsive** - Ensure settings work well on mobile devices

## API Reference

### useSettingsModal Hook

```typescript
interface UseSettingsModal {
  isOpen: boolean
  openSettings: (tab?: SettingsTab) => void
  closeSettings: () => void
}
```

### SettingsModal Component

```typescript
interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: SettingsTab
}
```

### QuickSettingsButton Component

```typescript
interface QuickSettingsButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
  defaultTab?: SettingsTab
}
```

## Available Settings Tabs

- `'profile'` - Personal information
- `'preferences'` - App preferences
- `'notifications'` - Notification settings
- `'security'` - Security settings
- `'privacy'` - Privacy controls