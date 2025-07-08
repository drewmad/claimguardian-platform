/**
 * @fileMetadata
 * @purpose Features section with expandable cards
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["Features"]
 * @complexity high
 * @tags ["landing", "features", "interactive"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { Shield, Zap, Eye, FileCheck, ChevronRight } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'

const features = [
  {
    icon: Shield,
    title: 'Policy Shield Analysis',
    preview: 'Uncover hidden coverage and protect against denials',
    fullContent: {
      title: 'Never Miss Hidden Coverage Again',
      description: 'Our AI-powered Policy Shield reads between the lines of your insurance policy, identifying coverage opportunities that adjusters hope you&apos;ll miss.',
      benefits: [
        'Instant policy analysis with coverage mapping',
        'Identifies commonly overlooked provisions',
        'Alerts for time-sensitive claim requirements',
        'Comparison with similar successful claims'
      ]
    }
  },
  {
    icon: Zap,
    title: 'Lightning-Fast Documentation',
    preview: 'Generate comprehensive claim packages in minutes',
    fullContent: {
      title: 'Professional Documentation at Light Speed',
      description: 'Stop spending weeks gathering documents. Our system automatically generates everything you need for a bulletproof claim.',
      benefits: [
        'Auto-generated damage estimates',
        'Professional loss statements',
        'Evidence organization and indexing',
        'Adjuster-ready claim packages'
      ]
    }
  },
  {
    icon: Eye,
    title: 'Real-Time Claim Tracking',
    preview: 'Monitor every step of your claim journey',
    fullContent: {
      title: 'Complete Visibility Into Your Claim',
      description: 'Never wonder about your claim status again. Track every interaction, deadline, and milestone in real-time.',
      benefits: [
        'Live status updates and notifications',
        'Deadline reminders and alerts',
        'Communication history tracking',
        'Settlement progress monitoring'
      ]
    }
  },
  {
    icon: FileCheck,
    title: 'Evidence Vault',
    preview: 'Secure, organized storage for all claim materials',
    fullContent: {
      title: 'Your Claims Command Center',
      description: 'Keep every photo, document, and piece of correspondence organized and instantly accessible in your secure Evidence Vault.',
      benefits: [
        'Unlimited secure cloud storage',
        'Automatic backup and versioning',
        'Smart categorization and search',
        'One-click sharing with adjusters'
      ]
    }
  }
]

export function Features() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const { openModal } = useModalStore()

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Powerful Features Built for Results
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Every feature is designed with one goal: maximizing your insurance settlement.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isExpanded = expandedIndex === index
            
            return (
              <div
                key={index}
                className={`
                  bg-slate-800/50 rounded-lg p-6 border border-slate-700 
                  hover:border-blue-600/50 transition-all duration-300 cursor-pointer
                  ${isExpanded ? 'md:col-span-2' : ''}
                `}
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    {!isExpanded ? (
                      <p className="text-slate-400">{feature.preview}</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold mb-2">
                            {feature.fullContent.title}
                          </h4>
                          <p className="text-slate-400 mb-4">
                            {feature.fullContent.description}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {feature.fullContent.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal('content', {
                              title: feature.title,
                              content: feature.fullContent
                            })
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                        >
                          Learn More
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <ChevronRight 
                    className={`
                      w-5 h-5 text-slate-500 transition-transform
                      ${isExpanded ? 'rotate-90' : ''}
                    `}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}