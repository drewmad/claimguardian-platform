/**
 * @fileMetadata
 * @purpose "Redesigned Hero section with conversion optimization based on critical feedback"
 * @owner frontend-team
 * @dependencies ["react", "next", "@/lib/analytics"]
 * @exports ["HeroV2"]
 * @complexity medium
 * @tags ["hero", "landing", "conversion"]
 * @status stable
 */
"use client";

import React from "react";

type HeroProps = {
  ctaLabel?: string;              // Primary CTA label (default: "Start Free")
  secondaryCtaLabel?: string;     // Secondary CTA label (default: "See How It Works")
  onPrimary?: () => void;
  onSecondary?: () => void;
};

// Placeholder analytics function - replace with your actual analytics
const trackEvent = (name: string, payload?: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    console.debug("[analytics]", name, payload || {});
  }
};

export function HeroV2({
  ctaLabel = "Start Free",
  secondaryCtaLabel = "See How It Works",
  onPrimary,
  onSecondary,
}: HeroProps) {
  const handlePrimary = () => {
    try {
      trackEvent("hero_start_free_click", { placement: "hero_primary" });
    } catch {}
    if (onPrimary) {
      onPrimary();
    } else {
      window.location.href = "/auth/signup";
    }
  };

  const handleSecondary = () => {
    try {
      trackEvent("hero_how_it_works_click", { placement: "hero_secondary" });
    } catch {}
    onSecondary?.();
    const el = document.getElementById("how-it-works");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="cg-hero"
      aria-labelledby="hero-heading"
      data-section="hero"
    >
      <div className="cg-hero__inner">
        <div className="cg-hero__media" aria-hidden="true">
          <img
            src="/ClaimGuardian.png"
            alt=""
            className="cg-hero__shield"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="cg-hero__content">
          <h1 id="hero-heading" className="cg-hero__title">
            Your Property Intelligence, Not Theirs
          </h1>

          <p className="cg-hero__subtitle">
            Build the digital twin of everything you own. Document once, protect
            forever.
          </p>

          <ul className="cg-hero__bullets" role="list">
            <li>15‑minute setup with AI assistance</li>
            <li>Evidence‑ready documentation for faster, fairer claims</li>
            <li>Private by default — you control what's shared</li>
          </ul>

          <div className="cg-hero__ctas">
            <button
              type="button"
              className="cg-btn cg-btn--primary"
              aria-label={`${ctaLabel} - no credit card required`}
              data-analytics="hero_primary_cta"
              data-testid="hero-primary-cta"
              onClick={handlePrimary}
            >
              {ctaLabel}
            </button>

            <button
              type="button"
              className="cg-btn cg-btn--ghost"
              aria-label={secondaryCtaLabel}
              data-analytics="hero_secondary_cta"
              data-testid="hero-secondary-cta"
              onClick={handleSecondary}
            >
              {secondaryCtaLabel}
            </button>
          </div>

          <div className="cg-hero__trust" aria-label="Trust badges">
            <span className="cg-pill">Florida‑Focused</span>
            <span className="cg-pill">Hurricane‑Tested</span>
            <a className="cg-pill cg-pill--link" href="/security">
              Bank‑Level Encryption
            </a>
            <span className="cg-pill">24/7 Monitoring</span>
          </div>

          <p className="cg-hero__microproof">
            Avg. setup: 15 min · Built by a Florida P.E. · 24/7 monitoring
          </p>
        </div>
      </div>
    </section>
  );
}

export default HeroV2;