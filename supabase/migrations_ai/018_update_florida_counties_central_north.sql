-- Update Florida Counties - Central and North Florida Regions
-- ==========================================================

-- Polk County (Lakeland)
UPDATE florida_counties SET
    building_dept_phone = '863-534-6090',
    building_dept_address = '330 W Church St, Bartow, FL 33830',
    building_dept_website = 'https://www.polk-county.net/building-division',
    property_appraiser_phone = '863-534-4777',
    property_appraiser_email = 'property@polkpa.org',
    tax_collector_phone = '863-534-4700',
    tax_collector_website = 'https://www.polktaxes.com/',
    emergency_mgmt_phone = '863-534-5600',
    emergency_mgmt_website = 'https://www.polk-county.net/emergency-management',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 55, "per_1000": 9, "minimum": 120}'
WHERE county_code = '12105';

-- Seminole County (Sanford)
UPDATE florida_counties SET
    building_dept_phone = '407-665-7050',
    building_dept_address = '1101 East First St, Sanford, FL 32771',
    building_dept_website = 'https://www.seminolecountyfl.gov/departments-services/development-services/building/',
    property_appraiser_phone = '407-665-7654',
    property_appraiser_email = 'info@scpafl.org',
    tax_collector_phone = '407-665-1000',
    tax_collector_website = 'https://www.seminolecountytax.org/',
    emergency_mgmt_phone = '407-665-5102',
    emergency_mgmt_website = 'https://www.seminolecountyfl.gov/departments-services/county-managers-office/prepare-seminole/',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 62, "per_1000": 10.5, "minimum": 135}'
WHERE county_code = '12117';

-- Volusia County (Daytona Beach)
UPDATE florida_counties SET
    building_dept_phone = '386-736-5959',
    building_dept_address = '123 W Indiana Ave, DeLand, FL 32720',
    building_dept_website = 'https://www.volusia.org/services/growth-and-resource-management/building-and-zoning/',
    property_appraiser_phone = '386-736-5901',
    property_appraiser_email = 'vcpa@volusia.org',
    tax_collector_phone = '386-254-4750',
    tax_collector_website = 'https://www.volusia.org/services/financial-and-administrative-services/tax/',
    emergency_mgmt_phone = '386-254-1500',
    emergency_mgmt_website = 'https://www.volusia.org/services/public-protection/emergency-management/',
    wind_speed_requirement = 140,
    flood_elevation_requirement = TRUE,
    permit_fee_structure = '{"base": 58, "per_1000": 9.5, "minimum": 125}',
    hurricane_evacuation_zone_url = 'https://www.volusia.org/services/public-protection/emergency-management/evacuations/',
    flood_zone_maps_url = 'https://www.volusia.org/services/growth-and-resource-management/environmental-management/natural-resources/flood-information/'
WHERE county_code = '12127';

-- Lake County
UPDATE florida_counties SET
    building_dept_phone = '352-343-9666',
    building_dept_address = '315 W Main St, Tavares, FL 32778',
    building_dept_website = 'https://www.lakecountyfl.gov/departments/building_services/',
    property_appraiser_phone = '352-253-2150',
    property_appraiser_email = 'info@lakecopropappr.com',
    tax_collector_phone = '352-253-6000',
    tax_collector_website = 'https://www.laketax.com/',
    emergency_mgmt_phone = '352-343-9420',
    emergency_mgmt_website = 'https://www.lakecountyfl.gov/departments/emergency_management/',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 56, "per_1000": 9.2, "minimum": 122}'
WHERE county_code = '12069';

-- Marion County (Ocala)
UPDATE florida_counties SET
    building_dept_phone = '352-671-8598',
    building_dept_address = '110 NW Pine Ave, Ocala, FL 34475',
    building_dept_website = 'https://www.marioncountyfl.org/departments/building-department',
    property_appraiser_phone = '352-368-8300',
    property_appraiser_email = 'info@pa.marion.fl.us',
    tax_collector_phone = '352-368-8200',
    tax_collector_website = 'https://www.mariontaxcollector.com/',
    emergency_mgmt_phone = '352-732-8181',
    emergency_mgmt_website = 'https://www.marioncountyfl.org/departments/emergency-management',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 54, "per_1000": 8.8, "minimum": 118}'
WHERE county_code = '12083';

-- Alachua County (Gainesville)
UPDATE florida_counties SET
    building_dept_phone = '352-374-5245',
    building_dept_address = '10 SW 2nd Ave, Suite 300, Gainesville, FL 32601',
    building_dept_website = 'https://growth-management.alachuacounty.us/building/',
    property_appraiser_phone = '352-374-5230',
    property_appraiser_email = 'acpafl@acpafl.org',
    tax_collector_phone = '352-374-5215',
    tax_collector_website = 'https://www.alachuacounty.us/taxcollector/',
    emergency_mgmt_phone = '352-264-6500',
    emergency_mgmt_website = 'https://www.alachuacounty.us/depts/em/',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 57, "per_1000": 9.3, "minimum": 124}'
WHERE county_code = '12001';

-- Leon County (Tallahassee)
UPDATE florida_counties SET
    building_dept_phone = '850-606-1300',
    building_dept_address = '435 N Macomb St, Tallahassee, FL 32301',
    building_dept_website = 'https://cms.leoncountyfl.gov/dsem/building-plans-and-inspection',
    property_appraiser_phone = '850-488-6102',
    property_appraiser_email = 'info@leonpa.org',
    tax_collector_phone = '850-606-4700',
    tax_collector_website = 'https://www.leontaxcollector.net/',
    emergency_mgmt_phone = '850-606-5000',
    emergency_mgmt_website = 'https://cms.leoncountyfl.gov/em',
    wind_speed_requirement = 140,
    permit_fee_structure = '{"base": 59, "per_1000": 9.6, "minimum": 128}'
WHERE county_code = '12073';

-- Bay County (Panama City)
UPDATE florida_counties SET
    building_dept_phone = '850-248-8350',
    building_dept_address = '840 W 11th St, Panama City, FL 32401',
    building_dept_website = 'https://www.baycountyfl.gov/149/Building-Services',
    property_appraiser_phone = '850-248-8402',
    property_appraiser_email = 'info@baypa.net',
    tax_collector_phone = '850-248-8514',
    tax_collector_website = 'https://www.baytaxcollector.com/',
    emergency_mgmt_phone = '850-248-6040',
    emergency_mgmt_website = 'https://www.baycountyfl.gov/204/Emergency-Services',
    wind_speed_requirement = 150,
    flood_elevation_requirement = TRUE,
    permit_fee_structure = '{"base": 64, "per_1000": 11.2, "minimum": 142}',
    hurricane_evacuation_zone_url = 'https://www.baycountyfl.gov/870/Evacuation-Zones'
WHERE county_code = '12005';

-- Escambia County (Pensacola)
UPDATE florida_counties SET
    building_dept_phone = '850-595-3555',
    building_dept_address = '3363 West Park Place, Pensacola, FL 32505',
    building_dept_website = 'https://myescambia.com/our-services/development-services/building-services',
    property_appraiser_phone = '850-434-2735',
    property_appraiser_email = 'info@escpa.org',
    tax_collector_phone = '850-438-6500',
    tax_collector_website = 'https://escambiataxcollector.com/',
    emergency_mgmt_phone = '850-471-6400',
    emergency_mgmt_website = 'https://bereadyescambia.com/',
    wind_speed_requirement = 150,
    flood_elevation_requirement = TRUE,
    permit_fee_structure = '{"base": 66, "per_1000": 11.5, "minimum": 145}',
    hurricane_evacuation_zone_url = 'https://bereadyescambia.com/know-your-zone/'
WHERE county_code = '12033';

-- St. Johns County (St. Augustine)
UPDATE florida_counties SET
    building_dept_phone = '904-827-6800',
    building_dept_address = '4020 Lewis Speedway, St. Augustine, FL 32084',
    building_dept_website = 'https://www.sjcfl.us/departments/building-services/',
    property_appraiser_phone = '904-827-5500',
    property_appraiser_email = 'pao@sjcpa.us',
    tax_collector_phone = '904-209-2250',
    tax_collector_website = 'https://www.sjctax.us/',
    emergency_mgmt_phone = '904-824-5550',
    emergency_mgmt_website = 'https://www.sjcfl.us/emergency-management/',
    wind_speed_requirement = 140,
    flood_elevation_requirement = TRUE,
    permit_fee_structure = '{"base": 61, "per_1000": 10.2, "minimum": 132}',
    hurricane_evacuation_zone_url = 'https://www.sjcfl.us/emergency-management/evacuation-zones/',
    citizens_service_center = 'St. Augustine Service Center: 904-461-4054'
WHERE county_code = '12109';

-- Update flood elevation requirements for coastal counties
UPDATE florida_counties SET 
    flood_elevation_requirement = TRUE 
WHERE coastal_county = TRUE AND flood_elevation_requirement IS NULL;

-- Update impact glass requirements based on wind zones
UPDATE florida_counties SET 
    impact_glass_required = TRUE 
WHERE wind_speed_requirement >= 150 AND impact_glass_required IS NULL;

-- Set FEMA regions for North/Central Florida
UPDATE florida_counties SET fema_region = '4' 
WHERE region IN ('North Central', 'Central', 'Central East', 'Central West', 'Northeast', 'Northwest') 
AND fema_region IS NULL;