/**
 * @fileMetadata
 * @purpose "Pricing page displaying subscription plans"
 * @dependencies ["@/components","lucide-react","next"]
 * @owner billing-team
 * @status stable
 */

import { Metadata } from "next";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | ClaimGuardian",
  description: "Choose the perfect plan for protecting your Florida property",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold text-white">
                Back to Home
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
              🌀 Hurricane Season Ready • FEMA NIMS Compliant
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            AI-Powered Insurance Advocacy
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              + Emergency Management
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            The only platform combining insurance claim optimization with federal emergency management. 
            Protect your property before, during, and after disasters.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">30-40% higher claim payouts</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">FEMA NIMS compliant</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">24/7 AI assistance</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-400">Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm text-gray-400">
              Annual
              <span className="ml-2 text-green-400 font-medium">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingPlans />
        </div>
      </section>

      {/* Enterprise Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-900 via-gray-800/50 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 mb-4">
              Enterprise Exclusive
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">
              Federal Emergency Management Platform
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Enterprise plans include our complete FEMA NIMS-compliant emergency management system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-600/50 transition-all">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚨</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Incident Command System</h3>
              <p className="text-sm text-gray-400">
                Full ICS integration with Type 1-5 incident complexity support and real-time coordination
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-600/50 transition-all">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📡</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Emergency Communications</h3>
              <p className="text-sm text-gray-400">
                CAP 1.2 and EDXL protocol support with NWS, FEMA, and Red Cross API integrations
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-600/50 transition-all">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Resource Management</h3>
              <p className="text-sm text-gray-400">
                NIMS-compliant resource typing, deployment tracking, and automated response workflows
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Potential value: <span className="text-purple-400 font-semibold">$500K-5M per implementation</span>
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
              Schedule Enterprise Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Compare features across plans
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800/50 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Homeowner
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Landlord
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Properties
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    10
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Claims per year
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    AI requests/month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    50
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    1,000
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    5,000
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Storage
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    1 GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    10 GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    50 GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Unlimited
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Support
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Community
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Priority
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Priority
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    Dedicated
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Disaster Preparedness
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Basic alerts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Full tracking
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    Advanced tools
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    FEMA NIMS
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Document Generation
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    ✓
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    ✓
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    ✓ + Custom
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    API Access
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    ✓
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">
                    ✓ + Priority
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently asked questions
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to protect your property?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join ClaimGuardian and protect your property with AI-powered
            intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
              >
                Start free trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg"
              >
                Contact sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
