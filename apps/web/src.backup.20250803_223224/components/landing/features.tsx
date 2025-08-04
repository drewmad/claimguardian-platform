/**
 * @fileMetadata
 * @purpose Displays the value proposition and key features section on the landing page.
 * @owner frontend-team
 * @status active
 */
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
import { liquidGlass } from '@/lib/styles/liquid-glass'

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
    <section id="features" className="px-4 md:px-8 py-20 bg-black/10">
      <AnimatedSection className="max-w-6xl mx-auto text-center">
        <h2 className="font-slab text-3xl md:text-4xl font-bold">
          <span className="text-white">Transform Property Ownership.</span>
          <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Build Generational Wealth.</span>
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
          ClaimGuardian creates living digital twins of everything you own, transforming scattered property data into actionable intelligence for wealth building.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`${liquidGlass.cards.success} p-8 rounded-2xl h-full flex flex-col text-left`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-green-400 to-green-600 text-black`}>
                <Clock size={24} />
              </div>
              <h3 className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}>Complete Property Intelligence</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-green-400">Track everything you own.</span> From your home's foundation to your headphone warranty, create a living digital twin that grows smarter over time. 
              Transform scattered data into organized intelligence.
            </p>
            <div className="mt-4 text-sm text-green-400 font-medium">
              → Every possession tracked and optimized
            </div>
          </div>
          <div className={`${liquidGlass.cards.info} p-8 rounded-2xl h-full flex flex-col text-left`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-blue-400 to-blue-600 text-black`}>
                <DollarSign size={24} />
              </div>
              <h3 className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}>Predictive Wealth Building</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-blue-400">Optimize before problems arise.</span> AI predicts maintenance needs, tracks warranty expirations, and identifies investment opportunities. 
              Transform reactive property management into proactive wealth building.
            </p>
            <div className="mt-4 text-sm text-blue-400 font-medium">
              → Save $12,000+ through predictive maintenance
            </div>
          </div>
          <div className={`${liquidGlass.cards.primary} p-8 rounded-2xl h-full flex flex-col text-left`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-purple-400 to-purple-600 text-black`}>
                <ShieldCheck size={24} />
              </div>
              <h3 className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}>Preserve Your Legacy</h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-purple-400">Build generational wealth.</span> Your complete property story transfers seamlessly to future generations. 
              Every improvement, lesson learned, and optimization becomes part of your family's lasting legacy.
            </p>
            <div className="mt-4 text-sm text-purple-400 font-medium">
              → Knowledge preserved for future generations
            </div>
          </div>
        </div>
      </AnimatedSection>
      
    </section>
  )
}