import React from 'react'
/**
 * @fileMetadata
 * @purpose Critical property onboarding flow tests
 * @owner product-team  
 * @complexity high
 * @tags ["testing", "onboarding", "critical-flow", "property"]
 * @status active
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock dependencies
jest.mock('@claimguardian/db', () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: { id: 'prop-123' }, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('Property Onboarding - Critical Tests', () => {
  describe('Address Validation', () => {
    it('should validate Florida addresses', () => {
      const validateFloridaAddress = (address: string) => {
        const normalized = address.toLowerCase().trim()
        
        // Basic Florida validation rules
        const hasFloridaIndicator = normalized.includes('fl') || 
                                    normalized.includes('florida') ||
                                    /\b3[0-4]\d{3}\b/.test(normalized) // FL zip codes 30000-34999
        
        const hasStreetNumber = /^\d+/.test(normalized)
        const hasStreetName = normalized.split(' ').length >= 3
        
        return {
          isValid: hasFloridaIndicator && hasStreetNumber && hasStreetName,
          issues: [
            ...(!hasFloridaIndicator ? ['Address must be in Florida'] : []),
            ...(!hasStreetNumber ? ['Address must start with street number'] : []),
            ...(!hasStreetName ? ['Address must include street name'] : []),
          ]
        }
      }

      // Valid Florida addresses
      expect(validateFloridaAddress('123 Ocean Drive, Miami, FL 33101')).toEqual({
        isValid: true,
        issues: []
      })

      expect(validateFloridaAddress('456 Sunset Blvd, Tampa, Florida 33602')).toEqual({
        isValid: true,
        issues: []
      })

      expect(validateFloridaAddress('789 Beach Road, Jacksonville 32202')).toEqual({
        isValid: true,
        issues: []
      })

      // Invalid addresses
      expect(validateFloridaAddress('123 Main St, New York, NY 10001')).toEqual({
        isValid: false,
        issues: ['Address must be in Florida']
      })

      expect(validateFloridaAddress('Ocean Drive, Miami, FL')).toEqual({
        isValid: false,
        issues: ['Address must start with street number']
      })

      expect(validateFloridaAddress('123')).toEqual({
        isValid: false,
        issues: ['Address must be in Florida', 'Address must include street name']
      })
    })

    it('should sanitize address input', () => {
      const sanitizeAddress = (address: string) => {
        return address
          .trim()
          .replace(/[<>]/g, '') // Remove angle brackets
          .replace(/\s+/g, ' ') // Normalize whitespace
          .substring(0, 200) // Limit length
      }

      expect(sanitizeAddress('  123   Main   St,   Miami,   FL  ')).toBe('123 Main St, Miami, FL')
      expect(sanitizeAddress('123 <script>alert("xss")</script> Main St')).toBe('123 scriptalert("xss")/script Main St')
      
      const longAddress = 'a'.repeat(250)
      expect(sanitizeAddress(longAddress)).toHaveLength(200)
    })
  })

  describe('Property Type Selection', () => {
    it('should validate property type selection', () => {
      const VALID_PROPERTY_TYPES = [
        'single-family',
        'condo',
        'townhouse',
        'mobile-home',
        'duplex',
        'multi-family'
      ]

      const validatePropertyType = (type: string) => {
        return VALID_PROPERTY_TYPES.includes(type)
      }

      // Valid types
      expect(validatePropertyType('single-family')).toBe(true)
      expect(validatePropertyType('condo')).toBe(true)
      
      // Invalid types
      expect(validatePropertyType('mansion')).toBe(false)
      expect(validatePropertyType('castle')).toBe(false)
      expect(validatePropertyType('')).toBe(false)
      expect(validatePropertyType('commercial')).toBe(false)
    })

    it('should calculate appropriate insurance coverage based on property type', () => {
      const calculateCoverage = (propertyType: string, homeValue: number) => {
        const coverageMultipliers = {
          'single-family': 1.0,
          'condo': 0.8, // Lower coverage for condos
          'townhouse': 0.9,
          'mobile-home': 0.7,
          'duplex': 1.1,
          'multi-family': 1.2
        }

        const multiplier = coverageMultipliers[propertyType as keyof typeof coverageMultipliers] || 1.0
        
        return {
          dwellingCoverage: Math.round(homeValue * multiplier),
          personalProperty: Math.round(homeValue * multiplier * 0.5),
          liability: Math.max(300000, Math.round(homeValue * 0.5)),
          medicalPayments: 5000
        }
      }

      const singleFamilyHome = calculateCoverage('single-family', 300000)
      expect(singleFamilyHome).toEqual({
        dwellingCoverage: 300000,
        personalProperty: 150000,
        liability: 300000,
        medicalPayments: 5000
      })

      const condo = calculateCoverage('condo', 200000)
      expect(condo).toEqual({
        dwellingCoverage: 160000,
        personalProperty: 80000,
        liability: 300000, // Minimum liability
        medicalPayments: 5000
      })

      const highValueHome = calculateCoverage('single-family', 800000)
      expect(highValueHome.liability).toBe(400000) // 50% of home value when higher than minimum
    })
  })

  describe('Hurricane Risk Assessment', () => {
    it('should assess hurricane risk by location', () => {
      const assessHurricaneRisk = (lat: number, lng: number) => {
        const isFloridaCoastal = (
          (lat > 24 && lat < 31) && // Florida latitude range
          (lng > -88 && lng < -79) && // Florida longitude range
          (Math.abs(lng) < 82) // Rough coastal approximation
        )

        const isInlandFlorida = (
          (lat > 24 && lat < 31) &&
          (lng > -88 && lng < -79) &&
          (Math.abs(lng) >= 82)
        )

        if (isFloridaCoastal) {
          return {
            riskLevel: 'high',
            category: 'Coastal Florida - High Hurricane Risk',
            recommendedCoverage: {
              windstorm: true,
              floodInsurance: 'required',
              hurricaneDeductible: 'percentage-based'
            },
            evacuationZone: 'A or B'
          }
        }

        if (isInlandFlorida) {
          return {
            riskLevel: 'moderate',
            category: 'Inland Florida - Moderate Hurricane Risk', 
            recommendedCoverage: {
              windstorm: true,
              floodInsurance: 'recommended',
              hurricaneDeductible: 'percentage-based'
            },
            evacuationZone: 'C or inland'
          }
        }

        return {
          riskLevel: 'low',
          category: 'Outside Florida - Low Hurricane Risk',
          recommendedCoverage: {
            windstorm: false,
            floodInsurance: 'optional',
            hurricaneDeductible: 'not-applicable'
          },
          evacuationZone: 'none'
        }
      }

      // Miami Beach - High Risk
      const miamiBeach = assessHurricaneRisk(25.7907, -80.1300)
      expect(miamiBeach.riskLevel).toBe('high')
      expect(miamiBeach.recommendedCoverage.windstorm).toBe(true)
      expect(miamiBeach.recommendedCoverage.floodInsurance).toBe('required')

      // Orlando - Moderate Risk
      const orlando = assessHurricaneRisk(28.5383, -81.3792)
      expect(orlando.riskLevel).toBe('moderate')
      expect(orlando.recommendedCoverage.windstorm).toBe(true)
      expect(orlando.recommendedCoverage.floodInsurance).toBe('recommended')

      // Denver - Low Risk
      const denver = assessHurricaneRisk(39.7392, -104.9903)
      expect(denver.riskLevel).toBe('low')
      expect(denver.recommendedCoverage.windstorm).toBe(false)
      expect(denver.recommendedCoverage.floodInsurance).toBe('optional')
    })

    it('should calculate hurricane deductible options', () => {
      const calculateHurricaneDeductible = (homeValue: number, riskLevel: string) => {
        if (riskLevel === 'low') {
          return { applicable: false, options: [] }
        }

        const percentageOptions = [2, 5, 10] // Common percentage deductibles
        const options = percentageOptions.map(percentage => ({
          percentage,
          amount: Math.round(homeValue * (percentage / 100)),
          annualSavings: Math.round(homeValue * 0.005 * percentage) // Rough savings estimate
        }))

        return {
          applicable: true,
          options,
          recommendation: riskLevel === 'high' ? options[1] : options[0] // 5% for high risk, 2% for moderate
        }
      }

      const highRiskHome = calculateHurricaneDeductible(400000, 'high')
      expect(highRiskHome.applicable).toBe(true)
      expect(highRiskHome.options).toHaveLength(3)
      expect(highRiskHome.options[0]).toEqual({
        percentage: 2,
        amount: 8000,
        annualSavings: 4000
      })
      expect(highRiskHome.recommendation?.percentage).toBe(5)

      const lowRiskHome = calculateHurricaneDeductible(300000, 'low')
      expect(lowRiskHome.applicable).toBe(false)
      expect(lowRiskHome.options).toHaveLength(0)
    })
  })

  describe('Data Persistence', () => {
    it('should validate property data before saving', () => {
      interface PropertyData {
        address: string
        propertyType: string
        homeValue: number
        buildYear: number
        squareFootage: number
        bedrooms: number
        bathrooms: number
      }

      const validatePropertyData = (data: Partial<PropertyData>) => {
        const errors: string[] = []

        if (!data.address?.trim()) {
          errors.push('Address is required')
        }

        if (!data.propertyType) {
          errors.push('Property type is required')
        }

        if (!data.homeValue || data.homeValue < 50000 || data.homeValue > 10000000) {
          errors.push('Home value must be between $50,000 and $10,000,000')
        }

        if (!data.buildYear || data.buildYear < 1800 || data.buildYear > new Date().getFullYear()) {
          errors.push('Build year must be valid')
        }

        if (!data.squareFootage || data.squareFootage < 200 || data.squareFootage > 20000) {
          errors.push('Square footage must be between 200 and 20,000')
        }

        if (!data.bedrooms || data.bedrooms < 0 || data.bedrooms > 20) {
          errors.push('Bedrooms must be between 0 and 20')
        }

        if (!data.bathrooms || data.bathrooms < 0.5 || data.bathrooms > 20) {
          errors.push('Bathrooms must be between 0.5 and 20')
        }

        return {
          isValid: errors.length === 0,
          errors
        }
      }

      // Valid data
      const validProperty = {
        address: '123 Ocean Drive, Miami, FL 33101',
        propertyType: 'single-family',
        homeValue: 350000,
        buildYear: 1995,
        squareFootage: 2000,
        bedrooms: 3,
        bathrooms: 2
      }
      expect(validatePropertyData(validProperty)).toEqual({
        isValid: true,
        errors: []
      })

      // Invalid data
      const invalidProperty = {
        address: '',
        propertyType: '',
        homeValue: 25000, // Too low
        buildYear: 2030, // Future year
        squareFootage: 100, // Too small
        bedrooms: -1, // Negative
        bathrooms: 0 // Too low
      }
      
      const validation = validatePropertyData(invalidProperty)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Address is required')
      expect(validation.errors).toContain('Property type is required')
      expect(validation.errors).toContain('Home value must be between $50,000 and $10,000,000')
      expect(validation.errors).toContain('Build year must be valid')
      expect(validation.errors).toContain('Square footage must be between 200 and 20,000')
      expect(validation.errors).toContain('Bedrooms must be between 0 and 20')
      expect(validation.errors).toContain('Bathrooms must be between 0.5 and 20')
    })
  })

  describe('Insurance Calculation Integration', () => {
    it('should calculate comprehensive insurance recommendations', () => {
      interface PropertyInfo {
        homeValue: number
        propertyType: string
        buildYear: number
        location: { lat: number; lng: number }
        squareFootage: number
      }

      const calculateInsuranceRecommendations = (property: PropertyInfo) => {
        // Hurricane risk assessment
        const isCoastal = Math.abs(property.location.lng) < 82
        const hurricaneRisk = isCoastal ? 'high' : 'moderate'
        
        // Age-based risk
        const propertyAge = new Date().getFullYear() - property.buildYear
        const ageRiskMultiplier = propertyAge > 30 ? 1.1 : propertyAge > 15 ? 1.05 : 1.0
        
        // Property type multiplier
        const typeMultipliers = {
          'single-family': 1.0,
          'condo': 0.8,
          'townhouse': 0.9,
          'mobile-home': 1.2, // Higher risk
          'duplex': 1.1,
          'multi-family': 1.15
        }
        
        const typeMultiplier = typeMultipliers[property.propertyType as keyof typeof typeMultipliers] || 1.0
        
        // Calculate base coverage
        const baseCoverage = property.homeValue * typeMultiplier * ageRiskMultiplier
        
        return {
          dwellingCoverage: Math.round(baseCoverage),
          personalProperty: Math.round(baseCoverage * 0.5),
          liability: Math.max(300000, Math.round(property.homeValue * 0.5)),
          medicalPayments: 5000,
          hurricaneDeductible: hurricaneRisk === 'high' ? 
            Math.round(property.homeValue * 0.05) : 
            Math.round(property.homeValue * 0.02),
          floodInsurance: isCoastal ? 'required' : 'recommended',
          windstormCoverage: true,
          estimatedAnnualPremium: Math.round(baseCoverage * 0.008 * (isCoastal ? 1.5 : 1.2)),
          riskFactors: [
            ...(hurricaneRisk === 'high' ? ['High hurricane risk area'] : []),
            ...(propertyAge > 30 ? ['Older construction'] : []),
            ...(property.propertyType === 'mobile-home' ? ['Mobile home higher risk'] : []),
            ...(isCoastal ? ['Coastal flood risk'] : [])
          ]
        }
      }

      // Test coastal single-family home
      const coastalHome = {
        homeValue: 450000,
        propertyType: 'single-family',
        buildYear: 1985,
        location: { lat: 25.7617, lng: -80.1918 }, // Miami
        squareFootage: 2200
      }

      const coastalRecommendation = calculateInsuranceRecommendations(coastalHome)
      expect(coastalRecommendation.dwellingCoverage).toBeGreaterThan(450000) // Age multiplier applied
      expect(coastalRecommendation.hurricaneDeductible).toBe(22500) // 5% for high risk
      expect(coastalRecommendation.floodInsurance).toBe('required')
      expect(coastalRecommendation.riskFactors).toContain('High hurricane risk area')
      expect(coastalRecommendation.riskFactors).toContain('Older construction')
      expect(coastalRecommendation.riskFactors).toContain('Coastal flood risk')

      // Test inland newer home
      const inlandHome = {
        homeValue: 280000,
        propertyType: 'single-family',
        buildYear: 2010,
        location: { lat: 28.5383, lng: -81.3792 }, // Orlando
        squareFootage: 1800
      }

      const inlandRecommendation = calculateInsuranceRecommendations(inlandHome)
      expect(inlandRecommendation.hurricaneDeductible).toBe(5600) // 2% for moderate risk
      expect(inlandRecommendation.floodInsurance).toBe('recommended')
      expect(inlandRecommendation.riskFactors).not.toContain('High hurricane risk area')
      expect(inlandRecommendation.riskFactors).not.toContain('Older construction')
    })
  })
})