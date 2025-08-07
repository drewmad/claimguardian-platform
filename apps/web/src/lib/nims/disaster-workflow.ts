/**
 * @fileMetadata
 * @purpose "NIMS disaster response workflow management system"
 * @dependencies ["@/lib/nims/ics-integration", "@/lib/nims/resource-management", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'
import { ICSIncident, ICSObjective, ICSPosition, IncidentType, IncidentComplexity, icsIntegrationService } from './ics-integration'
import { NIMSResource, ResourceStatus, nimsResourceManager } from './resource-management'
import { EmergencyAlert, MessagePriority, emergencyCommunicationManager } from './emergency-communications'

// Disaster Response Phases
export enum ResponsePhase {
  PREVENTION = 'prevention',
  PREPAREDNESS = 'preparedness',
  RESPONSE = 'response',
  RECOVERY = 'recovery',
  MITIGATION = 'mitigation'
}

// Workflow Status
export enum WorkflowStatus {
  INITIATED = 'initiated',
  ACTIVE = 'active',
  ESCALATED = 'escalated',
  CONTAINED = 'contained',
  CONTROLLED = 'controlled',
  DEMOBILIZING = 'demobilizing',
  CLOSED = 'closed'
}

// Disaster Response Workflow
export interface DisasterWorkflow {
  id: string
  incident_id: string
  workflow_name: string
  incident_type: IncidentType
  current_phase: ResponsePhase
  status: WorkflowStatus
  priority_level: MessagePriority
  activation_triggers: WorkflowTrigger[]
  phases: WorkflowPhase[]
  current_activities: WorkflowActivity[]
  resource_assignments: ResourceAssignment[]
  decision_points: DecisionPoint[]
  performance_metrics: WorkflowMetrics
  stakeholders: Stakeholder[]
  created_at: string
  updated_at: string
  created_by: string
}

// Workflow Trigger Conditions
export interface WorkflowTrigger {
  id: string
  trigger_type: 'weather_alert' | 'damage_report' | 'resource_shortage' | 'time_based' | 'manual' | 'threshold_breach'
  condition: string
  threshold_value?: number
  monitoring_source: string
  auto_activation: boolean
  notification_list: string[]
  escalation_delay: number // minutes
}

// Workflow Phase Structure
export interface WorkflowPhase {
  id: string
  phase: ResponsePhase
  phase_name: string
  description: string
  activities: WorkflowActivity[]
  entry_criteria: string[]
  exit_criteria: string[]
  estimated_duration: number // hours
  required_resources: string[]
  success_metrics: string[]
  dependencies: string[] // other phase IDs
}

// Workflow Activity
export interface WorkflowActivity {
  id: string
  activity_name: string
  description: string
  phase: ResponsePhase
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed'
  assigned_position: ICSPosition[]
  assigned_resources: string[] // resource IDs
  estimated_duration: number // minutes
  actual_start_time?: string
  actual_end_time?: string
  dependencies: string[] // other activity IDs
  deliverables: string[]
  quality_checks: QualityCheck[]
  progress_updates: ProgressUpdate[]
}

// Quality Control Checks
export interface QualityCheck {
  id: string
  check_name: string
  check_type: 'automated' | 'manual' | 'peer_review'
  criteria: string
  status: 'pending' | 'passed' | 'failed' | 'not_applicable'
  checked_by?: string
  checked_at?: string
  notes?: string
}

// Progress Updates
export interface ProgressUpdate {
  id: string
  timestamp: string
  progress_percent: number
  status_description: string
  issues_encountered: string[]
  next_steps: string[]
  updated_by: string
}

// Resource Assignment
export interface ResourceAssignment {
  id: string
  resource_id: string
  activity_id: string
  assignment_type: 'primary' | 'backup' | 'support'
  start_time: string
  expected_end_time: string
  actual_end_time?: string
  utilization_rate: number
  performance_rating?: number
  cost_tracking: {
    hourly_rate?: number
    total_hours: number
    total_cost: number
  }
}

// Decision Points in Workflow
export interface DecisionPoint {
  id: string
  decision_name: string
  decision_type: 'escalation' | 'resource_request' | 'phase_transition' | 'tactical'
  trigger_conditions: string[]
  decision_criteria: string[]
  decision_options: {
    option: string
    consequences: string[]
    resource_impact: string
    time_impact: number
  }[]
  decision_made?: {
    selected_option: string
    decision_by: string
    decision_at: string
    rationale: string
  }
  approval_required: boolean
  approver_positions: ICSPosition[]
}

// Workflow Performance Metrics
export interface WorkflowMetrics {
  response_time: number // minutes from activation
  resource_efficiency: number // percentage
  objective_completion_rate: number // percentage
  cost_efficiency: number
  stakeholder_satisfaction: number
  lessons_learned: string[]
  improvement_recommendations: string[]
}

// Stakeholder Information
export interface Stakeholder {
  id: string
  name: string
  organization: string
  role: string
  contact_info: {
    phone: string
    email: string
    radio?: string
  }
  notification_preferences: string[]
  authority_level: 'observer' | 'advisor' | 'decision_maker' | 'incident_commander'
}

// Workflow Templates for different incident types
export const DISASTER_WORKFLOW_TEMPLATES: Record<IncidentType, Partial<DisasterWorkflow>> = {
  [IncidentType.HURRICANE]: {
    workflow_name: 'Hurricane Response Workflow',
    phases: [
      {
        id: 'prep-phase',
        phase: ResponsePhase.PREPAREDNESS,
        phase_name: 'Hurricane Preparedness',
        description: 'Pre-landfall preparation activities',
        activities: [
          {
            id: 'weather-monitor',
            activity_name: 'Weather Monitoring',
            description: 'Continuous monitoring of hurricane track and intensity',
            phase: ResponsePhase.PREPAREDNESS,
            priority: 'critical',
            status: 'pending',
            assigned_position: [ICSPosition.PLANNING_CHIEF],
            assigned_resources: [],
            estimated_duration: 480, // 8 hours continuous
            dependencies: [],
            deliverables: ['Weather updates every 2 hours', 'Impact projections'],
            quality_checks: [
              {
                id: 'weather-qc',
                check_name: 'Forecast Accuracy Verification',
                check_type: 'automated',
                criteria: 'Cross-reference with 3+ weather services',
                status: 'pending'
              }
            ],
            progress_updates: []
          },
          {
            id: 'evacuation-plan',
            activity_name: 'Evacuation Planning',
            description: 'Develop and communicate evacuation procedures',
            phase: ResponsePhase.PREPAREDNESS,
            priority: 'critical',
            status: 'pending',
            assigned_position: [ICSPosition.OPERATIONS_CHIEF],
            assigned_resources: [],
            estimated_duration: 240,
            dependencies: ['weather-monitor'],
            deliverables: ['Evacuation routes', 'Transportation plan', 'Shelter assignments'],
            quality_checks: [],
            progress_updates: []
          }
        ],
        entry_criteria: ['Hurricane watch issued', 'Landfall projected within 72 hours'],
        exit_criteria: ['All preparation activities completed', 'Transition to response phase'],
        estimated_duration: 48,
        required_resources: ['Weather monitoring equipment', 'Communication systems'],
        success_metrics: ['All residents notified', 'Critical infrastructure secured'],
        dependencies: []
      },
      {
        id: 'response-phase',
        phase: ResponsePhase.RESPONSE,
        phase_name: 'Hurricane Response',
        description: 'Active response during and immediately after hurricane',
        activities: [
          {
            id: 'emergency-ops',
            activity_name: 'Emergency Operations',
            description: 'Coordinate emergency response activities',
            phase: ResponsePhase.RESPONSE,
            priority: 'critical',
            status: 'pending',
            assigned_position: [ICSPosition.INCIDENT_COMMANDER, ICSPosition.OPERATIONS_CHIEF],
            assigned_resources: [],
            estimated_duration: 720, // 12 hours
            dependencies: [],
            deliverables: ['Incident action plans', 'Resource deployment orders'],
            quality_checks: [],
            progress_updates: []
          },
          {
            id: 'search-rescue',
            activity_name: 'Search and Rescue Operations',
            description: 'Conduct search and rescue as conditions permit',
            phase: ResponsePhase.RESPONSE,
            priority: 'critical',
            status: 'pending',
            assigned_position: [ICSPosition.OPERATIONS_CHIEF],
            assigned_resources: [],
            estimated_duration: 480,
            dependencies: ['emergency-ops'],
            deliverables: ['Search areas covered', 'Persons rescued'],
            quality_checks: [],
            progress_updates: []
          }
        ],
        entry_criteria: ['Hurricane conditions present', 'Emergency operations activated'],
        exit_criteria: ['Hurricane passed', 'Immediate life safety threats addressed'],
        estimated_duration: 24,
        required_resources: ['Emergency response teams', 'Communication systems', 'Medical supplies'],
        success_metrics: ['Zero preventable casualties', 'All emergency calls answered'],
        dependencies: ['prep-phase']
      }
    ]
  },

  [IncidentType.FLOOD]: {
    workflow_name: 'Flood Response Workflow',
    // Simplified - would have full flood-specific workflow
  },

  [IncidentType.WILDFIRE]: {
    workflow_name: 'Wildfire Response Workflow',
    // Simplified - would have full wildfire-specific workflow
  },

  // Other incident types would have their templates here
  [IncidentType.TORNADO]: { workflow_name: 'Tornado Response Workflow' },
  [IncidentType.EARTHQUAKE]: { workflow_name: 'Earthquake Response Workflow' },
  [IncidentType.WINTER_STORM]: { workflow_name: 'Winter Storm Response Workflow' },
  [IncidentType.HAIL_STORM]: { workflow_name: 'Hail Storm Response Workflow' },
  [IncidentType.STRUCTURE_FIRE]: { workflow_name: 'Structure Fire Response Workflow' },
  [IncidentType.HAZMAT]: { workflow_name: 'Hazmat Response Workflow' },
  [IncidentType.OTHER]: { workflow_name: 'General Emergency Response Workflow' }
}

export class DisasterWorkflowManager {
  private supabase = createClient()

  /**
   * Create disaster response workflow from template
   */
  async createWorkflow(
    incidentId: string,
    incidentType: IncidentType,
    customization?: Partial<DisasterWorkflow>
  ): Promise<DisasterWorkflow> {
    const template = DISASTER_WORKFLOW_TEMPLATES[incidentType]

    const workflow: DisasterWorkflow = {
      id: this.generateWorkflowId(),
      incident_id: incidentId,
      workflow_name: template.workflow_name || 'Emergency Response Workflow',
      incident_type: incidentType,
      current_phase: ResponsePhase.PREPAREDNESS,
      status: WorkflowStatus.INITIATED,
      priority_level: MessagePriority.IMMEDIATE,
      activation_triggers: this.getDefaultTriggers(incidentType),
      phases: template.phases || [],
      current_activities: [],
      resource_assignments: [],
      decision_points: this.getDefaultDecisionPoints(incidentType),
      performance_metrics: {
        response_time: 0,
        resource_efficiency: 0,
        objective_completion_rate: 0,
        cost_efficiency: 0,
        stakeholder_satisfaction: 0,
        lessons_learned: [],
        improvement_recommendations: []
      },
      stakeholders: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
      ...customization
    }

    // Save to database
    const { error } = await this.supabase
      .from('disaster_workflows')
      .insert(workflow)

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`)
    }

    return workflow
  }

  /**
   * Activate workflow based on trigger conditions
   */
  async activateWorkflow(workflowId: string, triggerId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)

    if (workflow.status !== WorkflowStatus.INITIATED) {
      throw new Error(`Workflow cannot be activated in status: ${workflow.status}`)
    }

    // Update workflow status
    await this.updateWorkflowStatus(workflowId, WorkflowStatus.ACTIVE)

    // Start first phase activities
    const firstPhase = workflow.phases.find(p => p.dependencies.length === 0)
    if (firstPhase) {
      await this.activatePhase(workflowId, firstPhase.id)
    }

    // Send activation notifications
    await this.sendActivationNotifications(workflow, triggerId)

    // Log activation
    console.log(`Workflow ${workflowId} activated by trigger ${triggerId}`)
  }

  /**
   * Transition to next workflow phase
   */
  async transitionPhase(
    workflowId: string,
    fromPhase: ResponsePhase,
    toPhase: ResponsePhase
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)

    // Validate phase transition
    const currentPhase = workflow.phases.find(p => p.phase === fromPhase)
    const nextPhase = workflow.phases.find(p => p.phase === toPhase)

    if (!currentPhase || !nextPhase) {
      throw new Error(`Invalid phase transition from ${fromPhase} to ${toPhase}`)
    }

    // Check exit criteria for current phase
    const exitCriteriaMet = await this.validateExitCriteria(workflowId, currentPhase)
    if (!exitCriteriaMet) {
      throw new Error(`Exit criteria not met for phase: ${fromPhase}`)
    }

    // Check entry criteria for next phase
    const entryCriteriaMet = await this.validateEntryCriteria(workflowId, nextPhase)
    if (!entryCriteriaMet) {
      throw new Error(`Entry criteria not met for phase: ${toPhase}`)
    }

    // Complete current phase activities
    await this.completePhaseActivities(workflowId, fromPhase)

    // Update workflow current phase
    await this.supabase
      .from('disaster_workflows')
      .update({
        current_phase: toPhase,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    // Activate next phase
    await this.activatePhase(workflowId, nextPhase.id)
  }

  /**
   * Assign resources to workflow activities
   */
  async assignResourceToActivity(
    workflowId: string,
    activityId: string,
    resourceId: string,
    assignmentType: ResourceAssignment['assignment_type']
  ): Promise<ResourceAssignment> {
    // Verify resource availability
    const resource = await nimsResourceManager['getResource'](resourceId)
    if (resource.status !== ResourceStatus.AVAILABLE) {
      throw new Error(`Resource ${resourceId} is not available`)
    }

    const assignment: ResourceAssignment = {
      id: this.generateAssignmentId(),
      resource_id: resourceId,
      activity_id: activityId,
      assignment_type: assignmentType,
      start_time: new Date().toISOString(),
      expected_end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours default
      utilization_rate: 1.0,
      cost_tracking: {
        total_hours: 0,
        total_cost: 0
      }
    }

    // Update resource status
    await nimsResourceManager['deployResource'](resourceId, workflowId, {
      deployment_location: { lat: 0, lng: 0, address: 'Incident Location' },
      mission_assignment: `Assigned to activity: ${activityId}`
    })

    // Save assignment
    await this.supabase
      .from('resource_assignments')
      .insert(assignment)

    return assignment
  }

  /**
   * Update activity progress
   */
  async updateActivityProgress(
    workflowId: string,
    activityId: string,
    progressUpdate: Partial<ProgressUpdate>
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    const activity = this.findActivityInWorkflow(workflow, activityId)

    if (!activity) {
      throw new Error(`Activity ${activityId} not found in workflow`)
    }

    const update: ProgressUpdate = {
      id: this.generateUpdateId(),
      timestamp: new Date().toISOString(),
      progress_percent: progressUpdate.progress_percent || 0,
      status_description: progressUpdate.status_description || '',
      issues_encountered: progressUpdate.issues_encountered || [],
      next_steps: progressUpdate.next_steps || [],
      updated_by: progressUpdate.updated_by || 'system',
      ...progressUpdate
    }

    // Add progress update to activity
    activity.progress_updates.push(update)

    // Update activity status based on progress
    if (update.progress_percent >= 100) {
      activity.status = 'completed'
      activity.actual_end_time = new Date().toISOString()
    } else if (update.progress_percent > 0 && activity.status === 'pending') {
      activity.status = 'active'
      activity.actual_start_time = activity.actual_start_time || new Date().toISOString()
    }

    // Save updated workflow
    await this.supabase
      .from('disaster_workflows')
      .update({
        phases: workflow.phases,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    // Check if phase should transition
    await this.checkPhaseCompletion(workflowId)
  }

  /**
   * Generate workflow performance report
   */
  async generatePerformanceReport(workflowId: string): Promise<WorkflowMetrics> {
    const workflow = await this.getWorkflow(workflowId)

    // Calculate response time
    const responseTime = workflow.current_activities.length > 0
      ? new Date(workflow.current_activities[0].actual_start_time!).getTime() - new Date(workflow.created_at).getTime()
      : 0

    // Calculate resource efficiency
    const resourceEfficiency = await this.calculateResourceEfficiency(workflow)

    // Calculate objective completion rate
    const totalActivities = workflow.phases.reduce((sum, phase) => sum + phase.activities.length, 0)
    const completedActivities = workflow.phases.reduce((sum, phase) =>
      sum + phase.activities.filter(a => a.status === 'completed').length, 0
    )
    const objectiveCompletionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

    // Calculate cost efficiency
    const costEfficiency = await this.calculateCostEfficiency(workflow)

    const metrics: WorkflowMetrics = {
      response_time: responseTime / (1000 * 60), // Convert to minutes
      resource_efficiency: resourceEfficiency,
      objective_completion_rate: objectiveCompletionRate,
      cost_efficiency: costEfficiency,
      stakeholder_satisfaction: 85, // Would be from surveys
      lessons_learned: await this.extractLessonsLearned(workflow),
      improvement_recommendations: await this.generateImprovementRecommendations(workflow)
    }

    // Update workflow with metrics
    await this.supabase
      .from('disaster_workflows')
      .update({
        performance_metrics: metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    return metrics
  }

  // Private helper methods
  private async getWorkflow(workflowId: string): Promise<DisasterWorkflow> {
    const { data, error } = await this.supabase
      .from('disaster_workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (error || !data) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    return data as DisasterWorkflow
  }

  private async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    await this.supabase
      .from('disaster_workflows')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
  }

  private getDefaultTriggers(incidentType: IncidentType): WorkflowTrigger[] {
    return [
      {
        id: 'auto-trigger',
        trigger_type: 'weather_alert',
        condition: `${incidentType} watch or warning issued`,
        auto_activation: true,
        notification_list: ['emergency-manager', 'incident-commander'],
        escalation_delay: 15,
        monitoring_source: 'National Weather Service'
      }
    ]
  }

  private getDefaultDecisionPoints(incidentType: IncidentType): DecisionPoint[] {
    return [
      {
        id: 'escalation-decision',
        decision_name: 'Escalation Decision',
        decision_type: 'escalation',
        trigger_conditions: ['Resource shortage', 'Complexity increase'],
        decision_criteria: ['Available resources', 'Incident complexity', 'Public safety risk'],
        decision_options: [
          {
            option: 'Request mutual aid',
            consequences: ['Additional resources', 'Coordination complexity'],
            resource_impact: 'Increased resource availability',
            time_impact: 60
          },
          {
            option: 'Escalate to higher complexity',
            consequences: ['Larger incident organization', 'Additional overhead'],
            resource_impact: 'Command structure expansion',
            time_impact: 120
          }
        ],
        approval_required: true,
        approver_positions: [ICSPosition.INCIDENT_COMMANDER]
      }
    ]
  }

  private async activatePhase(workflowId: string, phaseId: string): Promise<void> {
    // Implementation would activate all activities in the phase
    console.log(`Activating phase ${phaseId} in workflow ${workflowId}`)
  }

  private async sendActivationNotifications(workflow: DisasterWorkflow, triggerId: string): Promise<void> {
    // Send notifications to stakeholders
    await emergencyCommunicationManager.createEmergencyAlert({
      sender_id: 'ClaimGuardian-NIMS',
      title: `${workflow.workflow_name} Activated`,
      message: `Disaster response workflow activated for ${workflow.incident_type} incident.`,
      priority: workflow.priority_level,
      category: ['Safety'],
      urgency: 'Expected',
      severity: 'Moderate',
      certainty: 'Likely'
    })
  }

  private async validateExitCriteria(workflowId: string, phase: WorkflowPhase): Promise<boolean> {
    // Implementation would check all exit criteria
    return true // Simplified
  }

  private async validateEntryCriteria(workflowId: string, phase: WorkflowPhase): Promise<boolean> {
    // Implementation would check all entry criteria
    return true // Simplified
  }

  private async completePhaseActivities(workflowId: string, phase: ResponsePhase): Promise<void> {
    // Implementation would complete all activities in phase
    console.log(`Completing activities for phase ${phase}`)
  }

  private findActivityInWorkflow(workflow: DisasterWorkflow, activityId: string): WorkflowActivity | null {
    for (const phase of workflow.phases) {
      const activity = phase.activities.find(a => a.id === activityId)
      if (activity) return activity
    }
    return null
  }

  private async checkPhaseCompletion(workflowId: string): Promise<void> {
    // Implementation would check if current phase is complete and ready to transition
    console.log(`Checking phase completion for workflow ${workflowId}`)
  }

  private async calculateResourceEfficiency(workflow: DisasterWorkflow): Promise<number> {
    // Implementation would calculate resource utilization efficiency
    return 85 // Placeholder
  }

  private async calculateCostEfficiency(workflow: DisasterWorkflow): Promise<number> {
    // Implementation would calculate cost vs. objectives achieved
    return 90 // Placeholder
  }

  private async extractLessonsLearned(workflow: DisasterWorkflow): Promise<string[]> {
    // Implementation would extract lessons from workflow execution
    return ['Improve communication protocols', 'Need faster resource deployment']
  }

  private async generateImprovementRecommendations(workflow: DisasterWorkflow): Promise<string[]> {
    // Implementation would generate recommendations based on performance
    return ['Implement automated resource tracking', 'Enhance stakeholder notification system']
  }

  // ID generators
  private generateWorkflowId(): string {
    return `WF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateAssignmentId(): string {
    return `ASN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateUpdateId(): string {
    return `UPD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }
}

export const disasterWorkflowManager = new DisasterWorkflowManager()
