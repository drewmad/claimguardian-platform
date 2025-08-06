/**
 * @fileMetadata
 * @purpose "NIMS Resources API endpoint for resource management"
 * @dependencies ["@/lib/nims/resource-management", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nimsResourceManager, ResourceCategory, ResourceStatus } from '@/lib/nims/resource-management'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const category = searchParams.get('category') as ResourceCategory
    const status = searchParams.get('status') as ResourceStatus
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')
    const capabilities = searchParams.get('capabilities')?.split(',')
    
    const criteria: any = {}
    
    if (type) criteria.type = type
    if (category) criteria.category = category
    if (status) criteria.status = status
    if (capabilities) criteria.capabilities = capabilities
    if (lat && lng && radius) {
      criteria.location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseFloat(radius)
      }
    }
    
    const resources = await nimsResourceManager.searchResources(criteria)
    
    return NextResponse.json({
      resources,
      total: resources.length
    })
  } catch (error) {
    console.error('Failed to search resources:', error)
    return NextResponse.json({ error: 'Failed to search resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, category' },
        { status: 400 }
      )
    }
    
    const resource = await nimsResourceManager.registerResource(body)
    
    return NextResponse.json({
      resource,
      message: 'Resource registered successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to register resource:', error)
    return NextResponse.json({ error: 'Failed to register resource' }, { status: 500 })
  }
}