/**
 * @fileMetadata
 * @purpose Testimonials section with single featured testimonial
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["Testimonials"]
 * @complexity low
 * @tags ["landing", "testimonials", "social-proof"]
 * @status active
 */
'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

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

export function Testimonials() {
  return (
    <section className="px-4 md:px-8 py-16 bg-[#0a0e1a]">
      <AnimatedSection className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Testimonial Content */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={24} className="text-yellow-400" fill="currentColor" />)}
            </div>
            <blockquote className="font-slab text-2xl md:text-3xl font-semibold italic text-white">
              &quot;Documenting everything after the storm used to take weeks. With ClaimGuardian, I had a complete, undeniable evidence package in under an hour. My claim was paid while my neighbors were still taking pictures. It&apos;s a game-changer.&quot;
            </blockquote>
            <p className="mt-6 font-semibold text-white">- Marissa M., Southwest Florida</p>
            <p className="text-sm text-gray-300">ClaimGuardian User Since 2023</p>
          </div>

          {/* Team Consultation Image */}
          <div className="relative">
            <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <Image
                src="/images/property-team-consultation.jpg"
                alt="ClaimGuardian team consultation with Florida property owner"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm font-medium">
                  Personal consultation with ClaimGuardian experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  )
}