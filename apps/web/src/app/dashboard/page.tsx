'use client'

import React from 'react'
import { Card } from '@claimguardian/ui'
import { Home, FileText, Shield, Users, LogOut, Brain, Camera, Package, Sparkles } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import Link from 'next/link'

function DashboardContent() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <style jsx>{`
        .card-bg {
          background: linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.8) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          backdrop-filter: blur(10px);
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-lg border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">ClaimGuardian Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Welcome, {user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to ClaimGuardian</h2>
          <p className="text-slate-300 text-lg">
            Your AI-powered insurance claim advocate platform. Manage your properties, claims, and documentation all in one place.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Properties</h3>
                <p className="text-slate-400">Manage your assets</p>
              </div>
            </div>
          </Card>

          <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 p-3 rounded-full">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Claims</h3>
                <p className="text-slate-400">Track your claims</p>
              </div>
            </div>
          </Card>

          <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-3 rounded-full">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Policies</h3>
                <p className="text-slate-400">Insurance coverage</p>
              </div>
            </div>
          </Card>

          <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-600 p-3 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Support</h3>
                <p className="text-slate-400">Get assistance</p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Augmented Features */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <h3 className="text-2xl font-semibold text-white">AI-Powered Tools</h3>
            <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 text-xs rounded-full font-medium">NEW</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/ai-augmented/policy-chat">
              <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-full">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Policy Chat</h4>
                  <p className="text-slate-400 text-sm">Get instant answers about your insurance coverage and policies</p>
                </div>
              </Card>
            </Link>

            <Link href="/ai-augmented/damage-analyzer">
              <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-full">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Damage Analyzer</h4>
                  <p className="text-slate-400 text-sm">Upload photos for AI-powered damage assessment and documentation</p>
                </div>
              </Card>
            </Link>

            <Link href="/ai-augmented/inventory-scanner">
              <Card className="card-bg rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-full">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Inventory Scanner</h4>
                  <p className="text-slate-400 text-sm">Automatically catalog belongings for insurance documentation</p>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="card-bg rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Start New Claim
              </button>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Add Property
              </button>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Upload Documents
              </button>
            </div>
          </Card>

          <Card className="card-bg rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Account created successfully</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300">Welcome to ClaimGuardian</span>
              </div>
              <div className="text-slate-400 text-sm mt-4">
                Get started by adding your first property or exploring our features.
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}