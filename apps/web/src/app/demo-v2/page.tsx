/**
 * @fileMetadata
 * @purpose "Demo page showing new Hero and Pricing components with conversion optimization"
 * @owner frontend-team
 * @dependencies ["react", "@/components/landing/hero-v2", "@/components/landing/pricing-v2"]
 * @exports ["DemoV2Page"]
 * @complexity medium
 * @tags ["demo", "conversion", "landing"]
 * @status testing
 */
"use client";

import React from "react";
import HeroV2 from "@/components/landing/hero-v2";
import PricingV2 from "@/components/landing/pricing-v2";
import StructuredData from "@/components/common/structured-data";
import "@/styles/hero-pricing-v2.css";

export default function DemoV2Page() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ClaimGuardian",
      "url": "https://claimguardianai.com",
      "logo": "https://claimguardianai.com/ClaimGuardian.png",
      "sameAs": [
        "https://www.linkedin.com/company/claimguardian/",
        "https://x.com/claimguardianai"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "ClaimGuardian - Guardian Essential",
      "brand": { "@type": "Brand", "name": "ClaimGuardian" },
      "description": "Digital twin and AI documentation platform for Florida property owners.",
      "url": "https://claimguardianai.com/pricing",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": "29.00",
        "availability": "https://schema.org/InStock",
        "url": "https://claimguardianai.com/auth/signup?plan=essential"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does ClaimGuardian cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Guardian Essential plan starts at $29/month. See all plan details on our Pricing page."
          }
        }
      ]
    }
  ];

  return (
    <>
      <StructuredData schema={schema} />
      <main>
        {/* New Hero Section with Conversion Optimization */}
        <HeroV2
          ctaLabel="Start Free"
          secondaryCtaLabel="See How It Works"
          onPrimary={() => {
            window.location.href = "/auth/signup?plan=free";
          }}
        />
        
        {/* Anchor for the secondary CTA scroll target */}
        <div id="how-it-works" style={{ height: 1 }} />
        
        {/* Steps Section Placeholder */}
        <section style={{ 
          padding: "48px 16px", 
          backgroundColor: "var(--cg-bg, #0b1420)",
          color: "var(--cg-text, #e6f0ff)"
        }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
              How It Works
            </h2>
            <p style={{ color: "var(--cg-text-dim, #a9b6cc)" }}>
              4-step process placeholder - this would show your existing HowItWorks component
            </p>
          </div>
        </section>

        {/* New Pricing Section with Tooltips */}
        <PricingV2 />
      </main>
    </>
  );
}