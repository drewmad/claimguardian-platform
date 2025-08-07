import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle, XCircle, AlertCircle, Clock, Star, Shield } from 'lucide-react';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for displaying status indicators, labels, and notifications.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Badge appearance variant',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

// Status badges
export const StatusActive: Story = {
  render: () => (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="h-3 w-3 mr-1" />
      Active
    </Badge>
  ),
};

export const StatusInactive: Story = {
  render: () => (
    <Badge className="bg-red-100 text-red-800 border-red-200">
      <XCircle className="h-3 w-3 mr-1" />
      Inactive
    </Badge>
  ),
};

export const StatusPending: Story = {
  render: () => (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  ),
};

export const StatusWarning: Story = {
  render: () => (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
      <AlertCircle className="h-3 w-3 mr-1" />
      Warning
    </Badge>
  ),
};

// Insurance-specific badges
export const ClaimStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        Draft
      </Badge>
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Under Review
      </Badge>
      <Badge className="bg-green-100 text-green-800 border-green-200">
        Approved
      </Badge>
      <Badge className="bg-red-100 text-red-800 border-red-200">
        Denied
      </Badge>
      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
        Settled
      </Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const PolicyTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Shield className="h-3 w-3 mr-1" />
        Homeowner
      </Badge>
      <Badge className="bg-teal-100 text-teal-800 border-teal-200">
        <Shield className="h-3 w-3 mr-1" />
        Flood
      </Badge>
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Shield className="h-3 w-3 mr-1" />
        Wind
      </Badge>
      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
        <Shield className="h-3 w-3 mr-1" />
        Umbrella
      </Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Dark theme badges
export const DarkTheme: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-gray-800 text-gray-200 border-gray-700">
        Dark Default
      </Badge>
      <Badge className="bg-blue-900/30 text-blue-300 border-blue-600/30">
        Blue Dark
      </Badge>
      <Badge className="bg-green-900/30 text-green-300 border-green-600/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success Dark
      </Badge>
      <Badge className="bg-red-900/30 text-red-300 border-red-600/30">
        <XCircle className="h-3 w-3 mr-1" />
        Error Dark
      </Badge>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'padded',
  },
};

// Premium badges with liquid glass
export const LiquidGlass: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="liquid-glass border-white/20 text-white">
        Premium
      </Badge>
      <Badge className="liquid-glass-accent border-blue-500/30 text-blue-300">
        <Star className="h-3 w-3 mr-1" />
        VIP
      </Badge>
      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300 backdrop-blur-sm">
        Enterprise
      </Badge>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'padded',
  },
};

// Size variations
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge className="text-xs px-2 py-0.5">
        Small
      </Badge>
      <Badge className="text-sm px-2.5 py-0.5">
        Default
      </Badge>
      <Badge className="text-base px-3 py-1">
        Large
      </Badge>
    </div>
  ),
};

// Interactive badges
export const Interactive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="cursor-pointer hover:bg-primary/90 transition-colors">
        Clickable
      </Badge>
      <Badge className="cursor-pointer hover:bg-secondary/90 transition-colors" variant="secondary">
        Hoverable
      </Badge>
      <Badge className="cursor-pointer hover:bg-destructive/90 transition-colors" variant="destructive">
        Interactive
      </Badge>
    </div>
  ),
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Light Theme</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
      <div className="space-y-2 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-white">Dark Theme</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-gray-700 text-gray-200">Dark Default</Badge>
          <Badge className="bg-gray-600 text-gray-100">Dark Secondary</Badge>
          <Badge className="bg-red-900/50 text-red-300">Dark Error</Badge>
          <Badge className="border-gray-600 text-gray-300" variant="outline">Dark Outline</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
