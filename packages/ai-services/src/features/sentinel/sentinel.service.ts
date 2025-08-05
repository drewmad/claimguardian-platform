/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { AIOrchestrator } from '../../orchestrator/orchestrator';
import { AIRequest } from '../../types/index';

interface ClaimDeadline {
  id: string;
  claimId: string;
  userId: string;
  type: 'filing' | 'documentation' | 'response' | 'appeal' | 'statute' | 'custom';
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  remindersSent: number;
  lastReminderAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface ReminderConfig {
  intervals: number[]; // Days before deadline: [30, 14, 7, 3, 1]
  channels: ('email' | 'sms' | 'push' | 'in-app')[];
  tone: 'friendly' | 'urgent' | 'professional';
}

interface DeadlineAnalysis {
  deadlines: ClaimDeadline[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  summary: string;
}

interface SentinelClaimData {
  claimId: string;
  damageDate: string;  
  currentStatus: string;
  claimType: string;
  propertyLocation: string;
}

interface DeadlineResponse {
  description: string;
  daysFromNow: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ReminderMessage {
  subject: string;
  message: string;
  tone: string;
}

export class SentinelService {
  private orchestrator: AIOrchestrator;
  private supabase: SupabaseClient;
  
  // Florida-specific deadline rules
  private readonly FLORIDA_DEADLINES = {
    hurricane_notice: 3, // 3 days to report hurricane damage
    initial_claim: 365, // 1 year to file claim
    supplemental_claim: 1095, // 3 years for supplemental claims
    lawsuit: 1825, // 5 years to file lawsuit
    proof_of_loss: 60, // 60 days to submit proof of loss
    appraisal_demand: 60, // 60 days to demand appraisal
    response_to_rfe: 30, // 30 days to respond to request for evidence
  };
  
  constructor(orchestrator: AIOrchestrator, supabaseUrl?: string, supabaseKey?: string) {
    this.orchestrator = orchestrator;
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  async analyzeClaimDeadlines(
    claimId: string,
    claimData: {
      damageDate: Date;
      claimType: string;
      currentStatus: string;
      propertyLocation: string;
    },
    userId: string
  ): Promise<DeadlineAnalysis> {
    // 1. Generate applicable deadlines based on claim type
    const fullClaimData: SentinelClaimData = {
      claimId,
      damageDate: claimData.damageDate.toISOString(),
      claimType: claimData.claimType,
      currentStatus: claimData.currentStatus,
      propertyLocation: claimData.propertyLocation
    }
    const deadlines = await this.generateDeadlines(claimId, fullClaimData, userId);
    
    // 2. Save deadlines to database
    await this.saveDeadlines(deadlines);
    
    // 3. Analyze risk level
    const riskLevel = this.assessRiskLevel(deadlines);
    
    // 4. Generate AI recommendations
    const recommendations = await this.generateRecommendations(
      deadlines,
      fullClaimData,
      userId
    );
    
    // 5. Create summary
    const summary = await this.generateSummary(deadlines, riskLevel, userId);
    
    return {
      deadlines,
      riskLevel,
      recommendations,
      summary
    };
  }
  
  async checkUpcomingDeadlines(userId: string, daysAhead: number = 30): Promise<ClaimDeadline[]> {
    const { data, error } = await this.supabase
      .from('claim_deadlines')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('due_date', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching deadlines:', error);
      return [];
    }
    
    return data || [];
  }
  
  async generateReminder(
    deadline: ClaimDeadline,
    config: ReminderConfig
  ): Promise<{
    subject: string;
    message: string;
    tone: string;
  }> {
    const daysUntilDue = Math.ceil(
      (deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    const urgency = daysUntilDue <= 3 ? 'urgent' : 
                   daysUntilDue <= 7 ? 'important' : 'friendly';
    
    const request: AIRequest = {
      prompt: `Generate a ${urgency} reminder for this insurance claim deadline:
        
        Deadline: ${deadline.description}
        Due: ${deadline.dueDate.toLocaleDateString()} (${daysUntilDue} days)
        Priority: ${deadline.priority}
        Type: ${deadline.type}
        
        Create a ${config.tone} reminder that:
        1. Clearly states what's due and when
        2. Explains why this deadline is important
        3. Provides specific action steps
        4. ${urgency === 'urgent' ? 'Emphasizes consequences of missing deadline' : 'Encourages timely action'}
        
        Format as JSON with 'subject' and 'message' fields.`,
      systemPrompt: `You are Sentinel, the deadline guardian AI. 
        Your job is to help homeowners never miss important insurance deadlines.
        Be clear, helpful, and appropriately urgent based on timing.`,
      userId: deadline.userId,
      feature: 'sentinel',
      temperature: 0.5,
      responseFormat: 'json'
    };
    
    const response = await this.orchestrator.process(request);
    const reminder = JSON.parse(response.text);
    
    // Track reminder sent
    await this.updateReminderTracking(deadline.id);
    
    return {
      ...reminder,
      tone: urgency
    };
  }
  
  async processDeadlineBatch(): Promise<{
    processed: number;
    sent: number;
    errors: number;
  }> {
    // This would be called by a cron job
    const upcomingDeadlines = await this.getAllUpcomingDeadlines();
    
    let processed = 0;
    let sent = 0;
    let errors = 0;
    
    for (const deadline of upcomingDeadlines) {
      processed++;
      
      try {
        const shouldSend = await this.shouldSendReminder(deadline);
        if (shouldSend) {
          const config = this.getReminderConfig(deadline);
          const reminder = await this.generateReminder(deadline, config);
          
          // Send via configured channels
          await this.sendReminder(deadline, reminder, config);
          sent++;
        }
      } catch (error) {
        console.error(`Error processing deadline ${deadline.id}:`, error);
        errors++;
      }
    }
    
    return { processed, sent, errors };
  }
  
  private async generateDeadlines(
    claimId: string,
    claimData: SentinelClaimData,
    userId: string
  ): Promise<ClaimDeadline[]> {
    const deadlines: ClaimDeadline[] = [];
    const damageDate = new Date(claimData.damageDate);
    
    // Initial claim filing deadline
    if (claimData.currentStatus === 'not_filed') {
      deadlines.push({
        id: crypto.randomUUID(),
        claimId,
        userId,
        type: 'filing',
        description: 'File initial insurance claim',
        dueDate: new Date(damageDate.getTime() + this.FLORIDA_DEADLINES.initial_claim * 24 * 60 * 60 * 1000),
        status: 'pending',
        priority: 'critical',
        remindersSent: 0
      });
    }
    
    // Hurricane-specific deadlines
    if (claimData.claimType === 'hurricane') {
      deadlines.push({
        id: crypto.randomUUID(),
        claimId,
        userId,
        type: 'documentation',
        description: 'Report hurricane damage to insurer',
        dueDate: new Date(damageDate.getTime() + this.FLORIDA_DEADLINES.hurricane_notice * 24 * 60 * 60 * 1000),
        status: 'pending',
        priority: 'critical',
        remindersSent: 0
      });
    }
    
    // Proof of loss deadline
    if (claimData.currentStatus === 'filed' || claimData.currentStatus === 'under_review') {
      const filingDate = new Date(); // Would get from claim data
      deadlines.push({
        id: crypto.randomUUID(),
        claimId,
        userId,
        type: 'documentation',
        description: 'Submit sworn proof of loss',
        dueDate: new Date(filingDate.getTime() + this.FLORIDA_DEADLINES.proof_of_loss * 24 * 60 * 60 * 1000),
        status: 'pending',
        priority: 'high',
        remindersSent: 0
      });
    }
    
    // Add unknown custom deadlines from AI analysis
    const aiDeadlines = await this.analyzeForAdditionalDeadlines(claimData, userId);
    deadlines.push(...aiDeadlines);
    
    return deadlines;
  }
  
  private async analyzeForAdditionalDeadlines(
    claimData: SentinelClaimData,
    userId: string
  ): Promise<ClaimDeadline[]> {
    const request: AIRequest = {
      prompt: `Analyze this insurance claim and identify unknown additional deadlines:
        
        Claim Type: ${claimData.claimType}
        Damage Date: ${claimData.damageDate}
        Current Status: ${claimData.currentStatus}
        Location: ${claimData.propertyLocation}
        
        Based on Florida insurance law and common claim requirements, what other deadlines should the homeowner track?
        
        Return as JSON array with: type, description, daysFromNow, priority`,
      systemPrompt: `You are an expert in Florida insurance claim deadlines.
        Consider statutory requirements, common insurer demands, and best practices.
        Be thorough but only include genuinely important deadlines.`,
      userId,
      feature: 'sentinel',
      temperature: 0.3,
      responseFormat: 'json'
    };
    
    const response = await this.orchestrator.process(request);
    const additionalDeadlines = JSON.parse(response.text);
    
    return additionalDeadlines.map((dl: DeadlineResponse) => ({
      id: crypto.randomUUID(),
      claimId: claimData.claimId,
      userId,
      type: 'custom' as const,
      description: dl.description,
      dueDate: new Date(Date.now() + dl.daysFromNow * 24 * 60 * 60 * 1000),
      status: 'pending' as const,
      priority: dl.priority,
      remindersSent: 0
    }));
  }
  
  private assessRiskLevel(deadlines: ClaimDeadline[]): DeadlineAnalysis['riskLevel'] {
    const now = Date.now();
    let criticalCount = 0;
    let urgentCount = 0;
    
    for (const deadline of deadlines) {
      if (deadline.status !== 'pending') continue;
      
      const daysUntilDue = (deadline.dueDate.getTime() - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDue < 0) {
        // Overdue
        return 'critical';
      } else if (daysUntilDue <= 3 && deadline.priority === 'critical') {
        criticalCount++;
      } else if (daysUntilDue <= 7 && deadline.priority === 'high') {
        urgentCount++;
      }
    }
    
    if (criticalCount > 0) return 'critical';
    if (urgentCount > 1) return 'high';
    if (urgentCount === 1) return 'medium';
    return 'low';
  }
  
  private async generateRecommendations(
    deadlines: ClaimDeadline[],
    claimData: SentinelClaimData,
    userId: string
  ): Promise<string[]> {
    const request: AIRequest = {
      prompt: `Generate actionable recommendations for managing these claim deadlines:
        
        ${deadlines.map(d => `- ${d.description}: Due ${d.dueDate.toLocaleDateString()}`).join('\n')}
        
        Claim context:
        - Type: ${claimData.claimType}
        - Status: ${claimData.currentStatus}
        
        Provide 3-5 specific, actionable recommendations to help the homeowner stay on track.`,
      systemPrompt: `You are Sentinel, helping homeowners manage claim deadlines.
        Focus on practical, specific actions they can take today.`,
      userId,
      feature: 'sentinel',
      temperature: 0.5
    };
    
    const response = await this.orchestrator.process(request);
    
    // Parse recommendations from response
    return response.text
      .split('\n')
      .filter(line => line.trim().match(/^[\d\-*•]/))
      .map(line => line.replace(/^[\d\-*•]\s*/, '').trim());
  }
  
  private async generateSummary(
    deadlines: ClaimDeadline[],
    riskLevel: string,
    userId: string
  ): Promise<string> {
    const upcomingCount = deadlines.filter(d => d.status === 'pending').length;
    const nextDeadline = deadlines
      .filter(d => d.status === 'pending')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
    
    const request: AIRequest = {
      prompt: `Create a brief, reassuring summary of claim deadline status:
        
        Total deadlines: ${upcomingCount}
        Risk level: ${riskLevel}
        Next deadline: ${nextDeadline ? `${nextDeadline.description} on ${nextDeadline.dueDate.toLocaleDateString()}` : 'None'}
        
        Write 2-3 sentences that inform without alarming, and express confidence in their ability to stay on track.`,
      systemPrompt: `You are Sentinel, the friendly deadline guardian.
        Be informative but reassuring, helping homeowners feel in control.`,
      userId,
      feature: 'sentinel',
      temperature: 0.6
    };
    
    const response = await this.orchestrator.process(request);
    return response.text;
  }
  
  private async saveDeadlines(deadlines: ClaimDeadline[]): Promise<void> {
    if (deadlines.length === 0) return;
    
    const { error } = await this.supabase
      .from('claim_deadlines')
      .insert(deadlines.map(d => ({
        ...d,
        due_date: d.dueDate.toISOString(),
        last_reminder_at: d.lastReminderAt?.toISOString(),
        completed_at: d.completedAt?.toISOString()
      })));
    
    if (error) {
      console.error('Error saving deadlines:', error);
    }
  }
  
  private async updateReminderTracking(deadlineId: string): Promise<void> {
    const { error } = await this.supabase
      .from('claim_deadlines')
      .update({
        reminders_sent: { increment: 1 },
        last_reminder_at: new Date().toISOString()
      })
      .eq('id', deadlineId);
    
    if (error) {
      console.error('Error updating reminder tracking:', error);
    }
  }
  
  private async getAllUpcomingDeadlines(): Promise<ClaimDeadline[]> {
    const { data, error } = await this.supabase
      .from('claim_deadlines')
      .select('*')
      .eq('status', 'pending')
      .lte('due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching all deadlines:', error);
      return [];
    }
    
    return data || [];
  }
  
  private async shouldSendReminder(deadline: ClaimDeadline): Promise<boolean> {
    const daysUntilDue = Math.ceil(
      (deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if we should send based on intervals
    const intervals = [30, 14, 7, 3, 1, 0];
    const shouldSend = intervals.includes(daysUntilDue);
    
    // Don't send if we already sent today
    if (deadline.lastReminderAt) {
      const lastReminder = new Date(deadline.lastReminderAt);
      const hoursSinceLastReminder = (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < 24) {
        return false;
      }
    }
    
    return shouldSend;
  }
  
  private getReminderConfig(deadline: ClaimDeadline): ReminderConfig {
    const daysUntilDue = Math.ceil(
      (deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      intervals: [30, 14, 7, 3, 1],
      channels: deadline.priority === 'critical' ? ['email', 'sms', 'push'] : ['email', 'in-app'],
      tone: daysUntilDue <= 3 ? 'urgent' : 'friendly'
    };
  }
  
  private async sendReminder(
    deadline: ClaimDeadline,
    reminder: ReminderMessage,
    config: ReminderConfig
  ): Promise<void> {
    // This would integrate with actual notification services
    console.log(`Sending reminder for deadline ${deadline.id}:`, reminder);
    
    // Record the notification
    await this.supabase
      .from('notifications')
      .insert({
        user_id: deadline.userId,
        type: 'deadline_reminder',
        title: reminder.subject,
        message: reminder.message,
        metadata: {
          deadline_id: deadline.id,
          channels: config.channels,
          tone: reminder.tone
        }
      });
  }
}