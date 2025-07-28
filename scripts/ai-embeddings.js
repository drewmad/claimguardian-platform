#!/usr/bin/env node
/**
 * AI Embeddings Generator for Property Data
 * Generates vector embeddings for semantic search and AI consumption
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

class EmbeddingGenerator {
    constructor(options = {}) {
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        this.config = {
            batchSize: 100,
            embeddingModel: 'text-embedding-3-small', // 1536 dimensions
            maxRetries: 3,
            ...options
        };
        
        this.stats = {
            processed: 0,
            embedded: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    async generateForNewProperties() {
        console.log('🤖 Generating embeddings for new properties...');
        
        try {
            // Get properties without embeddings
            const { data: properties, error } = await this.supabase
                .from('stg_properties')
                .select(`
                    id, parcel_id, address, owner_name, 
                    area_acres, property_value, year_built,
                    spatial_features, property_features
                `)
                .is('feature_vector', null)
                .limit(10000); // Process in chunks for large datasets
            
            if (error) throw error;
            
            if (!properties || properties.length === 0) {
                console.log('✅ No new properties need embeddings');
                return;
            }
            
            console.log(`📊 Processing ${properties.length} properties for embeddings`);
            
            // Process in batches
            for (let i = 0; i < properties.length; i += this.config.batchSize) {
                const batch = properties.slice(i, i + this.config.batchSize);
                await this.processBatch(batch);
                
                console.log(`   ✅ Batch ${Math.floor(i/this.config.batchSize) + 1}: ${batch.length} properties embedded`);
            }
            
            this.printStats();
            
        } catch (error) {
            console.error('❌ Embedding generation failed:', error);
            throw error;
        }
    }

    async processBatch(properties) {
        const embeddingRequests = [];
        
        // Prepare embedding requests
        for (const property of properties) {
            const description = this.generatePropertyDescription(property);
            const features = this.generateFeatureDescription(property);
            
            embeddingRequests.push({
                property_id: property.id,
                parcel_id: property.parcel_id,
                description_text: description,
                features_text: features
            });
        }
        
        try {
            // Generate embeddings for descriptions
            const descriptionTexts = embeddingRequests.map(req => req.description_text);
            const featureTexts = embeddingRequests.map(req => req.features_text);
            
            const [descriptionEmbeddings, featureEmbeddings] = await Promise.all([
                this.generateEmbeddings(descriptionTexts),
                this.generateEmbeddings(featureTexts)
            ]);
            
            // Update database
            const updates = embeddingRequests.map((req, index) => ({
                id: req.property_id,
                description_vector: descriptionEmbeddings[index],
                feature_vector: featureEmbeddings[index]
            }));
            
            const { error } = await this.supabase
                .from('stg_properties')
                .upsert(updates, { onConflict: 'id' });
            
            if (error) throw error;
            
            this.stats.processed += properties.length;
            this.stats.embedded += properties.length;
            
        } catch (error) {
            console.error('❌ Batch embedding failed:', error);
            this.stats.errors += properties.length;
        }
    }

    generatePropertyDescription(property) {
        const parts = [];
        
        // Address and location
        if (property.address) {
            parts.push(`Property located at ${property.address}`);
        }
        
        // Size and value
        if (property.area_acres > 0) {
            parts.push(`${property.area_acres} acre property`);
        }
        
        if (property.property_value > 0) {
            parts.push(`valued at $${property.property_value.toLocaleString()}`);
        }
        
        // Age
        if (property.year_built > 0) {
            const age = new Date().getFullYear() - property.year_built;
            parts.push(`built in ${property.year_built} (${age} years old)`);
        }
        
        // Owner information
        if (property.owner_name && property.owner_name !== property.address) {
            parts.push(`owned by ${property.owner_name}`);
        }
        
        // Spatial features
        if (property.spatial_features) {
            const spatialDesc = this.describeSpatialFeatures(property.spatial_features);
            if (spatialDesc) parts.push(spatialDesc);
        }
        
        // Property characteristics
        if (property.property_features) {
            const propDesc = this.describePropertyFeatures(property.property_features);
            if (propDesc) parts.push(propDesc);
        }
        
        return parts.join('. ') + '.';
    }

    generateFeatureDescription(property) {
        const features = [];
        
        // Quantitative features
        features.push(`area_acres:${property.area_acres || 0}`);
        features.push(`property_value:${property.property_value || 0}`);
        features.push(`year_built:${property.year_built || 0}`);
        
        // Spatial features
        if (property.spatial_features) {
            Object.entries(property.spatial_features).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    features.push(`${key}:${value}`);
                } else if (typeof value === 'number') {
                    features.push(`${key}:${value}`);
                } else if (typeof value === 'string') {
                    features.push(`${key}:${value}`);
                }
            });
        }
        
        // Property features
        if (property.property_features) {
            Object.entries(property.property_features).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    features.push(`${key}:${value}`);
                }
            });
        }
        
        return features.join(' ');
    }

    describeSpatialFeatures(spatialFeatures) {
        const descriptions = [];
        
        if (spatialFeatures.coastal) {
            descriptions.push('coastal property');
        }
        
        if (spatialFeatures.waterfront) {
            descriptions.push('waterfront property');
        } else if (spatialFeatures.near_water) {
            descriptions.push('near water');
        }
        
        if (spatialFeatures.urban) {
            descriptions.push('in urban area');
        }
        
        if (spatialFeatures.flood_zone) {
            descriptions.push(`in flood zone ${spatialFeatures.flood_zone}`);
        }
        
        if (spatialFeatures.elevation_ft) {
            descriptions.push(`at ${spatialFeatures.elevation_ft} feet elevation`);
        }
        
        return descriptions.join(', ');
    }

    describePropertyFeatures(propertyFeatures) {
        const descriptions = [];
        
        if (propertyFeatures.square_feet) {
            descriptions.push(`${propertyFeatures.square_feet.toLocaleString()} square feet`);
        }
        
        if (propertyFeatures.bedrooms) {
            descriptions.push(`${propertyFeatures.bedrooms} bedrooms`);
        }
        
        if (propertyFeatures.bathrooms) {
            descriptions.push(`${propertyFeatures.bathrooms} bathrooms`);
        }
        
        if (propertyFeatures.property_type) {
            descriptions.push(`${propertyFeatures.property_type} property type`);
        }
        
        if (propertyFeatures.construction_type) {
            descriptions.push(`${propertyFeatures.construction_type} construction`);
        }
        
        return descriptions.join(', ');
    }

    async generateEmbeddings(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: this.config.embeddingModel,
                input: texts
            });
            
            return response.data.map(item => item.embedding);
            
        } catch (error) {
            console.error('❌ OpenAI embedding error:', error);
            
            // Return zero vectors as fallback
            const dimensions = 1536; // text-embedding-3-small
            return texts.map(() => new Array(dimensions).fill(0));
        }
    }

    async generateSimilaritySearchIndex() {
        console.log('🔍 Creating similarity search indexes...');
        
        try {
            // Create HNSW indexes for vector similarity search
            await this.supabase.rpc('create_similarity_indexes');
            console.log('✅ Similarity search indexes created');
            
        } catch (error) {
            console.error('❌ Index creation failed:', error);
        }
    }

    async testSimilaritySearch(queryText, limit = 10) {
        console.log(`🔍 Testing similarity search for: "${queryText}"`);
        
        try {
            // Generate embedding for query
            const [queryEmbedding] = await this.generateEmbeddings([queryText]);
            
            // Search for similar properties
            const { data: results, error } = await this.supabase.rpc(
                'similarity_search',
                {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.7,
                    match_count: limit
                }
            );
            
            if (error) throw error;
            
            console.log(`✅ Found ${results.length} similar properties:`);
            results.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.address} (similarity: ${result.similarity.toFixed(3)})`);
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ Similarity search failed:', error);
            return [];
        }
    }

    printStats() {
        const duration = (Date.now() - this.stats.startTime) / 1000;
        const rate = Math.round(this.stats.processed / duration);
        
        console.log('\n📊 Embedding Generation Stats:');
        console.log(`   Processed: ${this.stats.processed} properties`);
        console.log(`   Embedded: ${this.stats.embedded} properties`);
        console.log(`   Errors: ${this.stats.errors} properties`);
        console.log(`   Duration: ${duration.toFixed(1)}s`);
        console.log(`   Rate: ${rate} properties/second`);
    }
}

// Utility function to create similarity search function in database
async function createSimilaritySearchFunction(supabase) {
    const sqlFunction = `
        CREATE OR REPLACE FUNCTION similarity_search(
            query_embedding vector(1536),
            match_threshold float DEFAULT 0.7,
            match_count int DEFAULT 10
        )
        RETURNS TABLE (
            id uuid,
            parcel_id text,
            address text,
            property_value numeric,
            area_acres numeric,
            spatial_features jsonb,
            similarity float
        )
        LANGUAGE sql STABLE
        AS $$
            SELECT
                p.id,
                p.parcel_id,
                p.address,
                p.property_value,
                p.area_acres,
                p.spatial_features,
                1 - (p.description_vector <=> query_embedding) AS similarity
            FROM properties p
            WHERE p.description_vector IS NOT NULL
                AND 1 - (p.description_vector <=> query_embedding) > match_threshold
            ORDER BY p.description_vector <=> query_embedding
            LIMIT match_count;
        $$;
        
        CREATE OR REPLACE FUNCTION create_similarity_indexes()
        RETURNS void
        LANGUAGE sql
        AS $$
            CREATE INDEX IF NOT EXISTS idx_properties_description_vector_hnsw 
            ON properties USING hnsw (description_vector vector_cosine_ops);
            
            CREATE INDEX IF NOT EXISTS idx_properties_feature_vector_hnsw 
            ON properties USING hnsw (feature_vector vector_cosine_ops);
        $$;
    `;
    
    try {
        await supabase.rpc('exec_sql', { sql: sqlFunction });
        console.log('✅ Similarity search functions created');
    } catch (error) {
        console.error('❌ Function creation failed:', error);
    }
}

module.exports = { EmbeddingGenerator, createSimilaritySearchFunction };

// CLI usage
if (require.main === module) {
    const generator = new EmbeddingGenerator();
    
    const command = process.argv[2] || 'generate';
    
    switch (command) {
        case 'generate':
            generator.generateForNewProperties()
                .then(() => console.log('✅ Embedding generation completed'))
                .catch(console.error);
            break;
            
        case 'test':
            const query = process.argv[3] || 'waterfront property near Miami';
            generator.testSimilaritySearch(query)
                .then(() => console.log('✅ Test completed'))
                .catch(console.error);
            break;
            
        case 'index':
            generator.generateSimilaritySearchIndex()
                .then(() => console.log('✅ Index creation completed'))
                .catch(console.error);
            break;
            
        default:
            console.log('Usage: node ai-embeddings.js [generate|test|index]');
    }
}