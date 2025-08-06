import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MaintenanceRequest {
  property_id: string
  scan_type?: 'quick' | 'comprehensive'
}

interface SystemHealth {
  system: string
  health: number
  trend: 'improving' | 'stable' | 'declining'
  lastMaintenance: string
  nextScheduled: string
}

interface MaintenanceAlert {
  id: string
  system: string
  component: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  predictedFailure: string
  currentCondition: number
  estimatedCost: number
  preventiveCost: number
  recommendation: string
  lastInspection?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property_id, scan_type = 'quick' } = await req.json() as MaintenanceRequest

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get property details
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError) {
      throw new Error(`Property not found: ${propertyError.message}`)
    }

    // Generate AI-powered predictions based on property data
    const predictions = await generateMaintenancePredictions(property, scan_type)

    // Store predictions in database
    if (predictions.alerts.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('maintenance_predictions')
        .insert({
          property_id,
          predictions: predictions.alerts,
          scan_type,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error storing predictions:', insertError)
      }
    }

    return new Response(
      JSON.stringify(predictions),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateMaintenancePredictions(property: any, scanType: string) {
  // Calculate property age and factors
  const propertyAge = property.year_built ? new Date().getFullYear() - property.year_built : 20
  const isCoastal = property.county?.includes('Beach') || property.county?.includes('Coast')
  const hasHurricaneRisk = isCoastal || ['Miami-Dade', 'Broward', 'Palm Beach'].includes(property.county)
  
  const alerts: MaintenanceAlert[] = []
  const systemHealth: SystemHealth[] = []
  
  // HVAC System Analysis
  const hvacAge = property.details?.hvac_year || property.year_built
  const hvacYears = hvacAge ? new Date().getFullYear() - hvacAge : 15
  
  if (hvacYears > 10) {
    const hvacHealth = Math.max(20, 100 - (hvacYears * 5))
    
    systemHealth.push({
      system: 'HVAC',
      health: hvacHealth,
      trend: hvacYears > 12 ? 'declining' : 'stable',
      lastMaintenance: '6 months ago',
      nextScheduled: hvacHealth < 40 ? 'ASAP' : '3 months'
    })
    
    if (hvacHealth < 40) {
      alerts.push({
        id: `hvac-${Date.now()}`,
        system: 'HVAC',
        component: isCoastal ? 'AC Compressor (Salt Corrosion)' : 'AC Compressor',
        urgency: hvacHealth < 30 ? 'critical' : 'high',
        predictedFailure: new Date(Date.now() + (hvacHealth * 24 * 60 * 60 * 1000)).toISOString(),
        currentCondition: hvacHealth,
        estimatedCost: isCoastal ? 5500 : 4500,
        preventiveCost: 450,
        recommendation: 'Schedule preventive maintenance to avoid complete failure',
        lastInspection: '11 months ago'
      })
    }
  } else {
    systemHealth.push({
      system: 'HVAC',
      health: 85,
      trend: 'stable',
      lastMaintenance: '3 months ago',
      nextScheduled: 'Annual'
    })
  }
  
  // Roof Analysis
  const roofAge = property.details?.roof_year || property.year_built
  const roofYears = roofAge ? new Date().getFullYear() - roofAge : 15
  
  if (roofYears > 15 || hasHurricaneRisk) {
    const roofHealth = Math.max(30, 100 - (roofYears * 3) - (hasHurricaneRisk ? 10 : 0))
    
    systemHealth.push({
      system: 'Roof',
      health: roofHealth,
      trend: roofYears > 18 ? 'declining' : 'stable',
      lastMaintenance: '1 year ago',
      nextScheduled: roofHealth < 50 ? 'Before hurricane season' : 'Annual inspection'
    })
    
    if (roofHealth < 60) {
      alerts.push({
        id: `roof-${Date.now()}`,
        system: 'Roof',
        component: hasHurricaneRisk ? 'Hurricane Straps & Shingles' : 'Shingles',
        urgency: roofHealth < 40 ? 'high' : 'medium',
        predictedFailure: new Date(Date.now() + (roofHealth * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        currentCondition: roofHealth,
        estimatedCost: hasHurricaneRisk ? 12000 : 8000,
        preventiveCost: 1500,
        recommendation: hasHurricaneRisk 
          ? 'Reinforce before hurricane season' 
          : 'Replace damaged sections',
        lastInspection: '6 months ago'
      })
    }
  } else {
    systemHealth.push({
      system: 'Roof',
      health: 90,
      trend: 'stable',
      lastMaintenance: '6 months ago',
      nextScheduled: 'Annual'
    })
  }
  
  // Plumbing Analysis
  const plumbingHealth = Math.max(40, 100 - (propertyAge * 2))
  systemHealth.push({
    system: 'Plumbing',
    health: plumbingHealth,
    trend: propertyAge > 25 ? 'declining' : 'stable',
    lastMaintenance: '2 months ago',
    nextScheduled: plumbingHealth < 60 ? '6 months' : 'Annual'
  })
  
  if (plumbingHealth < 60 && scanType === 'comprehensive') {
    alerts.push({
      id: `plumbing-${Date.now()}`,
      system: 'Plumbing',
      component: isCoastal ? 'Water Heater (Corrosion Risk)' : 'Water Heater',
      urgency: 'low',
      predictedFailure: new Date(Date.now() + (180 * 24 * 60 * 60 * 1000)).toISOString(),
      currentCondition: plumbingHealth,
      estimatedCost: 2200,
      preventiveCost: 250,
      recommendation: 'Annual flush and anode rod inspection',
      lastInspection: '1 year ago'
    })
  }
  
  // Electrical Analysis
  const electricalHealth = Math.max(50, 100 - (propertyAge * 1.5))
  systemHealth.push({
    system: 'Electrical',
    health: electricalHealth,
    trend: propertyAge > 30 ? 'declining' : 'stable',
    lastMaintenance: '18 months ago',
    nextScheduled: electricalHealth < 60 ? 'URGENT' : 'Biannual'
  })
  
  // Foundation (Florida specific - settling and moisture)
  const foundationHealth = Math.max(70, 100 - (propertyAge * 0.5) - (isCoastal ? 10 : 0))
  systemHealth.push({
    system: 'Foundation',
    health: foundationHealth,
    trend: isCoastal ? 'declining' : 'stable',
    lastMaintenance: '1 year ago',
    nextScheduled: 'Annual check'
  })
  
  // Windows (Hurricane Impact)
  if (hasHurricaneRisk) {
    const windowHealth = property.details?.impact_windows ? 95 : 60
    systemHealth.push({
      system: 'Windows',
      health: windowHealth,
      trend: 'stable',
      lastMaintenance: '3 months ago',
      nextScheduled: property.details?.impact_windows ? 'Annual' : 'Upgrade recommended'
    })
    
    if (!property.details?.impact_windows && scanType === 'comprehensive') {
      alerts.push({
        id: `windows-${Date.now()}`,
        system: 'Windows',
        component: 'Non-Impact Windows',
        urgency: 'medium',
        predictedFailure: 'Next major hurricane',
        currentCondition: 60,
        estimatedCost: 15000,
        preventiveCost: 8000,
        recommendation: 'Upgrade to impact-resistant windows for insurance discount',
        lastInspection: '3 months ago'
      })
    }
  }
  
  // Calculate timeline data
  const timeline = generateMaintenanceTimeline(alerts, systemHealth)
  
  // Risk assessment matrix
  const riskMatrix = systemHealth.map(system => ({
    category: system.system,
    current: 100 - system.health,
    predicted: Math.min(100, (100 - system.health) * 1.3),
    optimal: 15
  }))
  
  return {
    alerts,
    systemHealth,
    timeline,
    riskMatrix,
    history: [], // Would be populated from historical data
    predictions: {
      totalSavings: alerts.reduce((sum, a) => sum + (a.estimatedCost - a.preventiveCost), 0),
      urgentCount: alerts.filter(a => a.urgency === 'critical' || a.urgency === 'high').length,
      nextMaintenance: alerts[0]?.recommendation || 'No immediate action required'
    }
  }
}

function generateMaintenanceTimeline(alerts: MaintenanceAlert[], health: SystemHealth[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const currentMonth = new Date().getMonth()
  
  return months.map((month, index) => {
    const monthIndex = (currentMonth + index) % 12
    const hasPreventive = index % 2 === 0
    const hasRepair = index === 3 // Simulate one repair
    
    return {
      month,
      preventive: hasPreventive ? Math.floor(Math.random() * 300) + 200 : 0,
      repairs: hasRepair ? Math.floor(Math.random() * 1000) + 500 : 0,
      saved: hasPreventive && !hasRepair ? Math.floor(Math.random() * 3000) + 1000 : 0
    }
  })
}