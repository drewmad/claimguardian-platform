#!/usr/bin/env node
/**
 * Advanced GeoData Transformer for Florida Parcel Data
 * Handles shapefile/CSV to PostGIS transformation with AI optimization
 */

const fs = require('fs').promises;
const path = require('path');
const shapefile = require('shapefile');
const turf = require('@turf/turf');
const { createClient } = require('@supabase/supabase-js');

class GeoDataTransformer {
    constructor(supabaseClient, options = {}) {
        this.supabase = supabaseClient;
        this.config = {
            batchSize: 1000,
            simplificationTolerance: 0.0001,
            maxRetries: 3,
            countyFips: options.countyFips,
            batchId: options.batchId,
            dataVintage: options.dataVintage || new Date().toISOString().split('T')[0],
            ...options
        };
        
        this.stats = {
            totalRecords: 0,
            successfulRecords: 0,
            failedRecords: 0,
            skippedRecords: 0,
            transformationErrors: []
        };
    }

    async processDirectory(dataPath) {
        console.log(`🔄 Processing geo data from: ${dataPath}`);
        
        try {
            const files = await fs.readdir(dataPath);
            const shapefiles = files.filter(f => f.endsWith('.shp'));
            const csvFiles = files.filter(f => f.endsWith('.csv'));
            
            if (shapefiles.length > 0) {
                return await this.processShapefiles(dataPath, shapefiles);
            } else if (csvFiles.length > 0) {
                return await this.processCSVFiles(dataPath, csvFiles);
            } else {
                throw new Error('No supported data files found (.shp or .csv)');
            }
            
        } catch (error) {
            console.error('❌ Directory processing failed:', error);
            throw error;
        }
    }

    async processShapefiles(dataPath, shapefiles) {
        const allRecords = [];
        
        for (const shapefileName of shapefiles) {
            const shapefilePath = path.join(dataPath, shapefileName);
            console.log(`📄 Processing shapefile: ${shapefileName}`);
            
            try {
                const collection = await shapefile.read(shapefilePath);
                const transformedFeatures = await this.transformFeatures(collection.features);
                allRecords.push(...transformedFeatures);
                
            } catch (error) {
                console.error(`❌ Shapefile processing failed for ${shapefileName}:`, error);
                this.stats.transformationErrors.push({
                    file: shapefileName,
                    error: error.message
                });
            }
        }
        
        return await this.importRecords(allRecords);
    }

    async processCSVFiles(dataPath, csvFiles) {
        // For CSV files with geometry columns (WKT, lat/lng, etc.)
        const csv = require('csv-parser');
        const fs = require('fs');
        const allRecords = [];
        
        for (const csvFile of csvFiles) {
            const csvPath = path.join(dataPath, csvFile);
            console.log(`📄 Processing CSV: ${csvFile}`);
            
            const records = await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', reject);
            });
            
            const transformedRecords = await this.transformCSVRecords(records);
            allRecords.push(...transformedRecords);
        }
        
        return await this.importRecords(allRecords);
    }

    async transformFeatures(features) {
        const transformed = [];
        
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            
            try {
                const transformedRecord = await this.transformSingleFeature(feature, i);
                if (transformedRecord) {
                    transformed.push(transformedRecord);
                    this.stats.successfulRecords++;
                } else {
                    this.stats.skippedRecords++;
                }
                
                // Progress logging
                if ((i + 1) % 1000 === 0) {
                    console.log(`   📊 Transformed ${i + 1}/${features.length} features`);
                }
                
            } catch (error) {
                this.stats.failedRecords++;
                this.stats.transformationErrors.push({
                    index: i,
                    parcel_id: feature.properties?.PARCEL_ID || 'unknown',
                    error: error.message
                });
                
                if (this.stats.transformationErrors.length > 100) {
                    throw new Error('Too many transformation errors - aborting');
                }
            }
        }
        
        this.stats.totalRecords = features.length;
        return transformed;
    }

    async transformSingleFeature(feature, index) {
        const geom = feature.geometry;
        const props = feature.properties;
        
        // Validate required fields
        if (!geom || !props.PARCEL_ID) {
            return null;
        }
        
        // Validate geometry
        if (!this.isValidGeometry(geom)) {
            console.warn(`⚠️  Invalid geometry for parcel ${props.PARCEL_ID}`);
            return null;
        }
        
        try {
            // Compute spatial metrics
            const centroid = turf.centroid(geom);
            const bbox = turf.bbox(geom);
            const area = turf.area(geom); // square meters
            const simplifiedGeom = turf.simplify(geom, { tolerance: this.config.simplificationTolerance });
            
            // Compute perimeter (approximate)
            let perimeter = 0;
            if (geom.type === 'Polygon') {
                const line = turf.lineString(geom.coordinates[0]);
                perimeter = turf.length(line, { units: 'feet' });
            }
            
            // AI-ready spatial features
            const spatialFeatures = await this.computeSpatialFeatures(geom, centroid, props);
            
            // Risk factor computation
            const riskFactors = await this.computeRiskFactors(centroid, spatialFeatures, props);
            
            // Property features extraction
            const propertyFeatures = this.extractPropertyFeatures(props);
            
            return {
                parcel_id: props.PARCEL_ID?.toString().trim(),
                county_fips: this.config.countyFips,
                
                // Spatial data (will be converted to PostGIS types in SQL)
                geometry_geojson: geom,
                centroid_geojson: centroid.geometry,
                simplified_geom_geojson: simplifiedGeom.geometry,
                
                // AI-optimized formats
                coordinates: {
                    lat: centroid.geometry.coordinates[1],
                    lng: centroid.geometry.coordinates[0]
                },
                bbox: {
                    n: bbox[3], s: bbox[1], 
                    e: bbox[2], w: bbox[0]
                },
                geojson: geom,
                simple_wkt: this.geometryToWKT(simplifiedGeom.geometry),
                
                // Pre-computed metrics
                area_sqft: Math.round(area * 10.7639), // m² to ft²
                area_acres: Math.round((area * 10.7639) / 43560 * 100) / 100, // ft² to acres
                perimeter_ft: Math.round(perimeter),
                
                // Property data
                address: this.standardizeAddress(props),
                owner_name: props.OWNER_NAME?.toString().trim() || null,
                owner_address: this.extractOwnerAddress(props),
                property_value: this.parseNumeric(props.PROPERTY_VALUE || props.ASSESSED_VALUE),
                assessed_value: this.parseNumeric(props.ASSESSED_VALUE),
                year_built: this.parseInteger(props.YEAR_BUILT || props.YR_BLT),
                
                // AI features
                spatial_features: spatialFeatures,
                risk_factors: riskFactors,
                property_features: propertyFeatures,
                
                // ETL metadata
                source_file: path.basename(this.config.currentFile || 'unknown'),
                import_batch_id: this.config.batchId,
                data_vintage: this.config.dataVintage
            };
            
        } catch (error) {
            console.error(`❌ Transform error for parcel ${props.PARCEL_ID}:`, error);
            throw error;
        }
    }

    async transformCSVRecords(records) {
        // Handle CSV records with WKT geometry or lat/lng columns
        const transformed = [];
        
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            
            try {
                // Determine geometry source
                let geometry = null;
                if (record.GEOMETRY || record.WKT) {
                    // Parse WKT geometry
                    const wkt = record.GEOMETRY || record.WKT;
                    geometry = this.parseWKTToGeoJSON(wkt);
                } else if (record.LATITUDE && record.LONGITUDE) {
                    // Create point geometry from lat/lng
                    geometry = {
                        type: 'Point',
                        coordinates: [parseFloat(record.LONGITUDE), parseFloat(record.LATITUDE)]
                    };
                }
                
                if (!geometry) {
                    this.stats.skippedRecords++;
                    continue;
                }
                
                // Convert to feature format and transform
                const feature = {
                    geometry: geometry,
                    properties: record
                };
                
                const transformedRecord = await this.transformSingleFeature(feature, i);
                if (transformedRecord) {
                    transformed.push(transformedRecord);
                }
                
            } catch (error) {
                this.stats.failedRecords++;
                console.error(`❌ CSV record ${i} transform error:`, error);
            }
        }
        
        return transformed;
    }

    async computeSpatialFeatures(geometry, centroid, properties) {
        const features = {};
        
        try {
            // Coastal detection (within 5 miles of coast)
            features.coastal = await this.isNearCoast(centroid);
            
            // Water proximity
            features.waterfront = await this.isWaterfront(geometry);
            features.near_water = await this.isNearWater(centroid, 0.5); // within 0.5 miles
            
            // Urban/rural classification
            features.urban = await this.isUrbanArea(centroid);
            
            // Flood zone (if available in properties)
            if (properties.FLOOD_ZONE) {
                features.flood_zone = properties.FLOOD_ZONE.toString();
                features.flood_risk = this.assessFloodRisk(properties.FLOOD_ZONE);
            }
            
            // Elevation (if available)
            if (properties.ELEVATION) {
                features.elevation_ft = parseFloat(properties.ELEVATION);
                features.low_elevation = parseFloat(properties.ELEVATION) < 10;
            }
            
        } catch (error) {
            console.warn('⚠️  Spatial features computation error:', error.message);
        }
        
        return features;
    }

    async computeRiskFactors(centroid, spatialFeatures, properties) {
        const risks = {};
        
        try {
            // Hurricane risk based on location and historical data
            risks.hurricane = this.computeHurricaneRisk(centroid, spatialFeatures);
            
            // Flood risk
            risks.flood = this.computeFloodRisk(spatialFeatures, properties);
            
            // Wildfire risk (generally low in Florida, but check vegetation)
            risks.wildfire = this.computeWildfireRisk(centroid, spatialFeatures);
            
            // Storm surge risk (coastal areas)
            if (spatialFeatures.coastal) {
                risks.storm_surge = this.computeStormSurgeRisk(centroid, spatialFeatures);
            }
            
        } catch (error) {
            console.warn('⚠️  Risk factors computation error:', error.message);
        }
        
        return risks;
    }

    extractPropertyFeatures(properties) {
        const features = {};
        
        // Building characteristics
        if (properties.LIVING_AREA || properties.SQ_FT) {
            features.square_feet = this.parseInteger(properties.LIVING_AREA || properties.SQ_FT);
        }
        
        if (properties.BEDROOMS) {
            features.bedrooms = this.parseInteger(properties.BEDROOMS);
        }
        
        if (properties.BATHROOMS) {
            features.bathrooms = parseFloat(properties.BATHROOMS) || null;
        }
        
        // Property type
        if (properties.PROPERTY_TYPE || properties.USE_CODE) {
            features.property_type = (properties.PROPERTY_TYPE || properties.USE_CODE).toString();
        }
        
        // Construction details
        if (properties.CONSTRUCTION_TYPE) {
            features.construction_type = properties.CONSTRUCTION_TYPE.toString();
        }
        
        if (properties.ROOF_TYPE) {
            features.roof_type = properties.ROOF_TYPE.toString();
        }
        
        return features;
    }

    async importRecords(records) {
        console.log(`📤 Importing ${records.length} transformed records`);
        
        if (records.length === 0) {
            return { recordCount: 0, successCount: 0 };
        }
        
        let successCount = 0;
        const batchSize = this.config.batchSize;
        
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            try {
                // Convert GeoJSON to PostGIS-compatible format
                const processedBatch = batch.map(record => this.prepareForDatabase(record));
                
                // Upsert to staging table
                const { error } = await this.supabase
                    .from('stg_properties')
                    .upsert(processedBatch, { 
                        onConflict: 'parcel_id',
                        ignoreDuplicates: false 
                    });
                
                if (error) {
                    console.error(`❌ Batch import error:`, error);
                    throw error;
                }
                
                successCount += batch.length;
                console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records imported`);
                
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
                throw error;
            }
        }
        
        return {
            recordCount: records.length,
            successCount: successCount,
            stats: this.stats
        };
    }

    prepareForDatabase(record) {
        // Convert GeoJSON to PostGIS function calls
        const prepared = { ...record };
        
        if (record.geometry_geojson) {
            prepared.geometry = `ST_GeomFromGeoJSON('${JSON.stringify(record.geometry_geojson)}')`;
            delete prepared.geometry_geojson;
        }
        
        if (record.centroid_geojson) {
            prepared.centroid = `ST_GeomFromGeoJSON('${JSON.stringify(record.centroid_geojson)}')`;
            delete prepared.centroid_geojson;
        }
        
        if (record.simplified_geom_geojson) {
            prepared.simplified_geom = `ST_GeomFromGeoJSON('${JSON.stringify(record.simplified_geom_geojson)}')`;
            delete prepared.simplified_geom_geojson;
        }
        
        return prepared;
    }

    // Utility methods
    isValidGeometry(geom) {
        if (!geom || !geom.type || !geom.coordinates) return false;
        
        try {
            // Basic validation - could be enhanced with more checks
            if (geom.type === 'Polygon') {
                return geom.coordinates.length > 0 && geom.coordinates[0].length >= 4;
            }
            if (geom.type === 'Point') {
                return geom.coordinates.length === 2;
            }
            return true;
        } catch {
            return false;
        }
    }

    standardizeAddress(properties) {
        const parts = [];
        
        if (properties.HOUSE_NUMBER) parts.push(properties.HOUSE_NUMBER);
        if (properties.STREET_NAME) parts.push(properties.STREET_NAME);
        if (properties.STREET_TYPE) parts.push(properties.STREET_TYPE);
        if (properties.CITY) parts.push(properties.CITY);
        if (properties.STATE) parts.push(properties.STATE);
        if (properties.ZIP_CODE) parts.push(properties.ZIP_CODE);
        
        return parts.join(' ').trim().toUpperCase() || null;
    }

    extractOwnerAddress(properties) {
        return {
            street: [properties.OWNER_ADDR1, properties.OWNER_ADDR2].filter(Boolean).join(' ').trim() || null,
            city: properties.OWNER_CITY?.toString().trim() || null,
            state: properties.OWNER_STATE?.toString().trim() || null,
            zip: properties.OWNER_ZIP?.toString().trim() || null
        };
    }

    parseNumeric(value) {
        if (!value) return null;
        const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? null : parsed;
    }

    parseInteger(value) {
        if (!value) return null;
        const parsed = parseInt(value.toString().replace(/[^0-9]/g, ''));
        return isNaN(parsed) ? null : parsed;
    }

    geometryToWKT(geometry) {
        // Simple WKT conversion - could use a proper library
        if (geometry.type === 'Point') {
            return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
        }
        // Add more geometry types as needed
        return null;
    }

    parseWKTToGeoJSON(wkt) {
        // Simple WKT parser - in production, use a proper library like 'wkt'
        const point = wkt.match(/POINT\s*\(\s*([^)]+)\s*\)/i);
        if (point) {
            const [lng, lat] = point[1].split(/\s+/).map(parseFloat);
            return { type: 'Point', coordinates: [lng, lat] };
        }
        return null;
    }

    // Risk assessment methods (simplified - enhance with real data)
    computeHurricaneRisk(centroid, spatialFeatures) {
        const lat = centroid.geometry.coordinates[1];
        const lng = centroid.geometry.coordinates[0];
        
        // Simple model based on latitude and coastal proximity
        let risk = 0.3; // Base risk for Florida
        
        if (spatialFeatures.coastal) risk += 0.3;
        if (lat < 26) risk += 0.2; // South Florida higher risk
        if (lng > -81) risk += 0.1; // Atlantic coast slightly higher
        
        return Math.min(risk, 1.0);
    }

    computeFloodRisk(spatialFeatures, properties) {
        let risk = 0.1; // Base risk
        
        if (spatialFeatures.flood_zone) {
            const zone = spatialFeatures.flood_zone.toUpperCase();
            if (zone.includes('A') || zone.includes('V')) risk = 0.8;
            else if (zone.includes('X')) risk = 0.2;
        }
        
        if (spatialFeatures.near_water) risk += 0.2;
        if (spatialFeatures.low_elevation) risk += 0.3;
        
        return Math.min(risk, 1.0);
    }

    computeWildfireRisk(centroid, spatialFeatures) {
        // Generally low in Florida
        return spatialFeatures.urban ? 0.05 : 0.15;
    }

    computeStormSurgeRisk(centroid, spatialFeatures) {
        let risk = 0.4; // Base coastal risk
        
        if (spatialFeatures.elevation_ft && spatialFeatures.elevation_ft < 5) {
            risk = 0.9;
        } else if (spatialFeatures.elevation_ft && spatialFeatures.elevation_ft < 15) {
            risk = 0.6;
        }
        
        return risk;
    }

    assessFloodRisk(floodZone) {
        const zone = floodZone.toString().toUpperCase();
        if (zone.includes('V')) return 0.9; // Velocity zones
        if (zone.includes('A')) return 0.7; // 100-year floodplain
        if (zone.includes('X')) return 0.2; // Outside 100-year floodplain
        return 0.3; // Unknown
    }

    // Spatial analysis methods (simplified - would use real GIS data)
    async isNearCoast(centroid) {
        const lat = centroid.geometry.coordinates[1];
        const lng = centroid.geometry.coordinates[0];
        
        // Simplified: Check if within rough coastal bounds for Florida
        return (lng > -87.5 && lng < -79.8) && (lat > 24.5 && lat < 31);
    }

    async isWaterfront(geometry) {
        // Simplified: Would check against water body polygons
        return false; // Placeholder
    }

    async isNearWater(centroid, milesRadius) {
        // Simplified: Would query water features within radius
        return false; // Placeholder
    }

    async isUrbanArea(centroid) {
        const lat = centroid.geometry.coordinates[1];
        const lng = centroid.geometry.coordinates[0];
        
        // Simplified: Check if near major FL cities
        const majorCities = [
            { lat: 25.7617, lng: -80.1918, name: 'Miami' },
            { lat: 28.5383, lng: -81.3792, name: 'Orlando' },
            { lat: 27.9506, lng: -82.4572, name: 'Tampa' },
            { lat: 30.4518, lng: -84.2807, name: 'Tallahassee' }
        ];
        
        return majorCities.some(city => {
            const distance = this.haversineDistance(lat, lng, city.lat, city.lng);
            return distance < 20; // Within 20 miles of major city
        });
    }

    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 3958.756; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

module.exports = { GeoDataTransformer };

// CLI usage
if (require.main === module) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    const transformer = new GeoDataTransformer(supabase, {
        countyFips: process.argv[2] || '12095', // Orange County default
        batchId: require('crypto').randomUUID()
    });
    
    const dataPath = process.argv[3] || './data/sample';
    transformer.processDirectory(dataPath)
        .then(result => {
            console.log('✅ Transformation completed:', result);
        })
        .catch(console.error);
}