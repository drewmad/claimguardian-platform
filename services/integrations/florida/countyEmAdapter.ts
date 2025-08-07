/**
 * Florida County Emergency Management Adapter
 * Fetches real-time emergency alerts from county and state sources
 * 
 * @fileMetadata
 * @purpose Convert emergency alerts from mock to real data sources
 * @dependencies fast-xml-parser, node-fetch
 * @owner emergency-management-team
 * @status active
 */

import { XMLParser } from "fast-xml-parser";

interface CountyAlert {
  id: string;
  title: string;
  description: string;
  effective: string;
  expires: string;
  severity: string;
  urgency: string;
  certainty: string;
  area: string;
  event: string;
  headline: string;
  instructions?: string;
  web?: string;
  contact?: string;
  parameter?: Record<string, any>;
}

interface EmergencyAlertIntelligence {
  countyCode: string;
  countyName: string;
  alertStatus: string;
  totalActiveAlerts: number;
  activeAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    urgency: string;
    title: string;
    description: string;
    areaDescription: string;
    effective: string;
    expires: string;
    directThreat: boolean;
    insuranceRelevance: string;
    recommendedActions: string[];
  }>;
  riskAssessment: {
    overallRisk: string;
    immediateThreats: string[];
    potentialImpacts: string[];
  };
  lastUpdated: string;
}

// Florida County FIPS codes mapping
const FLORIDA_COUNTIES: Record<string, { name: string; fips: string }> = {
  'FLZ001': { name: 'Escambia', fips: '12033' },
  'FLZ002': { name: 'Santa Rosa', fips: '12113' },
  'FLZ003': { name: 'Okaloosa', fips: '12091' },
  'FLZ004': { name: 'Walton', fips: '12131' },
  'FLZ005': { name: 'Holmes', fips: '12059' },
  'FLZ006': { name: 'Washington', fips: '12133' },
  'FLZ007': { name: 'Jackson', fips: '12063' },
  'FLZ008': { name: 'Calhoun', fips: '12013' },
  'FLZ009': { name: 'Gulf', fips: '12045' },
  'FLZ010': { name: 'Bay', fips: '12005' },
  'FLZ011': { name: 'Franklin', fips: '12037' },
  'FLZ012': { name: 'Liberty', fips: '12077' },
  'FLZ013': { name: 'Gadsden', fips: '12039' },
  'FLZ014': { name: 'Leon', fips: '12073' },
  'FLZ015': { name: 'Wakulla', fips: '12129' },
  'FLZ016': { name: 'Jefferson', fips: '12065' },
  'FLZ017': { name: 'Madison', fips: '12079' },
  'FLZ018': { name: 'Taylor', fips: '12123' },
  'FLZ019': { name: 'Hamilton', fips: '12047' },
  'FLZ020': { name: 'Suwannee', fips: '12121' },
  'FLZ021': { name: 'Lafayette', fips: '12067' },
  'FLZ022': { name: 'Dixie', fips: '12029' },
  'FLZ023': { name: 'Gilchrist', fips: '12041' },
  'FLZ024': { name: 'Levy', fips: '12075' },
  'FLZ025': { name: 'Alachua', fips: '12001' },
  'FLZ026': { name: 'Columbia', fips: '12023' },
  'FLZ027': { name: 'Baker', fips: '12003' },
  'FLZ028': { name: 'Nassau', fips: '12089' },
  'FLZ029': { name: 'Duval', fips: '12031' },
  'FLZ030': { name: 'Union', fips: '12125' },
  'FLZ031': { name: 'Bradford', fips: '12007' },
  'FLZ032': { name: 'Clay', fips: '12019' },
  'FLZ033': { name: 'St. Johns', fips: '12109' },
  'FLZ034': { name: 'Putnam', fips: '12107' },
  'FLZ035': { name: 'Flagler', fips: '12035' },
  'FLZ036': { name: 'Marion', fips: '12083' },
  'FLZ037': { name: 'Volusia', fips: '12127' },
  'FLZ038': { name: 'Lake', fips: '12069' },
  'FLZ039': { name: 'Sumter', fips: '12119' },
  'FLZ040': { name: 'Citrus', fips: '12017' },
  'FLZ041': { name: 'Hernando', fips: '12053' },
  'FLZ042': { name: 'Pasco', fips: '12101' },
  'FLZ043': { name: 'Pinellas', fips: '12103' },
  'FLZ044': { name: 'Hillsborough', fips: '12057' },
  'FLZ045': { name: 'Polk', fips: '12105' },
  'FLZ046': { name: 'Hardee', fips: '12049' },
  'FLZ047': { name: 'Manatee', fips: '12081' },
  'FLZ048': { name: 'Sarasota', fips: '12115' },
  'FLZ049': { name: 'DeSoto', fips: '12027' },
  'FLZ050': { name: 'Charlotte', fips: '12015' },
  'FLZ051': { name: 'Lee', fips: '12071' },
  'FLZ052': { name: 'Hendry', fips: '12051' },
  'FLZ053': { name: 'Glades', fips: '12043' },
  'FLZ054': { name: 'Martin', fips: '12085' },
  'FLZ055': { name: 'St. Lucie', fips: '12111' },
  'FLZ056': { name: 'Okeechobee', fips: '12093' },
  'FLZ057': { name: 'Indian River', fips: '12061' },
  'FLZ058': { name: 'Brevard', fips: '12009' },
  'FLZ059': { name: 'Orange', fips: '12095' },
  'FLZ060': { name: 'Osceola', fips: '12097' },
  'FLZ061': { name: 'Seminole', fips: '12117' },
  'FLZ062': { name: 'Palm Beach', fips: '12099' },
  'FLZ063': { name: 'Broward', fips: '12011' },
  'FLZ064': { name: 'Miami-Dade', fips: '12086' },
  'FLZ065': { name: 'Collier', fips: '12021' },
  'FLZ066': { name: 'Monroe', fips: '12087' },
  'FLZ067': { name: 'Highlands', fips: '12055' }
};

/**
 * Fetch active county alerts from NOAA/NWS CAP feeds
 */
export async function fetchCountyAlerts(county: string): Promise<CountyAlert[]> {
  console.log(`[CountyEmAdapter] Fetching alerts for county: ${county}`);
  
  try {
    // NWS CAP alerts endpoint for specific county
    const feedUrl = `https://alerts.weather.gov/cap/wwaatmget.php?x=${county}&y=0`;
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardian.ai)',
        'Accept': 'application/xml, text/xml, */*'
      },
      timeout: 15000, // 15 second timeout
    });
    
    if (!response.ok) {
      console.warn(`[CountyEmAdapter] Failed to fetch alerts for ${county}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const xmlData = await response.text();
    
    if (!xmlData || xmlData.trim().length === 0) {
      console.log(`[CountyEmAdapter] No alert data returned for ${county}`);
      return [];
    }
    
    return parseCapAlerts(xmlData);
    
  } catch (error) {
    console.error(`[CountyEmAdapter] Error fetching alerts for ${county}:`, error);
    return [];
  }
}

/**
 * Parse CAP (Common Alerting Protocol) XML data
 */
function parseCapAlerts(xmlData: string): CountyAlert[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    trimValues: true,
  });
  
  try {
    const feedData = parser.parse(xmlData);
    const alerts: CountyAlert[] = [];
    
    // Handle both ATOM feed and direct CAP alert formats
    if (feedData.feed && feedData.feed.entry) {
      const entries = Array.isArray(feedData.feed.entry) ? feedData.feed.entry : [feedData.feed.entry];
      
      for (const entry of entries) {
        if (entry.content && entry.content["cap:alert"]) {
          const capAlert = entry.content["cap:alert"];
          const info = capAlert.info;
          
          if (info) {
            const alert: CountyAlert = {
              id: capAlert.identifier || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: info.event || entry.title || 'Weather Alert',
              description: info.description || '',
              effective: info.effective || new Date().toISOString(),
              expires: info.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              severity: info.severity?.toLowerCase() || 'moderate',
              urgency: info.urgency?.toLowerCase() || 'expected',
              certainty: info.certainty?.toLowerCase() || 'possible',
              area: info.areaDesc || 'Unknown Area',
              event: info.event || 'Weather Alert',
              headline: info.headline || info.event || 'Weather Alert',
              instructions: info.instruction || undefined,
              web: info.web || capAlert.info?.web || undefined,
              contact: info.contact || undefined,
              parameter: info.parameter || undefined
            };
            
            alerts.push(alert);
          }
        }
      }
    }
    
    // Handle direct CAP alert format
    else if (feedData.alert) {
      const capAlert = Array.isArray(feedData.alert) ? feedData.alert : [feedData.alert];
      
      for (const alert of capAlert) {
        if (alert.info) {
          const info = alert.info;
          
          const parsedAlert: CountyAlert = {
            id: alert.identifier || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: info.event || 'Weather Alert',
            description: info.description || '',
            effective: info.effective || new Date().toISOString(),
            expires: info.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            severity: info.severity?.toLowerCase() || 'moderate',
            urgency: info.urgency?.toLowerCase() || 'expected',
            certainty: info.certainty?.toLowerCase() || 'possible',
            area: info.areaDesc || 'Unknown Area',
            event: info.event || 'Weather Alert',
            headline: info.headline || info.event || 'Weather Alert',
            instructions: info.instruction || undefined,
            web: info.web || undefined,
            contact: info.contact || undefined,
            parameter: info.parameter || undefined
          };
          
          alerts.push(parsedAlert);
        }
      }
    }
    
    console.log(`[CountyEmAdapter] Parsed ${alerts.length} alerts from CAP data`);
    return alerts;
    
  } catch (error) {
    console.error('[CountyEmAdapter] Error parsing CAP XML data:', error);
    return [];
  }
}

/**
 * Fetch additional Florida-specific emergency data
 */
export async function fetchFloridaStateAlerts(): Promise<CountyAlert[]> {
  console.log('[CountyEmAdapter] Fetching Florida state-level alerts...');
  
  try {
    // Florida Division of Emergency Management feeds
    const sources = [
      'https://alerts.weather.gov/cap/fl.php?x=1', // Florida statewide alerts
      'https://www.floridadisaster.org/rss/news.xml', // FDEM news/alerts
    ];
    
    const allAlerts: CountyAlert[] = [];
    
    for (const sourceUrl of sources) {
      try {
        const response = await fetch(sourceUrl, {
          headers: {
            'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardian.ai)',
            'Accept': 'application/xml, text/xml, application/rss+xml, */*'
          },
          timeout: 15000,
        });
        
        if (response.ok) {
          const xmlData = await response.text();
          const alerts = parseCapAlerts(xmlData);
          allAlerts.push(...alerts);
          console.log(`[CountyEmAdapter] Retrieved ${alerts.length} alerts from ${sourceUrl}`);
        }
      } catch (sourceError) {
        console.warn(`[CountyEmAdapter] Failed to fetch from ${sourceUrl}:`, sourceError);
        continue;
      }
    }
    
    return allAlerts;
    
  } catch (error) {
    console.error('[CountyEmAdapter] Error fetching Florida state alerts:', error);
    return [];
  }
}

/**
 * Convert county alerts to EmergencyAlertIntelligence format
 */
export function convertToEmergencyIntelligence(
  county: string, 
  alerts: CountyAlert[]
): EmergencyAlertIntelligence {
  const countyInfo = FLORIDA_COUNTIES[county] || { name: county, fips: county };
  
  // Map severity levels for risk assessment
  const severityRisk: Record<string, string> = {
    'minor': 'low',
    'moderate': 'moderate', 
    'severe': 'high',
    'extreme': 'extreme'
  };
  
  // Calculate overall risk level
  let overallRisk = 'minimal';
  const immediateThreats: string[] = [];
  const potentialImpacts: string[] = [];
  
  for (const alert of alerts) {
    const risk = severityRisk[alert.severity] || 'low';
    if (risk === 'extreme' || risk === 'high') {
      overallRisk = risk;
      immediateThreats.push(alert.event);
    } else if (risk === 'moderate' && overallRisk === 'minimal') {
      overallRisk = 'low';
    }
    
    if (alert.instructions) {
      potentialImpacts.push(`${alert.event}: ${alert.instructions.substring(0, 100)}...`);
    }
  }
  
  const convertedAlerts = alerts.map(alert => ({
    id: alert.id,
    type: alert.event,
    severity: alert.severity,
    urgency: alert.urgency,
    title: alert.headline || alert.title,
    description: alert.description,
    areaDescription: alert.area,
    effective: alert.effective,
    expires: alert.expires,
    directThreat: ['severe', 'extreme'].includes(alert.severity),
    insuranceRelevance: determineInsuranceRelevance(alert),
    recommendedActions: generateRecommendedActions(alert)
  }));
  
  return {
    countyCode: county,
    countyName: countyInfo.name,
    alertStatus: alerts.length > 0 ? 'active' : 'normal',
    totalActiveAlerts: alerts.length,
    activeAlerts: convertedAlerts,
    riskAssessment: {
      overallRisk,
      immediateThreats: [...new Set(immediateThreats)],
      potentialImpacts: [...new Set(potentialImpacts)]
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Determine insurance relevance based on alert type
 */
function determineInsuranceRelevance(alert: CountyAlert): string {
  const highRelevanceEvents = [
    'hurricane', 'tropical storm', 'flood', 'tornado', 'severe thunderstorm',
    'hail', 'wind', 'fire', 'wildfire', 'freeze'
  ];
  
  const eventLower = alert.event.toLowerCase();
  const descLower = alert.description.toLowerCase();
  
  for (const event of highRelevanceEvents) {
    if (eventLower.includes(event) || descLower.includes(event)) {
      return 'high';
    }
  }
  
  // Medium relevance for weather events that could cause property damage
  if (eventLower.includes('weather') || eventLower.includes('storm') || 
      eventLower.includes('warning') || alert.severity === 'severe') {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate recommended actions based on alert type and severity
 */
function generateRecommendedActions(alert: CountyAlert): string[] {
  const actions: string[] = [];
  
  if (alert.instructions) {
    // Parse instructions for action items
    const instructions = alert.instructions.toLowerCase();
    
    if (instructions.includes('evacuate') || instructions.includes('evacuation')) {
      actions.push('Consider evacuation if in affected area');
    }
    
    if (instructions.includes('secure') || instructions.includes('protection')) {
      actions.push('Secure outdoor items and property');
    }
    
    if (instructions.includes('document') || instructions.includes('photo')) {
      actions.push('Document property condition before event');
    }
  }
  
  // Default actions based on event type
  const eventLower = alert.event.toLowerCase();
  
  if (eventLower.includes('hurricane') || eventLower.includes('tropical')) {
    actions.push('Review insurance policies and coverage limits');
    actions.push('Prepare emergency kit and important documents');
    actions.push('Consider temporary relocation if in evacuation zone');
  } else if (eventLower.includes('flood')) {
    actions.push('Move vehicles and belongings to higher ground');
    actions.push('Check flood insurance coverage');
    actions.push('Avoid flooded roadways');
  } else if (eventLower.includes('tornado')) {
    actions.push('Identify safe room or shelter area');
    actions.push('Monitor weather radio for updates');
    actions.push('Review insurance wind/hail coverage');
  } else if (eventLower.includes('fire') || eventLower.includes('wildfire')) {
    actions.push('Prepare for possible evacuation');
    actions.push('Clear vegetation near structures');
    actions.push('Review fire insurance coverage');
  }
  
  // Default emergency actions
  if (actions.length === 0) {
    actions.push('Stay informed through official channels');
    actions.push('Review emergency preparedness plan');
  }
  
  return actions;
}

/**
 * Main integration function to replace mock emergency data
 * Use this in the emergency-alert-intelligence function
 */
export async function getEmergencyIntelligence(
  location: { county?: string; zip?: string }
): Promise<EmergencyAlertIntelligence> {
  console.log('[CountyEmAdapter] Getting emergency intelligence for:', location);
  
  // Determine county code from location
  let countyCode = location.county || 'FLZ052'; // Default to central FL
  
  // If we have a ZIP code, try to map it to a county code
  if (location.zip && !location.county) {
    countyCode = await mapZipToCounty(location.zip);
  }
  
  try {
    // Fetch both county-specific and state-wide alerts
    const [countyAlerts, stateAlerts] = await Promise.all([
      fetchCountyAlerts(countyCode),
      fetchFloridaStateAlerts()
    ]);
    
    // Combine and deduplicate alerts
    const allAlerts = [...countyAlerts, ...stateAlerts];
    const uniqueAlerts = deduplicateAlerts(allAlerts);
    
    console.log(`[CountyEmAdapter] Retrieved ${uniqueAlerts.length} total alerts for ${countyCode}`);
    
    return convertToEmergencyIntelligence(countyCode, uniqueAlerts);
    
  } catch (error) {
    console.error('[CountyEmAdapter] Error getting emergency intelligence:', error);
    
    // Return minimal data structure on error
    const countyInfo = FLORIDA_COUNTIES[countyCode] || { name: countyCode, fips: countyCode };
    
    return {
      countyCode,
      countyName: countyInfo.name,
      alertStatus: 'unknown',
      totalActiveAlerts: 0,
      activeAlerts: [],
      riskAssessment: {
        overallRisk: 'minimal',
        immediateThreats: [],
        potentialImpacts: []
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Map ZIP code to Florida county zone (simplified mapping)
 */
async function mapZipToCounty(zipCode: string): Promise<string> {
  // This is a simplified mapping - in production you'd use a comprehensive ZIP->County database
  const zipCountyMap: Record<string, string> = {
    '33948': 'FLZ050', // Charlotte County
    '33901': 'FLZ051', // Lee County
    '34102': 'FLZ065', // Collier County
    '32801': 'FLZ059', // Orange County
    '33101': 'FLZ064', // Miami-Dade County
    '33401': 'FLZ062', // Palm Beach County
    '33301': 'FLZ063', // Broward County
    '32201': 'FLZ029', // Duval County
    '33602': 'FLZ044', // Hillsborough County
    '33701': 'FLZ043', // Pinellas County
    // Add more ZIP mappings as needed
  };
  
  return zipCountyMap[zipCode] || 'FLZ052'; // Default to central FL
}

/**
 * Remove duplicate alerts based on ID and event type
 */
function deduplicateAlerts(alerts: CountyAlert[]): CountyAlert[] {
  const seen = new Set<string>();
  const unique: CountyAlert[] = [];
  
  for (const alert of alerts) {
    const key = `${alert.id}_${alert.event}_${alert.effective}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(alert);
    }
  }
  
  return unique;
}

export default {
  fetchCountyAlerts,
  fetchFloridaStateAlerts,
  convertToEmergencyIntelligence,
  getEmergencyIntelligence,
  FLORIDA_COUNTIES
};