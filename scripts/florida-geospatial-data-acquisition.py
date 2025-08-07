#!/usr/bin/env python3
"""
Florida Geospatial Open Data Portal Data Acquisition Script
Fetches and processes data from various Florida geospatial data sources
"""

import os
import sys
import json
import requests
import geopandas as gpd
from sqlalchemy import create_engine
from datetime import datetime
import logging
from typing import Dict, List, Optional
import time
from urllib.parse import quote

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Data source configurations
DATA_SOURCES = {
    "florida_parcels": {
        "name": "Florida Statewide Parcels",
        "url": "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/Florida_Parcels_2023/FeatureServer/0",
        "query_params": {
            "where": "1=1",
            "outFields": "*",
            "f": "geojson",
            "resultRecordCount": 1000,  # Fetch in batches
        },
        "target_table": "geospatial.parcels",
        "update_frequency": "monthly",
    },
    "fema_flood_zones": {
        "name": "FEMA National Flood Hazard Layer",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0",
        "query_params": {
            "where": "STATE = 'FL'",
            "outFields": "FLD_ZONE,ZONE_SUBTY,STATIC_BFE",
            "f": "geojson",
            "geometry": None,  # Will be set to Florida bounds
        },
        "target_table": "geospatial.hazard_zones",
        "hazard_type": "FEMA_FLOOD",
        "update_frequency": "monthly",
    },
    "storm_surge_zones": {
        "name": "SLOSH Storm Surge Zones",
        "url": "https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Storm_Surge_Planning_Zones_2022/FeatureServer/0",
        "query_params": {"where": "1=1", "outFields": "*", "f": "geojson"},
        "target_table": "geospatial.hazard_zones",
        "hazard_type": "STORM_SURGE",
        "update_frequency": "annually",
    },
    "active_wildfires": {
        "name": "Florida Active Wildfires",
        "url": "https://services3.arcgis.com/2p3s2n29pGgURi54/arcgis/rest/services/FFS_Active_Wildfires/FeatureServer/0",
        "query_params": {"where": "1=1", "outFields": "*", "f": "geojson"},
        "target_table": "geospatial.active_events",
        "event_type": "wildfire",
        "update_frequency": "15_minutes",
    },
    "fire_stations": {
        "name": "Florida Fire Stations",
        "url": "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/Florida_Fire_Stations/FeatureServer/0",
        "query_params": {
            "where": "1=1",
            "outFields": "NAME,ADDRESS,CITY,PHONE",
            "f": "geojson",
        },
        "target_table": "geospatial.critical_facilities",
        "facility_type": "fire_station",
        "update_frequency": "quarterly",
    },
}

# Florida bounding box for spatial queries
FLORIDA_BOUNDS = {
    "xmin": -87.634896,
    "ymin": 24.396308,
    "xmax": -79.974306,
    "ymax": 31.001056,
}


class FloridaGeospatialDataAcquisition:
    """Handles data acquisition from Florida geospatial sources"""

    def __init__(self, db_url: str):
        """Initialize with database connection"""
        self.engine = create_engine(db_url)
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "ClaimGuardian/1.0"})

    def fetch_data(self, source_config: Dict) -> Optional[gpd.GeoDataFrame]:
        """Fetch data from a single source"""
        try:
            logger.info(f"Fetching {source_config['name']}...")

            # Handle paginated requests for large datasets
            if source_config.get("paginated", False):
                return self._fetch_paginated_data(source_config)

            # Single request for smaller datasets
            response = self.session.get(
                source_config["url"] + "/query",
                params=source_config["query_params"],
                timeout=60,
            )
            response.raise_for_status()

            # Convert to GeoDataFrame
            gdf = gpd.GeoDataFrame.from_features(response.json()["features"])

            # Ensure CRS is WGS84
            if gdf.crs is None:
                gdf.set_crs("EPSG:4326", inplace=True)
            else:
                gdf = gdf.to_crs("EPSG:4326")

            logger.info(f"Fetched {len(gdf)} records from {source_config['name']}")
            return gdf

        except Exception as e:
            logger.error(f"Error fetching {source_config['name']}: {str(e)}")
            return None

    def _fetch_paginated_data(self, source_config: Dict) -> Optional[gpd.GeoDataFrame]:
        """Fetch large datasets in batches"""
        all_features = []
        offset = 0
        batch_size = source_config["query_params"].get("resultRecordCount", 1000)

        while True:
            try:
                params = source_config["query_params"].copy()
                params["resultOffset"] = offset

                response = self.session.get(
                    source_config["url"] + "/query", params=params, timeout=60
                )
                response.raise_for_status()

                data = response.json()
                features = data.get("features", [])

                if not features:
                    break

                all_features.extend(features)
                logger.info(
                    f"Fetched batch {offset}-{offset + len(features)} for {source_config['name']}"
                )

                # Check if we've fetched all records
                if len(features) < batch_size:
                    break

                offset += batch_size
                time.sleep(0.5)  # Rate limiting

            except Exception as e:
                logger.error(f"Error in paginated fetch at offset {offset}: {str(e)}")
                break

        if all_features:
            gdf = gpd.GeoDataFrame.from_features(all_features)
            if gdf.crs is None:
                gdf.set_crs("EPSG:4326", inplace=True)
            else:
                gdf = gdf.to_crs("EPSG:4326")
            return gdf

        return None

    def process_parcels(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Process parcel data for database insertion"""
        # Map fields to our schema
        gdf_processed = gdf.rename(
            columns={
                "PARCEL_ID": "parcel_id",
                "CO_NO": "county_fips",
                "COUNTY": "county_name",
                "SITUS_ADDR": "property_address",
                "OWN_NAME": "owner_name",
                "OWN_ADDR": "owner_address",
                "DOR_UC": "property_use_code",
                "JV": "assessed_value",
                "TV_NSD": "taxable_value",
                "YR_BLT": "year_built",
                "LV_SF": "living_area",
                "ACRES": "land_area",
            }
        )

        # Add metadata
        gdf_processed["data_source"] = "FL_OPEN_DATA"
        gdf_processed["last_updated"] = datetime.now()
        gdf_processed["raw_data"] = gdf.apply(lambda x: x.to_dict(), axis=1)

        # Ensure geometry column is named correctly
        gdf_processed = gdf_processed.rename_geometry("geom")

        return gdf_processed

    def process_hazard_zones(
        self, gdf: gpd.GeoDataFrame, hazard_type: str
    ) -> gpd.GeoDataFrame:
        """Process hazard zone data"""
        gdf_processed = gpd.GeoDataFrame()

        if hazard_type.startswith("FEMA_FLOOD"):
            # Map FEMA flood zones to our hazard types
            zone_mapping = {
                "AE": "FEMA_FLOOD_AE",
                "VE": "FEMA_FLOOD_VE",
                "X": "FEMA_FLOOD_X",
                "A": "FEMA_FLOOD_AE",  # Treat A zones as AE
            }

            gdf_processed["hazard_type_code"] = gdf["FLD_ZONE"].map(
                lambda x: zone_mapping.get(x, f"FEMA_FLOOD_{x}")
            )
            gdf_processed["zone_name"] = gdf["FLD_ZONE"]
            gdf_processed["zone_attributes"] = gdf.apply(
                lambda x: {"base_flood_elevation": x.get("STATIC_BFE", None)}, axis=1
            )

        elif hazard_type == "STORM_SURGE":
            # Map storm surge categories
            gdf_processed["hazard_type_code"] = "STORM_SURGE_" + gdf["CATEGORY"].astype(
                str
            )
            gdf_processed["zone_name"] = (
                "Category " + gdf["CATEGORY"].astype(str) + " Storm Surge"
            )
            gdf_processed["zone_attributes"] = gdf.drop(columns=["geometry"]).to_dict(
                "records"
            )

        gdf_processed["geom"] = gdf.geometry
        gdf_processed["effective_date"] = datetime.now().date()
        gdf_processed["data_version"] = datetime.now().strftime("%Y%m%d")

        return gdf_processed

    def process_facilities(
        self, gdf: gpd.GeoDataFrame, facility_type: str
    ) -> gpd.GeoDataFrame:
        """Process critical facility data"""
        gdf_processed = gpd.GeoDataFrame()

        gdf_processed["facility_type"] = facility_type
        gdf_processed["name"] = gdf.get("NAME", "Unknown")
        gdf_processed["address"] = gdf.get("ADDRESS", "")
        gdf_processed["phone"] = gdf.get("PHONE", "")
        gdf_processed["attributes"] = gdf.drop(columns=["geometry"]).to_dict("records")
        gdf_processed["geom"] = gdf.geometry

        return gdf_processed

    def process_active_events(
        self, gdf: gpd.GeoDataFrame, event_type: str
    ) -> gpd.GeoDataFrame:
        """Process active event data"""
        gdf_processed = gpd.GeoDataFrame()

        if event_type == "wildfire":
            gdf_processed["event_type"] = "wildfire"
            gdf_processed["event_name"] = gdf.get("FIRE_NAME", "Unnamed Fire")
            gdf_processed["status"] = gdf.get("STATUS", "active").str.lower()
            gdf_processed["severity"] = gdf.get("ACRES", 0).apply(
                lambda x: "high" if x > 100 else "medium" if x > 10 else "low"
            )
            gdf_processed["start_time"] = pd.to_datetime(
                gdf.get("DISCOVERY_DATE", datetime.now())
            )
            gdf_processed["attributes"] = gdf.drop(columns=["geometry"]).to_dict(
                "records"
            )
            gdf_processed["external_id"] = gdf.get("FIRE_ID", "")

        gdf_processed["geom"] = gdf.geometry
        gdf_processed["data_source"] = "FL_FOREST_SERVICE"

        return gdf_processed

    def load_to_database(
        self, gdf: gpd.GeoDataFrame, table_name: str, if_exists="append"
    ):
        """Load GeoDataFrame to PostGIS database"""
        try:
            # Split table name into schema and table
            schema, table = table_name.split(".")

            # Write to PostGIS
            gdf.to_postgis(
                table, self.engine, schema=schema, if_exists=if_exists, index=False
            )

            logger.info(f"Loaded {len(gdf)} records to {table_name}")

        except Exception as e:
            logger.error(f"Error loading to {table_name}: {str(e)}")
            raise

    def run_acquisition(self, sources: List[str] = None):
        """Run data acquisition for specified sources"""
        if sources is None:
            sources = list(DATA_SOURCES.keys())

        for source_key in sources:
            if source_key not in DATA_SOURCES:
                logger.warning(f"Unknown source: {source_key}")
                continue

            source_config = DATA_SOURCES[source_key]
            logger.info(f"\nProcessing {source_config['name']}...")

            # Skip if update not needed based on frequency
            # (In production, check last update time from database)

            # Fetch data
            gdf = self.fetch_data(source_config)
            if gdf is None or gdf.empty:
                logger.warning(f"No data fetched for {source_key}")
                continue

            # Process based on data type
            if source_key == "florida_parcels":
                gdf_processed = self.process_parcels(gdf)
            elif "hazard_type" in source_config:
                gdf_processed = self.process_hazard_zones(
                    gdf, source_config["hazard_type"]
                )
            elif "facility_type" in source_config:
                gdf_processed = self.process_facilities(
                    gdf, source_config["facility_type"]
                )
            elif "event_type" in source_config:
                gdf_processed = self.process_active_events(
                    gdf, source_config["event_type"]
                )
            else:
                logger.warning(f"No processor defined for {source_key}")
                continue

            # Load to database
            self.load_to_database(
                gdf_processed,
                source_config["target_table"],
                if_exists="replace" if source_key in ["active_wildfires"] else "append",
            )

            logger.info(f"✅ Completed {source_config['name']}")

            # Rate limiting between sources
            time.sleep(2)


def main():
    """Main entry point"""
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not db_url:
        logger.error("No database URL found. Set DATABASE_URL or SUPABASE_DB_URL")
        sys.exit(1)

    # Parse command line arguments
    sources = sys.argv[1:] if len(sys.argv) > 1 else None

    if sources and sources[0] == "--list":
        print("\nAvailable data sources:")
        for key, config in DATA_SOURCES.items():
            print(f"  {key}: {config['name']} (updates {config['update_frequency']})")
        return

    # Run acquisition
    acquisition = FloridaGeospatialDataAcquisition(db_url)
    acquisition.run_acquisition(sources)

    logger.info("\n✅ Data acquisition complete!")


if __name__ == "__main__":
    # Import pandas here to avoid import error if not needed
    import pandas as pd

    main()
