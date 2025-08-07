# ClaimGuardian UI Storybook

This directory contains the Storybook configuration for the ClaimGuardian UI component library.

## Overview

Storybook is used to develop, test, and document our UI components in isolation. It provides:

- **Component Development**: Build components in isolation
- **Visual Testing**: See components across different states and variants
- **Documentation**: Automatically generated docs from component props
- **Accessibility Testing**: Built-in a11y addon for accessibility checks
- **Dark Theme Support**: Optimized for ClaimGuardian's dark theme

## Getting Started

### Install Dependencies

```bash
cd packages/ui
pnpm install
```

### Run Storybook

```bash
# From the UI package directory
pnpm storybook

# Or from the workspace root
pnpm --filter @claimguardian/ui storybook
```

Storybook will start on `http://localhost:6006`

### Build Storybook

```bash
pnpm storybook:build
```

## Configuration

### Main Configuration (`main.js`)

- **Stories**: Automatically discovers `*.stories.tsx` files
- **Addons**: Essential addons for enhanced development
- **Framework**: React with Vite for fast builds
- **TypeScript**: Full TypeScript support with react-docgen

### Preview Configuration (`preview.js`)

- **Dark Theme**: Default dark background
- **Responsive Viewports**: Mobile, tablet, desktop presets
- **Global Styles**: Includes Tailwind CSS and liquid glass effects
- **Controls**: Enhanced prop controls for interactive development

## Available Stories

### Core Components

- **Button** (`button.stories.tsx`)
  - All variants (default, secondary, outline, ghost, etc.)
  - Loading states and icon support
  - Liquid glass effects
  - Size variations

- **Card** (`card.stories.tsx`)
  - Standard and liquid glass cards
  - Insurance policy examples
  - Dashboard components
  - Form layouts

- **Badge** (`badge.stories.tsx`)
  - Status indicators
  - Insurance-specific badges
  - Dark theme variants
  - Interactive examples

- **Input** (`input.stories.tsx`)
  - Form inputs with validation
  - Icon integration
  - Password visibility toggle
  - Insurance form examples

### Design System Showcase

- **Complete Showcase** (`design-system.stories.tsx`)
  - Full design system overview
  - Color palette
  - Component interactions
  - Dashboard examples

- **Liquid Glass Effects**
  - Glassmorphism variants
  - Usage guidelines
  - Best practices

## Component Development Workflow

1. **Create Component**: Build your component in `src/`
2. **Add Story**: Create `*.stories.tsx` file with examples
3. **Test Variants**: Use Storybook controls to test different props
4. **Document**: Add JSDoc comments for automatic documentation
5. **Accessibility**: Use the a11y addon to check accessibility
6. **Export**: Add component to `src/index.tsx`

## Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './my-component';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description here.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Define control types
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

## Addons Included

- **@storybook/addon-essentials**: Core addons (controls, actions, viewport, etc.)
- **@storybook/addon-a11y**: Accessibility testing
- **@storybook/addon-docs**: Automatic documentation
- **@storybook/addon-interactions**: Component interaction testing
- **@storybook/addon-links**: Link between stories

## ClaimGuardian Theme

### Dark Theme by Default

All stories are optimized for dark theme matching the ClaimGuardian platform:

- Background: `slate-950`
- Text: `white`
- Components: Dark variants

### Liquid Glass Effects

Special CSS classes for premium glassmorphism effects:

- `.liquid-glass` - Basic glass effect
- `.liquid-glass-medium` - Enhanced blur
- `.liquid-glass-strong` - Maximum effect
- `.liquid-glass-accent` - Gradient accent

### Insurance Context

Components include insurance-specific examples:

- Policy management
- Claim processing
- Property information
- Status indicators

## Testing

### Visual Testing

Use Storybook to:

- Test component variants
- Verify responsive behavior
- Check dark theme compatibility
- Validate accessibility

### Accessibility Testing

The a11y addon automatically:

- Checks color contrast
- Validates ARIA attributes
- Tests keyboard navigation
- Ensures semantic HTML

### Interaction Testing

```typescript
export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    await expect(canvas.getByText('Clicked')).toBeInTheDocument();
  },
};
```

## Best Practices

### Story Organization

- Group related components under same category
- Use descriptive story names
- Include comprehensive examples
- Show both basic and advanced usage

### Documentation

- Add component descriptions
- Document prop types with JSDoc
- Include usage examples
- Explain design decisions

### Accessibility

- Test with a11y addon
- Include keyboard navigation examples
- Ensure proper ARIA labels
- Test with screen readers

### Responsive Design

- Use viewport addon to test breakpoints
- Include mobile-specific examples
- Test component behavior at different sizes

## Deployment

Storybook can be deployed to:

- **Vercel**: Automatic deployment from GitHub
- **Netlify**: Static site hosting
- **GitHub Pages**: Free hosting for public repos
- **Internal Servers**: Self-hosted documentation

```bash
# Build for deployment
pnpm storybook:build

# Output in storybook-static/
```

## Troubleshooting

### Common Issues

1. **Styles not loading**: Ensure `styles.css` is imported in `preview.js`
2. **Components not found**: Check story file naming and paths
3. **TypeScript errors**: Update `tsconfig.json` paths
4. **Build failures**: Clear cache with `pnpm dlx storybook@latest dev --no-manager-cache`

### Development Tips

- Use hot reload for rapid development
- Leverage args for interactive props
- Use actions addon to track events
- Test edge cases with different prop combinations

## Integration with Monorepo

Storybook is integrated with the ClaimGuardian monorepo:

- **Turbo**: Cached builds and development
- **pnpm**: Workspace dependency management
- **TypeScript**: Shared configurations
- **Tailwind**: Consistent styling

Run from workspace root:

```bash
# Run Storybook for UI package
turbo storybook --filter=@claimguardian/ui

# Build all packages including Storybook
turbo build
```
