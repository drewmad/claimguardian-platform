'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserCreationLogs(email?: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Not authenticated')
    }
    
    let query = supabase
      .from('debug_user_creation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    // If email provided, try to find logs for that user
    if (email) {
      // First get the user ID from auth.users
      const { data: authUsers } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .limit(1)
      
      if (authUsers && authUsers.length > 0) {
        query = query.eq('user_id', authUsers[0].id)
      }
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user creation logs:', error)
    return { data: null, error: error as Error }
  }
}

export async function getRecentSignupAttempts() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Not authenticated')
    }
    
    // Get recent logs from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('debug_user_creation_logs')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching recent signup attempts:', error)
    return { data: null, error: error as Error }
  }
}