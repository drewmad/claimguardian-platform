'use server'

import { createClient } from '@/lib/supabase/server'

export async function createDemoProperty() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Not authenticated')
    }
    
    // Call the database function to create a demo property
    const { data, error } = await supabase.rpc('create_demo_property', {
      user_uuid: user.id
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error creating demo property:', error)
    return { data: null, error: error as Error }
  }
}