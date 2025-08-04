/**
 * @fileMetadata
 * @purpose How It Works section with animated process steps
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["HowItWorks"]
 * @complexity medium
 * @tags ["landing", "process", "steps"]
 * @status active
 */
'use client'

import { Upload, BrainCircuit, FileText, DollarSign } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
// Animation hook reused from hero
const useInView = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.unobserve(entry.target)
      }
    }, options)

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [ref, options])

  return [ref, isInView] as const
}

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 })

  return (
    <div 
      ref={ref} 
      className={`${className} transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const steps = [
  { 
    icon: Upload, 
    title: "15-Min Setup", 
    description: "Snap photos, upload your policy. AI instantly creates your property's digital twin. Zero paperwork, maximum protection.",
    time: "15 minutes",
    result: "Complete property profile"
  },
  { 
    icon: BrainCircuit, 
    title: "24/7 AI Guardian", 
    description: "Your digital twin monitors everything: maintenance schedules, weather threats, coverage gaps. You sleep, we watch.",
    time: "Always on",
    result: "Proactive protection"
  },
  { 
    icon: FileText, 
    title: "Instant Claims Power", 
    description: "Damage happens? AI generates professional reports, estimates, and evidence packages in minutes, not weeks.",
    time: "Under 10 minutes",
    result: "Claim-ready documentation"
  },
  { 
    icon: DollarSign, 
    title: "Maximum Recovery", 
    description: "Get every dollar you deserve. Our AI finds hidden damages and fights for proper settlements. No money left behind.",
    time: "Days, not months",
    result: "Full claim value"
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 md:px-8 py-20 bg-[#0a0e1a]">
      <AnimatedSection className="max-w-6xl mx-auto">
        <h2 className="font-slab text-3xl md:text-4xl font-bold text-center">
          <span className="text-white">From Chaos to Control</span>
          <span className="block mt-2 text-2xl md:text-3xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">in 4 Simple Steps</span>
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-center text-xl text-gray-300">
          Transform your property from a liability into your most protected asset. No technical skills required.
        </p>
        <div className="mt-12 relative flex flex-col md:flex-row justify-between items-center">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-1/2 hidden md:block"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-700 -translate-x-1/2 md:hidden"></div>
          {steps.map((step, index) => (
            <AnimatedSection key={index} delay={index * 150} className="relative z-10 flex md:flex-col items-start md:items-center text-left md:text-center w-full md:w-1/4 p-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-primary bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 relative">
                <step.icon size={28} className="text-white"/>
                <div className="absolute -top-2 -right-2 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                  {index + 1}
                </div>
              </div>
              <div className="md:mt-4 ml-4 md:ml-0 flex-1">
                <div className="mb-2">
                  <div className="inline-block bg-green-400/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                    {step.time}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 mb-3 leading-relaxed">{step.description}</p>
                <div className="text-xs text-blue-400 font-medium">
                  ✓ {step.result}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </AnimatedSection>
    </section>
  )
}