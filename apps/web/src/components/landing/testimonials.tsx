/**
 * @fileMetadata
 * @purpose "Testimonials section with single featured testimonial"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["Testimonials"]
 * @complexity low
 * @tags ["landing", "testimonials", "social-proof"]
 * @status stable
 */
"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

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

export function Testimonials() {
  const testimonial = {
    quote:
      "Documenting everything after the storm used to take weeks. With ClaimGuardian, I had a complete, undeniable evidence package in under an hour. My claim was paid while my neighbors were still taking pictures. It's a game-changer.",
    author: "Marissa M.",
    location: "Port Charlotte, FL",
    userSince: "ClaimGuardian Member Since 2023",
    highlight: "Claim paid in record time",
  };

  return (
    <section className="px-4 md:px-8 py-20 bg-gradient-to-b from-gray-900 to-black">
      <AnimatedSection className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
          <span className="text-white">Real Stories.</span>
          <span className="text-green-400"> Real Results.</span>
        </h2>

        <div className="relative">
          {/* Main Testimonial Display */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 md:p-12 mb-8">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={28}
                  className="text-yellow-400"
                  fill="currentColor"
                />
              ))}
            </div>

            <blockquote className="font-slab text-xl md:text-2xl lg:text-3xl font-medium italic text-white text-center max-w-4xl mx-auto leading-relaxed">
              "{testimonial.quote}"
            </blockquote>

            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-white">
                {testimonial.author}, {testimonial.location}
              </p>
              <p className="text-sm text-gray-400">{testimonial.userSince}</p>
              <p className="mt-2 text-green-400 font-semibold">
                {testimonial.highlight}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-green-400">100%</div>
            <div className="text-gray-400 text-sm mt-1">Florida Focused</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">AI-First</div>
            <div className="text-gray-400 text-sm mt-1">Technology</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-400">15 min</div>
            <div className="text-gray-400 text-sm mt-1">Property Setup</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400">24/7</div>
            <div className="text-gray-400 text-sm mt-1">AI Monitoring</div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
