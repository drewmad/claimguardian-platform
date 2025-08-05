/**
 * @fileMetadata
 * @purpose Pricing page displaying subscription plans
 * @owner billing-team
 * @status active
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that&apos;s right for you. Upgrade or downgrade at any time.
          </p>
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-600">Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm text-gray-600">
              Annual
              <span className="ml-2 text-green-600 font-medium">Save 17%</span>
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
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare features across plans
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Homeowner
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Landlord
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Properties
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Claims per year
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    AI requests/month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">50</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">1,000</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">5,000</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Storage
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">1 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">10 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">50 GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Support
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Community</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Priority</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Priority</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently asked questions
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to protect your property?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Florida property owners who trust ClaimGuardian
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Start free trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                Contact sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}