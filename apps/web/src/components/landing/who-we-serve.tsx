/**
 * @fileMetadata
 * @purpose "Who We Serve section showcasing target customers"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["WhoWeServe"]
 * @complexity medium
 * @tags ["landing", "services", "customers"]
 * @status stable
 */
"use client";

import { Home, Building, Users, Shield, Key, Briefcase } from "lucide-react";
import Image from "next/image";

const segments = [
  {
    icon: Home,
    title: "🏠 Homeowners",
    subtitle: "Turn your house into an appreciating asset.",
    description:
      "Track warranties, schedule maintenance, and capture every upgrade in one immutable record. Sell faster, negotiate harder, and avoid costly surprises.",
  },
  {
    icon: Key,
    title: "🔑 Renters",
    subtitle: "Secure your deposit—and your reputation.",
    description:
      "Timestamp move-in condition, log maintenance requests, and export a verified rental history that follows you to the next lease.",
  },
  {
    icon: Building,
    title: "📈 Real-Estate Professionals",
    subtitle: "Portfolio-wide ROI at a glance.",
    description:
      "AI ranks improvements by payback, flags deferred maintenance, and surfaces hidden equity across unlimited doors.",
  },
  {
    icon: Users,
    title: "👨‍👩‍👧‍👦 Growing Families",
    subtitle: "Protect what matters now—and for generations.",
    description:
      "Every repair, appliance manual, and lesson learned is stored for easy hand-off to kids or heirs.",
  },
  {
    icon: Briefcase,
    title: "🏢 Enterprise & Government",
    subtitle: "FEMA-NIMS compliant intelligence at scale.",
    description:
      "Multi-site dashboards, SOC 2 data security, and instant disaster-response reporting for institutional portfolios.",
  },
  {
    icon: Shield,
    title: "⚖️ Insurance & Legal",
    subtitle: "Evidence that wins.",
    description:
      "Chain-of-custody photo logs, policy compliance tracking, and AI-built timelines ready for carriers or court.",
  },
];

export function WhoWeServe() {
  return (
    <section
      id="who-we-serve"
      className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900"
    >
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4">
          <span className="text-white">Built for Every</span>
          <span className="text-green-400"> Florida Property Owner</span>
        </h2>
        <p className="text-xl text-gray-300 text-center max-w-4xl mx-auto mb-12">
          From your first home to your investment empire. From daily maintenance
          to disaster recovery. ClaimGuardian is your property's complete
          lifecycle command center.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {segments.map((segment, index) => {
            const Icon = segment.icon;
            return (
              <div key={index} className="text-left group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] hover:border-green-400/30 hover:shadow-[0_20px_60px_rgba(57,255,20,0.1)] transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-white">{segment.title}</h3>
                <p className="text-green-400 font-semibold mb-3 text-sm">{segment.subtitle}</p>
                <ul className="text-gray-300 space-y-1 text-sm">
                  {segment.description.split('. ').map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-400 mt-1.5 text-xs">•</span>
                      <span>{bullet}{i === segment.description.split('. ').length - 1 ? '' : '.'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Property Types We Protect - Simplified for TAM expansion */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-white">
            Property Types We Protect
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl backdrop-blur-sm hover:border-blue-400/50 transition-colors">
              <span className="text-3xl mb-2">🌊</span>
              <h4 className="text-white font-semibold text-sm text-center">Waterfront Estates</h4>
              <p className="text-blue-300 text-xs text-center mt-1">hurricane-resilient documentation & flood-risk modeling</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-400/30 rounded-xl backdrop-blur-sm hover:border-green-400/50 transition-colors">
              <span className="text-3xl mb-2">🏡</span>
              <h4 className="text-white font-semibold text-sm text-center">Modern Homes</h4>
              <p className="text-green-300 text-xs text-center mt-1">smart-device data feeds & comprehensive coverage</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-400/30 rounded-xl backdrop-blur-sm hover:border-yellow-400/50 transition-colors">
              <span className="text-3xl mb-2">🏘️</span>
              <h4 className="text-white font-semibold text-sm text-center">Historical Properties</h4>
              <p className="text-yellow-300 text-xs text-center mt-1">materials provenance & preservation audit trails</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl backdrop-blur-sm hover:border-purple-400/50 transition-colors">
              <span className="text-3xl mb-2">🏢</span>
              <h4 className="text-white font-semibold text-sm text-center">Multi-Family / Commercial</h4>
              <p className="text-purple-300 text-xs text-center mt-1">unit-level analytics & CAP-rate optimization</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
