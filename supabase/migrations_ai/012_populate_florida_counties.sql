-- Populate Florida Counties Reference Data
-- ========================================
-- All 67 Florida counties with their specific information

INSERT INTO florida_counties (
    county_code,
    county_name,
    county_seat,
    region,
    time_zone,
    building_dept_name,
    building_dept_phone,
    building_dept_website,
    property_appraiser_name,
    property_appraiser_phone,
    property_appraiser_website,
    property_search_url,
    gis_url,
    tax_collector_name,
    tax_collector_phone,
    tax_collector_website,
    emergency_mgmt_phone,
    emergency_mgmt_website,
    wind_speed_requirement,
    coastal_county,
    population,
    median_home_value
) VALUES
-- Northwest Florida
('12001', 'Alachua', 'Gainesville', 'North Central', 'EST', 
    'Alachua County Building Department', '352-374-5245', 'https://growth-management.alachuacounty.us/building',
    'Alachua County Property Appraiser', '352-374-5230', 'https://www.acpafl.org/',
    'https://www.acpafl.org/property-search', 'https://www.acpafl.org/gis',
    'Alachua County Tax Collector', '352-374-5215', 'https://www.alachuacounty.us/taxcollector',
    '352-264-6500', 'https://www.alachuacounty.us/em',
    140, false, 278468, 265000),

('12003', 'Baker', 'Macclenny', 'Northeast', 'EST',
    'Baker County Building Department', '904-259-3354', 'https://www.bakercountyfl.org/building',
    'Baker County Property Appraiser', '904-259-3840', 'https://www.bakerpa.com/',
    'https://www.bakerpa.com/property-search', 'https://www.bakerpa.com/gis',
    'Baker County Tax Collector', '904-259-3613', 'https://www.bakercountytax.com/',
    '904-259-6111', 'https://www.bakercountyfl.org/emergency',
    140, false, 29210, 195000),

('12005', 'Bay', 'Panama City', 'Northwest', 'CST',
    'Bay County Building Services', '850-248-8350', 'https://www.baycountyfl.gov/building',
    'Bay County Property Appraiser', '850-248-8402', 'https://www.baypa.net/',
    'https://www.baypa.net/property-search', 'https://bayco.mapxpress.net/',
    'Bay County Tax Collector', '850-248-8514', 'https://www.baytaxcollector.com/',
    '850-248-6040', 'https://www.baycountyfl.gov/emergency',
    150, true, 175216, 235000),

('12007', 'Bradford', 'Starke', 'Northeast', 'EST',
    'Bradford County Building Department', '904-966-6299', 'https://www.bradfordcountyfl.gov/building',
    'Bradford County Property Appraiser', '904-964-8092', 'https://www.bradfordappraiser.com/',
    'https://www.bradfordappraiser.com/property-search', NULL,
    'Bradford County Tax Collector', '904-964-8815', 'https://www.bradfordtaxcollector.com/',
    '904-966-6336', 'https://www.bradfordcountyfl.gov/emergency',
    140, false, 28201, 155000),

('12009', 'Brevard', 'Titusville', 'Central East', 'EST',
    'Brevard County Building Department', '321-633-2013', 'https://www.brevardfl.gov/building',
    'Brevard County Property Appraiser', '321-264-6700', 'https://www.bcpao.us/',
    'https://www.bcpao.us/PropertySearch', 'https://brevard.county-taxes.com/public',
    'Brevard County Tax Collector', '321-264-6245', 'https://www.brevardtaxcollector.com/',
    '321-637-6670', 'https://www.embrevard.com/',
    150, true, 606612, 280000),

('12011', 'Broward', 'Fort Lauderdale', 'Southeast', 'EST',
    'Broward County Building Code Services', '954-765-4400', 'https://www.broward.org/building',
    'Broward County Property Appraiser', '954-357-6830', 'https://web.bcpa.net/',
    'https://web.bcpa.net/bcpaclient', 'https://gis.broward.org/GISData/',
    'Broward County Tax Collector', '954-831-8100', 'https://www.browardtaxcollector.com/',
    '954-831-3900', 'https://www.broward.org/emergency',
    175, true, 1944375, 375000),

('12013', 'Calhoun', 'Blountstown', 'Northwest', 'CST',
    'Calhoun County Building Department', '850-674-4545', 'https://www.calhouncountygov.com/building',
    'Calhoun County Property Appraiser', '850-674-4545', 'https://www.calhounpa.com/',
    'https://www.calhounpa.com/property-search', NULL,
    'Calhoun County Tax Collector', '850-674-4571', 'https://www.calhouncountytaxcollector.com/',
    '850-674-5573', 'https://www.calhouncountygov.com/emergency',
    140, false, 13648, 125000),

('12015', 'Charlotte', 'Punta Gorda', 'Southwest', 'EST',
    'Charlotte County Building Construction Services', '941-743-1201', 'https://www.charlottecountyfl.gov/services/buildingconstruction',
    'Charlotte County Property Appraiser', '941-743-1460', 'https://www.ccappraiser.com/',
    'https://www.ccappraiser.com/property-search', 'https://gis.charlottecountyfl.gov/',
    'Charlotte County Tax Collector', '941-743-1350', 'https://www.charlottecountytax.com/',
    '941-833-4000', 'https://www.charlottecountyfl.gov/services/emergencymanagement',
    150, true, 188910, 275000),

('12017', 'Citrus', 'Inverness', 'Central West', 'EST',
    'Citrus County Building Division', '352-527-5350', 'https://www.citrusbocc.com/departments/building',
    'Citrus County Property Appraiser', '352-341-6600', 'https://www.pa.citrus.fl.us/',
    'https://www.pa.citrus.fl.us/property-search', 'https://gis.citrusbocc.com/',
    'Citrus County Tax Collector', '352-341-6500', 'https://www.citrusTaxCollector.com/',
    '352-746-6555', 'https://www.citrusbocc.com/departments/emergency_management',
    140, true, 153843, 195000),

('12019', 'Clay', 'Green Cove Springs', 'Northeast', 'EST',
    'Clay County Building Department', '904-278-3780', 'https://www.claycountygov.com/departments/building',
    'Clay County Property Appraiser', '904-269-6305', 'https://www.ccpao.com/',
    'https://www.ccpao.com/property-search', 'https://ccpao.maps.arcgis.com/',
    'Clay County Tax Collector', '904-269-6320', 'https://www.claytax.com/',
    '904-284-7703', 'https://www.claycountygov.com/departments/emergency-management',
    140, false, 219252, 265000),

('12021', 'Collier', 'Naples', 'Southwest', 'EST',
    'Collier County Building Department', '239-252-2400', 'https://www.colliercountyfl.gov/government/growth-management/divisions/building-review-and-permitting',
    'Collier County Property Appraiser', '239-252-8141', 'https://www.collierappraiser.com/',
    'https://www.collierappraiser.com/property-search', 'https://gis.colliercountyfl.gov/',
    'Collier County Tax Collector', '239-252-8171', 'https://www.colliertaxcollector.com/',
    '239-252-3600', 'https://www.colliercountyfl.gov/government/public-services/departments/emergency-management',
    172, true, 375752, 455000),

('12023', 'Columbia', 'Lake City', 'North Central', 'EST',
    'Columbia County Building Department', '386-758-1005', 'https://www.columbiacountyfla.com/Building',
    'Columbia County Property Appraiser', '386-758-1083', 'https://www.columbiapafl.com/',
    'https://www.columbiapafl.com/property-search', NULL,
    'Columbia County Tax Collector', '386-758-1077', 'https://www.columbiataxcollector.com/',
    '386-758-1125', 'https://www.columbiacountyfla.com/EmergencyManagement',
    140, false, 69698, 175000),

('12027', 'DeSoto', 'Arcadia', 'Southwest', 'EST',
    'DeSoto County Building Department', '863-993-4831', 'https://www.desotobocc.com/building',
    'DeSoto County Property Appraiser', '863-993-4810', 'https://www.desotopa.com/',
    'https://www.desotopa.com/property-search', NULL,
    'DeSoto County Tax Collector', '863-993-4818', 'https://www.desototc.com/',
    '863-993-4831', 'https://www.desotobocc.com/emergency',
    150, false, 33865, 145000),

('12029', 'Dixie', 'Cross City', 'North Central', 'EST',
    'Dixie County Building Department', '352-498-1200', 'https://www.dixiecounty.fl.gov/building',
    'Dixie County Property Appraiser', '352-498-1216', 'https://www.dixiepa.com/',
    'https://www.dixiepa.com/property-search', NULL,
    'Dixie County Tax Collector', '352-498-1220', 'https://www.dixietaxcollector.com/',
    '352-498-1240', 'https://www.dixiecounty.fl.gov/emergency',
    140, true, 16422, 135000),

('12031', 'Duval', 'Jacksonville', 'Northeast', 'EST',
    'City of Jacksonville Building Inspection Division', '904-255-8000', 'https://www.coj.net/building',
    'Duval County Property Appraiser', '904-630-2011', 'https://www.coj.net/pa',
    'https://paopropertysearch.coj.net/', 'https://maps.coj.net/',
    'Duval County Tax Collector', '904-630-1916', 'https://www.duvaltaxcollector.net/',
    '904-630-2472', 'https://www.coj.net/emergency',
    140, true, 995567, 265000),

('12033', 'Escambia', 'Pensacola', 'Northwest', 'CST',
    'Escambia County Building Services', '850-595-3555', 'https://myescambia.com/our-services/development-services/building-services',
    'Escambia County Property Appraiser', '850-434-2735', 'https://www.escpa.org/',
    'https://www.escpa.org/property-search', 'https://gis.escpa.org/',
    'Escambia County Tax Collector', '850-438-6500', 'https://escambiataxcollector.com/',
    '850-471-6400', 'https://myescambia.com/our-services/public-safety/emergency-management',
    150, true, 321905, 215000),

('12035', 'Flagler', 'Bunnell', 'Northeast', 'EST',
    'Flagler County Building Department', '386-313-4001', 'https://www.flaglercounty.gov/government/departments/building',
    'Flagler County Property Appraiser', '386-313-4150', 'https://www.flaglerpa.com/',
    'https://www.flaglerpa.com/property-search', 'https://flagler.county-taxes.com/',
    'Flagler County Tax Collector', '386-313-4160', 'https://www.flaglertax.com/',
    '386-313-4200', 'https://www.flaglercounty.gov/government/departments/emergency-management',
    140, true, 115378, 275000),

('12037', 'Franklin', 'Apalachicola', 'Northwest', 'EST',
    'Franklin County Building Department', '850-653-9783', 'https://www.franklincountyflorida.com/building',
    'Franklin County Property Appraiser', '850-653-9356', 'https://www.franklinclerk.com/',
    'https://www.franklinpa.com/property-search', NULL,
    'Franklin County Tax Collector', '850-653-9333', 'https://www.franklintaxcollector.com/',
    '850-653-8977', 'https://www.franklincountyflorida.com/emergency',
    150, true, 12451, 265000),

('12039', 'Gadsden', 'Quincy', 'Northwest', 'EST',
    'Gadsden County Building Department', '850-875-8650', 'https://www.gadsdengov.net/building',
    'Gadsden County Property Appraiser', '850-875-8825', 'https://www.gadsdenpa.com/',
    'https://www.gadsdenpa.com/property-search', NULL,
    'Gadsden County Tax Collector', '850-875-8848', 'https://www.gadsdentaxcollector.com/',
    '850-875-8642', 'https://www.gadsdengov.net/emergency',
    140, false, 43826, 125000),

('12041', 'Gilchrist', 'Trenton', 'North Central', 'EST',
    'Gilchrist County Building Department', '352-463-3169', 'https://www.gilchrist.fl.us/building',
    'Gilchrist County Property Appraiser', '352-463-3190', 'https://www.gilchristappraiser.com/',
    'https://www.gilchristappraiser.com/property-search', NULL,
    'Gilchrist County Tax Collector', '352-463-3180', 'https://www.gilchristtaxcollector.com/',
    '352-463-3101', 'https://www.gilchrist.fl.us/emergency',
    140, false, 18582, 165000),

('12043', 'Glades', 'Moore Haven', 'Southwest', 'EST',
    'Glades County Building Department', '863-946-6020', 'https://www.gladescountyfl.gov/building',
    'Glades County Property Appraiser', '863-946-6025', 'https://www.gladespa.com/',
    'https://www.gladespa.com/property-search', NULL,
    'Glades County Tax Collector', '863-946-6028', 'https://www.gladestc.com/',
    '863-946-6020', 'https://www.gladescountyfl.gov/emergency',
    140, false, 12126, 115000),

('12045', 'Gulf', 'Port St. Joe', 'Northwest', 'EST/CST',
    'Gulf County Building Department', '850-229-6106', 'https://www.gulfcounty-fl.gov/building',
    'Gulf County Property Appraiser', '850-229-6116', 'https://www.gulfpa.com/',
    'https://www.gulfpa.com/property-search', NULL,
    'Gulf County Tax Collector', '850-229-6112', 'https://www.gulftaxcollector.com/',
    '850-229-9110', 'https://www.gulfcounty-fl.gov/emergency',
    150, true, 14817, 195000),

('12047', 'Hamilton', 'Jasper', 'North Central', 'EST',
    'Hamilton County Building Department', '386-792-6639', 'https://www.hamiltoncountyfl.com/building',
    'Hamilton County Property Appraiser', '386-792-1427', 'https://www.hamiltonpa.com/',
    'https://www.hamiltonpa.com/property-search', NULL,
    'Hamilton County Tax Collector', '386-792-1406', 'https://www.hamiltontaxcollector.com/',
    '386-792-6647', 'https://www.hamiltoncountyfl.com/emergency',
    140, false, 14004, 125000),

('12049', 'Hardee', 'Wauchula', 'Central', 'EST',
    'Hardee County Building Department', '863-773-4449', 'https://www.hardeecounty.net/building',
    'Hardee County Property Appraiser', '863-773-9144', 'https://www.hardeepa.com/',
    'https://www.hardeepa.com/property-search', NULL,
    'Hardee County Tax Collector', '863-773-9144', 'https://www.hardeetc.com/',
    '863-773-6373', 'https://www.hardeecounty.net/emergency',
    150, false, 25327, 135000),

('12051', 'Hendry', 'LaBelle', 'Southwest', 'EST',
    'Hendry County Building Department', '863-675-5245', 'https://www.hendryfla.net/building',
    'Hendry County Property Appraiser', '863-675-5270', 'https://www.hendrypa.com/',
    'https://www.hendrypa.com/property-search', NULL,
    'Hendry County Tax Collector', '863-675-5280', 'https://www.hendrytax.com/',
    '863-674-5400', 'https://www.hendryfla.net/emergency',
    150, false, 39619, 155000),

('12053', 'Hernando', 'Brooksville', 'Central West', 'EST',
    'Hernando County Building Department', '352-754-4050', 'https://www.hernandocounty.us/departments/building',
    'Hernando County Property Appraiser', '352-754-4190', 'https://www.hernandopa.com/',
    'https://www.hernandopa.com/property-search', 'https://gis.hernandocounty.us/',
    'Hernando County Tax Collector', '352-754-4260', 'https://www.hernandotaxcollector.com/',
    '352-754-4083', 'https://www.hernandocounty.us/departments/emergency-management',
    140, true, 194515, 225000),

('12055', 'Highlands', 'Sebring', 'Central', 'EST',
    'Highlands County Building Department', '863-402-6638', 'https://www.highlandsfl.gov/building',
    'Highlands County Property Appraiser', '863-402-6645', 'https://www.appraiser.co.highlands.fl.us/',
    'https://www.highlandspa.com/property-search', NULL,
    'Highlands County Tax Collector', '863-402-6685', 'https://www.hctaxcollector.com/',
    '863-385-1112', 'https://www.highlandsfl.gov/emergency',
    140, false, 101235, 165000),

('12057', 'Hillsborough', 'Tampa', 'Central West', 'EST',
    'Hillsborough County Building Services', '813-272-5600', 'https://www.hillsboroughcounty.org/en/businesses/permits/building-permits',
    'Hillsborough County Property Appraiser', '813-272-6000', 'https://www.hcpafl.org/',
    'https://gis.hcpafl.org/propertysearch', 'https://gis.hcpafl.org/',
    'Hillsborough County Tax Collector', '813-635-5200', 'https://www.hctaxcollector.com/',
    '813-272-5900', 'https://www.hillsboroughcounty.org/en/residents/public-safety/emergency-management',
    170, true, 1459762, 315000),

('12059', 'Holmes', 'Bonifay', 'Northwest', 'CST',
    'Holmes County Building Department', '850-547-1119', 'https://www.holmescountyfl.com/building',
    'Holmes County Property Appraiser', '850-547-3656', 'https://www.holmespa.com/',
    'https://www.holmespa.com/property-search', NULL,
    'Holmes County Tax Collector', '850-547-3664', 'https://www.holmestaxcollector.com/',
    '850-547-4671', 'https://www.holmescountyfl.com/emergency',
    140, false, 19653, 125000),

('12061', 'Indian River', 'Vero Beach', 'Central East', 'EST',
    'Indian River County Building Department', '772-226-1260', 'https://www.ircgov.com/building',
    'Indian River County Property Appraiser', '772-567-8000', 'https://www.ircpa.org/',
    'https://www.ircpa.org/property-search', 'https://gis.ircgov.com/',
    'Indian River County Tax Collector', '772-567-8176', 'https://www.irctaxcollector.com/',
    '772-567-2154', 'https://www.ircgov.com/emergencyservices',
    150, true, 159923, 315000),

('12063', 'Jackson', 'Marianna', 'Northwest', 'CST',
    'Jackson County Building Department', '850-482-9633', 'https://www.jacksoncountyfl.gov/building',
    'Jackson County Property Appraiser', '850-482-9646', 'https://www.jacksonpa.com/',
    'https://www.jacksonpa.com/property-search', NULL,
    'Jackson County Tax Collector', '850-482-9653', 'https://www.jacksontaxcollector.com/',
    '850-482-9624', 'https://www.jacksoncountyfl.gov/emergency',
    140, false, 46316, 135000),

('12065', 'Jefferson', 'Monticello', 'North Central', 'EST',
    'Jefferson County Building Department', '850-342-0184', 'https://www.jeffersoncountyfl.gov/building',
    'Jefferson County Property Appraiser', '850-997-3356', 'https://www.jeffersonpa.net/',
    'https://www.jeffersonpa.net/property-search', NULL,
    'Jefferson County Tax Collector', '850-342-0115', 'https://www.jeffersontaxcollector.com/',
    '850-342-0184', 'https://www.jeffersoncountyfl.gov/emergency',
    140, false, 14246, 155000),

('12067', 'Lafayette', 'Mayo', 'North Central', 'EST',
    'Lafayette County Building Department', '386-294-1351', 'https://www.lafayettecountyfl.net/building',
    'Lafayette County Property Appraiser', '386-294-1959', 'https://www.lafayettepa.com/',
    'https://www.lafayettepa.com/property-search', NULL,
    'Lafayette County Tax Collector', '386-294-1977', 'https://www.lafayettetaxcollector.com/',
    '386-294-1447', 'https://www.lafayettecountyfl.net/emergency',
    140, false, 8422, 125000),

('12069', 'Lake', 'Tavares', 'Central', 'EST',
    'Lake County Building Services', '352-343-9666', 'https://www.lakecountyfl.gov/departments/building_services',
    'Lake County Property Appraiser', '352-253-2150', 'https://www.lakecopropappr.com/',
    'https://www.lakecopropappr.com/property-search', 'https://gis.lakecountyfl.gov/',
    'Lake County Tax Collector', '352-253-6000', 'https://www.laketax.com/',
    '352-343-9420', 'https://www.lakecountyfl.gov/departments/emergency_management',
    140, false, 383956, 285000),

('12071', 'Lee', 'Fort Myers', 'Southwest', 'EST',
    'Lee County Building Department', '239-533-8329', 'https://www.leegov.com/dcd/building',
    'Lee County Property Appraiser', '239-533-6100', 'https://www.leepa.org/',
    'https://www.leepa.org/Search/PropertySearch', 'https://gis.leegov.com/',
    'Lee County Tax Collector', '239-339-6000', 'https://www.leetc.com/',
    '239-533-3911', 'https://www.leegov.com/publicsafety/emergencymanagement',
    172, true, 760822, 325000),

('12073', 'Leon', 'Tallahassee', 'Northwest', 'EST',
    'Leon County Building Plans and Inspections', '850-606-1300', 'https://cms.leoncountyfl.gov/dsem/building-plans-and-inspection',
    'Leon County Property Appraiser', '850-488-6102', 'https://www.leonpa.org/',
    'https://www.leonpa.org/property-search', 'https://gis.leonpa.org/',
    'Leon County Tax Collector', '850-606-4700', 'https://www.leontaxcollector.net/',
    '850-606-5000', 'https://cms.leoncountyfl.gov/em',
    140, false, 293582, 245000),

('12075', 'Levy', 'Bronson', 'North Central', 'EST',
    'Levy County Building Department', '352-486-5207', 'https://www.levycounty.org/building',
    'Levy County Property Appraiser', '352-486-5228', 'https://www.levypa.com/',
    'https://www.levypa.com/property-search', NULL,
    'Levy County Tax Collector', '352-486-5240', 'https://www.levytaxcollector.com/',
    '352-486-5213', 'https://www.levycounty.org/emergency',
    140, true, 42547, 165000),

('12077', 'Liberty', 'Bristol', 'Northwest', 'EST',
    'Liberty County Building Department', '850-643-5798', 'https://libertycountyfl.org/building',
    'Liberty County Property Appraiser', '850-643-5390', 'https://www.libertypa.com/',
    'https://www.libertypa.com/property-search', NULL,
    'Liberty County Tax Collector', '850-643-5411', 'https://www.libertytaxcollector.com/',
    '850-643-3283', 'https://libertycountyfl.org/emergency',
    140, false, 7974, 115000),

('12079', 'Madison', 'Madison', 'North Central', 'EST',
    'Madison County Building Department', '850-973-3179', 'https://www.madisoncountyfl.com/building',
    'Madison County Property Appraiser', '850-973-6133', 'https://www.madisonpa.com/',
    'https://www.madisonpa.com/property-search', NULL,
    'Madison County Tax Collector', '850-973-2717', 'https://www.madisontaxcollector.com/',
    '850-973-3698', 'https://www.madisoncountyfl.com/emergency',
    140, false, 18493, 125000),

('12081', 'Manatee', 'Bradenton', 'Southwest', 'EST',
    'Manatee County Building Department', '941-748-4501', 'https://www.mymanatee.org/departments/building___development_services',
    'Manatee County Property Appraiser', '941-748-8208', 'https://www.manateepao.com/',
    'https://www.manateepao.com/property-search', 'https://gis.mymanatee.org/',
    'Manatee County Tax Collector', '941-741-4800', 'https://www.taxcollector.com/',
    '941-749-3500', 'https://www.mymanatee.org/departments/public_safety/emergency_management',
    170, true, 399710, 355000),

('12083', 'Marion', 'Ocala', 'Central', 'EST',
    'Marion County Building Department', '352-671-8598', 'https://www.marioncountyfl.org/building',
    'Marion County Property Appraiser', '352-368-8300', 'https://www.pa.marion.fl.us/',
    'https://www.pa.marion.fl.us/property-search', 'https://gis.marioncountyfl.org/',
    'Marion County Tax Collector', '352-368-8200', 'https://www.mariontaxcollector.com/',
    '352-732-8181', 'https://www.marioncountyfl.org/emergency-management',
    140, false, 375908, 215000),

('12085', 'Martin', 'Stuart', 'Southeast', 'EST',
    'Martin County Building Department', '772-221-1357', 'https://www.martin.fl.us/building-department',
    'Martin County Property Appraiser', '772-288-5608', 'https://www.pa.martin.fl.us/',
    'https://www.pa.martin.fl.us/property-search', 'https://mcgis.martin.fl.us/',
    'Martin County Tax Collector', '772-288-5600', 'https://www.tcmartin.com/',
    '772-287-1652', 'https://www.martin.fl.us/emergency-management',
    175, true, 161000, 425000),

('12086', 'Miami-Dade', 'Miami', 'Southeast', 'EST',
    'Miami-Dade County Building Department', '786-315-2000', 'https://www.miamidade.gov/building',
    'Miami-Dade County Property Appraiser', '305-375-4712', 'https://www.miamidade.gov/pa',
    'https://www.miamidade.gov/propertysearch', 'https://gis.miamidade.gov/',
    'Miami-Dade County Tax Collector', '305-270-4916', 'https://www.miamidade.gov/taxcollector',
    '305-468-5400', 'https://www.miamidade.gov/emergency',
    175, true, 2716940, 415000),

('12087', 'Monroe', 'Key West', 'Southeast', 'EST',
    'Monroe County Building Department', '305-453-8800', 'https://www.monroecounty-fl.gov/237/Building-Department',
    'Monroe County Property Appraiser', '305-292-3420', 'https://www.mcpafl.org/',
    'https://www.mcpafl.org/property-search', 'https://mcgis.monroecounty-fl.gov/',
    'Monroe County Tax Collector', '305-295-5000', 'https://www.monroetaxcollector.com/',
    '305-289-6018', 'https://www.monroecounty-fl.gov/192/Emergency-Management',
    180, true, 82874, 795000),

('12089', 'Nassau', 'Fernandina Beach', 'Northeast', 'EST',
    'Nassau County Building Department', '904-530-6300', 'https://www.nassaucountyfl.com/building',
    'Nassau County Property Appraiser', '904-261-3420', 'https://www.nassauflpa.com/',
    'https://www.nassauflpa.com/property-search', 'https://maps.nassaucountyfl.com/',
    'Nassau County Tax Collector', '904-261-3442', 'https://www.nassautaxfl.com/',
    '904-548-0900', 'https://www.nassaucountyfl.com/938/Emergency-Management',
    140, true, 90352, 355000),

('12091', 'Okaloosa', 'Crestview', 'Northwest', 'CST',
    'Okaloosa County Building Department', '850-651-7180', 'https://www.myokaloosa.com/growth_management/building',
    'Okaloosa County Property Appraiser', '850-651-7250', 'https://www.okaloosafl.com/',
    'https://www.okaloosafl.com/property-search', 'https://gis.okaloosafl.com/',
    'Okaloosa County Tax Collector', '850-651-7280', 'https://www.okaloosatax.com/',
    '850-651-7150', 'https://www.myokaloosa.com/ps/emergency-management',
    150, true, 211668, 315000),

('12093', 'Okeechobee', 'Okeechobee', 'Central', 'EST',
    'Okeechobee County Building Department', '863-763-5542', 'https://www.co.okeechobee.fl.us/building',
    'Okeechobee County Property Appraiser', '863-763-3806', 'https://www.okeepa.com/',
    'https://www.okeepa.com/property-search', NULL,
    'Okeechobee County Tax Collector', '863-763-3421', 'https://www.okeechobeecountytaxcollector.com/',
    '863-763-3212', 'https://www.co.okeechobee.fl.us/emergency',
    140, false, 39996, 165000),

('12095', 'Orange', 'Orlando', 'Central', 'EST',
    'Orange County Building Department', '407-836-5550', 'https://www.orangecountyfl.net/PermitsLicenses/Building',
    'Orange County Property Appraiser', '407-836-5044', 'https://www.ocpafl.org/',
    'https://www.ocpafl.org/property-search', 'https://gis.ocpafl.org/',
    'Orange County Tax Collector', '407-445-8200', 'https://www.octaxcol.com/',
    '407-836-2992', 'https://www.orangecountyfl.net/EmergencySafety/EmergencyManagement',
    140, false, 1429908, 335000),

('12097', 'Osceola', 'Kissimmee', 'Central', 'EST',
    'Osceola County Building Department', '407-742-8000', 'https://www.osceola.org/services/building',
    'Osceola County Property Appraiser', '407-742-5000', 'https://www.osceolapropertyappraiser.com/',
    'https://www.osceolapropertyappraiser.com/property-search', 'https://maps.osceola.org/',
    'Osceola County Tax Collector', '407-742-4000', 'https://www.osceolataxcollector.org/',
    '407-742-9000', 'https://www.osceola.org/agencies-departments/emergency-management',
    140, false, 388656, 295000),

('12099', 'Palm Beach', 'West Palm Beach', 'Southeast', 'EST',
    'Palm Beach County Building Department', '561-233-5100', 'https://discover.pbcgov.org/pzb/building',
    'Palm Beach County Property Appraiser', '561-355-3230', 'https://www.pbcgov.org/papa',
    'https://www.pbcgov.org/papa/propertysearch', 'https://geopbcparcels.co.palm-beach.fl.us/',
    'Palm Beach County Tax Collector', '561-355-2264', 'https://www.taxcollectorpbc.com/',
    '561-712-6400', 'https://discover.pbcgov.org/publicsafety/dem',
    175, true, 1496770, 415000),

('12101', 'Pasco', 'Dade City', 'Central West', 'EST',
    'Pasco County Building Department', '727-847-2411', 'https://www.pascocountyfl.net/149/Building-Construction-Services',
    'Pasco County Property Appraiser', '352-521-4338', 'https://www.pascopa.com/',
    'https://search.pascopa.com/', 'https://gispublic.pascocountyfl.net/',
    'Pasco County Tax Collector', '727-847-8032', 'https://www.pascotaxes.com/',
    '727-847-8959', 'https://www.pascocountyfl.net/264/Emergency-Management',
    140, true, 561891, 265000),

('12103', 'Pinellas', 'Clearwater', 'Central West', 'EST',
    'Pinellas County Building Services', '727-464-3888', 'https://www.pinellascounty.org/build',
    'Pinellas County Property Appraiser', '727-464-7777', 'https://www.pcpao.org/',
    'https://www.pcpao.org/search', 'https://pcpao.pinellascounty.org/',
    'Pinellas County Tax Collector', '727-464-7171', 'https://www.taxcollect.com/',
    '727-464-3800', 'https://www.pinellascounty.org/emergency',
    170, true, 959107, 315000),

('12105', 'Polk', 'Bartow', 'Central', 'EST',
    'Polk County Building Department', '863-534-6090', 'https://www.polk-county.net/building',
    'Polk County Property Appraiser', '863-534-4777', 'https://www.polkpa.org/',
    'https://www.polkpa.org/Search', 'https://gisapps.polk-county.net/',
    'Polk County Tax Collector', '863-534-4700', 'https://www.polktaxes.com/',
    '863-534-5600', 'https://www.polk-county.net/emergency-management',
    140, false, 724777, 245000),

('12107', 'Putnam', 'Palatka', 'Northeast', 'EST',
    'Putnam County Building Department', '386-329-0256', 'https://www.putnam-fl.com/building',
    'Putnam County Property Appraiser', '386-329-0280', 'https://www.putnampa.com/',
    'https://www.putnampa.com/property-search', NULL,
    'Putnam County Tax Collector', '386-329-0290', 'https://www.putnamtaxcollector.com/',
    '386-329-0256', 'https://www.putnam-fl.com/emergency-services',
    140, false, 73321, 145000),

('12109', 'St. Johns', 'St. Augustine', 'Northeast', 'EST',
    'St. Johns County Building Department', '904-827-6800', 'https://www.sjcfl.us/Building',
    'St. Johns County Property Appraiser', '904-827-5500', 'https://www.sjcpa.us/',
    'https://www.sjcpa.us/property-search', 'https://gis.sjcfl.us/',
    'St. Johns County Tax Collector', '904-209-2250', 'https://www.sjctax.us/',
    '904-824-5550', 'https://www.sjcfl.us/EmergencyManagement',
    140, true, 273425, 415000),

('12111', 'St. Lucie', 'Fort Pierce', 'Southeast', 'EST',
    'St. Lucie County Building Department', '772-462-1100', 'https://www.stlucieco.gov/departments-and-services/development-services/building',
    'St. Lucie County Property Appraiser', '772-462-1000', 'https://www.paslc.org/',
    'https://www.paslc.org/property-search', 'https://gis.stlucieco.gov/',
    'St. Lucie County Tax Collector', '772-462-1200', 'https://www.tcslc.com/',
    '772-462-8100', 'https://www.stlucieco.gov/departments-and-services/public-safety/emergency-management',
    155, true, 329226, 285000),

('12113', 'Santa Rosa', 'Milton', 'Northwest', 'CST',
    'Santa Rosa County Building Department', '850-981-7000', 'https://www.santarosa.fl.gov/428/Building-Inspections',
    'Santa Rosa County Property Appraiser', '850-983-1880', 'https://www.srcpa.org/',
    'https://www.srcpa.org/property-search', 'https://gis.santarosa.fl.gov/',
    'Santa Rosa County Tax Collector', '850-983-1800', 'https://www.srctc.com/',
    '850-983-5360', 'https://www.santarosa.fl.gov/202/Emergency-Management',
    150, true, 188000, 315000),

('12115', 'Sarasota', 'Sarasota', 'Southwest', 'EST',
    'Sarasota County Building Department', '941-861-6678', 'https://www.scgov.net/government/planning-and-development-services/building-and-permitting',
    'Sarasota County Property Appraiser', '941-861-8200', 'https://www.sc-pa.com/',
    'https://www.sc-pa.com/search', 'https://gis.scgov.net/',
    'Sarasota County Tax Collector', '941-861-8300', 'https://www.sarasotataxcollector.com/',
    '941-861-5000', 'https://www.scgov.net/government/emergency-services/emergency-management',
    160, true, 434006, 385000),

('12117', 'Seminole', 'Sanford', 'Central', 'EST',
    'Seminole County Building Department', '407-665-7050', 'https://www.seminolecountyfl.gov/departments-services/development-services/building',
    'Seminole County Property Appraiser', '407-665-7654', 'https://www.scpafl.org/',
    'https://www.scpafl.org/property-search', 'https://gis.seminolecountyfl.gov/',
    'Seminole County Tax Collector', '407-665-1000', 'https://www.seminolecountytax.org/',
    '407-665-5102', 'https://www.seminolecountyfl.gov/departments-services/county-managers-office/prepare-seminole',
    140, false, 470856, 345000),

('12119', 'Sumter', 'Bushnell', 'Central', 'EST',
    'Sumter County Building Department', '352-689-4400', 'https://www.sumtercountyfl.gov/building',
    'Sumter County Property Appraiser', '352-569-6700', 'https://www.sumterpa.com/',
    'https://www.sumterpa.com/property-search', 'https://gis.sumtercountyfl.gov/',
    'Sumter County Tax Collector', '352-569-6600', 'https://www.sumtertaxcollector.com/',
    '352-569-6700', 'https://www.sumtercountyfl.gov/emergency',
    140, false, 129752, 295000),

('12121', 'Suwannee', 'Live Oak', 'North Central', 'EST',
    'Suwannee County Building Department', '386-364-3403', 'https://www.suwanneecountyfl.com/building',
    'Suwannee County Property Appraiser', '386-362-2765', 'https://www.suwanneepa.com/',
    'https://www.suwanneepa.com/property-search', NULL,
    'Suwannee County Tax Collector', '386-362-2642', 'https://www.suwanneetaxcollector.com/',
    '386-364-3405', 'https://www.suwanneecountyfl.com/emergency',
    140, false, 44417, 155000),

('12123', 'Taylor', 'Perry', 'North Central', 'EST',
    'Taylor County Building Department', '850-838-3500', 'https://www.taylorcountygov.com/building',
    'Taylor County Property Appraiser', '850-838-3525', 'https://www.taylorpa.com/',
    'https://www.taylorpa.com/property-search', NULL,
    'Taylor County Tax Collector', '850-838-3536', 'https://www.taylortaxcollector.com/',
    '850-838-3575', 'https://www.taylorcountygov.com/emergency',
    140, true, 21796, 125000),

('12125', 'Union', 'Lake Butler', 'North Central', 'EST',
    'Union County Building Department', '386-496-4241', 'https://www.unioncountyfl.com/building',
    'Union County Property Appraiser', '386-496-2991', 'https://www.unionflpa.com/',
    'https://www.unionflpa.com/property-search', NULL,
    'Union County Tax Collector', '386-496-3341', 'https://www.unioncountytaxcollector.com/',
    '386-496-4335', 'https://www.unioncountyfl.com/emergency',
    140, false, 15737, 145000),

('12127', 'Volusia', 'DeLand', 'Central East', 'EST',
    'Volusia County Building & Zoning', '386-736-5959', 'https://www.volusia.org/services/growth-and-resource-management/building-and-zoning',
    'Volusia County Property Appraiser', '386-736-5901', 'https://www.vcpa.net/',
    'https://vcpa.vcgov.org/', 'https://gis.volusia.org/',
    'Volusia County Tax Collector', '386-254-4750', 'https://www.volusia.org/taxcollector',
    '386-254-1500', 'https://www.volusia.org/services/public-protection/emergency-management',
    140, true, 553543, 275000),

('12129', 'Wakulla', 'Crawfordville', 'Northwest', 'EST',
    'Wakulla County Building Department', '850-926-0919', 'https://www.mywakulla.com/departments/building_inspection',
    'Wakulla County Property Appraiser', '850-926-0500', 'https://www.wakullaflpa.net/',
    'https://www.wakullaflpa.net/property-search', NULL,
    'Wakulla County Tax Collector', '850-926-3371', 'https://www.wakullataxcollector.com/',
    '850-745-7200', 'https://www.mywakulla.com/departments/emergency_management',
    140, true, 33764, 265000),

('12131', 'Walton', 'DeFuniak Springs', 'Northwest', 'CST',
    'Walton County Building Department', '850-892-8108', 'https://www.co.walton.fl.us/96/Building-Department',
    'Walton County Property Appraiser', '850-892-8115', 'https://www.waltonpa.com/',
    'https://www.waltonpa.com/property-search', 'https://gis.co.walton.fl.us/',
    'Walton County Tax Collector', '850-892-8121', 'https://www.waltontaxcollector.com/',
    '850-892-8065', 'https://www.co.walton.fl.us/654/Emergency-Services',
    150, true, 75305, 425000),

('12133', 'Washington', 'Chipley', 'Northwest', 'CST',
    'Washington County Building Department', '850-638-6200', 'https://www.washingtonfl.com/building',
    'Washington County Property Appraiser', '850-638-6236', 'https://www.washingtonpa.com/',
    'https://www.washingtonpa.com/property-search', NULL,
    'Washington County Tax Collector', '850-638-6242', 'https://www.washingtontaxcollector.com/',
    '850-638-6203', 'https://www.washingtonfl.com/emergency',
    140, false, 25426, 135000)
ON CONFLICT (county_code) DO UPDATE SET
    building_dept_name = EXCLUDED.building_dept_name,
    building_dept_phone = EXCLUDED.building_dept_phone,
    building_dept_website = EXCLUDED.building_dept_website,
    property_appraiser_name = EXCLUDED.property_appraiser_name,
    property_appraiser_phone = EXCLUDED.property_appraiser_phone,
    property_appraiser_website = EXCLUDED.property_appraiser_website,
    property_search_url = EXCLUDED.property_search_url,
    gis_url = EXCLUDED.gis_url,
    last_verified_at = NOW();