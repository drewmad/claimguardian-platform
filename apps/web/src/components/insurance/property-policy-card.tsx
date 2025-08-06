/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Property policy card component for insurance dashboard"
 * @dependencies ["react", "next", "lucide-react"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Shield, AlertTriangle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card-variants'
import { PropertyImage } from '@/components/ui/property-image'
import { cn } from '@/lib/utils'

interface Policy {
  id: string
  type: string
  carrier: string
  policyNumber: string
  premium: number
  deductible: number
  coverage: number
  status: 'active' | 'pending' | 'expired'
  expirationDate: string
}

interface Property {
  id: string
  name: string
  address: string
  type: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
  policies: string[]
}

interface PropertyPolicyCardProps {
  property: Property
  policies: Policy[]
  isExpanded: boolean
  onToggle: () => void
}

export function PropertyPolicyCard({ 
  property, 
  policies, 
  isExpanded, 
  onToggle 
}: PropertyPolicyCardProps) {
  const router = useRouter()
  
  const propertyPolicies = policies.filter(p => property.policies.includes(p.id))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card variant="property" className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-700/20 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
              <PropertyImage
                propertyId={property.id}
                propertyType={property.type}
                propertyName={property.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{property.name}</h3>
              <p className="text-sm text-gray-400">{propertyPolicies.length} Policies</p>
            </div>
          </div>
          <ChevronRight className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-90'
          )} />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6 space-y-4 border-t border-gray-700/50">
          {propertyPolicies.map((policy) => (
            <PolicyListItem 
              key={policy.id} 
              policy={policy}
              onClick={() => router.push(`/dashboard/insurance/policy/${policy.id}`)}
            />
          ))}
          
          {propertyPolicies.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No policies for this property</p>
              <button className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
                Add Policy →
              </button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function PolicyListItem({ policy, onClick }: { policy: Policy; onClick: () => void }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isWindstorm = policy.type.toLowerCase() === 'windstorm'
  const windDeductible = isWindstorm ? `2% ($${(policy.coverage * 0.02 / 1000).toFixed(0)},000)` : null

  return (
    <div 
      className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{policy.carrier}</h4>
          <p className="text-sm text-gray-400">#{policy.policyNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{formatCurrency(policy.coverage)}</p>
          <p className="text-sm text-gray-400">Dwelling Coverage</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Deductible</p>
          <p className="text-white font-medium">{formatCurrency(policy.deductible)}</p>
        </div>
        {windDeductible ? (
          <div>
            <p className="text-gray-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              Wind Deductible
            </p>
            <p className="text-yellow-400 font-medium">{windDeductible}</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 mb-1">Wind Deductible</p>
            <p className="text-gray-500 font-medium">N/A</p>
          </div>
        )}
        <div>
          <p className="text-gray-400 mb-1">Premium</p>
          <p className="text-white font-medium">${policy.premium}/yr</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Expires</p>
          <p className="text-white font-medium">
            {new Date(policy.expirationDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  )
}