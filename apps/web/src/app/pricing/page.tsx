/**
 * @fileMetadata
 * @purpose "Pricing page displaying subscription plans"
 * @dependencies ["@/components","lucide-react","next"]
 * @owner billing-team
 * @status stable
 */

import { Metadata } from 'next'
import { PricingPlans } from '@/components/pricing/pricing-plans'
import { PricingFAQ } from '@/components/pricing/pricing-faq'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing | ClaimGuardian',
  description: 'Choose the perfect plan for protecting your Florida property',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold text-white">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Choose the plan that's right for you. Upgrade or downgrade at any time.
          </p>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Claims per year
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    AI requests/month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">50</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">1,000</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">5,000</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Storage
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">1 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">10 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">50 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    Support
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">Community</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">Priority</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-400">Priority</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-400">Dedicated</td>
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
            Join thousands of Florida property owners who trust ClaimGuardian
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
  )
}