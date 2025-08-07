/**
 * @fileMetadata
 * @purpose "Hurricane preparation lead magnet with downloadable PDF guide"
 * @dependencies ["lucide-react","next"]
 * @owner frontend-team
 * @status stable
 */

import { Metadata } from "next";
import { Shield, ArrowLeft, CheckCircle, Download, Camera, FileText, Clock, AlertTriangle, Phone, Home, DollarSign, Zap } from "lucide-react";
import Link from "next/link";
import { HurricanePrepForm } from "@/components/lead-magnets/hurricane-prep-form";

export const metadata: Metadata = {
  title: "Hurricane Prep Guide 2025 | ClaimGuardian - Free Florida Property Protection Checklist",
  description: "Complete Hurricane Season 2025 preparation guide for Florida property owners. Free downloadable PDF checklist with room-by-room documentation tips.",
  keywords: "hurricane preparation, Florida hurricane checklist, property protection, storm preparation, insurance documentation",
  openGraph: {
    title: "Hurricane Prep Guide 2025 - Free Florida Checklist",
    description: "Complete hurricane preparation guide with downloadable PDF. Protect your Florida property with proven strategies.",
    url: "https://claimguardianai.com/hurricane-prep",
  },
};

const PrepStep = ({ 
  icon: Icon, 
  title, 
  description, 
  timeframe,
  priority = "normal"
}: { 
  icon: any, 
  title: string, 
  description: string, 
  timeframe: string,
  priority?: "high" | "normal"
}) => (
  <div className={`flex items-start gap-4 p-6 rounded-xl border ${
    priority === "high" 
      ? "bg-red-900/20 border-red-400/30" 
      : "bg-gray-800/50 border-gray-700/50"
  }`}>
    <div className={`p-3 rounded-lg flex-shrink-0 ${
      priority === "high" 
        ? "bg-red-400/20" 
        : "bg-green-400/20"
    }`}>
      <Icon className={`w-6 h-6 ${
        priority === "high" 
          ? "text-red-400" 
          : "text-green-400"
      }`} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          priority === "high"
            ? "bg-red-500/20 text-red-400"
            : "bg-blue-500/20 text-blue-400"
        }`}>
          {timeframe}
        </span>
      </div>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

const RoomChecklist = ({ room, items }: { room: string, items: string[] }) => (
  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
      <Home className="w-5 h-5 text-green-400" />
      {room}
    </h4>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default function HurricanePrepPage() {
  const roomChecklists = [
    {
      room: "Living Areas",
      items: [
        "All furniture, electronics, artwork",
        "Model numbers of TVs, appliances",
        "Receipt photos for expensive items",
        "Wide shots showing room layout"
      ]
    },
    {
      room: "Kitchen",
      items: [
        "All appliances with serial numbers",
        "Cabinet contents (dishes, cookware)",
        "Pantry items and quantities",
        "Recent renovation receipts"
      ]
    },
    {
      room: "Bedrooms",
      items: [
        "Furniture, mattresses, bedding",
        "Clothing in closets",
        "Jewelry and valuables",
        "Electronics and personal items"
      ]
    },
    {
      room: "Bathrooms",
      items: [
        "Fixtures, vanities, mirrors",
        "Toiletries and medications",
        "Towels and linens",
        "Recent remodel documentation"
      ]
    },
    {
      room: "Exterior",
      items: [
        "Roof condition, shingles, gutters",
        "Windows, doors, screens",
        "Landscaping, pool, deck",
        "HVAC units, generators"
      ]
    },
    {
      room: "Garage/Storage",
      items: [
        "Tools, equipment, vehicles",
        "Holiday decorations, seasonal items",
        "Sporting goods, hobby equipment",
        "Storage contents by category"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-900/20 to-slate-950 border-b border-red-400/20">
        <div className="container mx-auto px-6 py-16 max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              Hurricane Season Active - Days Left Until November 30
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              Hurricane Season 2025 
              <span className="block text-green-400">Complete Prep Guide</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Protect your Florida property with our comprehensive preparation guide. 
              Room-by-room checklists, documentation strategies, and post-storm claim optimization.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-green-900/20 border border-green-400/30 rounded-xl p-6 text-center">
              <Camera className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Photo Documentation</h3>
              <p className="text-sm text-gray-400">Step-by-step photo guides for maximum claim recovery</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-400/30 rounded-xl p-6 text-center">
              <FileText className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Policy Page References</h3>
              <p className="text-sm text-gray-400">Critical policy sections to screenshot before storms</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-xl p-6 text-center">
              <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Deductible Math</h3>
              <p className="text-sm text-gray-400">Calculate your actual out-of-pocket costs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Left Column - Content Preview */}
          <div>
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-400" />
                Timeline-Based Preparation
              </h2>
              <div className="space-y-6">
                <PrepStep
                  icon={AlertTriangle}
                  title="Hurricane Watch Issued"
                  description="Complete property documentation, secure outdoor items, review insurance policies"
                  timeframe="72 hours before"
                  priority="high"
                />
                <PrepStep
                  icon={Camera}
                  title="Document Everything"
                  description="Photograph all rooms, contents, and exterior conditions while you have power"
                  timeframe="48 hours before"
                  priority="high"
                />
                <PrepStep
                  icon={Shield}
                  title="Secure Property"
                  description="Install hurricane shutters, move vehicles, shut off utilities as needed"
                  timeframe="24 hours before"
                  priority="high"
                />
                <PrepStep
                  icon={Phone}
                  title="Emergency Contacts"
                  description="Confirm contractor contacts, adjuster info, and family emergency plans"
                  timeframe="12 hours before"
                />
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-8">
                Room-by-Room Documentation Guide
              </h2>
              <p className="text-gray-300 mb-6">
                Our comprehensive guide includes detailed checklists for every area of your home. 
                Here's a preview of what's included:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {roomChecklists.slice(0, 4).map((room, index) => (
                  <RoomChecklist key={index} room={room.room} items={room.items.slice(0, 3)} />
                ))}
              </div>
              <div className="mt-6 p-4 bg-green-900/20 border border-green-400/30 rounded-lg">
                <p className="text-green-400 font-medium">
                  + 2 more detailed room checklists, exterior documentation guide, 
                  and post-storm claim strategies in the complete PDF
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                What's Inside the Complete Guide
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">47-page comprehensive PDF</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Room-by-room photo checklists</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Policy page screenshot guide</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Deductible calculation worksheets</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Emergency contact templates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Post-storm claim optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Contractor vetting checklist</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">Evidence preservation strategies</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Lead Capture Form */}
          <div className="lg:sticky lg:top-8">
            <HurricanePrepForm />
          </div>
        </div>

        {/* Additional Trust Building */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            Why Florida Property Owners Trust ClaimGuardian
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">$2.4M+</div>
              <div className="text-gray-400">Recovered for families</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">1,247</div>
              <div className="text-gray-400">Properties protected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">98%</div>
              <div className="text-gray-400">Claim success rate</div>
            </div>
          </div>

          <div className="mt-12 bg-gray-800/30 border border-gray-700/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Ready for Complete Property Protection?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              After downloading your hurricane prep guide, create your complete digital twin 
              with ClaimGuardian's AI-powered property intelligence platform.
            </p>
            <Link
              href="/auth/signup?utm_source=hurricane_prep&utm_medium=lead_magnet"
              className="inline-flex items-center gap-2 bg-green-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-green-300 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Start Free Protection
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}