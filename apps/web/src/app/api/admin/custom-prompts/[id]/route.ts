/**
 * @fileMetadata
 * @purpose "Individual Custom Prompt API endpoints for admin panel"
 * @dependencies ["@/lib","@/types","@claimguardian/db","next"]
 * @owner ai-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateCustomPromptRequest } from '@/types/ai-operations'
// PATCH /api/admin/custom-prompts/[id] - Update custom prompt
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: promptId } = await params
    const body: UpdateCustomPromptRequest = await request.json()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', success: false },
        { status: 403 }
      )
    }

    // Validate system prompt length if provided
    if (body.system_prompt && body.system_prompt.length < 10) {
      return NextResponse.json(
        { error: 'System prompt must be at least 10 characters', success: false },
        { status: 400 }
      )
    }

    // If activating a prompt, deactivate others for the same feature
    if (body.is_active === true) {
      // First get the current prompt to know its feature_id
      const { data: currentPrompt } = await supabase
        .from('ai_custom_prompts')
        .select('feature_id')
        .eq('id', promptId)
        .single()

      if (currentPrompt) {
        // Deactivate other active prompts for this feature
        await supabase
          .from('ai_custom_prompts')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('feature_id', currentPrompt.feature_id)
          .eq('is_active', true)
          .neq('id', promptId)
      }
    }

    // Update custom prompt
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (body.name) updateData.name = body.name
    if (body.system_prompt) updateData.system_prompt = body.system_prompt
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active

    const { data: updatedPrompt, error: updateError } = await supabase
      .from('ai_custom_prompts')
      .update(updateData)
      .eq('id', promptId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating custom prompt:', updateError)
      return NextResponse.json(
        { error: 'Failed to update custom prompt', success: false },
        { status: 500 }
      )
    }

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Custom prompt not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: updatedPrompt,
      success: true
    })

  } catch (error) {
    console.error('Custom Prompt PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/custom-prompts/[id] - Delete custom prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: promptId } = await params

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', success: false },
        { status: 403 }
      )
    }

    // Delete custom prompt (cascade will delete performance data)
    const { error: deleteError } = await supabase
      .from('ai_custom_prompts')
      .delete()
      .eq('id', promptId)

    if (deleteError) {
      console.error('Error deleting custom prompt:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete custom prompt', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Custom prompt deleted successfully' },
      success: true
    })

  } catch (error) {
    console.error('Custom Prompt DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}