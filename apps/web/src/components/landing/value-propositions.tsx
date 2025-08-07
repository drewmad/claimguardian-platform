/**
 * @fileMetadata
 * @purpose "Strategic value propositions optimized for maximum conversion"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["ValuePropositions"]
 * @complexity high
 * @tags ["landing", "value-props", "conversion"]
 * @status stable
 */
"use client";

import { Shield, Lock, TrendingUp, Clock, Zap } from "lucide-react";
import { liquidGlass } from "@/lib/styles/liquid-glass";
import { useState, useEffect, useRef } from "react";

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

const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const valueProps = [
  {
    icon: Shield,
    iconEmoji: "🛡️",
    title: "Complete Independence",
    headline: "Zero conflicts. Zero bias. Zero compromises.",
    benefits: [
      "No insurance company funding",
      "No contractor partnerships", 
      "No data monetization",
      "Your advocate, period."
    ],
    gradient: "from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/25",
    badge: "ZERO CONFLICTS",
    badgeColor: "bg-green-500/20 text-green-400 border-green-400/50"
  },
  {
    icon: Lock,
    iconEmoji: "🔒",
    title: "Privacy-First Architecture",
    headline: "Private backend now, in-house AI coming soon",
    benefits: [
      "Private backend infrastructure",
      "Bank-level encryption + SOC 2",
      "In-house AI development roadmap",
      "Zero data sales to insurers"
    ],
    gradient: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/25",
    badge: "BUILDING INDEPENDENCE",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-400/50",
    roadmap: "🚧 Currently developing proprietary AI to eliminate all third-party dependencies"
  },
  {
    icon: TrendingUp,
    iconEmoji: "📈",
    title: "Maximum Recovery",
    headline: "47% average claims increase through AI optimization",
    benefits: [
      "AI-powered policy interpretation",
      "Complete damage documentation",
      "Settlement negotiation leverage",
      "Beats human adjusters consistently"
    ],
    gradient: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/25",
    badge: "47% INCREASE",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-400/50"
  },
  {
    icon: Clock,
    iconEmoji: "⏱️",
    title: "Time Liberation",
    headline: "35+ hours saved annually through automation",
    benefits: [
      "90% automated documentation",
      "Multi-modal AI processing",
      "No adjuster phone tag",
      "Instant photo/document analysis"
    ],
    gradient: "from-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/25",
    badge: "35+ HOURS SAVED",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-400/50"
  },
  {
    icon: Zap,
    iconEmoji: "🌪️",
    title: "Hurricane-Tested Expertise",
    headline: "Built by survivors, powered by Florida-specific AI",
    benefits: [
      "Hurricane Ian survivor-built",
      "Florida PE-engineered",
      "25+ years storm data training",
      "10,000+ member network"
    ],
    gradient: "from-cyan-500 to-teal-500",
    shadowColor: "shadow-cyan-500/25",
    badge: "HURRICANE TESTED",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-400/50"
  }
];

export function ValuePropositions() {
  return (
    <section className="px-4 md:px-8 py-20 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-slab text-3xl md:text-4xl font-bold text-white mb-4">
            Why ClaimGuardian Dominates
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Strategic advantages that deliver measurable results, not empty promises
          </p>
        </div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <AnimatedCard
                key={index}
                delay={index * 100}
                className={index === 4 ? "md:col-span-2 lg:col-span-1" : ""}
              >
                <div className="h-full bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:scale-105 hover:border-gray-600 transition-all duration-300 group relative overflow-hidden">
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${prop.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-1 px-2 py-1 ${prop.badgeColor} border rounded-full text-xs font-bold mb-4`}>
                    {prop.badge}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${prop.gradient} p-3 mb-4 group-hover:scale-110 transition-transform ${prop.shadowColor} shadow-lg`}>
                    <Icon className="w-full h-full text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {prop.title}
                  </h3>

                  {/* Headline */}
                  <p className="text-sm text-gray-300 mb-4 font-medium">
                    {prop.headline}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-4">
                    {prop.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-sm text-gray-400 leading-tight">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Roadmap Note (if applicable) */}
                  {prop.roadmap && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <p className="text-xs text-gray-500 italic">
                        {prop.roadmap}
                      </p>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-300 mb-6">
            Join thousands of Florida property owners who've discovered the difference
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/auth/signup"
              className="group relative font-bold py-4 px-8 text-black text-lg hover:scale-105 inline-flex items-center gap-2 shadow-2xl rounded-2xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #39FF14, #32CD32)",
                boxShadow: "0 0 20px rgba(57, 255, 20, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              Start Protecting Your Property →
            </a>
            <a
              href="#testimonials"
              className="text-gray-400 hover:text-white transition-colors underline"
            >
              See what our members say
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}