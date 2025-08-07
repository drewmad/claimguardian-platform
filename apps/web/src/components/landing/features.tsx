/**
 * @fileMetadata
 * @purpose "Displays the value proposition and key features section on the landing page."
 * @dependencies ["@/lib","lucide-react","react"]
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Value proposition section with animated cards"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants"]
 * @exports ["Features"]
 * @complexity medium
 * @tags ["landing", "value-props", "animated"]
 * @status stable
 */
"use client";

import { Clock, DollarSign, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { liquidGlass } from "@/lib/styles/liquid-glass";

// Animation hook reused
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

export function Features() {
  return (
    <section
      id="features"
      className="px-4 md:px-8 py-20 bg-gradient-to-b from-gray-900 to-black"
    >
      <AnimatedSection className="max-w-6xl mx-auto text-center">
        <h2 className="font-slab text-3xl md:text-5xl font-bold">
          <span className="text-white">The ClaimGuardian Difference</span>
          <span className="block mt-3 text-2xl md:text-3xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Your Property's Complete Lifecycle Command Center
          </span>
        </h2>
        <p className="mt-6 max-w-4xl mx-auto text-xl text-gray-300">
          More than insurance claims. More than documentation. ClaimGuardian is
          your AI-powered property command center—from the day you buy to the
          legacy you leave.
        </p>

        {/* The Three Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className={`${liquidGlass.cards.success} p-8 rounded-2xl h-full flex flex-col text-left transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-green-400 to-green-600 text-black`}
              >
                <Clock size={24} />
              </div>
              <h3
                className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}
              >
                Before: Prepare & Protect
              </h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-green-400">
                Document everything before disaster strikes.
              </span>{" "}
              Create digital twins of every item, track warranties, schedule
              maintenance, and build an unbreakable record of ownership. Your
              property's complete story, protected forever.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Photo documentation
                with AI cataloging
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Warranty tracking &
                alerts
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Maintenance scheduling
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Value tracking &
                depreciation
              </div>
            </div>
          </div>

          <div
            className={`${liquidGlass.cards.warning} p-8 rounded-2xl h-full flex flex-col text-left transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-orange-400 to-orange-600 text-black`}
              >
                <ShieldCheck size={24} />
              </div>
              <h3
                className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}
              >
                During: Command & Control
              </h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-orange-400">
                When disaster strikes, take command.
              </span>{" "}
              Real-time damage documentation, AI-powered claim optimization, and
              instant access to your complete property history. Fight back with
              intelligence, not emotion.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">✓</span> AI damage assessment
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">✓</span> Claim optimization
                engine
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">✓</span> Evidence organization
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">✓</span> Settlement analyzer
              </div>
            </div>
          </div>

          <div
            className={`${liquidGlass.cards.primary} p-8 rounded-2xl h-full flex flex-col text-left transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`${liquidGlass.iconContainers.medium} bg-gradient-to-br from-purple-400 to-purple-600 text-black`}
              >
                <DollarSign size={24} />
              </div>
              <h3
                className={`font-bold text-xl text-white ${liquidGlass.text.shadowLight}`}
              >
                After: Optimize & Build
              </h3>
            </div>
            <p className="text-base text-gray-300 flex-grow leading-relaxed">
              <span className="font-semibold text-purple-400">
                Transform ownership into wealth.
              </span>{" "}
              Track improvements, optimize investments, and build a property
              legacy that transfers seamlessly to the next generation. Every
              lesson learned becomes family wisdom.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> Investment tracking
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> Improvement
                documentation
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> Generational transfer
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> Community insights
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">
            One Platform. Complete Control. Forever Protected.
          </h3>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Transform scattered documents and forgotten warranties into
            organized intelligence. Built by a Florida family for property
            owners who demand better protection.
          </p>
        </div>
      </AnimatedSection>
    </section>
  );
}
