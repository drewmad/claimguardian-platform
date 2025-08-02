/**
 * @fileMetadata
 * @purpose Structured data for AEO/GEO optimization - Answer Engine Optimization
 * @owner seo-team
 * @dependencies ["react"]
 * @exports ["StructuredData", "FAQData", "HowToData", "ProductData"]
 * @complexity medium
 * @tags ["seo", "aeo", "geo", "structured-data", "ai-optimization"]
 * @status active
 */

interface FAQ {
  question: string
  answer: string
}

interface FAQDataProps {
  faqs: FAQ[]
}

interface HowToStep {
  name: string
  text: string
  url?: string
}

interface HowToDataProps {
  name: string
  description: string
  steps: HowToStep[]
}

interface ProductDataProps {
  name: string
  description: string
  url: string
  image?: string
  offers?: {
    price: string
    priceCurrency: string
    availability: string
  }
}

// FAQ Structured Data for AI Answer Engines
export function FAQData({ faqs }: FAQDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// How-To Structured Data for Process Documentation
export function HowToData({ name, description, steps }: HowToDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "url": step.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Product Structured Data for ClaimGuardian
export function ProductData({ name, description, url, image, offers }: ProductDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "url": url,
    "image": image,
    "applicationCategory": "InsuranceApplication",
    "operatingSystem": "Web Browser",
    "offers": offers ? {
      "@type": "Offer",
      "price": offers.price,
      "priceCurrency": offers.priceCurrency,
      "availability": offers.availability
    } : undefined
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Organization Data for Brand Entity Building
export function OrganizationData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ClaimGuardian",
    "description": "AI-powered insurance claim assistance platform for Florida property owners",
    "url": "https://claimguardianai.com",
    "logo": "https://claimguardianai.com/logo.png",
    "sameAs": [
      "https://twitter.com/claimguardian",
      "https://linkedin.com/company/claimguardian"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Florida",
      "addressCountry": "US"
    },
    "areaServed": {
      "@type": "State",
      "name": "Florida"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ClaimGuardian-specific FAQs optimized for AI answers
export const CLAIMGUARDIAN_FAQS: FAQ[] = [
  {
    question: "How does ClaimGuardian help with Florida insurance claims?",
    answer: "ClaimGuardian uses AI to document property damage, analyze policies, and maximize claim settlements for Florida property owners. Our platform automates evidence collection, generates professional reports, and provides settlement analysis to help you recover the full value of your claim."
  },
  {
    question: "What makes ClaimGuardian different from other claim software?",
    answer: "ClaimGuardian is built specifically for Florida's unique insurance challenges including hurricanes, floods, and state-specific regulations. Our AI tools are trained on Florida claim data and provide 24/7 monitoring, instant damage assessment, and settlement optimization."
  },
  {
    question: "How quickly can I document property damage with ClaimGuardian?",
    answer: "ClaimGuardian's AI damage analyzer can process photos and generate professional damage reports in under 10 minutes. Our AR measurement tools allow complete property documentation in 15 minutes, compared to hours with traditional methods."
  },
  {
    question: "Does ClaimGuardian work with all Florida insurance companies?",
    answer: "Yes, ClaimGuardian works with all major insurance companies operating in Florida. Our platform generates standardized reports that insurance adjusters recognize and accept, improving claim approval rates."
  },
  {
    question: "What types of Florida property damage can ClaimGuardian analyze?",
    answer: "ClaimGuardian analyzes hurricane damage, flood damage, roof damage, wind damage, hail damage, and fire damage. Our AI is specifically trained on Florida weather patterns and property types including homes, condos, mobile homes, and commercial properties."
  }
]

// How-To guide for claim documentation
export const CLAIM_DOCUMENTATION_STEPS: HowToStep[] = [
  {
    name: "Create your property digital twin",
    text: "Upload photos and documents to create a complete digital record of your property in 15 minutes. ClaimGuardian's AI analyzes and catalogs every asset.",
    url: "/auth/signup-advanced"
  },
  {
    name: "Enable 24/7 AI monitoring",
    text: "ClaimGuardian continuously monitors your property for maintenance needs, weather threats, and insurance coverage gaps.",
    url: "/ai-tools"
  },
  {
    name: "Document damage instantly",
    text: "When damage occurs, use AI-powered tools to capture photos, measurements, and generate professional damage reports in under 10 minutes.",
    url: "/ai-tools/damage-analyzer"
  },
  {
    name: "Maximize your settlement",
    text: "ClaimGuardian's settlement analyzer compares your claim with similar Florida cases to ensure you receive full compensation.",
    url: "/ai-tools/settlement-analyzer"
  }
]