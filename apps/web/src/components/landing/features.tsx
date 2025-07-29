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

import { useState, useEffect, useRef } from 'react'
import { Clock, DollarSign, ShieldCheck } from 'lucide-react'
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
        <h2 className="font-slab text-3xl md:text-4xl font-bold">More Than Insurance. It&apos;s Total Asset Command.</h2>
        <p className="mt-3 max-w-3xl mx-auto text-gray-300">
          ClaimGuardian evolves with you, creating a living digital twin of your property. From routine maintenance to weathering the storm, we&apos;re your partner for the entire lifecycle of ownership.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="value-prop-card p-6 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary, color: 'black' }}>
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-lg">Reclaim Your Time</h3>
            </div>
            <p className="text-sm text-gray-300 flex-grow">
              Stop spending hundreds of hours on paperwork. Automate documentation, track warranties, and manage maintenance effortlessly. Spend less time managing your property, and more time living your Florida life.
            </p>
          </div>
          <div className="value-prop-card p-6 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary, color: 'black' }}>
                <DollarSign size={24} />
              </div>
              <h3 className="font-bold text-lg">Protect Your Wallet</h3>
            </div>
            <p className="text-sm text-gray-300 flex-grow">
              Maximize claim settlements, avoid costly surprise repairs with proactive maintenance, and uncover insurance savings. Your digital twin is your greatest financial shield.
            </p>
          </div>
          <div className="value-prop-card p-6 rounded-2xl h-full flex flex-col text-left" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary, color: 'black' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-lg">Command Peace of Mind</h3>
            </div>
            <p className="text-sm text-gray-300 flex-grow">
              Know your property is protected, your coverage is solid, and you&apos;re ready for anything. When disaster strikes, you&apos;re not a victim; you&apos;re prepared. That&apos;s the ClaimGuardian advantage.
            </p>
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