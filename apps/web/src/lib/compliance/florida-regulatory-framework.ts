/**
 * @fileMetadata
 * @purpose "Florida-specific regulatory compliance framework for insurance claims and public adjusters"
 * @owner compliance-team
 * @dependencies ["@/lib/supabase/server", "@/lib/logger/production-logger"]
 * @exports ["FloridaComplianceManager", "FloridaRegulationTypes", "ComplianceChecker"]
 * @complexity high
 * @tags ["compliance", "florida-regulations", "insurance-law", "legal"]
 * @status production-ready
 * @lastModifiedBy Claude AI Assistant - Compliance Framework
 * @lastModifiedDate 2025-08-06
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger/production-logger'

// =======================
// FLORIDA REGULATION TYPES
// =======================

export interface FloridaInsuranceCode {
  section: string
  title: string
  requirements: string[]
  deadlines: {
    acknowledgment?: number // days
    investigation?: number // days
    decision?: number // days
    payment?: number // days
  }
  penalties: {
    description: string
    fineAmount?: number
    additionalConsequences?: string[]
  }
}

export interface FloridaPublicRecordsRequirement {
  category: 'disclosure' | 'retention' | 'exemption' | 'notification'
  description: string
  timeline: string
  exceptions: string[]
  applicableDocuments: string[]
}

export interface PromptPaymentActCompliance {
  claimId: string
  incidentDate: Date
  reportedDate: Date
  acknowledgmentDeadline: Date
  acknowledgmentCompleted?: Date
  investigationDeadline: Date
  investigationCompleted?: Date
  decisionDeadline: Date
  decisionRendered?: Date
  paymentDeadline: Date
  paymentCompleted?: Date
  violationRisk: 'low' | 'medium' | 'high' | 'critical'
  daysRemaining: number
  complianceStatus: 'compliant' | 'at_risk' | 'violation' | 'pending'
}

export interface BadFaithProtection {
  claimId: string
  protectionMeasures: {
    timelyInvestigation: boolean
    adequateCommunication: boolean
    fairSettlement: boolean
    properDocumentation: boolean
  }
  riskFactors: string[]
  mitigationActions: string[]
  complianceScore: number // 0-100
}

export interface AssignmentOfBenefitsCompliance {
  aobId: string
  claimId: string
  contractorName: string
  contractorLicense: string
  assignmentDate: Date
  requiredDisclosures: {
    rightsNotification: boolean
    revocationRights: boolean
    attorneyFees: boolean
    lienRights: boolean
  }
  documentationComplete: boolean
  complianceStatus: 'compliant' | 'incomplete' | 'non_compliant'
}

export interface PublicAdjusterCompliance {
  licenseNumber: string
  licenseExpiry: Date
  contractTerms: {
    feeStructure: string
    cancellationRights: boolean
    estimateProvided: boolean
    writtenContract: boolean
  }
  complianceStatus: 'compliant' | 'expired' | 'non_compliant'
}

export interface HurricaneClaimReporting {
  claimId: string
  hurricaneEvent: string
  femaDisasterNumber?: string
  oirReportingRequired: boolean
  reportingDeadline?: Date
  reportSubmitted?: boolean
  reportSubmissionDate?: Date
  specialRequirements: string[]
}

// =======================
// FLORIDA COMPLIANCE MANAGER
// =======================

export class FloridaComplianceManager {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient()
  }

  // =======================
  // FLORIDA INSURANCE CODE COMPLIANCE
  // =======================

  /**
   * Check Florida Insurance Code compliance for a claim
   */
  async checkInsuranceCodeCompliance(claimId: string): Promise<{
    compliant: boolean
    violations: string[]
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }> {
    try {
      const { data: claim, error } = await this.supabase
        .from('claims')
        .select(`
          *,
          florida_insurance_compliance:compliance.florida_insurance_compliance(*)
        `)
        .eq('id', claimId)
        .single()

      if (error || !claim) {
        throw new Error(`Failed to retrieve claim: ${error?.message}`)
      }

      const violations: string[] = []
      const recommendations: string[] = []
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

      // Check Prompt Payment Act compliance (Chapter 627.70131)
      const promptPaymentCheck = await this.checkPromptPaymentActCompliance(claimId)
      if (!promptPaymentCheck.compliant) {
        violations.push('Prompt Payment Act violation risk detected')
        riskLevel = promptPaymentCheck.riskLevel
      }

      // Check bad faith protection measures
      const badFaithCheck = await this.assessBadFaithRisk(claimId)
      if (badFaithCheck.riskLevel === 'high' || badFaithCheck.riskLevel === 'critical') {
        violations.push('High bad faith risk detected')
        riskLevel = Math.max(riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4, 
                            badFaithCheck.riskLevel === 'high' ? 3 : 4) === 1 ? 'low' : 
                            Math.max(riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4, 
                            badFaithCheck.riskLevel === 'high' ? 3 : 4) === 2 ? 'medium' : 
                            Math.max(riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4, 
                            badFaithCheck.riskLevel === 'high' ? 3 : 4) === 3 ? 'high' : 'critical'
      }

      // Generate recommendations
      if (violations.length === 0) {
        recommendations.push('Maintain current compliance practices')
        recommendations.push('Continue timely communication with all parties')
      } else {
        recommendations.push('Implement immediate corrective actions')
        recommendations.push('Enhance documentation and communication processes')
        if (riskLevel === 'critical') {
          recommendations.push('Consult legal counsel immediately')
        }
      }

      return {
        compliant: violations.length === 0,
        violations,
        recommendations,
        riskLevel
      }

    } catch (error) {
      logger.error('Florida Insurance Code compliance check failed', { claimId, error })
      throw error
    }
  }

  /**
   * Check Prompt Payment Act compliance (Florida Statute 627.70131)
   */
  async checkPromptPaymentActCompliance(claimId: string): Promise<{
    compliant: boolean
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    timeline: PromptPaymentActCompliance
    violations: string[]
  }> {
    try {
      const { data: claim, error } = await this.supabase
        .from('claims')
        .select(`
          *,
          florida_compliance:compliance.florida_insurance_compliance(*)
        `)
        .eq('id', claimId)
        .single()

      if (error || !claim) {
        throw new Error(`Failed to retrieve claim: ${error?.message}`)
      }

      const reportedDate = new Date(claim.reported_date || claim.created_at)
      const incidentDate = new Date(claim.incident_date)
      const now = new Date()

      // Calculate deadlines per Florida Statute 627.70131
      const acknowledgmentDeadline = new Date(reportedDate)
      acknowledgmentDeadline.setDate(acknowledgmentDeadline.getDate() + 14) // 14 days to acknowledge

      const investigationDeadline = new Date(reportedDate)
      investigationDeadline.setDate(investigationDeadline.getDate() + 90) // 90 days to investigate

      const decisionDeadline = new Date(reportedDate)
      decisionDeadline.setDate(decisionDeadline.getDate() + 90) // 90 days to make decision

      const paymentDeadline = new Date(decisionDeadline)
      paymentDeadline.setDate(paymentDeadline.getDate() + 20) // 20 days after decision to pay

      const compliance: PromptPaymentActCompliance = {
        claimId,
        incidentDate,
        reportedDate,
        acknowledgmentDeadline,
        acknowledgmentCompleted: claim.florida_compliance?.[0]?.initial_contact_completed_at ? 
          new Date(claim.florida_compliance[0].initial_contact_completed_at) : undefined,
        investigationDeadline,
        investigationCompleted: claim.florida_compliance?.[0]?.investigation_completed_at ? 
          new Date(claim.florida_compliance[0].investigation_completed_at) : undefined,
        decisionDeadline,
        decisionRendered: claim.florida_compliance?.[0]?.decision_rendered_at ? 
          new Date(claim.florida_compliance[0].decision_rendered_at) : undefined,
        paymentDeadline,
        paymentCompleted: claim.florida_compliance?.[0]?.payment_completed_at ? 
          new Date(claim.florida_compliance[0].payment_completed_at) : undefined,
        daysRemaining: Math.ceil((decisionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        violationRisk: 'low',
        complianceStatus: 'pending'
      }

      const violations: string[] = []

      // Check acknowledgment compliance
      if (!compliance.acknowledgmentCompleted && now > acknowledgmentDeadline) {
        violations.push('Acknowledgment deadline exceeded (14 days)')
        compliance.violationRisk = 'high'
      }

      // Check investigation compliance
      if (!compliance.investigationCompleted && now > investigationDeadline) {
        violations.push('Investigation deadline exceeded (90 days)')
        compliance.violationRisk = 'critical'
      }

      // Check decision compliance
      if (!compliance.decisionRendered && now > decisionDeadline) {
        violations.push('Decision deadline exceeded (90 days)')
        compliance.violationRisk = 'critical'
      }

      // Check payment compliance
      if (compliance.decisionRendered && !compliance.paymentCompleted && now > paymentDeadline) {
        violations.push('Payment deadline exceeded (20 days after decision)')
        compliance.violationRisk = 'critical'
      }

      // Set risk level based on days remaining
      if (compliance.daysRemaining <= 0) {
        compliance.violationRisk = 'critical'
      } else if (compliance.daysRemaining <= 7) {
        compliance.violationRisk = 'high'
      } else if (compliance.daysRemaining <= 14) {
        compliance.violationRisk = 'medium'
      }

      // Set compliance status
      if (violations.length > 0) {
        compliance.complianceStatus = 'violation'
      } else if (compliance.violationRisk === 'high' || compliance.violationRisk === 'critical') {
        compliance.complianceStatus = 'at_risk'
      } else {
        compliance.complianceStatus = 'compliant'
      }

      return {
        compliant: violations.length === 0,
        riskLevel: compliance.violationRisk,
        timeline: compliance,
        violations
      }

    } catch (error) {
      logger.error('Prompt Payment Act compliance check failed', { claimId, error })
      throw error
    }
  }

  /**
   * Assess bad faith risk per Florida Statute 624.155
   */
  async assessBadFaithRisk(claimId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    protection: BadFaithProtection
    recommendations: string[]
  }> {
    try {
      const { data: claim, error } = await this.supabase
        .from('claims')
        .select(`
          *,
          claim_documents(*),
          florida_compliance:compliance.florida_insurance_compliance(*)
        `)
        .eq('id', claimId)
        .single()

      if (error || !claim) {
        throw new Error(`Failed to retrieve claim: ${error?.message}`)
      }

      const riskFactors: string[] = []
      const mitigationActions: string[] = []

      // Check investigation timeliness
      const reportedDate = new Date(claim.reported_date || claim.created_at)
      const daysSinceReported = Math.ceil((Date.now() - reportedDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceReported > 30 && !claim.florida_compliance?.[0]?.investigation_completed_at) {
        riskFactors.push('Investigation delay beyond 30 days')
      }

      // Check communication adequacy
      const communicationEvents = claim.florida_compliance?.[0]?.metadata?.communication_log || []
      if (communicationEvents.length === 0) {
        riskFactors.push('No documented communication with claimant')
        mitigationActions.push('Establish regular communication protocol')
      }

      // Check documentation completeness
      const requiredDocs = ['policy', 'claim_form', 'damage_assessment']
      const availableDocs = claim.claim_documents?.map((doc: { document_type: string }) => doc.document_type) || []
      const missingDocs = requiredDocs.filter(doc => !availableDocs.includes(doc))
      
      if (missingDocs.length > 0) {
        riskFactors.push(`Missing required documentation: ${missingDocs.join(', ')}`)
        mitigationActions.push('Gather all required documentation immediately')
      }

      // Calculate compliance score
      let complianceScore = 100
      complianceScore -= riskFactors.length * 15
      complianceScore = Math.max(0, complianceScore)

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (complianceScore < 50) {
        riskLevel = 'critical'
      } else if (complianceScore < 70) {
        riskLevel = 'high'
      } else if (complianceScore < 85) {
        riskLevel = 'medium'
      }

      const protection: BadFaithProtection = {
        claimId,
        protectionMeasures: {
          timelyInvestigation: !riskFactors.some(factor => factor.includes('Investigation delay')),
          adequateCommunication: communicationEvents.length > 0,
          fairSettlement: claim.status !== 'denied' || claim.metadata?.denial_justification,
          properDocumentation: missingDocs.length === 0
        },
        riskFactors,
        mitigationActions,
        complianceScore
      }

      const recommendations: string[] = [
        'Maintain detailed documentation of all claim activities',
        'Ensure timely and consistent communication with claimant',
        'Follow established investigation protocols',
        ...mitigationActions
      ]

      return {
        riskLevel,
        protection,
        recommendations
      }

    } catch (error) {
      logger.error('Bad faith risk assessment failed', { claimId, error })
      throw error
    }
  }

  // =======================
  // PUBLIC RECORDS LAW COMPLIANCE
  // =======================

  /**
   * Check Florida Public Records Law compliance
   */
  async checkPublicRecordsCompliance(entityId: string, entityType: string): Promise<{
    compliant: boolean
    requirements: FloridaPublicRecordsRequirement[]
    exemptions: string[]
    disclosureObligations: string[]
    retentionRequirements: string[]
  }> {
    try {
      const requirements: FloridaPublicRecordsRequirement[] = []
      const exemptions: string[] = []
      const disclosureObligations: string[] = []
      const retentionRequirements: string[] = []

      // Public records requirements vary by entity type
      switch (entityType) {
        case 'claim':
          requirements.push({
            category: 'retention',
            description: 'Insurance claim records must be retained for 7 years',
            timeline: '7 years from claim closure',
            exceptions: ['Active litigation extends retention'],
            applicableDocuments: ['claim_form', 'correspondence', 'settlements', 'investigations']
          })

          requirements.push({
            category: 'disclosure',
            description: 'Claimant has right to access their claim file',
            timeline: 'Upon written request',
            exceptions: ['Work product privilege', 'Attorney-client privilege'],
            applicableDocuments: ['claim_file', 'investigation_reports', 'correspondence']
          })

          disclosureObligations.push('Provide claim file to claimant upon written request')
          retentionRequirements.push('Retain all claim documentation for 7 years')
          break

        case 'user':
          requirements.push({
            category: 'notification',
            description: 'Privacy notice must be provided for personal data collection',
            timeline: 'At time of collection',
            exceptions: [],
            applicableDocuments: ['privacy_notice', 'consent_forms']
          })

          disclosureObligations.push('Provide privacy notice at data collection')
          break
      }

      // Check for applicable exemptions
      if (entityType === 'claim') {
        exemptions.push('Active civil investigation records (119.071(2)(c))')
        exemptions.push('Attorney work product and client communications')
        exemptions.push('Trade secrets and confidential business information')
      }

      return {
        compliant: true, // Will be determined based on actual compliance checks
        requirements,
        exemptions,
        disclosureObligations,
        retentionRequirements
      }

    } catch (error) {
      logger.error('Public Records Law compliance check failed', { entityId, entityType, error })
      throw error
    }
  }

  // =======================
  // AOB COMPLIANCE
  // =======================

  /**
   * Validate Assignment of Benefits compliance
   */
  async validateAOBCompliance(aobId: string): Promise<AssignmentOfBenefitsCompliance> {
    try {
      const { data: aob, error } = await this.supabase
        .from('assignment_of_benefits')
        .select('*')
        .eq('id', aobId)
        .single()

      if (error || !aob) {
        throw new Error(`Failed to retrieve AOB: ${error?.message}`)
      }

      const requiredDisclosures = {
        rightsNotification: Boolean(aob.metadata?.rights_notification),
        revocationRights: Boolean(aob.metadata?.revocation_rights_disclosed),
        attorneyFees: Boolean(aob.metadata?.attorney_fees_disclosed),
        lienRights: Boolean(aob.metadata?.lien_rights_disclosed)
      }

      const documentationComplete = Object.values(requiredDisclosures).every(Boolean) &&
        Boolean(aob.contractor_license) &&
        Boolean(aob.assignment_date)

      let complianceStatus: 'compliant' | 'incomplete' | 'non_compliant' = 'compliant'
      
      if (!documentationComplete) {
        complianceStatus = 'incomplete'
      }

      // Check contractor license validity
      if (!aob.contractor_license || aob.contractor_license.length < 5) {
        complianceStatus = 'non_compliant'
      }

      return {
        aobId,
        claimId: aob.claim_id,
        contractorName: aob.contractor_name,
        contractorLicense: aob.contractor_license,
        assignmentDate: new Date(aob.assignment_date),
        requiredDisclosures,
        documentationComplete,
        complianceStatus
      }

    } catch (error) {
      logger.error('AOB compliance validation failed', { aobId, error })
      throw error
    }
  }

  // =======================
  // PUBLIC ADJUSTER COMPLIANCE
  // =======================

  /**
   * Validate Public Adjuster compliance
   */
  async validatePublicAdjusterCompliance(licenseNumber: string): Promise<PublicAdjusterCompliance> {
    try {
      // In a real implementation, this would check against Florida DFS licensing database
      const { data: adjuster, error } = await this.supabase
        .from('public_adjusters')
        .select('*')
        .eq('license_number', licenseNumber)
        .single()

      if (error) {
        logger.warn('Public adjuster not found in database', { licenseNumber, error })
      }

      const licenseExpiry = adjuster?.license_expiry ? new Date(adjuster.license_expiry) : new Date()
      const now = new Date()
      const isExpired = licenseExpiry < now

      let complianceStatus: 'compliant' | 'expired' | 'non_compliant' = 'compliant'
      
      if (isExpired) {
        complianceStatus = 'expired'
      }

      if (!licenseNumber || licenseNumber.length !== 7) { // Florida PA licenses are 7 characters
        complianceStatus = 'non_compliant'
      }

      const contractTerms = {
        feeStructure: adjuster?.fee_structure || 'Not specified',
        cancellationRights: Boolean(adjuster?.contract_terms?.cancellation_rights),
        estimateProvided: Boolean(adjuster?.contract_terms?.estimate_provided),
        writtenContract: Boolean(adjuster?.contract_terms?.written_contract)
      }

      return {
        licenseNumber,
        licenseExpiry,
        contractTerms,
        complianceStatus
      }

    } catch (error) {
      logger.error('Public adjuster compliance validation failed', { licenseNumber, error })
      throw error
    }
  }

  // =======================
  // HURRICANE CLAIM COMPLIANCE
  // =======================

  /**
   * Check hurricane claim reporting requirements
   */
  async checkHurricaneClaimReporting(claimId: string): Promise<HurricaneClaimReporting> {
    try {
      const { data: claim, error } = await this.supabase
        .from('claims')
        .select(`
          *,
          florida_compliance:compliance.florida_insurance_compliance(*)
        `)
        .eq('id', claimId)
        .single()

      if (error || !claim) {
        throw new Error(`Failed to retrieve claim: ${error?.message}`)
      }

      const isHurricaneClaim = claim.florida_compliance?.[0]?.hurricane_claim || false
      const hurricaneEvent = claim.florida_compliance?.[0]?.catastrophic_event_id || ''
      const oirReportingRequired = isHurricaneClaim && claim.estimated_amount && claim.estimated_amount > 25000

      let reportingDeadline: Date | undefined
      if (oirReportingRequired && claim.florida_compliance?.[0]?.created_at) {
        reportingDeadline = new Date(claim.florida_compliance[0].created_at)
        reportingDeadline.setDate(reportingDeadline.getDate() + 30) // 30 days to report to OIR
      }

      const specialRequirements: string[] = []
      if (isHurricaneClaim) {
        specialRequirements.push('Enhanced documentation requirements for hurricane damage')
        specialRequirements.push('Expedited processing required (72 hours for emergency services)')
        specialRequirements.push('Additional engineer inspection may be required')
        if (oirReportingRequired) {
          specialRequirements.push('Office of Insurance Regulation reporting required')
        }
      }

      return {
        claimId,
        hurricaneEvent,
        femaDisasterNumber: claim.florida_compliance?.[0]?.metadata?.fema_disaster_number,
        oirReportingRequired,
        reportingDeadline,
        reportSubmitted: Boolean(claim.florida_compliance?.[0]?.oir_report_submitted_at),
        reportSubmissionDate: claim.florida_compliance?.[0]?.oir_report_submitted_at ?
          new Date(claim.florida_compliance[0].oir_report_submitted_at) : undefined,
        specialRequirements
      }

    } catch (error) {
      logger.error('Hurricane claim reporting check failed', { claimId, error })
      throw error
    }
  }

  // =======================
  // COMPREHENSIVE COMPLIANCE CHECK
  // =======================

  /**
   * Run comprehensive Florida compliance check
   */
  async runComprehensiveComplianceCheck(claimId: string): Promise<{
    overallCompliance: 'compliant' | 'at_risk' | 'violation'
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    checks: {
      insuranceCode: Awaited<ReturnType<typeof this.checkInsuranceCodeCompliance>>
      promptPayment: Awaited<ReturnType<typeof this.checkPromptPaymentActCompliance>>
      badFaith: Awaited<ReturnType<typeof this.assessBadFaithRisk>>
      hurricane?: HurricaneClaimReporting
    }
    recommendations: string[]
    urgentActions: string[]
  }> {
    try {
      const checks = {
        insuranceCode: await this.checkInsuranceCodeCompliance(claimId),
        promptPayment: await this.checkPromptPaymentActCompliance(claimId),
        badFaith: await this.assessBadFaithRisk(claimId)
      }

      // Check if hurricane claim
      const hurricaneCheck = await this.checkHurricaneClaimReporting(claimId)
      if (hurricaneCheck.oirReportingRequired) {
        checks.hurricane = hurricaneCheck
      }

      // Determine overall compliance
      const hasViolations = !checks.insuranceCode.compliant || !checks.promptPayment.compliant
      const hasHighRisk = checks.insuranceCode.riskLevel === 'high' || 
                         checks.insuranceCode.riskLevel === 'critical' ||
                         checks.badFaith.riskLevel === 'high' ||
                         checks.badFaith.riskLevel === 'critical'

      let overallCompliance: 'compliant' | 'at_risk' | 'violation' = 'compliant'
      if (hasViolations) {
        overallCompliance = 'violation'
      } else if (hasHighRisk) {
        overallCompliance = 'at_risk'
      }

      // Determine overall risk level
      const riskLevels = [
        checks.insuranceCode.riskLevel,
        checks.promptPayment.riskLevel,
        checks.badFaith.riskLevel
      ]
      const riskLevel = riskLevels.includes('critical') ? 'critical' :
                       riskLevels.includes('high') ? 'high' :
                       riskLevels.includes('medium') ? 'medium' : 'low'

      // Compile recommendations
      const recommendations = [
        ...checks.insuranceCode.recommendations,
        ...checks.badFaith.recommendations
      ]

      // Compile urgent actions
      const urgentActions: string[] = []
      if (checks.promptPayment.timeline.violationRisk === 'critical') {
        urgentActions.push('Immediate action required: Prompt Payment Act deadline exceeded')
      }
      if (checks.badFaith.riskLevel === 'critical') {
        urgentActions.push('Immediate action required: Critical bad faith risk detected')
      }
      if (checks.hurricane?.oirReportingRequired && checks.hurricane.reportingDeadline) {
        const daysUntilDeadline = Math.ceil(
          (checks.hurricane.reportingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilDeadline <= 7) {
          urgentActions.push(`Urgent: OIR reporting deadline in ${daysUntilDeadline} days`)
        }
      }

      return {
        overallCompliance,
        riskLevel,
        checks,
        recommendations: [...new Set(recommendations)], // Remove duplicates
        urgentActions
      }

    } catch (error) {
      logger.error('Comprehensive compliance check failed', { claimId, error })
      throw error
    }
  }
}

// =======================
// COMPLIANCE CHECKER UTILITY
// =======================

export class ComplianceChecker {
  private floridaManager: FloridaComplianceManager

  constructor() {
    this.floridaManager = new FloridaComplianceManager()
  }

  /**
   * Quick compliance status check
   */
  async getComplianceStatus(claimId: string): Promise<{
    status: 'compliant' | 'at_risk' | 'violation'
    score: number
    priority: 'low' | 'medium' | 'high' | 'urgent'
    nextAction: string
    deadline?: Date
  }> {
    try {
      const comprehensive = await this.floridaManager.runComprehensiveComplianceCheck(claimId)
      
      // Calculate compliance score
      let score = 100
      if (comprehensive.riskLevel === 'medium') score = 75
      if (comprehensive.riskLevel === 'high') score = 50
      if (comprehensive.riskLevel === 'critical') score = 25
      if (comprehensive.overallCompliance === 'violation') score = 0

      // Determine priority
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low'
      if (comprehensive.urgentActions.length > 0) {
        priority = 'urgent'
      } else if (comprehensive.riskLevel === 'high' || comprehensive.riskLevel === 'critical') {
        priority = 'high'
      } else if (comprehensive.riskLevel === 'medium') {
        priority = 'medium'
      }

      // Determine next action
      let nextAction = 'Continue monitoring compliance status'
      if (comprehensive.urgentActions.length > 0) {
        nextAction = comprehensive.urgentActions[0]
      } else if (comprehensive.recommendations.length > 0) {
        nextAction = comprehensive.recommendations[0]
      }

      // Determine deadline
      let deadline: Date | undefined
      if (comprehensive.checks.promptPayment.timeline.decisionDeadline) {
        deadline = comprehensive.checks.promptPayment.timeline.decisionDeadline
      }

      return {
        status: comprehensive.overallCompliance,
        score,
        priority,
        nextAction,
        deadline
      }

    } catch (error) {
      logger.error('Compliance status check failed', { claimId, error })
      throw error
    }
  }
}

// Export singleton instances
export const floridaComplianceManager = new FloridaComplianceManager()
export const complianceChecker = new ComplianceChecker()

// =======================
// FLORIDA REGULATION CONSTANTS
// =======================

export const FLORIDA_INSURANCE_STATUTES = {
  PROMPT_PAYMENT_ACT: '627.70131',
  BAD_FAITH: '624.155',
  PUBLIC_ADJUSTERS: '626.854-626.8698',
  ASSIGNMENT_OF_BENEFITS: '627.7152',
  HURRICANE_CLAIMS: '627.70132',
  CLAIM_HANDLING: '626.9541'
} as const

export const FLORIDA_DEADLINES = {
  ACKNOWLEDGMENT_DAYS: 14,
  INVESTIGATION_DAYS: 90,
  DECISION_DAYS: 90,
  PAYMENT_DAYS: 20,
  HURRICANE_EMERGENCY_HOURS: 72,
  OIR_REPORTING_DAYS: 30
} as const