# Mobile Optimization Guide

This guide covers the mobile responsiveness optimizations implemented in ClaimGuardian.

## Overview

ClaimGuardian is fully optimized for mobile devices with:

- Responsive layouts that adapt to all screen sizes
- Touch-optimized interactions
- Mobile-specific navigation patterns
- Performance optimizations for slower connections
- Native-like experiences on iOS and Android

## Mobile Components

### 1. Mobile Navigation (`/components/mobile/mobile-nav.tsx`)

- Fixed bottom navigation bar with 5 main sections
- Sheet-based "More" menu for additional options
- Active state indicators with animations
- Badge support for notifications

### 2. Mobile Cards (`/components/mobile/mobile-card.tsx`)

- Touch-optimized card components
- Swipeable card variant for actions
- Proper touch targets (44x44px minimum)
- Smooth animations and transitions

### 3. Mobile Image Upload (`/components/mobile/mobile-image-upload.tsx`)

- Camera capture integration
- Drag-and-drop support on tablets
- File size validation
- Loading states

## Responsive Hooks

### `useMobile()`

Detects device type and orientation:

```typescript
import { useMobile } from '@/hooks/use-mobile'

function MyComponent() {
  const { isMobile, isTablet, isPortrait } = useMobile()

  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  )
}
```

### `useTouch()`

Detects touch-capable devices:

```typescript
const isTouch = useTouch();
```

### `useSafeArea()`

Gets safe area insets for notched devices:

```typescript
const { top, bottom } = useSafeArea();
```

### `useViewportHeight()`

Handles mobile browser chrome:

```typescript
const height = useViewportHeight();
```

## CSS Classes & Utilities

### Responsive Breakpoints

- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

### Mobile-First Utilities

```css
/* Hide on mobile, show on desktop */
.hidden md:block

/* Stack on mobile, grid on desktop */
.flex flex-col md:grid md:grid-cols-2

/* Smaller padding on mobile */
.p-4 md:p-6 lg:p-8

/* Full width on mobile, constrained on desktop */
.w-full md:w-auto
```

### Touch Targets

All interactive elements have minimum 44x44px touch targets:

```css
button,
a,
[role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

## Mobile-Specific Features

### 1. Bottom Navigation

- Always visible on mobile
- Shows 4 main items + "More" menu
- Stays above iOS home indicator

### 2. Pull-to-Refresh

Implemented on list views:

```typescript
<PullToRefresh onRefresh={loadData}>
  {/* List content */}
</PullToRefresh>
```

### 3. Offline Support

- Service worker for offline functionality
- Local storage for draft data
- Sync when connection restored

### 4. Camera Integration

- Direct camera capture for damage photos
- Multiple photo selection
- Automatic compression

## Performance Optimizations

### 1. Image Optimization

- Lazy loading with Intersection Observer
- Responsive images with srcset
- WebP format with JPEG fallback
- Automatic compression

### 2. Bundle Size

- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking unused code
- Minified production builds

### 3. Network Optimization

- API response caching
- Optimistic UI updates
- Request debouncing
- Pagination for lists

## Platform-Specific Considerations

### iOS

- Safe area insets for notched devices
- Prevents zoom on input focus (font-size: 16px)
- Rubber band scrolling handled
- Home indicator spacing

### Android

- Material Design touch ripples
- Back button handling
- Status bar theming
- Keyboard handling

## Testing Mobile Responsiveness

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device preset or custom size
4. Test touch interactions

### Real Device Testing

1. Use ngrok for local testing:
   ```bash
   ngrok http 3000
   ```
2. Open ngrok URL on mobile device
3. Test all interactions

### Automated Testing

```typescript
// Cypress mobile viewport test
cy.viewport("iphone-x");
cy.visit("/dashboard");
cy.get('[data-testid="mobile-nav"]').should("be.visible");
```

## Common Patterns

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} />
  ))}
</div>
```

### Mobile Menu

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent>{/* Mobile menu items */}</SheetContent>
</Sheet>
```

### Conditional Rendering

```tsx
const { isMobile } = useMobile();

return <>{isMobile ? <MobileComponent /> : <DesktopComponent />}</>;
```

## Accessibility on Mobile

### Touch Target Size

- Minimum 44x44px for all interactive elements
- 48x48px for primary actions
- Adequate spacing between targets

### Focus Management

- Visible focus indicators
- Logical tab order
- Focus trap in modals

### Screen Reader Support

- Proper ARIA labels
- Semantic HTML structure
- Announcements for dynamic content

## Troubleshooting

### Common Issues

1. **Horizontal Scroll**
   - Check for fixed widths
   - Use `overflow-x: hidden` on body
   - Inspect with DevTools

2. **Input Zoom on iOS**
   - Set font-size to 16px minimum
   - Use meta viewport tag

3. **Bottom Nav Overlap**
   - Add padding-bottom to main content
   - Account for safe areas

4. **Touch Not Working**
   - Check z-index stacking
   - Ensure touch-action CSS
   - Verify event handlers

## Future Enhancements

- [ ] Gesture navigation
- [ ] Haptic feedback
- [ ] Native app features via PWA
- [ ] Biometric authentication
- [ ] Push notifications
- [ ] Background sync
- [ ] Offline-first architecture

## Best Practices

1. **Mobile-First Design**
   - Start with mobile layout
   - Enhance for larger screens
   - Test on real devices

2. **Performance**
   - Minimize JavaScript
   - Optimize images
   - Reduce network requests

3. **Usability**
   - Large touch targets
   - Clear visual feedback
   - Simple navigation

4. **Content**
   - Prioritize important info
   - Progressive disclosure
   - Readable font sizes
