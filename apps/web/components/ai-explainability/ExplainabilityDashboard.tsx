'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { BarChart, Info, TrendingUp, AlertTriangle, Brain } from 'lucide-react'

interface ExplainabilityProps {
  predictionId: string
  propertyId: string
  modelVersion: string
}

interface FeatureImportance {
  feature: string
  importance: number
  direction: 'positive' | 'negative'
}

interface Explanation {
  featureImportance: FeatureImportance[]
  textExplanation: string
  confidence: number
  decisionPath: Array<{
    step: number
    description: string
    confidence: number
  }>
  counterfactuals: Array<{
    feature: string
    currentValue: any
    suggestedValue: any
    expectedOutcome: string
  }>
}

export function ExplainabilityDashboard({ predictionId, propertyId, modelVersion }: ExplainabilityProps) {
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [explanationMethod, setExplanationMethod] = useState<'shap' | 'lime' | 'attention'>('shap')

  useEffect(() => {
    fetchExplanation()
  }, [predictionId, explanationMethod])

  const fetchExplanation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ml-model-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          data: {
            predictionId,
            propertyId,
            method: explanationMethod
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        // Transform API response to typed format
        const featureImportance: FeatureImportance[] = Object.entries(result.explanation.featureImportance)
          .map(([feature, importance]) => ({
            feature,
            importance: importance as number,
            direction: (importance as number) > 0 ? 'positive' : 'negative'
          }))
          .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))

        setExplanation({
          ...result.explanation,
          featureImportance,
          confidence: result.explanation.confidence || 0.85
        })
      }
    } catch (error) {
      console.error('Failed to fetch explanation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!explanation) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No explanation available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Method Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setExplanationMethod('shap')}
          className={`px-4 py-2 rounded ${
            explanationMethod === 'shap' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          SHAP Analysis
        </button>
        <button
          onClick={() => setExplanationMethod('lime')}
          className={`px-4 py-2 rounded ${
            explanationMethod === 'lime' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          LIME Analysis
        </button>
        <button
          onClick={() => setExplanationMethod('attention')}
          className={`px-4 py-2 rounded ${
            explanationMethod === 'attention' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Attention Maps
        </button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Decision Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{explanation.textExplanation}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Model: {modelVersion}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Confidence: {(explanation.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Feature Importance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {explanation.featureImportance.slice(0, 10).map((feature) => (
              <div
                key={feature.feature}
                className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => setSelectedFeature(feature.feature)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{feature.feature}</span>
                  <span className={`text-sm ${
                    feature.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feature.direction === 'positive' ? '↑' : '↓'} {(Math.abs(feature.importance) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      feature.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.abs(feature.importance) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Path */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {explanation.decisionPath.map((step, index) => (
              <div key={step.step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${step.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {(step.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Counterfactuals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            What-If Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            These changes would likely lead to a different decision:
          </p>
          <div className="space-y-3">
            {explanation.counterfactuals.map((cf, index) => (
              <div key={index} className="bg-yellow-50 p-3 rounded-lg">
                <div className="font-medium text-sm mb-1">{cf.feature}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Current:</span>
                    <span className="ml-2 font-medium">{cf.currentValue}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Change to:</span>
                    <span className="ml-2 font-medium text-yellow-700">{cf.suggestedValue}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Expected outcome: {cf.expectedOutcome}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Feature Details */}
      {selectedFeature && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Details: {selectedFeature}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                This feature contributed {
                  (Math.abs(explanation.featureImportance.find(f => f.feature === selectedFeature)?.importance || 0) * 100).toFixed(1)
                }% to the final decision.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium mb-1">Impact Analysis:</p>
                <p className="text-sm text-gray-600">
                  {explanation.featureImportance.find(f => f.feature === selectedFeature)?.direction === 'positive'
                    ? 'Higher values of this feature increase the likelihood of a positive outcome.'
                    : 'Higher values of this feature decrease the likelihood of a positive outcome.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}