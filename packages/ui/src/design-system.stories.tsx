import type { Meta, StoryObj } from '@storybook/react';
import { Shield, Home, FileText, Users, Settings, Bell, Star, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';

const meta: Meta = {
  title: 'Design System/Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete design system showcase demonstrating ClaimGuardian UI components with liquid glass effects and insurance-focused examples.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Complete design system showcase
export const CompleteShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ClaimGuardian Design System
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A comprehensive UI component library built for insurance claim advocacy with 
            liquid glass effects and dark theme optimization.
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-blue-500 rounded-lg"></div>
              <p className="text-sm text-gray-400">Primary Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-purple-500 rounded-lg"></div>
              <p className="text-sm text-gray-400">Secondary Purple</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-green-500 rounded-lg"></div>
              <p className="text-sm text-gray-400">Success Green</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-red-500 rounded-lg"></div>
              <p className="text-sm text-gray-400">Error Red</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="error">Error</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button>Default Size</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Settings className="h-4 w-4" /></Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button leftIcon={<Shield className="h-4 w-4" />}>With Icon</Button>
            <Button rightIcon={<Star className="h-4 w-4" />}>Trailing Icon</Button>
            <Button className="liquid-glass border-white/20">Liquid Glass</Button>
            <Button className="liquid-glass-accent border-blue-500/30">Accent Glass</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Info className="h-3 w-3 mr-1" />
              Processing
            </Badge>
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <X className="h-3 w-3 mr-1" />
              Denied
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4">
            <Badge className="liquid-glass border-white/20 text-white">
              Premium
            </Badge>
            <Badge className="liquid-glass-accent border-blue-500/30 text-blue-300">
              VIP
            </Badge>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Standard Card</CardTitle>
                <CardDescription className="text-gray-400">
                  Basic card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  This is a standard card component with dark theme styling.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            {/* Liquid Glass Card */}
            <Card className="liquid-glass border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-white">Liquid Glass Card</CardTitle>
                <CardDescription className="text-gray-300">
                  Enhanced with glassmorphism effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-200">
                  Premium card with backdrop blur and transparency.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="liquid-glass-accent border-blue-500/30">
                  Premium
                </Button>
              </CardFooter>
            </Card>

            {/* Insurance Policy Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-base">Home Insurance</CardTitle>
                    <CardDescription className="text-gray-400">
                      Policy #HO-2024-001
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-900/30 text-green-400 border-green-600/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Coverage:</span>
                  <span className="text-white">$500,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Premium:</span>
                  <span className="text-white">$2,400/year</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                  View Policy
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Form Components</h2>
          <Card className="bg-gray-800 border-gray-700 max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Property Information</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your property details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-white">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, Miami, FL"
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
                  <Label htmlFor="sqft" className="text-white">Sq Ft</Label>
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
                <Input
                  id="coverage"
                  type="number"
                  placeholder="500000"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Property</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Dashboard Example */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Dashboard Example</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-100">Active Policies</CardDescription>
                <CardTitle className="text-3xl font-bold">12</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-blue-100">
                  <Home className="h-4 w-4 mr-2" />
                  <span>Properties covered</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-800 border-0 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-100">Claims Settled</CardDescription>
                <CardTitle className="text-3xl font-bold">8</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-100">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Successful claims</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-100">Total Recovered</CardDescription>
                <CardTitle className="text-3xl font-bold">$127K</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-purple-100">
                  <Star className="h-4 w-4 mr-2" />
                  <span>Above estimates</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-0 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-100">Active Claims</CardDescription>
                <CardTitle className="text-3xl font-bold">3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-orange-100">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>In progress</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-400 border-t border-gray-800 pt-8">
          <p>ClaimGuardian UI Components • Built with React, TypeScript, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Liquid Glass Effects Showcase
export const LiquidGlassShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Liquid Glass Effects
          </h1>
          <p className="text-gray-400 text-lg">
            Premium glassmorphism effects for modern insurance interfaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Liquid Glass */}
          <Card className="liquid-glass border-white/10 text-white">
            <CardHeader>
              <CardTitle>Basic Liquid Glass</CardTitle>
              <CardDescription className="text-gray-300">
                Subtle backdrop blur with transparency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="liquid-glass border-white/20">
                  Glass Button
                </Button>
                <Badge className="liquid-glass border-white/20 text-white">
                  Premium
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Accent Liquid Glass */}
          <Card className="liquid-glass-accent border-blue-500/30 text-white">
            <CardHeader>
              <CardTitle>Accent Liquid Glass</CardTitle>
              <CardDescription className="text-blue-200">
                Gradient background with blue accent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="liquid-glass-accent border-blue-500/30">
                  Accent Button
                </Button>
                <Badge className="liquid-glass-accent border-blue-500/30 text-blue-300">
                  <Star className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medium Glass Effect */}
          <Card className="liquid-glass-medium border-white/15 text-white">
            <CardHeader>
              <CardTitle>Medium Glass Effect</CardTitle>
              <CardDescription className="text-gray-200">
                Enhanced blur with stronger background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Glass input field"
                className="liquid-glass border-white/20 text-white placeholder:text-gray-300"
              />
            </CardContent>
          </Card>

          {/* Strong Glass Effect */}
          <Card className="liquid-glass-strong border-white/20 text-white">
            <CardHeader>
              <CardTitle>Strong Glass Effect</CardTitle>
              <CardDescription className="text-gray-100">
                Maximum blur with solid feel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-white">Premium Feature</Label>
                <Input
                  placeholder="Enterprise input"
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Guide */}
        <Card className="liquid-glass border-white/10 text-white">
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">CSS Classes Available:</h4>
                <ul className="space-y-1 text-gray-300">
                  <li><code className="bg-gray-800 px-2 py-1 rounded">.liquid-glass</code> - Basic effect</li>
                  <li><code className="bg-gray-800 px-2 py-1 rounded">.liquid-glass-medium</code> - Enhanced</li>
                  <li><code className="bg-gray-800 px-2 py-1 rounded">.liquid-glass-strong</code> - Maximum</li>
                  <li><code className="bg-gray-800 px-2 py-1 rounded">.liquid-glass-accent</code> - With gradient</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Best Practices:</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• Use on dark backgrounds for best effect</li>
                  <li>• Combine with subtle borders</li>
                  <li>• Apply to containers, not individual elements</li>
                  <li>• Ensure sufficient contrast for text</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
