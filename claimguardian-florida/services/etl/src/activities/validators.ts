import { z } from 'zod';
import { logger } from '../lib/logger.js';

const ParcelSchema = z.object({
  parcel_id: z.string().min(1),
  county_fips: z.string().regex(/^12\d{3}$/),
  owner_name: z.string().min(1),
  site_address: z.string().optional(),
  just_value: z.number().min(0),
  assessed_value: z.number().min(0),
  land_use_code: z.string().optional(),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional()
});

export async function validateCountyData(data: unknown[]): Promise<{
  valid: unknown[];
  invalid: unknown[];
  stats: { total: number; validCount: number; invalidCount: number };
}> {
  const valid: unknown[] = [];
  const invalid: unknown[] = [];

  for (const record of data) {
    try {
      const validRecord = ParcelSchema.parse(record);
      valid.push(validRecord);
    } catch (error) {
      logger.warn('Invalid parcel record', { record, error });
      invalid.push(record);
    }
  }

  const stats = {
    total: data.length,
    validCount: valid.length,
    invalidCount: invalid.length
  };

  logger.info('County data validation complete', stats);
  return { valid, invalid, stats };
}