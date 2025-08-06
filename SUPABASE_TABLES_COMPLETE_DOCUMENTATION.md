# ClaimGuardian Supabase Database - Complete Documentation
**Project ID**: `tmlrvecuwgppbaynesji`  
**Database**: ClaimGuardian AI-First Insurance Platform  
**Total Tables**: 68  
**Last Updated**: August 6, 2025

---

## 🏠 CORE BUSINESS TABLES (5 tables)

### 1. **user_profiles** - User Identity & Profile Management System
**Description**: Comprehensive user profile system with advanced signup tracking, authentication management, and behavioral analytics for Florida property owners and insurance clients.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes  
- **Primary Schema**: public

**Columns** (50 total):

| Column Name | Type | Default | Primary | Nullable | Unique | Array | Foreign Key | Description |
|-------------|------|---------|---------|----------|---------|-------|-------------|-------------|
| user_id | uuid | - | Yes | No | Yes | No | auth.users(id) | Primary identifier linking to Supabase Auth |
| created_at | timestamptz | now() | No | Yes | No | No | No | Account creation timestamp |
| updated_at | timestamptz | now() | No | Yes | No | No | No | Last profile update timestamp |
| signup_ip_address | text | null | No | Yes | No | No | No | IP address during registration for security tracking |
| signup_user_agent | text | null | No | Yes | No | No | No | Browser/device info during signup |
| signup_device_fingerprint | text | null | No | Yes | No | No | No | Unique device identifier for fraud prevention |
| signup_referrer | text | null | No | Yes | No | No | No | Website that referred the user |
| signup_landing_page | text | null | No | Yes | No | No | No | First page visited during signup flow |
| signup_utm_source | text | null | No | Yes | No | No | No | Marketing campaign source tracking |
| signup_utm_medium | text | null | No | Yes | No | No | No | Marketing medium (email, social, search) |
| signup_utm_campaign | text | null | No | Yes | No | No | No | Specific marketing campaign identifier |
| signup_country | text | null | No | Yes | No | No | No | Country detected during registration |
| signup_region | text | null | No | Yes | No | No | No | State/region during registration |
| signup_city | text | null | No | Yes | No | No | No | City detected during registration |
| signup_postal_code | text | null | No | Yes | No | No | No | ZIP code detected during registration |
| signup_timezone | text | null | No | Yes | No | No | No | User's timezone for scheduling |
| signup_latitude | double precision | null | No | Yes | No | No | No | Approximate location latitude |
| signup_longitude | double precision | null | No | Yes | No | No | No | Approximate location longitude |
| signup_timestamp | timestamptz | null | No | Yes | No | No | No | Exact moment registration started |
| signup_completed_at | timestamptz | null | No | Yes | No | No | No | When registration process finished |
| signup_source | text | null | No | Yes | No | No | No | Registration source (web, mobile, api) |
| signup_device_type | text | null | No | Yes | No | No | No | Device category (mobile, desktop, tablet) |
| signup_utm_term | text | null | No | Yes | No | No | No | Specific search terms or keywords |
| signup_utm_content | text | null | No | Yes | No | No | No | Ad content or creative identifier |
| signup_country_code | text | null | No | Yes | No | No | No | ISO country code (US, CA, etc.) |
| account_status | text | 'active' | No | Yes | No | No | No | Current account status (active, suspended, closed) |
| account_type | text | 'free' | No | Yes | No | No | No | Account plan type (free, premium, enterprise) |
| risk_score | numeric | 0 | No | Yes | No | No | No | Fraud/risk assessment score (0-100) |
| trust_level | text | 'new' | No | Yes | No | No | No | User trust level (new, verified, trusted, vip) |
| last_login_at | timestamptz | null | No | Yes | No | No | No | Most recent login timestamp |
| last_login_ip | text | null | No | Yes | No | No | No | IP address of last login |
| login_count | integer | 0 | No | Yes | No | No | No | Total number of successful logins |
| failed_login_count | integer | 0 | No | Yes | No | No | No | Failed login attempts counter |
| last_failed_login_at | timestamptz | null | No | Yes | No | No | No | Timestamp of most recent failed login |
| password_changed_at | timestamptz | null | No | Yes | No | No | No | When password was last updated |
| email_verified_at | timestamptz | null | No | Yes | No | No | No | Email verification completion time |
| phone_verified_at | timestamptz | null | No | Yes | No | No | No | Phone number verification time |
| two_factor_enabled | boolean | false | No | Yes | No | No | No | Whether 2FA is enabled |
| two_factor_method | text | null | No | Yes | No | No | No | 2FA method (sms, totp, email) |
| preferences | jsonb | {} | No | Yes | No | No | No | User interface and notification preferences |
| tags | text[] | {} | No | Yes | No | Yes | No | Administrative tags for user categorization |
| notes | text | null | No | Yes | No | No | No | User-visible notes and comments |
| internal_notes | text | null | No | Yes | No | No | No | Internal staff notes (not visible to user) |
| metadata | jsonb | {} | No | Yes | No | No | No | Additional structured data and integrations |
| first_name | text | null | No | Yes | No | No | No | User's first name |
| last_name | text | null | No | Yes | No | No | No | User's last name |
| email | text | null | No | Yes | No | No | No | Primary email address |
| x_handle | text | null | No | Yes | No | No | No | X (Twitter) handle for social integration |
| is_x_connected | boolean | false | No | Yes | No | No | No | Whether X account is linked |
| tier | user_tier | 'free' | No | Yes | No | No | user_tiers(tier_name) | Subscription tier (free, homeowner, landlord, enterprise) |

---

### 2. **claims** - Insurance Claims Lifecycle Management
**Description**: Complete insurance claims management system with AI-powered damage assessment, coverage analysis, and settlement optimization for Florida property insurance claims.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns** (36 total):

| Column Name | Type | Default | Primary | Nullable | Unique | Array | Foreign Key | Description |
|-------------|------|---------|---------|----------|---------|-------|-------------|-------------|
| id | uuid | uuid_generate_v4() | Yes | No | Yes | No | No | Primary claim identifier |
| user_id | uuid | null | No | Yes | No | No | user_profiles(user_id) | Claim owner reference |
| property_id | uuid | null | No | Yes | No | No | properties(id) | Associated property reference |
| policy_id | uuid | null | No | Yes | No | No | policies(id) | Insurance policy reference |
| claim_number | text | null | No | Yes | Yes | No | No | Auto-generated claim number (YYYY-NNNNNN) |
| external_claim_number | text | null | No | Yes | No | No | No | Insurance company's claim number |
| status | claim_status | 'draft' | No | Yes | No | No | No | Current claim status (draft, submitted, investigating, approved, denied, settled, closed, reopened, withdrawn) |
| date_of_loss | date | null | No | No | No | No | No | When the damage occurred |
| date_reported | date | CURRENT_DATE | No | Yes | No | No | No | When claim was reported to insurer |
| damage_type | text | null | No | No | No | No | No | Type of damage (hurricane, flood, fire, theft, etc.) |
| damage_severity | damage_severity | null | No | Yes | No | No | No | AI-assessed severity (minor, moderate, major, severe, catastrophic) |
| description | text | null | No | Yes | No | No | No | Detailed description of damage and circumstances |
| estimated_value | numeric | null | No | Yes | No | No | No | Initial damage estimate in USD |
| deductible_applied | numeric | null | No | Yes | No | No | No | Policy deductible amount |
| approved_amount | numeric | null | No | Yes | No | No | No | Insurer-approved settlement amount |
| settled_value | numeric | null | No | Yes | No | No | No | Final negotiated settlement |
| paid_amount | numeric | 0 | No | Yes | No | No | No | Amount actually paid by insurer |
| adjuster_name | text | null | No | Yes | No | No | No | Assigned insurance adjuster name |
| adjuster_phone | text | null | No | Yes | No | No | No | Adjuster contact phone |
| adjuster_email | text | null | No | Yes | No | No | No | Adjuster contact email |
| adjuster_company | text | null | No | Yes | No | No | No | Adjusting company name |
| inspection_date | date | null | No | Yes | No | No | No | Scheduled or completed inspection date |
| approval_date | date | null | No | Yes | No | No | No | When claim was approved |
| settlement_date | date | null | No | Yes | No | No | No | Date settlement was reached |
| payment_date | date | null | No | Yes | No | No | No | Date payment was received |
| closed_date | date | null | No | Yes | No | No | No | Date claim was officially closed |
| supporting_documents | jsonb | [] | No | Yes | No | No | No | Array of document references and metadata |
| photos | jsonb | [] | No | Yes | No | No | No | Damage photos with AI analysis metadata |
| notes | text | null | No | Yes | No | No | No | User notes and updates |
| ai_damage_assessment | jsonb | null | No | Yes | No | No | No | AI-generated damage analysis and recommendations |
| ai_coverage_analysis | jsonb | null | No | Yes | No | No | No | AI assessment of policy coverage applicability |
| ai_recommendations | jsonb | null | No | Yes | No | No | No | AI suggestions for claim optimization |
| created_at | timestamptz | now() | No | Yes | No | No | No | Claim creation timestamp |
| updated_at | timestamptz | now() | No | Yes | No | No | No | Last update timestamp |
| version | integer | 1 | No | Yes | No | No | No | Record version for optimistic locking |
| metadata | jsonb | {} | No | Yes | No | No | No | Additional structured claim data |

---

### 3. **policies** - Insurance Policy Management System
**Description**: Comprehensive insurance policy management with AI-powered document extraction, coverage analysis, and multi-policy support for Florida property owners.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns** (30 total):

| Column Name | Type | Default | Primary | Nullable | Unique | Array | Foreign Key | Description |
|-------------|------|---------|---------|----------|---------|-------|-------------|-------------|
| id | uuid | uuid_generate_v4() | Yes | No | Yes | No | No | Primary policy identifier |
| user_id | uuid | null | No | Yes | No | No | user_profiles(user_id) | Policy owner reference |
| property_id | uuid | null | No | Yes | No | No | properties(id) | Covered property reference |
| policy_number | text | null | No | No | Yes | No | No | Insurance company policy number |
| carrier_name | text | null | No | No | No | No | No | Insurance company name |
| policy_type | policy_type | null | No | Yes | No | No | No | Type (homeowners, flood, wind, umbrella, condo, renters, commercial) |
| status | policy_status | 'active' | No | Yes | No | No | No | Current policy status |
| effective_date | date | null | No | Yes | No | No | No | When coverage begins |
| expiration_date | date | null | No | Yes | No | No | No | When coverage ends |
| renewal_date | date | null | No | Yes | No | No | No | Next renewal date |
| premium_amount | numeric | null | No | Yes | No | No | No | Annual premium cost |
| deductible_amount | numeric | null | No | Yes | No | No | No | Policy deductible |
| coverage_limits | jsonb | {} | No | Yes | No | No | No | Coverage limits by category |
| coverage_details | jsonb | {} | No | Yes | No | No | No | Detailed coverage breakdown |
| exclusions | jsonb | [] | No | Yes | No | No | No | Policy exclusions and limitations |
| endorsements | jsonb | [] | No | Yes | No | No | No | Additional coverage endorsements |
| agent_name | text | null | No | Yes | No | No | No | Insurance agent name |
| agent_phone | text | null | No | Yes | No | No | No | Agent contact phone |
| agent_email | text | null | No | Yes | No | No | No | Agent contact email |
| agency_name | text | null | No | Yes | No | No | No | Insurance agency name |
| billing_method | text | null | No | Yes | No | No | No | Premium payment method |
| payment_schedule | text | null | No | Yes | No | No | No | Payment frequency (monthly, quarterly, annual) |
| auto_renew | boolean | true | No | Yes | No | No | No | Whether policy auto-renews |
| ai_extracted_data | jsonb | null | No | Yes | No | No | No | AI-extracted policy information from documents |
| document_references | jsonb | [] | No | Yes | No | No | No | Links to policy documents in storage |
| created_at | timestamptz | now() | No | Yes | No | No | No | Policy record creation |
| updated_at | timestamptz | now() | No | Yes | No | No | No | Last update timestamp |
| version | integer | 1 | No | Yes | No | No | No | Record version number |
| metadata | jsonb | {} | No | Yes | No | No | No | Additional policy metadata |
| notes | text | null | No | Yes | No | No | No | User notes about policy |

---

### 4. **audit_logs** - Security & Compliance Audit Trail
**Description**: Comprehensive audit logging system for security monitoring, compliance tracking, and user activity analysis across the ClaimGuardian platform.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns** (9 total):

| Column Name | Type | Default | Primary | Nullable | Unique | Array | Foreign Key | Description |
|-------------|------|---------|---------|----------|---------|-------|-------------|-------------|
| id | uuid | gen_random_uuid() | Yes | No | Yes | No | No | Unique audit log entry identifier |
| user_id | uuid | null | No | Yes | No | No | user_profiles(user_id) | User who performed the action (null for system actions) |
| action | text | null | No | No | No | No | No | Action performed (login, create_claim, update_policy, etc.) |
| resource_type | text | null | No | Yes | No | No | No | Type of resource affected (user, claim, property, policy) |
| resource_id | text | null | No | Yes | No | No | No | Identifier of affected resource |
| ip_address | inet | null | No | Yes | No | No | No | IP address of the actor |
| user_agent | text | null | No | Yes | No | No | No | Browser/client user agent string |
| metadata | jsonb | {} | No | Yes | No | No | No | Additional context data (before/after values, session info) |
| created_at | timestamptz | now() | No | Yes | No | No | No | When the action occurred |

---

### 5. **properties** - Property Digital Twin System
**Description**: Comprehensive Florida property information system with GIS integration, AI-powered valuation, and hurricane risk assessment for insurance optimization.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: core

**Note**: This table exists in the `core` schema rather than `public` and contains approximately 43 columns with GIS geometry support, property valuation data, and Florida-specific features like hurricane zone classifications.

---

## 🌴 FLORIDA-SPECIFIC DATA TABLES (6 tables)

### 6. **florida_parcels** - Statewide Property Database
**Description**: Complete Florida Department of Revenue cadastral dataset containing all property records across all 67 counties with ownership, valuation, and geographic information.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: No (too large for real-time)
- **Primary Schema**: public

**Record Count**: ~15+ million parcels statewide  
**Columns**: 138 total (complete DOR schema)

**Key Columns**:
- **PARCEL_ID** (text, Primary Key): Unique property identifier
- **CO_NO** (integer, Foreign Key): County number (1-67)
- **OWN_NAME** (text): Property owner name
- **PROP_USE** (text): Property use classification
- **TOTAL_VALUE** (numeric): Total assessed property value
- **SALE_PRC** (numeric): Most recent sale price
- **SALE_YR** (text): Year of last sale
- **LUC_COD** (text): Land use code
- **NO_BULDNG** (integer): Number of buildings
- **ACT_YR_BLT** (integer): Actual year built

**Purpose**: Supports property enrichment, valuation analysis, and ownership verification for insurance applications.

---

### 7. **fl_counties** - Florida Counties Reference
**Description**: Complete reference data for all 67 Florida counties with geographic and administrative information.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns**:
- **county_id** (integer, Primary Key): Unique county identifier
- **county_name** (text): Official county name
- **county_fips** (text): FIPS code for geographic reference
- **state_code** (text): State abbreviation (FL)
- **region** (text): Geographic region classification
- **population** (integer): Current population estimate
- **area_sq_miles** (numeric): County area in square miles
- **created_at** (timestamptz): Record creation timestamp

---

### 8. **FL_Companies** - Florida Insurance Companies
**Description**: Registry of insurance companies licensed to operate in Florida with regulatory and contact information.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Validates insurance carriers and provides regulatory compliance information for policy management.

---

### 9. **tidal_stations** - Coastal Monitoring Network
**Description**: NOAA tidal monitoring stations throughout Florida for flood risk assessment and hurricane surge prediction.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Supports coastal property risk analysis and flood insurance requirements.

---

### 10. **disaster_events** - Hurricane & Weather Events
**Description**: Historical and real-time disaster events affecting Florida properties for risk modeling and claims correlation.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Tracks hurricanes, tornadoes, floods, and other events for property risk assessment.

---

### 11. **geospatial_data_loads** - Data Import Tracking
**Description**: Monitoring and tracking system for large-scale geospatial data imports including parcel updates and geographic data synchronization.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Tracks data import progress, errors, and validation for maintaining data quality.

---

## 🤖 AI/ML OPERATIONS TABLES (12 tables)

### 12. **claude_errors** - Claude AI Error Tracking
**Description**: Comprehensive error logging system for Claude AI operations with learning and improvement tracking.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns**:
- **id** (uuid, Primary Key): Error record identifier
- **error_type** (text): Category of error (syntax, logic, type, runtime)
- **task_type** (text): Type of task being performed
- **context** (jsonb): Full error context and environment
- **resolved** (boolean): Whether error has been resolved
- **resolution** (text): How the error was fixed
- **created_at** (timestamptz): When error occurred

---

### 13. **claude_learnings** - Claude AI Learning System
**Description**: Knowledge accumulation system for Claude AI to learn from past interactions and improve performance over time.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Columns**:
- **id** (uuid, Primary Key): Learning record identifier
- **task_type** (text): Type of task learned from
- **lesson_learned** (text): Key insight gained
- **context_tags** (text[]): Categorization tags
- **confidence_score** (numeric): Confidence in the learning
- **application_count** (integer): How often learning has been applied
- **effectiveness_score** (numeric): Success rate when applied

---

### 14. **ai_usage_logs** - AI Services Usage Tracking
**Description**: Comprehensive logging of all AI service usage including OpenAI, Google Gemini, and custom models with cost tracking and performance metrics.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Cost optimization, usage analytics, and performance monitoring across all AI services.

---

### 15. **ai_processing_queue** - AI Task Queue Management
**Description**: Task queue system for managing AI processing jobs including document analysis, damage assessment, and policy extraction with priority and retry logic.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Manages high-volume AI processing tasks with load balancing and failure recovery.

---

### 16. **ml_model_deployments** - ML Model Management
**Description**: Deployment tracking and version management for machine learning models used in damage assessment, fraud detection, and risk scoring.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: MLOps pipeline management for production AI models.

---

### 17. **ml_model_versions** - Model Version Control
**Description**: Version control system for ML models with performance metrics, rollback capabilities, and A/B testing support.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Manages model updates, performance tracking, and deployment strategies.

---

### 18. **federated_learning_rounds** - Distributed Learning
**Description**: Coordination system for federated learning across multiple ClaimGuardian instances while preserving data privacy.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Enables collaborative AI improvement without data sharing.

---

### 19. **federated_nodes** - Learning Network Nodes
**Description**: Registry of participating nodes in the federated learning network with capability and trust scoring.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Manages distributed learning network topology and security.

---

### 20. **ai_training_datasets** - Training Data Management
**Description**: Management system for AI training datasets with privacy compliance, versioning, and quality metrics.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Ensures high-quality, compliant training data for AI models.

---

### 21. **ai_stream_processors** - Real-time AI Processing
**Description**: Real-time stream processing system for immediate AI analysis of incoming data like photos, documents, and sensor data.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Powers real-time AI features like instant damage analysis.

---

### 22. **ai_explanations** - AI Explainability System
**Description**: Stores explanations and reasoning for AI decisions to ensure transparency and regulatory compliance.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Provides audit trail and explanations for AI-driven insurance decisions.

---

### 23. **ml_performance_metrics** - AI Performance Monitoring
**Description**: Continuous monitoring of AI model performance with accuracy, latency, and drift detection metrics.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Purpose**: Ensures AI models maintain high performance in production.

---

## 👤 USER MANAGEMENT TABLES (13 tables)

### 24. **user_sessions** - Session Management
**Description**: Secure session tracking with device fingerprinting, location monitoring, and suspicious activity detection.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 25. **user_devices** - Device Registry
**Description**: Trusted device management for enhanced security and seamless user experience across multiple devices.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 26. **user_preferences** - User Preferences
**Description**: Comprehensive user preference management including UI settings, notification preferences, and privacy controls.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 27. **user_permissions** - Granular Permissions
**Description**: Fine-grained permission system for controlling user access to features, data, and administrative functions.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 28. **user_tiers** - Subscription Tiers
**Description**: Subscription tier management with feature access control and billing integration.

**Settings**:
- **RLS Enabled**: No (reference data)
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Tiers**: Free, Homeowner Essentials ($19/month), Landlord Pro ($49/month), Enterprise ($199/month)

---

### 29. **user_subscriptions** - Subscription Management
**Description**: Stripe integration for subscription lifecycle management including billing, renewals, and feature access.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 30. **login_activity** - Login Monitoring
**Description**: Detailed login activity tracking with geolocation, device analysis, and anomaly detection for security monitoring.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 31. **user_consents** - Privacy Consent Management
**Description**: GDPR and privacy regulation compliance system for managing user consents and data processing permissions.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 32. **user_tracking** - Analytics & Behavior
**Description**: User behavior analytics for product improvement and personalization while maintaining privacy compliance.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 33. **user_activity_logs** - Activity Monitoring
**Description**: Comprehensive user activity logging for support, debugging, and usage analysis.

**Settings**:
- **RLS Enabled**: No (aggregated data)
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 34. **user_activity_log** - Individual Activity Log
**Description**: Personal activity log for users to track their own platform usage and data access.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 35. **user_checklist_progress** - Onboarding Progress
**Description**: Tracks user progress through onboarding checklists and feature adoption milestones.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 36. **user_permission_overrides** - Permission Overrides
**Description**: Administrative system for overriding standard permissions in special circumstances.

**Settings**:
- **RLS Enabled**: No (admin table)
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## 📄 DOCUMENT MANAGEMENT TABLES (4 tables)

### 37. **policy_documents** - Policy Document Storage
**Description**: Secure document management for insurance policies with AI extraction metadata and version control.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**Storage Integration**: Links to Supabase Storage bucket with security policies

---

### 38. **document_extractions** - AI Document Processing
**Description**: AI-powered document extraction results with confidence scoring and manual review workflow.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

**AI Models**: OpenAI GPT-4V, Google Gemini Pro Vision

---

### 39. **file_uploads** - File Upload Management
**Description**: Centralized file upload tracking with virus scanning, format validation, and storage optimization.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 40. **legal_documents** - Legal Document System
**Description**: Version-controlled legal documents including terms of service, privacy policy, and compliance documents.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## 📊 LOGGING & MONITORING TABLES (7 tables)

### 41. **security_logs** - Security Event Logging
**Description**: Security-focused event logging with threat detection, failed access attempts, and compliance monitoring.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 42. **error_logs** - Application Error Tracking
**Description**: Comprehensive application error tracking with stack traces, user context, and resolution tracking.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 43. **email_logs** - Email Communication Tracking
**Description**: Email delivery tracking with open rates, click-through analysis, and bounce management via Resend API.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 44. **monitoring_logs** - System Performance Monitoring
**Description**: System performance metrics, health checks, and operational monitoring with alerting integration.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 45. **learnings** - General Learning System
**Description**: Platform-wide learning system for capturing insights, patterns, and improvements beyond AI-specific learning.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 46. **parcel_access_logs** - Parcel Data Access Monitoring
**Description**: Tracks access to Florida parcel data for compliance with data usage agreements and privacy protection.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 47. **parcel_access_test** - Parcel Access Testing
**Description**: Testing framework for validating parcel data access controls and performance optimization.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## 🏘️ COMMUNITY FEATURES TABLES (3 tables)

### 48. **community_contributions** - Community Insights
**Description**: User-generated content including neighborhood insights, contractor recommendations, and damage reports.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 49. **community_insights_cache** - Cached Community Data
**Description**: Performance optimization cache for frequently accessed community insights and neighborhood data.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 50. **community_analytics_sessions** - Community Analytics
**Description**: Analytics tracking for community features usage and engagement metrics.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## ⚙️ SPECIALIZED SYSTEMS TABLES (14 tables)

### 51. **stream_analytics_results** - Real-time Analytics
**Description**: Results from real-time stream processing analytics with pattern detection and anomaly identification.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 52. **subscription_tiers** - Tier Management
**Description**: Subscription tier configuration with feature flags, limits, and billing integration.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 53. **tier_permissions** - Tier-Based Permissions
**Description**: Permission mapping for different subscription tiers with granular feature control.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 54. **permissions** - Core Permissions System
**Description**: Master permissions registry with hierarchical permission structure and inheritance.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 55. **personal_property** - Personal Property Inventory
**Description**: Digital inventory management for personal property with AI-powered valuation and insurance optimization.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 56. **property_systems** - Property Systems Tracking
**Description**: HVAC, electrical, plumbing, and roofing system tracking with maintenance schedules and warranty information.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 57. **floor_plans** - Property Floor Plans
**Description**: Digital floor plan storage with AI-powered spatial analysis and damage assessment integration.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 58. **ar_scan_sessions** - AR Scanning System
**Description**: Augmented reality scanning sessions for property documentation and damage assessment.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 59. **model_tasks** - 3D Model Tasks
**Description**: Task queue for 3D model generation from photogrammetry and AR scanning data.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 60. **claims_history** - Claims Historical Data
**Description**: Immutable historical record of all claim changes with temporal data management.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 61. **policies_history** - Policy Historical Data
**Description**: Version history for insurance policies with change tracking and audit compliance.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 62. **properties_history** - Property Historical Data
**Description**: Historical property data changes with temporal tracking for market analysis.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 63. **coverage_types** - Insurance Coverage Types
**Description**: Master list of insurance coverage types with definitions and regulatory requirements.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 64. **florida_parcels_orchestrator** - Parcel Data Orchestration
**Description**: Orchestration system for managing large-scale Florida parcel data processing and updates.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## 🛠️ UTILITY & REFERENCE TABLES (4 tables)

### 65. **spatial_ref_sys** - PostGIS Spatial Reference
**Description**: PostGIS system table for spatial reference systems used in geographic data processing.

**Settings**:
- **RLS Enabled**: No (PostGIS system table)
- **Realtime Enabled**: No
- **Primary Schema**: public

**Purpose**: Required for GIS operations and coordinate system transformations.

---

### 66. **signup_consents** - Signup Consent Tracking
**Description**: GDPR compliance tracking for consents captured during user registration process.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 67. **consent_audit_log** - Consent Audit Trail
**Description**: Immutable audit trail for all consent-related actions ensuring regulatory compliance.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

### 68. **user_legal_acceptance** - Legal Document Acceptance
**Description**: Tracking system for user acceptance of terms of service, privacy policy, and other legal documents.

**Settings**:
- **RLS Enabled**: Yes
- **Realtime Enabled**: Yes
- **Primary Schema**: public

---

## 📈 ADDITIONAL PROCESSING TABLES

### Florida Parcel Processing Tables (3 tables)
- **florida_parcels_processing_log**: Import process monitoring
- **florida_parcels_processing_stats**: Performance statistics  
- **marketing_attribution**: Marketing campaign tracking

### Profile & Activity Tables (2 tables)
- **profiles**: Legacy profile system (being migrated to user_profiles)

---

## 🔐 SECURITY SUMMARY

**Row Level Security (RLS)**:
- ✅ **64 tables (94.1%)** have RLS enabled
- ❌ **4 tables (5.9%)** without RLS:
  - `spatial_ref_sys` (PostGIS system table)
  - `user_activity_logs` (aggregated reporting)
  - `user_permission_overrides` (admin operations)
  - `user_tiers` (reference data)

**Real-time Subscriptions**: Most tables support real-time updates via Supabase Realtime for live UI updates.

**Data Classification**:
- **PII Data**: Secured in user_profiles with encryption
- **Financial Data**: Claims and policy amounts with audit trails
- **Geographic Data**: Florida parcel data with access logging
- **AI Data**: ML models and training data with version control

---

## 🗂️ CUSTOM DATABASE TYPES

**Enums** (10 types):
1. **claim_status**: draft, submitted, acknowledged, investigating, approved, denied, settled, closed, reopened, withdrawn
2. **damage_severity**: minor, moderate, major, severe, catastrophic  
3. **policy_type**: homeowners, flood, wind, umbrella, condo, renters, commercial
4. **policy_status**: active, inactive, cancelled, expired, pending
5. **document_type**: policy, claim_form, estimate, photo, receipt, correspondence, report
6. **user_tier**: free, homeowner, landlord, enterprise
7. **notification_type**: email, sms, push, in_app
8. **priority_level**: low, medium, high, urgent, critical
9. **processing_status**: pending, processing, completed, failed, retrying
10. **geographic_region**: north, central, south, keys, panhandle

---

*This documentation represents the complete ClaimGuardian database architecture as of August 6, 2025. The system demonstrates enterprise-grade design specifically optimized for Florida property insurance with comprehensive AI integration, security compliance, and real-time capabilities.*