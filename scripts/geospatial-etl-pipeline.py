#!/usr/bin/env python3
"""
Geospatial ETL Pipeline for ClaimGuardian
Manages the complete ETL workflow for Florida geospatial data
"""

import os
import sys
import json
import logging
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import geopandas as gpd
from sqlalchemy import create_engine, text
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GeospatialETLPipeline:
    """Manages ETL operations for geospatial data"""
    
    def __init__(self, db_url: str):
        """Initialize pipeline with database connection"""
        self.db_url = db_url
        self.engine = create_engine(db_url)
        
        # Parse connection details for psycopg2
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        self.db_config = {
            'host': parsed.hostname,
            'port': parsed.port,
            'database': parsed.path[1:],
            'user': parsed.username,
            'password': parsed.password
        }
    
    def get_db_connection(self):
        """Get a new database connection"""
        return psycopg2.connect(**self.db_config)
    
    def calculate_parcel_risk_assessments(self, batch_size: int = 1000):
        """Calculate risk assessments for all parcels"""
        logger.info("Starting parcel risk assessment calculation...")
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get total parcel count
                cur.execute("SELECT COUNT(*) FROM geospatial.parcels")
                total_parcels = cur.fetchone()['count']
                logger.info(f"Processing {total_parcels} parcels...")
                
                # Process in batches
                offset = 0
                processed = 0
                
                while offset < total_parcels:
                    # Get batch of parcels
                    cur.execute("""
                        SELECT parcel_id 
                        FROM geospatial.parcels 
                        ORDER BY parcel_id 
                        LIMIT %s OFFSET %s
                    """, (batch_size, offset))
                    
                    parcels = cur.fetchall()
                    
                    # Calculate risk for each parcel
                    for parcel in parcels:
                        try:
                            # Call the risk calculation function
                            cur.execute("""
                                INSERT INTO geospatial.parcel_risk_assessment 
                                (parcel_id, flood_risk_score, wildfire_risk_score, 
                                 wind_risk_score, surge_risk_score, composite_risk_score, 
                                 risk_factors, nearest_fire_station_distance, 
                                 nearest_hospital_distance, hazard_zones)
                                SELECT 
                                    %s,
                                    r.flood_risk,
                                    r.wildfire_risk,
                                    r.wind_risk,
                                    r.surge_risk,
                                    r.composite_risk,
                                    r.risk_factors,
                                    geospatial.distance_to_nearest_facility(p.geom, 'fire_station'),
                                    geospatial.distance_to_nearest_facility(p.geom, 'hospital'),
                                    geospatial.get_hazard_zones(p.geom)
                                FROM geospatial.parcels p,
                                     geospatial.calculate_risk_score(%s) r
                                WHERE p.parcel_id = %s
                                ON CONFLICT (parcel_id, assessment_date) 
                                DO UPDATE SET
                                    flood_risk_score = EXCLUDED.flood_risk_score,
                                    wildfire_risk_score = EXCLUDED.wildfire_risk_score,
                                    wind_risk_score = EXCLUDED.wind_risk_score,
                                    surge_risk_score = EXCLUDED.surge_risk_score,
                                    composite_risk_score = EXCLUDED.composite_risk_score,
                                    risk_factors = EXCLUDED.risk_factors,
                                    nearest_fire_station_distance = EXCLUDED.nearest_fire_station_distance,
                                    nearest_hospital_distance = EXCLUDED.nearest_hospital_distance,
                                    hazard_zones = EXCLUDED.hazard_zones,
                                    updated_at = CURRENT_TIMESTAMP
                            """, (parcel['parcel_id'], parcel['parcel_id'], parcel['parcel_id']))
                            
                            processed += 1
                            
                        except Exception as e:
                            logger.error(f"Error calculating risk for parcel {parcel['parcel_id']}: {str(e)}")
                    
                    conn.commit()
                    offset += batch_size
                    
                    logger.info(f"Processed {processed}/{total_parcels} parcels ({processed/total_parcels*100:.1f}%)")
        
        logger.info(f"✅ Risk assessment complete. Processed {processed} parcels.")
    
    def update_property_parcel_links(self):
        """Link properties to parcels based on address matching"""
        logger.info("Updating property-parcel links...")
        
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                # Update properties with exact address matches
                cur.execute("""
                    UPDATE public.properties p
                    SET parcel_id = gp.parcel_id
                    FROM geospatial.parcels gp
                    WHERE p.parcel_id IS NULL
                    AND (
                        -- Try exact address match
                        LOWER(TRIM(p.street_address || ' ' || p.city || ', FL ' || p.zip_code)) = 
                        LOWER(TRIM(gp.property_address))
                        OR
                        -- Try fuzzy match on standardized address
                        similarity(
                            LOWER(TRIM(p.street_address || ' ' || p.city)),
                            LOWER(TRIM(gp.property_address))
                        ) > 0.8
                    )
                    AND p.county = gp.county_name
                """)
                
                updated = cur.rowcount
                conn.commit()
                
                logger.info(f"✅ Updated {updated} property-parcel links")
    
    def detect_active_event_impacts(self):
        """Detect properties impacted by active events"""
        logger.info("Detecting active event impacts...")
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find properties affected by active events
                cur.execute("""
                    WITH affected_properties AS (
                        SELECT 
                            ae.id as event_id,
                            ae.event_type,
                            ae.event_name,
                            p.id as property_id,
                            p.user_id,
                            p.name as property_name,
                            ST_Area(ST_Intersection(ae.geom, gp.geom)::geography) as impact_area
                        FROM geospatial.active_events ae
                        JOIN geospatial.parcels gp ON ST_Intersects(ae.geom, gp.geom)
                        JOIN public.properties p ON p.parcel_id = gp.parcel_id
                        WHERE ae.status = 'active'
                    )
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        message,
                        data,
                        created_at
                    )
                    SELECT 
                        user_id,
                        'hazard_alert',
                        event_type || ' Alert',
                        'Your property "' || property_name || '" may be affected by ' || event_name,
                        jsonb_build_object(
                            'event_id', event_id,
                            'property_id', property_id,
                            'event_type', event_type,
                            'impact_area', impact_area
                        ),
                        CURRENT_TIMESTAMP
                    FROM affected_properties
                    WHERE NOT EXISTS (
                        -- Don't create duplicate notifications
                        SELECT 1 FROM public.notifications n
                        WHERE n.user_id = affected_properties.user_id
                        AND n.data->>'event_id' = affected_properties.event_id::text
                        AND n.data->>'property_id' = affected_properties.property_id::text
                        AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                    )
                """)
                
                notifications_created = cur.rowcount
                conn.commit()
                
                logger.info(f"✅ Created {notifications_created} hazard notifications")
    
    def cleanup_old_data(self, retention_days: Dict[str, int]):
        """Clean up old data based on retention policies"""
        logger.info("Cleaning up old data...")
        
        cleanup_queries = {
            'active_events': """
                DELETE FROM geospatial.active_events 
                WHERE status != 'active' 
                AND updated_at < CURRENT_TIMESTAMP - INTERVAL '%s days'
            """,
            'risk_assessments': """
                DELETE FROM geospatial.parcel_risk_assessment 
                WHERE assessment_date < CURRENT_DATE - INTERVAL '%s days'
                AND assessment_date NOT IN (
                    -- Keep the most recent assessment for each parcel
                    SELECT MAX(assessment_date) 
                    FROM geospatial.parcel_risk_assessment 
                    GROUP BY parcel_id
                )
            """
        }
        
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                for data_type, query in cleanup_queries.items():
                    if data_type in retention_days:
                        cur.execute(query % retention_days[data_type])
                        deleted = cur.rowcount
                        logger.info(f"Deleted {deleted} old {data_type} records")
                
                conn.commit()
        
        logger.info("✅ Data cleanup complete")
    
    def generate_risk_statistics(self):
        """Generate aggregate risk statistics for reporting"""
        logger.info("Generating risk statistics...")
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # County-level risk statistics
                cur.execute("""
                    INSERT INTO public.analytics_metrics (
                        metric_type,
                        metric_name,
                        metric_value,
                        dimensions,
                        timestamp
                    )
                    SELECT 
                        'risk_assessment',
                        'county_risk_summary',
                        jsonb_build_object(
                            'avg_composite_risk', AVG(pra.composite_risk_score),
                            'high_risk_count', COUNT(*) FILTER (WHERE pra.composite_risk_score > 0.7),
                            'medium_risk_count', COUNT(*) FILTER (WHERE pra.composite_risk_score BETWEEN 0.3 AND 0.7),
                            'low_risk_count', COUNT(*) FILTER (WHERE pra.composite_risk_score < 0.3)
                        ),
                        jsonb_build_object('county', p.county_name),
                        CURRENT_TIMESTAMP
                    FROM geospatial.parcels p
                    JOIN geospatial.parcel_risk_assessment pra ON p.parcel_id = pra.parcel_id
                    WHERE pra.assessment_date = CURRENT_DATE
                    GROUP BY p.county_name
                """)
                
                # Portfolio-wide risk summary
                cur.execute("""
                    INSERT INTO public.analytics_metrics (
                        metric_type,
                        metric_name,
                        metric_value,
                        timestamp
                    )
                    SELECT 
                        'risk_assessment',
                        'portfolio_risk_summary',
                        jsonb_build_object(
                            'total_properties', COUNT(DISTINCT p.id),
                            'avg_flood_risk', AVG(pra.flood_risk_score),
                            'avg_wildfire_risk', AVG(pra.wildfire_risk_score),
                            'avg_wind_risk', AVG(pra.wind_risk_score),
                            'avg_surge_risk', AVG(pra.surge_risk_score),
                            'properties_in_flood_zone', COUNT(*) FILTER (WHERE pra.flood_risk_score > 0),
                            'properties_in_wildfire_zone', COUNT(*) FILTER (WHERE pra.wildfire_risk_score > 0)
                        ),
                        CURRENT_TIMESTAMP
                    FROM public.properties p
                    JOIN geospatial.parcel_risk_assessment pra ON p.parcel_id = pra.parcel_id
                    WHERE pra.assessment_date = CURRENT_DATE
                """)
                
                conn.commit()
        
        logger.info("✅ Risk statistics generated")
    
    def run_full_pipeline(self):
        """Run the complete ETL pipeline"""
        logger.info("Starting full ETL pipeline run...")
        start_time = time.time()
        
        try:
            # Step 1: Link properties to parcels
            self.update_property_parcel_links()
            
            # Step 2: Calculate risk assessments
            self.calculate_parcel_risk_assessments()
            
            # Step 3: Detect active event impacts
            self.detect_active_event_impacts()
            
            # Step 4: Generate statistics
            self.generate_risk_statistics()
            
            # Step 5: Cleanup old data
            self.cleanup_old_data({
                'active_events': 30,
                'risk_assessments': 365
            })
            
            elapsed_time = time.time() - start_time
            logger.info(f"✅ Full pipeline completed in {elapsed_time:.2f} seconds")
            
            # Log success metric
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.system_logs (
                            level, 
                            message, 
                            context,
                            created_at
                        ) VALUES (
                            'info',
                            'Geospatial ETL pipeline completed successfully',
                            %s,
                            CURRENT_TIMESTAMP
                        )
                    """, (json.dumps({
                        'duration_seconds': elapsed_time,
                        'timestamp': datetime.now().isoformat()
                    }),))
                    conn.commit()
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            
            # Log error
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO public.system_logs (
                            level, 
                            message, 
                            context,
                            created_at
                        ) VALUES (
                            'error',
                            'Geospatial ETL pipeline failed',
                            %s,
                            CURRENT_TIMESTAMP
                        )
                    """, (json.dumps({
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }),))
                    conn.commit()
            
            raise


def schedule_pipeline_runs(pipeline: GeospatialETLPipeline):
    """Schedule regular pipeline runs"""
    
    # Schedule risk assessments daily at 2 AM
    schedule.every().day.at("02:00").do(pipeline.calculate_parcel_risk_assessments)
    
    # Schedule active event detection every 15 minutes
    schedule.every(15).minutes.do(pipeline.detect_active_event_impacts)
    
    # Schedule full pipeline weekly on Sundays at 3 AM
    schedule.every().sunday.at("03:00").do(pipeline.run_full_pipeline)
    
    # Schedule statistics generation daily at 6 AM
    schedule.every().day.at("06:00").do(pipeline.generate_risk_statistics)
    
    logger.info("Pipeline scheduled. Running scheduler...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


def main():
    """Main entry point"""
    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL') or os.getenv('SUPABASE_DB_URL')
    if not db_url:
        logger.error("No database URL found. Set DATABASE_URL or SUPABASE_DB_URL")
        sys.exit(1)
    
    # Create pipeline instance
    pipeline = GeospatialETLPipeline(db_url)
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'run':
            # Run full pipeline once
            pipeline.run_full_pipeline()
        
        elif command == 'risk':
            # Run risk assessment only
            pipeline.calculate_parcel_risk_assessments()
        
        elif command == 'events':
            # Check active events only
            pipeline.detect_active_event_impacts()
        
        elif command == 'stats':
            # Generate statistics only
            pipeline.generate_risk_statistics()
        
        elif command == 'schedule':
            # Run scheduled pipeline
            schedule_pipeline_runs(pipeline)
        
        else:
            print(f"Unknown command: {command}")
            print("Usage: python geospatial-etl-pipeline.py [run|risk|events|stats|schedule]")
            sys.exit(1)
    
    else:
        # Default: run full pipeline once
        pipeline.run_full_pipeline()


if __name__ == "__main__":
    main()