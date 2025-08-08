import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { logger } from '../lib/logger.js';

interface CountyDataSource {
  county_fips: string;
  source_url?: string;
  file_path?: string;
  format: 'csv' | 'geojson' | 'shapefile';
}

export async function fetchCountyData(
  source: CountyDataSource
): Promise<unknown[]> {
  try {
    if (source.file_path) {
      return await loadFromFile(source);
    } else if (source.source_url) {
      return await loadFromUrl(source);
    } else {
      throw new Error('No data source specified');
    }
  } catch (error) {
    logger.error('Failed to fetch county data', { source, error });
    throw error;
  }
}

async function loadFromFile(source: CountyDataSource): Promise<unknown[]> {
  const content = await fs.readFile(source.file_path!, 'utf8');
  
  switch (source.format) {
    case 'csv':
      return parse(content, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true 
      });
    case 'geojson':
      const geojson = JSON.parse(content);
      return geojson.features || [];
    default:
      throw new Error(`Unsupported file format: ${source.format}`);
  }
}

async function loadFromUrl(source: CountyDataSource): Promise<unknown[]> {
  const response = await fetch(source.source_url!);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const content = await response.text();
  
  switch (source.format) {
    case 'csv':
      return parse(content, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true 
      });
    case 'geojson':
      const geojson = JSON.parse(content);
      return geojson.features || [];
    default:
      throw new Error(`Unsupported format: ${source.format}`);
  }
}

export async function normalizeAddress(rawAddress: string): Promise<{
  normalized: string;
  components: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  confidence: number;
}> {
  // This would use libpostal or an external service for address normalization
  // For now, providing a basic normalization placeholder
  
  const normalized = rawAddress
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  // Basic parsing - in production, this would use libpostal
  const components = {
    // Add basic address component parsing here
  };

  return {
    normalized,
    components,
    confidence: 0.85 // Placeholder confidence score
  };
}