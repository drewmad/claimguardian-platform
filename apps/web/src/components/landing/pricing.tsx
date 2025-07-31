/**
 * @fileMetadata
 * @purpose Pricing section with annual/monthly toggle
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants", "@/stores/modal-store"]
 * @exports ["Pricing"]
 * @complexity high
 * @tags ["landing", "pricing", "billing"]
 * @status active
 */
'use client'

import { Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { COLORS } from '@/lib/constants'
import { useModalStore } from '@/stores/modal-store'

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

interface PricingPlan {
  name: string
  subtitle: string
  price: { monthly?: number; annual?: number }
  per: { monthly?: string; annual?: string }
  features: string[]
  comingSoon?: string[]
  ctaText: string
  ctaClass: string
  recommended?: boolean
}

const PricingCard: React.FC<{ plan: PricingPlan; onClick: () => void; cycle: 'monthly' | 'annual' }> = ({ plan, onClick, cycle }) => {
  const isAnnual = cycle === 'annual' && plan.price.annual
  const displayPrice = isAnnual ? plan.price.annual : plan.price.monthly
  const displayPer = isAnnual ? plan.per.annual : plan.per.monthly
  const savings = plan.price.monthly && plan.price.annual ? plan.price.monthly * 12 - plan.price.annual : 0

  return (
    <div className={`p-8 rounded-2xl flex flex-col h-full relative ${plan.recommended ? 'border-2' : 'border'}`} style={{ backgroundColor: COLORS.glass.bg, borderColor: plan.recommended ? COLORS.primary : COLORS.glass.border }}>
      {plan.recommended && <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-sm font-bold bg-primary text-black">Recommended</span>}
      {isAnnual && savings > 0 && <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-300">Save 17%</span>}
      <h3 className="font-slab text-2xl font-bold">{plan.name}</h3>
      <p className="text-primary font-semibold h-10">{plan.subtitle}</p>
      {displayPrice !== undefined && <p className="my-4"><span className="text-4xl font-bold">${displayPrice}</span><span className="text-gray-300">/{displayPer}</span></p>}
      <ul className="text-left space-y-3 my-8 flex-grow">
        {plan.features.map((f: string, i: number) => <li key={i} className={`flex items-start gap-2 ${f.startsWith('Everything') ? 'font-semibold' : ''}`}><Check size={16} className="text-primary mt-1 flex-shrink-0"/><span>{f}</span></li>)}
      </ul>
      {plan.comingSoon && (
        <div className="my-6">
          <p className="font-bold text-sm text-gray-300">Coming Soon:</p>
          <ul className="text-left text-sm text-gray-300 space-y-1 mt-2">
            {plan.comingSoon.map((f: string, i: number) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
      <button onClick={onClick} className={`w-full font-bold py-3 rounded-lg mt-auto ${plan.ctaClass}`}>{plan.ctaText}</button>
    </div>
  )
}

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const { openModal } = useModalStore()
  
  const plans: Record<string, PricingPlan> = {
    free: { 
      name: 'Guardian Free', 
      price: {}, 
      per: {}, 
      subtitle: 'Available to Florida property owners. No credit card required.', 
      features: ['1 Property', 'Unlimited Manual Inventory Entry', 'Basic Policy Analysis', 'Limited AI Damage Scans', '500MB Evidence Storage'], 
      comingSoon: ['Mobile App (iOS)', 'Claim Checklist & Timeline', 'Community Forum Access', 'Data Export (JSON/CSV)'], 
      ctaText: 'Get Started for Free', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700' 
    },
    essential: { 
      name: 'Guardian Essential', 
      subtitle: 'Recommended for most homeowners.', 
      price: { monthly: 29, annual: 290 }, 
      per: { monthly: 'mo', annual: 'yr' }, 
      recommended: true, 
      features: ['Everything in Free, plus:', 'More AI Damage Scans per month', 'Advanced Policy Analysis & Q&A', 'Settlement Analyzer', 'More AI-Augmented Documents per month', 'Priority Email Support', '10GB Evidence Storage'], 
      comingSoon: ['Export Reports (PDF/CSV)', 'Data Export (JSON/CSV)', 'Weather Alerts', 'Document Templates', 'OCR Receipt Scanning', 'Calendar Integration', 'Spanish Language Support', '3D Model Generation'], 
      ctaText: 'Go Essential', 
      ctaClass: 'bg-primary text-black hover:opacity-90' 
    },
    plus: { 
      name: 'Guardian Plus', 
      subtitle: 'Perfect for small landlords and families with rental properties.', 
      price: {}, 
      per: {}, 
      features: ['Everything in Essential, plus:', 'Up to 3 Properties', '2 Team Members', 'Even More AI Damage Scans', 'More AI Documents', '25GB Evidence Storage', 'Property Comparison Tools', 'Rental Income Protection Tools', 'Tenant Service Requests'], 
      ctaText: 'Join Waitlist', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700' 
    },
    pro: { 
      name: 'Guardian Professional', 
      subtitle: 'For serious property managers.', 
      price: {}, 
      per: {}, 
      features: ['Everything in Plus, plus:', 'Up to 10 Properties', '5 Team Members', 'Maximum AI Damage Scans', 'Unlimited AI Documents', 'Contractor Marketplace', 'Priority Phone Support', '50GB Evidence Storage', 'Bulk Operations', 'Audit Trail & Version History', 'Integrations (Google Drive, Dropbox)', '3D Model Generation (Unlimited)'], 
      ctaText: 'Join Waitlist', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700' 
    }
  }
  
  return (
    <section className="px-4 md:px-8 py-20 bg-black/10">
      <AnimatedSection className="max-w-6xl mx-auto text-center">
        <h2 className="font-slab text-3xl md:text-4xl font-bold">Simple, Powerful Pricing</h2>
        <p className="mt-3 max-w-2xl mx-auto text-gray-300">Choose the plan that&apos;s right for you. Start for free, upgrade for more power.</p>

        <div className="flex justify-center my-8">
          <div className="p-1 rounded-lg flex items-center gap-2" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'bg-primary text-black' : ''}`}>Monthly</button>
            <button onClick={() => setBillingCycle('annual')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${billingCycle === 'annual' ? 'bg-primary text-black' : ''}`}>Annual (Save 17%)</button>
          </div>
        </div>

        <div className="my-12 p-6 rounded-2xl text-left text-sm" style={{ backgroundColor: COLORS.glass.bg, border: `1px solid ${COLORS.glass.border}`}}>
          <h3 className="font-bold text-primary mb-2">Why we charge:</h3>
          <p className="text-gray-300">Running cutting-edge AI models and secure hosting costs thousands each month. We&apos;re a family-run Florida business, built during late nights while the baby sleeps, because we believe every Floridian deserves access to tools that protect their legacy. That&apos;s why we&apos;re committed to maintaining a free tier - no one should face insurance companies alone.</p>
          <p className="text-gray-300 mt-2">Living the Florida dream comes with hurricanes, floods, and storms - but protecting your family&apos;s future shouldn&apos;t be another battle. Your subscription helps us keep the servers running and continue building tools for homeowners like you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <PricingCard plan={plans.free} onClick={() => openModal('signup')} cycle={billingCycle} />
          <PricingCard plan={plans.essential} onClick={() => openModal('signup')} cycle={billingCycle} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <PricingCard plan={plans.plus} onClick={() => {}} cycle={billingCycle} />
          <PricingCard plan={plans.pro} onClick={() => {}} cycle={billingCycle} />
        </div>
        
        <div className="mt-16">
          <h3 className="font-slab text-2xl font-bold">For Larger Portfolios & Developers</h3>
          <p className="text-gray-300 mt-2">Specialized plans for enterprises and builders are coming soon.</p>
        </div>
        
        <p className="text-xs text-gray-300 mt-12 italic">Prices in USD. Florida residents add applicable sales tax. Features, pricing, and availability subject to change. Coming Soon features are in development. ClaimGuardian is a documentation and organization tool - not a substitute for professional legal, insurance, or financial advice. Service provided subject to our Terms of Service.</p>
      </AnimatedSection>
    </section>
  )
}