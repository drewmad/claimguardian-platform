/**
 * @fileMetadata
 * @purpose "Integration with external emergency services APIs and systems"
 * @dependencies ["@/lib/supabase", "@/lib/nims"]
 * @owner emergency-management-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'
import { CAPMessage, EDXLDistribution } from './emergency-communications'
import { NIMSResource } from './resource-management'

// Emergency Service Provider Types
export enum ServiceProvider {
  NATIONAL_WEATHER_SERVICE = 'nws',
  FEMA = 'fema',
  RED_CROSS = 'red_cross',
  SALVATION_ARMY = 'salvation_army',
  LOCAL_EMERGENCY_MANAGEMENT = 'local_em',
  FIRE_DEPARTMENT = 'fire_dept',
  POLICE_DEPARTMENT = 'police_dept',
  EMS = 'ems',
  UTILITIES = 'utilities',
  TRANSPORTATION = 'transportation'
}

// API Integration Configuration
export interface ServiceIntegration {
  id: string
  provider: ServiceProvider
  service_name: string
  api_endpoint: string
  authentication: {
    type: 'api_key' | 'oauth' | 'certificate' | 'basic_auth'
    credentials: Record<string, string>
  }
  data_formats: string[] // CAP, EDXL, JSON, XML
  capabilities: ServiceCapability[]
  status: 'active' | 'inactive' | 'error' | 'testing'
  last_tested: string
  response_time_sla: number // milliseconds
  availability_sla: number // percentage
  contact_info: {
    technical_contact: string
    operational_contact: string
    emergency_contact: string
  }
  configuration: Record<string, any>
}

// Service Capabilities
export interface ServiceCapability {
  capability_type: 'alert_distribution' | 'resource_sharing' | 'situation_reporting' | 'damage_assessment' | 'weather_data' | 'evacuation_support'
  description: string
  input_formats: string[]
  output_formats: string[]
  real_time: boolean
  geographic_coverage: {
    type: 'global' | 'national' | 'state' | 'county' | 'city' | 'custom'
    boundaries?: string // GeoJSON polygon
  }
}

// Data Exchange Message
export interface DataExchangeMessage {
  id: string
  message_type: 'alert' | 'resource_request' | 'situation_report' | 'status_update'
  source_system: string
  target_system: string
  protocol: 'CAP' | 'EDXL' | 'REST' | 'SOAP' | 'WebSocket'
  payload: any
  metadata: {
    priority: 'flash' | 'immediate' | 'priority' | 'routine'
    classification: 'unclassified' | 'for_official_use_only' | 'confidential'
    distribution_scope: string[]
    expiration_time?: string
  }
  status: 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed' | 'expired'
  delivery_attempts: number
  created_at: string
  updated_at: string
}

// External System Status
export interface SystemStatus {
  system_id: string
  system_name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  availability: number
  response_time: number
  last_check: string
  error_count: number
  uptime_percentage: number
}

export class EmergencyServicesIntegration {
  private supabase = createClient()
  private integrations: Map<ServiceProvider, ServiceIntegration> = new Map()

  constructor() {
    this.loadIntegrations()
  }

  /**
   * Register integration with emergency service provider
   */
  async registerIntegration(integration: ServiceIntegration): Promise<void> {
    // Validate integration configuration
    await this.validateIntegration(integration)

    // Test connection
    const testResult = await this.testConnection(integration)
    if (!testResult.success) {
      throw new Error(`Integration test failed: ${testResult.error}`)
    }

    // Store integration
    const { error } = await this.supabase
      .from('service_integrations')
      .insert(integration)

    if (error) {
      throw new Error(`Failed to register integration: ${error.message}`)
    }

    this.integrations.set(integration.provider, integration)
  }

  /**
   * Send CAP alert to National Weather Service
   */
  async sendNWSAlert(capMessage: CAPMessage): Promise<void> {
    const nwsIntegration = this.integrations.get(ServiceProvider.NATIONAL_WEATHER_SERVICE)
    if (!nwsIntegration) {
      throw new Error('NWS integration not configured')
    }

    const message: DataExchangeMessage = {
      id: this.generateMessageId(),
      message_type: 'alert',
      source_system: 'ClaimGuardian-NIMS',
      target_system: 'NWS-CAP',
      protocol: 'CAP',
      payload: capMessage,
      metadata: {
        priority: 'immediate',
        classification: 'unclassified',
        distribution_scope: ['public']
      },
      status: 'pending',
      delivery_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.sendMessage(message, nwsIntegration)
  }

  /**
   * Request resources from FEMA
   */
  async requestFEMAResources(
    resourceRequirements: {
      resource_type: string
      quantity: number
      mission: string
      location: { lat: number, lng: number }
      priority: string
    }[]
  ): Promise<string> {
    const femaIntegration = this.integrations.get(ServiceProvider.FEMA)
    if (!femaIntegration) {
      throw new Error('FEMA integration not configured')
    }

    // Create EDXL Resource Message
    const resourceMessage = {
      messageID: this.generateMessageId(),
      sentDateTime: new Date().toISOString(),
      messageContentType: 'RequestResource',
      incidentInformation: {
        incidentID: 'CLAIM-' + Date.now(),
        incidentDescription: 'Property damage incident requiring federal assistance'
      },
      contactInformation: [{
        contactRole: 'Requesting Agency',
        contactOrganization: {
          organizationName: 'ClaimGuardian Emergency Management',
          organizationType: 'Private Sector'
        }
      }],
      resource: resourceRequirements.map(req => ({
        name: req.resource_type,
        typeStructure: { value: req.resource_type },
        quantity: {
          measurementValue: req.quantity,
          unitOfMeasure: 'units'
        },
        anticipatedFunction: req.mission
      }))
    }

    const message: DataExchangeMessage = {
      id: this.generateMessageId(),
      message_type: 'resource_request',
      source_system: 'ClaimGuardian-NIMS',
      target_system: 'FEMA-IRIS',
      protocol: 'EDXL',
      payload: resourceMessage,
      metadata: {
        priority: 'priority',
        classification: 'for_official_use_only',
        distribution_scope: ['federal_agencies']
      },
      status: 'pending',
      delivery_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.sendMessage(message, femaIntegration)
    return message.id
  }

  /**
   * Get weather data from National Weather Service
   */
  async getNWSWeatherData(location: { lat: number, lng: number }): Promise<any> {
    const nwsIntegration = this.integrations.get(ServiceProvider.NATIONAL_WEATHER_SERVICE)
    if (!nwsIntegration) {
      throw new Error('NWS integration not configured')
    }

    try {
      // NWS API v1 - get forecast office and grid coordinates
      const pointResponse = await fetch(
        `https://api.weather.gov/points/${location.lat},${location.lng}`,
        {
          headers: {
            'User-Agent': 'ClaimGuardian-NIMS/1.0 (emergency-management@claimguardian.com)'
          }
        }
      )

      if (!pointResponse.ok) {
        throw new Error(`NWS API error: ${pointResponse.statusText}`)
      }

      const pointData = await pointResponse.json()
      
      // Get current conditions
      const forecastResponse = await fetch(pointData.properties.forecast, {
        headers: {
          'User-Agent': 'ClaimGuardian-NIMS/1.0 (emergency-management@claimguardian.com)'
        }
      })

      const forecastData = await forecastResponse.json()

      // Get active alerts for the area
      const alertsResponse = await fetch(
        `https://api.weather.gov/alerts?point=${location.lat},${location.lng}&status=actual&urgency=immediate,expected`,
        {
          headers: {
            'User-Agent': 'ClaimGuardian-NIMS/1.0 (emergency-management@claimguardian.com)'
          }
        }
      )

      const alertsData = await alertsResponse.json()

      return {
        location: pointData.properties.relativeLocation.properties,
        forecast: forecastData.properties.periods.slice(0, 5), // Next 5 periods
        alerts: alertsData.features || [],
        office: pointData.properties.cwa,
        gridX: pointData.properties.gridX,
        gridY: pointData.properties.gridY,
        updated: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Failed to get NWS weather data: ${error}`)
    }
  }

  /**
   * Submit damage assessment to FEMA
   */
  async submitFEMADamageAssessment(assessmentData: {
    incident_id: string
    location: { lat: number, lng: number, address: string }
    damage_category: string
    severity_level: number
    estimated_cost: number
    photos: string[]
    assessor_info: {
      name: string
      certification: string
      organization: string
    }
  }): Promise<string> {
    const femaIntegration = this.integrations.get(ServiceProvider.FEMA)
    if (!femaIntegration) {
      throw new Error('FEMA integration not configured')
    }

    // Format assessment data for FEMA systems
    const damageReport = {
      reportId: this.generateReportId(),
      incidentId: assessmentData.incident_id,
      location: {
        coordinates: [assessmentData.location.lng, assessmentData.location.lat],
        address: assessmentData.location.address
      },
      assessment: {
        damageCategory: assessmentData.damage_category,
        severityLevel: assessmentData.severity_level,
        estimatedCost: assessmentData.estimated_cost,
        assessmentDate: new Date().toISOString(),
        assessor: assessmentData.assessor_info
      },
      attachments: assessmentData.photos.map(photo => ({
        type: 'image',
        url: photo,
        description: 'Damage documentation photo'
      }))
    }

    const message: DataExchangeMessage = {
      id: this.generateMessageId(),
      message_type: 'situation_report',
      source_system: 'ClaimGuardian-NIMS',
      target_system: 'FEMA-NEMIS',
      protocol: 'REST',
      payload: damageReport,
      metadata: {
        priority: 'routine',
        classification: 'for_official_use_only',
        distribution_scope: ['fema', 'local_em']
      },
      status: 'pending',
      delivery_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.sendMessage(message, femaIntegration)
    return damageReport.reportId
  }

  /**
   * Get Red Cross shelter information
   */
  async getRedCrossShelters(searchArea: {
    center: { lat: number, lng: number }
    radius: number // miles
  }): Promise<any[]> {
    const redCrossIntegration = this.integrations.get(ServiceProvider.RED_CROSS)
    if (!redCrossIntegration) {
      throw new Error('Red Cross integration not configured')
    }

    try {
      // Red Cross Shelter API (example - actual API may vary)
      const response = await fetch(
        `${redCrossIntegration.api_endpoint}/shelters/search?lat=${searchArea.center.lat}&lng=${searchArea.center.lng}&radius=${searchArea.radius}`,
        {
          headers: {
            'Authorization': `Bearer ${redCrossIntegration.authentication.credentials.api_key}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Red Cross API error: ${response.statusText}`)
      }

      const shelterData = await response.json()
      
      return shelterData.shelters.map((shelter: any) => ({
        id: shelter.id,
        name: shelter.name,
        address: shelter.address,
        capacity: shelter.capacity,
        current_occupancy: shelter.currentOccupancy,
        available_space: shelter.capacity - shelter.currentOccupancy,
        services: shelter.services || [],
        contact: shelter.contact,
        coordinates: {
          lat: shelter.latitude,
          lng: shelter.longitude
        },
        last_updated: shelter.lastUpdated
      }))
    } catch (error) {
      throw new Error(`Failed to get Red Cross shelter data: ${error}`)
    }
  }

  /**
   * Coordinate with local emergency management
   */
  async coordinateWithLocalEM(
    jurisdiction: string,
    coordinationRequest: {
      incident_id: string
      request_type: 'mutual_aid' | 'resource_sharing' | 'information_sharing' | 'joint_operations'
      details: string
      priority: string
      contact_info: any
    }
  ): Promise<string> {
    const localEMIntegration = this.integrations.get(ServiceProvider.LOCAL_EMERGENCY_MANAGEMENT)
    if (!localEMIntegration) {
      throw new Error('Local Emergency Management integration not configured')
    }

    const coordinationMessage = {
      messageId: this.generateMessageId(),
      jurisdiction: jurisdiction,
      requestType: coordinationRequest.request_type,
      incidentId: coordinationRequest.incident_id,
      priority: coordinationRequest.priority,
      requestDetails: coordinationRequest.details,
      requestingAgency: {
        name: 'ClaimGuardian Emergency Management',
        type: 'Private Sector',
        contact: coordinationRequest.contact_info
      },
      timestamp: new Date().toISOString()
    }

    const message: DataExchangeMessage = {
      id: coordinationMessage.messageId,
      message_type: 'status_update',
      source_system: 'ClaimGuardian-NIMS',
      target_system: `LocalEM-${jurisdiction}`,
      protocol: 'REST',
      payload: coordinationMessage,
      metadata: {
        priority: coordinationRequest.priority as any,
        classification: 'for_official_use_only',
        distribution_scope: [jurisdiction]
      },
      status: 'pending',
      delivery_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.sendMessage(message, localEMIntegration)
    return coordinationMessage.messageId
  }

  /**
   * Monitor system status of all integrations
   */
  async monitorSystemStatus(): Promise<SystemStatus[]> {
    const statusChecks = Array.from(this.integrations.values()).map(async (integration) => {
      const startTime = Date.now()
      let status: SystemStatus['status'] = 'operational'
      let responseTime = 0
      let errorCount = 0

      try {
        // Perform health check
        const response = await fetch(`${integration.api_endpoint}/health`, {
          method: 'GET',
          timeout: 5000,
          headers: this.getAuthHeaders(integration)
        })

        responseTime = Date.now() - startTime

        if (!response.ok) {
          status = 'degraded'
          errorCount = 1
        }
      } catch (error) {
        status = 'outage'
        errorCount = 1
        responseTime = Date.now() - startTime
      }

      return {
        system_id: integration.id,
        system_name: integration.service_name,
        status,
        availability: status === 'operational' ? 100 : (status === 'degraded' ? 75 : 0),
        response_time: responseTime,
        last_check: new Date().toISOString(),
        error_count: errorCount,
        uptime_percentage: 99.5 // Would be calculated from historical data
      }
    })

    return Promise.all(statusChecks)
  }

  // Private helper methods
  private async loadIntegrations(): Promise<void> {
    const { data, error } = await this.supabase
      .from('service_integrations')
      .select('*')
      .eq('status', 'active')

    if (!error && data) {
      data.forEach(integration => {
        this.integrations.set(integration.provider, integration as ServiceIntegration)
      })
    }
  }

  private async validateIntegration(integration: ServiceIntegration): Promise<void> {
    // Validate required fields
    if (!integration.api_endpoint || !integration.authentication) {
      throw new Error('Invalid integration configuration: missing endpoint or authentication')
    }

    // Validate URL format
    try {
      new URL(integration.api_endpoint)
    } catch {
      throw new Error('Invalid API endpoint URL')
    }
  }

  private async testConnection(integration: ServiceIntegration): Promise<{ success: boolean, error?: string }> {
    try {
      const response = await fetch(`${integration.api_endpoint}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(integration),
        timeout: 10000
      })

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${error}`
      }
    }
  }

  private getAuthHeaders(integration: ServiceIntegration): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ClaimGuardian-NIMS/1.0'
    }

    switch (integration.authentication.type) {
      case 'api_key':
        headers['Authorization'] = `Bearer ${integration.authentication.credentials.api_key}`
        break
      case 'basic_auth':
        const auth = btoa(`${integration.authentication.credentials.username}:${integration.authentication.credentials.password}`)
        headers['Authorization'] = `Basic ${auth}`
        break
      // Additional auth types would be implemented here
    }

    return headers
  }

  private async sendMessage(message: DataExchangeMessage, integration: ServiceIntegration): Promise<void> {
    try {
      const response = await fetch(integration.api_endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(integration),
        body: JSON.stringify(message.payload)
      })

      if (response.ok) {
        message.status = 'delivered'
      } else {
        message.status = 'failed'
        throw new Error(`API error: ${response.statusText}`)
      }
    } catch (error) {
      message.status = 'failed'
      message.delivery_attempts++
      throw error
    } finally {
      message.updated_at = new Date().toISOString()
      
      // Store message
      await this.supabase
        .from('data_exchange_messages')
        .insert(message)
    }
  }

  // ID generators
  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  }

  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }
}

// Default integrations configuration
export const DEFAULT_INTEGRATIONS: Partial<ServiceIntegration>[] = [
  {
    provider: ServiceProvider.NATIONAL_WEATHER_SERVICE,
    service_name: 'National Weather Service API',
    api_endpoint: 'https://api.weather.gov',
    authentication: {
      type: 'api_key',
      credentials: {}
    },
    data_formats: ['CAP', 'JSON'],
    capabilities: [
      {
        capability_type: 'weather_data',
        description: 'Real-time weather data and forecasts',
        input_formats: ['REST'],
        output_formats: ['JSON', 'CAP'],
        real_time: true,
        geographic_coverage: { type: 'national' }
      },
      {
        capability_type: 'alert_distribution',
        description: 'Weather alert distribution via CAP',
        input_formats: ['CAP'],
        output_formats: ['CAP'],
        real_time: true,
        geographic_coverage: { type: 'national' }
      }
    ],
    status: 'active',
    response_time_sla: 5000,
    availability_sla: 99.9,
    contact_info: {
      technical_contact: 'nws-support@noaa.gov',
      operational_contact: 'operations@weather.gov',
      emergency_contact: '24/7 Operations Center'
    }
  },
  {
    provider: ServiceProvider.FEMA,
    service_name: 'FEMA Emergency Management Systems',
    api_endpoint: 'https://www.fema.gov/api/emergency',
    authentication: {
      type: 'certificate',
      credentials: {}
    },
    data_formats: ['EDXL', 'JSON'],
    capabilities: [
      {
        capability_type: 'resource_sharing',
        description: 'Federal resource request and sharing',
        input_formats: ['EDXL-RM'],
        output_formats: ['EDXL-RM', 'JSON'],
        real_time: false,
        geographic_coverage: { type: 'national' }
      }
    ],
    status: 'inactive', // Would require proper certification
    response_time_sla: 30000,
    availability_sla: 99.5,
    contact_info: {
      technical_contact: 'fema-it@fema.dhs.gov',
      operational_contact: 'operations@fema.dhs.gov',
      emergency_contact: 'FEMA Operations Center'
    }
  }
]

export const emergencyServicesIntegration = new EmergencyServicesIntegration()