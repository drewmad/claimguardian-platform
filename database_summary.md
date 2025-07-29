# ClaimGuardian Database Summary

**Generated:** July 29, 2025  
**Project ID:** tmlrvecuwgppbaynesji  
**Database:** PostgreSQL 17.4.1.064  

## Database Files Created
- `complete_database_dump.sql` (667KB) - Full schema + data
- `database_schema_dump.sql` (226KB) - Schema only  
- `database_data_dump.sql` (1.2MB) - Data only

## Schema Overview

### Total Tables: 51

### Core Business Tables

#### User Management
- **user_profiles** - User account information, roles, verification status
- **login_activity** - User login tracking and security
- **user_security_answers** - Security question responses
- **user_legal_acceptance** - Legal document acceptance tracking
- **user_plans** - User subscription/plan information

#### Property Management  
- **properties_old** - Legacy property records with location data (PostGIS)
- **property_structures** - Building structure details
- **property_systems** - HVAC, electrical, plumbing systems
- **property_land** - Land and lot information
- **property_contractors** - Associated contractors
- **property_insurance** - Insurance policy details
- **property_damage** - Damage records and assessments
- **property_ai_insights** - AI-generated property analysis

#### Claims Processing
- **claims** - Insurance claims with status tracking
- **claim_status_history** - Claims status change audit trail
- **policy_documents** - Insurance policy document storage

#### AI & Automation
- **ai_models** - AI model configurations and metadata
- **damage_ai_detections** - AI-detected damage analysis
- **document_ai_extractions** - AI document processing results
- **property_ai_insights** - AI-generated property insights

#### Geographic Data
- **florida_counties** - Florida county information
- **florida_parcels** - Florida property parcel data (large dataset)
- **cities** - City reference data
- **counties** - County reference data  
- **states** - State reference data
- **zip_codes** - ZIP code reference data
- **fdot_stage** - Florida DOT staging area

#### Content Management
- **categories** - Hierarchical category system
- **item_categories** - Item categorization
- **item_types** - Item type definitions
- **coverage_types** - Insurance coverage types
- **insurance_companies** - Insurance carrier information

#### Data Collection & Processing
- **scraper_logs** - Web scraping activity logs
- **scraper_queue** - Scraping job queue
- **scraper_runs** - Scraping execution tracking
- **crawl_runs** - Web crawling execution records
- **physical_sites** - Physical location data for crawling

#### Audit & Security
- **audit_logs** - System audit trail
- **security_logs** - Security event logging
- **debug_user_creation_logs** - User creation debugging

#### Legal & Compliance
- **legal_documents** - Legal document storage
- **user_legal_acceptance** - User legal agreement tracking

### Key Data Types & Enums

#### Claim Status
- draft, submitted, under_review, approved, denied, settled, closed

#### AI Analysis Types  
- EMBEDDING, EXTRACTION, RISK_SCORING, VALUATION, DAMAGE_DETECTION, FRAUD_DETECTION, RECOMMENDATION, SUMMARY

#### Coverage Types
- dwelling, other_structure, personal_property, loss_of_use, personal_liability, medical_payments, scheduled_property, flood, wind, earthquake, other

#### Damage Types
- water, fire, wind, hail, theft, vandalism, other

#### User Roles
- user, admin, agent, adjuster

## Notable Features

### PostGIS Integration
- Location data stored as PostGIS geometry points (SRID 4326)
- Spatial queries for property location analysis
- Geographic data processing for Florida-specific datasets

### AI Integration
- Multiple AI analysis types supported
- AI task status tracking
- Document extraction and processing
- Damage detection and risk scoring

### Audit Trail
- Comprehensive history tracking for key entities
- Status change logging
- User activity monitoring
- Security event logging

### Florida-Specific Features
- Florida county and parcel data integration
- FDOT (Florida Department of Transportation) data staging
- Florida insurance regulation compliance

## Data Integrity Features

### Constraints & Relationships
- Foreign key relationships between users, properties, claims
- UUID primary keys throughout
- Proper referential integrity
- Row Level Security (RLS) policies

### Timestamps
- created_at/updated_at tracking on most tables
- Audit trail with timestamp tracking
- User activity timestamp logging

## Database Size Indicators
- Schema: ~226KB (complex structure with many tables/indexes)  
- Data: ~1.2MB (moderate dataset size)
- Total: ~667KB combined dump

## Access & Security
- Row Level Security (RLS) enabled
- User-based data isolation
- Audit logging for security events
- Legal compliance tracking