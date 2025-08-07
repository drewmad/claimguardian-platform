# ClaimGuardian Comprehensive Data Collection Guide

## Overview
This document provides a comprehensive checklist of every data point ClaimGuardian can capture for Florida homeowners' insurance claims, damage assessments, and related workflows.

---

## 1. Policy & Coverage
- Policy number (primary key)
- Policy form (HO‑1 … HO‑8, DP, NFIP, wind‑only, excess flood)
- Carrier name & NAIC code
- Effective / expiration dates
- Covered perils list
- Coverage A – Dwelling limit
- Coverage B – Other structures limit
- Coverage C – Personal property limit & valuation basis (ACV/RCT/RV)
- Coverage D – Loss of use / ALE limit
- Coverage E – Personal liability limit
- Coverage F – Medical payments limit
- Endorsements/riders (codes, descriptions, limits)
- Deductibles (hurricane, AOP, percentage vs fixed)
- Coinsurance & insurance‑to‑value ratio
- Prior claims count & details
- Mortgagee / loss‑payee information

## 2. Insured & Occupants
- Named insured(s) full legal name(s)
- Contact details (phone, email, mailing address)
- Preferred communication method
- Date of birth & driver license #
- Social Security / EIN (hashed or tokenized)
- Occupancy type (primary, seasonal, rental, vacant)
- Number of occupants & pets
- Special needs / accessibility notes

## 3. Property & Location
- Physical address (parsed & geocoded lat/long)
- County, municipality, FEMA flood zone, evacuation zone
- Construction year & permit history
- Building occupancy type (single‑family, duplex, condo, etc.)
- Square footage (living, non‑living)
- Stories, roof pitch & material
- Wall construction material
- Foundation type & elevation
- Opening protection rating (shutters, impact glass)
- Attached/detached structures inventory
- Building code edition in force at build date & at loss date
- Prior inspections & mitigation discounts (wind, four‑point, roof cert)
- Property photos baseline & 3‑D scan UUIDs

## 4. Loss Event Metadata
- Claim number (unique)
- Date / time of loss (ISO‑8601, local & UTC)
- Date reported
- FNOL channel (phone, web, app, agent)
- Cause of loss classification (wind, water, fire, theft, liability, other)
- Detailed cause narrative
- Incident police/fire report numbers
- Third‑party bodily injury Y/N
- Emergency response services engaged (EMS, fire dept, police)
- Catastrophe event tag (CAT code, PCS event ID)

## 5. Weather & Environmental Corroboration
- NOAA/NWS point forecasts at loss time
- Radar precipitation estimates (QPE)
- Max wind gust & sustained wind
- Lightning strike distance & timestamp
- Flood stage height & duration
- Hurricane advisory data (NHC positions, Saffir scale)
- Hail size, return period
- Sun/moon elevation (for burglaries/vandalism)
- Tide level (for coastal flood claims)

## 6. Damage Scope – Structural
- Room/area breakdown (unique ID, name, level)
- Element type (roof, wall, floor, window, door, HVAC, pool cage, dock…)
- Material & finish pre‑loss
- Damage description text
- Damage severity scale (none, minor, major, total)
- Measurements (length, width, depth, pitch)
- Moisture readings (pin & pinless, RH)
- Infrared thermography images & temperature deltas
- Photo evidence URI list
- Drone imagery URI list
- Lidar/photogrammetry model ID & point‑cloud size
- Safety hazards (asbestos, lead, structural collapse risk)
- Code upgrade requirements flag

## 7. Damage Scope – Contents
- Item unique ID (SKU/hash)
- Category (electronics, furniture, clothing, tools, appliances, etc.)
- Make/model/serial #
- Purchase date & price
- Depreciation schedule (IRS class life, custom)
- Salvageable Y/N
- Current condition notes
- Replacement cost
- Actual cash value
- Photographic proof URI list

## 8. Additional Living Expense (ALE)
- Displacement start / end dates
- Temporary housing vendor & address
- Daily lodging cost
- Meal per‑diem
- Laundry, pet boarding, storage fees
- Mileage & transportation costs
- Receipts (URI, OCR text, amount, tax)

## 9. Mitigation & Emergency Services
- Vendor company & license #
- Service start / end timestamps
- Tasks performed (water extraction, board‑up, tarping, tree removal)
- Equipment deployed (dehumidifiers, air movers)
- Dry standard vs actual readings
- Materials used (sq ft tarp, board type)
- Mitigation invoice & line items
- Photos before/after mitigation

## 10. Estimates & Repair Workflow
- Estimator name & credential (Xactimate ID, contractor license)
- Estimating platform (Xactimate, Symbility, CoreLogic)
- Estimate version # & date
- Line item code (e.g., RFG220‑RCV)
- Quantity, unit, unit cost, market pricing source
- Overhead & profit %
- Sales tax %
- Code upgrade line items flagged
- Contractor bids (PDF/CSV, vendor ID, bid total, exclusions)
- Change orders (ID, description, delta cost, delta days)
- Work authorization signed Y/N, timestamp
- Project schedule (critical path tasks, start/finish, % complete)
- Progress photos & pay app IDs
- Final completion certificate date

## 11. Financial & Payment Ledger
- Initial reserve amount & date
- Claim paid‑to‑date
- Indemnity vs expense split
- RCV, ACV, depreciation withheld & released
- Deductible applied
- Net payment(s) list:
  - Payment ID, date, payee, method (EFT, check), amount
  - Check/image MICR data (tokenized)
  - Lienholder endorsement Y/N
- Subrogation recovery amounts
- Salvage proceeds

## 12. Compliance & Timelines (Florida Statutes)
- Insurer acknowledgment date (FS 627.70131)
- Inspection scheduled date
- Coverage decision date
- Payment issuance date
- Right‑to‑mediation offered Y/N & date
- 90‑day rule compliance flag
- DFS mediation/litigation dates
- Statute of limitations reminders

## 13. Communications & Documents
- Contact log (timestamp, participants, medium, summary, sentiment)
- Recorded statements transcript & audio URI
- Reservation of rights letters
- Proof‑of‑loss form status
- EUO (examination under oath) transcript
- Correspondence classifications (legal, underwriting, customer service)
- Secure messaging thread IDs
- Document OCR text & embedding vector IDs

## 14. Litigation & Dispute Tracking
- Attorney representation flags (insured, insurer)
- Legal firm & bar #s
- Civil remedy notice # & date
- Lawsuit docket #, court, filing date
- Settlement offers & amounts
- ADR method (mediation, appraisal, arbitration) status
- Expert witness reports (engineer, IAQ, cause‑origin)

## 15. Fraud & Special Investigation
- Red flags checklist (late report, prior losses, financial distress, overlapping coverage)
- Social media scrape evidence URIs
- NICB indicator codes
- SIU referral date & investigator ID
- Recorded interview analysis sentiment score
- Background check summary

## 16. Third‑Party & External Data Feeds
- Property tax assessor data (parcel ID, assessed value)
- Google Street View historical images
- Permit & contractor history
- Building code citations
- Public adjuster license verification
- Drone‑base imagery (post‑event flyovers)
- Satellite change‑detection maps
- Utility outage logs
- Seismic or sinkhole event data
- Water level sensors (USGS, NOAA gauges)

## 17. IoT & Smart‑Home Telemetry
- Device ID (MAC/serial)
- Sensor type (water leak, smoke, motion, temp, humidity)
- Event timestamp & value
- Firmware version
- Battery level
- Sensor location mapping to property rooms

## 18. Claim Workflow Metadata
- Loss notification → closure workflow stage
- Assigned adjuster & team hierarchy
- SLA clock (hours since last action)
- Task checklist completion % (FNOL, inspection, estimate, review, payment)
- Audit trail (user ID, action, timestamp, field old→new)
- RLS access control role
- Embedding vector version for AI summarization

## 19. Analytics & Reporting
- Severity index (loss amount ÷ Coverage A)
- Claims frequency rate by peril
- Loss ratio (incurred ÷ earned premium)
- Average cycle time (days)
- Customer satisfaction score (post‑claim survey)
- Net promoter score
- Reserve accuracy variance (%)
- Litigation rate by zip code
- CAT event loss heatmap coordinates

---

## Implementation Notes

### Database Schema
- **RLS:** Default‑deny; grant row‑level permissions per role (insured, adjuster, contractor)
- **Vector Columns:** Embed all textual fields (notes, OCR, transcripts) via `edge_functions/embed.ts`
- **File Storage:** Store large binaries (photos, 3‑D scans) in S3‑compatible bucket; keep signed URLs only
- **Event Triggers:** Emit `claim_update` events on any record change to power the "Claim Concierge" AI

### Security Considerations
- All PII fields must be encrypted at rest
- Social Security/EIN must be tokenized or hashed
- Payment information requires PCI compliance
- HIPAA compliance for medical payment claims
- Legal documents require audit trail

### API Integration Strategy
- Use canonical keys: `(parcel_id, place_id, lat, lng)` composite
- ETL placement in `/data_integrations/` directory structure
- Implement rate limiting and retry logic
- Cache external API responses appropriately

---

## External Data Sources Integration

### Google Maps Platform APIs
1. **Geocoding API**
   - `formatted_address`, `place_id`, `geometry.location`, `address_components`

2. **Address Validation API**
   - `verdict`, `DPV`, `USPS` extras, `locationConfidence`

3. **Elevation API**
   - `elevation` (meters above sea level), `resolution`

4. **Street View Static Metadata**
   - `pano_id`, `lat`, `lng`, `date` captured

5. **Air Quality API**
   - AQI codes, pollutants, health recommendations

6. **Cloud Vision API**
   - Label detection for property features
   - Object detection for damage assessment
   - OCR for document processing

### Real Estate APIs
1. **Zillow/Bridge Interactive (RESO Web API)**
   - Property details, valuations, ownership history
   - Physical characteristics, financial data

2. **Redfin Data Center**
   - Market metrics, price trends, inventory levels

3. **Realtor.com**
   - Property listings, photos, neighborhood data

### Weather & Environmental APIs
1. **NOAA/NWS**
   - Historical weather data
   - Storm tracking and predictions

2. **USGS**
   - Water level sensors
   - Seismic activity

3. **NASA Earth Data**
   - Satellite imagery for change detection
   - Environmental monitoring

---

## Data Refresh Cadence
- **Real-time**: IoT sensors, emergency alerts
- **Hourly**: Weather data, air quality
- **Daily**: Property listings (active), legal documents
- **Weekly**: Market aggregates, inspection schedules
- **Monthly**: Property assessments, compliance checks
- **Annual**: Street View updates, property valuations

---

## Quick Implementation Steps
1. Enable required Google APIs with usage caps
2. Request RESO Web API credentials from MLS providers
3. Setup cron-driven edge functions for data ingestion
4. Implement vector embeddings for semantic search
5. Configure RLS policies for data access control
6. Setup monitoring and alerting for data quality

This comprehensive data collection framework provides ClaimGuardian with a 360-degree view of properties, claims, and risk factors necessary for effective insurance claim advocacy in Florida.
