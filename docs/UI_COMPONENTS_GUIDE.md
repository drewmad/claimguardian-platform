# ClaimGuardian UI Components Guide

## Overview

Complete documentation for ClaimGuardian's UI component system, covering standardized components, design patterns, animations, and usage examples.

## Table of Contents

- [Design System](#design-system)
- [Core Components](#core-components)
- [Insurance-Specific Components](#insurance-specific-components)
- [Animation System](#animation-system)
- [Utility Components](#utility-components)
- [Usage Patterns](#usage-patterns)
- [Development Guidelines](#development-guidelines)

---

## Design System

### Color Palette

ClaimGuardian uses a dark theme with consistent color usage:

```typescript
// Primary Colors
- Background: bg-gray-900, bg-black
- Cards: bg-gray-800/50, bg-gray-800/70 (with backdrop-blur)
- Borders: border-gray-700/50, border-gray-700
- Text: text-white (primary), text-gray-300 (secondary), text-gray-400 (tertiary)

// Brand Colors
- Green (success/primary): text-green-400, bg-green-600
- Blue (info): text-blue-400, bg-blue-600
- Orange (warning): text-orange-400, bg-orange-600
- Red (danger): text-red-400, bg-red-600
- Purple (special): text-purple-400, bg-purple-600
```

### Typography

```typescript
// Headings
- h1: text-3xl md:text-5xl font-bold
- h2: text-2xl md:text-4xl font-bold
- h3: text-xl font-bold
- h4: text-lg font-semibold

// Body Text
- Large: text-lg
- Normal: text-base
- Small: text-sm
- Extra Small: text-xs
```

### Spacing

```typescript
// Container Padding
- Page containers: px-4 md:px-8, py-6 md:py-12
- Card padding: p-6, p-8 (large cards)
- Section spacing: mt-8, mb-8, gap-6, gap-8

// Grid Systems
- 1-2 columns: grid-cols-1 md:grid-cols-2
- 1-3 columns: grid-cols-1 md:grid-cols-3
- 1-4 columns: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
```

---

## Core Components

### Card Variants (`components/ui/card-variants.tsx`)

Standardized card system with 7 variants for consistent UI across the application.

```typescript
export type CardVariant =
  | 'default'
  | 'insurance'
  | 'property'
  | 'claim'
  | 'elevated'
  | 'interactive'
  | 'danger'

// Usage Examples
<CardVariants variant="insurance" className="p-6">
  <h3>Insurance Policy Details</h3>
  <p>Policy information content...</p>
</CardVariants>

<CardVariants variant="property" className="p-4">
  <PropertySummary />
</CardVariants>

<CardVariants variant="danger" className="p-4">
  <DeleteConfirmation />
</CardVariants>
```

**Variant Styles:**

- `default`: Standard gray card with subtle border
- `insurance`: Blue-tinted with backdrop blur for insurance content
- `property`: Green-tinted for property-related information
- `claim`: Orange-tinted for claims and urgent items
- `elevated`: Higher shadow with enhanced border for important content
- `interactive`: Hover effects and cursor pointer for clickable cards
- `danger`: Red-tinted for dangerous actions and warnings

### Insurance Badges (`components/ui/insurance-badges.tsx`)

Specialized badge system with 19 variants for insurance context.

```typescript
export type InsuranceBadgeVariant =
  | 'active' | 'expired' | 'pending'
  | 'coverage-adequate' | 'coverage-low' | 'coverage-high'
  | 'premium-low' | 'premium-high'
  | 'insurability-high' | 'insurability-medium' | 'insurability-low'
  | 'claim-open' | 'claim-closed' | 'claim-pending'
  | 'risk-low' | 'risk-medium' | 'risk-high'
  | 'document-verified' | 'document-missing'

// Usage Examples
<InsuranceBadge variant="active" showIcon={true}>
  Active Policy
</InsuranceBadge>

<InsuranceBadge variant="coverage-low" showIcon={false}>
  Insufficient Coverage
</InsuranceBadge>

<InsuranceBadge variant="claim-pending">
  Claim Under Review
</InsuranceBadge>
```

**Badge Categories:**

- **Status**: active, expired, pending
- **Coverage**: adequate, low, high
- **Premium**: low, high
- **Insurability**: high, medium, low
- **Claims**: open, closed, pending
- **Risk**: low, medium, high
- **Documents**: verified, missing

---

## Insurance-Specific Components

### Search & Filter Bar (`components/insurance/search-filter-bar.tsx`)

Comprehensive search and filtering with animations.

```typescript
export interface FilterOptions {
  search: string
  policyTypes: string[]
  carriers: string[]
  status: string[]
  sortBy: 'premium' | 'coverage' | 'expiration' | 'name'
  sortOrder: 'asc' | 'desc'
}

// Usage
<SearchFilterBar
  onFiltersChange={setFilters}
  initialFilters={defaultFilters}
  totalCount={policies.length}
/>
```

**Features:**

- Real-time search with debouncing
- Multi-select filters for policy types, carriers, status
- Sort by premium, coverage, expiration, or name
- Animated filter panel with Framer Motion
- Clear all filters functionality
- Results count display

### Insurance Stats Cards (`components/insurance/insurance-stats-cards.tsx`)

Dashboard statistics with animated counters and status indicators.

```typescript
interface StatsData {
  totalCoverage: number
  totalPremium: number
  activePolicies: number
  expiringPolicies: number
  claimsCount: number
  lastUpdated: Date
}

// Usage
<InsuranceStatsCards
  totalCoverage={1250000}
  totalPremium={4800}
  activePolicies={5}
  expiringPolicies={1}
  claimsCount={2}
  lastUpdated={new Date()}
/>
```

**Features:**

- Animated number counters
- Color-coded status indicators
- Responsive grid layout
- Icons from Lucide React
- Hover effects and transitions

---

## Animation System

### Framer Motion Library (`lib/animations.ts`)

Comprehensive animation variants for consistent motion design.

```typescript
// Page Transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// Stagger Animations
export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
}

// Hover Effects
export const hoverScale: Variants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
}

// Usage Examples
<motion.div variants={pageTransition} initial="initial" animate="animate">
  <motion.div variants={staggerContainer} animate="animate">
    <motion.div variants={fadeInUp}>Card 1</motion.div>
    <motion.div variants={fadeInUp}>Card 2</motion.div>
  </motion.div>
</motion.div>
```

**Available Animations:**

- `fadeInUp` - Fade in with upward slide
- `fadeInDown` - Fade in with downward slide
- `slideInLeft` - Slide in from left
- `slideInRight` - Slide in from right
- `scaleIn` - Scale up from center
- `rotateIn` - Rotate and fade in
- `bounceIn` - Bounce entrance effect
- `hoverScale` - Scale on hover
- `hoverGlow` - Glow effect on hover

### Animation Integration Pattern

```typescript
// Standard component animation setup
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

export function AnimatedComponent() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={fadeInUp}
          custom={index}
        >
          <ComponentContent />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

---

## Utility Components

### Drag & Drop Upload (`components/ui/drag-drop-upload.tsx`)

Full-featured file upload with validation and progress tracking.

```typescript
interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  maxSize?: number // MB
  maxFiles?: number
}

// Usage
<DragDropUpload
  onUpload={handleFileUpload}
  accept="image/*,.pdf"
  multiple={true}
  maxSize={10}
  maxFiles={5}
/>
```

**Features:**

- Visual drag & drop zone
- File type validation
- Size limit enforcement
- Progress bars for uploads
- Error handling and display
- Preview thumbnails
- Remove uploaded files

### Bulk Actions (`components/ui/bulk-actions.tsx`)

Selection and bulk operation system with custom hook.

```typescript
// Hook Usage
const bulkSelection = useBulkSelection(items)

// Component Usage
<BulkActions
  selectedCount={bulkSelection.selectedCount}
  actions={[
    { label: 'Export Selected', action: handleExport, icon: Download },
    { label: 'Delete Selected', action: handleDelete, icon: Trash, variant: 'destructive' }
  ]}
  onSelectAll={bulkSelection.selectAll}
  onDeselectAll={bulkSelection.deselectAll}
/>

// Selection checkboxes
{items.map(item => (
  <div key={item.id}>
    <input
      type="checkbox"
      checked={bulkSelection.isSelected(item.id)}
      onChange={() => bulkSelection.toggle(item.id)}
    />
    <ItemContent />
  </div>
))}
```

### Progress Component (`components/ui/progress.tsx`)

Visual progress indicators with customizable styling.

```typescript
<Progress
  value={75}
  variant="success"
  size="lg"
  showLabel={true}
  className="mb-4"
/>

// Variants: default, success, warning, error
// Sizes: sm, default, lg
```

---

## Usage Patterns

### Dashboard Layout Pattern

```typescript
export function DashboardPage() {
  return (
    <DashboardLayout>
      <motion.div variants={pageTransition} initial="initial" animate="animate">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Page Title</h1>
          <p className="text-gray-400">Page description</p>
        </div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.id} variants={fadeInUp}>
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <CardVariants variant="default" className="p-6">
          <MainContent />
        </CardVariants>
      </motion.div>
    </DashboardLayout>
  )
}
```

### Form Layout Pattern

```typescript
export function FormComponent() {
  return (
    <motion.form variants={fadeInUp} onSubmit={handleSubmit}>
      <CardVariants variant="default" className="p-6">
        <div className="space-y-6">
          {/* Form Header */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Form Title</h2>
            <p className="text-gray-400 text-sm">Form description</p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Field 1" error={errors.field1}>
              <Input {...register('field1')} />
            </FormField>
            <FormField label="Field 2" error={errors.field2}>
              <Select {...register('field2')} />
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </CardVariants>
    </motion.form>
  )
}
```

---

## Development Guidelines

### Component Structure

```typescript
/**
 * @fileMetadata
 * @purpose "Brief description of component purpose"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "@/lib/animations"]
 * @exports ["ComponentName"]
 * @complexity low|medium|high
 * @tags ["tag1", "tag2", "tag3"]
 * @status stable|beta|deprecated
 */
'use client'

import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'

interface ComponentProps {
  // Props with clear types
  title: string
  description?: string
  variant?: 'default' | 'primary' | 'secondary'
  onAction?: (data: any) => void
}

export function ComponentName({
  title,
  description,
  variant = 'default',
  onAction
}: ComponentProps) {
  // Component logic

  return (
    <motion.div variants={fadeInUp} className="component-styles">
      {/* Component JSX */}
    </motion.div>
  )
}
```

### Styling Guidelines

1. **Use Tailwind Classes**: Consistent with design system
2. **Dark Theme First**: All components designed for dark backgrounds
3. **Responsive Design**: Mobile-first approach with breakpoints
4. **Animation Integration**: Use Framer Motion variants from `/lib/animations.ts`
5. **Accessibility**: Include ARIA labels, focus states, keyboard navigation

### Performance Considerations

1. **Lazy Loading**: Use dynamic imports for heavy components
2. **Memoization**: Use `React.memo` for expensive renders
3. **Animation Performance**: Use `transform` and `opacity` for smooth animations
4. **Bundle Splitting**: Keep components modular and importable

---

## Component Checklist

When creating new components, ensure:

- [ ] File metadata header included
- [ ] TypeScript interfaces defined
- [ ] Props have default values where appropriate
- [ ] Component uses consistent styling patterns
- [ ] Animations integrated if interactive
- [ ] Responsive design implemented
- [ ] Accessibility features included
- [ ] Error boundaries considered
- [ ] Loading states handled
- [ ] Documentation updated

---

## Future Enhancements

### Planned Components

- Data visualization charts
- Mobile-optimized components
- Print-friendly layouts
- Keyboard shortcut system
- Advanced search components
- Real-time notification components

### Design System Improvements

- Component playground/Storybook integration
- Design tokens system
- Automated visual regression testing
- Performance monitoring for animations
- Accessibility audit automation

---

_Last updated: August 2025_
_Version: 1.0_
_Maintainer: Frontend Team_
