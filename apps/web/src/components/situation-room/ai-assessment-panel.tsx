/**
 * @fileMetadata
 * @purpose Provides a UI panel for controlling and viewing AI threat assessments in the Situation Room.
 * @owner frontend-team
 * @status active
 */
/**
 * @fileMetadata
 * @purpose AI Assessment Panel for Situation Room - displays AI threat assessment status and controls
 * @owner frontend-team
 * @dependencies ["react", "zustand", "lucide-react", "@/lib/stores/situation-room-store"]
 * @exports ["AIAssessmentPanel"]
 * @complexity medium
 * @tags ["situation-room", "ai", "threat-assessment", "panel"]
 * @status active
 */

'use client'

import React, { useState } from 'react'
import { Brain, RefreshCw, CheckCircle, AlertTriangle, Clock, Zap, Settings, ChevronDown } from 'lucide-react'
import { useSituationRoom } from '@/lib/stores/situation-room-store'
import { ThreatLevel } from '@/types/situation-room'

interface AIAssessmentPanelProps {
  propertyId: string
  className?: string
}

export function AIAssessmentPanel({ propertyId, className = '' }: AIAssessmentPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'grok' | 'claude' | 'gemini' | 'auto'>('auto')
  const [showSettings, setShowSettings] = useState(false)
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium')
  const [speedPriority, setSpeedPriority] = useState(false)
  
  const {
    aiAssessmentRunning,
    lastAIAssessment,
    threats,
    overallThreatLevel,
    error,
    runAIThreatAssessment,
    getAIAssessmentStatus
  } = useSituationRoom()

  const aiStatus = getAIAssessmentStatus()
  const aiThreats = threats.filter(t => 
    t.sources.some(source => source.name === 'AI Analysis') || 
    t.aiAnalysis?.agentsUsed?.some(agent => agent.includes('threat-analyzer'))
  )

  const handleRunAssessment = async () => {
    try {
      await runAIThreatAssessment(propertyId, {
        focusAreas: ['weather', 'property', 'security'],
        urgencyThreshold: ThreatLevel.MEDIUM,
        preferredProvider: selectedProvider,
        budget,
        speedPriority
      })
    } catch (error) {
      console.error('Failed to run AI assessment:', error)
    }
  }

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.LOW: return 'text-green-400'
      case ThreatLevel.MEDIUM: return 'text-yellow-400'
      case ThreatLevel.HIGH: return 'text-orange-400'
      case ThreatLevel.CRITICAL: return 'text-red-400'
      case ThreatLevel.EMERGENCY: return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  const getLastAssessmentText = () => {
    if (!lastAIAssessment) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastAIAssessment.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return lastAIAssessment.toLocaleDateString()
  }

  return (
    <div className={`liquid-glass-premium bg-gray-900/40 border border-gray-700/50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Threat Assessment</h3>
            <p className="text-sm text-gray-400">
              {aiStatus.totalProviders > 0 
                ? `${aiStatus.totalProviders} Provider${aiStatus.totalProviders > 1 ? 's' : ''} • Primary: ${aiStatus.primaryProvider}`
                : 'No Providers Available'
              }
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700/50 rounded transition-colors"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
          
          {aiStatus.available ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{aiStatus.totalProviders} Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Fallback Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Provider Settings */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
          <h4 className="text-sm font-medium text-gray-300 mb-4">AI Provider Settings</h4>
          
          {/* Provider Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Preferred Provider</label>
            <div className="grid grid-cols-5 gap-1">
              {(['auto', 'openai', 'grok', 'claude', 'gemini'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`px-2 py-2 rounded-lg text-xs transition-colors ${
                    selectedProvider === provider
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {provider === 'auto' ? 'Auto' : 
                   provider === 'openai' ? 'GPT' : 
                   provider === 'grok' ? 'Grok' :
                   provider === 'claude' ? 'Claude' :
                   'Gemini'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Optimization Settings */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Budget Priority</label>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'medium', 'high'] as const).map((budgetLevel) => (
                  <button
                    key={budgetLevel}
                    onClick={() => setBudget(budgetLevel)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      budget === budgetLevel
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {budgetLevel === 'low' ? 'Cost' : budgetLevel === 'medium' ? 'Balanced' : 'Premium'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={speedPriority}
                  onChange={(e) => setSpeedPriority(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Speed Priority Mode
              </label>
            </div>
          </div>

          {/* Provider Status */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">Available Providers</div>
            {aiStatus.providers.map((provider, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-800/60 rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    provider.available ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{provider.name}</span>
                      <span className="text-xs text-gray-400">
                        (P{provider.priority})
                      </span>
                    </div>
                    {provider.available && (
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>${(provider.costPerToken * 1000).toFixed(2)}/1K tokens</span>
                        <span>~{Math.round(provider.avgResponseTime / 1000)}s</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {provider.models.length} models
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Assessment Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{aiThreats.length}</div>
          <div className="text-sm text-gray-400">AI Threats</div>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className={`text-2xl font-bold ${getThreatLevelColor(overallThreatLevel)}`}>
            {overallThreatLevel.toUpperCase()}
          </div>
          <div className="text-sm text-gray-400">Risk Level</div>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {aiStatus.totalProviders >= 4 ? '99%' : 
             aiStatus.totalProviders === 3 ? '98%' : 
             aiStatus.totalProviders === 2 ? '95%' : 
             aiStatus.totalProviders === 1 ? '85%' : '50%'}
          </div>
          <div className="text-sm text-gray-400">Confidence</div>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{getLastAssessmentText()}</div>
          <div className="text-sm text-gray-400">Last Scan</div>
        </div>
      </div>

      {/* Assessment Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Last assessment: {getLastAssessmentText()}</span>
        </div>
        
        <button
          onClick={handleRunAssessment}
          disabled={aiAssessmentRunning}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {aiAssessmentRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Run Assessment</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Recent AI Threats Preview */}
      {aiThreats.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Recent AI Threats</h4>
          <div className="space-y-2">
            {aiThreats.slice(0, 3).map((threat) => (
              <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getThreatLevelColor(threat.severity).replace('text-', 'bg-')}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{threat.title}</div>
                    <div className="text-xs text-gray-400">
                      Confidence: {threat.confidence}% • {threat.timeline}
                    </div>
                  </div>
                </div>
                
                <div className={`text-xs font-medium ${getThreatLevelColor(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          
          {aiThreats.length > 3 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-400">
                +{aiThreats.length - 3} more AI threats detected
              </span>
            </div>
          )}
        </div>
      )}

      {/* Assessment Capabilities */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Optimized Quad-Provider AI System
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Cost Optimization</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Speed Optimization</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Ability-Based Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Intelligent Failover</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Real-time Provider Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Usage Analytics</span>
          </div>
        </div>
        
        {/* Optimization status */}
        {aiStatus.totalProviders > 0 && (
          <div className="mt-3 space-y-1">
            <div className="p-2 bg-gray-800/30 rounded text-xs text-gray-400">
              <span className="font-medium">Current Settings:</span> 
              {budget === 'low' ? 'Cost-optimized' : budget === 'high' ? 'Premium performance' : 'Balanced'} mode
              {speedPriority && ', Speed priority enabled'}
            </div>
            <div className="p-2 bg-gray-800/30 rounded text-xs text-gray-400">
              <span className="font-medium">Active Providers:</span> 
              {aiStatus.providers.filter(p => p.available).map(p => p.name).join(', ')} 
              • Auto-selection • Metrics tracking
            </div>
          </div>
        )}
      </div>
    </div>
  )
}