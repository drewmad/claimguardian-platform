/**
 * @fileMetadata
 * @purpose "NIMS Emergency Alerts API endpoint for CAP-compliant alert distribution"
 * @dependencies ["@/lib/nims/emergency-communications", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emergencyCommunicationManager, MessagePriority } from '@/lib/nims/emergency-communications'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('emergency_alerts')
      .select(`
        id,
        alert_id,
        sender_id,
        title,
        message,
        priority,
        category,
        urgency,
        severity,
        certainty,
        status,
        effective_date,
        expiration_date,
        delivery_receipts,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({
      alerts: data,
      total: data.length
    })
  } catch (error) {
    console.error('NIMS alerts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.sender_id || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: sender_id, title, message' },
        { status: 400 }
      )
    }

    // Create alert using emergency communication manager
    const alert = await emergencyCommunicationManager.createEmergencyAlert(body)

    // Auto-distribute if requested
    if (body.auto_distribute) {
      try {
        await emergencyCommunicationManager.distributeAlert(alert.id)
      } catch (distributionError) {
        console.warn('Failed to auto-distribute alert:', distributionError)
        // Don't fail alert creation if distribution fails
      }
    }

    return NextResponse.json({
      alert,
      message: 'Emergency alert created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
