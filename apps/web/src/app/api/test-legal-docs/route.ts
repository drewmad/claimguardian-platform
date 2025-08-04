import { NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'
import { logger } from "@/lib/logger/production-logger"

export async function GET() {
  try {
    logger.info('Testing legal documents access...')
    
    const supabase = await createClient()
    
    // Test the exact same query that's failing
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('is_active', true)
      .eq('requires_acceptance', true)
      .order('type')
    
    if (error) {
      logger.error('Query error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    
    logger.info('Found documents:', data?.length)
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      documents: data?.map(d => ({ id: d.id, type: d.type, title: d.title }))
    })
  } catch (err) {
    logger.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}