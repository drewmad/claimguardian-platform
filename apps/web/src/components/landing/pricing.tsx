/**
 * @fileMetadata
 * @purpose Renders the pricing section with different plans and a billing cycle toggle.
 * @owner frontend-team
 * @status active
 */
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

import { Check, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { COLORS } from '@/lib/constants'
// import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe/client' // Disabled for now
import { createBrowserSupabaseClient } from '@claimguardian/db'

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

const PricingCard: React.FC<{ plan: PricingPlan & { priceIds?: { monthly: string; annual: string } }; onClick: () => void; cycle: 'monthly' | 'annual'; isProcessing?: boolean }> = ({ plan, onClick, cycle, isProcessing }) => {
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
      <button 
        onClick={onClick} 
        className={`w-full font-bold py-3 rounded-lg mt-auto ${plan.ctaClass} disabled:opacity-50`}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
            Processing...
          </>
        ) : (
          plan.ctaText
        )}
      </button>
    </div>
  )
}

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const plans: Record<string, PricingPlan & { priceIds?: { monthly: string; annual: string } }> = {
    free: { 
      name: 'Guardian Free', 
      price: {}, 
      per: {}, 
      subtitle: 'Perfect for testing the waters. Get protection for your primary home.', 
      features: ['1 Property Protection', 'Unlimited Manual Inventory', 'Basic Policy Health Check', '5 AI Damage Scans/month', '500MB Secure Evidence Vault'], 
      comingSoon: ['Mobile App (iOS)', 'Claim Timeline Guide', 'Community Forum Access', 'Export Your Data'], 
      ctaText: 'Start Free Protection →', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700 transition-all hover:scale-105' 
    },
    essential: { 
      name: 'Guardian Essential', 
      subtitle: 'Full protection for serious homeowners. Most popular choice.', 
      price: { monthly: 29, annual: 290 }, 
      per: { monthly: 'mo', annual: 'yr' }, 
      recommended: true, 
      features: ['Everything in Free, plus:', '50 AI Damage Scans/month', 'Deep Policy Analysis & Q&A', 'Settlement Amount Calculator', '25 AI-Generated Documents/month', 'Priority Email Support', '10GB Evidence Vault'], 
      comingSoon: ['Professional PDF Reports', 'Weather Threat Alerts', 'Legal Document Templates', 'Receipt OCR Scanning', 'Calendar Integration', 'Spanish Support', 'Unlimited 3D Models'], 
      ctaText: 'Get Full Protection →', 
      ctaClass: 'bg-primary text-black hover:opacity-90 transition-all hover:scale-105',
      priceIds: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL_MONTHLY || '',
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL_ANNUAL || ''
      }
    },
    plus: { 
      name: 'Guardian Plus', 
      subtitle: 'Scale protection across multiple properties. Perfect for small portfolios.', 
      price: {}, 
      per: {}, 
      features: ['Everything in Essential, plus:', 'Up to 3 Properties Protected', '2 Team Members', '150 AI Damage Scans/month', '75 AI Documents/month', '25GB Evidence Vault', 'Property Performance Dashboard', 'Rental Income Protection', 'Tenant Communication Portal'], 
      ctaText: 'Join Waitlist →', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700 transition-all hover:scale-105' 
    },
    pro: { 
      name: 'Guardian Professional', 
      subtitle: 'Enterprise-grade protection for serious property managers.', 
      price: {}, 
      per: {}, 
      features: ['Everything in Plus, plus:', 'Up to 10 Properties Protected', '5 Team Members', 'Unlimited AI Damage Scans', 'Unlimited AI Documents', 'Verified Contractor Network', 'Priority Phone Support', '50GB Evidence Vault', 'Bulk Property Operations', 'Complete Audit Trail', 'Third-party Integrations', 'White-label Options'], 
      ctaText: 'Join Waitlist →', 
      ctaClass: 'bg-gray-800 hover:bg-gray-700 transition-all hover:scale-105' 
    }
  }
  
  const handlePlanClick = async (planKey: string) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to signup if not authenticated
      router.push('/auth/signup')
      return
    }

    // Handle Stripe checkout for paid plans
    if (planKey === 'essential' && plans.essential.priceIds) {
      try {
        setProcessingPlan(planKey)
        
        // Stripe checkout temporarily disabled
        toast.error('Payment processing is currently being updated. Please try again later.')
      } catch (error) {
        console.error('Error starting checkout:', error)
        toast.error('Failed to start checkout process')
      } finally {
        setProcessingPlan(null)
      }
    } else {
      // For free plan, just redirect to dashboard
      router.push('/dashboard')
    }
  }
  
  return (
    <section id="pricing" className="px-4 md:px-8 py-20 bg-black/10">
      <AnimatedSection className="max-w-6xl mx-auto text-center">
        <h2 className="font-slab text-3xl md:text-4xl font-bold">
          <span className="text-white">Stop Overpaying for Insurance.</span>
          <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Start Protecting Your Assets.</span>
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
          Your plan pays for itself with one avoided claim denial. Choose the protection level that matches your property portfolio.
        </p>

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
          <PricingCard plan={plans.free} onClick={() => handlePlanClick('free')} cycle={billingCycle} isProcessing={processingPlan === 'free'} />
          <PricingCard plan={plans.essential} onClick={() => handlePlanClick('essential')} cycle={billingCycle} isProcessing={processingPlan === 'essential'} />
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
