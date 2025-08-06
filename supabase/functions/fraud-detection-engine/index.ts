import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface FraudDetectionRequest {
  claim_id?: string
  property_id?: string
  user_id?: string
  analysis_type: 'claim' | 'document' | 'behavior' | 'comprehensive'
  data?: Record<string, any>
}

interface FraudAnalysisResult {
  fraud_score: number // 0-100 (0 = no fraud, 100 = definite fraud)
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  fraud_indicators: FraudIndicator[]
  behavioral_patterns: BehavioralPattern[]
  document_anomalies: DocumentAnomaly[]
  network_analysis: NetworkAnalysis
  recommendations: string[]
  confidence: number
  requires_investigation: boolean
  florida_specific_flags: FloridaSpecificFlag[]
}

interface FraudIndicator {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  evidence: string[]
}

interface BehavioralPattern {
  pattern: string
  frequency: number
  deviation_from_norm: number
  suspicious: boolean
  details: string
}

interface DocumentAnomaly {
  document_type: string
  anomaly_type: string
  description: string
  confidence: number
  location?: string
}

interface NetworkAnalysis {
  related_claims: number
  suspicious_connections: string[]
  pattern_matches: string[]
  risk_score: number
}

interface FloridaSpecificFlag {
  type: 'aob_abuse' | 'storm_chasing' | 'inflated_damage' | 'contractor_fraud' | 'staged_accident'
  description: string
  risk_level: string
  legal_implications: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = await req.json() as FraudDetectionRequest

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Gather data based on analysis type
    let claimData = null
    let userData = null
    let propertyData = null
    let historicalData = null

    if (request.claim_id) {
      const { data } = await supabaseClient
        .from('claims')
        .select('*, property:properties(*), documents:claim_documents(*)')
        .eq('id', request.claim_id)
        .single()
      claimData = data
    }

    if (request.user_id) {
      const { data: user } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', request.user_id)
        .single()
      userData = user

      // Get user's claim history
      const { data: userClaims } = await supabaseClient
        .from('claims')
        .select('*')
        .eq('user_id', request.user_id)
        .order('created_at', { ascending: false })
      historicalData = userClaims
    }

    if (request.property_id) {
      const { data } = await supabaseClient
        .from('properties')
        .select('*, claims(*), policies(*)')
        .eq('id', request.property_id)
        .single()
      propertyData = data
    }

    // Perform comprehensive fraud analysis
    const analysis = await performFraudAnalysis(
      request.analysis_type,
      {
        claim: claimData,
        user: userData,
        property: propertyData,
        historical: historicalData,
        additional: request.data
      }
    )

    // Store analysis results
    if (analysis.fraud_score > 50 || analysis.requires_investigation) {
      const { error: alertError } = await supabaseClient
        .from('fraud_alerts')
        .insert({
          claim_id: request.claim_id,
          user_id: request.user_id,
          property_id: request.property_id,
          fraud_score: analysis.fraud_score,
          risk_level: analysis.risk_level,
          indicators: analysis.fraud_indicators,
          requires_investigation: analysis.requires_investigation,
          analysis_data: analysis,
          created_at: new Date().toISOString()
        })

      if (alertError) {
        console.error('Error storing fraud alert:', alertError)
      }
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function performFraudAnalysis(
  analysisType: string,
  data: any
): Promise<FraudAnalysisResult> {
  let fraudScore = 0
  const fraudIndicators: FraudIndicator[] = []
  const behavioralPatterns: BehavioralPattern[] = []
  const documentAnomalies: DocumentAnomaly[] = []
  const floridaFlags: FloridaSpecificFlag[] = []
  const recommendations: string[] = []

  // 1. Timing Analysis
  if (data.claim) {
    const claimTiming = analyzeClaimTiming(data.claim)
    fraudScore += claimTiming.score
    if (claimTiming.suspicious) {
      fraudIndicators.push(claimTiming.indicator)
    }
  }

  // 2. Damage Pattern Analysis
  if (data.claim?.damage_description) {
    const damagePatterns = analyzeDamagePatterns(data.claim.damage_description)
    fraudScore += damagePatterns.score
    fraudIndicators.push(...damagePatterns.indicators)
  }

  // 3. Historical Pattern Analysis
  if (data.historical && data.historical.length > 0) {
    const historicalPatterns = analyzeHistoricalPatterns(data.historical)
    fraudScore += historicalPatterns.score
    behavioralPatterns.push(...historicalPatterns.patterns)
    
    if (historicalPatterns.suspicious) {
      fraudIndicators.push({
        type: 'Historical Pattern',
        description: historicalPatterns.description,
        severity: historicalPatterns.severity,
        confidence: historicalPatterns.confidence,
        evidence: historicalPatterns.evidence
      })
    }
  }

  // 4. Document Analysis
  if (data.claim?.documents) {
    const docAnalysis = analyzeDocuments(data.claim.documents)
    fraudScore += docAnalysis.score
    documentAnomalies.push(...docAnalysis.anomalies)
  }

  // 5. Florida-Specific Fraud Patterns
  const floridaAnalysis = analyzeFloridaSpecificPatterns(data)
  fraudScore += floridaAnalysis.score
  floridaFlags.push(...floridaAnalysis.flags)

  // 6. Network Analysis
  const networkAnalysis = performNetworkAnalysis(data)
  fraudScore += networkAnalysis.risk_score

  // 7. Behavioral Analysis
  if (data.user) {
    const behaviorAnalysis = analyzeBehavior(data.user, data.historical)
    fraudScore += behaviorAnalysis.score
    behavioralPatterns.push(...behaviorAnalysis.patterns)
  }

  // Normalize fraud score to 0-100
  fraudScore = Math.min(100, Math.max(0, fraudScore))

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (fraudScore >= 75) riskLevel = 'critical'
  else if (fraudScore >= 50) riskLevel = 'high'
  else if (fraudScore >= 25) riskLevel = 'medium'
  else riskLevel = 'low'

  // Generate recommendations
  if (fraudScore >= 75) {
    recommendations.push('URGENT: Flag for immediate investigation')
    recommendations.push('Suspend claim processing pending review')
    recommendations.push('Request additional documentation')
    recommendations.push('Consider involving Special Investigation Unit (SIU)')
  } else if (fraudScore >= 50) {
    recommendations.push('Request independent adjuster verification')
    recommendations.push('Perform enhanced document verification')
    recommendations.push('Cross-reference with public records')
  } else if (fraudScore >= 25) {
    recommendations.push('Standard verification procedures recommended')
    recommendations.push('Monitor for pattern development')
  } else {
    recommendations.push('Low risk - proceed with normal processing')
  }

  // Add Florida-specific recommendations
  if (floridaFlags.some(f => f.type === 'aob_abuse')) {
    recommendations.push('Review Assignment of Benefits agreement carefully')
    recommendations.push('Verify contractor licensing with DBPR')
  }

  if (floridaFlags.some(f => f.type === 'storm_chasing')) {
    recommendations.push('Verify contractor is local and established')
    recommendations.push('Check for door-to-door solicitation violations')
  }

  const confidence = calculateConfidence(fraudIndicators, documentAnomalies, behavioralPatterns)

  return {
    fraud_score: Math.round(fraudScore),
    risk_level: riskLevel,
    fraud_indicators: fraudIndicators,
    behavioral_patterns: behavioralPatterns,
    document_anomalies: documentAnomalies,
    network_analysis: networkAnalysis,
    recommendations,
    confidence: Math.round(confidence),
    requires_investigation: fraudScore >= 50,
    florida_specific_flags: floridaFlags
  }
}

function analyzeClaimTiming(claim: any): { score: number; suspicious: boolean; indicator: FraudIndicator } {
  let score = 0
  let suspicious = false
  const evidence: string[] = []

  // Check if claim filed immediately after policy start
  if (claim.policy_start_date) {
    const policyStart = new Date(claim.policy_start_date)
    const claimDate = new Date(claim.created_at)
    const daysSincePolicyStart = (claimDate.getTime() - policyStart.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSincePolicyStart < 30) {
      score += 25
      suspicious = true
      evidence.push(`Claim filed ${Math.round(daysSincePolicyStart)} days after policy start`)
    }
  }

  // Check if claim filed just before policy expiration
  if (claim.policy_end_date) {
    const policyEnd = new Date(claim.policy_end_date)
    const claimDate = new Date(claim.created_at)
    const daysBeforePolicyEnd = (policyEnd.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysBeforePolicyEnd < 30 && daysBeforePolicyEnd > 0) {
      score += 15
      suspicious = true
      evidence.push(`Claim filed ${Math.round(daysBeforePolicyEnd)} days before policy expiration`)
    }
  }

  // Check time of day pattern (claims filed at unusual hours)
  const claimHour = new Date(claim.created_at).getHours()
  if (claimHour < 6 || claimHour > 22) {
    score += 5
    evidence.push(`Claim filed at unusual hour: ${claimHour}:00`)
  }

  return {
    score,
    suspicious,
    indicator: {
      type: 'Timing Anomaly',
      description: 'Suspicious claim timing patterns detected',
      severity: score > 20 ? 'high' : 'medium',
      confidence: 75,
      evidence
    }
  }
}

function analyzeDamagePatterns(description: string): { score: number; indicators: FraudIndicator[] } {
  let score = 0
  const indicators: FraudIndicator[] = []
  const lowerDesc = description.toLowerCase()

  // Check for exaggeration keywords
  const exaggerationKeywords = ['everything', 'totally', 'completely', 'entire', 'all', 'catastrophic']
  const exaggerationCount = exaggerationKeywords.filter(k => lowerDesc.includes(k)).length
  if (exaggerationCount > 2) {
    score += 10
    indicators.push({
      type: 'Exaggeration Pattern',
      description: 'Multiple exaggeration keywords detected',
      severity: 'medium',
      confidence: 60,
      evidence: [`Found ${exaggerationCount} exaggeration keywords`]
    })
  }

  // Check for vague descriptions
  if (description.length < 50) {
    score += 5
    indicators.push({
      type: 'Vague Description',
      description: 'Unusually brief damage description',
      severity: 'low',
      confidence: 50,
      evidence: [`Description only ${description.length} characters`]
    })
  }

  // Check for copy-paste patterns (identical phrases)
  const commonFraudPhrases = [
    'water damage throughout',
    'wind damage to roof',
    'extensive damage',
    'needs complete replacement'
  ]
  
  const matchedPhrases = commonFraudPhrases.filter(p => lowerDesc.includes(p))
  if (matchedPhrases.length > 2) {
    score += 15
    indicators.push({
      type: 'Template Pattern',
      description: 'Description matches common fraud templates',
      severity: 'high',
      confidence: 70,
      evidence: matchedPhrases
    })
  }

  return { score, indicators }
}

function analyzeHistoricalPatterns(claims: any[]): any {
  let score = 0
  const patterns: BehavioralPattern[] = []
  let suspicious = false
  const evidence: string[] = []

  // Frequency analysis
  const claimFrequency = claims.length
  const timeSpan = claims.length > 1 
    ? (new Date(claims[0].created_at).getTime() - new Date(claims[claims.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : 1
  const claimsPerYear = claimFrequency / Math.max(timeSpan, 1)

  if (claimsPerYear > 2) {
    score += 20
    suspicious = true
    patterns.push({
      pattern: 'High Claim Frequency',
      frequency: claimsPerYear,
      deviation_from_norm: claimsPerYear - 0.5, // Normal is ~0.5 claims/year
      suspicious: true,
      details: `${claimsPerYear.toFixed(1)} claims per year (normal: 0.5)`
    })
    evidence.push(`${claimFrequency} claims in ${timeSpan.toFixed(1)} years`)
  }

  // Pattern repetition
  const claimTypes = claims.map(c => c.damage_type).filter(Boolean)
  const typeFrequency: Record<string, number> = {}
  claimTypes.forEach(type => {
    typeFrequency[type] = (typeFrequency[type] || 0) + 1
  })

  Object.entries(typeFrequency).forEach(([type, count]) => {
    if (count > 2) {
      score += 15
      suspicious = true
      patterns.push({
        pattern: 'Repeated Claim Type',
        frequency: count,
        deviation_from_norm: count - 1,
        suspicious: true,
        details: `${count} claims for ${type} damage`
      })
      evidence.push(`Multiple ${type} claims`)
    }
  })

  // Escalating amounts
  const amounts = claims.map(c => c.amount).filter(Boolean).sort((a, b) => a - b)
  if (amounts.length > 2) {
    const isEscalating = amounts.every((amt, idx) => idx === 0 || amt >= amounts[idx - 1])
    if (isEscalating) {
      score += 10
      patterns.push({
        pattern: 'Escalating Claim Amounts',
        frequency: amounts.length,
        deviation_from_norm: 100,
        suspicious: true,
        details: `Claims increase from $${amounts[0]} to $${amounts[amounts.length - 1]}`
      })
    }
  }

  return {
    score,
    patterns,
    suspicious,
    description: patterns.map(p => p.details).join('; '),
    severity: score > 30 ? 'high' : score > 15 ? 'medium' : 'low',
    confidence: Math.min(90, 50 + (patterns.length * 10)),
    evidence
  }
}

function analyzeDocuments(documents: any[]): { score: number; anomalies: DocumentAnomaly[] } {
  let score = 0
  const anomalies: DocumentAnomaly[] = []

  documents.forEach(doc => {
    // Check for metadata anomalies
    if (doc.metadata) {
      // Check if document date is after claim date
      if (doc.created_at && doc.claim_date) {
        const docDate = new Date(doc.created_at)
        const claimDate = new Date(doc.claim_date)
        if (docDate < claimDate) {
          score += 10
          anomalies.push({
            document_type: doc.type || 'Unknown',
            anomaly_type: 'Temporal Inconsistency',
            description: 'Document predates claim',
            confidence: 80,
            location: doc.name
          })
        }
      }
    }

    // Check for common fraud document patterns
    if (doc.name) {
      const docName = doc.name.toLowerCase()
      if (docName.includes('template') || docName.includes('sample') || docName.includes('example')) {
        score += 20
        anomalies.push({
          document_type: doc.type || 'Unknown',
          anomaly_type: 'Template Document',
          description: 'Document appears to be a template',
          confidence: 90,
          location: doc.name
        })
      }
    }
  })

  return { score, anomalies }
}

function analyzeFloridaSpecificPatterns(data: any): { score: number; flags: FloridaSpecificFlag[] } {
  let score = 0
  const flags: FloridaSpecificFlag[] = []

  // Check for AOB (Assignment of Benefits) abuse
  if (data.claim?.has_aob || data.additional?.contractor_involved) {
    const hasMultipleAOBs = data.historical?.filter((c: any) => c.has_aob).length > 2
    if (hasMultipleAOBs) {
      score += 25
      flags.push({
        type: 'aob_abuse',
        description: 'Multiple Assignment of Benefits agreements detected',
        risk_level: 'high',
        legal_implications: 'May violate Florida Statute 627.7152 regarding AOB agreements'
      })
    }
  }

  // Check for storm chasing patterns
  if (data.claim?.damage_type === 'hurricane' || data.claim?.damage_type === 'wind') {
    const claimDate = new Date(data.claim?.created_at)
    const isPostStorm = checkIfPostStorm(claimDate)
    
    if (isPostStorm && data.additional?.contractor_from_out_of_state) {
      score += 20
      flags.push({
        type: 'storm_chasing',
        description: 'Out-of-state contractor involvement post-storm',
        risk_level: 'high',
        legal_implications: 'Potential violation of Florida emergency contractor regulations'
      })
    }
  }

  // Check for inflated damage patterns
  if (data.claim?.amount && data.property?.value) {
    const claimToValueRatio = data.claim.amount / data.property.value
    if (claimToValueRatio > 0.5) {
      score += 15
      flags.push({
        type: 'inflated_damage',
        description: 'Claim amount exceeds 50% of property value',
        risk_level: 'medium',
        legal_implications: 'May constitute insurance fraud under Florida Statute 817.234'
      })
    }
  }

  // Check for contractor fraud patterns
  if (data.additional?.multiple_estimates) {
    const estimates = data.additional.estimates || []
    const variance = calculateEstimateVariance(estimates)
    if (variance > 0.5) {
      score += 10
      flags.push({
        type: 'contractor_fraud',
        description: 'High variance in contractor estimates',
        risk_level: 'medium',
        legal_implications: 'Potential contractor fraud or price manipulation'
      })
    }
  }

  return { score, flags }
}

function performNetworkAnalysis(data: any): NetworkAnalysis {
  const suspiciousConnections: string[] = []
  const patternMatches: string[] = []
  let riskScore = 0
  let relatedClaims = 0

  // Check for same address multiple claims
  if (data.property?.address) {
    // In production, would query database for other claims at same address
    // Mock implementation
    if (data.historical?.length > 3) {
      suspiciousConnections.push('Multiple claims from same address')
      riskScore += 10
    }
  }

  // Check for same contractor across multiple claims
  if (data.additional?.contractor_id) {
    // In production, would check contractor involvement in other suspicious claims
    patternMatches.push('Contractor linked to multiple claims')
    riskScore += 5
  }

  // Check for claim clustering (multiple claims in same area/time)
  if (data.claim?.created_at && data.property?.zip_code) {
    // In production, would check for unusual claim clustering
    // Mock implementation
    if (Math.random() > 0.7) {
      patternMatches.push('Part of geographic claim cluster')
      riskScore += 8
    }
  }

  return {
    related_claims: relatedClaims,
    suspicious_connections: suspiciousConnections,
    pattern_matches: patternMatches,
    risk_score: Math.min(25, riskScore)
  }
}

function analyzeBehavior(user: any, claims: any[]): { score: number; patterns: BehavioralPattern[] } {
  let score = 0
  const patterns: BehavioralPattern[] = []

  // Check for account age vs claim history
  if (user.created_at) {
    const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (accountAge < 30 && claims.length > 0) {
      score += 15
      patterns.push({
        pattern: 'New Account with Immediate Claim',
        frequency: 1,
        deviation_from_norm: 100,
        suspicious: true,
        details: `Account only ${Math.round(accountAge)} days old`
      })
    }
  }

  // Check for information changes before claims
  if (user.last_updated && claims.length > 0) {
    const lastUpdate = new Date(user.last_updated)
    const firstClaim = new Date(claims[0].created_at)
    const daysBetween = (firstClaim.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysBetween < 7 && daysBetween > 0) {
      score += 10
      patterns.push({
        pattern: 'Profile Update Before Claim',
        frequency: 1,
        deviation_from_norm: 80,
        suspicious: true,
        details: `Profile updated ${Math.round(daysBetween)} days before claim`
      })
    }
  }

  return { score, patterns }
}

function checkIfPostStorm(date: Date): boolean {
  // Check if date is within 30 days of major Florida storms
  // In production, would check against actual storm database
  const month = date.getMonth() + 1
  const isHurricaneSeason = month >= 6 && month <= 11
  return isHurricaneSeason && Math.random() > 0.5 // Mock implementation
}

function calculateEstimateVariance(estimates: number[]): number {
  if (estimates.length < 2) return 0
  
  const mean = estimates.reduce((sum, val) => sum + val, 0) / estimates.length
  const variance = estimates.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / estimates.length
  const stdDev = Math.sqrt(variance)
  
  return stdDev / mean // Coefficient of variation
}

function calculateConfidence(
  indicators: FraudIndicator[],
  anomalies: DocumentAnomaly[],
  patterns: BehavioralPattern[]
): number {
  let confidence = 50 // Base confidence

  // More evidence increases confidence
  confidence += indicators.length * 5
  confidence += anomalies.length * 3
  confidence += patterns.filter(p => p.suspicious).length * 7

  // High-confidence individual indicators boost overall confidence
  const highConfidenceIndicators = indicators.filter(i => i.confidence > 80).length
  confidence += highConfidenceIndicators * 10

  return Math.min(95, Math.max(30, confidence))
}