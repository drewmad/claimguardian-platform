/**
 * @fileMetadata
 * @purpose "Redesigned Pricing section with conversion optimization and tooltips"
 * @owner frontend-team
 * @dependencies ["react", "@/lib/analytics"]
 * @exports ["PricingV2", "Tooltip"]
 * @complexity high
 * @tags ["pricing", "landing", "conversion", "tooltips"]
 * @status stable
 */
"use client";

import React, { useId, useState } from "react";

// Tooltip component
type TooltipProps = {
  label: string;
  children: React.ReactNode;
};

function Tooltip({ label, children }: TooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="cg-tooltip">
      <button
        type="button"
        className="cg-tooltip__button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        title={label}
      >
        ?
      </button>
      {open && (
        <span
          role="dialog"
          id={tooltipId}
          aria-label={label}
          className="cg-tooltip__panel"
        >
          {children}
        </span>
      )}
    </span>
  );
}

type Plan = {
  id: string;
  name: string;
  price: string;
  frequency: "month" | "year";
  popular?: boolean;
  cta: string;
  href?: string;
  features: string[];
  comingSoon?: string[];
  limits?: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Guardian Free",
    price: "$0",
    frequency: "month",
    cta: "Start Free Protection",
    href: "/auth/signup?plan=free",
    features: [
      "1 property",
      "Unlimited manual inventory",
      "Basic policy health check",
      "5 AI Damage Scans per month",
      "500 MB evidence vault",
      "Community access",
    ],
    comingSoon: [
      "iOS app",
      "Claim timeline guide",
      "Data export",
    ],
  },
  {
    id: "essential",
    name: "Guardian Essential",
    price: "$29",
    frequency: "month",
    popular: true,
    highlight: true,
    cta: "Get Full Protection",
    href: "/auth/signup?plan=essential",
    features: [
      "Everything in Free",
      "50 AI Damage Scans per month",
      "Deep policy analysis and Q&A",
      "Settlement amount calculator",
      "25 AI‑generated documents per month",
      "Priority email support",
      "10 GB evidence vault",
    ],
    comingSoon: [
      "PDF reports",
      "Weather alerts",
      "Receipt OCR",
      "Calendar integration",
      "Spanish support",
      "Unlimited 3D models",
    ],
  },
  {
    id: "plus",
    name: "Guardian Plus",
    price: "Contact",
    frequency: "month",
    cta: "Join Waitlist",
    href: "/waitlist?plan=plus",
    features: [
      "Everything in Essential",
      "Up to 3 properties",
      "2 team members",
      "150 AI Damage Scans per month",
      "75 AI‑generated documents per month",
      "25 GB evidence vault",
      "Property performance dashboard",
      "Rental income protection",
      "Tenant communication portal",
    ],
  },
  {
    id: "pro",
    name: "Guardian Professional",
    price: "Contact",
    frequency: "month",
    cta: "Join Waitlist",
    href: "/waitlist?plan=pro",
    features: [
      "Everything in Plus",
      "Up to 10 properties",
      "5 team members",
      "Unlimited AI Damage Scans and documents",
      "Verified contractor network",
      "Priority phone support",
      "50 GB evidence vault",
      "Bulk operations",
      "Audit trail and integrations",
      "White‑label options",
    ],
  },
];

// Placeholder analytics function
const trackEvent = (name: string, payload?: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    console.debug("[analytics]", name, payload || {});
  }
};

export function PricingV2() {
  const sectionId = useId();
  
  return (
    <section
      id="pricing"
      className="cg-pricing"
      aria-labelledby={`${sectionId}-heading`}
      data-section="pricing"
    >
      <div className="cg-section-header">
        <h2 id={`${sectionId}-heading`} className="cg-section-title">
          Simple pricing that scales with you
        </h2>
        <p className="cg-section-subtitle">
          Start free. Upgrade when you need deeper automation and evidence.
        </p>
      </div>

      <div className="cg-pricing__grid" role="list">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            role="listitem"
            className={`cg-card cg-plan ${plan.highlight ? "cg-plan--highlight" : ""}`}
            aria-label={`${plan.name} plan`}
            data-testid={`plan-${plan.id}`}
          >
            {plan.popular && <div className="cg-plan__badge" aria-label="Most popular">Most Popular</div>}

            <header className="cg-plan__header">
              <h3 className="cg-plan__title">{plan.name}</h3>
              <p className="cg-plan__price">
                {plan.price}
                {plan.price !== "Contact" && (
                  <span className="cg-plan__freq"> / {plan.frequency}</span>
                )}
              </p>
            </header>

            <ul className="cg-plan__features" role="list">
              {plan.features.map((f, i) => (
                <li key={i} className="cg-plan__feature">
                  {f.includes("AI Damage Scans") ? (
                    <>
                      {f}{" "}
                      <Tooltip label="What is an AI Damage Scan?">
                        <strong>AI Damage Scan</strong> runs structured checks on
                        your photos and notes, flags missing evidence, and builds
                        a checklist to document damage clearly.
                      </Tooltip>
                    </>
                  ) : f.includes("AI‑generated documents") ? (
                    <>
                      {f}{" "}
                      <Tooltip label="What are AI‑generated documents?">
                        Drafts letters, summaries, and evidence bundles you can
                        export and review before sharing. You stay in control.
                      </Tooltip>
                    </>
                  ) : (
                    f
                  )}
                </li>
              ))}
            </ul>

            {plan.comingSoon && plan.comingSoon.length > 0 && (
              <details className="cg-plan__soon">
                <summary aria-label="Show items coming soon">Coming soon</summary>
                <ul role="list">
                  {plan.comingSoon.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="cg-plan__actions">
              <a
                className="cg-btn cg-btn--primary"
                href={plan.href || "/contact"}
                aria-label={`${plan.cta} for ${plan.name}`}
                data-analytics={`pricing_${plan.id}_cta`}
                onClick={() => {
                  try {
                    trackEvent("pricing_select_plan", {
                      plan: plan.id,
                      placement: "pricing_grid",
                    });
                  } catch {}
                }}
              >
                {plan.cta}
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="cg-pricing__disclaimer" role="note">
        Prices are shown in USD. Cancel anytime. Features that are marked as
        coming soon are on the roadmap and may change.
      </p>
    </section>
  );
}

export { Tooltip };
export default PricingV2;