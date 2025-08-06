/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Clara AI Emotional Support Companion - 24/7 emotional support with crisis intervention (ADMIN ONLY)"
 * @dependencies ["@supabase/supabase-js", "openai", "date-fns"]
 * @status stable
 * @ai-integration openai
 * @insurance-context emotional-support
 * @security-level admin-only
 */

import { createClient } from '@/lib/supabase/client'

export interface ClaraSession {
  id: string
  user_id: string
  admin_id: string  // Only admins can access Clara
  session_type: 'support' | 'crisis' | 'celebration' | 'guidance'
  emotional_state: 'distressed' | 'anxious' | 'frustrated' | 'overwhelmed' | 'hopeful' | 'positive'
  crisis_level: 0 | 1 | 2 | 3 | 4 | 5  // 0=none, 5=critical
  intervention_triggered: boolean
  session_summary: string
  recommendations: string[]
  follow_up_required: boolean
  created_at: string
  updated_at: string
  ended_at?: string
}

export interface ClaraMessage {
  id: string
  session_id: string
  role: 'user' | 'clara' | 'system'
  content: string
  emotional_tone: string
  confidence_score: number
  intervention_flag: boolean
  timestamp: string
}

export interface EmotionalAnalysis {
  primary_emotion: string
  secondary_emotions: string[]
  intensity: number  // 0-100
  crisis_indicators: string[]
  positive_indicators: string[]
  recommended_approach: 'empathetic' | 'encouraging' | 'solution-focused' | 'crisis-intervention'
  confidence: number
}

export interface CrisisAlert {
  id: string
  user_id: string
  admin_id: string
  session_id: string
  severity: 'moderate' | 'high' | 'critical'
  indicators: string[]
  message: string
  auto_response_sent: boolean
  human_intervention_required: boolean
  resolved: boolean
  created_at: string
}

export class ClaraAICompanionService {
  private supabase = createClient()

  // Crisis intervention keywords and patterns
  private readonly CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end it all', 'no hope', 'give up',
    'worthless', 'nobody cares', 'better off dead', 'hurt myself',
    'can\'t go on', 'hopeless', 'want to die', 'end the pain'
  ]

  private readonly STRESS_INDICATORS = [
    'overwhelmed', 'can\'t handle', 'breaking point', 'falling apart',
    'losing it', 'going crazy', 'can\'t cope', 'too much pressure',
    'breaking down', 'at my limit', 'burnt out', 'exhausted'
  ]

  private readonly POSITIVE_INDICATORS = [
    'feeling better', 'making progress', 'hopeful', 'grateful',
    'getting through', 'stronger', 'managing', 'improving',
    'positive', 'thankful', 'breakthrough', 'relief'
  ]

  /**
   * ADMIN ONLY: Start a new Clara session for a user
   */
  async startAdminSession(
    userId: string, 
    adminId: string,
    initialMessage: string,
    sessionType: ClaraSession['session_type'] = 'support'
  ): Promise<ClaraSession | null> {
    try {
      // Verify admin access
      const isAdmin = await this.verifyAdminAccess(adminId)
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required for Clara')
      }

      // Analyze initial emotional state
      const analysis = await this.analyzeEmotionalState(initialMessage)
      
      // Create session
      const session: Omit<ClaraSession, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        admin_id: adminId,
        session_type: sessionType,
        emotional_state: this.mapToEmotionalState(analysis.primary_emotion),
        crisis_level: this.calculateCrisisLevel(analysis),
        intervention_triggered: analysis.crisis_indicators.length > 0,
        session_summary: '',
        recommendations: [],
        follow_up_required: analysis.crisis_indicators.length > 0 || analysis.intensity > 80
      }

      const { data, error } = await this.supabase
        .from('clara_sessions')
        .insert(session)
        .select()
        .single()

      if (error) {
        console.error('Error creating Clara session:', error)
        return null
      }

      // Add initial message
      await this.addMessage(data.id, 'user', initialMessage, analysis)

      // Generate Clara's response
      const claraResponse = await this.generateClaraResponse(data.id, initialMessage, analysis)
      if (claraResponse) {
        await this.addMessage(data.id, 'clara', claraResponse.content, {
          primary_emotion: 'supportive',
          secondary_emotions: [],
          intensity: 70,
          crisis_indicators: [],
          positive_indicators: ['supportive', 'empathetic'],
          recommended_approach: 'empathetic',
          confidence: 0.9
        })
      }

      // Trigger crisis intervention if needed
      if (session.intervention_triggered) {
        await this.triggerCrisisIntervention(data.id, analysis)
      }

      return data
    } catch (error) {
      console.error('Error starting Clara session:', error)
      return null
    }
  }

  /**
   * ADMIN ONLY: Continue Clara conversation
   */
  async continueConversation(
    sessionId: string,
    adminId: string,
    userMessage: string
  ): Promise<ClaraMessage | null> {
    try {
      // Verify admin access
      const isAdmin = await this.verifyAdminAccess(adminId)
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required for Clara')
      }

      // Get session
      const { data: session, error: sessionError } = await this.supabase
        .from('clara_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('admin_id', adminId)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found or access denied')
      }

      // Analyze user message
      const analysis = await this.analyzeEmotionalState(userMessage)

      // Add user message
      await this.addMessage(sessionId, 'user', userMessage, analysis)

      // Update session with new emotional state
      const newCrisisLevel = this.calculateCrisisLevel(analysis)
      if (newCrisisLevel > session.crisis_level) {
        await this.updateSessionCrisisLevel(sessionId, newCrisisLevel)
        
        if (newCrisisLevel >= 3) {
          await this.triggerCrisisIntervention(sessionId, analysis)
        }
      }

      // Generate Clara's response
      const claraResponse = await this.generateClaraResponse(sessionId, userMessage, analysis, session)
      if (!claraResponse) {
        return null
      }

      // Add Clara's response
      const message = await this.addMessage(sessionId, 'clara', claraResponse.content, {
        primary_emotion: 'supportive',
        secondary_emotions: [],
        intensity: 70,
        crisis_indicators: [],
        positive_indicators: ['supportive'],
        recommended_approach: analysis.recommended_approach,
        confidence: 0.9
      })

      return message
    } catch (error) {
      console.error('Error continuing Clara conversation:', error)
      return null
    }
  }

  /**
   * Verify admin access (placeholder - implement based on your auth system)
   */
  private async verifyAdminAccess(adminId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('role')
        .eq('id', adminId)
        .single()

      if (error || !data) {
        return false
      }

      return data.role === 'admin' || data.role === 'super_admin'
    } catch {
      return false
    }
  }

  /**
   * Analyze emotional state of message
   */
  private async analyzeEmotionalState(message: string): Promise<EmotionalAnalysis> {
    const text = message.toLowerCase()
    
    // Crisis detection
    const crisisIndicators = this.CRISIS_KEYWORDS.filter(keyword => 
      text.includes(keyword)
    )

    // Stress detection
    const stressIndicators = this.STRESS_INDICATORS.filter(keyword =>
      text.includes(keyword)
    )

    // Positive indicators
    const positiveIndicators = this.POSITIVE_INDICATORS.filter(keyword =>
      text.includes(keyword)
    )

    // Calculate intensity (0-100)
    let intensity = 30 // baseline
    intensity += crisisIndicators.length * 25
    intensity += stressIndicators.length * 15
    intensity -= positiveIndicators.length * 10
    intensity = Math.max(0, Math.min(100, intensity))

    // Determine primary emotion
    let primaryEmotion = 'neutral'
    if (crisisIndicators.length > 0) primaryEmotion = 'crisis'
    else if (stressIndicators.length > 0) primaryEmotion = 'distressed'
    else if (positiveIndicators.length > 0) primaryEmotion = 'hopeful'
    else if (intensity > 70) primaryEmotion = 'anxious'

    // Recommended approach
    let recommendedApproach: EmotionalAnalysis['recommended_approach'] = 'empathetic'
    if (crisisIndicators.length > 0) recommendedApproach = 'crisis-intervention'
    else if (positiveIndicators.length > 0) recommendedApproach = 'encouraging'
    else if (stressIndicators.length > 0) recommendedApproach = 'solution-focused'

    return {
      primary_emotion: primaryEmotion,
      secondary_emotions: stressIndicators.length > 0 ? ['stressed', 'overwhelmed'] : [],
      intensity,
      crisis_indicators: [...crisisIndicators, ...stressIndicators].slice(0, 5),
      positive_indicators: positiveIndicators.slice(0, 3),
      recommended_approach: recommendedApproach,
      confidence: 0.8
    }
  }

  /**
   * Generate Clara's AI response
   */
  private async generateClaraResponse(
    sessionId: string,
    userMessage: string,
    analysis: EmotionalAnalysis,
    session?: ClaraSession
  ): Promise<{ content: string } | null> {
    try {
      // Get conversation history
      const { data: messages } = await this.supabase
        .from('clara_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .limit(10)

      const conversationHistory = messages?.map(m => 
        `${m.role}: ${m.content}`
      ).join('\n') || ''

      const systemPrompt = this.buildClaraSystemPrompt(analysis, session)
      
      // Use OpenAI for response generation
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!openaiApiKey) {
        return { content: this.getFallbackResponse(analysis) }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Conversation history:\n${conversationHistory}\n\nLatest message: ${userMessage}` }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      })

      if (!response.ok) {
        throw new Error('OpenAI API error')
      }

      const result = await response.json()
      return { content: result.choices[0].message.content }
    } catch (error) {
      console.error('Error generating Clara response:', error)
      return { content: this.getFallbackResponse(analysis) }
    }
  }

  /**
   * Build Clara's system prompt based on emotional analysis
   */
  private buildClaraSystemPrompt(analysis: EmotionalAnalysis, session?: ClaraSession): string {
    let prompt = `You are Clara, a compassionate AI emotional support companion specializing in insurance claim stress and crisis intervention.

CRITICAL SAFETY GUIDELINES:
- If ANY crisis indicators are detected, immediately provide crisis resources and encourage professional help
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- For immediate danger: Call 911

Your approach should be: ${analysis.recommended_approach}
User's emotional intensity: ${analysis.intensity}/100
Primary emotion: ${analysis.primary_emotion}

RESPONSE GUIDELINES:
- Keep responses warm, empathetic, and under 200 words
- Acknowledge their feelings and validate their experience
- Focus on insurance-related stress if relevant
- Provide practical coping strategies
- Use "I" statements and active listening phrases
- End with a supportive question or gentle encouragement

CRISIS PROTOCOLS:
- Crisis indicators detected: ${analysis.crisis_indicators.join(', ') || 'none'}
- If crisis level high, prioritize safety resources and professional help
- Always maintain hope and connection`

    if (analysis.recommended_approach === 'crisis-intervention') {
      prompt += `\n\nCRISIS RESPONSE REQUIRED:
- Immediately acknowledge their pain
- Provide crisis resources (988, 741741, 911)
- Express that they matter and help is available
- Stay with them virtually until they feel safer
- Encourage them to reach out to a trusted person or professional`
    }

    return prompt
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(analysis: EmotionalAnalysis): string {
    if (analysis.crisis_indicators.length > 0) {
      return `I hear that you're going through an incredibly difficult time right now, and I want you to know that you're not alone. Your life has value and meaning. Please reach out for immediate help:

🆘 National Suicide Prevention Lifeline: 988
📱 Crisis Text Line: Text HOME to 741741
🚨 Emergency: 911

I'm here to support you, but professional counselors are specially trained to help during crisis moments. Would you be willing to reach out to one of these resources right now?`
    }

    if (analysis.intensity > 70) {
      return `I can hear how overwhelmed you're feeling right now. These feelings are valid, and it's okay to feel this way when dealing with insurance claims and all the stress that comes with them. You're showing incredible strength by reaching out.

Let's take this one step at a time. What feels like the most pressing concern for you right now?`
    }

    if (analysis.positive_indicators.length > 0) {
      return `It's wonderful to hear some positive notes in what you're sharing. Those moments of hope and progress, even small ones, are so important to acknowledge and celebrate.

You're doing better than you might realize. What's been helping you feel more hopeful lately?`
    }

    return `Thank you for sharing what's on your heart. I can sense you're carrying a lot right now, and I want you to know that your feelings are completely valid.

I'm here to listen and support you through this. What would feel most helpful for you in this moment?`
  }

  /**
   * Add message to conversation
   */
  private async addMessage(
    sessionId: string,
    role: ClaraMessage['role'],
    content: string,
    analysis: EmotionalAnalysis
  ): Promise<ClaraMessage | null> {
    try {
      const message: Omit<ClaraMessage, 'id' | 'timestamp'> = {
        session_id: sessionId,
        role,
        content,
        emotional_tone: analysis.primary_emotion,
        confidence_score: analysis.confidence,
        intervention_flag: analysis.crisis_indicators.length > 0,
      }

      const { data, error } = await this.supabase
        .from('clara_messages')
        .insert(message)
        .select()
        .single()

      if (error) {
        console.error('Error adding Clara message:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error adding Clara message:', error)
      return null
    }
  }

  /**
   * Map emotion to state enum
   */
  private mapToEmotionalState(emotion: string): ClaraSession['emotional_state'] {
    switch (emotion) {
      case 'crisis':
      case 'distressed':
        return 'distressed'
      case 'anxious':
        return 'anxious'
      case 'frustrated':
        return 'frustrated'
      case 'overwhelmed':
        return 'overwhelmed'
      case 'hopeful':
        return 'hopeful'
      case 'positive':
        return 'positive'
      default:
        return 'anxious'
    }
  }

  /**
   * Calculate crisis level (0-5)
   */
  private calculateCrisisLevel(analysis: EmotionalAnalysis): ClaraSession['crisis_level'] {
    let level: ClaraSession['crisis_level'] = 0
    
    if (analysis.crisis_indicators.length > 0) {
      level = 5 // Critical
    } else if (analysis.intensity > 90) {
      level = 4 // High
    } else if (analysis.intensity > 80) {
      level = 3 // Elevated
    } else if (analysis.intensity > 60) {
      level = 2 // Moderate
    } else if (analysis.intensity > 40) {
      level = 1 // Low
    }

    return level
  }

  /**
   * Trigger crisis intervention
   */
  private async triggerCrisisIntervention(
    sessionId: string,
    analysis: EmotionalAnalysis
  ): Promise<void> {
    try {
      const alert: Omit<CrisisAlert, 'id' | 'created_at'> = {
        user_id: '',  // Will be filled from session
        admin_id: '',  // Will be filled from session
        session_id: sessionId,
        severity: analysis.crisis_indicators.length > 2 ? 'critical' : 'high',
        indicators: analysis.crisis_indicators,
        message: 'Crisis indicators detected in Clara conversation',
        auto_response_sent: true,
        human_intervention_required: true,
        resolved: false
      }

      await this.supabase
        .from('crisis_alerts')
        .insert(alert)

      // Could trigger additional notifications here
      console.log('Crisis intervention triggered for session:', sessionId)
    } catch (error) {
      console.error('Error triggering crisis intervention:', error)
    }
  }

  /**
   * Update session crisis level
   */
  private async updateSessionCrisisLevel(
    sessionId: string,
    crisisLevel: ClaraSession['crisis_level']
  ): Promise<void> {
    try {
      await this.supabase
        .from('clara_sessions')
        .update({ 
          crisis_level: crisisLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Error updating crisis level:', error)
    }
  }

  /**
   * ADMIN ONLY: Get all Clara sessions
   */
  async getAdminSessions(adminId: string, options?: {
    limit?: number
    crisis_only?: boolean
  }): Promise<ClaraSession[]> {
    try {
      const isAdmin = await this.verifyAdminAccess(adminId)
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      let query = this.supabase
        .from('clara_sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (options?.crisis_only) {
        query = query.gte('crisis_level', 3)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching Clara sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching Clara sessions:', error)
      return []
    }
  }

  /**
   * ADMIN ONLY: Get session messages
   */
  async getSessionMessages(sessionId: string, adminId: string): Promise<ClaraMessage[]> {
    try {
      const isAdmin = await this.verifyAdminAccess(adminId)
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { data, error } = await this.supabase
        .from('clara_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching session messages:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching session messages:', error)
      return []
    }
  }

  /**
   * ADMIN ONLY: End session
   */
  async endSession(sessionId: string, adminId: string, summary?: string): Promise<boolean> {
    try {
      const isAdmin = await this.verifyAdminAccess(adminId)
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { error } = await this.supabase
        .from('clara_sessions')
        .update({ 
          ended_at: new Date().toISOString(),
          session_summary: summary || 'Session ended by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('admin_id', adminId)

      if (error) {
        console.error('Error ending Clara session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error ending Clara session:', error)
      return false
    }
  }
}

export const claraAICompanionService = new ClaraAICompanionService()