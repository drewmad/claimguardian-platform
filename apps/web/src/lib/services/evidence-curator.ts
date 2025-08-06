/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Curator - Smart evidence categorization and gap detection"
 * @dependencies ["@supabase/supabase-js", "date-fns", "openai"]
 * @status stable
 * @ai-integration openai
 * @insurance-context evidence-management
 */

import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface EvidenceItem {
  id: string
  claim_id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  category: EvidenceCategory
  subcategory: string
  quality_score: number  // 0-100
  completeness_score: number  // 0-100
  relevance_score: number  // 0-100
  ai_tags: string[]
  ai_description: string
  ai_analysis: string
  detected_elements: DetectedElement[]
  metadata: Record<string, any>
  upload_date: string
  status: 'pending' | 'processing' | 'analyzed' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface DetectedElement {
  type: 'damage' | 'property_info' | 'date' | 'person' | 'document' | 'location' | 'cost'
  value: string
  confidence: number
  coordinates?: { x: number; y: number; width: number; height: number }
  description: string
}

export interface EvidenceGap {
  category: EvidenceCategory
  gap_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact_on_claim: string
  suggested_actions: string[]
  priority: number
  estimated_value_impact: number  // dollar impact
}

export interface EvidenceWorkflow {
  id: string
  claim_id: string
  user_id: string
  workflow_name: string
  steps: WorkflowStep[]
  current_step: number
  status: 'not_started' | 'in_progress' | 'completed' | 'paused'
  completion_percentage: number
  estimated_completion_date: string
  auto_suggestions: string[]
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  step_name: string
  description: string
  category: EvidenceCategory
  required_evidence: string[]
  optional_evidence: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ai_guidance: string
  estimated_time: number  // minutes
  priority: number
}

export type EvidenceCategory = 
  | 'damage_photos'
  | 'property_photos' 
  | 'receipts_invoices'
  | 'estimates_quotes'
  | 'insurance_documents'
  | 'legal_documents'
  | 'weather_reports'
  | 'witness_statements'
  | 'expert_reports'
  | 'repair_documentation'
  | 'inventory_lists'
  | 'medical_records'

export interface EvidenceAnalytics {
  total_items: number
  by_category: Record<EvidenceCategory, number>
  average_quality_score: number
  completion_percentage: number
  critical_gaps: number
  workflow_completion_rate: number
  processing_time_avg: number  // minutes
  ai_accuracy_rate: number
}

export class EvidenceCuratorService {
  private supabase = createClient()

  // Evidence quality criteria weights
  private readonly QUALITY_WEIGHTS = {
    image_clarity: 0.25,
    lighting: 0.15,
    angle: 0.15,
    completeness: 0.20,
    timestamp: 0.10,
    metadata: 0.15
  }

  // Standard workflow templates
  private readonly WORKFLOW_TEMPLATES = {
    hurricane: {
      name: 'Hurricane Damage Claim',
      steps: [
        {
          category: 'damage_photos' as EvidenceCategory,
          step_name: 'Exterior Damage Documentation',
          required: ['roof_damage', 'siding_damage', 'window_damage'],
          estimated_time: 30
        },
        {
          category: 'damage_photos' as EvidenceCategory,
          step_name: 'Interior Damage Documentation', 
          required: ['water_damage', 'ceiling_damage', 'floor_damage'],
          estimated_time: 45
        },
        {
          category: 'receipts_invoices' as EvidenceCategory,
          step_name: 'Financial Documentation',
          required: ['emergency_repairs', 'temporary_lodging'],
          estimated_time: 20
        }
      ]
    },
    fire: {
      name: 'Fire Damage Claim',
      steps: [
        {
          category: 'damage_photos' as EvidenceCategory,
          step_name: 'Fire Damage Assessment',
          required: ['fire_damage_overview', 'smoke_damage', 'heat_damage'],
          estimated_time: 40
        },
        {
          category: 'legal_documents' as EvidenceCategory,
          step_name: 'Official Reports',
          required: ['fire_department_report', 'investigation_report'],
          estimated_time: 15
        }
      ]
    }
  }

  /**
   * Analyze uploaded evidence with AI
   */
  async analyzeEvidence(file: File, claimId: string): Promise<EvidenceItem | null> {
    try {
      // Upload file to storage first
      const fileUrl = await this.uploadFile(file, claimId)
      if (!fileUrl) {
        throw new Error('Failed to upload file')
      }

      // Generate AI analysis
      const analysis = await this.generateAIAnalysis(file, fileUrl)
      
      // Calculate quality scores
      const qualityScore = this.calculateQualityScore(analysis, file)
      const completenessScore = this.calculateCompletenessScore(analysis)
      const relevanceScore = this.calculateRelevanceScore(analysis, claimId)

      const evidenceItem: EvidenceItem = {
        id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        claim_id: claimId,
        user_id: 'current-user', // Replace with actual user ID
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: fileUrl,
        category: analysis.category,
        subcategory: analysis.subcategory,
        quality_score: qualityScore,
        completeness_score: completenessScore,
        relevance_score: relevanceScore,
        ai_tags: analysis.tags,
        ai_description: analysis.description,
        ai_analysis: analysis.detailed_analysis,
        detected_elements: analysis.detected_elements,
        metadata: analysis.metadata,
        upload_date: new Date().toISOString(),
        status: 'analyzed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save to database
      await this.saveEvidenceItem(evidenceItem)

      // Check for workflow updates
      await this.updateWorkflowProgress(claimId, analysis.category)

      return evidenceItem
    } catch (error) {
      console.error('Error analyzing evidence:', error)
      return null
    }
  }

  /**
   * Generate AI analysis of evidence
   */
  private async generateAIAnalysis(file: File, fileUrl: string): Promise<{
    category: EvidenceCategory
    subcategory: string
    tags: string[]
    description: string
    detailed_analysis: string
    detected_elements: DetectedElement[]
    metadata: Record<string, any>
  }> {
    try {
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!openaiApiKey) {
        return this.fallbackAnalysis(file)
      }

      let analysisPrompt = ''
      let imageBase64 = ''

      if (file.type.startsWith('image/')) {
        imageBase64 = await this.fileToBase64(file)
        analysisPrompt = `You are Curator, an expert AI system for insurance evidence analysis. Analyze this image for insurance claim purposes.

Identify:
1. Evidence category (damage_photos, property_photos, receipts_invoices, etc.)
2. Subcategory (roof_damage, water_damage, fire_damage, etc.)
3. Quality assessment (clarity, lighting, angle, completeness)
4. Detected elements (damage, dates, costs, locations, people)
5. Relevance to insurance claim
6. Missing elements or improvements needed

Provide JSON response with:
{
  "category": "evidence_category",
  "subcategory": "specific_type",
  "tags": ["tag1", "tag2"],
  "description": "brief description",
  "detailed_analysis": "comprehensive analysis",
  "detected_elements": [
    {
      "type": "damage|property_info|date|person|document|location|cost",
      "value": "detected_value",
      "confidence": 0.85,
      "description": "element description"
    }
  ],
  "quality_score": 85,
  "metadata": {
    "clarity": "high|medium|low",
    "lighting": "good|fair|poor", 
    "angle": "optimal|acceptable|poor",
    "completeness": "complete|partial|incomplete"
  }
}`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: analysisPrompt },
                  { type: 'image_url', image_url: { url: `data:${file.type};base64,${imageBase64}` } }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 1500
          })
        })

        if (!response.ok) {
          throw new Error('AI analysis failed')
        }

        const result = await response.json()
        return JSON.parse(result.choices[0].message.content)
      } else {
        // Handle non-image files (PDFs, documents)
        return this.analyzeDocumentFile(file)
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      return this.fallbackAnalysis(file)
    }
  }

  /**
   * Analyze non-image documents
   */
  private async analyzeDocumentFile(file: File): Promise<{
    category: EvidenceCategory
    subcategory: string
    tags: string[]
    description: string
    detailed_analysis: string
    detected_elements: DetectedElement[]
    metadata: Record<string, any>
  }> {
    const fileName = file.name.toLowerCase()
    let category: EvidenceCategory = 'insurance_documents'
    let subcategory = 'unknown'
    const tags: string[] = []

    // Pattern matching for document types
    if (fileName.includes('receipt') || fileName.includes('invoice')) {
      category = 'receipts_invoices'
      subcategory = 'receipt'
      tags.push('financial', 'receipt')
    } else if (fileName.includes('estimate') || fileName.includes('quote')) {
      category = 'estimates_quotes'
      subcategory = 'repair_estimate'
      tags.push('estimate', 'repair')
    } else if (fileName.includes('policy') || fileName.includes('insurance')) {
      category = 'insurance_documents'
      subcategory = 'policy_document'
      tags.push('policy', 'insurance')
    } else if (fileName.includes('report')) {
      category = 'expert_reports'
      subcategory = 'professional_report'
      tags.push('report', 'professional')
    }

    return {
      category,
      subcategory,
      tags,
      description: `${file.type} document: ${file.name}`,
      detailed_analysis: `Document analysis: File type ${file.type}, size ${file.size} bytes. Categorized as ${category}.`,
      detected_elements: [
        {
          type: 'document',
          value: file.name,
          confidence: 0.9,
          description: `Document file: ${file.name}`
        }
      ],
      metadata: {
        file_type: file.type,
        file_size: file.size,
        auto_categorized: true
      }
    }
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private fallbackAnalysis(file: File): {
    category: EvidenceCategory
    subcategory: string
    tags: string[]
    description: string
    detailed_analysis: string
    detected_elements: DetectedElement[]
    metadata: Record<string, any>
  } {
    const isImage = file.type.startsWith('image/')
    
    return {
      category: isImage ? 'damage_photos' : 'insurance_documents',
      subcategory: isImage ? 'general_damage' : 'document',
      tags: [isImage ? 'photo' : 'document', 'unanalyzed'],
      description: `${isImage ? 'Image' : 'Document'}: ${file.name}`,
      detailed_analysis: 'Basic categorization - AI analysis unavailable',
      detected_elements: [],
      metadata: {
        fallback_analysis: true,
        file_type: file.type,
        file_size: file.size
      }
    }
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(file: File, claimId: string): Promise<string | null> {
    try {
      const fileName = `${claimId}/${Date.now()}-${file.name}`
      const { data, error } = await this.supabase.storage
        .from('evidence-files')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      const { data: urlData } = this.supabase.storage
        .from('evidence-files')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
    })
  }

  /**
   * Calculate evidence quality score
   */
  private calculateQualityScore(analysis: any, file: File): number {
    let score = 70 // Base score

    if (analysis.metadata?.clarity === 'high') score += 15
    else if (analysis.metadata?.clarity === 'medium') score += 5
    
    if (analysis.metadata?.lighting === 'good') score += 10
    else if (analysis.metadata?.lighting === 'fair') score += 5
    
    if (analysis.metadata?.angle === 'optimal') score += 10
    else if (analysis.metadata?.angle === 'acceptable') score += 5
    
    if (analysis.metadata?.completeness === 'complete') score += 15
    else if (analysis.metadata?.completeness === 'partial') score += 8

    // File size considerations
    if (file.size > 1024 * 1024) score += 5 // High resolution bonus
    
    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(analysis: any): number {
    let score = 60 // Base score
    
    score += analysis.detected_elements.length * 5
    score += analysis.tags.length * 3
    
    if (analysis.detailed_analysis.length > 100) score += 10
    
    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(analysis: any, claimId: string): number {
    // For now, return a standard score
    // In production, this would analyze against claim details
    return 85
  }

  /**
   * Save evidence item to database
   */
  private async saveEvidenceItem(item: EvidenceItem): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('evidence_items')
        .insert(item)

      if (error) {
        console.error('Error saving evidence item:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving evidence item:', error)
      return false
    }
  }

  /**
   * Identify evidence gaps for a claim
   */
  async identifyEvidenceGaps(claimId: string): Promise<EvidenceGap[]> {
    try {
      // Get existing evidence for claim
      const existingEvidence = await this.getClaimEvidence(claimId)
      
      // Get claim type to determine required evidence
      const claimType = await this.getClaimType(claimId)
      
      const gaps: EvidenceGap[] = []
      
      // Define required evidence by category
      const requiredEvidence = this.getRequiredEvidenceByClaimType(claimType)
      
      // Check for missing categories
      for (const [category, requirements] of Object.entries(requiredEvidence)) {
        const existingInCategory = existingEvidence.filter(e => e.category === category)
        
        if (existingInCategory.length === 0) {
          gaps.push({
            category: category as EvidenceCategory,
            gap_type: 'missing_category',
            severity: 'high',
            description: `No ${category} evidence found`,
            impact_on_claim: 'May result in claim delay or reduction',
            suggested_actions: [
              `Upload ${category} documentation`,
              'Consult with your adjuster about requirements'
            ],
            priority: 1,
            estimated_value_impact: 5000
          })
        } else {
          // Check quality of existing evidence
          const avgQuality = existingInCategory.reduce((sum, e) => sum + e.quality_score, 0) / existingInCategory.length
          
          if (avgQuality < 70) {
            gaps.push({
              category: category as EvidenceCategory,
              gap_type: 'low_quality',
              severity: 'medium',
              description: `${category} evidence quality below standards`,
              impact_on_claim: 'May weaken claim strength',
              suggested_actions: [
                'Retake photos with better lighting',
                'Provide higher resolution images',
                'Include additional angles'
              ],
              priority: 2,
              estimated_value_impact: 2000
            })
          }
        }
      }

      return gaps.sort((a, b) => a.priority - b.priority)
    } catch (error) {
      console.error('Error identifying evidence gaps:', error)
      return []
    }
  }

  /**
   * Get evidence for a claim
   */
  async getClaimEvidence(claimId: string): Promise<EvidenceItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('evidence_items')
        .select('*')
        .eq('claim_id', claimId)
        .order('upload_date', { ascending: false })

      if (error) {
        console.error('Error fetching claim evidence:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching claim evidence:', error)
      return []
    }
  }

  /**
   * Get claim type (mock implementation)
   */
  private async getClaimType(claimId: string): Promise<string> {
    // Mock - in production, fetch from claims table
    return 'hurricane'
  }

  /**
   * Get required evidence by claim type
   */
  private getRequiredEvidenceByClaimType(claimType: string): Record<string, string[]> {
    const requirements = {
      hurricane: {
        damage_photos: ['exterior_damage', 'interior_damage', 'roof_damage'],
        receipts_invoices: ['emergency_repairs', 'temporary_lodging'],
        weather_reports: ['storm_documentation'],
        estimates_quotes: ['repair_estimates']
      },
      fire: {
        damage_photos: ['fire_damage', 'smoke_damage'],
        legal_documents: ['fire_department_report'],
        receipts_invoices: ['emergency_expenses'],
        estimates_quotes: ['restoration_quotes']
      },
      flood: {
        damage_photos: ['water_damage', 'flooding_extent'],
        weather_reports: ['precipitation_data'],
        receipts_invoices: ['water_removal', 'drying_equipment']
      }
    }

    return requirements[claimType] || requirements.hurricane
  }

  /**
   * Create evidence workflow for claim
   */
  async createEvidenceWorkflow(claimId: string, claimType: string): Promise<EvidenceWorkflow | null> {
    try {
      const template = this.WORKFLOW_TEMPLATES[claimType as keyof typeof this.WORKFLOW_TEMPLATES] || this.WORKFLOW_TEMPLATES.hurricane
      
      const steps: WorkflowStep[] = template.steps.map((step, index) => ({
        id: `step-${index + 1}`,
        step_name: step.step_name,
        description: `Complete ${step.step_name.toLowerCase()} documentation`,
        category: step.category,
        required_evidence: step.required,
        optional_evidence: [],
        status: index === 0 ? 'in_progress' : 'pending',
        ai_guidance: this.generateStepGuidance(step.category, step.step_name),
        estimated_time: step.estimated_time,
        priority: index + 1
      }))

      const workflow: EvidenceWorkflow = {
        id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        claim_id: claimId,
        user_id: 'current-user',
        workflow_name: template.name,
        steps,
        current_step: 0,
        status: 'in_progress',
        completion_percentage: 0,
        estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        auto_suggestions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save to database
      await this.saveWorkflow(workflow)

      return workflow
    } catch (error) {
      console.error('Error creating evidence workflow:', error)
      return null
    }
  }

  /**
   * Generate AI guidance for workflow step
   */
  private generateStepGuidance(category: EvidenceCategory, stepName: string): string {
    const guidance = {
      damage_photos: 'Take clear, well-lit photos from multiple angles. Include close-ups of specific damage and wide shots for context. Ensure good lighting and sharp focus.',
      receipts_invoices: 'Collect all financial documentation related to the claim. Include receipts, invoices, and proof of payments. Ensure all text is clearly readable.',
      estimates_quotes: 'Obtain detailed written estimates from licensed contractors. Include itemized breakdowns and professional assessments.',
      weather_reports: 'Gather official weather data and reports from the National Weather Service or local meteorological agencies.',
      legal_documents: 'Collect all official reports and legal documentation related to the incident.'
    }

    return guidance[category] || 'Follow standard documentation procedures for this evidence type.'
  }

  /**
   * Update workflow progress
   */
  async updateWorkflowProgress(claimId: string, completedCategory: EvidenceCategory): Promise<void> {
    try {
      const { data: workflow, error } = await this.supabase
        .from('evidence_workflows')
        .select('*')
        .eq('claim_id', claimId)
        .single()

      if (error || !workflow) {
        return
      }

      // Update step status if category matches
      const updatedSteps = workflow.steps.map((step: WorkflowStep) => {
        if (step.category === completedCategory && step.status === 'in_progress') {
          return { ...step, status: 'completed' }
        }
        return step
      })

      const completedSteps = updatedSteps.filter((step: WorkflowStep) => step.status === 'completed').length
      const completionPercentage = (completedSteps / updatedSteps.length) * 100

      await this.supabase
        .from('evidence_workflows')
        .update({
          steps: updatedSteps,
          completion_percentage: completionPercentage,
          status: completionPercentage === 100 ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('claim_id', claimId)
    } catch (error) {
      console.error('Error updating workflow progress:', error)
    }
  }

  /**
   * Save workflow to database
   */
  private async saveWorkflow(workflow: EvidenceWorkflow): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('evidence_workflows')
        .insert(workflow)

      if (error) {
        console.error('Error saving workflow:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving workflow:', error)
      return false
    }
  }

  /**
   * Get evidence analytics
   */
  async getEvidenceAnalytics(claimId?: string): Promise<EvidenceAnalytics> {
    try {
      // Mock analytics - implement based on your database structure
      return {
        total_items: 156,
        by_category: {
          damage_photos: 45,
          property_photos: 12,
          receipts_invoices: 23,
          estimates_quotes: 15,
          insurance_documents: 18,
          legal_documents: 8,
          weather_reports: 5,
          witness_statements: 3,
          expert_reports: 12,
          repair_documentation: 9,
          inventory_lists: 4,
          medical_records: 2
        },
        average_quality_score: 82.5,
        completion_percentage: 78,
        critical_gaps: 3,
        workflow_completion_rate: 0.85,
        processing_time_avg: 3.2,
        ai_accuracy_rate: 0.91
      }
    } catch (error) {
      console.error('Error fetching evidence analytics:', error)
      return {
        total_items: 0,
        by_category: {} as any,
        average_quality_score: 0,
        completion_percentage: 0,
        critical_gaps: 0,
        workflow_completion_rate: 0,
        processing_time_avg: 0,
        ai_accuracy_rate: 0
      }
    }
  }

  /**
   * Get workflow for claim
   */
  async getClaimWorkflow(claimId: string): Promise<EvidenceWorkflow | null> {
    try {
      const { data, error } = await this.supabase
        .from('evidence_workflows')
        .select('*')
        .eq('claim_id', claimId)
        .single()

      if (error) {
        console.error('Error fetching workflow:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching workflow:', error)
      return null
    }
  }
}

export const evidenceCuratorService = new EvidenceCuratorService()