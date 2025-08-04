/**
 * @fileMetadata
 * @purpose Critical claim filing flow tests
 * @owner claims-team
 * @complexity high
 * @tags ["testing", "claims", "critical-flow", "insurance"]  
 * @status active
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Claim Filing - Critical Tests', () => {
  describe('Damage Documentation', () => {
    it('should validate required damage documentation', () => {
      interface DamageEvidence {
        photos: Array<{ url: string; description: string; timestamp: string }>
        videos: Array<{ url: string; description: string; duration: number }>
        documents: Array<{ url: string; type: string; description: string }>
        witnessStatements: Array<{ name: string; contact: string; statement: string }>
      }

      const validateDamageEvidence = (evidence: Partial<DamageEvidence>) => {
        const errors: string[] = []
        const warnings: string[] = []

        // Photos are required
        if (!evidence.photos || evidence.photos.length === 0) {
          errors.push('At least one photo of damage is required')
        } else {
          if (evidence.photos.length < 3) {
            warnings.push('Consider uploading more photos for better documentation')
          }
          
          // Validate photo descriptions
          const photosWithoutDescription = evidence.photos.filter(photo => !photo.description?.trim())
          if (photosWithoutDescription.length > 0) {
            warnings.push('All photos should have descriptions')
          }
        }

        // Videos are helpful but not required
        if (evidence.videos && evidence.videos.length > 0) {
          const longVideos = evidence.videos.filter(video => video.duration > 300) // 5 minutes
          if (longVideos.length > 0) {
            warnings.push('Videos longer than 5 minutes may not be fully reviewed')
          }
        }

        // Documents validation
        if (evidence.documents && evidence.documents.length > 0) {
          const allowedDocTypes = ['receipt', 'estimate', 'invoice', 'report', 'contract']
          const invalidDocs = evidence.documents.filter(doc => !allowedDocTypes.includes(doc.type))
          if (invalidDocs.length > 0) {
            errors.push(`Invalid document types: ${invalidDocs.map(d => d.type).join(', ')}`)
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          completenessScore: calculateCompletenessScore(evidence)
        }
      }

      const calculateCompletenessScore = (evidence: Partial<DamageEvidence>) => {
        let score = 0
        
        // Photos (40 points max)
        if (evidence.photos) {
          score += Math.min(40, evidence.photos.length * 10)
          if (evidence.photos.every(p => p.description?.trim())) {
            score += 10 // Bonus for descriptions
          }
        }

        // Videos (20 points max)  
        if (evidence.videos && evidence.videos.length > 0) {
          score += Math.min(20, evidence.videos.length * 10)
        }

        // Documents (30 points max)
        if (evidence.documents) {
          score += Math.min(30, evidence.documents.length * 10)
        }

        // Witness statements (10 points max)
        if (evidence.witnessStatements && evidence.witnessStatements.length > 0) {
          score += Math.min(10, evidence.witnessStatements.length * 5)
        }

        return Math.min(100, score)
      }

      // Test insufficient evidence
      const poorEvidence = { photos: [] }
      const poorValidation = validateDamageEvidence(poorEvidence)
      expect(poorValidation.isValid).toBe(false)
      expect(poorValidation.errors).toContain('At least one photo of damage is required')
      expect(poorValidation.completenessScore).toBe(0)

      // Test minimal but valid evidence
      const minimalEvidence = {
        photos: [
          { url: 'photo1.jpg', description: 'Roof damage from storm', timestamp: '2024-08-04T10:00:00Z' }
        ]
      }
      const minimalValidation = validateDamageEvidence(minimalEvidence)
      expect(minimalValidation.isValid).toBe(true)
      expect(minimalValidation.warnings).toContain('Consider uploading more photos for better documentation')
      expect(minimalValidation.completenessScore).toBe(20) // 10 for photo + 10 for description

      // Test comprehensive evidence
      const comprehensiveEvidence = {
        photos: [
          { url: 'photo1.jpg', description: 'Overview of roof damage', timestamp: '2024-08-04T10:00:00Z' },
          { url: 'photo2.jpg', description: 'Close-up of missing shingles', timestamp: '2024-08-04T10:05:00Z' },
          { url: 'photo3.jpg', description: 'Interior water damage in bedroom', timestamp: '2024-08-04T10:10:00Z' },
          { url: 'photo4.jpg', description: 'Damaged personal property', timestamp: '2024-08-04T10:15:00Z' }
        ],
        videos: [
          { url: 'video1.mp4', description: 'Walkthrough of damage', duration: 120 }
        ],
        documents: [
          { url: 'receipt1.pdf', type: 'receipt', description: 'Emergency repair receipt' },
          { url: 'estimate1.pdf', type: 'estimate', description: 'Contractor repair estimate' }
        ],
        witnessStatements: [
          { name: 'John Neighbor', contact: 'john@email.com', statement: 'Saw the tree fall on the roof' }
        ]
      }
      
      const comprehensiveValidation = validateDamageEvidence(comprehensiveEvidence)
      expect(comprehensiveValidation.isValid).toBe(true)
      expect(comprehensiveValidation.errors).toHaveLength(0)
      expect(comprehensiveValidation.completenessScore).toBe(100) // Perfect score
    })

    it('should validate file uploads securely', () => {
      const validateFileUpload = (file: { name: string; size: number; type: string }) => {
        const errors: string[] = []
        
        // File size limits (10MB for photos, 100MB for videos)
        const maxSizes = {
          image: 10 * 1024 * 1024, // 10MB
          video: 100 * 1024 * 1024, // 100MB
          document: 25 * 1024 * 1024 // 25MB
        }

        let category: keyof typeof maxSizes = 'document'
        if (file.type.startsWith('image/')) category = 'image'
        else if (file.type.startsWith('video/')) category = 'video'

        if (file.size > maxSizes[category]) {
          errors.push(`File too large. Maximum size for ${category}s is ${maxSizes[category] / (1024 * 1024)}MB`)
        }

        // File type validation
        const allowedTypes = {
          image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
          video: ['video/mp4', 'video/mov', 'video/avi'],
          document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        }

        if (!allowedTypes[category].includes(file.type)) {
          errors.push(`Invalid file type. Allowed types for ${category}s: ${allowedTypes[category].join(', ')}`)
        }

        // File name validation (security)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const hasUnsafeChars = sanitizedName !== file.name

        if (hasUnsafeChars) {
          errors.push('File name contains unsafe characters')
        }

        // Executable file check
        const executableExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs']
        const hasExecutableExtension = executableExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )

        if (hasExecutableExtension) {
          errors.push('Executable files are not allowed')
        }

        return {
          isValid: errors.length === 0,
          errors,
          sanitizedName,
          category
        }
      }

      // Valid files
      expect(validateFileUpload({
        name: 'damage_photo.jpg',
        size: 5 * 1024 * 1024, // 5MB
        type: 'image/jpeg'
      })).toEqual({
        isValid: true,
        errors: [],
        sanitizedName: 'damage_photo.jpg',
        category: 'image'
      })

      // Too large
      expect(validateFileUpload({
        name: 'huge_video.mp4',
        size: 150 * 1024 * 1024, // 150MB
        type: 'video/mp4'
      }).isValid).toBe(false)

      // Unsafe file type
      expect(validateFileUpload({
        name: 'malware.exe',
        size: 1024,
        type: 'application/octet-stream'
      }).errors).toContain('Executable files are not allowed')

      // Unsafe characters in name
      expect(validateFileUpload({
        name: 'file<script>alert("xss")</script>.jpg',
        size: 1024 * 1024,
        type: 'image/jpeg'
      }).errors).toContain('File name contains unsafe characters')
    })
  })

  describe('Claim Amount Calculation', () => {
    it('should calculate claim amounts based on damage assessment', () => {
      interface DamageAssessment {
        structuralDamage: {
          roof: { severity: number; area: number } // severity 0-100, area in sq ft
          walls: { severity: number; area: number }
          foundation: { severity: number; area: number }
        }
        personalProperty: Array<{
          item: string
          originalValue: number
          currentValue: number
          damagePercent: number
        }>
        additionalLivingExpenses: {
          displacement: boolean
          estimatedDays: number
          dailyCost: number
        }
      }

      const calculateClaimAmount = (assessment: DamageAssessment, policy: {
        dwellingCoverage: number
        personalPropertyCoverage: number
        aleCoverage: number
        deductible: number
      }) => {
        // Structural damage calculation
        const roofCost = (assessment.structuralDamage.roof.severity / 100) * 
                        (assessment.structuralDamage.roof.area * 15) // $15/sq ft estimate
        
        const wallCost = (assessment.structuralDamage.walls.severity / 100) * 
                        (assessment.structuralDamage.walls.area * 8) // $8/sq ft estimate
        
        const foundationCost = (assessment.structuralDamage.foundation.severity / 100) * 
                              (assessment.structuralDamage.foundation.area * 25) // $25/sq ft estimate

        const totalStructuralCost = roofCost + wallCost + foundationCost

        // Personal property calculation
        const personalPropertyCost = assessment.personalProperty.reduce((total, item) => {
          return total + (item.currentValue * (item.damagePercent / 100))
        }, 0)

        // Additional living expenses
        const aleCost = assessment.additionalLivingExpenses.displacement ? 
          assessment.additionalLivingExpenses.estimatedDays * assessment.additionalLivingExpenses.dailyCost : 0

        // Apply policy limits
        const dwellingClaim = Math.min(totalStructuralCost, policy.dwellingCoverage)
        const personalPropertyClaim = Math.min(personalPropertyCost, policy.personalPropertyCoverage)  
        const aleClaim = Math.min(aleCost, policy.aleCoverage)

        const totalBeforeDeductible = dwellingClaim + personalPropertyClaim + aleClaim
        const totalAfterDeductible = Math.max(0, totalBeforeDeductible - policy.deductible)

        return {
          breakdown: {
            structural: {
              roof: Math.round(roofCost),
              walls: Math.round(wallCost),
              foundation: Math.round(foundationCost),
              total: Math.round(totalStructuralCost),
              covered: Math.round(dwellingClaim)
            },
            personalProperty: {
              total: Math.round(personalPropertyCost),
              covered: Math.round(personalPropertyClaim)
            },
            additionalLivingExpenses: {
              total: Math.round(aleCost),
              covered: Math.round(aleClaim)
            }
          },
          summary: {
            totalDamage: Math.round(totalStructuralCost + personalPropertyCost + aleCost),
            totalCovered: Math.round(totalBeforeDeductible),
            deductible: policy.deductible,
            estimatedPayout: Math.round(totalAfterDeductible)
          },
          warnings: [
            ...(totalStructuralCost > policy.dwellingCoverage ? ['Structural damage exceeds dwelling coverage limit'] : []),
            ...(personalPropertyCost > policy.personalPropertyCoverage ? ['Personal property damage exceeds coverage limit'] : []),
            ...(aleCost > policy.aleCoverage ? ['Additional living expenses exceed coverage limit'] : [])
          ]
        }
      }

      const majorDamageAssessment = {
        structuralDamage: {
          roof: { severity: 75, area: 2000 }, // 75% damage to 2000 sq ft roof
          walls: { severity: 25, area: 1500 }, // 25% damage to 1500 sq ft walls  
          foundation: { severity: 10, area: 1800 } // 10% damage to 1800 sq ft foundation
        },
        personalProperty: [
          { item: 'Furniture', originalValue: 15000, currentValue: 10000, damagePercent: 80 },
          { item: 'Electronics', originalValue: 8000, currentValue: 5000, damagePercent: 100 },
          { item: 'Clothing', originalValue: 5000, currentValue: 3000, damagePercent: 50 }
        ],
        additionalLivingExpenses: {
          displacement: true,
          estimatedDays: 90,
          dailyCost: 150
        }
      }

      const policy = {
        dwellingCoverage: 300000,
        personalPropertyCoverage: 150000,
        aleCoverage: 30000,
        deductible: 5000
      }

      const calculation = calculateClaimAmount(majorDamageAssessment, policy)

      // Verify structural calculations
      expect(calculation.breakdown.structural.roof).toBe(22500) // 75% of 2000 * $15
      expect(calculation.breakdown.structural.walls).toBe(3000) // 25% of 1500 * $8
      expect(calculation.breakdown.structural.foundation).toBe(4500) // 10% of 1800 * $25
      expect(calculation.breakdown.structural.total).toBe(30000)

      // Verify personal property
      expect(calculation.breakdown.personalProperty.total).toBe(14500) // 8000 + 5000 + 1500

      // Verify ALE
      expect(calculation.breakdown.additionalLivingExpenses.total).toBe(13500) // 90 * 150

      // Verify final payout
      expect(calculation.summary.totalDamage).toBe(58000)
      expect(calculation.summary.estimatedPayout).toBe(53000) // 58000 - 5000 deductible

      // Test policy limits
      const excessiveDamage = {
        ...majorDamageAssessment,
        structuralDamage: {
          roof: { severity: 100, area: 3000 }, // Would cost $450,000
          walls: { severity: 0, area: 0 },
          foundation: { severity: 0, area: 0 }
        }
      }

      const excessiveCalculation = calculateClaimAmount(excessiveDamage, policy)
      expect(excessiveCalculation.breakdown.structural.covered).toBe(300000) // Limited by policy
      expect(excessiveCalculation.warnings).toContain('Structural damage exceeds dwelling coverage limit')
    })
  })

  describe('Claim Status Tracking', () => {
    it('should validate claim status transitions', () => {
      const VALID_STATUSES = [
        'draft',
        'submitted', 
        'under-review',
        'additional-info-required',
        'approved',
        'denied',
        'closed',
        'reopened'
      ]

      const VALID_TRANSITIONS = {
        'draft': ['submitted'],
        'submitted': ['under-review', 'additional-info-required'],
        'under-review': ['approved', 'denied', 'additional-info-required'],
        'additional-info-required': ['under-review'],
        'approved': ['closed'],
        'denied': ['reopened', 'closed'],
        'closed': ['reopened'],
        'reopened': ['under-review']
      }

      const validateStatusTransition = (currentStatus: string, newStatus: string) => {
        if (!VALID_STATUSES.includes(currentStatus) || !VALID_STATUSES.includes(newStatus)) {
          return { isValid: false, error: 'Invalid status' }
        }

        const allowedTransitions = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || []
        
        if (!allowedTransitions.includes(newStatus)) {
          return { 
            isValid: false, 
            error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}` 
          }
        }

        return { isValid: true, error: null }
      }

      // Valid transitions
      expect(validateStatusTransition('draft', 'submitted')).toEqual({ isValid: true, error: null })
      expect(validateStatusTransition('submitted', 'under-review')).toEqual({ isValid: true, error: null })
      expect(validateStatusTransition('under-review', 'approved')).toEqual({ isValid: true, error: null })

      // Invalid transitions
      expect(validateStatusTransition('draft', 'approved').isValid).toBe(false)
      expect(validateStatusTransition('approved', 'under-review').isValid).toBe(false)
      expect(validateStatusTransition('closed', 'submitted').isValid).toBe(false)

      // Invalid statuses
      expect(validateStatusTransition('invalid-status', 'submitted').isValid).toBe(false)
    })

    it('should track claim timeline and required actions', () => {
      interface ClaimEvent {
        timestamp: string
        status: string
        actor: 'user' | 'adjuster' | 'system'
        description: string
        requiredAction?: string
      }

      const analyzeClaimProgress = (events: ClaimEvent[]) => {
        const sortedEvents = events.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        const currentStatus = sortedEvents[sortedEvents.length - 1]?.status || 'draft'
        const daysSinceLastUpdate = Math.floor(
          (Date.now() - new Date(sortedEvents[sortedEvents.length - 1]?.timestamp || Date.now()).getTime()) / 
          (1000 * 60 * 60 * 24)
        )

        // Calculate processing time for each stage
        const stageTimings: Record<string, number> = {}
        for (let i = 1; i < sortedEvents.length; i++) {
          const currentEvent = sortedEvents[i]
          const previousEvent = sortedEvents[i - 1]
          const daysInStage = Math.floor(
            (new Date(currentEvent.timestamp).getTime() - new Date(previousEvent.timestamp).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
          stageTimings[previousEvent.status] = daysInStage
        }

        // Identify delays and required actions
        const delays = []
        const requiredActions = []

        if (currentStatus === 'additional-info-required' && daysSinceLastUpdate > 5) {
          delays.push('Waiting for user response > 5 days')
          requiredActions.push('Provide requested additional information')
        }

        if (currentStatus === 'under-review' && daysSinceLastUpdate > 30) {
          delays.push('Under review > 30 days')
          requiredActions.push('Contact adjuster for status update')
        }

        const totalProcessingDays = sortedEvents.length > 1 ? Math.floor(
          (new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime() - 
           new Date(sortedEvents[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
        ) : 0

        return {
          currentStatus,
          daysSinceLastUpdate,
          totalProcessingDays,
          stageTimings,
          delays,
          requiredActions,
          isStalled: delays.length > 0,
          expectedResolutionDays: calculateExpectedResolution(currentStatus, stageTimings)
        }
      }

      const calculateExpectedResolution = (status: string, timings: Record<string, number>) => {
        const averageTimings = {
          'submitted': 3,
          'under-review': 14,
          'additional-info-required': 7
        }

        switch (status) {
          case 'submitted':
            return averageTimings['submitted'] + averageTimings['under-review']
          case 'under-review':
            return averageTimings['under-review']
          case 'additional-info-required':
            return averageTimings['additional-info-required'] + averageTimings['under-review']
          default:
            return 0
        }
      }

      const claimEvents: ClaimEvent[] = [
        { timestamp: '2024-07-01T10:00:00Z', status: 'draft', actor: 'user', description: 'Claim created' },
        { timestamp: '2024-07-03T14:30:00Z', status: 'submitted', actor: 'user', description: 'Claim submitted' },
        { timestamp: '2024-07-05T09:15:00Z', status: 'under-review', actor: 'system', description: 'Assigned to adjuster' },
        { timestamp: '2024-07-20T16:45:00Z', status: 'additional-info-required', actor: 'adjuster', description: 'Requested contractor estimates' }
      ]

      const analysis = analyzeClaimProgress(claimEvents)
      
      expect(analysis.currentStatus).toBe('additional-info-required')
      expect(analysis.stageTimings['submitted']).toBe(2) // 2 days from submitted to under-review
      expect(analysis.stageTimings['under-review']).toBe(15) // 15 days from under-review to additional-info-required
      expect(analysis.totalProcessingDays).toBe(19)
      
      // If current date is August 4, it's been 15 days since last update
      if (analysis.daysSinceLastUpdate > 5) {
        expect(analysis.delays).toContain('Waiting for user response > 5 days')
        expect(analysis.requiredActions).toContain('Provide requested additional information')
        expect(analysis.isStalled).toBe(true)
      }
    })
  })
})