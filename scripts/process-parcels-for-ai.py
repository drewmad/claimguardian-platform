#!/usr/bin/env python3
"""
Process Florida Parcels for AI Analysis
Optimized for machine learning and spatial AI features
"""

import json
import pandas as pd
import geopandas as gpd
from pathlib import Path
import numpy as np
from datetime import datetime
import psycopg2
from sqlalchemy import create_engine
import os
from typing import Dict, List, Optional


class ParcelProcessor:
    """Process Florida parcel data for AI applications"""

    def __init__(self, data_dir: str = "./data/florida"):
        self.data_dir = Path(data_dir)
        self.charlotte_fips = "12015"
        self.charlotte_co_no = 15

    def load_shapefile(self, shapefile_path: str) -> gpd.GeoDataFrame:
        """Load shapefile with all 138 DOR columns"""
        print(f"Loading shapefile: {shapefile_path}")
        gdf = gpd.read_file(shapefile_path)

        # Ensure CRS is WGS84
        if gdf.crs != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")

        print(f"Loaded {len(gdf)} parcels with {len(gdf.columns)} columns")
        return gdf

    def prepare_for_ai(self, gdf: gpd.GeoDataFrame) -> pd.DataFrame:
        """Prepare data for AI analysis with feature engineering"""

        # Create AI-friendly features
        df = gdf.copy()

        # Numeric conversions with proper handling
        numeric_columns = [
            "JV",
            "TV_NSD",
            "LND_VAL",
            "IMP_VAL",
            "SALE_PRC1",
            "TOT_LVG_AR",
            "LND_SQFOOT",
            "EFF_YR_BLT",
            "ACT_YR_BLT",
        ]

        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Feature engineering for AI
        current_year = datetime.now().year

        # Age features
        if "EFF_YR_BLT" in df.columns:
            df["building_age"] = current_year - df["EFF_YR_BLT"]
            df["building_age"] = df["building_age"].clip(lower=0, upper=200)

        # Value ratios
        if all(col in df.columns for col in ["IMP_VAL", "LND_VAL"]):
            df["improvement_ratio"] = df["IMP_VAL"] / (
                df["IMP_VAL"] + df["LND_VAL"] + 1
            )

        if all(col in df.columns for col in ["TV_NSD", "JV"]):
            df["assessment_ratio"] = df["TV_NSD"] / (df["JV"] + 1)

        # Price per square foot
        if all(col in df.columns for col in ["JV", "TOT_LVG_AR"]):
            df["price_per_sqft"] = df["JV"] / (df["TOT_LVG_AR"] + 1)

        # Spatial features
        if "geometry" in df.columns:
            # Centroid coordinates
            df["centroid_lat"] = df.geometry.centroid.y
            df["centroid_lon"] = df.geometry.centroid.x

            # Area and perimeter
            df["parcel_area_sqm"] = df.geometry.area
            df["parcel_perimeter_m"] = df.geometry.length

            # Shape complexity
            df["shape_complexity"] = df["parcel_perimeter_m"] / (
                2 * np.sqrt(np.pi * df["parcel_area_sqm"])
            )

        # Use code categories for ML
        if "DOR_UC" in df.columns:
            df["use_category"] = df["DOR_UC"].str[:2]  # First 2 digits
            df["is_residential"] = df["DOR_UC"].str.startswith("0")
            df["is_commercial"] = df["DOR_UC"].str[:1].isin(["1", "2"])

        # Sales recency
        if "SALE_YR1" in df.columns:
            df["years_since_sale"] = current_year - pd.to_numeric(
                df["SALE_YR1"], errors="coerce"
            )
            df["years_since_sale"] = df["years_since_sale"].clip(lower=0, upper=100)

        # Owner type classification
        if "OWN_NAME" in df.columns:
            df["is_corporate_owner"] = df["OWN_NAME"].str.contains(
                "LLC|INC|CORP|LTD|LP|TRUST", case=False, na=False
            )

        return df

    def create_ai_embeddings(self, df: pd.DataFrame) -> np.ndarray:
        """Create embeddings for AI/ML models"""

        # Select features for embedding
        embedding_features = [
            "building_age",
            "improvement_ratio",
            "assessment_ratio",
            "price_per_sqft",
            "parcel_area_sqm",
            "shape_complexity",
            "years_since_sale",
            "is_residential",
            "is_commercial",
            "is_corporate_owner",
            "centroid_lat",
            "centroid_lon",
        ]

        # Filter to available features
        available_features = [f for f in embedding_features if f in df.columns]

        # Create embedding matrix
        X = df[available_features].fillna(0).values

        # Normalize features
        from sklearn.preprocessing import StandardScaler

        scaler = StandardScaler()
        X_normalized = scaler.fit_transform(X)

        print(f"Created embeddings with shape: {X_normalized.shape}")
        return X_normalized

    def export_for_supabase(self, df: pd.DataFrame, output_path: str):
        """Export processed data for Supabase import"""

        # Map to florida_parcels schema
        column_mapping = {
            # Keep all original columns and add mappings
            "geometry": "geom",
            "Shape_Area": "Shape__Area",
            "Shape_Length": "Shape__Length",
        }

        # Rename columns
        df_export = df.rename(columns=column_mapping)

        # Convert geometry to WKT
        if "geom" in df_export.columns:
            df_export["geom"] = df_export["geom"].apply(
                lambda g: f"SRID=4326;{g.wkt}" if g else None
            )

        # Add metadata
        df_export["data_source"] = "FLORIDA_DOR_2024"
        df_export["import_date"] = datetime.now().isoformat()
        df_export["ai_features_generated"] = True

        # Save to CSV for bulk import
        df_export.to_csv(output_path, index=False)
        print(f"Exported {len(df_export)} records to {output_path}")

    def process_charlotte_county(self):
        """Process Charlotte County parcels for AI"""

        # Find shapefile
        shp_files = list(self.data_dir.glob("**/*.shp"))
        if not shp_files:
            print("No shapefile found. Run process-shapefile-to-geojson.sh first")
            return

        # Load data
        gdf = self.load_shapefile(str(shp_files[0]))

        # Filter Charlotte County
        charlotte_gdf = gdf[gdf["CO_NO"] == self.charlotte_co_no]
        print(f"Filtered to {len(charlotte_gdf)} Charlotte County parcels")

        # Prepare for AI
        df_ai = self.prepare_for_ai(charlotte_gdf)

        # Create embeddings
        embeddings = self.create_ai_embeddings(df_ai)

        # Save embeddings
        np.save(self.data_dir / "charlotte_parcels_embeddings.npy", embeddings)

        # Export for Supabase
        self.export_for_supabase(
            df_ai, self.data_dir / "charlotte_parcels_ai_ready.csv"
        )

        # Save feature metadata
        feature_info = {
            "total_parcels": len(df_ai),
            "embedding_shape": embeddings.shape,
            "features_used": list(df_ai.columns),
            "ai_features": [
                "building_age",
                "improvement_ratio",
                "assessment_ratio",
                "price_per_sqft",
                "shape_complexity",
                "years_since_sale",
            ],
            "processing_date": datetime.now().isoformat(),
        }

        with open(self.data_dir / "ai_processing_metadata.json", "w") as f:
            json.dump(feature_info, f, indent=2)

        print("\n=== AI Processing Complete ===")
        print(f"Parcels processed: {len(df_ai)}")
        print(f"Embeddings shape: {embeddings.shape}")
        print(f"Output files in: {self.data_dir}")


if __name__ == "__main__":
    processor = ParcelProcessor()
    processor.process_charlotte_county()
