import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SentimentRequest {
  text: string
  context?: 'claim' | 'review' | 'communication' | 'social'
  user_id?: string
}

interface SentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 to 1
  confidence: number // 0 to 100
  emotions: EmotionScore[]
  keywords: KeywordAnalysis[]
  recommendations: string[]
  risk_indicators: RiskIndicator[]
}

interface EmotionScore {
  emotion: 'anger' | 'frustration' | 'satisfaction' | 'confusion' | 'urgency' | 'distress'
  intensity: number // 0 to 100
}

interface KeywordAnalysis {
  word: string
  sentiment: 'positive' | 'negative' | 'neutral'
  weight: number
  context: string
}

interface RiskIndicator {
  type: 'legal' | 'churn' | 'escalation' | 'fraud'
  probability: number
  trigger_phrases: string[]
  recommended_action: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, context = 'general', user_id } = await req.json() as SentimentRequest

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for sentiment analysis')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Perform sentiment analysis
    const analysis = await analyzeSentiment(text, context)

    // Store analysis results if user_id provided
    if (user_id) {
      const { error: insertError } = await supabaseClient
        .from('sentiment_analyses')
        .insert({
          user_id,
          text: text.substring(0, 500), // Store first 500 chars for privacy
          context,
          sentiment: analysis.sentiment,
          score: analysis.score,
          confidence: analysis.confidence,
          emotions: analysis.emotions,
          risk_indicators: analysis.risk_indicators,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error storing sentiment analysis:', insertError)
      }
    }

    // Check for high-risk indicators and trigger alerts
    const highRiskIndicators = analysis.risk_indicators.filter(r => r.probability > 0.7)
    if (highRiskIndicators.length > 0 && user_id) {
      await triggerRiskAlerts(supabaseClient, user_id, highRiskIndicators, text)
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

async function analyzeSentiment(text: string, context: string): Promise<SentimentResponse> {
  const lowerText = text.toLowerCase()

  // Florida insurance-specific keyword analysis
  const positiveKeywords = [
    { word: 'thank', weight: 0.8 },
    { word: 'appreciate', weight: 0.9 },
    { word: 'helpful', weight: 0.7 },
    { word: 'resolved', weight: 0.9 },
    { word: 'satisfied', weight: 0.8 },
    { word: 'excellent', weight: 1.0 },
    { word: 'quick', weight: 0.6 },
    { word: 'professional', weight: 0.7 },
    { word: 'fair', weight: 0.8 },
    { word: 'approved', weight: 0.9 }
  ]

  const negativeKeywords = [
    { word: 'denied', weight: -0.9 },
    { word: 'delayed', weight: -0.7 },
    { word: 'frustrated', weight: -0.8 },
    { word: 'angry', weight: -0.9 },
    { word: 'unfair', weight: -0.8 },
    { word: 'scam', weight: -1.0 },
    { word: 'fraud', weight: -1.0 },
    { word: 'lawsuit', weight: -0.9 },
    { word: 'terrible', weight: -0.9 },
    { word: 'worst', weight: -1.0 },
    { word: 'hurricane', weight: -0.3 }, // Context dependent
    { word: 'damage', weight: -0.4 },
    { word: 'destroyed', weight: -0.8 },
    { word: 'flooded', weight: -0.7 }
  ]

  // Calculate sentiment score
  let sentimentScore = 0
  let keywordCount = 0
  const detectedKeywords: KeywordAnalysis[] = []

  positiveKeywords.forEach(kw => {
    if (lowerText.includes(kw.word)) {
      sentimentScore += kw.weight
      keywordCount++
      detectedKeywords.push({
        word: kw.word,
        sentiment: 'positive',
        weight: kw.weight,
        context: extractContext(text, kw.word)
      })
    }
  })

  negativeKeywords.forEach(kw => {
    if (lowerText.includes(kw.word)) {
      sentimentScore += kw.weight
      keywordCount++
      detectedKeywords.push({
        word: kw.word,
        sentiment: 'negative',
        weight: kw.weight,
        context: extractContext(text, kw.word)
      })
    }
  })

  // Normalize score
  const normalizedScore = keywordCount > 0 ? sentimentScore / keywordCount : 0

  // Determine overall sentiment
  let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  if (normalizedScore > 0.3) sentiment = 'positive'
  else if (normalizedScore < -0.3) sentiment = 'negative'
  else if (detectedKeywords.filter(k => k.sentiment === 'positive').length > 0 &&
           detectedKeywords.filter(k => k.sentiment === 'negative').length > 0) {
    sentiment = 'mixed'
  } else sentiment = 'neutral'

  // Detect emotions
  const emotions = detectEmotions(text, context)

  // Detect risk indicators
  const riskIndicators = detectRiskIndicators(text, context)

  // Generate recommendations based on sentiment and context
  const recommendations = generateRecommendations(sentiment, emotions, riskIndicators, context)

  // Calculate confidence based on keyword density and context
  const confidence = Math.min(100, Math.abs(normalizedScore) * 100 + (keywordCount * 10))

  return {
    sentiment,
    score: normalizedScore,
    confidence: Math.round(confidence),
    emotions,
    keywords: detectedKeywords,
    recommendations,
    risk_indicators: riskIndicators
  }
}

function detectEmotions(text: string, context: string): EmotionScore[] {
  const emotions: EmotionScore[] = []
  const lowerText = text.toLowerCase()

  // Anger detection
  const angerPhrases = ['unacceptable', 'outrageous', 'furious', 'rage', 'hate', 'disgusted']
  const angerScore = angerPhrases.filter(p => lowerText.includes(p)).length * 30
  if (angerScore > 0) {
    emotions.push({ emotion: 'anger', intensity: Math.min(100, angerScore) })
  }

  // Frustration detection
  const frustrationPhrases = ['frustrated', 'annoyed', 'tired of', 'sick of', 'fed up', 'enough']
  const frustrationScore = frustrationPhrases.filter(p => lowerText.includes(p)).length * 25
  if (frustrationScore > 0) {
    emotions.push({ emotion: 'frustration', intensity: Math.min(100, frustrationScore) })
  }

  // Satisfaction detection
  const satisfactionPhrases = ['happy', 'pleased', 'satisfied', 'grateful', 'wonderful', 'perfect']
  const satisfactionScore = satisfactionPhrases.filter(p => lowerText.includes(p)).length * 30
  if (satisfactionScore > 0) {
    emotions.push({ emotion: 'satisfaction', intensity: Math.min(100, satisfactionScore) })
  }

  // Confusion detection
  const confusionPhrases = ['confused', "don't understand", 'unclear', 'makes no sense', 'lost', 'bewildered']
  const confusionScore = confusionPhrases.filter(p => lowerText.includes(p)).length * 25
  if (confusionScore > 0) {
    emotions.push({ emotion: 'confusion', intensity: Math.min(100, confusionScore) })
  }

  // Urgency detection
  const urgencyPhrases = ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'now', 'today']
  const urgencyScore = urgencyPhrases.filter(p => lowerText.includes(p)).length * 35
  if (urgencyScore > 0) {
    emotions.push({ emotion: 'urgency', intensity: Math.min(100, urgencyScore) })
  }

  // Distress detection (Florida-specific)
  const distressPhrases = ['homeless', 'lost everything', 'desperate', 'help', 'need assistance', 'evacuated']
  const distressScore = distressPhrases.filter(p => lowerText.includes(p)).length * 40
  if (distressScore > 0) {
    emotions.push({ emotion: 'distress', intensity: Math.min(100, distressScore) })
  }

  return emotions
}

function detectRiskIndicators(text: string, context: string): RiskIndicator[] {
  const risks: RiskIndicator[] = []
  const lowerText = text.toLowerCase()

  // Legal risk
  const legalPhrases = ['lawyer', 'attorney', 'sue', 'lawsuit', 'legal action', 'court', 'bad faith']
  const legalMatches = legalPhrases.filter(p => lowerText.includes(p))
  if (legalMatches.length > 0) {
    risks.push({
      type: 'legal',
      probability: Math.min(0.9, legalMatches.length * 0.3),
      trigger_phrases: legalMatches,
      recommended_action: 'Escalate to legal team immediately. Document all communications.'
    })
  }

  // Churn risk
  const churnPhrases = ['cancel', 'switch', 'competitor', 'leave', 'another company', 'done with']
  const churnMatches = churnPhrases.filter(p => lowerText.includes(p))
  if (churnMatches.length > 0) {
    risks.push({
      type: 'churn',
      probability: Math.min(0.8, churnMatches.length * 0.35),
      trigger_phrases: churnMatches,
      recommended_action: 'Transfer to retention specialist. Offer immediate assistance.'
    })
  }

  // Escalation risk
  const escalationPhrases = ['manager', 'supervisor', 'complaint', 'better business', 'media', 'social media', 'news']
  const escalationMatches = escalationPhrases.filter(p => lowerText.includes(p))
  if (escalationMatches.length > 0) {
    risks.push({
      type: 'escalation',
      probability: Math.min(0.7, escalationMatches.length * 0.25),
      trigger_phrases: escalationMatches,
      recommended_action: 'Notify supervisor. Prepare for executive escalation.'
    })
  }

  // Fraud risk
  const fraudPhrases = ['fake', 'staged', 'false claim', 'lying', 'made up', 'suspicious']
  const fraudMatches = fraudPhrases.filter(p => lowerText.includes(p))
  if (fraudMatches.length > 0) {
    risks.push({
      type: 'fraud',
      probability: Math.min(0.6, fraudMatches.length * 0.2),
      trigger_phrases: fraudMatches,
      recommended_action: 'Flag for fraud investigation team. Preserve all evidence.'
    })
  }

  return risks
}

function generateRecommendations(
  sentiment: string,
  emotions: EmotionScore[],
  risks: RiskIndicator[],
  context: string
): string[] {
  const recommendations: string[] = []

  // Sentiment-based recommendations
  if (sentiment === 'negative' || sentiment === 'mixed') {
    recommendations.push('Respond with empathy and acknowledge customer concerns')
    recommendations.push('Offer specific solutions or timeline for resolution')
  }

  // Emotion-based recommendations
  const highAnger = emotions.find(e => e.emotion === 'anger' && e.intensity > 60)
  if (highAnger) {
    recommendations.push('De-escalate with calm, professional tone')
    recommendations.push('Consider offering direct phone contact')
  }

  const highDistress = emotions.find(e => e.emotion === 'distress' && e.intensity > 50)
  if (highDistress) {
    recommendations.push('Prioritize case for expedited processing')
    recommendations.push('Connect with emergency assistance resources')
  }

  const highConfusion = emotions.find(e => e.emotion === 'confusion' && e.intensity > 40)
  if (highConfusion) {
    recommendations.push('Provide clear, step-by-step explanation')
    recommendations.push('Offer visual guides or documentation')
  }

  // Risk-based recommendations
  const highLegalRisk = risks.find(r => r.type === 'legal' && r.probability > 0.6)
  if (highLegalRisk) {
    recommendations.push('URGENT: Escalate to legal team immediately')
    recommendations.push('Document all interactions thoroughly')
  }

  const highChurnRisk = risks.find(r => r.type === 'churn' && r.probability > 0.5)
  if (highChurnRisk) {
    recommendations.push('Transfer to retention specialist')
    recommendations.push('Review account for retention offers')
  }

  // Context-specific recommendations
  if (context === 'claim') {
    recommendations.push('Review claim status and provide update')
    recommendations.push('Ensure all documentation is complete')
  }

  return recommendations
}

function extractContext(text: string, keyword: string): string {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (index === -1) return ''

  const start = Math.max(0, index - 30)
  const end = Math.min(text.length, index + keyword.length + 30)

  return '...' + text.substring(start, end) + '...'
}

async function triggerRiskAlerts(
  supabase: any,
  userId: string,
  risks: RiskIndicator[],
  originalText: string
) {
  for (const risk of risks) {
    await supabase
      .from('risk_alerts')
      .insert({
        user_id: userId,
        risk_type: risk.type,
        probability: risk.probability,
        trigger_phrases: risk.trigger_phrases,
        recommended_action: risk.recommended_action,
        original_text: originalText.substring(0, 500),
        status: 'pending',
        created_at: new Date().toISOString()
      })
  }
}
