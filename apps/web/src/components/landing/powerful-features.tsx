"use client";

import { Shield, Zap, Eye, Archive, ArrowRight } from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Shield,
    title: "Policy Shield Analysis",
    description: "Uncover hidden coverage and protect against denials.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    icon: Zap,
    title: "Lightning-Fast Documentation",
    description: "Generate comprehensive claim packages in minutes.",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  {
    icon: Eye,
    title: "Real-Time Claim Tracking",
    description: "Monitor every step of your claim journey.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    icon: Archive,
    title: "Evidence Vault",
    description: "Secure, organized storage for all claim materials.",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  }
];

export function PowerfulFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features Built for Results
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Every feature is designed with one goal: maximizing your insurance settlement.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative bg-gray-800/50 backdrop-blur-sm border ${feature.borderColor} rounded-2xl p-6 transition-all duration-300 hover:bg-gray-800/70 hover:scale-[1.02] cursor-pointer`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`${feature.bgColor} p-4 rounded-xl`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-6 h-6 text-gray-500 transition-all duration-300 ${
                    hoveredIndex === index ? 'translate-x-2 text-white' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}