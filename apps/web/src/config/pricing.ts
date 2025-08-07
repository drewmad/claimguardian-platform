/**
 * @fileMetadata
 * @purpose "Pricing configuration for ClaimGuardian subscription plans"
 * @dependencies []
 * @owner billing-team
 * @status stable
 */

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    annually: number
  }
  currency: string
  features: string[]
  limits: {
    properties: number
    claims: number
    aiRequests: number
    storage: number // GB
    users: number
  }
  stripePriceId: {
    monthly: string
    annually: string
  }
  popular?: boolean
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    price: {
      monthly: 0,
      annually: 0
    },
    currency: 'usd',
    features: [
      '1 property',
      '1 claim per year',
      'Basic AI assistance',
      '1 GB storage',
      'Community support'
    ],
    limits: {
      properties: 1,
      claims: 1,
      aiRequests: 50,
      storage: 1,
      users: 1
    },
    stripePriceId: {
      monthly: '',
      annually: ''
    }
  },

  homeowner: {
    id: 'homeowner',
    name: 'Homeowner Essentials',
    description: 'Perfect for individual property owners',
    price: {
      monthly: 19,
      annually: 190 // ~17% discount
    },
    currency: 'usd',
    features: [
      '1 property',
      'Unlimited claims',
      'Complete AI tools suite',
      'Priority support',
      '10 GB storage',
      'Document generation',
      'Risk assessment',
      'Mobile app access'
    ],
    limits: {
      properties: 1,
      claims: -1, // unlimited
      aiRequests: 1000,
      storage: 10,
      users: 2
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_MONTHLY || '',
      annually: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_ANNUALLY || ''
    },
    popular: true
  },

  landlord: {
    id: 'landlord',
    name: 'Landlord Pro',
    description: 'Manage multiple rental properties',
    price: {
      monthly: 49,
      annually: 490
    },
    currency: 'usd',
    features: [
      'Up to 10 properties',
      'Unlimited claims',
      'Advanced AI tools suite',
      'Priority support',
      '50 GB storage',
      'Tenant portal',
      'Automated inspections',
      'Contractor network',
      'Financial reporting',
      'API access'
    ],
    limits: {
      properties: 10,
      claims: -1,
      aiRequests: 5000,
      storage: 50,
      users: 5
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_MONTHLY || '',
      annually: process.env.NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_ANNUALLY || ''
    }
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For property management companies',
    price: {
      monthly: 199,
      annually: 1990
    },
    currency: 'usd',
    features: [
      'Unlimited properties',
      'Unlimited claims',
      'Complete AI tools suite + custom models',
      'Dedicated support',
      'Unlimited storage',
      'White-label options',
      'Custom integrations',
      'Advanced analytics',
      'Team management',
      'SLA guarantee',
      'Custom AI training'
    ],
    limits: {
      properties: -1,
      claims: -1,
      aiRequests: -1,
      storage: -1,
      users: -1
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
      annually: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUALLY || ''
    }
  }
}

export const getActivePlan = (planId: string): PricingPlan => {
  return PRICING_PLANS[planId] || PRICING_PLANS.free
}

export const canUpgrade = (currentPlan: string, targetPlan: string): boolean => {
  const planOrder = ['free', 'homeowner', 'landlord', 'enterprise']
  const currentIndex = planOrder.indexOf(currentPlan)
  const targetIndex = planOrder.indexOf(targetPlan)
  return targetIndex > currentIndex
}

export const getPlanLimits = (planId: string) => {
  const plan = getActivePlan(planId)
  return plan.limits
}

export const checkLimit = (
  planId: string,
  resource: keyof PricingPlan['limits'],
  currentUsage: number
): { allowed: boolean; limit: number; usage: number } => {
  const limits = getPlanLimits(planId)
  const limit = limits[resource]

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, usage: currentUsage }
  }

  return {
    allowed: currentUsage < limit,
    limit,
    usage: currentUsage
  }
}
