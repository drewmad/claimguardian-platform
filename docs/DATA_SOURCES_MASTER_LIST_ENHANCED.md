# ClaimGuardian Data Sources Master List - Enhanced Edition

Last Updated: July 28, 2025

## 1. Florida Property & Parcel Data

### 1.1 Statewide Sources

| Source                                           | URL                                                                                                              | Update Frequency | Schedule                                     | Purpose                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- | ------------------------------------------------ |
| **FGIO** (Florida Geographic Information Office) | `https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/Florida_Statewide_Parcels/FeatureServer/0`    | Quarterly        | 1st day of Jan, Apr, Jul, Oct at 2:00 AM UTC | Statewide parcel boundaries and basic attributes |
| **FDOT** (Florida Department of Transportation)  | `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer`                                                | Weekly           | Every Sunday at 3:00 AM UTC                  | Delta updates from 67 county layers              |
| **FGDL** (Florida Geographic Data Library)       | `https://fgdl.org/metadataexplorer/explorer/zip/`                                                                | Yearly           | March 1st at 4:00 AM UTC                     | Historical parcel archives                       |
| **DOR** (Department of Revenue)                  | `https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx`                         | Annually         | August 1st at 5:00 AM UTC                    | Official tax roll shapes                         |
| **Florida Statewide Cadastral**                  | `https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0` | As needed        | Manual trigger                               | Additional cadastral data                        |

### 1.2 County-Specific Property Sources

| County                | URL                                                                                | Update Frequency | Schedule    | Notes                   |
| --------------------- | ---------------------------------------------------------------------------------- | ---------------- | ----------- | ----------------------- |
| **Charlotte County**  | `https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0` | Daily            | 3:00 AM UTC | Primary test county     |
| **Lee County**        | `https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0`     | Daily            | 4:00 AM UTC | Requires authentication |
| **Sarasota County**   | `https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1`         | Daily            | 5:00 AM UTC | Public access           |
| **Miami-Dade County** | `https://gis.miamidade.gov/arcgis/rest/services/MD_PropertySearch/MapServer/0`     | Daily            | 6:00 AM UTC | Largest county          |
| **Broward County**    | `https://bcpamaps.broward.org/arcgis/rest/services/Parcels/MapServer/0`            | Daily            | 6:30 AM UTC | High population         |
| **Palm Beach County** | `https://discover.pbcgov.org/pzb/arcgis/rest/services/Parcels/MapServer/0`         | Daily            | 7:00 AM UTC | Coastal properties      |

## 2. Contractor & License Data

### 2.1 State License Databases

| Source                            | URL                                                                                | Update Frequency | Schedule      | Purpose                  |
| --------------------------------- | ---------------------------------------------------------------------------------- | ---------------- | ------------- | ------------------------ |
| **Florida DBPR Licenses**         | `https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv`  | Weekly           | Sunday nights | Licensed contractor data |
| **DBPR Registered Contractors**   | `https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_registered.csv` | Weekly           | Sunday nights | Registered contractors   |
| **DBPR Electrical Contractors**   | `https://www2.myfloridalicense.com/sto/file_download/extracts/elc.csv`             | Weekly           | Sunday nights | Electrical licenses      |
| **DBPR Plumbing Contractors**     | `https://www2.myfloridalicense.com/sto/file_download/extracts/plc.csv`             | Weekly           | Sunday nights | Plumbing licenses        |
| **DBPR Roofing Contractors**      | `https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_roofing.csv`    | Weekly           | Sunday nights | Roofing licenses         |
| **DBPR License Verification API** | `https://www.myfloridalicense.com/wl11.asp`                                        | Real-time        | API calls     | License verification     |

### 2.2 Business Registrations

| Source                               | URL                                                       | Update Frequency | Schedule     | Purpose                      |
| ------------------------------------ | --------------------------------------------------------- | ---------------- | ------------ | ---------------------------- |
| **Florida Division of Corporations** | `http://search.sunbiz.org/Inquiry/CorporationSearch/`     | Real-time        | API/Scraping | Business entity verification |
| **Florida Sales Tax Registration**   | `https://floridarevenue.com/opendata/pages/salesTax.aspx` | Monthly          | 1st Monday   | Active business verification |

## 3. Building Permits & Code Violations

### 3.1 County Permit Systems

| County                     | URL                                                          | Update Frequency | Schedule    | Purpose                       |
| -------------------------- | ------------------------------------------------------------ | ---------------- | ----------- | ----------------------------- |
| **Miami-Dade Permits**     | `https://www.miamidade.gov/permits/open-permits-api.asp`     | Real-time        | API         | Building permits, inspections |
| **Broward County Permits** | `https://www.broward.org/PermitsLicenses/Pages/default.aspx` | Daily            | 1:00 AM UTC | Permit data export            |
| **Palm Beach Permits**     | `https://epzb.pbcgov.org/epZone/api/permits`                 | Real-time        | API         | Active permits                |
| **Orange County Permits**  | `https://fast.ocfl.net/OnlineServices/api/permits`           | Real-time        | API         | Orlando area permits          |
| **Hillsborough Permits**   | `https://hcflgov.net/permits/api/v1/`                        | Real-time        | API         | Tampa area permits            |

### 3.2 Code Enforcement

| Source                         | URL                                              | Update Frequency | Schedule    | Purpose              |
| ------------------------------ | ------------------------------------------------ | ---------------- | ----------- | -------------------- |
| **Miami-Dade Code Violations** | `https://www.miamidade.gov/codeviolations/api/`  | Daily            | 2:00 AM UTC | Active violations    |
| **State Fire Marshal**         | `https://www.myfloridacfo.com/division/sfm/api/` | Weekly           | Mondays     | Fire code violations |

## 4. Weather & Environmental Data

### 4.1 Current Weather & Forecasts

| Source                  | URL                                         | Update Frequency | Schedule   | Purpose                       |
| ----------------------- | ------------------------------------------- | ---------------- | ---------- | ----------------------------- |
| **NOAA Weather API**    | `https://api.weather.gov/`                  | Real-time        | Continuous | Current conditions, forecasts |
| **NWS Radar**           | `https://radar.weather.gov/ridge/standard/` | 5 minutes        | Continuous | Radar imagery                 |
| **OpenWeatherMap**      | `https://api.openweathermap.org/data/3.0/`  | Real-time        | API calls  | Backup weather data           |
| **Weather Underground** | `https://api.weather.com/v2/`               | Real-time        | API calls  | Hyperlocal weather            |

### 4.2 Tides & Water Levels

| Source                                 | URL                                                       | Update Frequency | Schedule   | Purpose                |
| -------------------------------------- | --------------------------------------------------------- | ---------------- | ---------- | ---------------------- |
| **NOAA Tides & Currents**              | `https://api.tidesandcurrents.noaa.gov/api/prod/`         | 6 minutes        | Continuous | Real-time water levels |
| **USGS Water Data**                    | `https://waterservices.usgs.gov/nwis/`                    | 15 minutes       | Continuous | River/stream levels    |
| **Florida Water Management Districts** | `https://apps.sfwmd.gov/WAB/EnvironmentalMonitoring/api/` | Hourly           | Continuous | Canal/lake levels      |

### 4.3 Historical Weather & Storm Data

| Source                | URL                                          | Update Frequency | Schedule      | Purpose               |
| --------------------- | -------------------------------------------- | ---------------- | ------------- | --------------------- |
| **NOAA Storm Events** | `https://www.ncdc.noaa.gov/stormevents/api/` | Monthly          | 15th of month | Historical storm data |
| **NHC HURDAT2**       | `https://www.nhc.noaa.gov/data/hurdat/`      | Post-season      | December      | Hurricane tracks      |
| **NOAA Climate Data** | `https://www.ncei.noaa.gov/cdo-web/api/v2/`  | Daily            | 3:00 AM UTC   | Historical weather    |

### 4.4 Environmental Hazards

| Source                     | URL                                                       | Update Frequency | Schedule           | Purpose                  |
| -------------------------- | --------------------------------------------------------- | ---------------- | ------------------ | ------------------------ |
| **FEMA Flood Maps**        | `https://hazards.fema.gov/gis/nfhl/rest/services/public/` | Quarterly        | Jan, Apr, Jul, Oct | Flood zones              |
| **EPA Environmental Data** | `https://epadatacommons.sciencehub.epa.gov/api/`          | Monthly          | 1st Tuesday        | Environmental hazards    |
| **Florida DEP Data**       | `https://geodata.dep.state.fl.us/datasets/`               | Quarterly        | Varies             | State environmental data |
| **USGS Earthquake Data**   | `https://earthquake.usgs.gov/fdsnws/event/1/`             | Real-time        | Continuous         | Seismic activity         |

## 5. Real Estate Valuation Data

### 5.1 Major Real Estate Platforms

| Source                   | URL                                        | Update Frequency | Schedule   | Purpose               | API Access           |
| ------------------------ | ------------------------------------------ | ---------------- | ---------- | --------------------- | -------------------- |
| **Zillow Valuation API** | `https://api.bridgedataoutput.com/api/v2/` | Daily            | Overnight  | Zestimate values      | Requires partnership |
| **Redfin Data Center**   | `https://www.redfin.com/stingray/api/gis`  | Real-time        | Continuous | Sales data, estimates | Limited public API   |
| **Realtor.com API**      | `https://api.realtor.com/`                 | Real-time        | Continuous | Listings, sales       | Requires approval    |
| **Rentberry API**        | `https://rentberry.com/api/v1/`            | Daily            | Overnight  | Rental valuations     | API key required     |

### 5.2 MLS & Property Data Aggregators

| Source                         | URL                                   | Update Frequency | Schedule   | Purpose                        | Cost               |
| ------------------------------ | ------------------------------------- | ---------------- | ---------- | ------------------------------ | ------------------ |
| **CoreLogic Matrix**           | `https://api.corelogic.com/property/` | Real-time        | Continuous | Comprehensive property data    | Enterprise pricing |
| **ATTOM Data**                 | `https://api.gateway.attomdata.com/`  | Daily            | Overnight  | Property, sales, assessor data | Subscription based |
| **Black Knight Data**          | `https://api.blackknightinc.com/`     | Real-time        | Continuous | Mortgage, property data        | Enterprise only    |
| **DataTree by First American** | `https://api.datatree.com/`           | Real-time        | Continuous | Title, property data           | Per-transaction    |

### 5.3 Public Property Value Sources

| Source                          | URL                                                         | Update Frequency | Schedule       | Purpose                  |
| ------------------------------- | ----------------------------------------------------------- | ---------------- | -------------- | ------------------------ |
| **County Property Appraisers**  | Various county sites                                        | Annually         | August-October | Official assessed values |
| **Florida DOR Sales Data**      | `https://floridarevenue.com/property/Pages/DataPortal.aspx` | Monthly          | 15th of month  | Statewide sales data     |
| **Florida Realtors Statistics** | `https://www.floridarealtors.org/api/statistics/`           | Monthly          | 20th of month  | Market statistics        |

## 6. Insurance & Risk Data

### 6.1 Insurance Carrier Information

| Source                          | URL                                                | Update Frequency | Schedule           | Purpose                     |
| ------------------------------- | -------------------------------------------------- | ---------------- | ------------------ | --------------------------- |
| **Florida OIR Insurer Data**    | `https://www.floir.com/tools-and-data/`            | Quarterly        | Mar, Jun, Sep, Dec | Carrier ratings, complaints |
| **NAIC Consumer Portal**        | `https://content.naic.org/cis_refined_results.htm` | Monthly          | 1st Wednesday      | National carrier data       |
| **AM Best Ratings**             | `https://web.ambest.com/ratings-services/`         | Real-time        | Continuous         | Financial strength ratings  |
| **Citizens Property Insurance** | `https://www.citizensfla.com/api/`                 | Real-time        | API                | State insurer data          |

### 6.2 Claims & Catastrophe Data

| Source                         | URL                                       | Update Frequency | Schedule        | Purpose          |
| ------------------------------ | ----------------------------------------- | ---------------- | --------------- | ---------------- |
| **ISO ClaimSearch**            | `https://www.verisk.com/claimsearch/api/` | Real-time        | Continuous      | Claims history   |
| **PCS Catastrophe Data**       | `https://www.verisk.com/pcs/api/`         | Post-event       | Within 48 hours | Cat event data   |
| **Florida Hurricane Cat Fund** | `https://www.sbafla.com/fhcf/api/`        | Post-event       | As needed       | Hurricane claims |

## 7. Demographic & Economic Data

### 7.1 Census & Demographics

| Source                   | URL                                                     | Update Frequency | Schedule           | Purpose               |
| ------------------------ | ------------------------------------------------------- | ---------------- | ------------------ | --------------------- |
| **US Census API**        | `https://api.census.gov/data/`                          | Annually         | July               | Demographics, income  |
| **Florida Demographics** | `https://data.census.gov/florida/`                      | Annually         | July               | State-specific data   |
| **ESRI Demographics**    | `https://demographics.arcgis.com/arcgis/rest/services/` | Quarterly        | Jan, Apr, Jul, Oct | Enhanced demographics |

### 7.2 Economic Indicators

| Source                            | URL                                   | Update Frequency | Schedule   | Purpose             |
| --------------------------------- | ------------------------------------- | ---------------- | ---------- | ------------------- |
| **Bureau of Labor Statistics**    | `https://api.bls.gov/publicAPI/v2/`   | Monthly          | 1st Friday | Employment, CPI     |
| **Federal Reserve Economic Data** | `https://api.stlouisfed.org/fred/`    | Varies           | Varies     | Economic indicators |
| **Florida Economic Data**         | `http://edr.state.fl.us/content/api/` | Monthly          | Mid-month  | State economic data |

## 8. Legal & Regulatory Data

### 8.1 Court Records & Liens

| Source                      | URL                                       | Update Frequency | Schedule   | Purpose          |
| --------------------------- | ----------------------------------------- | ---------------- | ---------- | ---------------- |
| **Florida Courts E-Filing** | `https://myeclerk.myorangeclerk.com/api/` | Real-time        | Continuous | Court records    |
| **County Clerk APIs**       | Various county sites                      | Daily            | Overnight  | Liens, judgments |
| **PACER Federal Courts**    | `https://pacer.uscourts.gov/api/`         | Real-time        | Continuous | Federal cases    |

### 8.2 Regulatory Updates

| Source                    | URL                                      | Update Frequency | Schedule           | Purpose       |
| ------------------------- | ---------------------------------------- | ---------------- | ------------------ | ------------- |
| **Florida Building Code** | `https://codes.iccsafe.org/api/florida/` | Quarterly        | Jan, Apr, Jul, Oct | Code updates  |
| **Florida Statutes**      | `http://www.leg.state.fl.us/api/`        | Session updates  | During session     | Legal updates |

## 9. Satellite & Aerial Imagery

### 9.1 Imagery Providers

| Source                      | URL                                         | Update Frequency | Schedule           | Purpose              | Cost                |
| --------------------------- | ------------------------------------------- | ---------------- | ------------------ | -------------------- | ------------------- |
| **Google Earth Engine**     | `https://earthengine.googleapis.com/`       | Weekly           | Varies             | Historical imagery   | Free tier available |
| **Planet Labs API**         | `https://api.planet.com/data/v1/`           | Daily            | Continuous         | High-res imagery     | Subscription        |
| **Maxar/DigitalGlobe**      | `https://securewatch.digitalglobe.com/api/` | Post-event       | Within 24-48 hours | Disaster imagery     | Per image           |
| **Nearmap**                 | `https://api.nearmap.com/`                  | 2-3x yearly      | Varies by area     | High-res surveys     | Subscription        |
| **NOAA Emergency Response** | `https://storms.ngs.noaa.gov/`              | Post-event       | Within 48 hours    | Storm damage imagery | Free                |

## 10. Utility & Infrastructure Data

### 10.1 Utility Providers

| Source                          | URL                                        | Update Frequency | Schedule   | Purpose            |
| ------------------------------- | ------------------------------------------ | ---------------- | ---------- | ------------------ |
| **FPL (Florida Power & Light)** | `https://www.fpl.com/api/outages/`         | Real-time        | Continuous | Power outages      |
| **Duke Energy**                 | `https://www.duke-energy.com/api/outages/` | Real-time        | Continuous | Power status       |
| **TECO Energy**                 | `https://www.tecoenergy.com/api/`          | Real-time        | Continuous | Tampa area power   |
| **Florida Water/Sewer**         | Various utility APIs                       | Varies           | Varies     | Water service data |

### 10.2 Transportation

| Source                | URL                                 | Update Frequency | Schedule   | Purpose                   |
| --------------------- | ----------------------------------- | ---------------- | ---------- | ------------------------- |
| **Florida 511**       | `https://fl511.com/api/`            | Real-time        | Continuous | Traffic, road conditions  |
| **FDOT Traffic Data** | `https://www.fdot.gov/traffic/api/` | 15 minutes       | Continuous | Traffic counts, incidents |

## 11. Social Media & Crowd-Sourced Data

| Source                 | URL                           | Update Frequency | Schedule       | Purpose                         |
| ---------------------- | ----------------------------- | ---------------- | -------------- | ------------------------------- |
| **Twitter/X API**      | `https://api.twitter.com/2/`  | Real-time        | Streaming      | Disaster reports, damage photos |
| **Facebook Graph API** | `https://graph.facebook.com/` | Real-time        | API calls      | Community reports               |
| **Nextdoor API**       | `https://api.nextdoor.com/`   | Real-time        | Partner access | Neighborhood alerts             |
| **Waze Traffic API**   | `https://www.waze.com/api/`   | Real-time        | Partner access | Real-time hazards               |

## 12. Scheduled Data Collection Summary

### High-Frequency Updates (Real-time to Hourly)

- Weather conditions, radar
- Tides and water levels
- Power outages
- Traffic conditions
- Social media monitoring

### Daily Updates

- County property data
- Building permits
- Property listings
- Satellite imagery (post-event)
- Weather history

### Weekly Updates

- Contractor licenses
- FDOT parcel updates
- Code violations
- Google Earth imagery

### Monthly Updates

- Sales data
- Economic indicators
- Insurance ratings
- Storm event data

### Quarterly/Annual Updates

- FGIO parcels (quarterly)
- FEMA flood maps (quarterly)
- Property assessments (annual)
- Tax rolls (annual)
- Building codes (quarterly)

## 13. API Rate Limits & Costs

### Free Tier Limits

- NOAA APIs: 1000 requests/hour
- Census API: 500 requests/hour
- Google Maps: $200 monthly credit
- OpenWeatherMap: 60 calls/minute

### Paid Services (Estimated Costs)

- Zillow/Real Estate APIs: $500-5000/month
- CoreLogic/ATTOM: $1000-10000/month
- Satellite Imagery: $50-500/image
- MLS Access: $100-1000/month

### Enterprise Only

- Black Knight Data
- ISO ClaimSearch
- Full MLS Access
- Commercial satellite imagery

## 14. Implementation Priority

### Phase 1 - Core Data (Implemented)

✅ Florida property parcels
✅ Basic contractor licenses
✅ Google Maps integration
✅ Basic weather data

### Phase 2 - Enhanced Property Data (Next)

- County building permits
- Code violations
- Detailed contractor data
- NOAA weather integration
- Tide/water level data

### Phase 3 - Valuation & Risk

- Real estate valuations
- Insurance carrier data
- FEMA flood maps
- Historical weather

### Phase 4 - Advanced Features

- Satellite imagery
- Court records/liens
- Social media monitoring
- Predictive analytics

## 15. Data Storage Strategy

### Real-Time Data

- Cache for 5-15 minutes
- Redis/memory storage
- Websocket updates

### Daily Data

- PostgreSQL tables
- Nightly batch updates
- 90-day retention

### Historical Data

- S3/object storage
- Yearly archives
- Compressed formats

### Compliance Considerations

- PII handling for MLS data
- License compliance for imagery
- API usage tracking
- Data retention policies
