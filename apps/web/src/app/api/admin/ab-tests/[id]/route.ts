/**
 * @fileMetadata
 * @purpose Individual A/B Test API endpoints for admin panel
 * @owner ai-team
 * @status active
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UpdateABTestRequest } from '@/types/ai-operations'

// GET /api/admin/ab-tests/[id] - Get specific A/B test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const testId = params.id

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

    // Get A/B test
    const { data: test, error: testError } = await supabase
      .from('ai_ab_tests')
      .select('*')
      .eq('id', testId)
      .single()

    if (testError || !test) {
      return NextResponse.json(
        { error: 'A/B test not found', success: false },
        { status: 404 }
      )
    }

    // Get test results
    const { data: results, error: resultsError } = await supabase
      .from('ai_ab_test_results')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: false })

    if (resultsError) {
      console.error('Error fetching test results:', resultsError)
    }

    return NextResponse.json({
      data: {
        test,
        results: results || []
      },
      success: true
    })

  } catch (error) {
    console.error('A/B Test GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/ab-tests/[id] - Update A/B test
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const testId = params.id
    const body: UpdateABTestRequest = await request.json()

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

    // Validate traffic split if provided
    if (body.traffic_split && (body.traffic_split < 10 || body.traffic_split > 90)) {
      return NextResponse.json(
        { error: 'Traffic split must be between 10 and 90', success: false },
        { status: 400 }
      )
    }

    // Update A/B test
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name) updateData.name = body.name
    if (body.status) updateData.status = body.status
    if (body.traffic_split) updateData.traffic_split = body.traffic_split
    if (body.end_date) updateData.end_date = body.end_date

    const { data: updatedTest, error: updateError } = await supabase
      .from('ai_ab_tests')
      .update(updateData)
      .eq('id', testId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating A/B test:', updateError)
      return NextResponse.json(
        { error: 'Failed to update A/B test', success: false },
        { status: 500 }
      )
    }

    if (!updatedTest) {
      return NextResponse.json(
        { error: 'A/B test not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: updatedTest,
      success: true
    })

  } catch (error) {
    console.error('A/B Test PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ab-tests/[id] - Delete A/B test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const testId = params.id

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

    // Delete A/B test (cascade will delete results)
    const { error: deleteError } = await supabase
      .from('ai_ab_tests')
      .delete()
      .eq('id', testId)

    if (deleteError) {
      console.error('Error deleting A/B test:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete A/B test', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'A/B test deleted successfully' },
      success: true
    })

  } catch (error) {
    console.error('A/B Test DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}