/**
 * @fileMetadata
 * @purpose "Testimonials section with single featured testimonial"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["Testimonials"]
 * @complexity low
 * @tags ["landing", "testimonials", "social-proof"]
 * @status stable
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
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  
  const testimonials = [
    {
      quote: "I thought ClaimGuardian was just for insurance claims. Then I discovered it tracks every warranty, schedules every maintenance, and saved me $8,000 on my AC replacement by reminding me it was still under warranty. It's like having a property manager in my pocket.",
      author: "Jennifer K.",
      location: "Tampa Bay",
      userSince: "2023",
      highlight: "Saved $8,000 on AC warranty claim"
    },
    {
      quote: "After Hurricane Ian, my neighbor fought their insurance for 18 months. I had my full settlement in 6 weeks. The difference? ClaimGuardian had documented everything before the storm hit. Every upgrade, every repair, every receipt—organized and ready.",
      author: "Michael R.",
      location: "Fort Myers",
      userSince: "2022",
      highlight: "Full settlement in 6 weeks vs 18 months"
    },
    {
      quote: "As a real estate investor with 12 properties, ClaimGuardian transformed my business. I track every improvement, optimize maintenance schedules, and my property values have increased 23% through better documentation and care. It's generational wealth building on autopilot.",
      author: "Sarah D.",
      location: "Miami-Dade",
      userSince: "2023",
      highlight: "23% property value increase"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <section className="px-4 md:px-8 py-20 bg-gradient-to-b from-gray-900 to-black">
      <AnimatedSection className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
          <span className="text-white">Real Stories.</span>
          <span className="text-green-400"> Real Results.</span>
        </h2>
        
        <div className="relative">
          {/* Main Testimonial Display */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 md:p-12 mb-8">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} size={28} className="text-yellow-400" fill="currentColor" />)}
            </div>
            
            <blockquote className="font-slab text-xl md:text-2xl lg:text-3xl font-medium italic text-white text-center max-w-4xl mx-auto leading-relaxed">
              "{testimonials[activeTestimonial].quote}"
            </blockquote>
            
            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-white">{testimonials[activeTestimonial].author}, {testimonials[activeTestimonial].location}</p>
              <p className="text-sm text-gray-400">ClaimGuardian User Since {testimonials[activeTestimonial].userSince}</p>
              <p className="mt-2 text-green-400 font-semibold">{testimonials[activeTestimonial].highlight}</p>
            </div>
          </div>
          
          {/* Testimonial Navigation */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeTestimonial === index 
                    ? 'w-8 bg-green-400' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-green-400">15,000+</div>
            <div className="text-gray-400 text-sm mt-1">Properties Protected</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">$47M+</div>
            <div className="text-gray-400 text-sm mt-1">Claims Optimized</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-400">4.9/5</div>
            <div className="text-gray-400 text-sm mt-1">User Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400">24/7</div>
            <div className="text-gray-400 text-sm mt-1">AI Support</div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  )
}