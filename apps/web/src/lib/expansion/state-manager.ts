/**
 * @fileMetadata
 * @purpose "Multi-state expansion architecture for ClaimGuardian nationwide rollout"
 * @dependencies ["@/lib"]
 * @owner expansion-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/server'

export interface StateConfiguration {
  stateCode: string
  stateName: string
  isActive: boolean
  
  // Legal and regulatory configuration
  insuranceRegulations: {
    requiresLicense: boolean
    regulatoryBody: string
    complianceRequirements: string[]
    fillingDeadlines: Record<string, number> // days
  }
  
  // Data sources and integrations
  dataSources: {
    parcelData: {
      provider: string
      apiEndpoint?: string
      updateFrequency: 'daily' | 'weekly' | 'monthly'
      dataFormat: 'api' | 'ftp' | 'manual'
      cost: number // per record or monthly
    }
    courthouseData: {
      available: boolean
      provider?: string
      integrationMethod: 'api' | 'scraping' | 'manual'
    }
    weatherData: {
      provider: 'noaa' | 'weatherapi' | 'accuweather'
      regionCode: string
    }
  }
  
  // Insurance market characteristics
  marketData: {
    majorCarriers: string[]
    averagePremium: number
    marketPenetration: number
    catastropheRisk: string[] // hurricane, tornado, earthquake, flood, wildfire
    seasonalPatterns: Record<string, number> // month -> claim volume multiplier
  }
  
  // Operational configuration
  operations: {
    timezone: string
    businessHours: {
      start: string // HH:mm
      end: string   // HH:mm
      timezone: string
    }
    supportLanguages: string[]
    localOffice?: {
      address: string
      phone: string
      email: string
    }
  }
  
  // Feature flags and customizations
  features: {
    enabledFeatures: string[]
    disabledFeatures: string[]
    customizations: Record<string, any>
  }
  
  // Deployment configuration
  deployment: {
    status: 'planning' | 'development' | 'testing' | 'staging' | 'production'
    launchDate?: Date
    migrationComplete: boolean
    dataLoadStatus: {
      parcels: 'pending' | 'loading' | 'complete'
      historical: 'pending' | 'loading' | 'complete'
      integrations: 'pending' | 'testing' | 'complete'
    }
  }
  
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    lastModifiedBy: string
    notes?: string
  }
}

export interface StateExpansionPlan {
  phase: number
  states: string[]
  timeline: {
    start: Date
    end: Date
    milestones: Array<{
      name: string
      date: Date
      dependencies: string[]
      status: 'pending' | 'in_progress' | 'completed' | 'blocked'
    }>
  }
  resources: {
    engineeringEffort: number // person-weeks
    dataAcquisitionCost: number
    complianceCost: number
    operationalCost: number
  }
  risks: Array<{
    risk: string
    impact: 'low' | 'medium' | 'high'
    probability: 'low' | 'medium' | 'high'
    mitigation: string
  }>
}

class StateExpansionManager {
  private supabase: unknown
  private configCache = new Map<string, StateConfiguration>()
  private cacheExpiry = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase(): Promise<void> {
    this.supabase = await createClient()
  }

  /**
   * Get configuration for a specific state
   */
  async getStateConfiguration(stateCode: string): Promise<StateConfiguration | null> {
    // Check cache first
    const cacheKey = `state_${stateCode}`
    const cached = this.configCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('state_configurations')
        .select('*')
        .eq('state_code', stateCode.toUpperCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found
          return null
        }
        throw error
      }

      const config = this.parseStateConfiguration(data)
      
      // Cache the result
      this.configCache.set(cacheKey, config)
      setTimeout(() => this.configCache.delete(cacheKey), this.cacheExpiry)

      return config
    } catch (error) {
      console.error(`Failed to get state configuration for ${stateCode}:`, error)
      return null
    }
  }

  /**
   * Get all active states
   */
  async getActiveStates(): Promise<StateConfiguration[]> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('state_configurations')
        .select('*')
        .eq('is_active', true)
        .order('state_name')

      if (error) throw error

      return (data || []).map(this.parseStateConfiguration)
    } catch (error) {
      console.error('Failed to get active states:', error)
      return []
    }
  }

  /**
   * Get states by deployment status
   */
  async getStatesByStatus(status: StateConfiguration['deployment']['status']): Promise<StateConfiguration[]> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('state_configurations')
        .select('*')
        .eq('deployment_status', status)
        .order('state_name')

      if (error) throw error

      return (data || []).map(this.parseStateConfiguration)
    } catch (error) {
      console.error(`Failed to get states with status ${status}:`, error)
      return []
    }
  }

  /**
   * Create or update state configuration
   */
  async updateStateConfiguration(config: StateConfiguration): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const dbRecord = this.serializeStateConfiguration(config)

      const { error } = await this.supabase
        .from('state_configurations')
        .upsert(dbRecord)

      if (error) throw error

      // Clear cache for this state
      this.configCache.delete(`state_${config.stateCode}`)

      return true
    } catch (error) {
      console.error(`Failed to update state configuration for ${config.stateCode}:`, error)
      return false
    }
  }

  /**
   * Initialize a new state for expansion
   */
  async initializeNewState(stateCode: string, stateName: string): Promise<StateConfiguration> {
    const defaultConfig: StateConfiguration = {
      stateCode: stateCode.toUpperCase(),
      stateName,
      isActive: false,
      
      insuranceRegulations: {
        requiresLicense: true,
        regulatoryBody: `${stateName} Department of Insurance`,
        complianceRequirements: [
          'State insurance license',
          'Claims adjuster certification',
          'Data privacy compliance',
          'Consumer protection compliance'
        ],
        fillingDeadlines: {
          initial_notice: 30,
          proof_of_loss: 60,
          supplemental_claim: 90
        }
      },
      
      dataSources: {
        parcelData: {
          provider: 'TBD',
          updateFrequency: 'monthly',
          dataFormat: 'manual',
          cost: 0
        },
        courthouseData: {
          available: false,
          integrationMethod: 'manual'
        },
        weatherData: {
          provider: 'noaa',
          regionCode: stateCode.toLowerCase()
        }
      },
      
      marketData: {
        majorCarriers: [],
        averagePremium: 0,
        marketPenetration: 0,
        catastropheRisk: [],
        seasonalPatterns: {}
      },
      
      operations: {
        timezone: 'America/New_York', // Default, to be updated
        businessHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'America/New_York'
        },
        supportLanguages: ['en'],
        localOffice: undefined
      },
      
      features: {
        enabledFeatures: [
          'basic_claims',
          'damage_analysis',
          'document_management'
        ],
        disabledFeatures: [
          'advanced_analytics',
          'predictive_modeling'
        ],
        customizations: {}
      },
      
      deployment: {
        status: 'planning',
        migrationComplete: false,
        dataLoadStatus: {
          parcels: 'pending',
          historical: 'pending',
          integrations: 'pending'
        }
      },
      
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        notes: `Initial configuration for ${stateName} expansion`
      }
    }

    const success = await this.updateStateConfiguration(defaultConfig)
    if (!success) {
      throw new Error(`Failed to initialize configuration for ${stateName}`)
    }

    return defaultConfig
  }

  /**
   * Get expansion readiness score for a state
   */
  async getExpansionReadiness(stateCode: string): Promise<{
    score: number
    breakdown: Record<string, number>
    blockers: string[]
    recommendations: string[]
  }> {
    const config = await this.getStateConfiguration(stateCode)
    if (!config) {
      return {
        score: 0,
        breakdown: {},
        blockers: ['State configuration not found'],
        recommendations: ['Initialize state configuration']
      }
    }

    const breakdown = {
      regulatory: 0,
      dataSources: 0,
      marketData: 0,
      operations: 0,
      features: 0,
      deployment: 0
    }

    const blockers: string[] = []
    const recommendations: string[] = []

    // Regulatory readiness (0-20 points)
    if (config.insuranceRegulations.regulatoryBody !== 'TBD') breakdown.regulatory += 5
    if (config.insuranceRegulations.complianceRequirements.length > 0) breakdown.regulatory += 5
    if (Object.keys(config.insuranceRegulations.fillingDeadlines).length > 0) breakdown.regulatory += 10
    
    if (breakdown.regulatory < 15) {
      blockers.push('Incomplete regulatory requirements')
      recommendations.push('Complete regulatory compliance analysis')
    }

    // Data sources readiness (0-25 points)
    if (config.dataSources.parcelData.provider !== 'TBD') breakdown.dataSources += 10
    if (config.dataSources.parcelData.apiEndpoint) breakdown.dataSources += 5
    if (config.dataSources.courthouseData.available) breakdown.dataSources += 5
    if (config.dataSources.weatherData.regionCode) breakdown.dataSources += 5

    if (breakdown.dataSources < 15) {
      blockers.push('Data sources not configured')
      recommendations.push('Establish data source integrations')
    }

    // Market data readiness (0-20 points)
    if (config.marketData.majorCarriers.length > 0) breakdown.marketData += 8
    if (config.marketData.averagePremium > 0) breakdown.marketData += 4
    if (config.marketData.catastropheRisk.length > 0) breakdown.marketData += 8

    if (breakdown.marketData < 15) {
      recommendations.push('Complete market analysis')
    }

    // Operations readiness (0-15 points)
    if (config.operations.timezone !== 'America/New_York') breakdown.operations += 5
    if (config.operations.supportLanguages.length > 0) breakdown.operations += 5
    if (config.operations.localOffice) breakdown.operations += 5

    // Features readiness (0-10 points)
    if (config.features.enabledFeatures.length >= 3) breakdown.features += 5
    if (config.features.customizations && Object.keys(config.features.customizations).length > 0) breakdown.features += 5

    // Deployment readiness (0-10 points)
    if (config.deployment.status !== 'planning') breakdown.deployment += 5
    if (config.deployment.dataLoadStatus.parcels === 'complete') breakdown.deployment += 5

    if (config.deployment.status === 'planning') {
      blockers.push('Deployment not started')
    }

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

    return {
      score: totalScore,
      breakdown,
      blockers,
      recommendations
    }
  }

  /**
   * Get expansion plan with phases and timelines
   */
  async getExpansionPlan(): Promise<StateExpansionPlan[]> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('expansion_plans')
        .select('*')
        .order('phase')

      if (error) throw error

      return (data || []).map(this.parseExpansionPlan)
    } catch (error) {
      console.error('Failed to get expansion plan:', error)
      return []
    }
  }

  /**
   * Create default expansion plan for high-priority states
   */
  async createDefaultExpansionPlan(): Promise<StateExpansionPlan[]> {
    const phases: StateExpansionPlan[] = [
      {
        phase: 1,
        states: ['TX', 'CA', 'NY'],
        timeline: {
          start: new Date('2025-03-01'),
          end: new Date('2025-08-31'),
          milestones: [
            {
              name: 'Regulatory approval',
              date: new Date('2025-04-15'),
              dependencies: ['compliance_analysis', 'license_application'],
              status: 'pending'
            },
            {
              name: 'Data integration',
              date: new Date('2025-06-01'),
              dependencies: ['parcel_data_api', 'courthouse_integration'],
              status: 'pending'
            },
            {
              name: 'Pilot launch',
              date: new Date('2025-07-15'),
              dependencies: ['regulatory_approval', 'data_integration', 'staff_training'],
              status: 'pending'
            },
            {
              name: 'Full production',
              date: new Date('2025-08-31'),
              dependencies: ['pilot_validation', 'support_team', 'marketing_launch'],
              status: 'pending'
            }
          ]
        },
        resources: {
          engineeringEffort: 24, // person-weeks
          dataAcquisitionCost: 50000,
          complianceCost: 75000,
          operationalCost: 100000
        },
        risks: [
          {
            risk: 'Regulatory delays in license approval',
            impact: 'high',
            probability: 'medium',
            mitigation: 'Start regulatory process 6 months early, engage regulatory consultants'
          },
          {
            risk: 'Data source integration challenges',
            impact: 'medium',
            probability: 'medium',
            mitigation: 'Develop fallback manual data entry processes'
          }
        ]
      },
      {
        phase: 2,
        states: ['GA', 'NC', 'SC', 'AL', 'LA'],
        timeline: {
          start: new Date('2025-09-01'),
          end: new Date('2026-02-28'),
          milestones: [
            {
              name: 'Regional strategy development',
              date: new Date('2025-10-15'),
              dependencies: ['phase1_lessons_learned'],
              status: 'pending'
            },
            {
              name: 'Bulk state setup',
              date: new Date('2025-12-01'),
              dependencies: ['regional_strategy', 'automation_tools'],
              status: 'pending'
            },
            {
              name: 'Coordinated launch',
              date: new Date('2026-02-01'),
              dependencies: ['bulk_setup', 'regional_marketing'],
              status: 'pending'
            }
          ]
        },
        resources: {
          engineeringEffort: 16,
          dataAcquisitionCost: 80000,
          complianceCost: 60000,
          operationalCost: 150000
        },
        risks: [
          {
            risk: 'Hurricane season operational disruption',
            impact: 'high',
            probability: 'high',
            mitigation: 'Plan launches outside hurricane season, develop disaster response protocols'
          }
        ]
      },
      {
        phase: 3,
        states: ['AZ', 'NV', 'CO', 'UT', 'NM'],
        timeline: {
          start: new Date('2026-03-01'),
          end: new Date('2026-08-31'),
          milestones: [
            {
              name: 'Western region setup',
              date: new Date('2026-05-01'),
              dependencies: ['automation_platform', 'regional_customization'],
              status: 'pending'
            },
            {
              name: 'Multi-state launch',
              date: new Date('2026-08-01'),
              dependencies: ['western_setup', 'operational_scaling'],
              status: 'pending'
            }
          ]
        },
        resources: {
          engineeringEffort: 12,
          dataAcquisitionCost: 60000,
          complianceCost: 45000,
          operationalCost: 120000
        },
        risks: [
          {
            risk: 'Wildfire season impact on claims volume',
            impact: 'medium',
            probability: 'high',
            mitigation: 'Develop wildfire-specific workflows and resource scaling plans'
          }
        ]
      }
    ]

    // Save to database
    for (const plan of phases) {
      await this.saveExpansionPlan(plan)
    }

    return phases
  }

  /**
   * Check if a state is supported
   */
  isStateSupported(stateCode: string): Promise<boolean> {
    return this.getStateConfiguration(stateCode).then(config => 
      config !== null && config.isActive
    )
  }

  /**
   * Get state-specific features
   */
  async getStateFeatures(stateCode: string): Promise<string[]> {
    const config = await this.getStateConfiguration(stateCode)
    return config?.features.enabledFeatures || []
  }

  /**
   * Get business hours for a state
   */
  async getStateBusinessHours(stateCode: string): Promise<StateConfiguration['operations']['businessHours'] | null> {
    const config = await this.getStateConfiguration(stateCode)
    return config?.operations.businessHours || null
  }

  /**
   * Validate state data completeness
   */
  async validateStateData(stateCode: string): Promise<{
    isValid: boolean
    missingFields: string[]
    warnings: string[]
  }> {
    const config = await this.getStateConfiguration(stateCode)
    
    if (!config) {
      return {
        isValid: false,
        missingFields: ['state_configuration'],
        warnings: []
      }
    }

    const missingFields: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (config.dataSources.parcelData.provider === 'TBD') {
      missingFields.push('parcel_data_provider')
    }

    if (config.marketData.majorCarriers.length === 0) {
      warnings.push('No major insurance carriers configured')
    }

    if (config.operations.timezone === 'America/New_York' && !['NY', 'NJ', 'CT', 'MA', 'VT', 'NH', 'ME', 'RI'].includes(config.stateCode)) {
      warnings.push('Timezone may not be correctly set for this state')
    }

    if (config.deployment.status === 'planning') {
      warnings.push('State is still in planning phase')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    }
  }

  // Private helper methods
  private parseStateConfiguration(data: unknown): StateConfiguration {
    return {
      stateCode: data.state_code,
      stateName: data.state_name,
      isActive: data.is_active,
      insuranceRegulations: data.insurance_regulations || {},
      dataSources: data.data_sources || {},
      marketData: data.market_data || {},
      operations: data.operations || {},
      features: data.features || {},
      deployment: {
        status: data.deployment_status || 'planning',
        launchDate: data.launch_date ? new Date(data.launch_date) : undefined,
        migrationComplete: data.migration_complete || false,
        dataLoadStatus: data.data_load_status || {}
      },
      metadata: {
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        lastModifiedBy: data.last_modified_by,
        notes: data.notes
      }
    }
  }

  private serializeStateConfiguration(config: StateConfiguration): unknown {
    return {
      state_code: config.stateCode,
      state_name: config.stateName,
      is_active: config.isActive,
      insurance_regulations: config.insuranceRegulations,
      data_sources: config.dataSources,
      market_data: config.marketData,
      operations: config.operations,
      features: config.features,
      deployment_status: config.deployment.status,
      launch_date: config.deployment.launchDate?.toISOString(),
      migration_complete: config.deployment.migrationComplete,
      data_load_status: config.deployment.dataLoadStatus,
      created_at: config.metadata.createdAt.toISOString(),
      updated_at: config.metadata.updatedAt.toISOString(),
      created_by: config.metadata.createdBy,
      last_modified_by: config.metadata.lastModifiedBy,
      notes: config.metadata.notes
    }
  }

  private parseExpansionPlan(data: unknown): StateExpansionPlan {
    return {
      phase: data.phase,
      states: data.states || [],
      timeline: {
        start: new Date(data.timeline_start),
        end: new Date(data.timeline_end),
        milestones: data.milestones || []
      },
      resources: data.resources || {},
      risks: data.risks || []
    }
  }

  private async saveExpansionPlan(plan: StateExpansionPlan): Promise<void> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase
        .from('expansion_plans')
        .upsert({
          phase: plan.phase,
          states: plan.states,
          timeline_start: plan.timeline.start.toISOString(),
          timeline_end: plan.timeline.end.toISOString(),
          milestones: plan.timeline.milestones,
          resources: plan.resources,
          risks: plan.risks
        })

      if (error) throw error
    } catch (error) {
      console.error(`Failed to save expansion plan for phase ${plan.phase}:`, error)
    }
  }
}

// Export singleton instance
export const stateExpansionManager = new StateExpansionManager()

export type {
  StateConfiguration,
  StateExpansionPlan
}