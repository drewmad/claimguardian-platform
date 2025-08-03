/**
 * @fileMetadata
 * @purpose Who We Serve section showcasing target customers
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["WhoWeServe"]
 * @complexity medium
 * @tags ["landing", "services", "customers"]
 * @status active
 */
'use client'

import { Home, Building, Users, Shield } from 'lucide-react'
import Image from 'next/image'

const segments = [
  {
    icon: Home,
    title: 'Homeowners',
    description: 'From hurricanes to hidden damages, we help homeowners navigate the claims process and secure maximum settlements.'
  },
  {
    icon: Building,
    title: 'Business Owners',
    description: 'Protect your livelihood with proper documentation and expert guidance through commercial property claims.'
  },
  {
    icon: Users,
    title: 'Property Managers',
    description: 'Efficiently handle multiple claims across your portfolio with our streamlined documentation system.'
  },
  {
    icon: Shield,
    title: 'Public Adjusters',
    description: 'Enhance your services with AI-powered documentation and evidence collection tools.'
  }
]

export function WhoWeServe() {
  return (
    <section id="who-we-serve" className="py-16 md:py-24 bg-slate-900/50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Who We Serve
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Whether you&apos;re a homeowner facing your first claim or a professional managing multiple properties, ClaimGuardian has the tools you need.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {segments.map((segment, index) => {
            const Icon = segment.icon
            return (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-600/10 rounded-full flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{segment.title}</h3>
                <p className="text-slate-400">{segment.description}</p>
              </div>
            )
          })}
        </div>

        {/* Property Showcase Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-white">
            Protecting Florida Properties of All Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <div className="aspect-video relative">
                <Image
                  src="/images/property-waterfront-estate.jpg"
                  alt="Waterfront Estate Protection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-semibold text-lg">Waterfront Estates</h4>
                  <p className="text-gray-300 text-sm">Hurricane-resistant documentation & flood protection</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <div className="aspect-video relative">
                <Image
                  src="/images/property-modern-home.jpg"
                  alt="Modern Home Protection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-semibold text-lg">Modern Homes</h4>
                  <p className="text-gray-300 text-sm">Smart technology integration & comprehensive coverage</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <div className="aspect-video relative">
                <Image
                  src="/images/mobile-app-interface.jpg"
                  alt="Mobile App Interface"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-semibold text-lg">Mobile-First Tools</h4>
                  <p className="text-gray-300 text-sm">Document damage anywhere, anytime with AI assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}