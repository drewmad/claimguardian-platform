/**
 * @fileMetadata
 * @purpose How It Works section with process steps
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["HowItWorks"]
 * @complexity medium
 * @tags ["landing", "process", "steps"]
 * @status active
 */
'use client'

import { Upload, Brain, FileText, DollarSign } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Policy',
    description: 'Simply upload your insurance policy and any claim-related documents. Our AI instantly analyzes coverage limits and exclusions.'
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI reviews your policy, identifies key coverage areas, and builds a comprehensive claim strategy.'
  },
  {
    icon: FileText,
    title: 'Generate Documentation',
    description: 'Automatically create professional estimates, reports, and correspondence that insurance companies can&apos;t ignore.'
  },
  {
    icon: DollarSign,
    title: 'Maximize Your Settlement',
    description: 'Track your claim progress and use our negotiation tools to ensure you receive every dollar you&apos;re entitled to.'
  }
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-slate-900/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          How It Works
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          From policy upload to settlement check, we&apos;ve streamlined every step of the claims process.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                {/* Connector line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-600 to-transparent" />
                )}
                
                <div className="text-center">
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-4 bg-blue-600/10 rounded-full flex items-center justify-center border-2 border-blue-600/30">
                      <Icon className="w-10 h-10 text-blue-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}