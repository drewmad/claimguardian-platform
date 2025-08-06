/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Proactive Deadline Guardian - automated deadline detection and management"
 * @dependencies ["@supabase/supabase-js", "date-fns", "openai"]
 * @status stable
 * @ai-integration openai
 * @insurance-context deadline-management
 */

import { createClient } from '@/lib/supabase/client'
import { addDays, differenceInDays, format, parseISO, isAfter, isBefore } from 'date-fns'

export interface Deadline {
  id: string
  type: 'claim_filing' | 'document_submission' | 'response_required' | 'inspection' | 'appeal' | 'policy_renewal' | 'premium_payment' | 'legal_filing'
  title: string
  description: string
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'dismissed'
  property_id?: string
  claim_id?: string
  policy_id?: string
  user_id: string
  source: 'auto_detected' | 'user_created' | 'document_extracted' | 'policy_derived'
  reminder_sent: boolean
  escalation_level: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DeadlineAlert {
  id: string
  deadline_id: string
  alert_type: 'reminder' | 'warning' | 'critical' | 'escalation'
  message: string
  scheduled_for: string
  sent: boolean
  channel: 'email' | 'sms' | 'push' | 'dashboard'
}

export interface DeadlinePattern {
  document_type: string
  keywords: string[]
  deadline_type: string
  days_from_document: number
  priority: Deadline['priority']
}

export class DeadlineGuardianService {
  private supabase = createClient()

  // Common deadline patterns for insurance claims
  private readonly DEADLINE_PATTERNS: DeadlinePattern[] = [
    {
      document_type: 'policy',
      keywords: ['renewal', 'expiration', 'expires'],
      deadline_type: 'policy_renewal',
      days_from_document: 30,
      priority: 'high'
    },
    {
      document_type: 'claim',
      keywords: ['file', 'submit', 'deadline'],
      deadline_type: 'claim_filing',
      days_from_document: 0,
      priority: 'critical'
    },
    {
      document_type: 'inspection',
      keywords: ['inspect', 'assessment', 'appointment'],
      deadline_type: 'inspection',
      days_from_document: 0,
      priority: 'high'
    },
    {
      document_type: 'response',
      keywords: ['respond', 'reply', 'answer required'],
      deadline_type: 'response_required',
      days_from_document: 0,
      priority: 'high'
    },
    {
      document_type: 'appeal',
      keywords: ['appeal', 'dispute', 'contest'],
      deadline_type: 'appeal',
      days_from_document: 0,
      priority: 'critical'
    }
  ]

  /**
   * Analyze document for deadline information using AI
   */
  async analyzeDocumentForDeadlines(documentText: string, documentId: string, userId: string): Promise<Deadline[]> {
    try {
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!openaiApiKey) {
        console.warn('OpenAI API key not configured for deadline analysis')
        return this.fallbackDeadlineDetection(documentText, documentId, userId)
      }

      const response = await fetch('/api/ai/analyze-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          documentId,
          userId
        })
      })

      if (!response.ok) {
        throw new Error('AI deadline analysis failed')
      }

      const analysis = await response.json()
      return this.processDeadlineAnalysis(analysis, documentId, userId)
    } catch (error) {
      console.error('Error analyzing document for deadlines:', error)
      return this.fallbackDeadlineDetection(documentText, documentId, userId)
    }
  }

  /**
   * Fallback deadline detection using pattern matching
   */
  private fallbackDeadlineDetection(documentText: string, documentId: string, userId: string): Deadline[] {
    const deadlines: Deadline[] = []
    const text = documentText.toLowerCase()

    // Look for date patterns and deadline keywords
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})/g
    const dates = text.match(dateRegex) || []

    for (const pattern of this.DEADLINE_PATTERNS) {
      const hasKeywords = pattern.keywords.some(keyword => text.includes(keyword))
      if (hasKeywords && dates.length > 0) {
        // Use the first found date as potential deadline
        const potentialDate = this.parseDate(dates[0])
        if (potentialDate && isAfter(potentialDate, new Date())) {
          deadlines.push({
            id: `deadline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: pattern.deadline_type as Deadline['type'],
            title: `${pattern.document_type.charAt(0).toUpperCase() + pattern.document_type.slice(1)} Deadline`,
            description: `Deadline detected from document analysis`,
            due_date: potentialDate.toISOString(),
            priority: pattern.priority,
            status: 'upcoming',
            user_id: userId,
            source: 'auto_detected',
            reminder_sent: false,
            escalation_level: 0,
            metadata: {
              document_id: documentId,
              detection_method: 'pattern_matching',
              keywords_found: pattern.keywords.filter(keyword => text.includes(keyword))
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    }

    return deadlines
  }

  /**
   * Process AI analysis results into deadline objects
   */
  private processDeadlineAnalysis(analysis: any, documentId: string, userId: string): Deadline[] {
    if (!analysis.deadlines || !Array.isArray(analysis.deadlines)) {
      return []
    }

    return analysis.deadlines.map((deadline: any) => ({
      id: `deadline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: deadline.type || 'document_submission',
      title: deadline.title || 'Important Deadline',
      description: deadline.description || 'Deadline detected from document',
      due_date: deadline.due_date,
      priority: deadline.priority || 'medium',
      status: 'upcoming',
      user_id: userId,
      source: 'document_extracted',
      reminder_sent: false,
      escalation_level: 0,
      metadata: {
        document_id: documentId,
        detection_method: 'ai_analysis',
        confidence: deadline.confidence || 0.5
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })).filter((deadline: Deadline) => {
      const dueDate = parseISO(deadline.due_date)
      return isAfter(dueDate, new Date()) // Only future deadlines
    })
  }

  /**
   * Create or update deadline in database
   */
  async saveDeadline(deadline: Omit<Deadline, 'id' | 'created_at' | 'updated_at'>): Promise<Deadline | null> {
    try {
      const { data, error } = await this.supabase
        .from('deadlines')
        .insert({
          ...deadline,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving deadline:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error saving deadline:', error)
      return null
    }
  }

  /**
   * Get all deadlines for a user
   */
  async getUserDeadlines(userId: string, options?: {
    status?: Deadline['status'][]
    priority?: Deadline['priority'][]
    limit?: number
  }): Promise<Deadline[]> {
    try {
      let query = this.supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })

      if (options?.status) {
        query = query.in('status', options.status)
      }

      if (options?.priority) {
        query = query.in('priority', options.priority)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching deadlines:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching deadlines:', error)
      return []
    }
  }

  /**
   * Check for upcoming deadlines and create alerts
   */
  async checkUpcomingDeadlines(userId?: string): Promise<DeadlineAlert[]> {
    try {
      let query = this.supabase
        .from('deadlines')
        .select('*')
        .in('status', ['upcoming', 'due_soon'])

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: deadlines, error } = await query

      if (error || !deadlines) {
        console.error('Error fetching deadlines for check:', error)
        return []
      }

      const alerts: DeadlineAlert[] = []
      const now = new Date()

      for (const deadline of deadlines) {
        const dueDate = parseISO(deadline.due_date)
        const daysUntilDue = differenceInDays(dueDate, now)

        let alertType: DeadlineAlert['alert_type'] = 'reminder'
        let shouldAlert = false

        if (daysUntilDue < 0) {
          // Overdue
          alertType = 'critical'
          shouldAlert = true
          await this.updateDeadlineStatus(deadline.id, 'overdue')
        } else if (daysUntilDue === 0) {
          // Due today
          alertType = 'critical'
          shouldAlert = true
          await this.updateDeadlineStatus(deadline.id, 'due_soon')
        } else if (daysUntilDue <= 1 && deadline.priority === 'critical') {
          // Critical deadlines - 1 day warning
          alertType = 'warning'
          shouldAlert = true
        } else if (daysUntilDue <= 3 && deadline.priority === 'high') {
          // High priority - 3 day warning
          alertType = 'warning'
          shouldAlert = true
        } else if (daysUntilDue <= 7 && deadline.priority === 'medium') {
          // Medium priority - 7 day warning
          alertType = 'reminder'
          shouldAlert = true
        }

        if (shouldAlert && !deadline.reminder_sent) {
          const alert: DeadlineAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            deadline_id: deadline.id,
            alert_type: alertType,
            message: this.generateAlertMessage(deadline, daysUntilDue),
            scheduled_for: new Date().toISOString(),
            sent: false,
            channel: this.selectAlertChannel(alertType, deadline.priority)
          }

          alerts.push(alert)
        }
      }

      return alerts
    } catch (error) {
      console.error('Error checking upcoming deadlines:', error)
      return []
    }
  }

  /**
   * Update deadline status
   */
  async updateDeadlineStatus(deadlineId: string, status: Deadline['status']): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('deadlines')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', deadlineId)

      if (error) {
        console.error('Error updating deadline status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating deadline status:', error)
      return false
    }
  }

  /**
   * Mark deadline as completed
   */
  async completeDeadline(deadlineId: string): Promise<boolean> {
    return this.updateDeadlineStatus(deadlineId, 'completed')
  }

  /**
   * Dismiss deadline
   */
  async dismissDeadline(deadlineId: string): Promise<boolean> {
    return this.updateDeadlineStatus(deadlineId, 'dismissed')
  }

  /**
   * Generate appropriate alert message
   */
  private generateAlertMessage(deadline: Deadline, daysUntilDue: number): string {
    const dueText = daysUntilDue < 0 
      ? `${Math.abs(daysUntilDue)} days overdue`
      : daysUntilDue === 0 
        ? 'due today'
        : `due in ${daysUntilDue} days`

    return `📅 ${deadline.title} is ${dueText}. ${deadline.description}`
  }

  /**
   * Select appropriate alert channel based on urgency
   */
  private selectAlertChannel(alertType: DeadlineAlert['alert_type'], priority: Deadline['priority']): DeadlineAlert['channel'] {
    if (alertType === 'critical' || priority === 'critical') {
      return 'push'
    } else if (alertType === 'warning' || priority === 'high') {
      return 'email'
    } else {
      return 'dashboard'
    }
  }

  /**
   * Parse date string into Date object
   */
  private parseDate(dateString: string): Date | null {
    try {
      // Handle various date formats
      const cleaned = dateString.replace(/[^\d\/\-\w\s,]/g, '')
      const parsed = new Date(cleaned)
      
      if (isNaN(parsed.getTime())) {
        return null
      }
      
      return parsed
    } catch {
      return null
    }
  }

  /**
   * Get deadline statistics for dashboard
   */
  async getDeadlineStats(userId: string): Promise<{
    total: number
    upcoming: number
    due_soon: number
    overdue: number
    completed: number
    by_priority: Record<Deadline['priority'], number>
  }> {
    try {
      const deadlines = await this.getUserDeadlines(userId)
      
      const stats = {
        total: deadlines.length,
        upcoming: 0,
        due_soon: 0,
        overdue: 0,
        completed: 0,
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      }

      deadlines.forEach(deadline => {
        stats[deadline.status as keyof typeof stats] = (stats[deadline.status as keyof typeof stats] || 0) + 1
        stats.by_priority[deadline.priority]++
      })

      return stats
    } catch (error) {
      console.error('Error getting deadline stats:', error)
      return {
        total: 0,
        upcoming: 0,
        due_soon: 0,
        overdue: 0,
        completed: 0,
        by_priority: { low: 0, medium: 0, high: 0, critical: 0 }
      }
    }
  }
}

export const deadlineGuardianService = new DeadlineGuardianService()