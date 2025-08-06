/**
 * @fileMetadata
 * @purpose "Comprehensive integration tests for compliance system with existing ClaimGuardian platform"
 * @owner compliance-team
 * @dependencies ["jest", "@testing-library/jest-dom", "vitest"]
 * @exports []
 * @complexity high
 * @tags ["integration-tests", "compliance", "testing", "quality-assurance"]
 * @status production-ready
 * @lastModifiedBy Claude AI Assistant - Compliance Testing Framework
 * @lastModifiedDate 2025-08-06
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Compliance system imports
import { FloridaComplianceManager } from '../../lib/compliance/florida-regulatory-framework'
import { PrivacyComplianceManager, ConsentManager, DataDeletionService } from '../../lib/compliance/privacy-compliance-framework'
import { SOXAuditTrailManager, FinancialControlsMonitor } from '../../lib/compliance/sox-audit-trail-system'
import { LegalDocumentGenerator, DocumentTemplateManager } from '../../lib/compliance/legal-document-generation-engine'
import { RegulatoryReportingManager, OIRReportGenerator } from '../../lib/compliance/automated-regulatory-reporting'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockClaimData, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [mockClaimData], error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [mockClaimData], error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ 
          data: { publicUrl: 'https://test.com/test.pdf' }
        }))
      }))
    }
  }))
}))

// Mock data
const mockClaimData = {
  id: 'test-claim-id',
  user_id: 'test-user-id',
  property_id: 'test-property-id',
  claim_number: 'CG20250001',
  status: 'submitted',
  damage_type: 'hurricane',
  incident_date: '2025-08-01',
  reported_date: '2025-08-02',
  estimated_amount: 50000,
  created_at: '2025-08-02T10:00:00Z',
  updated_at: '2025-08-02T10:00:00Z',
  florida_compliance: [{
    id: 'test-compliance-id',
    initial_contact_completed_at: null,
    investigation_completed_at: null,
    decision_rendered_at: null,
    payment_completed_at: null,
    hurricane_claim: true,
    catastrophic_event_id: 'Hurricane-2025-001'
  }]
}

const mockUserProfile = {
  user_id: 'test-user-id',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567',
  signup_region: 'FL',
  signup_country: 'US',
  created_at: '2025-08-01T00:00:00Z'
}

describe('Compliance System Integration Tests', () => {
  // =======================
  // FLORIDA REGULATORY COMPLIANCE TESTS
  // =======================

  describe('Florida Regulatory Compliance', () => {
    let floridaManager: FloridaComplianceManager

    beforeEach(() => {
      floridaManager = new FloridaComplianceManager()
      vi.clearAllMocks()
    })

    it('should check Florida Insurance Code compliance', async () => {
      const result = await floridaManager.checkInsuranceCodeCompliance('test-claim-id')

      expect(result).toHaveProperty('compliant')
      expect(result).toHaveProperty('violations')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('riskLevel')
      
      expect(Array.isArray(result.violations)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel)
    })

    it('should check Prompt Payment Act compliance', async () => {
      const result = await floridaManager.checkPromptPaymentActCompliance('test-claim-id')

      expect(result).toHaveProperty('compliant')
      expect(result).toHaveProperty('riskLevel')
      expect(result).toHaveProperty('timeline')
      expect(result).toHaveProperty('violations')

      // Verify timeline structure
      expect(result.timeline).toHaveProperty('claimId')
      expect(result.timeline).toHaveProperty('incidentDate')
      expect(result.timeline).toHaveProperty('reportedDate')
      expect(result.timeline).toHaveProperty('acknowledgmentDeadline')
      expect(result.timeline).toHaveProperty('investigationDeadline')
      expect(result.timeline).toHaveProperty('decisionDeadline')
      expect(result.timeline).toHaveProperty('paymentDeadline')
      expect(result.timeline).toHaveProperty('daysRemaining')
      
      expect(typeof result.timeline.daysRemaining).toBe('number')
    })

    it('should assess bad faith risk', async () => {
      const result = await floridaManager.assessBadFaithRisk('test-claim-id')

      expect(result).toHaveProperty('riskLevel')
      expect(result).toHaveProperty('protection')
      expect(result).toHaveProperty('recommendations')

      // Verify protection measures
      expect(result.protection).toHaveProperty('claimId', 'test-claim-id')
      expect(result.protection).toHaveProperty('protectionMeasures')
      expect(result.protection).toHaveProperty('riskFactors')
      expect(result.protection).toHaveProperty('mitigationActions')
      expect(result.protection).toHaveProperty('complianceScore')

      expect(typeof result.protection.complianceScore).toBe('number')
      expect(result.protection.complianceScore).toBeGreaterThanOrEqual(0)
      expect(result.protection.complianceScore).toBeLessThanOrEqual(100)
    })

    it('should run comprehensive compliance check', async () => {
      const result = await floridaManager.runComprehensiveComplianceCheck('test-claim-id')

      expect(result).toHaveProperty('overallCompliance')
      expect(result).toHaveProperty('riskLevel')
      expect(result).toHaveProperty('checks')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('urgentActions')

      // Verify check results
      expect(result.checks).toHaveProperty('insuranceCode')
      expect(result.checks).toHaveProperty('promptPayment')
      expect(result.checks).toHaveProperty('badFaith')

      expect(['compliant', 'at_risk', 'violation']).toContain(result.overallCompliance)
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel)
    })

    it('should validate Assignment of Benefits compliance', async () => {
      // Mock AOB data
      vi.mocked(floridaManager['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-aob-id',
                claim_id: 'test-claim-id',
                contractor_name: 'Test Contractor',
                contractor_license: 'CRC1234567',
                assignment_date: '2025-08-01',
                metadata: {
                  rights_notification: true,
                  revocation_rights_disclosed: true,
                  attorney_fees_disclosed: true,
                  lien_rights_disclosed: true
                }
              },
              error: null
            }))
          }))
        }))
      } as any)

      const result = await floridaManager.validateAOBCompliance('test-aob-id')

      expect(result).toHaveProperty('aobId', 'test-aob-id')
      expect(result).toHaveProperty('claimId')
      expect(result).toHaveProperty('contractorName')
      expect(result).toHaveProperty('contractorLicense')
      expect(result).toHaveProperty('assignmentDate')
      expect(result).toHaveProperty('requiredDisclosures')
      expect(result).toHaveProperty('documentationComplete')
      expect(result).toHaveProperty('complianceStatus')

      expect(['compliant', 'incomplete', 'non_compliant']).toContain(result.complianceStatus)
    })
  })

  // =======================
  // PRIVACY COMPLIANCE TESTS
  // =======================

  describe('Privacy Compliance (GDPR/CCPA)', () => {
    let privacyManager: PrivacyComplianceManager
    let consentManager: ConsentManager
    let dataDeletionService: DataDeletionService

    beforeEach(() => {
      privacyManager = new PrivacyComplianceManager()
      consentManager = new ConsentManager()
      dataDeletionService = new DataDeletionService()
      vi.clearAllMocks()
    })

    it('should check GDPR compliance', async () => {
      // Mock consent data
      vi.mocked(privacyManager['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{
              consent_type: 'gdpr_consent',
              consent_status: 'granted',
              expires_at: '2026-08-01T00:00:00Z',
              created_at: '2025-08-01T00:00:00Z'
            }],
            error: null
          }))
        }))
      } as any)

      const result = await privacyManager.checkGDPRCompliance('test-user-id')

      expect(result).toHaveProperty('compliant')
      expect(result).toHaveProperty('violations')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('dataProcessingActivities')
      expect(result).toHaveProperty('userRights')

      expect(Array.isArray(result.violations)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(Array.isArray(result.dataProcessingActivities)).toBe(true)
      expect(Array.isArray(result.userRights)).toBe(true)
    })

    it('should check CCPA compliance for California residents', async () => {
      // Mock user profile
      vi.mocked(privacyManager['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { ...mockUserProfile, signup_region: 'CA' },
              error: null
            }))
          }))
        }))
      } as any).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      } as any)

      const result = await privacyManager.checkCCPACompliance('test-user-id')

      expect(result).toHaveProperty('applicable')
      expect(result).toHaveProperty('compliant')
      expect(result).toHaveProperty('violations')
      expect(result).toHaveProperty('consumerRights')
      expect(result).toHaveProperty('disclosureRequirements')

      expect(result.applicable).toBe(true) // CA resident
      expect(Array.isArray(result.consumerRights)).toBe(true)
      expect(Array.isArray(result.disclosureRequirements)).toBe(true)
    })

    it('should process privacy requests', async () => {
      const request = {
        userId: 'test-user-id',
        type: 'data_access' as const,
        status: 'received' as const,
        description: 'Request access to personal data',
        requestedData: ['profile', 'claims', 'documents'],
        complianceFramework: 'gdpr' as const
      }

      const result = await privacyManager.processPrivacyRequest(request)

      expect(result).toHaveProperty('requestId')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('responseBy')
      
      expect(['accepted', 'rejected']).toContain(result.status)
      expect(result.responseBy instanceof Date).toBe(true)
      expect(typeof result.requestId).toBe('string')
    })

    it('should record consent', async () => {
      const consent = {
        userId: 'test-user-id',
        consentType: 'gdpr_consent' as const,
        purpose: 'Data processing for claims management',
        legalBasis: 'consent',
        status: 'granted' as const,
        grantedAt: new Date(),
        version: '1.0',
        evidence: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          timestamp: new Date(),
          method: 'explicit' as const,
          context: 'user registration'
        },
        gdprCompliant: true,
        ccpaCompliant: true
      }

      const consentId = await consentManager.recordConsent(consent)

      expect(typeof consentId).toBe('string')
      expect(consentId.length).toBeGreaterThan(0)
    })

    it('should execute data deletion', async () => {
      // Mock retention tracking
      vi.mocked(dataDeletionService['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      } as any)

      // Mock claims check
      vi.mocked(dataDeletionService['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      } as any)

      const result = await dataDeletionService.executeDataDeletion('test-user-id', {
        preserveForLegal: false,
        deleteFromBackups: true,
        notifyThirdParties: true
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('deletedTables')
      expect(result).toHaveProperty('preservedTables')
      expect(result).toHaveProperty('errors')

      expect(typeof result.success).toBe('boolean')
      expect(Array.isArray(result.deletedTables)).toBe(true)
      expect(Array.isArray(result.preservedTables)).toBe(true)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  // =======================
  // SOX AUDIT TRAIL TESTS
  // =======================

  describe('SOX Audit Trail System', () => {
    let auditManager: SOXAuditTrailManager
    let controlsMonitor: FinancialControlsMonitor

    beforeEach(() => {
      auditManager = new SOXAuditTrailManager()
      controlsMonitor = new FinancialControlsMonitor()
      vi.clearAllMocks()
    })

    it('should log SOX-compliant audit events', async () => {
      const event = {
        eventType: 'financial_transaction' as const,
        eventCategory: 'claim_payment',
        eventAction: 'create',
        entityType: 'payment',
        entityId: 'test-payment-id',
        userId: 'test-user-id',
        financialImpact: true,
        controlObjective: 'Accurate recording of financial transactions',
        riskLevel: 'medium' as const,
        description: 'Claim payment processed',
        eventData: {
          amount: 50000,
          payee: 'Test Claimant',
          claim_id: 'test-claim-id'
        },
        metadata: {
          transaction_type: 'claim_settlement'
        }
      }

      const eventId = await auditManager.logAuditEvent(event)

      expect(typeof eventId).toBe('string')
      expect(eventId.length).toBeGreaterThan(0)
    })

    it('should log financial transactions with audit trail', async () => {
      const transaction = {
        transactionId: 'TXN-123456',
        transactionType: 'claim_payment' as const,
        fromParty: 'ClaimGuardian',
        toParty: 'John Doe',
        userId: 'test-user-id',
        amount: 50000,
        currency: 'USD',
        description: 'Hurricane claim settlement',
        authorizedBy: 'manager-user-id',
        authorizationLevel: 'manager' as const,
        approvalWorkflow: ['initial_review', 'manager_approval'],
        status: 'approved' as const,
        supportingDocuments: ['invoice-123', 'damage-report-456'],
        riskAssessment: 'medium' as const,
        complianceFlags: [],
        metadata: {
          claim_id: 'test-claim-id',
          payment_method: 'bank_transfer'
        }
      }

      const transactionId = await auditManager.logFinancialTransaction(transaction)

      expect(typeof transactionId).toBe('string')
      expect(transactionId.length).toBeGreaterThan(0)
    })

    it('should verify audit trail integrity', async () => {
      const fromDate = new Date('2025-08-01')
      const toDate = new Date('2025-08-06')

      // Mock audit events
      vi.mocked(auditManager['supabase'].from).mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'audit-1',
                    event_type: 'financial_transaction',
                    event_category: 'payment',
                    event_action: 'create',
                    entity_type: 'payment',
                    entity_id: 'pay-1',
                    event_hash: 'hash123',
                    chain_hash: 'chain123',
                    created_at: '2025-08-01T10:00:00Z',
                    event_data: { amount: 1000 }
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      } as any)

      const result = await auditManager.verifyAuditTrailIntegrity(fromDate, toDate)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('totalEvents')
      expect(result).toHaveProperty('verifiedEvents')
      expect(result).toHaveProperty('integrityViolations')

      expect(typeof result.valid).toBe('boolean')
      expect(typeof result.totalEvents).toBe('number')
      expect(typeof result.verifiedEvents).toBe('number')
      expect(Array.isArray(result.integrityViolations)).toBe(true)
    })

    it('should monitor financial control effectiveness', async () => {
      const result = await controlsMonitor.monitorControlEffectiveness()

      expect(result).toHaveProperty('totalControls')
      expect(result).toHaveProperty('effectiveControls')
      expect(result).toHaveProperty('deficientControls')
      expect(result).toHaveProperty('materialWeaknesses')
      expect(result).toHaveProperty('controlsNeedingAttention')
      expect(result).toHaveProperty('overallAssessment')

      expect(typeof result.totalControls).toBe('number')
      expect(typeof result.effectiveControls).toBe('number')
      expect(typeof result.deficientControls).toBe('number')
      expect(typeof result.materialWeaknesses).toBe('number')
      expect(Array.isArray(result.controlsNeedingAttention)).toBe(true)
      expect(['effective', 'needs_improvement', 'material_weakness']).toContain(result.overallAssessment)
    })
  })

  // =======================
  // LEGAL DOCUMENT GENERATION TESTS
  // =======================

  describe('Legal Document Generation', () => {
    let documentGenerator: LegalDocumentGenerator
    let templateManager: DocumentTemplateManager

    beforeEach(() => {
      documentGenerator = new LegalDocumentGenerator()
      templateManager = new DocumentTemplateManager()
      vi.clearAllMocks()
    })

    it('should generate Florida claim denial letter', async () => {
      const request = {
        templateId: 'claim_denial_letter',
        variables: {
          companyName: 'Test Insurance Co',
          companyAddress: '123 Main St, Tampa, FL 33601',
          claimantName: 'John Doe',
          claimNumber: 'CG20250001',
          denialReason: 'Damage not covered under policy terms',
          dateOfLoss: new Date('2025-08-01'),
          adjusterName: 'Jane Smith',
          adjusterLicense: 'FL12345'
        },
        claimId: 'test-claim-id',
        userId: 'test-user-id',
        generatedBy: 'test-adjuster-id'
      }

      const document = await documentGenerator.generateDocument(request)

      expect(document).toHaveProperty('id')
      expect(document).toHaveProperty('documentNumber')
      expect(document).toHaveProperty('documentType')
      expect(document).toHaveProperty('htmlContent')
      expect(document).toHaveProperty('pdfPath')
      expect(document).toHaveProperty('pdfaCompliant')
      expect(document).toHaveProperty('complianceChecks')
      expect(document).toHaveProperty('legalStatus')

      expect(typeof document.id).toBe('string')
      expect(typeof document.documentNumber).toBe('string')
      expect(document.documentType).toBe('claim_denial_letter')
      expect(document.pdfaCompliant).toBe(true)
      expect(Array.isArray(document.complianceChecks)).toBe(true)
      expect(['draft', 'under_review', 'approved', 'executed']).toContain(document.legalStatus)
    })

    it('should generate Assignment of Benefits form', async () => {
      const request = {
        templateId: 'assignment_of_benefits',
        variables: {
          propertyOwnerName: 'John Doe',
          propertyAddress: '456 Oak St, Miami, FL 33101',
          contractorName: 'ABC Roofing LLC',
          contractorLicense: 'CRC1234567',
          insuranceCompany: 'State Farm',
          policyNumber: 'POL123456789',
          claimNumber: 'CG20250001',
          dateOfLoss: new Date('2025-08-01')
        },
        claimId: 'test-claim-id',
        userId: 'test-user-id',
        generatedBy: 'test-contractor-id'
      }

      const document = await documentGenerator.generateDocument(request)

      expect(document).toHaveProperty('id')
      expect(document).toHaveProperty('documentType', 'assignment_of_benefits')
      expect(document).toHaveProperty('requiresSignature')
      expect(document.complianceChecks.some(check => 
        check.checkName.includes('Florida Statute') && check.reference === '627.7152'
      )).toBe(true)
    })

    it('should list available templates', async () => {
      const templates = await templateManager.listTemplates()

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)

      // Check template structure
      const template = templates[0]
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('templateName')
      expect(template).toHaveProperty('templateType')
      expect(template).toHaveProperty('version')
      expect(template).toHaveProperty('htmlContent')
      expect(template).toHaveProperty('variables')
      expect(template).toHaveProperty('floridaStatuteReferences')
      expect(template).toHaveProperty('requiredDisclosures')

      expect(Array.isArray(template.variables)).toBe(true)
      expect(Array.isArray(template.floridaStatuteReferences)).toBe(true)
      expect(Array.isArray(template.requiredDisclosures)).toBe(true)
    })

    it('should validate template variables', async () => {
      const template = await templateManager.getTemplate('claim_denial_letter')
      expect(template).not.toBeNull()

      // Test with missing required variable
      const invalidVariables = {
        companyName: 'Test Company'
        // Missing required variables
      }

      await expect(
        documentGenerator.generateDocument({
          templateId: 'claim_denial_letter',
          variables: invalidVariables,
          generatedBy: 'test-user'
        })
      ).rejects.toThrow(/Variable validation failed/)
    })
  })

  // =======================
  // REGULATORY REPORTING TESTS
  // =======================

  describe('Automated Regulatory Reporting', () => {
    let reportingManager: RegulatoryReportingManager
    let oirGenerator: OIRReportGenerator

    beforeEach(() => {
      reportingManager = new RegulatoryReportingManager()
      oirGenerator = new OIRReportGenerator()
      vi.clearAllMocks()
    })

    it('should generate OIR claim report', async () => {
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-09-30')

      const request = {
        reportType: 'oir_claim_report' as const,
        periodStart: startDate,
        periodEnd: endDate,
        generatedBy: 'compliance-officer-id'
      }

      const report = await reportingManager.generateReport(request)

      expect(report).toHaveProperty('id')
      expect(report).toHaveProperty('reportType', 'oir_claim_report')
      expect(report).toHaveProperty('reportPeriod')
      expect(report).toHaveProperty('regulatoryBody', 'florida_oir')
      expect(report).toHaveProperty('reportData')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('validationResults')
      expect(report).toHaveProperty('complianceChecks')
      expect(report).toHaveProperty('status')

      expect(report.reportPeriod.startDate).toEqual(startDate)
      expect(report.reportPeriod.endDate).toEqual(endDate)
      expect(Array.isArray(report.validationResults)).toBe(true)
      expect(Array.isArray(report.complianceChecks)).toBe(true)
      expect(['draft', 'ready_for_review', 'approved']).toContain(report.status)
    })

    it('should generate hurricane loss report', async () => {
      const request = {
        reportType: 'hurricane_loss_report' as const,
        periodStart: new Date('2025-08-01'),
        periodEnd: new Date('2025-08-31'),
        generatedBy: 'compliance-officer-id'
      }

      const report = await reportingManager.generateReport(request)

      expect(report.reportType).toBe('hurricane_loss_report')
      expect(report.reportData).toHaveProperty('summary')
      expect(report.reportData).toHaveProperty('hurricaneEvents')
      expect(Array.isArray((report.reportData as any).hurricaneEvents)).toBe(true)
    })

    it('should submit report to regulatory body', async () => {
      // First generate a report
      const report = await reportingManager.generateReport({
        reportType: 'oir_claim_report',
        periodStart: new Date('2025-07-01'),
        periodEnd: new Date('2025-09-30'),
        generatedBy: 'compliance-officer-id'
      })

      // Then submit it
      const submissionResult = await reportingManager.submitReport(report.id, 'compliance-officer-id')

      expect(submissionResult).toHaveProperty('success')
      expect(submissionResult).toHaveProperty('submissionId')
      
      if (submissionResult.success) {
        expect(typeof submissionResult.submissionId).toBe('string')
        expect(submissionResult.submissionId!.length).toBeGreaterThan(0)
      } else {
        expect(Array.isArray(submissionResult.errors)).toBe(true)
      }
    })

    it('should generate specific OIR claim statistics', async () => {
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-09-30')

      const oirReport = await oirGenerator.generateOIRClaimReport(startDate, endDate)

      expect(oirReport).toHaveProperty('reportId')
      expect(oirReport).toHaveProperty('reportingPeriod')
      expect(oirReport).toHaveProperty('companyName')
      expect(oirReport).toHaveProperty('naicCode')
      expect(oirReport).toHaveProperty('claimStatistics')
      expect(oirReport).toHaveProperty('complianceMetrics')

      // Verify claim statistics structure
      const stats = oirReport.claimStatistics
      expect(stats).toHaveProperty('totalClaimsReceived')
      expect(stats).toHaveProperty('totalClaimsClosed')
      expect(stats).toHaveProperty('totalPaymentsIssued')
      expect(stats).toHaveProperty('totalAmountPaid')
      expect(stats).toHaveProperty('averageProcessingTime')
      expect(stats).toHaveProperty('byClaimType')
      expect(stats).toHaveProperty('hurricaneRelated')

      expect(typeof stats.totalClaimsReceived).toBe('number')
      expect(typeof stats.averageProcessingTime).toBe('number')
      expect(Array.isArray(stats.hurricaneRelated)).toBe(true)

      // Verify compliance metrics structure
      const compliance = oirReport.complianceMetrics
      expect(compliance).toHaveProperty('promptPaymentCompliance')
      expect(compliance).toHaveProperty('badFaithClaims')
      expect(compliance).toHaveProperty('consumerComplaints')

      expect(compliance.promptPaymentCompliance).toHaveProperty('totalClaims')
      expect(compliance.promptPaymentCompliance).toHaveProperty('compliantClaims')
      expect(compliance.promptPaymentCompliance).toHaveProperty('violations')
    })
  })

  // =======================
  // INTEGRATION AND E2E TESTS
  // =======================

  describe('End-to-End Compliance Workflows', () => {
    it('should handle complete claim compliance lifecycle', async () => {
      const floridaManager = new FloridaComplianceManager()
      const auditManager = new SOXAuditTrailManager()
      const documentGenerator = new LegalDocumentGenerator()

      // 1. Check initial compliance
      const initialCompliance = await floridaManager.checkInsuranceCodeCompliance('test-claim-id')
      expect(initialCompliance).toHaveProperty('compliant')

      // 2. Log compliance check event
      const auditId = await auditManager.logAuditEvent({
        eventType: 'system_action',
        eventCategory: 'compliance_check',
        eventAction: 'florida_insurance_code',
        entityType: 'claim',
        entityId: 'test-claim-id',
        financialImpact: false,
        controlObjective: 'Ensure regulatory compliance',
        riskLevel: 'medium',
        description: 'Florida Insurance Code compliance check',
        eventData: {
          compliance_result: initialCompliance.compliant,
          risk_level: initialCompliance.riskLevel
        },
        metadata: {}
      })
      expect(typeof auditId).toBe('string')

      // 3. Generate legal document if needed
      if (!initialCompliance.compliant) {
        const denialLetter = await documentGenerator.generateDocument({
          templateId: 'claim_denial_letter',
          variables: {
            companyName: 'ClaimGuardian',
            companyAddress: '100 S Ashley Dr, Tampa, FL 33602',
            claimantName: 'Test Claimant',
            claimNumber: 'CG20250001',
            denialReason: 'Policy exclusion applies',
            dateOfLoss: new Date('2025-08-01'),
            adjusterName: 'Test Adjuster',
            adjusterLicense: 'FL12345'
          },
          claimId: 'test-claim-id',
          generatedBy: 'system'
        })
        expect(denialLetter).toHaveProperty('id')
        expect(denialLetter.pdfaCompliant).toBe(true)
      }

      // This workflow demonstrates integration between all compliance components
    })

    it('should handle privacy request with audit logging', async () => {
      const privacyManager = new PrivacyComplianceManager()
      const auditManager = new SOXAuditTrailManager()
      const dataDeletionService = new DataDeletionService()

      // 1. Process privacy request
      const privacyRequest = await privacyManager.processPrivacyRequest({
        userId: 'test-user-id',
        type: 'data_erasure',
        status: 'received',
        description: 'Delete my personal data',
        complianceFramework: 'gdpr'
      })

      expect(privacyRequest).toHaveProperty('requestId')

      // 2. Log privacy request processing
      const auditId = await auditManager.logAuditEvent({
        eventType: 'privacy_request',
        eventCategory: 'data_processing',
        eventAction: 'erasure_request',
        entityType: 'user',
        entityId: 'test-user-id',
        financialImpact: false,
        controlObjective: 'GDPR compliance',
        riskLevel: 'medium',
        description: 'Data erasure request processed',
        eventData: {
          request_id: privacyRequest.requestId,
          request_type: 'data_erasure',
          framework: 'gdpr'
        },
        metadata: {}
      })
      expect(typeof auditId).toBe('string')

      // 3. Execute data deletion if approved
      if (privacyRequest.status === 'accepted') {
        const deletionResult = await dataDeletionService.executeDataDeletion('test-user-id')
        expect(deletionResult).toHaveProperty('success')
        expect(deletionResult).toHaveProperty('deletedTables')
      }
    })

    it('should generate regulatory report with compliance validation', async () => {
      const reportingManager = new RegulatoryReportingManager()
      const floridaManager = new FloridaComplianceManager()

      // 1. Generate quarterly OIR report
      const report = await reportingManager.generateReport({
        reportType: 'oir_claim_report',
        periodStart: new Date('2025-07-01'),
        periodEnd: new Date('2025-09-30'),
        generatedBy: 'compliance-officer'
      })

      expect(report).toHaveProperty('id')
      expect(report.validationResults.filter(v => v.severity === 'error').length).toBe(0)

      // 2. Verify compliance checks pass
      const compliancePassRate = report.complianceChecks.filter(c => c.passed).length / report.complianceChecks.length
      expect(compliancePassRate).toBeGreaterThan(0.8) // 80% compliance threshold

      // 3. Submit if validation passes
      if (report.validationResults.every(v => v.severity !== 'error')) {
        const submission = await reportingManager.submitReport(report.id, 'compliance-officer')
        expect(submission).toHaveProperty('success')
      }
    })
  })

  // =======================
  // ERROR HANDLING AND RESILIENCE TESTS
  // =======================

  describe('Error Handling and System Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database error
      vi.mocked(createClient).mockImplementationOnce(() => {
        throw new Error('Database connection failed')
      })

      const floridaManager = new FloridaComplianceManager()

      await expect(
        floridaManager.checkInsuranceCodeCompliance('test-claim-id')
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle malformed data in compliance checks', async () => {
      // Mock malformed claim data
      vi.mocked(createClient().from('claims').select).mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'test-id', invalid_field: 'bad data' }, 
            error: null 
          }))
        }))
      } as any)

      const floridaManager = new FloridaComplianceManager()
      
      // Should not throw, should handle gracefully
      const result = await floridaManager.checkInsuranceCodeCompliance('test-claim-id')
      expect(result).toHaveProperty('violations')
      expect(Array.isArray(result.violations)).toBe(true)
    })

    it('should validate input parameters', async () => {
      const documentGenerator = new LegalDocumentGenerator()

      // Test with invalid template ID
      await expect(
        documentGenerator.generateDocument({
          templateId: 'non-existent-template',
          variables: {},
          generatedBy: 'test-user'
        })
      ).rejects.toThrow(/Template not found/)

      // Test with missing required fields
      await expect(
        documentGenerator.generateDocument({
          templateId: 'claim_denial_letter',
          variables: {}, // Empty variables object
          generatedBy: 'test-user'
        })
      ).rejects.toThrow(/Variable validation failed/)
    })

    it('should handle concurrent compliance operations', async () => {
      const floridaManager = new FloridaComplianceManager()
      
      // Run multiple compliance checks concurrently
      const promises = [
        floridaManager.checkInsuranceCodeCompliance('test-claim-1'),
        floridaManager.checkInsuranceCodeCompliance('test-claim-2'),
        floridaManager.checkInsuranceCodeCompliance('test-claim-3')
      ]

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toHaveProperty('compliant')
        expect(result).toHaveProperty('riskLevel')
      })
    })
  })
})