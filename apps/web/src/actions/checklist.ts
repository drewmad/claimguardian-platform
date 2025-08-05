/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
// apps/web/src/actions/checklist.ts
'use server'

import { revalidatePath } from 'next/cache'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'

export async function updateUserChecklist({ itemId, completed }: { itemId: string, completed: boolean }) {
  const supabase = await await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_checklist_progress')
    .upsert(
      { user_id: user.id, item_id: itemId, completed },
      { onConflict: 'user_id, item_id' }
    )
    .select()

  if (error) {
    logger.error('Error updating checklist progress:', error)
    return { error: 'Failed to save progress' }
  }

  // Revalidate the disaster hub page to show the updated state
  revalidatePath('/dashboard/disaster')

  return { data }
}

export async function getChecklistProgress() {
  const supabase = await await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_checklist_progress')
    .select('item_id, completed')
    .eq('user_id', user.id)

  if (error) {
    logger.error('Error fetching checklist progress:', error)
    return { error: 'Failed to fetch progress' }
  }

  return { data }
}
