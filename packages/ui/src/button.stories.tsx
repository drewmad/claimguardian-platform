import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Save, ArrowRight, Plus, Trash2, Download } from 'lucide-react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced button component with loading states, icons, and accessibility features. Supports all variants including liquid glass effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'link', 'success', 'error', 'destructive'],
      description: 'Button appearance variant',
    },
    size: {
      control: 'select', 
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    loadingText: {
      control: 'text',
      description: 'Text to show when loading',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    children: {
      control: 'text',
      description: 'Button text',
    },
  },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Semantic variants
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
    leftIcon: <Trash2 className="h-4 w-4" />,
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Plus className="h-4 w-4" />,
    'aria-label': 'Add item',
  },
};

// States
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Submit',
    loadingText: 'Processing...',
  },
};

export const LoadingWithoutText: Story = {
  args: {
    loading: true,
    children: 'Submit',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Save className="h-4 w-4" />,
    children: 'Save Document',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Continue',
  },
};

export const WithBothIcons: Story = {
  args: {
    leftIcon: <Download className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Download & Continue',
  },
};

// Liquid glass with custom styling
export const LiquidGlass: Story = {
  args: {
    children: 'Liquid Glass Button',
    className: 'liquid-glass border-white/20 hover:border-white/30',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const LiquidGlassAccent: Story = {
  args: {
    children: 'Premium Feature',
    className: 'liquid-glass-accent border-blue-500/30 hover:border-blue-400/40',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Button group example
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm">Cancel</Button>
      <Button variant="secondary" size="sm">Save Draft</Button>
      <Button size="sm" leftIcon={<Save className="h-4 w-4" />}>
        Save & Continue
      </Button>
    </div>
  ),
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
      <Button variant="error">Error</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    children: 'Interactive Button',
    variant: 'default',
    size: 'default',
    loading: false,
    disabled: false,
    loadingText: 'Loading...',
  },
};
