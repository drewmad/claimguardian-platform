/**
 * @fileMetadata
 * @purpose "Property lifecycle overview section for landing page"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/styles/liquid-glass"]
 * @exports ["PropertyLifecycle"]
 * @complexity medium
 * @tags ["landing", "lifecycle", "property-management"]
 * @status stable
 */
"use client";

import {
  Home,
  Shield,
  TrendingUp,
  Clock,
  Wrench,
  FileText,
  AlertTriangle,
  Building,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

export function PropertyLifecycle() {
  const [activePhase, setActivePhase] = useState<
    "buy" | "own" | "crisis" | "legacy"
  >("buy");

  const phases = {
    buy: {
      title: "Buy & Document",
      icon: Home,
      color: "green",
      features: [
        "Pre-purchase inspection documentation",
        "Complete property digital twin creation",
        "Initial warranty registration",
        "Baseline value establishment",
      ],
    },
    own: {
      title: "Own & Optimize",
      icon: Wrench,
      color: "blue",
      features: [
        "Automated maintenance scheduling",
        "Warranty tracking & alerts",
        "Improvement documentation",
        "Value appreciation tracking",
      ],
    },
    crisis: {
      title: "Crisis & Recovery",
      icon: AlertTriangle,
      color: "orange",
      features: [
        "Pre-disaster preparation",
        "Real-time damage documentation",
        "AI-powered claim optimization",
        "Settlement maximization",
      ],
    },
    legacy: {
      title: "Legacy & Transfer",
      icon: Building,
      color: "purple",
      features: [
        "Complete property history",
        "Generational knowledge transfer",
        "Investment ROI documentation",
        "Family wealth preservation",
      ],
    },
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-black">
      <AnimatedSection className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Your Property's</span>
            <span className="text-green-400"> Complete Lifecycle</span>
            <span className="text-white"> Command Center</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            From the day you sign to the legacy you leave. Every phase of
            property ownership, intelligently managed and forever protected.
          </p>
        </div>

        {/* Interactive Timeline */}
        <div className="mb-12">
          <div className="flex justify-center items-center gap-2 md:gap-8 mb-8">
            {Object.entries(phases).map(([key, phase], index) => {
              const Icon = phase.icon;
              const isActive = activePhase === key;

              return (
                <button
                  key={key}
                  onClick={() => setActivePhase(key as typeof activePhase)}
                  className="relative group"
                >
                  {/* Connection line removed per user request */}

                  {/* Icon circle */}
                  <div
                    className={`
                    relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center
                    transition-all duration-300 transform
                    ${
                      isActive
                        ? `bg-${phase.color}-600/30 border-2 border-${phase.color}-400 scale-110`
                        : "bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600"
                    }
                  `}
                  >
                    <Icon
                      className={`
                      w-6 h-6 md:w-8 md:h-8
                      ${isActive ? `text-${phase.color}-400` : "text-gray-400"}
                    `}
                    />
                  </div>

                  {/* Label */}
                  <div
                    className={`
                    absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs md:text-sm font-medium
                    ${isActive ? "text-white" : "text-gray-500"}
                  `}
                  >
                    {phase.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Phase Details */}
        <AnimatedSection delay={100}>
          <div className="max-w-4xl mx-auto">
            <div
              className={`
              p-8 rounded-2xl backdrop-blur-xl
              ${activePhase === "buy" && "bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30"}
              ${activePhase === "own" && "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30"}
              ${activePhase === "crisis" && "bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-700/30"}
              ${activePhase === "legacy" && "bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30"}
            `}
            >
              <div className="flex items-start gap-6">
                <div
                  className={`
                  p-4 rounded-xl
                  ${activePhase === "buy" && "bg-green-600/20"}
                  ${activePhase === "own" && "bg-blue-600/20"}
                  ${activePhase === "crisis" && "bg-orange-600/20"}
                  ${activePhase === "legacy" && "bg-purple-600/20"}
                `}
                >
                  {(() => {
                    const Icon = phases[activePhase].icon;
                    return <Icon className="w-8 h-8 text-white" />;
                  })()}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {phases[activePhase].title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phases[activePhase].features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`
                          w-2 h-2 rounded-full
                          ${activePhase === "buy" && "bg-green-400"}
                          ${activePhase === "own" && "bg-blue-400"}
                          ${activePhase === "crisis" && "bg-orange-400"}
                          ${activePhase === "legacy" && "bg-purple-400"}
                        `}
                        />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom Stats */}
        <AnimatedSection delay={200}>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400">15 min</div>
              <div className="text-gray-400 text-sm mt-1">
                Property setup time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">$12K+</div>
              <div className="text-gray-400 text-sm mt-1">
                Avg. savings per year
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">24/7</div>
              <div className="text-gray-400 text-sm mt-1">AI monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">Forever</div>
              <div className="text-gray-400 text-sm mt-1">Legacy preserved</div>
            </div>
          </div>
        </AnimatedSection>
      </AnimatedSection>
    </section>
  );
}
