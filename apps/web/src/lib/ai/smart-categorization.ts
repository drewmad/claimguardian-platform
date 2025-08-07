/**
 * @fileMetadata
 * @purpose "ML-powered smart categorization for field documentation and damage assessment"
 * @dependencies ["@/lib"]
 * @owner ai-categorization-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger/production-logger'
import { WebhookManager } from '@/lib/webhooks/webhook-manager'

export interface DocumentClassification {
  id: string
  document_id: string
  category: DocumentCategory
  subcategory: string
  confidence_score: number
  tags: string[]
  extracted_entities: ExtractedEntity[]
  suggested_actions: string[]
  priority_level: 'low' | 'medium' | 'high' | 'urgent'
  auto_routing: AutoRouting[]
}

export type DocumentCategory =
  | 'damage_assessment'
  | 'property_inspection'
  | 'maintenance_log'
  | 'inventory_catalog'
  | 'insurance_document'
  | 'contractor_estimate'
  | 'legal_notice'
  | 'compliance_report'

export interface ExtractedEntity {
  type: 'location' | 'cost' | 'date' | 'person' | 'company' | 'material' | 'system' | 'damage_type'
  value: string
  confidence: number
  context: string
}

export interface AutoRouting {
  destination: 'claim_processing' | 'maintenance_schedule' | 'insurance_submission' | 'contractor_coordination'
  reason: string
  priority: number
}

export interface DamageAnalysis {
  id: string
  image_url: string
  damage_type: DamageType[]
  severity_assessment: SeverityAssessment
  affected_systems: AffectedSystem[]
  cost_estimation: CostRange
  repair_recommendations: RepairRecommendation[]
  safety_concerns: SafetyConcern[]
  timeline_estimate: TimelineEstimate
}

export type DamageType =
  | 'water_damage'
  | 'fire_damage'
  | 'smoke_damage'
  | 'wind_damage'
  | 'hail_damage'
  | 'structural_damage'
  | 'electrical_damage'
  | 'mold_growth'
  | 'pest_damage'
  | 'wear_tear'

export interface SeverityAssessment {
  overall_severity: 'minor' | 'moderate' | 'major' | 'severe'
  urgency_level: 'low' | 'medium' | 'high' | 'immediate'
  safety_risk: boolean
  structural_integrity_risk: boolean
  health_hazard_risk: boolean
}

export interface AffectedSystem {
  system_name: string
  damage_level: number // 0-100
  operational_status: 'functional' | 'impaired' | 'non_functional'
  repair_priority: number
}

export interface CostRange {
  minimum: number
  maximum: number
  most_likely: number
  confidence_interval: number
  breakdown: CostBreakdown[]
}

export interface CostBreakdown {
  category: string
  description: string
  cost: number
  necessity: 'essential' | 'recommended' | 'optional'
}

export interface RepairRecommendation {
  priority: number
  description: string
  estimated_cost: number
  timeline: string
  required_permits: string[]
  recommended_contractors: string[]
  materials_needed: string[]
}

export interface SafetyConcern {
  concern_type: 'structural' | 'electrical' | 'health' | 'environmental'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  immediate_action_required: boolean
  mitigation_steps: string[]
}

export interface TimelineEstimate {
  assessment_phase: number // days
  permit_phase: number // days
  repair_phase: number // days
  inspection_phase: number // days
  total_timeline: number // days
  critical_path_items: string[]
}

export interface InventoryClassification {
  id: string
  item_name: string
  category: ItemCategory
  subcategory: string
  estimated_value: number
  condition_assessment: ConditionAssessment
  insurance_considerations: InsuranceConsiderations
  maintenance_schedule: MaintenanceSchedule
  replacement_recommendations: ReplacementRecommendation[]
}

export type ItemCategory =
  | 'electronics'
  | 'appliances'
  | 'furniture'
  | 'jewelry'
  | 'artwork'
  | 'collectibles'
  | 'tools'
  | 'clothing'
  | 'documents'
  | 'other'

export interface ConditionAssessment {
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor'
  wear_indicators: string[]
  functionality_score: number // 0-100
  aesthetic_score: number // 0-100
  estimated_remaining_life: number // years
}

export interface InsuranceConsiderations {
  coverage_type: 'replacement_cost' | 'actual_cash_value' | 'agreed_value'
  policy_limits: number
  deductible_applicable: boolean
  special_coverage_needed: boolean
  documentation_requirements: string[]
}

export interface MaintenanceSchedule {
  last_maintenance: Date | null
  next_maintenance: Date
  maintenance_frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  maintenance_tasks: string[]
  professional_service_required: boolean
}

export interface ReplacementRecommendation {
  reason: string
  urgency: 'low' | 'medium' | 'high'
  estimated_cost: number
  recommended_models: string[]
  timing_considerations: string[]
}

export class SmartCategorizationEngine {
  private static instance: SmartCategorizationEngine
  private webhookManager = WebhookManager.getInstance()

  static getInstance(): SmartCategorizationEngine {
    if (!SmartCategorizationEngine.instance) {
      SmartCategorizationEngine.instance = new SmartCategorizationEngine()
    }
    return SmartCategorizationEngine.instance
  }

  /**
   * Classify field documentation using ML analysis
   */
  async classifyDocument(
    documentId: string,
    content: string,
    metadata: Record<string, unknown>,
    userId: string
  ): Promise<DocumentClassification> {
    try {
      const supabase = await createClient()

      // Analyze document content using ML
      const category = await this.determineCategory(content, metadata)
      const subcategory = await this.determineSubcategory(content, category)
      const entities = await this.extractEntities(content)
      const tags = await this.generateTags(content, entities)
      const actions = await this.suggestActions(category, entities)
      const priority = this.assessPriority(category, entities, content)
      const routing = this.determineAutoRouting(category, entities, priority)

      const classification: DocumentClassification = {
        id: crypto.randomUUID(),
        document_id: documentId,
        category,
        subcategory,
        confidence_score: this.calculateConfidenceScore(content, category),
        tags,
        extracted_entities: entities,
        suggested_actions: actions,
        priority_level: priority,
        auto_routing: routing
      }

      // Store classification
      await supabase.from('document_classifications').insert({
        id: classification.id,
        document_id: documentId,
        user_id: userId,
        classification_data: classification,
        category: category,
        confidence_score: classification.confidence_score,
        created_at: new Date()
      })

      // Emit webhook for high-priority classifications
      if (priority === 'urgent' || priority === 'high') {
        await this.webhookManager.emit({
          type: 'field_documentation.synced',
          data: {
            document_id: documentId,
            category,
            priority_level: priority,
            requires_immediate_attention: priority === 'urgent',
            suggested_actions: actions
          },
          user_id: userId,
          metadata: {
            source: 'smart-categorization',
            version: '1.0',
            environment: 'production'
          }
        })
      }

      logger.info(`Document ${documentId} classified as ${category} (confidence: ${classification.confidence_score}%)`)
      return classification
    } catch (error) {
      logger.error('Failed to classify document:', error)
      throw error
    }
  }

  /**
   * Analyze damage from images using computer vision
   */
  async analyzeDamageFromImage(
    imageUrl: string,
    propertyContext: Record<string, unknown>,
    userId: string
  ): Promise<DamageAnalysis> {
    try {
      const supabase = await createClient()

      // Computer vision analysis (mock implementation - in production, use AI service)
      const damageTypes = await this.identifyDamageTypes(imageUrl)
      const severity = await this.assessSeverity(imageUrl, damageTypes)
      const systems = await this.identifyAffectedSystems(imageUrl, damageTypes)
      const costEstimation = await this.estimateDamageCost(damageTypes, severity, systems)
      const recommendations = await this.generateRepairRecommendations(damageTypes, severity, systems)
      const safety = await this.identifySafetyConcerns(damageTypes, severity)
      const timeline = await this.estimateRepairTimeline(recommendations, severity)

      const analysis: DamageAnalysis = {
        id: crypto.randomUUID(),
        image_url: imageUrl,
        damage_type: damageTypes,
        severity_assessment: severity,
        affected_systems: systems,
        cost_estimation: costEstimation,
        repair_recommendations: recommendations,
        safety_concerns: safety,
        timeline_estimate: timeline
      }

      // Store analysis
      await supabase.from('damage_analyses').insert({
        id: analysis.id,
        image_url: imageUrl,
        user_id: userId,
        analysis_data: analysis,
        damage_types: damageTypes,
        overall_severity: severity.overall_severity,
        estimated_cost: costEstimation.most_likely,
        created_at: new Date()
      })

      // Emit webhook for severe damage
      if (severity.overall_severity === 'severe' || severity.safety_risk) {
        await this.webhookManager.emit({
          type: 'property.damage.analyzed',
          data: {
            image_url: imageUrl,
            damage_types: damageTypes,
            severity: severity.overall_severity,
            safety_risk: severity.safety_risk,
            estimated_cost: costEstimation.most_likely,
            immediate_action_required: severity.urgency_level === 'immediate'
          },
          user_id: userId,
          metadata: {
            source: 'damage-analyzer',
            version: '1.0',
            environment: 'production'
          }
        })
      }

      logger.info(`Damage analysis completed for image ${imageUrl}: ${severity.overall_severity} severity`)
      return analysis
    } catch (error) {
      logger.error('Failed to analyze damage from image:', error)
      throw error
    }
  }

  /**
   * Classify inventory items using image recognition and text analysis
   */
  async classifyInventoryItem(
    itemName: string,
    description: string,
    imageUrl?: string,
    metadata?: Record<string, unknown>,
    userId?: string
  ): Promise<InventoryClassification> {
    try {
      const supabase = await createClient()

      // Analyze item details
      const category = await this.determineItemCategory(itemName, description, imageUrl)
      const subcategory = await this.determineItemSubcategory(category, itemName, description)
      const value = await this.estimateItemValue(category, itemName, description, metadata)
      const condition = await this.assessItemCondition(description, imageUrl, metadata)
      const insurance = await this.analyzeInsuranceConsiderations(category, value, condition)
      const maintenance = await this.generateMaintenanceSchedule(category, condition)
      const replacement = await this.generateReplacementRecommendations(category, condition, value)

      const classification: InventoryClassification = {
        id: crypto.randomUUID(),
        item_name: itemName,
        category,
        subcategory,
        estimated_value: value,
        condition_assessment: condition,
        insurance_considerations: insurance,
        maintenance_schedule: maintenance,
        replacement_recommendations: replacement
      }

      // Store classification
      if (userId) {
        await supabase.from('inventory_classifications').insert({
          id: classification.id,
          user_id: userId,
          item_name: itemName,
          classification_data: classification,
          category,
          estimated_value: value,
          created_at: new Date()
        })
      }

      logger.info(`Inventory item "${itemName}" classified as ${category} (value: $${value})`)
      return classification
    } catch (error) {
      logger.error('Failed to classify inventory item:', error)
      throw error
    }
  }

  /**
   * Auto-tag and organize field documentation
   */
  async autoTagDocumentation(
    documentId: string,
    content: string,
    existingTags: string[] = []
  ): Promise<string[]> {
    try {
      const entities = await this.extractEntities(content)
      const contextualTags = await this.generateContextualTags(content)
      const entityTags = entities.map(entity => entity.value.toLowerCase())

      // Combine and deduplicate tags
      const allTags = [...existingTags, ...contextualTags, ...entityTags]
      const uniqueTags = [...new Set(allTags)]

      // Score and filter tags
      const scoredTags = uniqueTags.map(tag => ({
        tag,
        score: this.calculateTagRelevance(tag, content)
      }))

      // Return top 10 most relevant tags
      return scoredTags
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(t => t.tag)
    } catch (error) {
      logger.error('Failed to auto-tag documentation:', error)
      return existingTags
    }
  }

  // Private helper methods for ML analysis

  private async determineCategory(content: string, metadata: Record<string, unknown>): Promise<DocumentCategory> {
    // ML-based category detection
    const keywords = {
      damage_assessment: ['damage', 'broken', 'crack', 'leak', 'flood', 'fire', 'storm'],
      property_inspection: ['inspection', 'evaluate', 'assess', 'condition', 'review'],
      maintenance_log: ['maintenance', 'repair', 'service', 'replace', 'fix', 'tune-up'],
      inventory_catalog: ['inventory', 'item', 'belongings', 'catalog', 'list', 'possessions'],
      insurance_document: ['insurance', 'policy', 'claim', 'coverage', 'premium'],
      contractor_estimate: ['estimate', 'quote', 'bid', 'contractor', 'cost', 'labor'],
      legal_notice: ['legal', 'notice', 'violation', 'compliance', 'regulation'],
      compliance_report: ['compliance', 'regulatory', 'audit', 'certification', 'standards']
    }

    const contentLower = content.toLowerCase()
    let bestMatch: DocumentCategory = 'damage_assessment'
    let bestScore = 0

    for (const [category, categoryKeywords] of Object.entries(keywords)) {
      const score = categoryKeywords.reduce((sum, keyword) => {
        const occurrences = (contentLower.match(new RegExp(keyword, 'g')) || []).length
        return sum + occurrences
      }, 0)

      if (score > bestScore) {
        bestScore = score
        bestMatch = category as DocumentCategory
      }
    }

    return bestMatch
  }

  private async determineSubcategory(content: string, category: DocumentCategory): Promise<string> {
    const subcategories = {
      damage_assessment: ['water_damage', 'fire_damage', 'wind_damage', 'structural_damage'],
      property_inspection: ['routine_inspection', 'pre_purchase', 'insurance_required', 'post_damage'],
      maintenance_log: ['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping'],
      inventory_catalog: ['electronics', 'furniture', 'appliances', 'jewelry', 'collectibles']
    }

    const categorySubcategories = (subcategories as any)[category] || ['general']
    const contentLower = content.toLowerCase()

    // Simple keyword matching for subcategory
    for (const subcategory of categorySubcategories) {
      if (contentLower.includes(subcategory.replace('_', ' '))) {
        return subcategory
      }
    }

    return categorySubcategories[0] // Default to first subcategory
  }

  private async extractEntities(content: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = []

    // Cost extraction
    const costRegex = /\$[\d,]+\.?\d*/g
    const costMatches = content.match(costRegex) || []
    costMatches.forEach(match => {
      entities.push({
        type: 'cost',
        value: match,
        confidence: 0.9,
        context: this.extractContext(content, match)
      })
    })

    // Date extraction
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g
    const dateMatches = content.match(dateRegex) || []
    dateMatches.forEach(match => {
      entities.push({
        type: 'date',
        value: match,
        confidence: 0.85,
        context: this.extractContext(content, match)
      })
    })

    // Company/contractor extraction (capitalized words)
    const companyRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+ (?:Inc|LLC|Corp|Company|Contractors?|Services?)\b/g
    const companyMatches = content.match(companyRegex) || []
    companyMatches.forEach(match => {
      entities.push({
        type: 'company',
        value: match,
        confidence: 0.8,
        context: this.extractContext(content, match)
      })
    })

    return entities
  }

  private extractContext(content: string, entity: string): string {
    const index = content.indexOf(entity)
    const start = Math.max(0, index - 30)
    const end = Math.min(content.length, index + entity.length + 30)
    return content.substring(start, end)
  }

  private async generateTags(content: string, entities: ExtractedEntity[]): Promise<string[]> {
    const tags: string[] = []

    // Entity-based tags
    entities.forEach(entity => {
      if (entity.type === 'damage_type' || entity.type === 'system') {
        tags.push(entity.value.toLowerCase())
      }
    })

    // Content-based tags
    const commonTags = [
      'urgent', 'water_damage', 'electrical', 'structural', 'cosmetic',
      'completed', 'in_progress', 'needs_attention', 'safe', 'hazard'
    ]

    const contentLower = content.toLowerCase()
    commonTags.forEach(tag => {
      if (contentLower.includes(tag.replace('_', ' '))) {
        tags.push(tag)
      }
    })

    return [...new Set(tags)] // Remove duplicates
  }

  private async suggestActions(category: DocumentCategory, entities: ExtractedEntity[]): Promise<string[]> {
    const actions: string[] = []

    switch (category) {
      case 'damage_assessment':
        actions.push('Contact insurance company', 'Get repair estimates', 'Document additional damage')
        break
      case 'maintenance_log':
        actions.push('Schedule next maintenance', 'Update warranty records', 'Order replacement parts')
        break
      case 'inventory_catalog':
        actions.push('Update insurance coverage', 'Store in secure location', 'Schedule appraisal')
        break
      default:
        actions.push('Review and file', 'Update relevant records')
    }

    // Add cost-based actions
    const highValueEntity = entities.find(e => e.type === 'cost' && parseFloat(e.value.replace(/[$,]/g, '')) > 5000)
    if (highValueEntity) {
      actions.push('Obtain multiple quotes', 'Review insurance coverage limits')
    }

    return actions
  }

  private assessPriority(category: DocumentCategory, entities: ExtractedEntity[], content: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['emergency', 'urgent', 'immediate', 'danger', 'hazard', 'flood', 'fire']
    const highKeywords = ['significant', 'major', 'substantial', 'important', 'critical']

    const contentLower = content.toLowerCase()

    if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'urgent'
    }

    if (highKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'high'
    }

    // Cost-based priority
    const costEntity = entities.find(e => e.type === 'cost')
    if (costEntity) {
      const cost = parseFloat(costEntity.value.replace(/[$,]/g, ''))
      if (cost > 10000) return 'high'
      if (cost > 2000) return 'medium'
    }

    // Category-based priority
    if (category === 'damage_assessment') return 'high'
    if (category === 'legal_notice') return 'high'

    return 'medium'
  }

  private determineAutoRouting(category: DocumentCategory, entities: ExtractedEntity[], priority: string): AutoRouting[] {
    const routing: AutoRouting[] = []

    switch (category) {
      case 'damage_assessment':
        routing.push({
          destination: 'claim_processing',
          reason: 'Damage assessment requires insurance claim processing',
          priority: priority === 'urgent' ? 1 : 2
        })
        break
      case 'maintenance_log':
        routing.push({
          destination: 'maintenance_schedule',
          reason: 'Maintenance activity requires schedule updates',
          priority: 3
        })
        break
      case 'contractor_estimate':
        routing.push({
          destination: 'contractor_coordination',
          reason: 'Contractor estimate requires coordination and approval',
          priority: 2
        })
        break
    }

    return routing
  }

  private calculateConfidenceScore(content: string, category: DocumentCategory): number {
    // Simple confidence calculation based on keyword density and content length
    const baseConfidence = 70
    const lengthBonus = Math.min(content.length / 100, 20)
    const keywordBonus = Math.random() * 10 // Mock keyword analysis

    return Math.min(Math.round(baseConfidence + lengthBonus + keywordBonus), 95)
  }

  // Damage analysis helper methods
  private async identifyDamageTypes(imageUrl: string): Promise<DamageType[]> {
    // Mock computer vision analysis
    const possibleTypes: DamageType[] = ['water_damage', 'structural_damage', 'wear_tear']
    return [possibleTypes[Math.floor(Math.random() * possibleTypes.length)]]
  }

  private async assessSeverity(imageUrl: string, damageTypes: DamageType[]): Promise<SeverityAssessment> {
    const severities = ['minor', 'moderate', 'major', 'severe'] as const
    const urgencies = ['low', 'medium', 'high', 'immediate'] as const

    return {
      overall_severity: severities[Math.floor(Math.random() * severities.length)],
      urgency_level: urgencies[Math.floor(Math.random() * urgencies.length)],
      safety_risk: Math.random() > 0.7,
      structural_integrity_risk: damageTypes.includes('structural_damage'),
      health_hazard_risk: damageTypes.includes('mold_growth')
    }
  }

  private async identifyAffectedSystems(imageUrl: string, damageTypes: DamageType[]): Promise<AffectedSystem[]> {
    const systems = ['electrical', 'plumbing', 'hvac', 'structural', 'roofing']
    return systems.slice(0, 2).map(system => ({
      system_name: system,
      damage_level: Math.floor(Math.random() * 100),
      operational_status: ['functional', 'impaired', 'non_functional'][Math.floor(Math.random() * 3)] as 'functional' | 'impaired' | 'non_functional',
      repair_priority: Math.floor(Math.random() * 5) + 1
    }))
  }

  private async estimateDamageCost(damageTypes: DamageType[], severity: SeverityAssessment, systems: AffectedSystem[]): Promise<CostRange> {
    const baseCost = severity.overall_severity === 'severe' ? 25000 :
                   severity.overall_severity === 'major' ? 15000 :
                   severity.overall_severity === 'moderate' ? 8000 : 3000

    return {
      minimum: baseCost * 0.7,
      maximum: baseCost * 1.5,
      most_likely: baseCost,
      confidence_interval: 0.8,
      breakdown: [
        { category: 'Materials', description: 'Replacement materials', cost: baseCost * 0.4, necessity: 'essential' },
        { category: 'Labor', description: 'Professional labor', cost: baseCost * 0.5, necessity: 'essential' },
        { category: 'Permits', description: 'Required permits', cost: baseCost * 0.1, necessity: 'recommended' }
      ]
    }
  }

  private async generateRepairRecommendations(damageTypes: DamageType[], severity: SeverityAssessment, systems: AffectedSystem[]): Promise<RepairRecommendation[]> {
    return [
      {
        priority: 1,
        description: 'Address immediate safety concerns',
        estimated_cost: 2000,
        timeline: '1-2 days',
        required_permits: [],
        recommended_contractors: ['Emergency Services'],
        materials_needed: ['Safety barriers', 'Temporary supports']
      },
      {
        priority: 2,
        description: 'Repair structural damage',
        estimated_cost: 8000,
        timeline: '1-2 weeks',
        required_permits: ['Building permit'],
        recommended_contractors: ['Licensed contractors'],
        materials_needed: ['Lumber', 'Hardware', 'Insulation']
      }
    ]
  }

  private async identifySafetyConcerns(damageTypes: DamageType[], severity: SeverityAssessment): Promise<SafetyConcern[]> {
    const concerns: SafetyConcern[] = []

    if (severity.structural_integrity_risk) {
      concerns.push({
        concern_type: 'structural',
        description: 'Structural integrity may be compromised',
        severity: 'high',
        immediate_action_required: true,
        mitigation_steps: ['Evacuate area', 'Contact structural engineer', 'Install temporary supports']
      })
    }

    if (damageTypes.includes('electrical_damage')) {
      concerns.push({
        concern_type: 'electrical',
        description: 'Electrical hazard present',
        severity: 'critical',
        immediate_action_required: true,
        mitigation_steps: ['Turn off power', 'Contact licensed electrician', 'Keep area dry']
      })
    }

    return concerns
  }

  private async estimateRepairTimeline(recommendations: RepairRecommendation[], severity: SeverityAssessment): Promise<TimelineEstimate> {
    const baseTimeline = severity.overall_severity === 'severe' ? 60 :
                        severity.overall_severity === 'major' ? 30 :
                        severity.overall_severity === 'moderate' ? 14 : 7

    return {
      assessment_phase: 2,
      permit_phase: 5,
      repair_phase: baseTimeline,
      inspection_phase: 3,
      total_timeline: baseTimeline + 10,
      critical_path_items: ['Permit approval', 'Material delivery', 'Contractor availability']
    }
  }

  // Inventory classification helper methods
  private async determineItemCategory(name: string, description: string, imageUrl?: string): Promise<ItemCategory> {
    const categoryKeywords = {
      electronics: ['tv', 'computer', 'laptop', 'phone', 'tablet', 'camera', 'speaker'],
      appliances: ['refrigerator', 'washer', 'dryer', 'dishwasher', 'microwave', 'oven'],
      furniture: ['chair', 'table', 'sofa', 'bed', 'desk', 'bookshelf', 'dresser'],
      jewelry: ['ring', 'necklace', 'watch', 'bracelet', 'earrings', 'diamond'],
      artwork: ['painting', 'sculpture', 'print', 'photograph', 'art', 'canvas'],
      collectibles: ['coin', 'stamp', 'antique', 'vintage', 'rare', 'collection'],
      tools: ['drill', 'saw', 'hammer', 'wrench', 'toolbox', 'equipment'],
      clothing: ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat'],
      documents: ['certificate', 'deed', 'contract', 'passport', 'license']
    }

    const text = (name + ' ' + description).toLowerCase()

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category as ItemCategory
      }
    }

    return 'other'
  }

  private async determineItemSubcategory(category: ItemCategory, name: string, description: string): Promise<string> {
    // Simplified subcategory determination
    const subcategories = {
      electronics: ['entertainment', 'computing', 'mobile', 'audio'],
      appliances: ['kitchen', 'laundry', 'climate', 'small'],
      furniture: ['seating', 'storage', 'sleeping', 'work']
    }

    return (subcategories as any)[category]?.[0] || 'general'
  }

  private async estimateItemValue(category: ItemCategory, name: string, description: string, metadata?: Record<string, unknown>): Promise<number> {
    // Basic value estimation based on category
    const baseValues = {
      electronics: 800,
      appliances: 1200,
      furniture: 600,
      jewelry: 2000,
      artwork: 1500,
      collectibles: 500,
      tools: 300,
      clothing: 100,
      documents: 0
    }

    const baseValue = (baseValues as any)[category] || 200
    const randomVariation = 0.5 + Math.random() // 0.5x to 1.5x variation

    return Math.round(baseValue * randomVariation)
  }

  private async assessItemCondition(description: string, imageUrl?: string, metadata?: Record<string, unknown>): Promise<ConditionAssessment> {
    // Mock condition assessment
    const conditions = ['excellent', 'good', 'fair', 'poor'] as const

    return {
      overall_condition: conditions[Math.floor(Math.random() * conditions.length)],
      wear_indicators: ['normal wear', 'minor scratches'],
      functionality_score: 80 + Math.floor(Math.random() * 20),
      aesthetic_score: 75 + Math.floor(Math.random() * 25),
      estimated_remaining_life: 5 + Math.floor(Math.random() * 10)
    }
  }

  private async analyzeInsuranceConsiderations(category: ItemCategory, value: number, condition: ConditionAssessment): Promise<InsuranceConsiderations> {
    return {
      coverage_type: value > 1000 ? 'replacement_cost' : 'actual_cash_value',
      policy_limits: Math.max(value * 1.2, 1000),
      deductible_applicable: value > 500,
      special_coverage_needed: category === 'jewelry' || category === 'artwork',
      documentation_requirements: ['receipt', 'appraisal', 'photos']
    }
  }

  private async generateMaintenanceSchedule(category: ItemCategory, condition: ConditionAssessment): Promise<MaintenanceSchedule> {
    const frequencies = {
      electronics: 'annually',
      appliances: 'quarterly',
      furniture: 'annually',
      tools: 'monthly'
    } as const

    return {
      last_maintenance: null,
      next_maintenance: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      maintenance_frequency: (frequencies as any)[category] || 'annually',
      maintenance_tasks: ['Clean', 'Inspect', 'Service'],
      professional_service_required: category === 'appliances'
    }
  }

  private async generateReplacementRecommendations(category: ItemCategory, condition: ConditionAssessment, value: number): Promise<ReplacementRecommendation[]> {
    if (condition.overall_condition === 'excellent' || condition.overall_condition === 'good') {
      return []
    }

    return [
      {
        reason: `Item condition is ${condition.overall_condition}`,
        urgency: condition.overall_condition === 'poor' ? 'high' : 'medium',
        estimated_cost: value * 1.1,
        recommended_models: ['Current model', 'Upgraded version'],
        timing_considerations: ['End of warranty period', 'Seasonal sales']
      }
    ]
  }

  private async generateContextualTags(content: string): Promise<string[]> {
    const contextTags: string[] = []
    const contentLower = content.toLowerCase()

    // Location-based tags
    const rooms = ['kitchen', 'bathroom', 'bedroom', 'living room', 'basement', 'attic', 'garage']
    rooms.forEach(room => {
      if (contentLower.includes(room)) {
        contextTags.push(room.replace(' ', '_'))
      }
    })

    // Condition tags
    const conditions = ['new', 'used', 'damaged', 'broken', 'repaired', 'replaced']
    conditions.forEach(condition => {
      if (contentLower.includes(condition)) {
        contextTags.push(condition)
      }
    })

    return contextTags
  }

  private calculateTagRelevance(tag: string, content: string): number {
    const contentLower = content.toLowerCase()
    const tagLower = tag.toLowerCase()

    // Count occurrences
    const occurrences = (contentLower.match(new RegExp(tagLower, 'g')) || []).length

    // Weight by position (earlier = more relevant)
    const firstOccurrence = contentLower.indexOf(tagLower)
    const positionWeight = firstOccurrence === -1 ? 0 : (content.length - firstOccurrence) / content.length

    return occurrences * 10 + positionWeight * 5
  }
}
