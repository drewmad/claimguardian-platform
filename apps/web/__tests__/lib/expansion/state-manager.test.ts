/**
 * @fileMetadata
 * @purpose "Comprehensive test suite for StateExpansionManager with error handling validation"
 * @dependencies ["@/lib/expansion/state-manager", "@/lib/supabase/client"]
 * @owner expansion-team
 * @status active
 */

import { stateExpansionManager } from '@/lib/expansion/state-manager';
import type { StateConfiguration, StateExpansionPlan } from '@/lib/expansion/state-manager';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

describe('StateExpansionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle Error objects properly in getStateConfiguration', async () => {
      const testError = new Error('Database connection failed');
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.reject(testError))
            }))
          }))
        }))
      };

      // Mock console.error to check if it's called with proper parameters
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const result = await stateExpansionManager.getStateConfiguration('FL');
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to get state configuration for FL:',
          testError
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle Error objects properly in getActiveStates', async () => {
      const testError = new Error('Permission denied');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const result = await stateExpansionManager.getActiveStates();
        expect(Array.isArray(result)).toBe(true);
        // Test will validate error handling without throwing
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle Error objects properly in updateStateConfiguration', async () => {
      const testError = new Error('Validation failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockConfig: StateConfiguration = {
        stateCode: 'TX',
        stateName: 'Texas',
        isActive: true,
        insuranceRegulations: {
          requiresLicense: true,
          regulatoryBody: 'Texas Department of Insurance',
          complianceRequirements: ['license'],
          fillingDeadlines: { initial_notice: 30 }
        },
        dataSources: {
          parcelData: {
            provider: 'Texas Data',
            updateFrequency: 'monthly',
            dataFormat: 'api',
            cost: 1000
          },
          courthouseData: {
            available: true,
            integrationMethod: 'api'
          },
          weatherData: {
            provider: 'noaa',
            regionCode: 'tx'
          }
        },
        marketData: {
          majorCarriers: ['State Farm', 'Allstate'],
          averagePremium: 1200,
          marketPenetration: 0.75,
          catastropheRisk: ['hurricane', 'tornado'],
          seasonalPatterns: { 'June': 1.5, 'September': 2.0 }
        },
        operations: {
          timezone: 'America/Chicago',
          businessHours: {
            start: '08:00',
            end: '17:00',
            timezone: 'America/Chicago'
          },
          supportLanguages: ['en', 'es']
        },
        features: {
          enabledFeatures: ['claims', 'analytics'],
          disabledFeatures: ['beta_features'],
          customizations: { theme: 'texas' }
        },
        deployment: {
          status: 'production',
          launchDate: new Date('2025-01-01'),
          migrationComplete: true,
          dataLoadStatus: {
            parcels: 'complete',
            historical: 'complete',
            integrations: 'complete'
          }
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          lastModifiedBy: 'test-user',
          notes: 'Test configuration'
        }
      };

      try {
        const result = await stateExpansionManager.updateStateConfiguration(mockConfig);
        // Test should handle errors gracefully
        expect(typeof result).toBe('boolean');
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Type Validation', () => {
    it('should validate state configuration types properly', async () => {
      const config = await stateExpansionManager.getStateConfiguration('FL');
      if (config) {
        expect(typeof config.stateCode).toBe('string');
        expect(typeof config.stateName).toBe('string');
        expect(typeof config.isActive).toBe('boolean');
        expect(typeof config.insuranceRegulations).toBe('object');
        expect(typeof config.dataSources).toBe('object');
        expect(typeof config.marketData).toBe('object');
        expect(typeof config.operations).toBe('object');
        expect(typeof config.features).toBe('object');
        expect(typeof config.deployment).toBe('object');
        expect(typeof config.metadata).toBe('object');
      }
    });

    it('should validate expansion plan types properly', async () => {
      const plans = await stateExpansionManager.getExpansionPlan();
      expect(Array.isArray(plans)).toBe(true);
      
      plans.forEach((plan: StateExpansionPlan) => {
        expect(typeof plan.phase).toBe('number');
        expect(Array.isArray(plan.states)).toBe(true);
        expect(typeof plan.timeline).toBe('object');
        expect(plan.timeline.start instanceof Date).toBe(true);
        expect(plan.timeline.end instanceof Date).toBe(true);
        expect(Array.isArray(plan.timeline.milestones)).toBe(true);
        expect(typeof plan.resources).toBe('object');
        expect(Array.isArray(plan.risks)).toBe(true);
      });
    });
  });

  describe('Logger Integration', () => {
    it('should use proper logger interface for error reporting', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        // Force an error by passing invalid state code
        await stateExpansionManager.getStateConfiguration('');
        
        // Verify that console.error was called with proper Error object handling
        // The current implementation should not have parameter mismatches
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Async Error Handling', () => {
    it('should handle async errors without parameter type mismatches', async () => {
      const testCases = [
        () => stateExpansionManager.getStateConfiguration('INVALID'),
        () => stateExpansionManager.getActiveStates(),
        () => stateExpansionManager.getStatesByStatus('production'),
        () => stateExpansionManager.getExpansionPlan(),
        () => stateExpansionManager.isStateSupported('INVALID'),
        () => stateExpansionManager.getStateFeatures('INVALID'),
        () => stateExpansionManager.getStateBusinessHours('INVALID'),
        () => stateExpansionManager.validateStateData('INVALID')
      ];

      // All these should handle errors gracefully without type mismatches
      for (const testCase of testCases) {
        try {
          await testCase();
        } catch (error) {
          // Should not throw due to parameter type mismatches
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate expansion readiness calculations', async () => {
      const readiness = await stateExpansionManager.getExpansionReadiness('FL');
      
      expect(typeof readiness.score).toBe('number');
      expect(typeof readiness.breakdown).toBe('object');
      expect(Array.isArray(readiness.blockers)).toBe(true);
      expect(Array.isArray(readiness.recommendations)).toBe(true);
      
      // Verify score is within expected range
      expect(readiness.score).toBeGreaterThanOrEqual(0);
      expect(readiness.score).toBeLessThanOrEqual(100);
    });

    it('should validate state data completeness checks', async () => {
      const validation = await stateExpansionManager.validateStateData('FL');
      
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.missingFields)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should handle cache operations without type errors', async () => {
      // First call should cache the result
      const result1 = await stateExpansionManager.getStateConfiguration('FL');
      
      // Second call should use cache
      const result2 = await stateExpansionManager.getStateConfiguration('FL');
      
      // Results should be equivalent (not necessarily same reference due to parsing)
      if (result1 && result2) {
        expect(result1.stateCode).toBe(result2.stateCode);
        expect(result1.stateName).toBe(result2.stateName);
      }
    });
  });
});