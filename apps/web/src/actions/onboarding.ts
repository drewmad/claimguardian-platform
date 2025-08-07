/**
 * @fileMetadata
 * @purpose "Server actions for onboarding flow data persistence"
 * @owner onboarding-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["saveOnboardingProgress", "completeOnboarding"]
 * @complexity medium
 * @tags ["onboarding", "server-action", "persistence"]
 * @status stable
 */

"use server";

import { sendWelcomeEmail } from "./email";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingData {
  // Step 1: User Profile
  userType:
    | "renter"
    | "homeowner"
    | "landlord"
    | "property-professional"
    | null;
  propertyAddress?: string;
  addressVerified?: boolean;
  propertyLatitude?: number;
  propertyLongitude?: number;
  propertyPlaceId?: string;
  professionalRole?: string;
  landlordUnits?: string;

  // Property Details
  propertyStories?: number;
  propertyBedrooms?: number;
  propertyBathrooms?: number;
  roomsPerFloor?: { [floor: number]: number };
  propertyStructures?: string[];

  // Step 2: Insurance Status
  hasPropertyInsurance?: boolean | null;
  hasFloodInsurance?: boolean | null;
  hasOtherInsurance?: boolean | null;
  insuranceProvider?: string;
  otherInsuranceType?: string;
  otherInsuranceDescription?: string;

  // Legacy field for compatibility
  hasInsurance?: boolean | null;

  // Completion tracking
  profileComplete: boolean;
  insuranceComplete: boolean;
  onboardingComplete: boolean;
  completedAt?: string;
}

/**
 * Save onboarding progress to the database
 */
export async function saveOnboardingProgress(
  userId: string,
  data: Partial<OnboardingData>,
) {
  try {
    const supabase = await await createClient();

    // Update user preferences with onboarding data
    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Map onboarding data to preference fields
    if (data.userType) updateData.user_type = data.userType;
    if (data.propertyAddress)
      updateData.property_address = data.propertyAddress;
    if (data.addressVerified !== undefined)
      updateData.address_verified = data.addressVerified;
    if (data.propertyLatitude !== undefined)
      updateData.property_latitude = data.propertyLatitude;
    if (data.propertyLongitude !== undefined)
      updateData.property_longitude = data.propertyLongitude;
    if (data.propertyPlaceId)
      updateData.property_place_id = data.propertyPlaceId;
    if (data.professionalRole)
      updateData.professional_role = data.professionalRole;
    if (data.landlordUnits) updateData.landlord_units = data.landlordUnits;

    // Property details
    if (data.propertyStories)
      updateData.property_stories = data.propertyStories;
    if (data.propertyBedrooms)
      updateData.property_bedrooms = data.propertyBedrooms;
    if (data.propertyBathrooms)
      updateData.property_bathrooms = data.propertyBathrooms;
    if (data.roomsPerFloor)
      updateData.rooms_per_floor = JSON.stringify(data.roomsPerFloor);
    if (data.propertyStructures)
      updateData.property_structures = JSON.stringify(data.propertyStructures);

    // Insurance fields - map new fields and maintain legacy compatibility
    if (data.hasPropertyInsurance !== undefined)
      updateData.has_property_insurance = data.hasPropertyInsurance;
    if (data.hasFloodInsurance !== undefined)
      updateData.has_flood_insurance = data.hasFloodInsurance;
    if (data.hasOtherInsurance !== undefined)
      updateData.has_other_insurance = data.hasOtherInsurance;
    if (data.hasInsurance !== undefined)
      updateData.has_insurance = data.hasInsurance;
    if (data.insuranceProvider)
      updateData.insurance_provider = data.insuranceProvider;
    if (data.otherInsuranceType)
      updateData.other_insurance_type = data.otherInsuranceType;
    if (data.otherInsuranceDescription)
      updateData.other_insurance_description = data.otherInsuranceDescription;

    // Completion tracking
    if (data.profileComplete !== undefined)
      updateData.profile_completed = data.profileComplete;
    if (data.insuranceComplete !== undefined)
      updateData.insurance_completed = data.insuranceComplete;
    if (data.onboardingComplete !== undefined)
      updateData.onboarding_completed = data.onboardingComplete;
    if (data.completedAt) updateData.onboarding_completed_at = data.completedAt;

    const { error } = await supabase
      .from("user_preferences")
      .upsert(updateData);

    if (error) {
      logger.error("Failed to save onboarding progress", { userId, error });
      return { success: false, error: error.message };
    }

    logger.info("Onboarding progress saved", { userId, step: data });
    return { success: true };
  } catch (error) {
    logger.error(
      "Error saving onboarding progress",
      { userId },
      error as Error,
    );
    return { success: false, error: "Failed to save progress" };
  }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(
  userId: string,
  finalData: OnboardingData,
) {
  try {
    const supabase = await await createClient();

    const completionData = {
      user_id: userId,
      user_type: finalData.userType,
      property_address: finalData.propertyAddress,
      address_verified: finalData.addressVerified || false,
      property_latitude: finalData.propertyLatitude,
      property_longitude: finalData.propertyLongitude,
      property_place_id: finalData.propertyPlaceId,
      professional_role: finalData.professionalRole,
      landlord_units: finalData.landlordUnits,

      // Property details
      property_stories: finalData.propertyStories,
      property_bedrooms: finalData.propertyBedrooms,
      property_bathrooms: finalData.propertyBathrooms,
      rooms_per_floor: finalData.roomsPerFloor
        ? JSON.stringify(finalData.roomsPerFloor)
        : null,
      property_structures: finalData.propertyStructures
        ? JSON.stringify(finalData.propertyStructures)
        : null,

      // Insurance fields
      has_property_insurance: finalData.hasPropertyInsurance,
      has_flood_insurance: finalData.hasFloodInsurance,
      has_other_insurance: finalData.hasOtherInsurance,
      has_insurance: finalData.hasInsurance,
      insurance_provider: finalData.insuranceProvider,
      other_insurance_type: finalData.otherInsuranceType,
      other_insurance_description: finalData.otherInsuranceDescription,

      // Completion tracking
      profile_completed: true,
      insurance_completed: true,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_preferences")
      .upsert(completionData);

    if (error) {
      logger.error("Failed to complete onboarding", { userId, error });
      return { success: false, error: error.message };
    }

    // Create property record for homeowners and landlords
    if (
      (finalData.userType === "homeowner" ||
        finalData.userType === "landlord") &&
      finalData.propertyAddress &&
      finalData.addressVerified
    ) {
      const propertyData = {
        user_id: userId,
        name:
          finalData.userType === "homeowner" ? "My Home" : "Rental Property",
        address: {
          street: finalData.propertyAddress,
          place_id: finalData.propertyPlaceId,
        },
        latitude: finalData.propertyLatitude,
        longitude: finalData.propertyLongitude,
        type: finalData.userType === "homeowner" ? "single_family" : "rental",
        year_built: new Date().getFullYear() - 20, // Default to 20 years old
        square_feet: 2000, // Default square footage
        details: {
          bedrooms: finalData.propertyBedrooms || 3,
          bathrooms: finalData.propertyBathrooms || 2,
          stories: finalData.propertyStories || 1,
          rooms_per_floor: finalData.roomsPerFloor || { 1: 4 },
          features: finalData.propertyStructures || [],
          insurance: {
            has_property: finalData.hasPropertyInsurance,
            has_flood: finalData.hasFloodInsurance,
            has_other: finalData.hasOtherInsurance,
            provider: finalData.insuranceProvider,
            other_type: finalData.otherInsuranceType,
            other_description: finalData.otherInsuranceDescription,
          },
        },
        is_primary: finalData.userType === "homeowner",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newProperty, error: propertyError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) {
        logger.error("Failed to create property during onboarding", {
          userId,
          propertyError,
        });
        // Don't fail the entire onboarding if property creation fails
        // User can add property manually later
      } else {
        logger.info("Property created during onboarding", {
          userId,
          address: finalData.propertyAddress,
        });

        // Trigger property enrichment if property was created successfully
        if (
          newProperty &&
          finalData.propertyLatitude &&
          finalData.propertyLongitude
        ) {
          try {
            // Use Supabase client to invoke the Edge Function
            const { data: enrichmentResult, error: enrichmentError } =
              await supabase.functions.invoke("enrich-property-data", {
                body: {
                  propertyId: newProperty.id,
                  latitude: finalData.propertyLatitude,
                  longitude: finalData.propertyLongitude,
                  address: finalData.propertyAddress,
                  placeId: finalData.propertyPlaceId,
                },
              });

            if (enrichmentError) {
              logger.error("Property enrichment failed", {
                propertyId: newProperty.id,
                error: enrichmentError,
              });
            } else if (enrichmentResult) {
              logger.info("Property enriched successfully", {
                propertyId: newProperty.id,
                version: enrichmentResult.version,
                cost: enrichmentResult.cost,
              });
            }
          } catch (enrichmentError) {
            // Don't fail onboarding if enrichment fails
            logger.error("Error enriching property", {
              propertyId: newProperty.id,
              error: enrichmentError,
            });
          }
        }
      }
    }

    // Track onboarding completion analytics
    logger.info("Onboarding completed", {
      userId,
      userType: finalData.userType,
      hasInsurance: finalData.hasInsurance,
      hasProperty: !!finalData.propertyAddress,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(userId);
      logger.info("Welcome email sent", { userId });
    } catch (emailError) {
      // Don't fail onboarding if email fails
      logger.error(
        "Failed to send welcome email",
        { userId },
        emailError as Error,
      );
    }

    return { success: true };
  } catch (error) {
    logger.error("Error completing onboarding", { userId }, error as Error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}

/**
 * Track onboarding step completion for analytics
 */
export async function trackOnboardingStep(
  userId: string,
  step: number,
  stepName: string,
  timeSpent?: number,
) {
  try {
    // This would integrate with your analytics service
    logger.track("Onboarding Step Completed", {
      userId,
      step,
      stepName,
      timeSpent,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    logger.error(
      "Error tracking onboarding step",
      { userId, step },
      error as Error,
    );
    return { success: false };
  }
}
