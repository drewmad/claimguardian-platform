/**
 * @fileMetadata
 * @purpose "NIMS Alert Distribution API endpoint"
 * @dependencies ["@/lib/nims/emergency-communications", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { emergencyCommunicationManager } from '@/lib/nims/emergency-communications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await emergencyCommunicationManager.distributeAlert(id)
    
    return NextResponse.json({
      message: 'Alert distributed successfully'
    })
  } catch (error) {
    console.error('Failed to distribute alert:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    
    if (error instanceof Error && error.message.includes('cannot be distributed')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to distribute alert' }, { status: 500 })
  }
}