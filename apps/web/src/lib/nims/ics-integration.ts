/**
 * @fileMetadata
 * @purpose "FEMA NIMS Incident Command System (ICS) integration architecture"
 * @dependencies ["@/lib/supabase", "crypto"]
 * @owner emergency-management-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'
import { createHash } from 'crypto'

// NIMS ICS Standard Organizational Positions
export enum ICSPosition {
  INCIDENT_COMMANDER = 'IC',
  DEPUTY_INCIDENT_COMMANDER = 'DIC',
  SAFETY_OFFICER = 'SO',
  INFORMATION_OFFICER = 'IO',
  LIAISON_OFFICER = 'LO',
  OPERATIONS_CHIEF = 'OPS',
  PLANNING_CHIEF = 'PLAN',
  LOGISTICS_CHIEF = 'LOG',
  FINANCE_ADMIN_CHIEF = 'FIN'
}

// NIMS Standard Incident Types
export enum IncidentType {
  HURRICANE = 'hurricane',
  TORNADO = 'tornado',
  FLOOD = 'flood',
  WILDFIRE = 'wildfire',
  EARTHQUAKE = 'earthquake',
  WINTER_STORM = 'winter_storm',
  HAIL_STORM = 'hail_storm',
  STRUCTURE_FIRE = 'structure_fire',
  HAZMAT = 'hazmat',
  OTHER = 'other'
}

// ICS Incident Complexity Levels
export enum IncidentComplexity {
  TYPE_5 = 5, // Initial response, single resource
  TYPE_4 = 4, // Several resources, limited timeframe
  TYPE_3 = 3, // Extended attack, multiple resources
  TYPE_2 = 2, // Extended attack, regional resources
  TYPE_1 = 1, // Most complex, national resources
}

// NIMS Resource Typing Categories
export interface NIMSResource {
  id: string
  name: string
  type: string
  category: 'personnel' | 'teams' | 'equipment' | 'supplies' | 'facilities'
  capability: string
  status: 'available' | 'assigned' | 'out_of_service'
  location: {
    lat: number
    lng: number
    address: string
  }
  qualifications: string[]
  contact: {
    primary: string
    secondary?: string
    radio_frequency?: string
  }
  last_updated: string
}

// ICS Incident Structure
export interface ICSIncident {
  id: string
  incident_number: string
  incident_name: string
  incident_type: IncidentType
  complexity_level: IncidentComplexity
  location: {
    lat: number
    lng: number
    address: string
    jurisdiction: string
  }
  start_date: string
  end_date?: string
  status: 'active' | 'contained' | 'controlled' | 'closed'
  objectives: ICSObjective[]
  organization: ICSOrganization
  resources: NIMSResource[]
  forms: ICSForm[]
  operational_period: {
    start: string
    end: string
    period_number: number
  }
  weather: {
    current_conditions: string
    forecast: string
    wind_speed: number
    temperature: number
  }
  created_by: string
  last_updated: string
}

// ICS Objectives (ICS-202)
export interface ICSObjective {
  id: string
  objective_number: number
  description: string
  priority: 'high' | 'medium' | 'low'
  assigned_to: ICSPosition[]
  due_date: string
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  progress_notes: string[]
}

// ICS Organization Structure (ICS-203)
export interface ICSOrganization {
  incident_commander: ICSPersonnel
  command_staff: {
    safety_officer?: ICSPersonnel
    information_officer?: ICSPersonnel
    liaison_officer?: ICSPersonnel
  }
  general_staff: {
    operations_chief?: ICSPersonnel
    planning_chief?: ICSPersonnel
    logistics_chief?: ICSPersonnel
    finance_admin_chief?: ICSPersonnel
  }
  unified_command?: ICSPersonnel[]
}

// ICS Personnel Information
export interface ICSPersonnel {
  id: string
  name: string
  position: ICSPosition
  agency: string
  contact: {
    phone: string
    radio: string
    email: string
  }
  qualifications: string[]
  assignments: {
    start_time: string
    end_time?: string
    location: string
    responsibilities: string[]
  }[]
  check_in_time: string
  check_out_time?: string
}

// Standard ICS Forms
export interface ICSForm {
  id: string
  form_number: string // ICS-201, ICS-202, etc.
  form_name: string
  incident_id: string
  operational_period: number
  prepared_by: string
  prepared_date: string
  data: Record<string, any>
  status: 'draft' | 'approved' | 'distributed'
  digital_signature?: string
}

// Resource Request Structure
export interface ResourceRequest {
  id: string
  incident_id: string
  request_number: string
  requested_by: ICSPosition
  resource_type: string
  quantity: number
  priority: 'immediate' | 'high' | 'medium' | 'low'
  needed_by: string
  mission: string
  special_instructions: string[]
  status: 'open' | 'filled' | 'partial' | 'cancelled'
  fulfillment_details?: {
    assigned_resources: NIMSResource[]
    eta: string
    contact: string
  }
  created_at: string
  updated_at: string
}

// Communication Plan (ICS-205)
export interface CommunicationPlan {
  incident_id: string
  operational_period: number
  assignments: {
    function: string
    channel: string
    frequency: string
    system: string
    assignment: string
    rx_freq: string
    tx_freq: string
    mode: string
    remarks: string
  }[]
  special_instructions: string[]
  prepared_by: string
  approved_by: string
}

// Situation Report Structure
export interface SituationReport {
  id: string
  incident_id: string
  report_number: number
  report_date: string
  operational_period: number
  situation_overview: string
  current_status: {
    percent_contained: number
    forward_progress_stopped: boolean
    anticipated_containment: string
  }
  weather: {
    conditions: string
    temperature_range: string
    humidity: number
    wind: {
      speed: number
    direction: string
    gusts?: number
  }
    probability_of_precipitation: number
  }
  safety_issues: string[]
  resource_summary: {
    total_personnel: number
    overhead: number
    total_resources: number
  }
  significant_events: {
    time: string
    description: string
  }[]
  prepared_by: string
  approved_by: string
}

export class ICSIntegrationService {
  private supabase = createClient()

  /**
   * Create a new ICS incident structure
   */
  async createIncident(incidentData: Partial<ICSIncident>): Promise<ICSIncident> {
    const incident: ICSIncident = {
      id: this.generateIncidentId(),
      incident_number: this.generateIncidentNumber(),
      incident_name: incidentData.incident_name || 'Unnamed Incident',
      incident_type: incidentData.incident_type || IncidentType.OTHER,
      complexity_level: incidentData.complexity_level || IncidentComplexity.TYPE_5,
      location: incidentData.location || {
        lat: 0,
        lng: 0,
        address: '',
        jurisdiction: ''
      },
      start_date: new Date().toISOString(),
      status: 'active',
      objectives: [],
      organization: incidentData.organization || {
        incident_commander: {
          id: '',
          name: '',
          position: ICSPosition.INCIDENT_COMMANDER,
          agency: '',
          contact: { phone: '', radio: '', email: '' },
          qualifications: [],
          assignments: [],
          check_in_time: new Date().toISOString()
        }
      },
      resources: [],
      forms: [],
      operational_period: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        period_number: 1
      },
      weather: {
        current_conditions: '',
        forecast: '',
        wind_speed: 0,
        temperature: 0
      },
      created_by: incidentData.created_by || '',
      last_updated: new Date().toISOString(),
      ...incidentData
    }

    // Store in database
    const { error } = await this.supabase
      .from('ics_incidents')
      .insert(incident)

    if (error) {
      throw new Error(`Failed to create ICS incident: ${error.message}`)
    }

    return incident
  }

  /**
   * Generate ICS Form 201 - Incident Briefing
   */
  async generateICS201(incidentId: string): Promise<ICSForm> {
    const incident = await this.getIncident(incidentId)
    
    const form: ICSForm = {
      id: this.generateFormId(),
      form_number: 'ICS-201',
      form_name: 'Incident Briefing',
      incident_id: incidentId,
      operational_period: incident.operational_period.period_number,
      prepared_by: incident.organization.incident_commander.name,
      prepared_date: new Date().toISOString(),
      status: 'draft',
      data: {
        incident_name: incident.incident_name,
        incident_number: incident.incident_number,
        incident_commander: incident.organization.incident_commander.name,
        incident_location: incident.location.address,
        incident_type: incident.incident_type,
        start_date: incident.start_date,
        current_situation: this.getCurrentSituation(incident),
        initial_objectives: incident.objectives.slice(0, 3),
        current_organization: this.getOrganizationSummary(incident.organization),
        resource_summary: this.getResourceSummary(incident.resources),
        weather: incident.weather,
        safety_considerations: this.getSafetyConsiderations(incident),
        initial_briefing_completed: false
      }
    }

    await this.saveForm(form)
    return form
  }

  /**
   * Generate ICS Form 202 - Incident Objectives
   */
  async generateICS202(incidentId: string, objectives: ICSObjective[]): Promise<ICSForm> {
    const incident = await this.getIncident(incidentId)
    
    const form: ICSForm = {
      id: this.generateFormId(),
      form_number: 'ICS-202',
      form_name: 'Incident Objectives',
      incident_id: incidentId,
      operational_period: incident.operational_period.period_number,
      prepared_by: incident.organization.planning_chief?.name || incident.organization.incident_commander.name,
      prepared_date: new Date().toISOString(),
      status: 'draft',
      data: {
        incident_name: incident.incident_name,
        operational_period: {
          date: new Date(incident.operational_period.start).toLocaleDateString(),
          time: `${new Date(incident.operational_period.start).toLocaleTimeString()} - ${new Date(incident.operational_period.end).toLocaleTimeString()}`
        },
        objectives: objectives.map((obj, index) => ({
          number: index + 1,
          description: obj.description,
          time_frame: obj.due_date,
          responsible_assignment: obj.assigned_to.join(', ')
        })),
        weather_forecast: incident.weather.forecast,
        general_situation_awareness: this.getSituationAwareness(incident),
        attachments: []
      }
    }

    await this.saveForm(form)
    return form
  }

  /**
   * Generate ICS Form 203 - Organization Assignment List
   */
  async generateICS203(incidentId: string): Promise<ICSForm> {
    const incident = await this.getIncident(incidentId)
    
    const form: ICSForm = {
      id: this.generateFormId(),
      form_number: 'ICS-203',
      form_name: 'Organization Assignment List',
      incident_id: incidentId,
      operational_period: incident.operational_period.period_number,
      prepared_by: incident.organization.incident_commander.name,
      prepared_date: new Date().toISOString(),
      status: 'draft',
      data: {
        incident_name: incident.incident_name,
        operational_period_date_time: `${new Date(incident.operational_period.start).toLocaleDateString()} ${new Date(incident.operational_period.start).toLocaleTimeString()}`,
        assignments: this.buildOrganizationChart(incident.organization),
        resources_summary: incident.resources.length,
        prepared_by: incident.organization.incident_commander.name,
        approved_by: incident.organization.incident_commander.name
      }
    }

    await this.saveForm(form)
    return form
  }

  /**
   * Submit resource request through NIMS protocols
   */
  async submitResourceRequest(request: Partial<ResourceRequest>): Promise<ResourceRequest> {
    const resourceRequest: ResourceRequest = {
      id: this.generateRequestId(),
      incident_id: request.incident_id!,
      request_number: this.generateRequestNumber(),
      requested_by: request.requested_by!,
      resource_type: request.resource_type!,
      quantity: request.quantity || 1,
      priority: request.priority || 'medium',
      needed_by: request.needed_by!,
      mission: request.mission || '',
      special_instructions: request.special_instructions || [],
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...request
    }

    // Store in database and trigger notification workflow
    const { error } = await this.supabase
      .from('resource_requests')
      .insert(resourceRequest)

    if (error) {
      throw new Error(`Failed to submit resource request: ${error.message}`)
    }

    // Trigger notification to resource managers
    await this.notifyResourceManagers(resourceRequest)

    return resourceRequest
  }

  /**
   * Update incident status and generate situation report
   */
  async updateIncidentStatus(
    incidentId: string, 
    updates: Partial<ICSIncident>
  ): Promise<ICSIncident> {
    const incident = await this.getIncident(incidentId)
    const updatedIncident = {
      ...incident,
      ...updates,
      last_updated: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('ics_incidents')
      .update(updatedIncident)
      .eq('id', incidentId)

    if (error) {
      throw new Error(`Failed to update incident: ${error.message}`)
    }

    // Auto-generate situation report if significant changes
    if (this.isSignificantUpdate(updates)) {
      await this.generateSituationReport(incidentId)
    }

    return updatedIncident
  }

  // Private helper methods
  private generateIncidentId(): string {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  private generateIncidentNumber(): string {
    const year = new Date().getFullYear()
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `${year}-${sequence}`
  }

  private generateFormId(): string {
    return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  private generateRequestNumber(): string {
    const timestamp = Date.now().toString().slice(-6)
    return `RR-${timestamp}`
  }

  private async getIncident(incidentId: string): Promise<ICSIncident> {
    const { data, error } = await this.supabase
      .from('ics_incidents')
      .select('*')
      .eq('id', incidentId)
      .single()

    if (error || !data) {
      throw new Error(`Incident not found: ${incidentId}`)
    }

    return data as ICSIncident
  }

  private async saveForm(form: ICSForm): Promise<void> {
    const { error } = await this.supabase
      .from('ics_forms')
      .insert(form)

    if (error) {
      throw new Error(`Failed to save ICS form: ${error.message}`)
    }
  }

  private getCurrentSituation(incident: ICSIncident): string {
    return `${incident.incident_type} incident at ${incident.location.address}. Status: ${incident.status}. Started: ${new Date(incident.start_date).toLocaleString()}.`
  }

  private getOrganizationSummary(organization: ICSOrganization): any {
    return {
      incident_commander: organization.incident_commander.name,
      command_staff_assigned: Object.keys(organization.command_staff).filter(key => 
        organization.command_staff[key as keyof typeof organization.command_staff]
      ).length,
      general_staff_assigned: Object.keys(organization.general_staff).filter(key =>
        organization.general_staff[key as keyof typeof organization.general_staff]
      ).length
    }
  }

  private getResourceSummary(resources: NIMSResource[]): any {
    return {
      total_resources: resources.length,
      available: resources.filter(r => r.status === 'available').length,
      assigned: resources.filter(r => r.status === 'assigned').length,
      out_of_service: resources.filter(r => r.status === 'out_of_service').length,
      by_category: {
        personnel: resources.filter(r => r.category === 'personnel').length,
        equipment: resources.filter(r => r.category === 'equipment').length,
        teams: resources.filter(r => r.category === 'teams').length,
        supplies: resources.filter(r => r.category === 'supplies').length,
        facilities: resources.filter(r => r.category === 'facilities').length
      }
    }
  }

  private getSafetyConsiderations(incident: ICSIncident): string[] {
    // Generate safety considerations based on incident type
    const considerations = []
    
    switch (incident.incident_type) {
      case IncidentType.HURRICANE:
        considerations.push('High winds and flying debris', 'Flooding potential', 'Power line hazards')
        break
      case IncidentType.FLOOD:
        considerations.push('Swift water hazards', 'Contaminated water', 'Structural instability')
        break
      case IncidentType.WILDFIRE:
        considerations.push('Smoke inhalation', 'Changing wind conditions', 'Spot fires')
        break
      default:
        considerations.push('Standard safety protocols apply', 'Monitor weather conditions')
    }

    return considerations
  }

  private getSituationAwareness(incident: ICSIncident): string {
    return `Current incident complexity: Type ${incident.complexity_level}. Weather: ${incident.weather.current_conditions}. Resources deployed: ${incident.resources.length}.`
  }

  private buildOrganizationChart(organization: ICSOrganization): any[] {
    const assignments = []
    
    // Incident Commander
    assignments.push({
      position: 'Incident Commander',
      name: organization.incident_commander.name,
      contact: organization.incident_commander.contact.phone || organization.incident_commander.contact.radio
    })

    // Command Staff
    if (organization.command_staff.safety_officer) {
      assignments.push({
        position: 'Safety Officer',
        name: organization.command_staff.safety_officer.name,
        contact: organization.command_staff.safety_officer.contact.phone || organization.command_staff.safety_officer.contact.radio
      })
    }

    if (organization.command_staff.information_officer) {
      assignments.push({
        position: 'Information Officer',
        name: organization.command_staff.information_officer.name,
        contact: organization.command_staff.information_officer.contact.phone || organization.command_staff.information_officer.contact.radio
      })
    }

    // General Staff
    if (organization.general_staff.operations_chief) {
      assignments.push({
        position: 'Operations Chief',
        name: organization.general_staff.operations_chief.name,
        contact: organization.general_staff.operations_chief.contact.phone || organization.general_staff.operations_chief.contact.radio
      })
    }

    return assignments
  }

  private async notifyResourceManagers(request: ResourceRequest): Promise<void> {
    // Implementation would send notifications through appropriate channels
    console.log(`Resource request ${request.request_number} submitted for ${request.resource_type}`)
  }

  private isSignificantUpdate(updates: Partial<ICSIncident>): boolean {
    // Check if updates warrant a situation report
    return !!(updates.status || updates.objectives || updates.complexity_level)
  }

  private async generateSituationReport(incidentId: string): Promise<SituationReport> {
    const incident = await this.getIncident(incidentId)
    
    const report: SituationReport = {
      id: `SITREP-${Date.now()}`,
      incident_id: incidentId,
      report_number: await this.getNextReportNumber(incidentId),
      report_date: new Date().toISOString(),
      operational_period: incident.operational_period.period_number,
      situation_overview: this.getCurrentSituation(incident),
      current_status: {
        percent_contained: 0, // Would be calculated based on incident type
        forward_progress_stopped: incident.status === 'contained',
        anticipated_containment: 'TBD'
      },
      weather: {
        conditions: incident.weather.current_conditions,
        temperature_range: `${incident.weather.temperature}°F`,
        humidity: 0,
        wind: {
          speed: incident.weather.wind_speed,
          direction: 'Variable'
        },
        probability_of_precipitation: 0
      },
      safety_issues: this.getSafetyConsiderations(incident),
      resource_summary: {
        total_personnel: incident.resources.filter(r => r.category === 'personnel').length,
        overhead: Object.keys(incident.organization.general_staff).length + Object.keys(incident.organization.command_staff).length + 1,
        total_resources: incident.resources.length
      },
      significant_events: [],
      prepared_by: incident.organization.planning_chief?.name || incident.organization.incident_commander.name,
      approved_by: incident.organization.incident_commander.name
    }

    await this.supabase
      .from('situation_reports')
      .insert(report)

    return report
  }

  private async getNextReportNumber(incidentId: string): Promise<number> {
    const { count } = await this.supabase
      .from('situation_reports')
      .select('*', { count: 'exact', head: true })
      .eq('incident_id', incidentId)

    return (count || 0) + 1
  }
}

export const icsIntegrationService = new ICSIntegrationService()