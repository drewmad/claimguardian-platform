# Global Styling Refactoring Plan

This document outlines the plan to refactor the application's styling to use the custom classes defined in `globals.css` as the single source of truth for core components.

## 1. The Goal

The goal is to centralize the styling for core UI components like buttons, cards, and inputs into `globals.css`. This will make global style changes easier and ensure a consistent look and feel across the application.

## 2. The Plan

The refactoring will involve two main steps:
1.  **Update the UI Component Files:** Modify the React components in `apps/web/src/components/ui/` to use the custom CSS classes from `globals.css`.
2.  **Clean up `tailwind.config.js`:** Remove the color and style definitions that will become redundant after the refactoring.

---

## 3. Required Changes by File

### 3.1. `apps/web/src/components/ui/button.tsx`

The `buttonVariants` object will be updated to use the `.btn-primary` and `.btn-secondary` classes.

**Current Code:**
```javascript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // ... other variants
      },
      // ...
    },
  }
)
```

**Proposed Code:**
```javascript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "btn-primary", // Use the custom class
        secondary: "btn-secondary", // Use the custom class
        // ... other variants will remain the same
      },
      // ...
    },
  }
)
```

### 3.2. `apps/web/src/components/ui/card.tsx`

The `Card` component will be updated to use the `.card-bg` class.

**Current Code:**
```jsx
const Card = React.forwardRef<...>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
```

**Proposed Code:**
```jsx
const Card = React.forwardRef<...>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-bg rounded-lg shadow-sm", className)} // Use card-bg and keep other relevant classes
    {...props}
  />
))
```

### 3.3. `apps/web/src/components/ui/input.tsx`

The `Input` component will be updated to use the `.form-input` class.

**Current Code:**
```jsx
const Input = React.forwardRef<...>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ...",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
```

**Proposed Code:**
```jsx
const Input = React.forwardRef<...>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn("form-input flex h-10 w-full rounded-md px-3 py-2 text-sm ...", className)} // Add form-input and keep other relevant classes
      ref={ref}
      {...props}
    />
  )
})
```

### 3.4. `apps/web/tailwind.config.js`

The following color definitions should be removed from the `theme.extend.colors` object, as they will be defined in `globals.css`.

**To Be Removed:**
```javascript
// These are likely defined under different names, but the concept is to remove the colors used by the components.
// Based on the current config, these might be part of the default theme and not explicitly in the extend section.
// The key is to remove the definitions for:
// - The colors used in the 'default' and 'secondary' button variants.
// - The 'bg-card' and 'text-card-foreground' colors.
// - The 'border-input' and 'bg-background' colors.
```
After reviewing your `tailwind.config.js`, it seems you are using custom color names like `bgPrimary`, `bgSecondary`, etc. The `button.tsx` and other components are likely using Tailwind's default `primary`, `secondary`, `card`, etc. which are not explicitly defined in your config. The refactor will move the styling away from the Tailwind theme and into `globals.css`.

---

## 4. Next Steps

Once this plan is approved, I will proceed with making the code changes as described above.
