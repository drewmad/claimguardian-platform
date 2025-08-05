/**
 * @fileMetadata
 * @purpose "Claims API with rate limiting and tier-based access control"
 * @dependencies ["@/lib","next"]
 * @owner api-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAPIMiddleware, APIContext } from '@/lib/api/api-middleware'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/claims - List claims for authenticated user
 */
export const GET = withAPIMiddleware(async (request: NextRequest, context: APIContext) => {
  try {
    const supabase = await createClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const propertyId = searchParams.get('property_id')

    // Build query with property join
    let query = supabase
      .from('claims')
      .select(`
        *,
        properties (
          id,
          name,
          street_address,
          city,
          state
        )
      `)
      .eq('user_id', context.userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Add filters
    if (status) {
      query = query.eq('status', status)
    }
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: claims, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', context.userId)

    if (status) countQuery = countQuery.eq('status', status)
    if (propertyId) countQuery = countQuery.eq('property_id', propertyId)

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json(
        { error: 'Database Error', message: countError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: claims,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Claims API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/claims - Create a new claim
 */
export const POST = withAPIMiddleware(async (request: NextRequest, context: APIContext) => {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['property_id', 'damage_type', 'date_of_loss', 'description']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', body.property_id)
      .eq('user_id', context.userId)
      .single()

    if (propError || !property) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Property not found or access denied' },
        { status: 403 }
      )
    }

    // Generate claim number
    const claimNumber = `CG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create claim
    const { data: claim, error } = await supabase
      .from('claims')
      .insert({
        ...body,
        user_id: context.userId,
        claim_number: claimNumber,
        status: 'draft'
      })
      .select(`
        *,
        properties (
          id,
          name,
          street_address,
          city,
          state
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: claim },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create claim API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})