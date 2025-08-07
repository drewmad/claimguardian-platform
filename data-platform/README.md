# Data Platform

## Overview
Centralized data management platform for Florida property and parcel data processing.

## Structure
```
data-platform/
├── raw/                   # Unprocessed source data
│   ├── gis/              # GIS data files (shapefiles, GDB)
│   ├── parcels/          # Raw parcel data
│   └── florida/          # Florida-specific datasets
├── processed/            # Cleaned and transformed data
│   ├── cleaned/          # Data cleaning outputs
│   ├── imported/         # Import-ready files
│   └── validated/        # Quality-checked data
├── scripts/              # Data processing scripts
│   ├── import/           # Data ingestion tools
│   ├── export/           # Data export utilities
│   └── validation/       # Data quality checks
├── schemas/              # Data schemas and models
└── docs/                 # Data documentation

## Key Features
- **Parallel Processing**: High-performance data imports
- **Data Validation**: Automated quality checks
- **Schema Management**: Consistent data structures
- **Florida-Specific**: Optimized for Florida property data

## Usage
```bash
# Import Florida parcels
cd data-platform/scripts/import
./run-parallel-import.sh

# Validate imported data
node validation/verify-import-complete.js

# Export processed data
./export/export-to-csv.sh
```

## Data Sources
- Florida Department of Revenue (FDOR)
- County Property Appraisers
- GIS Cadastral databases
- Public records APIs
