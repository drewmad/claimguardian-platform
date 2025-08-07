import type { Meta, StoryObj } from '@storybook/react';
import { Heart, MessageSquare, Share2, MoreHorizontal, MapPin, Calendar, Users, DollarSign } from 'lucide-react';

import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile card component with header, content, and footer sections. Perfect for displaying structured information with liquid glass effects.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a card description that provides context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          This is the main content area of the card where you can place any information.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Action</Button>
      </CardFooter>
    </Card>
  ),
};

// Simple card without footer
export const Simple: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>
          A card without a footer section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
          Sed do eiusmod tempor incididunt ut labore.
        </p>
      </CardContent>
    </Card>
  ),
};

// Property insurance card example
export const PropertyInsurance: Story = {
  render: () => (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white">Home Insurance Policy</CardTitle>
            <CardDescription className="text-gray-400">
              Policy #: HO-2024-001234
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-600/30">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-300">
            <MapPin className="h-4 w-4 mr-2" />
            Miami, FL
          </div>
          <div className="flex items-center text-gray-300">
            <Calendar className="h-4 w-4 mr-2" />
            Exp: 12/2025
          </div>
          <div className="flex items-center text-gray-300">
            <DollarSign className="h-4 w-4 mr-2" />
            $2,400/year
          </div>
          <div className="flex items-center text-gray-300">
            <Users className="h-4 w-4 mr-2" />
            4 covered
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            Coverage: $500,000 dwelling, $300,000 personal property
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700">
          View Details
        </Button>
        <Button className="flex-1">
          File Claim
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Liquid glass card
export const LiquidGlass: Story = {
  render: () => (
    <Card className="liquid-glass border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-white">Liquid Glass Card</CardTitle>
        <CardDescription className="text-gray-300">
          Enhanced with glassmorphism effects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-200">
          This card demonstrates the liquid glass effect with backdrop blur 
          and subtle transparency for a premium feel.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="liquid-glass-accent border-blue-500/30">
          Premium Action
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Social media card example
export const SocialPost: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
          <div>
            <CardTitle className="text-base">John Doe</CardTitle>
            <CardDescription>2 hours ago</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm mb-4">
          Just got my insurance claim approved thanks to AI assistance! 
          The process was so much smoother than expected. 
          Highly recommend ClaimGuardian! 🏠✨
        </p>
        <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center text-gray-400">
          [Image placeholder]
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            <Heart className="h-4 w-4 mr-1" />
            24
          </Button>
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            <MessageSquare className="h-4 w-4 mr-1" />
            5
          </Button>
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

// Stats card
export const StatsCard: Story = {
  render: () => (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-blue-100">
          Total Claims Processed
        </CardDescription>
        <CardTitle className="text-3xl font-bold text-white">
          1,247
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-blue-100">
          <span className="text-green-300">+12%</span>
          <span className="ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  ),
};

// Loading card
export const Loading: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="animate-pulse">
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </CardFooter>
    </Card>
  ),
};

// Card grid example
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
          <CardDescription>First card in the grid</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Content for the first card.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
          <CardDescription>Second card in the grid</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Content for the second card.</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Wide Card</CardTitle>
          <CardDescription>This card spans both columns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This is a wider card that takes up two columns in the grid.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
