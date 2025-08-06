/**
 * @fileMetadata
 * @purpose "NIMS resource typing and categorization system for emergency management"
 * @dependencies ["@/lib/supabase", "@/lib/nims/ics-integration"]
 * @owner emergency-management-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'
import { NIMSResource } from './ics-integration'

// NIMS Resource Categories (standardized)
export enum ResourceCategory {
  PERSONNEL = 'personnel',
  TEAMS = 'teams', 
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  FACILITIES = 'facilities'
}

// NIMS Resource Kinds (within categories)
export enum ResourceKind {
  // Personnel
  SINGLE_RESOURCE = 'single_resource',
  CREW = 'crew',
  TEAM = 'team',
  
  // Equipment  
  TRANSPORT = 'transport',
  SUPPORT = 'support',
  OPERATIONAL = 'operational',
  
  // Supplies
  CONSUMABLES = 'consumables',
  DURABLE_GOODS = 'durable_goods',
  
  // Facilities
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  MOBILE = 'mobile'
}

// NIMS Resource Types (specific classifications)
export interface ResourceType {
  category: ResourceCategory
  kind: ResourceKind
  type: string
  minimum_capabilities: string[]
  training_requirements: string[]
  certification_requirements: string[]
  equipment_requirements: string[]
  staffing_requirements?: {
    minimum: number
    maximum: number
    positions: string[]
  }
  performance_metrics: {
    metric: string
    minimum_standard: string
    measurement_method: string
  }[]
}

// Standard NIMS Resource Types
export const NIMS_RESOURCE_TYPES: Record<string, ResourceType> = {
  // Personnel Types
  INCIDENT_COMMANDER_TYPE_4: {
    category: ResourceCategory.PERSONNEL,
    kind: ResourceKind.SINGLE_RESOURCE,
    type: 'Incident Commander - Type 4',
    minimum_capabilities: [
      'ICS command and control',
      'Risk assessment and safety',
      'Resource management',
      'Information management'
    ],
    training_requirements: [
      'IS-100.b Introduction to ICS',
      'IS-200.b ICS for Single Resources',
      'IS-700.a NIMS Introduction',
      'IS-800.b National Response Framework',
      'ICS-300 Intermediate ICS',
      'ICS-400 Advanced ICS'
    ],
    certification_requirements: [
      'Position Task Book completion',
      'Performance evaluation',
      'Currency requirements (5 years)'
    ],
    equipment_requirements: [
      'Communication device',
      'Documentation materials',
      'PPE appropriate for incident type'
    ],
    performance_metrics: [
      {
        metric: 'Response time to assignment',
        minimum_standard: 'Within 4 hours',
        measurement_method: 'Time tracking'
      }
    ]
  },

  SAFETY_OFFICER: {
    category: ResourceCategory.PERSONNEL,
    kind: ResourceKind.SINGLE_RESOURCE,
    type: 'Safety Officer',
    minimum_capabilities: [
      'Safety risk assessment',
      'Safety program implementation',
      'Incident safety monitoring',
      'Safety briefing delivery'
    ],
    training_requirements: [
      'IS-100.b Introduction to ICS',
      'IS-200.b ICS for Single Resources', 
      'IS-700.a NIMS Introduction',
      'Safety Officer specific training',
      'OSHA 30-hour certification'
    ],
    certification_requirements: [
      'Position Task Book completion',
      'Safety certification maintenance',
      'Annual recertification'
    ],
    equipment_requirements: [
      'Safety monitoring equipment',
      'Communication device',
      'PPE for all hazard types',
      'Documentation materials'
    ],
    performance_metrics: [
      {
        metric: 'Safety incident reduction',
        minimum_standard: 'Zero preventable incidents',
        measurement_method: 'Incident tracking'
      }
    ]
  },

  // Team Types
  DAMAGE_ASSESSMENT_TEAM: {
    category: ResourceCategory.TEAMS,
    kind: ResourceKind.TEAM,
    type: 'Damage Assessment Team',
    minimum_capabilities: [
      'Structural damage assessment',
      'Infrastructure evaluation',
      'Documentation and reporting',
      'Safety hazard identification'
    ],
    training_requirements: [
      'Damage assessment certification',
      'Building construction knowledge',
      'Safety training',
      'Documentation procedures'
    ],
    certification_requirements: [
      'Professional engineering or architecture license (team leader)',
      'Damage assessment certification',
      'Annual recertification'
    ],
    equipment_requirements: [
      'Assessment forms and tablets',
      'Measuring equipment',
      'Camera equipment',
      'Safety equipment',
      'Communication devices'
    ],
    staffing_requirements: {
      minimum: 2,
      maximum: 4,
      positions: ['Team Leader', 'Inspector', 'Data Recorder', 'Safety Monitor']
    },
    performance_metrics: [
      {
        metric: 'Assessment completion rate',
        minimum_standard: '50 structures per day',
        measurement_method: 'Daily reporting'
      }
    ]
  },

  // Equipment Types
  EMERGENCY_POWER_GENERATOR_20KW: {
    category: ResourceCategory.EQUIPMENT,
    kind: ResourceKind.SUPPORT,
    type: 'Emergency Power Generator - 20kW',
    minimum_capabilities: [
      '20kW continuous power output',
      'Automatic transfer switch capability',
      'Fuel efficiency standards',
      'Weather protection'
    ],
    training_requirements: [
      'Generator operation training',
      'Electrical safety training',
      'Maintenance procedures'
    ],
    certification_requirements: [
      'Annual inspection certification',
      'Emissions compliance',
      'Safety certification'
    ],
    equipment_requirements: [
      'Fuel supply (minimum 24 hours)',
      'Transfer switch',
      'Safety equipment',
      'Operating manuals'
    ],
    performance_metrics: [
      {
        metric: 'Reliability uptime',
        minimum_standard: '95% availability',
        measurement_method: 'Operational logs'
      }
    ]
  },

  // Supply Types
  EMERGENCY_SUPPLY_KIT: {
    category: ResourceCategory.SUPPLIES,
    kind: ResourceKind.CONSUMABLES,
    type: 'Emergency Supply Kit - Individual',
    minimum_capabilities: [
      '72-hour individual sustenance',
      'Basic first aid supplies',
      'Communication capabilities',
      'Shelter materials'
    ],
    training_requirements: [
      'Emergency preparedness training'
    ],
    certification_requirements: [
      'Content verification',
      'Expiration date monitoring'
    ],
    equipment_requirements: [
      'Water (1 gallon per person per day)',
      'Non-perishable food',
      'First aid kit',
      'Flashlight and batteries',
      'Emergency radio',
      'Blankets/sleeping bags'
    ],
    performance_metrics: [
      {
        metric: 'Kit completeness',
        minimum_standard: '100% of required items',
        measurement_method: 'Inventory checklist'
      }
    ]
  },

  // Facility Types
  EMERGENCY_OPERATIONS_CENTER: {
    category: ResourceCategory.FACILITIES,
    kind: ResourceKind.PERMANENT,
    type: 'Emergency Operations Center',
    minimum_capabilities: [
      'Multi-agency coordination space',
      'Communications infrastructure',
      'Information management systems',
      'Backup power systems'
    ],
    training_requirements: [
      'EOC operations training',
      'Equipment operation training',
      'Emergency communications'
    ],
    certification_requirements: [
      'NIMS compliance certification',
      'Communications equipment certification',
      'Building safety certification'
    ],
    equipment_requirements: [
      'Communication systems',
      'Information displays',
      'Computer workstations',
      'Backup power',
      'Conference facilities'
    ],
    performance_metrics: [
      {
        metric: 'Activation readiness',
        minimum_standard: 'Operational within 1 hour',
        measurement_method: 'Activation drills'
      }
    ]
  }
}

// Resource Status Tracking
export enum ResourceStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  OUT_OF_SERVICE = 'out_of_service',
  COMMITTED = 'committed',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  RETURNING = 'returning'
}

// Resource Inventory Management
export interface ResourceInventory {
  id: string
  resource_type: string
  resources: NIMSResource[]
  last_updated: string
  maintained_by: string
  verification_date: string
  next_inventory_date: string
  compliance_status: 'compliant' | 'needs_attention' | 'non_compliant'
  notes: string[]
}

// Resource Request and Deployment
export interface ResourceDeployment {
  id: string
  resource_id: string
  incident_id: string
  deployment_date: string
  expected_return_date: string
  deployment_location: {
    lat: number
    lng: number
    address: string
  }
  mission_assignment: string
  status: ResourceStatus
  check_in_time?: string
  check_out_time?: string
  performance_notes: string[]
  costs: {
    hourly_rate?: number
    daily_rate?: number
    total_cost: number
    cost_share_agreement?: string
  }
}

export class NIMSResourceManager {
  private supabase = createClient()

  /**
   * Register a new resource in the NIMS inventory
   */
  async registerResource(resourceData: Partial<NIMSResource>): Promise<NIMSResource> {
    // Validate against NIMS standards
    await this.validateResourceCompliance(resourceData)

    const resource: NIMSResource = {
      id: this.generateResourceId(),
      name: resourceData.name!,
      type: resourceData.type!,
      category: resourceData.category!,
      capability: resourceData.capability || '',
      status: ResourceStatus.AVAILABLE,
      location: resourceData.location || {
        lat: 0,
        lng: 0,
        address: ''
      },
      qualifications: resourceData.qualifications || [],
      contact: resourceData.contact || {
        primary: '',
        secondary: undefined,
        radio_frequency: undefined
      },
      last_updated: new Date().toISOString(),
      ...resourceData
    }

    const { error } = await this.supabase
      .from('nims_resources')
      .insert(resource)

    if (error) {
      throw new Error(`Failed to register resource: ${error.message}`)
    }

    return resource
  }

  /**
   * Type a resource according to NIMS standards
   */
  async typeResource(resourceId: string, resourceType: string): Promise<void> {
    const nimsType = NIMS_RESOURCE_TYPES[resourceType]
    if (!nimsType) {
      throw new Error(`Invalid NIMS resource type: ${resourceType}`)
    }

    // Verify resource meets minimum capabilities
    const resource = await this.getResource(resourceId)
    const complianceCheck = await this.checkTypeCompliance(resource, nimsType)
    
    if (!complianceCheck.compliant) {
      throw new Error(`Resource does not meet NIMS standards: ${complianceCheck.deficiencies.join(', ')}`)
    }

    // Update resource with official typing
    await this.supabase
      .from('nims_resources')
      .update({
        type: resourceType,
        last_updated: new Date().toISOString()
      })
      .eq('id', resourceId)
  }

  /**
   * Search for available resources by type and location
   */
  async searchResources(criteria: {
    type?: string
    category?: ResourceCategory
    location?: { lat: number, lng: number, radius: number }
    capabilities?: string[]
    status?: ResourceStatus
  }): Promise<NIMSResource[]> {
    let query = this.supabase
      .from('nims_resources')
      .select('*')

    if (criteria.type) {
      query = query.eq('type', criteria.type)
    }

    if (criteria.category) {
      query = query.eq('category', criteria.category)
    }

    if (criteria.status) {
      query = query.eq('status', criteria.status)
    } else {
      query = query.eq('status', ResourceStatus.AVAILABLE)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to search resources: ${error.message}`)
    }

    let resources = data as NIMSResource[]

    // Filter by location radius if specified
    if (criteria.location) {
      resources = resources.filter(resource => {
        const distance = this.calculateDistance(
          criteria.location!.lat,
          criteria.location!.lng,
          resource.location.lat,
          resource.location.lng
        )
        return distance <= criteria.location!.radius
      })
    }

    // Filter by capabilities if specified
    if (criteria.capabilities) {
      resources = resources.filter(resource => {
        const resourceType = NIMS_RESOURCE_TYPES[resource.type]
        if (!resourceType) return false
        
        return criteria.capabilities!.every(capability =>
          resourceType.minimum_capabilities.includes(capability) ||
          resource.qualifications.includes(capability)
        )
      })
    }

    return resources
  }

  /**
   * Deploy resource to incident
   */
  async deployResource(
    resourceId: string,
    incidentId: string,
    deploymentData: Partial<ResourceDeployment>
  ): Promise<ResourceDeployment> {
    const resource = await this.getResource(resourceId)
    
    if (resource.status !== ResourceStatus.AVAILABLE) {
      throw new Error(`Resource ${resourceId} is not available for deployment`)
    }

    const deployment: ResourceDeployment = {
      id: this.generateDeploymentId(),
      resource_id: resourceId,
      incident_id: incidentId,
      deployment_date: new Date().toISOString(),
      expected_return_date: deploymentData.expected_return_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      deployment_location: deploymentData.deployment_location!,
      mission_assignment: deploymentData.mission_assignment || '',
      status: ResourceStatus.ASSIGNED,
      performance_notes: [],
      costs: deploymentData.costs || { total_cost: 0 },
      ...deploymentData
    }

    // Update resource status
    await this.supabase
      .from('nims_resources')
      .update({ 
        status: ResourceStatus.ASSIGNED,
        last_updated: new Date().toISOString()
      })
      .eq('id', resourceId)

    // Create deployment record
    const { error } = await this.supabase
      .from('resource_deployments')
      .insert(deployment)

    if (error) {
      throw new Error(`Failed to deploy resource: ${error.message}`)
    }

    return deployment
  }

  /**
   * Generate resource inventory report
   */
  async generateInventoryReport(organizationId: string): Promise<ResourceInventory> {
    const { data: resources, error } = await this.supabase
      .from('nims_resources')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to generate inventory: ${error.message}`)
    }

    const inventory: ResourceInventory = {
      id: this.generateInventoryId(),
      resource_type: 'comprehensive',
      resources: resources as NIMSResource[],
      last_updated: new Date().toISOString(),
      maintained_by: organizationId,
      verification_date: new Date().toISOString(),
      next_inventory_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      compliance_status: await this.assessInventoryCompliance(resources as NIMSResource[]),
      notes: []
    }

    return inventory
  }

  /**
   * Validate resource against NIMS compliance standards
   */
  private async validateResourceCompliance(resource: Partial<NIMSResource>): Promise<void> {
    if (!resource.name || !resource.type || !resource.category) {
      throw new Error('Required fields missing: name, type, category')
    }

    const nimsType = NIMS_RESOURCE_TYPES[resource.type]
    if (nimsType) {
      // Check if minimum capabilities are documented
      const hasCapabilities = nimsType.minimum_capabilities.every(capability =>
        resource.qualifications?.includes(capability)
      )

      if (!hasCapabilities) {
        throw new Error(`Resource must demonstrate all minimum capabilities for type: ${resource.type}`)
      }
    }
  }

  /**
   * Check if resource meets NIMS type compliance
   */
  private async checkTypeCompliance(
    resource: NIMSResource,
    nimsType: ResourceType
  ): Promise<{ compliant: boolean, deficiencies: string[] }> {
    const deficiencies: string[] = []

    // Check capabilities
    nimsType.minimum_capabilities.forEach(capability => {
      if (!resource.qualifications.includes(capability)) {
        deficiencies.push(`Missing capability: ${capability}`)
      }
    })

    // Check training requirements (would integrate with training records)
    // This is a simplified check - in practice would verify against training database
    if (nimsType.training_requirements.length > 0 && resource.qualifications.length === 0) {
      deficiencies.push('No training qualifications documented')
    }

    return {
      compliant: deficiencies.length === 0,
      deficiencies
    }
  }

  private async getResource(resourceId: string): Promise<NIMSResource> {
    const { data, error } = await this.supabase
      .from('nims_resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      throw new Error(`Resource not found: ${resourceId}`)
    }

    return data as NIMSResource
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private async assessInventoryCompliance(resources: NIMSResource[]): Promise<'compliant' | 'needs_attention' | 'non_compliant'> {
    const totalResources = resources.length
    const compliantResources = resources.filter(resource => 
      NIMS_RESOURCE_TYPES[resource.type] && 
      resource.qualifications.length > 0
    ).length

    const complianceRate = totalResources > 0 ? compliantResources / totalResources : 0

    if (complianceRate >= 0.9) return 'compliant'
    if (complianceRate >= 0.7) return 'needs_attention'
    return 'non_compliant'
  }

  private generateResourceId(): string {
    return `RES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateDeploymentId(): string {
    return `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateInventoryId(): string {
    return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }
}

export const nimsResourceManager = new NIMSResourceManager()