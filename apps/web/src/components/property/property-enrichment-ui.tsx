/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Interactive UI component for comprehensive property enrichment with AI analysis"
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @florida-specific true
 */
'use client'

import { useState } from 'react'
import { TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, BarChart3, PieChart, Target, Lightbulb } from 'lucide-react'
import { Button } from '@claimguardian/ui'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { enrichProperty, EnrichedProperty } from '@/actions/comprehensive-property-enrichment'

// Type definitions for property enrichment
interface RiskFactor {
  score: number
  level: 'low' | 'medium' | 'high'
  description: string
}

interface ComparableSale {
  address: string
  salePrice: number
  pricePerSqft: number
  sqft: number
  distance: number
}

// Remove duplicate interface - using the one from comprehensive-property-enrichment

interface PropertyEnrichmentUIProps {
  parcelId: string
  onEnrichmentComplete?: (result: EnrichedProperty) => void
}

export function PropertyEnrichmentUI({ parcelId, onEnrichmentComplete }: PropertyEnrichmentUIProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedProperty | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')

  const handleEnrichment = async () => {
    setLoading(true)
    setError(null)
    setCurrentStep('Analyzing property data...')
    
    try {
      // Simulate progressive steps
      const steps = [
        'Analyzing property data...',
        'Gathering market comparables...',
        'Assessing risk factors...',
        'Calculating investment metrics...',
        'Generating AI insights...',
        'Compiling final report...'
      ]
      
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        await new Promise(resolve => setTimeout(resolve, 800))
      }
      
      const result = await enrichProperty(parcelId)
      
      if (result.error) {
        setError(result.error.message)
        return
      }
      
      if (result.data) {
        setEnrichedData(result.data)
        onEnrichmentComplete?.(result.data)
      }
      
    } catch (err) {
      setError('Enrichment failed. Please try again.')
    } finally {
      setLoading(false)
      setCurrentStep('')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'text-red-400'
    if (risk > 0.5) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getRiskBgColor = (risk: number) => {
    if (risk > 0.7) return 'bg-red-500'
    if (risk > 0.5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (!enrichedData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Property Enrichment Analysis
            <Badge variant="secondary">AI-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-gray-300">
              Generate comprehensive property analysis using AI and 9.6M Florida parcel dataset
            </div>
            
            {loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <span className="text-blue-400">{currentStep}</span>
                </div>
                <Progress value={loading ? 75 : 0} className="w-full" />
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            <Button
              onClick={handleEnrichment}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {loading ? 'Analyzing Property...' : 'Start AI Analysis'}
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-700">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-medium">Market Analysis</h4>
              <p className="text-gray-400 text-sm">Comparable sales & trends</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h4 className="text-white font-medium">Risk Assessment</h4>
              <p className="text-gray-400 text-sm">Insurance & hazard analysis</p>
            </div>
            <div className="text-center">
              <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="text-white font-medium">AI Insights</h4>
              <p className="text-gray-400 text-sm">Investment recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-green-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Property Analysis Complete
              </h2>
              <p className="text-gray-300">
                {enrichedData.parcelData.address}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary">
                  Data Quality: {enrichedData.dataQualityScore}%
                </Badge>
                <Badge variant="secondary">
                  {enrichedData.aiInsights.investmentRecommendation.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  Confidence: {(enrichedData.aiInsights.confidenceScore * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(enrichedData.parcelData.totalValue)}
              </div>
              <div className="text-gray-400">Property Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white mb-2">
              {(enrichedData.riskProfile.overallRiskScore * 100).toFixed(0)}%
            </div>
            <div className="text-gray-400">Overall Risk Score</div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(enrichedData.riskProfile).filter(([key]) => key !== 'overallRiskScore').map(([key, riskFactor]) => {
              const factor = riskFactor as RiskFactor
              return (
                <div key={key} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace('Risk', '')}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={`${getRiskColor(factor.score)} border-current`}
                    >
                      {factor.level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${getRiskBgColor(factor.score)}`}
                      style={{ width: `${factor.score * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{factor.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(enrichedData.marketAnalysis.medianPrice)}
              </div>
              <div className="text-gray-400 text-sm">Median Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ${enrichedData.marketAnalysis.pricePerSqft.toFixed(0)}
              </div>
              <div className="text-gray-400 text-sm">Price/SqFt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {enrichedData.marketAnalysis.appreciationRate.toFixed(1)}%
              </div>
              <div className="text-gray-400 text-sm">Appreciation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {enrichedData.marketAnalysis.daysOnMarket}
              </div>
              <div className="text-gray-400 text-sm">Days on Market</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Recent Comparable Sales</h4>
            <div className="space-y-2">
              {enrichedData.marketAnalysis.comparableSales.slice(0, 5).map((sale, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
                  <div>
                    <div className="text-white">{sale.address}</div>
                    <div className="text-gray-400 text-sm">{sale.sqft.toLocaleString()} sqft • {sale.distance.toFixed(1)} miles</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatCurrency(sale.salePrice)}</div>
                    <div className="text-gray-400 text-sm">${sale.pricePerSqft.toFixed(0)}/sqft</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Metrics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5" />
            Investment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {enrichedData.investmentMetrics.estimatedRentalYield.toFixed(1)}%
              </div>
              <div className="text-gray-400">Rental Yield</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {enrichedData.investmentMetrics.capitalizationRate.toFixed(1)}%
              </div>
              <div className="text-gray-400">Cap Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {enrichedData.investmentMetrics.renovationROI}%
              </div>
              <div className="text-gray-400">Renovation ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Recommendations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            Insurance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Estimated Annual Premiums</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Homeowners:</span>
                  <span className="text-white">{formatCurrency(enrichedData.insuranceRecommendations.estimatedPremium.homeowners)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Flood:</span>
                  <span className="text-white">{formatCurrency(enrichedData.insuranceRecommendations.estimatedPremium.flood)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Windstorm:</span>
                  <span className="text-white">{formatCurrency(enrichedData.insuranceRecommendations.estimatedPremium.windstorm)}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-gray-600 pt-2">
                  <span className="text-white">Total:</span>
                  <span className="text-white">
                    {formatCurrency(
                      enrichedData.insuranceRecommendations.estimatedPremium.homeowners +
                      enrichedData.insuranceRecommendations.estimatedPremium.flood +
                      enrichedData.insuranceRecommendations.estimatedPremium.windstorm
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">Discount Opportunities</h4>
              <div className="space-y-1">
                {enrichedData.insuranceRecommendations.discountOpportunities.map((discount, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{discount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights - SWOT Analysis */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5" />
            AI Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {enrichedData.aiInsights.strengthsWeaknessesOpportunitiesThreats.strengths.map((item, index) => (
                    <li key={index} className="text-gray-400 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Opportunities
                </h4>
                <ul className="space-y-1">
                  {enrichedData.aiInsights.strengthsWeaknessesOpportunitiesThreats.opportunities.map((item, index) => (
                    <li key={index} className="text-gray-400 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Weaknesses
                </h4>
                <ul className="space-y-1">
                  {enrichedData.aiInsights.strengthsWeaknessesOpportunitiesThreats.weaknesses.map((item, index) => (
                    <li key={index} className="text-gray-400 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Threats
                </h4>
                <ul className="space-y-1">
                  {enrichedData.aiInsights.strengthsWeaknessesOpportunitiesThreats.threats.map((item, index) => (
                    <li key={index} className="text-gray-400 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3">Key Action Items</h4>
            <div className="space-y-2">
              {enrichedData.aiInsights.actionItems.map((action, index) => (
                <div key={index} className="flex items-start gap-3 bg-gray-700 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}