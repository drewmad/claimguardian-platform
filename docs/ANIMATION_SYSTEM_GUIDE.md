# ClaimGuardian Animation System Guide

## Overview

Complete guide to ClaimGuardian's animation system built with Framer Motion, providing consistent and performant animations across the application.

## Table of Contents

- [Animation Philosophy](#animation-philosophy)
- [Core Animation Library](#core-animation-library)
- [Implementation Patterns](#implementation-patterns)
- [Performance Guidelines](#performance-guidelines)
- [Component Integration](#component-integration)
- [Best Practices](#best-practices)

---

## Animation Philosophy

ClaimGuardian's animation system follows these principles:

### Design Goals

- **Purposeful Motion**: Every animation serves a functional purpose
- **Consistent Timing**: Standardized duration and easing curves
- **Performance First**: GPU-accelerated transforms and opacity changes
- **Accessibility Aware**: Respects `prefers-reduced-motion`
- **Progressive Enhancement**: Works without JavaScript

### Motion Characteristics

- **Duration**: 200-500ms for most transitions
- **Easing**: Natural cubic-bezier curves
- **Stagger**: 100-150ms delays for sequential animations
- **Hover**: Quick 200ms responses
- **Page Transitions**: 300-400ms with subtle movement

---

## Core Animation Library

### Location: `/lib/animations.ts`

```typescript
import { Variants } from "framer-motion";

// Page-level transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

// Container for staggered children
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Basic entrance animations
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -10 },
  animate: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      type: "spring",
      damping: 15,
    },
  },
};

// Interactive animations
export const hoverScale: Variants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const hoverGlow: Variants = {
  hover: {
    boxShadow: "0 10px 30px rgba(0, 255, 0, 0.2)",
    transition: { duration: 0.2 },
  },
};

export const pressScale: Variants = {
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Specialized animations
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export const drawerSlide: Variants = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

// Loading animations
export const pulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};
```

---

## Implementation Patterns

### Page-Level Animation

```typescript
import { motion } from 'framer-motion'
import { pageTransition, staggerContainer, fadeInUp } from '@/lib/animations'

export function DashboardPage() {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div variants={staggerContainer}>
        <motion.div variants={fadeInUp}>
          <h1>Dashboard</h1>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatsSection />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <MainContent />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
```

### List Animation with Stagger

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/animations'

export function AnimatedList({ items }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={fadeInUp}
            layout
            exit={{ opacity: 0, x: -100 }}
          >
            <ListItem item={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

### Interactive Component Animation

```typescript
import { motion } from 'framer-motion'
import { hoverScale, pressScale } from '@/lib/animations'

export function AnimatedCard({ children, onClick }) {
  return (
    <motion.div
      variants={hoverScale}
      whileHover="hover"
      variants={pressScale}
      whileTap="tap"
      className="cursor-pointer"
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
```

### Modal Animation

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '@/lib/animations'

export function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalOverlay}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## Performance Guidelines

### GPU-Accelerated Properties

Always animate these properties for best performance:

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness, etc.)

### Avoid Animating

These properties cause layout thrashing:

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `font-size`

### Performance Optimizations

```typescript
// Use transform instead of changing position
// ✅ Good
const slideIn = {
  animate: { x: 0, opacity: 1 },
};

// ❌ Bad
const slideInBad = {
  animate: { left: 0, opacity: 1 },
};

// Use scale instead of changing dimensions
// ✅ Good
const grow = {
  animate: { scale: 1.1 },
};

// ❌ Bad
const growBad = {
  animate: { width: "110%", height: "110%" },
};
```

### Layout Animations

For layout changes, use Framer Motion's layout prop:

```typescript
<motion.div layout>
  {/* Content that changes size */}
</motion.div>
```

---

## Component Integration

### Dashboard Components

```typescript
// Insurance Dashboard
export function InsuranceDashboard() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate">
      <motion.div variants={staggerContainer}>
        <motion.div variants={fadeInUp}>
          <SearchFilterBar onFiltersChange={setFilters} />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div key={stat.id} variants={fadeInUp}>
                <StatsCard {...stat} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <PolicyList policies={filteredPolicies} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
```

### Form Components

```typescript
export function AnimatedForm() {
  const [step, setStep] = useState(1)

  return (
    <motion.div variants={fadeInUp}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideInRight}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <FormStep step={step} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
```

### Loading States

```typescript
export function LoadingComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        variants={spinner}
        animate="animate"
        className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full"
      />
      <motion.span
        variants={pulse}
        animate="animate"
        className="ml-3 text-gray-400"
      >
        Loading...
      </motion.span>
    </div>
  )
}
```

---

## Best Practices

### 1. Use Variants for Consistency

```typescript
// ✅ Good - Reusable variants
<motion.div variants={fadeInUp} />

// ❌ Bad - Inline animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
/>
```

### 2. Implement Exit Animations

```typescript
// ✅ Good - Smooth exit
<AnimatePresence>
  {isVisible && (
    <motion.div
      variants={fadeInUp}
      exit={{ opacity: 0, y: -20 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### 3. Consider Reduced Motion

```typescript
// Respect user preferences
const shouldReduceMotion = useReducedMotion()

<motion.div
  variants={shouldReduceMotion ? {} : fadeInUp}
  initial={shouldReduceMotion ? false : "initial"}
  animate={shouldReduceMotion ? false : "animate"}
>
  Content
</motion.div>
```

### 4. Use Layout Animations Sparingly

```typescript
// Only when necessary for layout changes
<motion.div layout layoutId="unique-id">
  <ResizableContent />
</motion.div>
```

### 5. Optimize Stagger Animations

```typescript
// Control stagger timing based on list size
const staggerDelay = Math.min(0.1, 0.5 / items.length);

const customStagger = {
  animate: {
    transition: { staggerChildren: staggerDelay },
  },
};
```

### 6. Handle Animation States

```typescript
const [isAnimating, setIsAnimating] = useState(false)

<motion.div
  onAnimationStart={() => setIsAnimating(true)}
  onAnimationComplete={() => setIsAnimating(false)}
  variants={complexAnimation}
>
  {!isAnimating && <InteractiveContent />}
</motion.div>
```

---

## Accessibility Considerations

### Reduced Motion Support

```css
/* Global CSS */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### React Hook for Reduced Motion

```typescript
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return shouldReduceMotion;
}
```

### Focus Management

```typescript
// Maintain focus during animations
export function AnimatedButton({ children, ...props }) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <motion.button
      ref={buttonRef}
      variants={hoverScale}
      whileHover="hover"
      onAnimationComplete={() => {
        // Ensure focus is maintained
        if (document.activeElement === buttonRef.current) {
          buttonRef.current?.focus()
        }
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
```

---

## Debugging Animations

### Animation Inspector

Add to components for debugging:

```typescript
<motion.div
  variants={fadeInUp}
  onAnimationStart={(definition) => {
    console.log('Animation started:', definition)
  }}
  onAnimationComplete={(definition) => {
    console.log('Animation completed:', definition)
  }}
  onUpdate={(latest) => {
    console.log('Animation values:', latest)
  }}
>
  Content
</motion.div>
```

### Performance Monitoring

```typescript
// Monitor animation performance
const [animationTime, setAnimationTime] = useState(0)

<motion.div
  onAnimationStart={() => setAnimationTime(Date.now())}
  onAnimationComplete={() => {
    const duration = Date.now() - animationTime
    if (duration > 500) {
      console.warn('Slow animation detected:', duration + 'ms')
    }
  }}
>
  Content
</motion.div>
```

---

## Future Enhancements

### Planned Additions

- Gesture-based animations (swipe, drag)
- Scroll-triggered animations
- Physics-based spring animations
- 3D transforms for depth effects
- SVG path animations for icons
- Particle system animations

### Performance Improvements

- Animation batching for better performance
- Intersection Observer for viewport-based animations
- Web Workers for complex calculations
- CSS custom properties integration

---

_Last updated: August 2025_
_Version: 1.0_
_Maintainer: Frontend Team_
