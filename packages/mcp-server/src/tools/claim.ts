import { z } from 'zod';
import type { Tool } from '../index.js';

// Schema for claim creation
const createClaimSchema = z.object({
  propertyId: z.string().describe('ID of the property for this claim'),
  type: z.enum(['hurricane', 'flood', 'wind', 'hail', 'fire', 'water', 'other']).describe('Type of damage claim'),
  date_of_loss: z.string().describe('Date when the damage occurred (ISO 8601)'),
  description: z.string().describe('Description of the damage'),
  estimated_amount: z.number().optional().describe('Estimated claim amount'),
});

// Schema for claim status update
const updateClaimStatusSchema = z.object({
  claimId: z.string().describe('ID of the claim to update'),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'denied', 'closed']).describe('New status'),
  notes: z.string().optional().describe('Notes about the status change'),
});

// Schema for claim search
const searchClaimsSchema = z.object({
  propertyId: z.string().optional().describe('Filter by property ID'),
  status: z.string().optional().describe('Filter by claim status'),
  startDate: z.string().optional().describe('Filter claims after this date'),
  endDate: z.string().optional().describe('Filter claims before this date'),
});

export const claimTools: Tool[] = [
  {
    name: 'create_claim',
    description: 'Create a new insurance claim for property damage',
    inputSchema: createClaimSchema,
    handler: async (args: z.infer<typeof createClaimSchema>) => {
      // TODO: Implement actual claim creation
      return {
        success: true,
        claim: {
          id: 'claim-' + Date.now(),
          ...args,
          status: 'draft',
          created_at: new Date().toISOString(),
          claim_number: 'CLM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        },
      };
    },
  },
  {
    name: 'update_claim_status',
    description: 'Update the status of an existing claim',
    inputSchema: updateClaimStatusSchema,
    handler: async (args: z.infer<typeof updateClaimStatusSchema>) => {
      // TODO: Implement actual status update
      return {
        success: true,
        claim: {
          id: args.claimId,
          status: args.status,
          updated_at: new Date().toISOString(),
          notes: args.notes,
        },
      };
    },
  },
  {
    name: 'search_claims',
    description: 'Search for insurance claims with filters',
    inputSchema: searchClaimsSchema,
    handler: async (args: z.infer<typeof searchClaimsSchema>) => {
      // TODO: Implement actual claim search
      return {
        claims: [
          {
            id: 'claim-123',
            propertyId: args.propertyId || 'prop-1',
            type: 'hurricane',
            status: 'under_review',
            date_of_loss: '2024-08-15',
            claim_number: 'CLM-HURR2024',
            estimated_amount: 75000,
          },
        ],
        total: 1,
      };
    },
  },
  {
    name: 'generate_claim_package',
    description: 'Generate a complete claim documentation package',
    inputSchema: z.object({
      claimId: z.string().describe('ID of the claim to generate package for'),
    }),
    handler: async (args: { claimId: string }) => {
      // TODO: Implement claim package generation
      return {
        success: true,
        package: {
          claimId: args.claimId,
          documents: [
            { type: 'claim_form', status: 'generated' },
            { type: 'damage_assessment', status: 'generated' },
            { type: 'photo_documentation', status: 'included' },
            { type: 'repair_estimates', status: 'included' },
          ],
          download_url: '/api/claims/' + args.claimId + '/package',
        },
      };
    },
  },
];