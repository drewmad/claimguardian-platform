/**
 * @fileMetadata
 * @purpose "Provides components for rendering SEO-related structured data (JSON-LD)."
 * @dependencies []
 * @owner seo-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Structured data for AEO/GEO optimization - Answer Engine Optimization"
 * @owner seo-team
 * @dependencies ["react"]
 * @exports ["StructuredData", "FAQData", "HowToData", "ProductData"]
 * @complexity medium
 * @tags ["seo", "aeo", "geo", "structured-data", "ai-optimization"]
 * @status stable
 */

interface FAQ {
  question: string;
  answer: string;
}

interface FAQDataProps {
  faqs: FAQ[];
}

interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

interface HowToDataProps {
  name: string;
  description: string;
  steps: HowToStep[];
}

interface ProductDataProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

// FAQ Structured Data for AI Answer Engines
export function FAQData({ faqs }: FAQDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// How-To Structured Data for Process Documentation
export function HowToData({ name, description, steps }: HowToDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: name,
    description: description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Product Structured Data for ClaimGuardian
export function ProductData({
  name,
  description,
  url,
  image,
  offers,
}: ProductDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: name,
    description: description,
    url: url,
    image: image,
    applicationCategory: "InsuranceApplication",
    operatingSystem: "Web Browser",
    offers: offers
      ? {
          "@type": "Offer",
          price: offers.price,
          priceCurrency: offers.priceCurrency,
          availability: offers.availability,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Organization Data for Brand Entity Building
export function OrganizationData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClaimGuardian",
    description:
      "AI-powered property intelligence network that creates living digital twins of everything you own. Built by Florida family for comprehensive property management, warranty tracking, and generational wealth preservation.",
    url: "https://claimguardianai.com",
    logo: "https://claimguardianai.com/logo.png",
    foundingDate: "2023",
    foundingLocation: {
      "@type": "Place",
      name: "Florida, United States",
    },
    sameAs: [
      "https://twitter.com/claimguardian",
      "https://linkedin.com/company/claimguardian",
    ],
    address: {
      "@type": "PostalAddress",
      addressRegion: "Florida",
      addressCountry: "US",
    },
    areaServed: {
      "@type": "State",
      name: "Florida",
    },
    slogan: "Your Property's Complete Story, Protected Forever",
    mission:
      "To transform property ownership from a source of anxiety into an engine for wealth building and community resilience",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// ClaimGuardian-specific FAQs optimized for AI answers
export const CLAIMGUARDIAN_FAQS: FAQ[] = [
  {
    question: "What is ClaimGuardian and how does it protect my property?",
    answer:
      "ClaimGuardian is an AI-powered property intelligence network that creates a living digital twin of everything you own. It tracks warranties, optimizes maintenance, protects investments, and preserves your property legacy. Built by a Florida family who survived Hurricane Ian specifically for comprehensive property management.",
  },
  {
    question: "How does ClaimGuardian track all my possessions and warranties?",
    answer:
      "ClaimGuardian creates a complete digital inventory of your property - from your home's roof to your headphone warranty. Our AI tracks maintenance schedules, warranty expirations, and optimization opportunities for everything you own, helping you save thousands through predictive maintenance and proper documentation.",
  },
  {
    question:
      "What makes ClaimGuardian different from other property management software?",
    answer:
      "ClaimGuardian is built by a Florida family team who survived Hurricane Ian, not Silicon Valley outsiders. We protect your complete property story with bank-level privacy, community wisdom sharing, and generational wealth building focus. Your data stays yours - we develop in-house AI to ensure complete privacy.",
  },
  {
    question:
      "How does ClaimGuardian help with insurance claims and property documentation?",
    answer:
      "ClaimGuardian's AI generates irrefutable documentation for insurance claims in under 10 minutes. Our platform tracks every property detail, warranty, and maintenance record, ensuring you receive every dollar of coverage you're entitled to while saving hours of stressful negotiations.",
  },
  {
    question:
      "Can ClaimGuardian help build generational wealth through property ownership?",
    answer:
      "Yes, ClaimGuardian transforms property ownership from anxiety into wealth building by optimizing maintenance, preserving complete property histories, and enabling seamless knowledge transfer to future generations. Your property story and lessons learned become a legacy, not lost information.",
  },
];

// How-To guide for property digital twin creation
export const CLAIM_DOCUMENTATION_STEPS: HowToStep[] = [
  {
    name: "Create your complete property digital twin",
    text: "Document everything you own in 15 minutes - from your home's foundation to your headphone warranty. ClaimGuardian's AI catalogs every asset, warranty, and maintenance schedule to build your comprehensive property intelligence network.",
    url: "/auth/signup",
  },
  {
    name: "Enable intelligent property monitoring",
    text: "Your digital twin continuously monitors maintenance schedules, warranty expirations, weather threats, and optimization opportunities. Transform reactive property management into proactive wealth building.",
    url: "/ai-tools",
  },
  {
    name: "Preserve your property story",
    text: "Every improvement, repair, and lesson learned becomes part of your permanent property legacy. ClaimGuardian tracks the complete story with bank-level privacy protection - your data stays yours.",
    url: "/dashboard/property",
  },
  {
    name: "Build generational wealth",
    text: "Transfer complete property knowledge to future generations seamlessly. Your optimized maintenance, verified improvements, and accumulated wisdom become a legacy, not lost information.",
    url: "/dashboard",
  },
];
