/**
 * @fileMetadata
 * @purpose Value proposition section with animated cards
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants"]
 * @exports ["Features"]
 * @complexity medium
 * @tags ["landing", "value-props", "animated"]
 * @status active
 */
'use client'

import { Clock, DollarSign, ShieldCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { COLORS } from '@/lib/constants'

// Animation hook reused
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

export function Features() {
  return (
    <section className="px-4 md:px-8 py-20 bg-black/10">
      <AnimatedSection className="max-w-6xl mx-auto text-center">
        <h2 className="font-slab text-3xl md:text-4xl font-bold">
          <span className="text-white">Stop Losing Money.</span>
          <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Start Protecting Everything.</span>
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
          Your property is your biggest investment. ClaimGuardian turns it into your smartest one.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="value-prop-card p-8 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-black">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Save 20+ Hours Monthly</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-green-400">End the paperwork nightmare.</span> Automate documentation, track warranties, and manage maintenance with AI. 
              Spend your weekends at the beach, not buried in insurance forms.
            </p>
            <div className="mt-4 text-sm text-green-400 font-medium">
              → Average time saved per property per month
            </div>
          </div>
          <div className="value-prop-card p-8 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-black">
                <DollarSign size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Recover $12K+ Per Claim</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-blue-400">Stop leaving money on the table.</span> Maximize settlements with AI-powered damage assessment, 
              avoid costly surprise repairs, and unlock hidden insurance discounts.
            </p>
            <div className="mt-4 text-sm text-blue-400 font-medium">
              → Average additional recovery vs. DIY claims
            </div>
          </div>
          <div className="value-prop-card p-8 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-black">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Sleep Better at Night</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-purple-400">Turn anxiety into confidence.</span> Know your property is monitored 24/7, 
              your coverage is bulletproof, and you're ready for hurricane season.
            </p>
            <div className="mt-4 text-sm text-purple-400 font-medium">
              → Continuous property health monitoring
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      <style jsx>{`
        .value-prop-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .value-prop-card:hover {
          transform: translateY(-8px);
          border-color: ${COLORS.primary}80;
          box-shadow: 0 10px 25px -5px ${COLORS.primary}20;
        }
      `}</style>
    </section>
  )
}