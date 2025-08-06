import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userId: string
  type: 'deadline' | 'reminder' | 'alert' | 'milestone' | 'achievement'
  urgency: number // 1-10
  subject: string
  body: string
  metadata?: Record<string, any>
  channels?: string[]
}

interface UserEngagementPattern {
  bestHours: number[]
  bestDays: string[]
  responseRates: Record<string, number>
  averageOpenTime: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId, type, urgency, subject, body, metadata, channels } = await req.json() as NotificationRequest

    // Get user preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefError) {
      console.error('Error fetching preferences:', prefError)
    }

    // Calculate optimal send time using ML-based engagement patterns
    const optimalTime = await calculateOptimalSendTime(
      supabaseClient,
      userId,
      urgency,
      preferences?.engagement_pattern
    )

    // Determine which channels to use
    const selectedChannels = determineChannels(
      channels || ['email', 'in_app'],
      preferences,
      urgency
    )

    // Create notification record
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        urgency,
        subject,
        body,
        metadata,
        channels: selectedChannels,
        scheduled_for: urgency >= 9 ? new Date().toISOString() : optimalTime,
        optimal_send_time: optimalTime,
        status: urgency >= 9 ? 'pending' : 'scheduled'
      })
      .select()
      .single()

    if (notifError) {
      throw new Error(`Failed to create notification: ${notifError.message}`)
    }

    // If high urgency, send immediately
    if (urgency >= 9) {
      await sendNotification(supabaseClient, notification)
    }

    // Update engagement patterns based on historical data
    if (preferences) {
      await updateEngagementPatterns(supabaseClient, userId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification,
        scheduledFor: optimalTime,
        channels: selectedChannels
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in smart notification engine:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function calculateOptimalSendTime(
  supabase: any,
  userId: string,
  urgency: number,
  engagementPattern?: any
): Promise<string> {
  // High urgency = send immediately
  if (urgency >= 9) {
    return new Date().toISOString()
  }

  // Get historical engagement data
  const { data: history } = await supabase
    .from('notifications')
    .select('sent_at, read_at, delivered_at')
    .eq('user_id', userId)
    .not('read_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!history || history.length < 10) {
    // Default to 10 AM next day for new users
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    return tomorrow.toISOString()
  }

  // Analyze engagement patterns
  const hourEngagement: Record<number, number> = {}
  const dayEngagement: Record<string, number> = {}

  history.forEach((notif: any) => {
    const readTime = new Date(notif.read_at)
    const sentTime = new Date(notif.sent_at)
    const responseTime = (readTime.getTime() - sentTime.getTime()) / 1000 / 60 // minutes

    const hour = readTime.getHours()
    const day = readTime.toLocaleDateString('en-US', { weekday: 'short' })

    hourEngagement[hour] = (hourEngagement[hour] || 0) + (responseTime < 60 ? 1 : 0.5)
    dayEngagement[day] = (dayEngagement[day] || 0) + 1
  })

  // Find best hour
  const bestHour = Object.entries(hourEngagement)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '10'

  // Calculate next optimal time
  const optimalTime = new Date()
  
  // Medium urgency (5-8): within 24 hours
  if (urgency >= 5) {
    optimalTime.setDate(optimalTime.getDate() + 1)
  } 
  // Low urgency (1-4): within 48-72 hours
  else {
    optimalTime.setDate(optimalTime.getDate() + 2)
  }

  optimalTime.setHours(parseInt(bestHour), 0, 0, 0)

  // Store learned pattern
  await supabase
    .from('notification_preferences')
    .update({
      engagement_pattern: {
        bestHours: [parseInt(bestHour)],
        hourEngagement,
        dayEngagement,
        lastAnalyzed: new Date().toISOString()
      }
    })
    .eq('user_id', userId)

  return optimalTime.toISOString()
}

function determineChannels(
  requestedChannels: string[],
  preferences: any,
  urgency: number
): string[] {
  if (!preferences) {
    return urgency >= 7 ? ['email', 'in_app'] : ['in_app']
  }

  const enabledChannels = []
  
  if (preferences.email_enabled && requestedChannels.includes('email')) {
    enabledChannels.push('email')
  }
  if (preferences.sms_enabled && requestedChannels.includes('sms') && urgency >= 7) {
    enabledChannels.push('sms')
  }
  if (preferences.push_enabled && requestedChannels.includes('push')) {
    enabledChannels.push('push')
  }
  if (preferences.in_app_enabled && requestedChannels.includes('in_app')) {
    enabledChannels.push('in_app')
  }

  // Ensure at least one channel for high urgency
  if (enabledChannels.length === 0 && urgency >= 7) {
    enabledChannels.push('in_app')
  }

  return enabledChannels
}

async function sendNotification(supabase: any, notification: any) {
  // This would integrate with actual notification services
  // For now, we'll just update the status
  
  const channels = notification.channels as string[]
  
  for (const channel of channels) {
    switch (channel) {
      case 'email':
        // await sendEmail(notification)
        break
      case 'sms':
        // await sendSMS(notification)
        break
      case 'push':
        // await sendPushNotification(notification)
        break
      case 'in_app':
        // In-app notifications are handled by the client
        break
    }
  }

  // Update notification status
  await supabase
    .from('notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id)
}

async function updateEngagementPatterns(supabase: any, userId: string) {
  // This function would run ML analysis on engagement patterns
  // For now, it's a placeholder for future enhancement
  
  const { data: recentActivity } = await supabase
    .from('notifications')
    .select('sent_at, read_at, type, urgency')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  if (recentActivity && recentActivity.length > 20) {
    // Analyze patterns and update preferences
    // This would use more sophisticated ML in production
    console.log(`Analyzed ${recentActivity.length} notifications for user ${userId}`)
  }
}