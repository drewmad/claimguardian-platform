/**
 * @fileMetadata
 * @purpose Server actions for onboarding flow data persistence
 * @owner onboarding-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["saveOnboardingProgress", "completeOnboarding"]
 * @complexity medium
 * @tags ["onboarding", "server-action", "persistence"]
 * @status active
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface OnboardingData {
  // Step 1: User Profile
  userType: 'renter' | 'homeowner' | 'landlord' | 'real-estate-professional' | 'insurance-professional' | null
  propertyAddress?: string
  addressVerified?: boolean
  professionalRole?: string
  
  // Step 2: Insurance Status
  hasInsurance: boolean | null
  insuranceProvider?: string
  
  // Completion tracking
  profileComplete: boolean
  insuranceComplete: boolean
  onboardingComplete: boolean
  completedAt?: string
}

/**
 * Save onboarding progress to the database
 */
export async function saveOnboardingProgress(userId: string, data: Partial<OnboardingData>) {
  try {
    const supabase = await createClient()
    
    // Update user preferences with onboarding data
    const updateData: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString()
    }
    
    // Map onboarding data to preference fields
    if (data.userType) updateData.user_type = data.userType
    if (data.propertyAddress) updateData.property_address = data.propertyAddress
    if (data.addressVerified !== undefined) updateData.address_verified = data.addressVerified
    if (data.professionalRole) updateData.professional_role = data.professionalRole
    if (data.hasInsurance !== undefined) updateData.has_insurance = data.hasInsurance
    if (data.insuranceProvider) updateData.insurance_provider = data.insuranceProvider
    if (data.profileComplete !== undefined) updateData.profile_completed = data.profileComplete
    if (data.insuranceComplete !== undefined) updateData.insurance_completed = data.insuranceComplete
    if (data.onboardingComplete !== undefined) updateData.onboarding_completed = data.onboardingComplete
    if (data.completedAt) updateData.onboarding_completed_at = data.completedAt
    
    const { error } = await supabase
      .from('user_preferences')
      .upsert(updateData)
    
    if (error) {
      logger.error('Failed to save onboarding progress', { userId, error })
      return { success: false, error: error.message }
    }
    
    logger.info('Onboarding progress saved', { userId, step: data })
    return { success: true }
    
  } catch (error) {
    logger.error('Error saving onboarding progress', { userId }, error as Error)
    return { success: false, error: 'Failed to save progress' }
  }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(userId: string, finalData: OnboardingData) {
  try {
    const supabase = await createClient()
    
    const completionData = {
      user_id: userId,
      user_type: finalData.userType,
      property_address: finalData.propertyAddress,
      address_verified: finalData.addressVerified || false,
      professional_role: finalData.professionalRole,
      has_insurance: finalData.hasInsurance,
      insurance_provider: finalData.insuranceProvider,
      profile_completed: true,
      insurance_completed: true,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('user_preferences')
      .upsert(completionData)
    
    if (error) {
      logger.error('Failed to complete onboarding', { userId, error })
      return { success: false, error: error.message }
    }
    
    // Track onboarding completion analytics
    logger.info('Onboarding completed', { 
      userId, 
      userType: finalData.userType,
      hasInsurance: finalData.hasInsurance,
      hasProperty: !!finalData.propertyAddress
    })
    
    return { success: true }
    
  } catch (error) {
    logger.error('Error completing onboarding', { userId }, error as Error)
    return { success: false, error: 'Failed to complete onboarding' }
  }
}

/**
 * Track onboarding step completion for analytics
 */
export async function trackOnboardingStep(
  userId: string, 
  step: number, 
  stepName: string, 
  timeSpent?: number
) {
  try {
    // This would integrate with your analytics service
    logger.track('Onboarding Step Completed', {
      userId,
      step,
      stepName,
      timeSpent,
      timestamp: new Date().toISOString()
    })
    
    return { success: true }
  } catch (error) {
    logger.error('Error tracking onboarding step', { userId, step }, error as Error)
    return { success: false }
  }
}