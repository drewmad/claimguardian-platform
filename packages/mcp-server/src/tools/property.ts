import { z } from 'zod';
import type { Tool } from '../index.js';

// Schema for property search
const searchPropertiesSchema = z.object({
  query: z.string().describe('Search query for properties'),
  limit: z.number().optional().default(10).describe('Maximum number of results'),
});

// Schema for property details
const getPropertySchema = z.object({
  propertyId: z.string().describe('The ID of the property to retrieve'),
});

// Schema for creating property
const createPropertySchema = z.object({
  address: z.string().describe('Property address'),
  type: z.enum(['single_family', 'condo', 'townhouse', 'multi_family']).describe('Property type'),
  year_built: z.number().optional().describe('Year the property was built'),
  square_footage: z.number().optional().describe('Total square footage'),
  bedrooms: z.number().optional().describe('Number of bedrooms'),
  bathrooms: z.number().optional().describe('Number of bathrooms'),
});

export const propertyTools: Tool[] = [
  {
    name: 'search_properties',
    description: 'Search for properties in the ClaimGuardian database',
    inputSchema: searchPropertiesSchema,
    handler: async (args: z.infer<typeof searchPropertiesSchema>) => {
      // TODO: Implement actual database search
      return {
        properties: [
          {
            id: '1',
            address: '123 Hurricane Ln, Miami, FL 33101',
            type: 'single_family',
            year_built: 2005,
            square_footage: 2500,
          },
        ],
        total: 1,
      };
    },
  },
  {
    name: 'get_property_details',
    description: 'Get detailed information about a specific property',
    inputSchema: getPropertySchema,
    handler: async (args: z.infer<typeof getPropertySchema>) => {
      // TODO: Implement actual database lookup
      return {
        id: args.propertyId,
        address: '123 Hurricane Ln, Miami, FL 33101',
        type: 'single_family',
        year_built: 2005,
        square_footage: 2500,
        bedrooms: 4,
        bathrooms: 3,
        systems: [
          { type: 'hvac', brand: 'Carrier', installed: '2020-01-15' },
          { type: 'roof', material: 'tile', installed: '2018-06-20' },
        ],
        insurance: {
          carrier: 'State Farm',
          policy_number: 'SF-123456',
          coverage_amount: 500000,
        },
      };
    },
  },
  {
    name: 'create_property',
    description: 'Create a new property in the ClaimGuardian system',
    inputSchema: createPropertySchema,
    handler: async (args: z.infer<typeof createPropertySchema>) => {
      // TODO: Implement actual database creation
      return {
        success: true,
        property: {
          id: 'new-property-id',
          ...args,
          created_at: new Date().toISOString(),
        },
      };
    },
  },
];