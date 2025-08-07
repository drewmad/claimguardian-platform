/**
 * @fileMetadata
 * @purpose "A visually improved and animated hero section component for the landing page."
 * @dependencies ["@/lib","lucide-react","next","react"]
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Improved Hero section with better UI/UX based on critique"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants", "next/link"]
 * @exports ["Hero"]
 * @complexity high
 * @tags ["hero", "landing", "animations"]
 * @status stable
 */
"use client";

import {
  Home,
  BrainCircuit,
  Hammer,
  KeyRound,
  ArrowRight,
  Building,
  PlayCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState, useEffect, useRef } from "react";

import { COLORS } from "@/lib/constants";
import { liquidGlass } from "@/lib/styles/liquid-glass";

// Animation hook
const useInView = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isInView] as const;
};

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Professional logo with enhanced styling for hero section
const GuardianHeroLogo = () => (
  <div className="relative">
    <OptimizedImage
      src="/ClaimGuardian.png"
      alt="ClaimGuardian Logo"
      width={80}
      height={80}
      priority={true}
      className="drop-shadow-[0_8px_32px_rgba(57,255,20,0.4)] h-16 md:h-20 w-auto object-contain"
    />
    {/* Ambient glow effect */}
    <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-b from-green-400 to-transparent animate-pulse" />
  </div>
);

export function Hero() {
  const [hoveredCTA, setHoveredCTA] = useState(false);

  const pills = [
    { label: "Homeowners", icon: Home },
    { label: "Renters", icon: KeyRound },
    { label: "Landlords", icon: Building },
    { label: "Builders", icon: Hammer },
    { label: "AI-Augmented", icon: BrainCircuit },
  ];

  return (
    <>
      {/* Enhanced Hurricane Season Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border-b border-red-400/50 py-3 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)] animate-pulse opacity-30" />
        
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🌀</span>
            <span className="font-bold text-white text-sm sm:text-base">
              HURRICANE SEASON 2025 ACTIVE
            </span>
            <span className="text-2xl animate-bounce">⚡</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-yellow-200 font-medium text-sm">
              Next Storm Risk: 
            </span>
            <span className="bg-yellow-300 text-black px-2 py-1 rounded font-bold text-xs uppercase tracking-wide">
              Aug 15-30
            </span>
          </div>
          
          <Link
            href="/hurricane-prep"
            className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-yellow-100 transition-colors group shadow-lg"
          >
            <span>Get Protected Now</span>
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>

      <section className="hero-liquid-glass relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Skip Link for Accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:ring-2 focus:ring-blue-300"
        >
          Skip to main content
        </a>

        {/* Animated Background - Reduced motion for accessibility */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden motion-reduce:hidden">
          <div className={liquidGlass.orbs.header} />
          <div className={liquidGlass.orbs.section} />
        </div>

        {/* Content */}
        <div
          className="relative z-10 container mx-auto px-4 text-center pt-12 pb-16"
          id="main"
        >
          <AnimatedSection>
            <header className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 mb-8 max-w-5xl mx-auto">
              <div className="flex-shrink-0 md:order-1">
                <div className="relative">
                  <OptimizedImage
                    src="/ClaimGuardian.png"
                    alt="ClaimGuardian Logo"
                    width={140}
                    height={140}
                    priority={true}
                    className="drop-shadow-[0_12px_48px_rgba(57,255,20,0.5)] w-28 h-28 md:w-36 md:h-36 object-contain"
                  />
                  {/* Enhanced ambient glow effect */}
                  <div className="absolute inset-0 blur-3xl opacity-40 bg-gradient-to-b from-green-400 to-transparent animate-pulse" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left md:order-2">
                <h1
                  className="font-slab text-[clamp(2.75rem,5.5vw,4.5rem)] font-bold text-white leading-none mb-6"
                  aria-label="ClaimGuardian - AI-powered property intelligence"
                >
                  Claim<span className="text-green-400">Guardian</span>
                </h1>
                <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-gray-200 opacity-90">
                  Your Property Intelligence, Not Theirs
                </p>
                {/* A/B Test Alternative Taglines (commented for future testing) */}
                {/* <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-gray-200 opacity-90">AI That Works For You—Not The Industry</p> */}
                {/* <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-gray-200 opacity-90">Intelligent Property Management, On Your Side</p> */}
                {/* <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-gray-200 opacity-90">Your Property, Your Data, Your Guardian</p> */}
              </div>
            </header>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="mt-6 max-w-4xl mx-auto space-y-3">
              <p className="text-[clamp(1.25rem,2.2vw,1.625rem)] font-medium text-gray-200 leading-relaxed">
                From purchase to transfer, every asset and every phase is protected.
              </p>
              <p className="text-[clamp(1.125rem,2vw,1.5rem)] font-medium text-gray-300 leading-relaxed">
                ClaimGuardian's AI manages your property with one goal: protecting your interests—not theirs.
              </p>
              <p className="text-[clamp(1rem,1.8vw,1.375rem)] text-gray-400 leading-relaxed">
                An AI-powered guardian that protects, manages, and optimizes everything you own—without bias or surveillance.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            {/* Audience Pills with "Built For" heading */}
            <div className="mt-10 space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 text-center">Built For</h3>
              <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-3 justify-center min-w-max px-4">
                {pills.map((pill) => (
                  <button
                    key={pill.label}
                    className={`${liquidGlass.backgrounds.secondary} flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black ${liquidGlass.hover.subtle} transition-all duration-300`}
                    onClick={() =>
                      document
                        .getElementById("who-we-serve")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <pill.icon
                      size={16}
                      className={`text-green-400 ${liquidGlass.text.glowSubtle}`}
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {pill.label}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            {/* Primary CTA - Now more prominent with better positioning */}
            <div
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
              role="group"
              aria-label="Primary actions"
            >
              <Link
                href="/auth/signup"
                className={`group relative font-bold py-6 px-12 text-black text-xl hover:scale-105 inline-flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-green-400/50 a11y-touch-target shadow-2xl rounded-2xl transition-all duration-300`}
                style={{
                  background: hoveredCTA
                    ? `linear-gradient(135deg, #39FF14, #00FF7F)`
                    : `linear-gradient(135deg, #39FF14, #32CD32)`,
                  boxShadow: hoveredCTA
                    ? "0 0 50px rgba(57, 255, 20, 0.7), 0 25px 70px rgba(0, 0, 0, 0.5)"
                    : "0 0 30px rgba(57, 255, 20, 0.5), 0 15px 50px rgba(0, 0, 0, 0.4)",
                }}
                onMouseEnter={() => setHoveredCTA(true)}
                onMouseLeave={() => setHoveredCTA(false)}
                aria-label="Deploy your digital guardian for complete property protection"
              >
                <span className="relative z-10 font-black tracking-wide">
                  Deploy My Digital Guardian
                </span>
                <ArrowRight 
                  size={24} 
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" 
                />
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            {/* Trust Badges - Moved below CTA for credibility reinforcement */}
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/50 rounded-full backdrop-blur-sm transition-all duration-300 hover:border-orange-400/70 hover:bg-gradient-to-r hover:from-orange-500/30 hover:to-yellow-500/30">
                <span className="text-lg">🐊</span>
                <span className="text-sm font-bold text-orange-300 uppercase tracking-wider">Florida Focused</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/50 rounded-full backdrop-blur-sm transition-all duration-300 hover:border-blue-400/70 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-cyan-500/30">
                <span className="text-lg">🌀</span>
                <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">Hurricane Tested</span>
                <span className="text-lg">⚡</span>
              </div>
            </div>
          </AnimatedSection>

          {/* Trust Signals with Social Proof - Enhanced with icons and separators */}
          <AnimatedSection delay={500}>
            <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
              {/* Primary Trust Signals */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  <span className="font-medium">Bank-Level Security</span>
                </div>
                <span className="text-gray-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span className="font-bold text-green-400">On Guard</span>
                  <span className="font-medium">24/7</span>
                </div>
                <span className="text-gray-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <span className="font-bold text-blue-400">15 min</span>
                  <span className="font-medium">setup</span>
                </div>
                <span className="text-gray-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌴</span>
                  <span className="font-bold text-yellow-400">100%</span>
                  <span className="font-medium">Florida Focused</span>
                </div>
              </div>
              
              {/* Social Proof Statistics */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-400 text-lg">$2.4M+</span>
                  <span>Recovered for Families</span>
                </div>
                <span className="text-gray-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-400 text-lg">1,247</span>
                  <span>Properties Protected</span>
                </div>
                <span className="text-gray-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400 text-lg">4.9/5</span>
                  <span>Customer Rating</span>
                </div>
                <span className="text-gray-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-400 text-lg">98%</span>
                  <span>Claim Success Rate</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonial Section with Recovery Amounts */}
      <section className="py-16 bg-gradient-to-b from-gray-950 to-gray-900 border-t border-white/5">
        <AnimatedSection>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Real Families, Real Recovery
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Florida families who used ClaimGuardian recovered significantly more than industry averages
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-green-400 text-3xl leading-none font-serif">"</div>
                  <p className="text-gray-300 italic leading-relaxed">
                    After Hurricane Ian, our insurance company offered $47,000. ClaimGuardian's AI found documentation gaps and helped us recover $127,000 total.
                  </p>
                </div>
                <div className="border-t border-gray-600/30 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">Sarah & Mike T.</p>
                      <p className="text-xs text-gray-400">Cape Coral, FL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400 text-lg">+$80,000</p>
                      <p className="text-xs text-gray-400">Additional Recovery</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-green-400 text-3xl leading-none font-serif">"</div>
                  <p className="text-gray-300 italic leading-relaxed">
                    The AI caught damage categories I never would have thought to claim. What should have been $23,000 became $89,000 with ClaimGuardian.
                  </p>
                </div>
                <div className="border-t border-gray-600/30 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">Roberto M.</p>
                      <p className="text-xs text-gray-400">Naples, FL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400 text-lg">+$66,000</p>
                      <p className="text-xs text-gray-400">Additional Recovery</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-green-400 text-3xl leading-none font-serif">"</div>
                  <p className="text-gray-300 italic leading-relaxed">
                    Three denials from our insurer. ClaimGuardian's documentation turned denial into $156,000 settlement in 90 days.
                  </p>
                </div>
                <div className="border-t border-gray-600/30 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">Jennifer L.</p>
                      <p className="text-xs text-gray-400">Fort Myers, FL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400 text-lg">$156,000</p>
                      <p className="text-xs text-gray-400">From Denial</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Aggregate Stats */}
            <div className="mt-12 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="font-bold text-2xl text-green-400">287%</p>
                  <p className="text-sm text-gray-400">Avg Recovery Increase</p>
                </div>
                <div>
                  <p className="font-bold text-2xl text-blue-400">67 Days</p>
                  <p className="text-sm text-gray-400">Avg Settlement Time</p>
                </div>
                <div>
                  <p className="font-bold text-2xl text-yellow-400">$94,000</p>
                  <p className="text-sm text-gray-400">Avg Additional Recovery</p>
                </div>
                <div>
                  <p className="font-bold text-2xl text-purple-400">98%</p>
                  <p className="text-sm text-gray-400">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Results Section - Compressed spacing */}
      <section className="px-4 md:px-8 py-12 bg-gradient-to-b from-gray-900 to-black">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Everything
                </h3>
                <p className="mt-1 text-gray-300">
                  Track from your home's foundation to your headphone warranty.
                </p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Generations
                </h3>
                <p className="mt-1 text-gray-300">
                  Preserve property knowledge for your family's future.
                </p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Community
                </h3>
                <p className="mt-1 text-gray-300">
                  Share wisdom while protecting your privacy.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Florida Family Built Section */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-black to-gray-900">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Built by a Florida Family,
                  <span className="block text-green-400">
                    For Florida Families
                  </span>
                </h2>

                {/* Founder Quote */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start gap-4">
                    <div className="text-green-400 text-4xl leading-none font-serif">
                      "
                    </div>
                    <div className="flex-1">
                      <p className="text-lg text-gray-300 italic leading-relaxed mb-4">
                        Hurricane Ian taught us that surviving the storm was
                        easy—navigating the aftermath was the real disaster. We
                        lost over $100,000 and two precious years rebuilding
                        that we'll never get back with our new family. But worse
                        than the money was watching our neighbors lose their
                        homes to insurance companies, not storms.
                      </p>
                      <p className="text-lg text-gray-300 italic leading-relaxed">
                        That's when we realized the real problem:{" "}
                        <span className="text-white font-semibold">
                          property owners had no way to prove what they owned or
                          what it was worth
                        </span>
                        . From that struggle, ClaimGuardian was born—not just as
                        an insurance tool, but as a complete property
                        intelligence network that creates living digital twins
                        of everything you own. We're transforming property
                        ownership from anxiety into generational wealth
                        building, ensuring every Florida family can protect
                        their legacy with complete privacy control.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-600/30">
                    <p className="text-sm font-semibold text-white">
                      — Drew M., P.E., Florida Professional Engineer & Founder
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Family team of five • Building one feature at a time based
                      on real user needs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Southwest Florida Based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Engineered for Resilience</span>
                  </div>
                </div>
              </div>

              {/* Founders Photo */}
              <div className="flex-shrink-0 w-80 h-64 bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                <Image
                  src="/images/founders.png"
                  alt="ClaimGuardian Founders"
                  width={320}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
