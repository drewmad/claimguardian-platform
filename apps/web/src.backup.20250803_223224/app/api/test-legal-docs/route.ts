import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('Testing legal documents access...')
    
    const supabase = await createClient()
    
    // Test the exact same query that's failing
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('is_active', true)
      .eq('requires_acceptance', true)
      .order('type')
    
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    
    console.log('Found documents:', data?.length)
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      documents: data?.map(d => ({ id: d.id, type: d.type, title: d.title }))
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}