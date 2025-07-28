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

import { useState, useEffect, useRef } from 'react'
import { Upload, BrainCircuit, FileText, DollarSign } from 'lucide-react'
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
    title: "Create Your Digital Twin", 
    description: "Simply upload your insurance policy, deeds, and photos. Guardian instantly analyzes documents and begins building your asset's living profile." 
  },
  { 
    icon: BrainCircuit, 
    title: "Guardian Lifecycle Mgmt", 
    description: "From tracking warranties and maintenance to identifying risks, Guardian is your partner for the entire ownership journey." 
  },
  { 
    icon: FileText, 
    title: "Generate Ironclad Proof", 
    description: "When a claim is needed, automatically create professional estimates and reports that insurance companies can't ignore." 
  },
  { 
    icon: DollarSign, 
    title: "Maximize Your Equity", 
    description: "Use our tools to ensure you receive every dollar you're entitled to from claims, and protect your property's value over the long term." 
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 md:px-8 py-20 bg-[#0a0e1a]">
      <AnimatedSection className="max-w-6xl mx-auto">
        <h2 className="font-slab text-3xl md:text-4xl font-bold text-center">Your Property's Command Center</h2>
        <p className="mt-3 max-w-3xl mx-auto text-center text-gray-300">
          From considering a purchase to managing, maintaining, and eventually selling or donating, ClaimGuardian is your partner for the complete asset lifecycle.
        </p>
        <div className="mt-12 relative flex flex-col md:flex-row justify-between items-center">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-1/2 hidden md:block"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-700 -translate-x-1/2 md:hidden"></div>
          {steps.map((step, index) => (
            <AnimatedSection key={index} delay={index * 150} className="relative z-10 flex md:flex-col items-center text-center w-full md:w-1/4 p-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-primary bg-[#0D1117] flex items-center justify-center mb-4">
                <step.icon size={32} className="text-primary"/>
              </div>
              <div className="md:mt-4 text-left md:text-center ml-4 md:ml-0">
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{step.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </AnimatedSection>
    </section>
  )
}