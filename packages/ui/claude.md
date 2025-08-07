# UI Package - Claude.md

## Overview

The `@claimguardian/ui` package provides a centralized design system built on Radix UI primitives with Tailwind CSS styling and liquid glass effects.

## Architecture

- **Radix UI Primitives**: Accessible, unstyled components
- **Tailwind CSS**: Utility-first styling
- **Liquid Glass Design**: Premium visual effects with glassmorphism
- **TypeScript 5.8.3**: Full type safety for all components
- **Tree Shaking**: Optimized bundle size with selective imports
- **Enhanced Button Component**: Loading states, icons, accessibility features

## Design System

### Liquid Glass Theme

```css
/* Core liquid glass effects */
.liquid-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.liquid-glass-accent {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(147, 51, 234, 0.15) 100%
  );
}
```

### Color Palette

```typescript
const colors = {
  primary: {
    50: "#eff6ff",
    500: "#3b82f6", // Blue
    900: "#1e3a8a",
  },
  accent: {
    50: "#faf5ff",
    500: "#9333ea", // Purple
    900: "#581c87",
  },
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};
```

## Component Categories

### Form Components

```typescript
// Always import from package root
import {
  Button, Input, Label, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Checkbox, RadioGroup, RadioGroupItem
} from '@claimguardian/ui'

// ✅ Correct usage
<Button variant="default" size="lg" className="liquid-glass">
  Submit
</Button>

<Input
  placeholder="Enter email"
  className="bg-gray-800 border-gray-700 text-white"
/>
```

### Layout Components

```typescript
import {
  Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@claimguardian/ui'

// Card with liquid glass styling
<Card className="bg-gray-800 border-gray-700 liquid-glass">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-300">Content</p>
  </CardContent>
</Card>
```

### Navigation Components

```typescript
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink
} from '@claimguardian/ui'

// Tabs with liquid glass accent
<Tabs defaultValue="tab1" className="w-full">
  <TabsList className="grid w-full grid-cols-2 liquid-glass">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
</Tabs>
```

### Feedback Components

```typescript
import {
  Alert, AlertDescription,
  Badge, Progress, Skeleton,
  Toast, ToastAction, ToastDescription
} from '@claimguardian/ui'

// Alert with proper styling
<Alert variant="destructive" className="bg-red-900/20 border-red-600/30">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription className="text-red-200">
    Error message here
  </AlertDescription>
</Alert>
```

## Import Patterns

### ✅ Always Import from Root

```typescript
// Correct - tree-shakable, optimized
import { Button, Card, Input } from "@claimguardian/ui";

// Also correct - named imports
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
} from "@claimguardian/ui";
```

### ❌ Never Import from Subpaths

```typescript
// Wrong - breaks tree shaking, causes bundle bloat
import { Button } from "@claimguardian/ui/button";
import { Card } from "@claimguardian/ui/card";
```

## Component Customization

### Variant System

```typescript
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>

// Enhanced Button features (NEW)
<Button loading={isLoading} loadingText="Processing...">
  Submit
</Button>

<Button leftIcon={<Save className="h-4 w-4" />}>
  Save Document
</Button>

<Button rightIcon={<ArrowRight className="h-4 w-4" />}>
  Continue
</Button>
```

### Custom Styling with Tailwind

```typescript
// Extend component styles with className
<Button
  variant="default"
  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
>
  Gradient Button
</Button>

// Override default styles
<Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
  <CardContent className="p-6">
    Content with custom padding
  </CardContent>
</Card>
```

### Dark Theme Support

```typescript
// All components support dark theme by default
<div className="min-h-screen bg-slate-950 text-white">
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <CardTitle className="text-white">Dark Theme Card</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-300">Content in dark theme</p>
    </CardContent>
  </Card>
</div>
```

## Liquid Glass Implementation

### Base Effects

```typescript
// Apply liquid glass to containers
<div className="liquid-glass p-6 rounded-lg">
  <h2 className="text-white font-bold">Liquid Glass Container</h2>
  <p className="text-gray-300">Content with glass effect</p>
</div>

// Combine with gradients for accents
<div className="liquid-glass liquid-glass-accent p-4 rounded-lg">
  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
    Premium Feature
  </Badge>
</div>
```

### Interactive Effects

```typescript
// Hover animations
<Button className="liquid-glass hover:liquid-glass-accent transition-all duration-300">
  Interactive Button
</Button>

// Focus states
<Input className="liquid-glass focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" />
```

## Component Composition

### Form Compositions

```typescript
// Complete form example
<Card className="bg-gray-800 border-gray-700 liquid-glass">
  <CardHeader>
    <CardTitle className="text-white">User Information</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email" className="text-white">Email</Label>
      <Input
        id="email"
        type="email"
        className="bg-gray-700 border-gray-600 text-white"
        placeholder="Enter your email"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="message" className="text-white">Message</Label>
      <Textarea
        id="message"
        className="bg-gray-700 border-gray-600 text-white"
        placeholder="Enter your message"
      />
    </div>

    <Button className="w-full bg-blue-600 hover:bg-blue-700">
      Submit
    </Button>
  </CardContent>
</Card>
```

### Dialog Compositions

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="bg-gray-800 border-gray-700 liquid-glass">
    <DialogHeader>
      <DialogTitle className="text-white">Confirm Action</DialogTitle>
      <DialogDescription className="text-gray-400">
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>

    <div className="flex justify-end space-x-2 mt-6">
      <Button
        variant="outline"
        onClick={() => setIsOpen(false)}
        className="border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## Accessibility

### Keyboard Navigation

- All components support keyboard navigation
- Focus management handled automatically
- Tab order follows logical flow

### Screen Reader Support

```typescript
// Use proper ARIA labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Provide descriptions for complex interactions
<Input
  aria-describedby="email-help"
  placeholder="Enter email"
/>
<p id="email-help" className="text-sm text-gray-500">
  We'll never share your email
</p>
```

### Color Contrast

- All components meet WCAG AA standards
- High contrast ratios for text and backgrounds
- Focus indicators clearly visible

## Performance Considerations

### Bundle Optimization

```typescript
// Tree shaking works automatically with root imports
import { Button, Card } from "@claimguardian/ui"; // Only these are bundled

// Dynamic imports for large components
const DataTable = lazy(() =>
  import("@claimguardian/ui").then((mod) => ({
    default: mod.DataTable,
  })),
);
```

### CSS Optimization

- Tailwind CSS purges unused styles
- Component styles are minimal and focused
- Liquid glass effects use efficient CSS filters

## Testing Components

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@claimguardian/ui'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
})

test('applies variant classes correctly', () => {
  render(<Button variant="destructive">Delete</Button>)
  const button = screen.getByRole('button')
  expect(button).toHaveClass('bg-red-600')
})
```

### Storybook Integration

```typescript
// Component stories for documentation
export default {
  title: 'Components/Button',
  component: Button,
}

export const Default = () => <Button>Default Button</Button>
export const Variants = () => (
  <div className="space-x-2">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
  </div>
)
```

## Build Configuration

### Package.json

```json
{
  "name": "@claimguardian/ui",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.tsx --format cjs,esm --dts",
    "type-check": "tsc --noEmit"
  }
}
```

### TSUp Configuration

```typescript
// Optimized build for tree shaking
export default {
  entry: ["src/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: true,
};
```

## Common Issues & Solutions

### Missing Component Exports

- **Issue**: Component not found when importing
- **Fix**: Add export to `src/index.tsx`

### Styling Not Applied

- **Issue**: Tailwind classes not working
- **Fix**: Ensure component is wrapped with proper class names

### Bundle Size Issues

- **Issue**: Large bundle size
- **Fix**: Use root imports, check for duplicate dependencies

### TypeScript Errors

- **Issue**: Type conflicts with Radix UI
- **Fix**: Update @types/react, ensure compatible versions
