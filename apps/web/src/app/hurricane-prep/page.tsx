/**
 * @fileMetadata
 * @purpose Hurricane preparation guide page
 * @owner frontend-team
 * @status active
 */

import Link from 'next/link'
import { Shield, Home, ArrowLeft, Download, CheckCircle } from 'lucide-react'

export default function HurricanePrepPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Hurricane Season 2025 Prep Playbook</h1>
          <p className="text-xl text-gray-300">Your complete guide to protecting your Florida property</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Pre-Hurricane Checklist</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Document Everything</h3>
                <p className="text-gray-400">Take photos/videos of all property, inside and out</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Review Insurance Coverage</h3>
                <p className="text-gray-400">Ensure policies are up-to-date and understand deductibles</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Secure Property</h3>
                <p className="text-gray-400">Install shutters, trim trees, secure outdoor items</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-green-400 text-black font-bold py-4 px-8 rounded-full hover:bg-green-300 transition-colors"
          >
            <Home className="w-5 h-5" />
            Start Protecting Your Property
          </Link>
          
          <p className="mt-4 text-gray-400">
            Built specifically for Florida property owners
          </p>
        </div>
      </div>
    </div>
  )
}