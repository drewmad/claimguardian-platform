'use client'

import { Card } from '@claimguardian/ui'
import { Home, FileText, Shield, Users } from 'lucide-react'

export default function DashboardPage() {
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
        <h1 className="text-2xl font-bold text-white">ClaimGuardian Dashboard</h1>
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