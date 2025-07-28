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
    <section className="py-16 md:py-24 bg-slate-900/50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Who We Serve
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Whether you're a homeowner facing your first claim or a professional managing multiple properties, ClaimGuardian has the tools you need.
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
      </div>
    </section>
  )
}