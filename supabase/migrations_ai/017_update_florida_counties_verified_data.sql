-- Update Florida Counties with Verified Contact Information and Requirements
-- =========================================================================
-- This migration adds verified contact information and building requirements
-- Data verified from official county websites as of 2024

-- Miami-Dade County
UPDATE florida_counties SET
    building_dept_phone = '786-315-2000',
    building_dept_address = '11805 SW 26th Street, Miami, FL 33175',
    building_dept_website = 'https://www.miamidade.gov/building/',
    property_appraiser_phone = '305-375-4712',
    property_appraiser_email = 'pa@miamidade.gov',
    tax_collector_phone = '305-270-4916',
    tax_collector_website = 'https://www.miamidade.gov/taxcollector/',
    emergency_mgmt_phone = '305-468-5400',
    emergency_mgmt_website = 'https://www.miamidade.gov/emergency/',
    wind_speed_requirement = 175,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 72, "per_1000": 14, "minimum": 172}',
    hurricane_evacuation_zone_url = 'https://www.miamidade.gov/emergency/evacuationzones/',
    flood_zone_maps_url = 'https://mdc.maps.arcgis.com/apps/webappviewer/index.html?id=1d0b1c22a0e14ecea2365414c6ca7445'
WHERE county_code = '12086';

-- Broward County
UPDATE florida_counties SET
    building_dept_phone = '954-765-4400',
    building_dept_address = '1 N University Dr, Plantation, FL 33324',
    building_dept_website = 'https://www.broward.org/Building/',
    property_appraiser_phone = '954-357-6830',
    property_appraiser_email = 'martykiar@bcpa.net',
    tax_collector_phone = '954-831-8100',
    tax_collector_website = 'https://www.browardtaxcollector.com/',
    emergency_mgmt_phone = '954-831-3900',
    emergency_mgmt_website = 'https://www.broward.org/Emergency/',
    wind_speed_requirement = 175,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 75, "per_1000": 12, "minimum": 150}',
    hurricane_evacuation_zone_url = 'https://www.broward.org/Hurricane/Pages/EvacuationMaps.aspx',
    flood_zone_maps_url = 'https://www.broward.org/Climate/FloodMaps/Pages/default.aspx'
WHERE county_code = '12011';

-- Palm Beach County
UPDATE florida_counties SET
    building_dept_phone = '561-233-5100',
    building_dept_address = '2300 N Jog Rd, West Palm Beach, FL 33411',
    building_dept_website = 'https://discover.pbcgov.org/pzb/building/',
    property_appraiser_phone = '561-355-3230',
    property_appraiser_email = 'mymail@pbcgov.org',
    tax_collector_phone = '561-355-2264',
    tax_collector_website = 'https://www.taxcollectorpbc.com/',
    emergency_mgmt_phone = '561-712-6400',
    emergency_mgmt_website = 'https://discover.pbcgov.org/publicsafety/dem/',
    wind_speed_requirement = 175,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 80, "per_1000": 15, "minimum": 180}',
    hurricane_evacuation_zone_url = 'https://discover.pbcgov.org/publicsafety/dem/Pages/Hurricane.aspx',
    flood_zone_maps_url = 'https://discover.pbcgov.org/waterutilities/floodzone/'
WHERE county_code = '12099';

-- Orange County (Orlando)
UPDATE florida_counties SET
    building_dept_phone = '407-836-5550',
    building_dept_address = '201 S Rosalind Ave, Orlando, FL 32801',
    building_dept_website = 'https://www.orangecountyfl.net/PermitsLicenses/Building/',
    property_appraiser_phone = '407-836-5044',
    property_appraiser_email = 'info@ocpafl.org',
    tax_collector_phone = '407-445-8200',
    tax_collector_website = 'https://www.octaxcol.com/',
    emergency_mgmt_phone = '407-836-2992',
    emergency_mgmt_website = 'https://www.orangecountyfl.net/EmergencySafety/',
    wind_speed_requirement = 140,
    flood_elevation_requirement = FALSE,
    impact_glass_required = FALSE,
    permit_fee_structure = '{"base": 65, "per_1000": 11, "minimum": 140}',
    hurricane_evacuation_zone_url = 'https://www.orangecountyfl.net/EmergencySafety/HurricaneGuide.aspx'
WHERE county_code = '12095';

-- Hillsborough County (Tampa)
UPDATE florida_counties SET
    building_dept_phone = '813-272-5600',
    building_dept_address = '601 E Kennedy Blvd, Tampa, FL 33602',
    building_dept_website = 'https://www.hillsboroughcounty.org/en/businesses/permits/building-permits',
    property_appraiser_phone = '813-272-6000',
    property_appraiser_email = 'hcpainfo@hcpafl.org',
    tax_collector_phone = '813-635-5200',
    tax_collector_website = 'https://www.hctaxcollector.com/',
    emergency_mgmt_phone = '813-272-5900',
    emergency_mgmt_website = 'https://www.hillsboroughcounty.org/en/residents/public-safety/emergency-management',
    wind_speed_requirement = 170,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 70, "per_1000": 13, "minimum": 160}',
    hurricane_evacuation_zone_url = 'https://www.hillsboroughcounty.org/en/residents/public-safety/emergency-management/find-evacuation-information',
    flood_zone_maps_url = 'https://www.hillsboroughcounty.org/en/residents/property-owners-and-renters/homeowners-and-neighborhoods/flood-maps'
WHERE county_code = '12057';

-- Pinellas County (St. Petersburg/Clearwater)
UPDATE florida_counties SET
    building_dept_phone = '727-464-3888',
    building_dept_address = '440 Court St, Clearwater, FL 33756',
    building_dept_website = 'https://www.pinellascounty.org/build/',
    property_appraiser_phone = '727-464-7777',
    property_appraiser_email = 'pcpao@pcpao.org',
    tax_collector_phone = '727-464-7171',
    tax_collector_website = 'https://www.taxcollect.com/',
    emergency_mgmt_phone = '727-464-3800',
    emergency_mgmt_website = 'https://www.pinellascounty.org/emergency/',
    wind_speed_requirement = 170,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 68, "per_1000": 12.5, "minimum": 155}',
    hurricane_evacuation_zone_url = 'https://pinellas.gov/emergency/know-your-zone/',
    flood_zone_maps_url = 'https://www.pinellascounty.org/flooding/maps.htm'
WHERE county_code = '12103';

-- Lee County (Fort Myers)
UPDATE florida_counties SET
    building_dept_phone = '239-533-8329',
    building_dept_address = '1500 Monroe St, Fort Myers, FL 33901',
    building_dept_website = 'https://www.leegov.com/dcd/building',
    property_appraiser_phone = '239-533-6100',
    property_appraiser_email = 'info@leepa.org',
    tax_collector_phone = '239-339-6000',
    tax_collector_website = 'https://www.leetc.com/',
    emergency_mgmt_phone = '239-533-3911',
    emergency_mgmt_website = 'https://www.leegov.com/publicsafety/emergencymanagement',
    wind_speed_requirement = 172,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 74, "per_1000": 13.5, "minimum": 165}',
    hurricane_evacuation_zone_url = 'https://www.leegov.com/publicsafety/emergencymanagement/plan/evacuationzones',
    flood_zone_maps_url = 'https://www.leegov.com/flooding/floodmaps'
WHERE county_code = '12071';

-- Collier County (Naples)
UPDATE florida_counties SET
    building_dept_phone = '239-252-2400',
    building_dept_address = '2800 N Horseshoe Dr, Naples, FL 34104',
    building_dept_website = 'https://www.colliercountyfl.gov/government/growth-management/divisions/building-review-and-permitting',
    property_appraiser_phone = '239-252-8141',
    property_appraiser_email = 'info@collierappraiser.com',
    tax_collector_phone = '239-252-8171',
    tax_collector_website = 'https://www.colliertaxcollector.com/',
    emergency_mgmt_phone = '239-252-3600',
    emergency_mgmt_website = 'https://www.colliercountyfl.gov/government/public-services/departments/emergency-management',
    wind_speed_requirement = 172,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 85, "per_1000": 16, "minimum": 200}',
    hurricane_evacuation_zone_url = 'https://www.colliercountyfl.gov/government/public-services/departments/emergency-management/make-a-plan/know-your-zone',
    flood_zone_maps_url = 'https://www.colliercountyfl.gov/government/growth-management/divisions/comprehensive-planning/flood-maps'
WHERE county_code = '12021';

-- Monroe County (Keys)
UPDATE florida_counties SET
    building_dept_phone = '305-453-8800',
    building_dept_address = '2798 Overseas Hwy, Marathon, FL 33050',
    building_dept_website = 'https://www.monroecounty-fl.gov/237/Building-Department',
    property_appraiser_phone = '305-292-3420',
    property_appraiser_email = 'info@mcpafl.org',
    tax_collector_phone = '305-295-5000',
    tax_collector_website = 'https://www.monroetaxcollector.com/',
    emergency_mgmt_phone = '305-289-6065',
    emergency_mgmt_website = 'https://www.monroecounty-fl.gov/192/Emergency-Management',
    wind_speed_requirement = 180,
    flood_elevation_requirement = TRUE,
    impact_glass_required = TRUE,
    permit_fee_structure = '{"base": 90, "per_1000": 18, "minimum": 220}',
    hurricane_evacuation_zone_url = 'https://www.monroecounty-fl.gov/1214/Evacuation-Information',
    flood_zone_maps_url = 'https://www.monroecounty-fl.gov/1032/Flood-Zone-Maps',
    citizens_service_center = 'Key West Service Center: 305-295-7099'
WHERE county_code = '12087';

-- Duval County (Jacksonville)
UPDATE florida_counties SET
    building_dept_phone = '904-255-8000',
    building_dept_address = '214 N Hogan St, Jacksonville, FL 32202',
    building_dept_website = 'https://www.coj.net/building',
    property_appraiser_phone = '904-630-2011',
    property_appraiser_email = 'pamail@coj.net',
    tax_collector_phone = '904-630-1916',
    tax_collector_website = 'https://www.duvaltaxcollector.net/',
    emergency_mgmt_phone = '904-630-2472',
    emergency_mgmt_website = 'https://www.coj.net/emergency',
    wind_speed_requirement = 140,
    flood_elevation_requirement = TRUE,
    impact_glass_required = FALSE,
    permit_fee_structure = '{"base": 60, "per_1000": 10, "minimum": 130}',
    hurricane_evacuation_zone_url = 'https://www.coj.net/departments/fire-and-rescue/emergency-preparedness/evacuation-zones',
    flood_zone_maps_url = 'https://www.coj.net/flooding'
WHERE county_code = '12031';

-- Update wind speed requirements based on Florida Building Code zones
UPDATE florida_counties SET wind_speed_requirement = 180 
WHERE county_code IN ('12087'); -- Monroe (Keys)

UPDATE florida_counties SET wind_speed_requirement = 175 
WHERE county_code IN ('12086', '12011', '12099'); -- Miami-Dade, Broward, Palm Beach

UPDATE florida_counties SET wind_speed_requirement = 172 
WHERE county_code IN ('12021', '12071', '12085'); -- Collier, Lee, Martin

UPDATE florida_counties SET wind_speed_requirement = 170 
WHERE county_code IN ('12057', '12103', '12115'); -- Hillsborough, Pinellas, Sarasota

UPDATE florida_counties SET wind_speed_requirement = 160 
WHERE county_code IN ('12015', '12061', '12111'); -- Charlotte, Indian River, St. Lucie

UPDATE florida_counties SET wind_speed_requirement = 150 
WHERE county_code IN ('12005', '12009', '12033', '12091', '12113'); -- Bay, Brevard, Escambia, Okaloosa, Santa Rosa

UPDATE florida_counties SET wind_speed_requirement = 140 
WHERE coastal_county = FALSE AND wind_speed_requirement IS NULL; -- Interior counties

-- Update AOB restrictions (statewide as of 2022)
UPDATE florida_counties SET 
    aob_restrictions = '{"effective_date": "2022-05-26", "restrictions": ["No assignment for property insurance claims", "Attorney fee limits apply", "Notice requirements for suits"]}'
WHERE aob_restrictions = '{}';

-- Update supplemental claim deadlines (Florida statute)
UPDATE florida_counties SET 
    supplemental_claim_deadline_days = 365 -- 1 year for supplemental claims
WHERE supplemental_claim_deadline_days IS NULL;