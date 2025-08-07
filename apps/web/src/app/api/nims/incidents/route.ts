/**
 * @fileMetadata
 * @purpose "NIMS ICS Incidents API endpoint for emergency management"
 * @dependencies ["@/lib/nims/ics-integration", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { icsIntegrationService } from '@/lib/nims/ics-integration'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('ics_incidents')
      .select(`
        id,
        incident_number,
        incident_name,
        incident_type,
        complexity_level,
        location,
        status,
        start_date,
        end_date,
        objectives,
        organization,
        operational_period,
        weather,
        created_by,
        last_updated
      `)
      .order('start_date', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('incident_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch incidents:', error)
      return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
    }

    return NextResponse.json({
      incidents: data,
      total: data.length
    })
  } catch (error) {
    console.error('NIMS incidents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.incident_name || !body.incident_type || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields: incident_name, incident_type, location' },
        { status: 400 }
      )
    }

    // Create incident using ICS integration service
    const incident = await icsIntegrationService.createIncident(body)

    // Auto-generate ICS-201 form for new incidents
    try {
      await icsIntegrationService.generateICS201(incident.id)
    } catch (formError) {
      console.warn('Failed to generate ICS-201:', formError)
      // Don't fail incident creation if form generation fails
    }

    return NextResponse.json({
      incident,
      message: 'Incident created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create incident:', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
