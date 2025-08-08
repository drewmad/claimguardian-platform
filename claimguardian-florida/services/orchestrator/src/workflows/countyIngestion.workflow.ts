import { proxyActivities } from "@temporalio/workflow";
import type { Activities } from "../activities/index.js";

export interface CountyIngestionInput {
  countyFips: string;             // e.g., "12015"
  sourceVersion?: string;         // e.g., "DOR_2025_07"
  effectiveDate?: string;         // ISO date for SCD2 valid_from
  batchSize?: number;             // normalization batch size
  minZoom?: number;               // tile build
  maxZoom?: number;               // tile build
}

export interface CountyIngestionResult {
  validated: { rowCount: number; issues: string[] };
  normalized: { normalizedCount: number };
  upserted: { inserted: number; updated: number };
  tiles: { tilesWritten: number };
  caches: { pushed: number };
}

const {
  validateCountyData,
  normalizeParcels,
  scd2Upsert,
  buildTiles,
  pushCaches
} = proxyActivities<Activities>({
  startToCloseTimeout: "60 minutes",
  retry: {
    maximumAttempts: 5,
    initialInterval: "5s",
    backoffCoefficient: 2,
    maximumInterval: "2m",
    nonRetryableErrorTypes: ["BadRequest", "ValidationFailed"]
  }
});

export async function countyIngestionWorkflow(input: CountyIngestionInput): Promise<CountyIngestionResult> {
  const effectiveDate = input.effectiveDate ?? new Date().toISOString().slice(0, 10);
  const validated = await validateCountyData({
    countyFips: input.countyFips,
    sourceName: "florida_dor",
    sourceVersion: input.sourceVersion
  });

  const normalized = await normalizeParcels({
    countyFips: input.countyFips,
    batchSize: input.batchSize ?? 25000
  });

  const upserted = await scd2Upsert({
    countyFips: input.countyFips,
    effectiveDate
  });

  const tiles = await buildTiles({
    layer: "parcels",
    zMin: input.minZoom ?? 10,
    zMax: input.maxZoom ?? 13,
    counties: [input.countyFips]
  });

  const caches = await pushCaches({
    keys: tiles.cacheKeys
  });

  return { validated, normalized, upserted, tiles: { tilesWritten: tiles.tilesWritten }, caches: { pushed: caches.count } };
}