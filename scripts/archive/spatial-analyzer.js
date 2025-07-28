#!/usr/bin/env node
/**
 * Spatial Analyzer for Property Relationships
 * Computes spatial relationships and geographic insights for AI consumption
 */

const { createClient } = require('@supabase/supabase-js');
const turf = require('@turf/turf');

class SpatialAnalyzer {
    constructor(supabaseClient, options = {}) {
        this.supabase = supabaseClient;
        this.config = {
            batchSize: 1000,
            maxDistance: 5, // miles
            analysisTypes: [
                'nearest_hospitals',
                'nearest_schools', 
                'nearest_fire_stations',
                'flood_zones',
                'evacuation_routes',
                'neighborhood_density'
            ],
            ...options
        };
        
        this.stats = {
            propertiesAnalyzed: 0,
            relationshipsComputed: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    async computeRelationships() {
        console.log('🗺️  Computing spatial relationships...');
        
        try {
            // Get properties that need spatial analysis
            const { data: properties, error } = await this.supabase
                .from('stg_properties')
                .select('id, parcel_id, centroid, coordinates, county_fips')
                .not('centroid', 'is', null)
                .limit(10000);
            
            if (error) throw error;
            
            if (!properties || properties.length === 0) {
                console.log('✅ No properties need spatial analysis');
                return;
            }
            
            console.log(`📊 Analyzing ${properties.length} properties`);
            
            // Process in batches
            for (let i = 0; i < properties.length; i += this.config.batchSize) {
                const batch = properties.slice(i, i + this.config.batchSize);
                await this.processBatch(batch);
                
                console.log(`   ✅ Batch ${Math.floor(i/this.config.batchSize) + 1}: ${batch.length} properties analyzed`);
            }
            
            this.printStats();
            
        } catch (error) {
            console.error('❌ Spatial analysis failed:', error);
            throw error;
        }
    }

    async processBatch(properties) {
        const relationships = [];
        
        for (const property of properties) {
            try {
                const propertyRelationships = await this.analyzeProperty(property);
                relationships.push(...propertyRelationships);
                this.stats.propertiesAnalyzed++;
                
            } catch (error) {
                console.error(`❌ Analysis error for ${property.parcel_id}:`, error);
                this.stats.errors++;
            }
        }
        
        // Batch insert relationships
        if (relationships.length > 0) {
            const { error } = await this.supabase
                .from('spatial_relationships')
                .upsert(relationships, { 
                    onConflict: 'property_id,relationship_type',
                    ignoreDuplicates: false 
                });
            
            if (error) {
                console.error('❌ Relationship insert error:', error);
            } else {
                this.stats.relationshipsComputed += relationships.length;
            }
        }
    }

    async analyzeProperty(property) {
        const relationships = [];
        const lat = property.coordinates.lat;
        const lng = property.coordinates.lng;
        
        // Nearest hospitals
        const hospitals = await this.findNearestHospitals(lat, lng);
        hospitals.forEach(hospital => {
            relationships.push({
                property_id: property.id,
                relationship_type: 'nearest_hospital',
                related_feature: hospital,
                distance_miles: hospital.distance,
                confidence_score: 1.0
            });
        });
        
        // Nearest schools
        const schools = await this.findNearestSchools(lat, lng);
        schools.forEach(school => {
            relationships.push({
                property_id: property.id,
                relationship_type: 'nearest_school',
                related_feature: school,
                distance_miles: school.distance,
                confidence_score: 1.0
            });
        });
        
        // Fire stations
        const fireStations = await this.findNearestFireStations(lat, lng);
        fireStations.forEach(station => {
            relationships.push({
                property_id: property.id,
                relationship_type: 'nearest_fire_station',
                related_feature: station,
                distance_miles: station.distance,
                confidence_score: 1.0
            });
        });
        
        // Flood zone analysis
        const floodZone = await this.analyzeFloodZone(lat, lng);
        if (floodZone) {
            relationships.push({
                property_id: property.id,
                relationship_type: 'flood_zone',
                related_feature: floodZone,
                distance_miles: 0,
                confidence_score: floodZone.confidence
            });
        }
        
        // Neighborhood density
        const density = await this.analyzeNeighborhoodDensity(lat, lng, property.county_fips);
        if (density) {
            relationships.push({
                property_id: property.id,
                relationship_type: 'neighborhood_density',
                related_feature: density,
                distance_miles: 0,
                confidence_score: 1.0
            });
        }
        
        // Transportation access
        const transportation = await this.analyzeTransportationAccess(lat, lng);
        if (transportation) {
            relationships.push({
                property_id: property.id,
                relationship_type: 'transportation_access',
                related_feature: transportation,
                distance_miles: transportation.nearest_highway_distance,
                confidence_score: 1.0
            });
        }
        
        return relationships;
    }

    async findNearestHospitals(lat, lng, limit = 3) {
        // In production, this would query a hospitals database
        // For now, using Florida major hospitals as reference points
        const majorHospitals = [
            { name: 'Jackson Memorial Hospital', lat: 25.7197, lng: -80.2164, city: 'Miami' },
            { name: 'Tampa General Hospital', lat: 27.9447, lng: -82.4590, city: 'Tampa' },
            { name: 'Orlando Health', lat: 28.5504, lng: -81.3813, city: 'Orlando' },
            { name: 'Shands Hospital', lat: 29.6436, lng: -82.3549, city: 'Gainesville' },
            { name: 'Baptist Medical Center', lat: 30.3074, lng: -81.6963, city: 'Jacksonville' }
        ];
        
        const hospitalsWithDistance = majorHospitals.map(hospital => ({
            ...hospital,
            distance: this.haversineDistance(lat, lng, hospital.lat, hospital.lng)
        }));
        
        return hospitalsWithDistance
            .filter(h => h.distance <= this.config.maxDistance)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }

    async findNearestSchools(lat, lng, limit = 5) {
        // Mock school data - in production would query school districts
        const mockSchools = [
            { name: 'Elementary School', type: 'elementary', distance: Math.random() * 2 },
            { name: 'Middle School', type: 'middle', distance: Math.random() * 3 },
            { name: 'High School', type: 'high', distance: Math.random() * 5 }
        ];
        
        return mockSchools
            .filter(s => s.distance <= this.config.maxDistance)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }

    async findNearestFireStations(lat, lng, limit = 2) {
        // Mock fire station data
        const mockStations = [
            { name: 'Fire Station 1', distance: Math.random() * 3, response_time_min: 5 },
            { name: 'Fire Station 2', distance: Math.random() * 4, response_time_min: 7 }
        ];
        
        return mockStations
            .filter(s => s.distance <= this.config.maxDistance)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }

    async analyzeFloodZone(lat, lng) {
        // Simplified flood zone analysis
        // In production, would query FEMA flood maps
        
        // Mock analysis based on elevation and coastal proximity
        const isNearCoast = this.isNearFloridaCoast(lat, lng);
        const elevation = await this.estimateElevation(lat, lng);
        
        let floodZone = 'X'; // Default: minimal risk
        let riskLevel = 'low';
        
        if (isNearCoast && elevation < 10) {
            floodZone = 'AE';
            riskLevel = 'high';
        } else if (isNearCoast || elevation < 20) {
            floodZone = 'A';
            riskLevel = 'moderate';
        }
        
        return {
            zone: floodZone,
            risk_level: riskLevel,
            estimated_elevation: elevation,
            coastal_proximity: isNearCoast,
            confidence: isNearCoast ? 0.8 : 0.6
        };
    }

    async analyzeNeighborhoodDensity(lat, lng, countyFips) {
        try {
            // Query nearby properties to calculate density
            const { data: nearbyProperties, error } = await this.supabase
                .rpc('properties_within_radius', {
                    center_lat: lat,
                    center_lng: lng,
                    radius_miles: 1.0
                });
            
            if (error) throw error;
            
            const count = nearbyProperties?.length || 0;
            const areaSquareMiles = Math.PI * 1.0 * 1.0; // 1 mile radius
            const density = count / areaSquareMiles;
            
            let densityCategory = 'rural';
            if (density > 1000) densityCategory = 'urban';
            else if (density > 200) densityCategory = 'suburban';
            
            return {
                properties_per_sq_mile: Math.round(density),
                category: densityCategory,
                nearby_properties: count,
                analysis_radius: 1.0
            };
            
        } catch (error) {
            // Fallback: estimate based on county
            return this.estimateDensityByCounty(countyFips);
        }
    }

    async analyzeTransportationAccess(lat, lng) {
        // Mock transportation analysis
        // In production, would use real highway/transit data
        
        const majorHighways = [
            { name: 'I-95', lat: 25.7617, lng: -80.1918 },
            { name: 'I-75', lat: 26.1420, lng: -81.7948 },
            { name: 'I-4', lat: 28.0836, lng: -82.4053 }
        ];
        
        const distancesToHighways = majorHighways.map(highway => ({
            name: highway.name,
            distance: this.haversineDistance(lat, lng, highway.lat, highway.lng)
        }));
        
        const nearestHighway = distancesToHighways.reduce((prev, curr) => 
            prev.distance < curr.distance ? prev : curr
        );
        
        return {
            nearest_highway: nearestHighway.name,
            nearest_highway_distance: nearestHighway.distance,
            highway_access_score: Math.max(0, 10 - nearestHighway.distance), // 0-10 scale
            transportation_tier: nearestHighway.distance < 2 ? 'excellent' :
                               nearestHighway.distance < 5 ? 'good' :
                               nearestHighway.distance < 10 ? 'fair' : 'poor'
        };
    }

    // Utility methods
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

    isNearFloridaCoast(lat, lng) {
        // Simplified coastal detection for Florida
        const floridaBounds = {
            north: 31.0,
            south: 24.5,
            east: -79.8,
            west: -87.6
        };
        
        // Check if near coastline (simplified)
        const nearAtlantic = lng > -81.0;
        const nearGulf = lng < -82.0 && lat > 25.0;
        const nearKeys = lat < 25.5 && lng > -82.0;
        
        return nearAtlantic || nearGulf || nearKeys;
    }

    async estimateElevation(lat, lng) {
        // Mock elevation estimation
        // In production, would query USGS elevation service
        
        // Simple model: higher elevation inland, lower near coast
        const isCoastal = this.isNearFloridaCoast(lat, lng);
        const baseElevation = isCoastal ? 5 : 50;
        const variation = Math.random() * 30 - 15; // ±15 feet
        
        return Math.max(0, baseElevation + variation);
    }

    estimateDensityByCounty(countyFips) {
        // Fallback density estimates by major Florida counties
        const countyDensities = {
            '12086': { density: 1200, category: 'urban' },    // Miami-Dade
            '12095': { density: 800, category: 'suburban' },  // Orange (Orlando)
            '12103': { density: 900, category: 'suburban' },  // Pinellas (St. Pete)
            '12057': { density: 950, category: 'suburban' },  // Hillsborough (Tampa)
            '12031': { density: 600, category: 'suburban' },  // Duval (Jacksonville)
        };
        
        const countyData = countyDensities[countyFips] || { density: 200, category: 'rural' };
        
        return {
            properties_per_sq_mile: countyData.density,
            category: countyData.category,
            data_source: 'county_estimate',
            analysis_radius: null
        };
    }

    async createSpatialFunctions() {
        console.log('🛠️  Creating spatial analysis functions...');
        
        const sqlFunctions = `
            -- Function to find properties within radius
            CREATE OR REPLACE FUNCTION properties_within_radius(
                center_lat double precision,
                center_lng double precision,
                radius_miles double precision
            )
            RETURNS TABLE (
                id uuid,
                parcel_id text,
                distance_miles double precision
            )
            LANGUAGE sql STABLE
            AS $$
                SELECT 
                    p.id,
                    p.parcel_id,
                    ST_Distance(
                        ST_Point(center_lng, center_lat)::geography,
                        p.centroid::geography
                    ) / 1609.34 AS distance_miles
                FROM properties p
                WHERE ST_DWithin(
                    ST_Point(center_lng, center_lat)::geography,
                    p.centroid::geography,
                    radius_miles * 1609.34
                )
                ORDER BY distance_miles;
            $$;
            
            -- Function to compute neighborhood statistics
            CREATE OR REPLACE FUNCTION neighborhood_stats(
                center_lat double precision,
                center_lng double precision,
                radius_miles double precision DEFAULT 0.5
            )
            RETURNS jsonb
            LANGUAGE sql STABLE
            AS $$
                SELECT jsonb_build_object(
                    'property_count', COUNT(*),
                    'avg_property_value', AVG(property_value),
                    'median_year_built', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY year_built),
                    'avg_area_acres', AVG(area_acres),
                    'coastal_percentage', 
                        COUNT(*) FILTER (WHERE spatial_features->>'coastal' = 'true') * 100.0 / COUNT(*)
                )
                FROM properties p
                WHERE ST_DWithin(
                    ST_Point(center_lng, center_lat)::geography,
                    p.centroid::geography,
                    radius_miles * 1609.34
                );
            $$;
        `;
        
        try {
            await this.supabase.rpc('exec_sql', { sql: sqlFunctions });
            console.log('✅ Spatial functions created successfully');
        } catch (error) {
            console.error('❌ Function creation failed:', error);
        }
    }

    printStats() {
        const duration = (Date.now() - this.stats.startTime) / 1000;
        const rate = Math.round(this.stats.propertiesAnalyzed / duration);
        
        console.log('\n📊 Spatial Analysis Stats:');
        console.log(`   Properties analyzed: ${this.stats.propertiesAnalyzed}`);
        console.log(`   Relationships computed: ${this.stats.relationshipsComputed}`);
        console.log(`   Errors: ${this.stats.errors}`);
        console.log(`   Duration: ${duration.toFixed(1)}s`);
        console.log(`   Rate: ${rate} properties/second`);
    }
}

module.exports = { SpatialAnalyzer };

// CLI usage
if (require.main === module) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    const analyzer = new SpatialAnalyzer(supabase);
    
    const command = process.argv[2] || 'analyze';
    
    switch (command) {
        case 'analyze':
            analyzer.computeRelationships()
                .then(() => console.log('✅ Spatial analysis completed'))
                .catch(console.error);
            break;
            
        case 'functions':
            analyzer.createSpatialFunctions()
                .then(() => console.log('✅ Functions created'))
                .catch(console.error);
            break;
            
        default:
            console.log('Usage: node spatial-analyzer.js [analyze|functions]');
    }
}