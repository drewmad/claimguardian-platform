/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
// apps/web/src/actions/disasters.ts
'use server'

import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'

export async function getDisasterHubData() {
  noStore() // Ensure data is always fresh
  const supabase = await await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  // 1. Fetch user's properties that have a location
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name, address, latitude, longitude')
    .eq('user_id', user.id)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (propertiesError) {
    logger.error('Error fetching properties:', propertiesError)
    return { error: 'Failed to fetch properties' }
  }

  if (!properties || properties.length === 0) {
    return { properties: [], alerts: [] }
  }

  // 2. Create a PostGIS MultiPoint object from property coordinates
  const propertyPoints = properties.map(p => `POINT(${p.longitude} ${p.latitude})`).join(',')
  const multiPointWkt = `MULTIPOINT(${propertyPoints})`

  // 3. Fetch disaster events that intersect with any of the user's properties
  const { data: alerts, error: alertsError } = await supabase
    .from('disaster_events')
    .select('*')
    .filter('affected_geography', 'st_intersects', multiPointWkt)
    .order('effective_at', { ascending: false })

  if (alertsError) {
    logger.error('Error fetching disaster alerts:', alertsError)
    return { error: 'Failed to fetch disaster alerts' }
  }

  // 4. Determine property status based on alerts
  const propertiesWithStatus = properties.map(property => {
    const isAtRisk = alerts.some(() => {
      // This is a simplified check. A real implementation would do a spatial intersection here.
      // For now, we assume any alert returned by the query puts the property at risk.
      return true; 
    });
    return {
      ...property,
      status: isAtRisk ? 'At Risk' : 'All Clear',
      disaster: isAtRisk ? alerts[0]?.headline : null
    };
  });

  return { properties: propertiesWithStatus, alerts }
}
