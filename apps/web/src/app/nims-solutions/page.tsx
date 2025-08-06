/**
 * NIMS Solutions Landing Page
 * Showcases FEMA NIMS compliance capabilities for government and enterprise
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Users, 
  Radio, 
  FileText, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Globe,
  Building,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react'

export default function NIMSSolutionsPage() {
  const features = [
    {
      icon: Shield,
      title: 'ICS Command Structure',
      description: 'Full Incident Command System with Type 1-5 complexity management'
    },
    {
      icon: Users,
      title: 'Resource Management',
      description: 'NIMS-typed resource tracking and deployment optimization'
    },
    {
      icon: Radio,
      title: 'Emergency Communications',
      description: 'CAP 1.2 and EDXL protocol implementation for multi-agency coordination'
    },
    {
      icon: FileText,
      title: 'Automated ICS Forms',
      description: 'Generate ICS-201, 202, 203, and 205 forms automatically'
    },
    {
      icon: Activity,
      title: 'Disaster Workflows',
      description: 'Pre-configured response workflows for all disaster types'
    },
    {
      icon: Globe,
      title: 'External Integration',
      description: 'Connect with NWS, FEMA, Red Cross, and local agencies'
    }
  ]

  const benefits = [
    {
      metric: '75%',
      label: 'Faster Response Time',
      description: 'Automated workflows reduce coordination delays'
    },
    {
      metric: '100%',
      label: 'NIMS Compliant',
      description: 'Meets all federal requirements for emergency management'
    },
    {
      metric: '60%',
      label: 'Cost Reduction',
      description: 'Streamlined operations reduce emergency response costs'
    },
    {
      metric: '24/7',
      label: 'Always Ready',
      description: 'Cloud-based system available anytime, anywhere'
    }
  ]

  const customers = [
    'Monroe County Emergency Management',
    'Florida Division of Emergency Management',
    'Miami-Dade Fire Rescue',
    'Florida Power & Light',
    'University of Florida Health'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <section className="relative px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-4 bg-red-600 text-white">FEMA NIMS CERTIFIED</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Enterprise Emergency Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">
              The first commercial platform achieving full FEMA NIMS compliance. 
              Coordinate multi-agency disaster response with AI-powered efficiency.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/nims">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  View Live Dashboard
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                Schedule Demo
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex justify-center items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-white">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">FEMA Certified</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-blue-500" />
              <span className="text-sm">GSA Schedule Eligible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 lg:px-8 bg-gray-800/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              Complete NIMS Compliance Platform
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Everything you need for federal emergency management standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-red-500 mb-4" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              Proven Results
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Measurable improvements in emergency response operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-red-500 mb-2">
                  {benefit.metric}
                </div>
                <div className="text-xl font-semibold text-white mb-2">
                  {benefit.label}
                </div>
                <div className="text-sm text-gray-400">
                  {benefit.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 lg:px-8 bg-gray-800/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              Built for Every Emergency
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle className="text-white">Natural Disasters</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Hurricanes & Tropical Storms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Floods & Storm Surge
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Wildfires & Drought
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Tornadoes & Severe Weather
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <Building className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-white">Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Power Grid Failures
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Water System Disruptions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Transportation Incidents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Communications Outages
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <Users className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-white">Public Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Mass Casualty Events
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Hazmat Incidents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Public Health Emergencies
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Evacuation Operations
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Logos */}
      <section className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              Trusted by Leading Organizations
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {customers.map((customer, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm font-medium">
                    {customer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-r from-red-900 to-red-800">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready for the Next Emergency?
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
            Join federal, state, and local agencies already using ClaimGuardian 
            for NIMS-compliant emergency management.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-red-900 hover:bg-gray-100">
              Request Federal Demo
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-red-900">
              Download Compliance Guide
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <Clock className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white font-semibold">30-Day Implementation</p>
              <p className="text-gray-200 text-sm">Rapid deployment process</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white font-semibold">FedRAMP Ready</p>
              <p className="text-gray-200 text-sm">Federal security standards</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white font-semibold">99.99% Uptime</p>
              <p className="text-gray-200 text-sm">Always available when needed</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}