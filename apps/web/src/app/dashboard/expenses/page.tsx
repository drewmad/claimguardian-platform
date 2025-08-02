'use client'

import { 
  DollarSign, Receipt, TrendingUp,
  Calendar, Filter, Download, Upload, Search,
  Home, Wrench, ShoppingCart, Zap, Package,
  Plus, Camera, FileText, PieChart
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function ExpensesPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [, setSelectedMonth] = useState('current')

  const categories = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-blue-400' },
    { id: 'utilities', label: 'Utilities', icon: Zap, color: 'text-yellow-400' },
    { id: 'insurance', label: 'Insurance', icon: Home, color: 'text-green-400' },
    { id: 'repairs', label: 'Repairs', icon: Wrench, color: 'text-orange-400' },
    { id: 'supplies', label: 'Supplies', icon: ShoppingCart, color: 'text-purple-400' },
    { id: 'other', label: 'Other', icon: Package, color: 'text-gray-400' }
  ]

  const recentExpenses = [
    {
      id: 1,
      description: 'HVAC Annual Service',
      category: 'maintenance',
      amount: 285.00,
      date: '2024-01-15',
      vendor: 'Cool Air Services',
      hasReceipt: true,
      status: 'deductible'
    },
    {
      id: 2,
      description: 'Electric Bill - January',
      category: 'utilities',
      amount: 187.43,
      date: '2024-01-10',
      vendor: 'Florida Power & Light',
      hasReceipt: true,
      status: 'recurring'
    },
    {
      id: 3,
      description: 'Roof Repair - Storm Damage',
      category: 'repairs',
      amount: 1250.00,
      date: '2024-01-08',
      vendor: 'Premier Roofing',
      hasReceipt: true,
      status: 'claimable'
    },
    {
      id: 4,
      description: 'Home Insurance Premium',
      category: 'insurance',
      amount: 425.00,
      date: '2024-01-01',
      vendor: 'State Farm',
      hasReceipt: true,
      status: 'recurring'
    },
    {
      id: 5,
      description: 'Cleaning Supplies',
      category: 'supplies',
      amount: 67.89,
      date: '2023-12-28',
      vendor: 'Home Depot',
      hasReceipt: true,
      status: 'standard'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deductible': return 'bg-green-500/20 text-green-300'
      case 'claimable': return 'bg-blue-500/20 text-blue-300'
      case 'recurring': return 'bg-purple-500/20 text-purple-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? { Icon: category.icon, color: category.color } : { Icon: Package, color: 'text-gray-400' }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                Expense Tracker
              </h1>
              <p className="text-gray-400">Track and categorize all property-related expenses</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button 
                onClick={() => router.push('/ai-tools/receipt-scanner')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan Receipt
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Expense
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-xs text-gray-400">This Month</span>
              </div>
              <p className="text-2xl font-bold text-white">$2,215.32</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">+12% vs last month</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Receipt className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-gray-400">YTD Total</span>
              </div>
              <p className="text-2xl font-bold text-white">$15,432.78</p>
              <p className="text-sm text-gray-400 mt-2">Across 127 expenses</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-6 h-6 text-cyan-400" />
                <span className="text-xs text-gray-400">Tax Deductible</span>
              </div>
              <p className="text-2xl font-bold text-white">$8,765.00</p>
              <p className="text-sm text-gray-400 mt-2">56% of total</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <PieChart className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-gray-400">Largest Category</span>
              </div>
              <p className="text-2xl font-bold text-white">Repairs</p>
              <p className="text-sm text-gray-400 mt-2">$4,850 (31%)</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500">
              <option value="current">This Month</option>
              <option value="last">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>

          {/* Category Breakdown */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map(category => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedCategory === category.id
                        ? 'bg-gray-700 border-cyan-500'
                        : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${category.color} mb-2`} />
                    <p className="text-sm text-white">{category.label}</p>
                    <p className="text-xs text-gray-400 mt-1">$1,234</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Expenses</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {recentExpenses.map(expense => {
                const { Icon, color } = getCategoryIcon(expense.category)
                return (
                  <div key={expense.id} className="p-6 hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{expense.description}</h4>
                          <p className="text-sm text-gray-400">{expense.vendor}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(expense.status)}`}>
                              {expense.status}
                            </span>
                            {expense.hasReceipt && (
                              <span className="text-xs text-cyan-400 flex items-center gap-1">
                                <Receipt className="w-3 h-3" />
                                Receipt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <button className="text-sm text-cyan-400 hover:text-cyan-300 mt-2">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <Upload className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="font-medium text-white">Bulk Import</p>
                <p className="text-sm text-gray-400">Upload CSV or connect bank</p>
              </div>
            </button>
            
            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <p className="font-medium text-white">Set Budget</p>
                <p className="text-sm text-gray-400">Track spending limits</p>
              </div>
            </button>

            <button className="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-white">Tax Report</p>
                <p className="text-sm text-gray-400">Generate deduction summary</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}