/**
 * @fileMetadata
 * @purpose "Value proposition boxes that appear after hero section"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["ValuePropositions"]
 * @complexity medium
 * @tags ["landing", "value-props", "features"]
 * @status stable
 */
"use client";

import { Shield, Clock, TrendingUp } from "lucide-react";
import { liquidGlass } from "@/lib/styles/liquid-glass";

const valueProps = [
  {
    icon: Shield,
    title: "Full Property Protection",
    description: "Track everything from foundation to faucets with AI-powered precision",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clock,
    title: "15-Minute Setup",
    description: "Create your complete digital twin faster than a pizza delivery",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "3X Faster Claims",
    description: "Get paid in days, not months, with irrefutable documentation",
    gradient: "from-purple-500 to-pink-500",
  },
];

export function ValuePropositions() {
  return (
    <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <div
                key={index}
                className={`${liquidGlass.backgrounds.secondary} border border-white/10 rounded-2xl p-6 hover:scale-105 hover:border-white/20 transition-all duration-300 group`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${prop.gradient} p-3 mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {prop.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}