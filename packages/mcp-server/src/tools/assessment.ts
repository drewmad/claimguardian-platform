import { z } from 'zod';
import type { Tool } from '../index.js';

// Schema for damage assessment
const createAssessmentSchema = z.object({
  propertyId: z.string().describe('ID of the property being assessed'),
  claimId: z.string().optional().describe('Associated claim ID if applicable'),
  areas: z.array(z.object({
    name: z.string().describe('Area name (e.g., "Master Bedroom", "Kitchen")'),
    damage_type: z.enum(['water', 'wind', 'structural', 'mold', 'fire', 'other']),
    severity: z.enum(['minor', 'moderate', 'severe', 'total_loss']),
    description: z.string(),
  })).describe('List of damaged areas'),
});

// Schema for adding photos
const addAssessmentPhotosSchema = z.object({
  assessmentId: z.string().describe('ID of the assessment'),
  photos: z.array(z.object({
    area: z.string().describe('Area where photo was taken'),
    caption: z.string().describe('Description of what the photo shows'),
    metadata: z.object({
      timestamp: z.string().optional(),
      gps_coordinates: z.string().optional(),
    }).optional(),
  })).describe('Photos to add to the assessment'),
});

// Schema for repair estimates
const addRepairEstimateSchema = z.object({
  assessmentId: z.string().describe('ID of the assessment'),
  contractor: z.string().describe('Name of the contractor'),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total: z.number(),
  })).describe('Line items for the repair estimate'),
  total_estimate: z.number().describe('Total repair cost estimate'),
});

export const assessmentTools: Tool[] = [
  {
    name: 'create_damage_assessment',
    description: 'Create a comprehensive damage assessment for a property',
    inputSchema: createAssessmentSchema,
    handler: async (args: z.infer<typeof createAssessmentSchema>) => {
      // TODO: Implement actual assessment creation
      const totalDamageScore = args.areas.reduce((acc, area) => {
        const severityScores = { minor: 1, moderate: 2, severe: 3, total_loss: 4 };
        return acc + severityScores[area.severity];
      }, 0);

      return {
        success: true,
        assessment: {
          id: 'assessment-' + Date.now(),
          ...args,
          created_at: new Date().toISOString(),
          total_areas_affected: args.areas.length,
          overall_severity: totalDamageScore > 8 ? 'severe' : totalDamageScore > 4 ? 'moderate' : 'minor',
        },
      };
    },
  },
  {
    name: 'add_assessment_photos',
    description: 'Add photos to an existing damage assessment',
    inputSchema: addAssessmentPhotosSchema,
    handler: async (args: z.infer<typeof addAssessmentPhotosSchema>) => {
      // TODO: Implement actual photo upload
      return {
        success: true,
        photos_added: args.photos.length,
        assessment_id: args.assessmentId,
        photo_ids: args.photos.map((_, idx) => `photo-${Date.now()}-${idx}`),
      };
    },
  },
  {
    name: 'add_repair_estimate',
    description: 'Add a contractor repair estimate to an assessment',
    inputSchema: addRepairEstimateSchema,
    handler: async (args: z.infer<typeof addRepairEstimateSchema>) => {
      // TODO: Implement actual estimate addition
      return {
        success: true,
        estimate: {
          id: 'estimate-' + Date.now(),
          ...args,
          created_at: new Date().toISOString(),
          status: 'pending_review',
        },
      };
    },
  },
  {
    name: 'analyze_damage_patterns',
    description: 'Analyze damage patterns for Florida-specific insights (hurricane, flood zones)',
    inputSchema: z.object({
      propertyId: z.string().describe('Property to analyze'),
      timeframe: z.enum(['30d', '90d', '1y', 'all']).optional().default('1y'),
    }),
    handler: async (args: { propertyId: string; timeframe?: '30d' | '90d' | '1y' | 'all' }) => {
      // TODO: Implement pattern analysis
      return {
        property_id: args.propertyId,
        timeframe: args.timeframe,
        patterns: {
          most_common_damage: 'water',
          hurricane_related: true,
          flood_zone: 'AE',
          historical_claims: 3,
          average_claim_amount: 45000,
          recommendations: [
            'Consider hurricane impact windows',
            'Update flood insurance coverage',
            'Install sump pump system',
          ],
        },
      };
    },
  },
];