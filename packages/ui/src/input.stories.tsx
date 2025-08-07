import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useState } from 'react';

import { Input } from './input';
import { Label } from './label';
import { Button } from './button';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable input component with error display and various styling options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic inputs
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello World',
    placeholder: 'Enter text...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Enter email...',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

// Input types
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email...',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

// Dark theme variations
export const DarkTheme: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        placeholder="Dark theme input"
        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500"
      />
      <Input
        placeholder="With error"
        error="This field is required"
        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Liquid glass effect
export const LiquidGlass: Story = {
  render: () => (
    <Input
      placeholder="Liquid glass input"
      className="liquid-glass border-white/20 text-white placeholder:text-gray-300 focus:border-blue-400/50 focus:ring-blue-400/25"
    />
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// With icons (using custom styling)
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Full name"
          className="pl-10"
        />
      </div>
      
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="email"
          placeholder="Email address"
          className="pl-10"
        />
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search properties..."
          className="pl-10"
        />
      </div>
    </div>
  ),
};

// Password with toggle visibility
export const PasswordWithToggle: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          className="pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="policy">Policy Number</Label>
        <Input
          id="policy"
          placeholder="HO-2024-001234"
          error="Please enter a valid policy number"
        />
      </div>
      
      <Button className="w-full">Submit</Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Insurance-specific inputs
export const InsuranceForm: Story = {
  render: () => (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <h3 className="text-white font-semibold mb-4">Property Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="address" className="text-white">Property Address</Label>
        <Input
          id="address"
          placeholder="123 Main St, Miami, FL 33101"
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year" className="text-white">Year Built</Label>
          <Input
            id="year"
            type="number"
            placeholder="1995"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sqft" className="text-white">Square Feet</Label>
          <Input
            id="sqft"
            type="number"
            placeholder="2,500"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="coverage" className="text-white">Coverage Amount</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="coverage"
            type="number"
            placeholder="500,000"
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );
}
