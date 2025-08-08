import { Pool } from 'pg';
import { logger } from '../lib/logger.js';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface ParcelRecord {
  parcel_id: string;
  county_fips: string;
  owner_name: string;
  site_address?: string;
  just_value: number;
  assessed_value: number;
  land_use_code?: string;
  geometry?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export async function loadParcels(
  countyFips: string,
  parcels: ParcelRecord[]
): Promise<{ loaded: number; errors: number }> {
  const client = await pool.connect();
  let loaded = 0;
  let errors = 0;

  try {
    await client.query('BEGIN');

    for (const parcel of parcels) {
      try {
        await client.query(`
          INSERT INTO cg.parcels (
            parcel_id, county_fips, owner_name, site_address,
            just_value, assessed_value, land_use_code, site_centroid
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (parcel_id) 
          DO UPDATE SET
            owner_name = EXCLUDED.owner_name,
            site_address = EXCLUDED.site_address,
            just_value = EXCLUDED.just_value,
            assessed_value = EXCLUDED.assessed_value,
            land_use_code = EXCLUDED.land_use_code,
            site_centroid = EXCLUDED.site_centroid,
            updated_at = CURRENT_TIMESTAMP
        `, [
          parcel.parcel_id,
          parcel.county_fips,
          parcel.owner_name,
          parcel.site_address,
          parcel.just_value,
          parcel.assessed_value,
          parcel.land_use_code,
          parcel.geometry ? `POINT(${parcel.geometry.coordinates[0]} ${parcel.geometry.coordinates[1]})` : null
        ]);
        loaded++;
      } catch (error) {
        logger.error('Failed to load parcel', { parcel_id: parcel.parcel_id, error });
        errors++;
      }
    }

    await client.query('COMMIT');
    logger.info('Parcel batch loaded', { county_fips: countyFips, loaded, errors });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to load parcel batch', { county_fips: countyFips, error });
    throw error;
  } finally {
    client.release();
  }

  return { loaded, errors };
}

export async function loadHurricanes(hurricaneData: unknown[]): Promise<number> {
  const client = await pool.connect();
  let loaded = 0;

  try {
    await client.query('BEGIN');
    
    // Hurricane loading logic would go here
    // This is a placeholder for the full implementation
    
    await client.query('COMMIT');
    logger.info('Hurricane data loaded', { count: loaded });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to load hurricane data', { error });
    throw error;
  } finally {
    client.release();
  }

  return loaded;
}