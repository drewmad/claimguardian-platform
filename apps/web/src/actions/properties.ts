/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Server actions for managing properties with temporal digital twin support"
 * @dependencies ["@supabase/supabase-js", "@claimguardian/db", "@claimguardian/utils"]
 * @status stable
 * @supabase-integration database
 * @insurance-context properties
 * @agent-hints "Uses new core.properties schema with temporal tracking - updates create new versions"
 */
"use server";

import {
  PaginationParams,
  PaginatedResponse,
  normalizePaginationParams,
  createPaginationMeta,
} from "@claimguardian/utils";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

import { createClient } from "@/lib/supabase/server";
import { updatePropertySchema } from "@/lib/validation/schemas";
import type { Database, Property } from "@claimguardian/db";

interface PropertyData {
  street_address: string;
  city: string;
  state?: string;
  zip_code: string;
  county_name?: string;
  property_type:
    | "single_family"
    | "townhouse"
    | "condo"
    | "multi_family"
    | "commercial"
    | "land";
  year_built?: number;
  square_footage?: number;
  bedrooms?: number;
  bathrooms?: number;
  lot_size_acres?: number;
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  metadata?: Record<string, unknown>;
}

export async function getProperty({ propertyId }: { propertyId: string }) {
  try {
    const supabase = await createClient();

    // Get authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Get current version of the property
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("user_id", user.id) // Ensure user owns the property
      .eq("is_current", true) // Only get current version
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.error("Error fetching property", toError(error));
    return { data: null, error: error as Error };
  }
}

// Get property history for temporal tracking
export async function getPropertyHistory({
  propertyId,
}: {
  propertyId: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Use the temporal function to get history
    const { data, error } = await supabase.rpc("get_property_history", {
      property_id: propertyId,
    });

    if (error) throw error;

    // Filter to only properties owned by user
    const userProperties =
      data?.filter((prop: Property) => prop.user_id === user.id) || [];

    return { data: userProperties, error: null };
  } catch (error) {
    logger.error("Error fetching property history", toError(error));
    return { data: null, error: error as Error };
  }
}

// Get property at specific time
export async function getPropertyAtTime({
  propertyId,
  queryTime,
}: {
  propertyId: string;
  queryTime: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.rpc("get_property_at_time", {
      property_id: propertyId,
      query_time: queryTime,
    });

    if (error) throw error;

    // Ensure user owns the property
    const userProperty = data?.find(
      (prop: Property) => prop.user_id === user.id,
    );

    return { data: userProperty || null, error: null };
  } catch (error) {
    logger.error("Error fetching property at time", toError(error));
    return { data: null, error: error as Error };
  }
}

export async function getProperties(params?: PaginationParams) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      logger.error("Auth error in getProperties:", { authError });
      throw new Error("Authentication failed");
    }

    if (!user) {
      logger.error("No user found in getProperties");
      throw new Error("Not authenticated");
    }

    // Normalize pagination parameters
    const { page, limit, offset } = normalizePaginationParams(params);

    // Get total count of current properties only
    const { count } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_current", true);

    // Get paginated data - current versions only
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_current", true) // Only get current versions
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Database error in getProperties", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Create paginated response
    const paginatedResponse: PaginatedResponse<Property> = {
      data: data || [],
      meta: createPaginationMeta(page, limit, count || 0),
    };

    return { data: paginatedResponse, error: null };
  } catch (error) {
    logger.error("Error fetching properties", toError(error));
    return { data: null, error: error as Error };
  }
}

export async function updateProperty(params: unknown) {
  try {
    // Validate input
    const { propertyId, updates } = updatePropertySchema.parse(params);

    const supabase = await createClient();

    // Debug logging
    logger.info("[UPDATE PROPERTY] Starting temporal update for property", {
      propertyId,
    });
    logger.info("[UPDATE PROPERTY] Updates", { updates });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      logger.error("[UPDATE PROPERTY] Auth error:", { authError });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      logger.error("[UPDATE PROPERTY] No user found");
      throw new Error("Not authenticated");
    }

    logger.info("[UPDATE PROPERTY] User authenticated:", user.id);

    // Handle demo property case - it doesn't exist in database
    if (propertyId === "demo-property-uuid") {
      logger.info(
        "[UPDATE PROPERTY] Demo property detected - skipping database update",
      );
      return {
        data: {
          id: propertyId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    // First check if property exists and user owns it (current version only)
    const { data: existingProperty, error: checkError } = await supabase
      .from("properties")
      .select("id, user_id, metadata")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .eq("is_current", true)
      .single();

    if (checkError) {
      logger.error("[UPDATE PROPERTY] Property check error:", { checkError });
      throw new Error(
        `Property not found or access denied: ${checkError.message}`,
      );
    }

    if (!existingProperty) {
      logger.error("[UPDATE PROPERTY] Property not found for user");
      throw new Error(
        "Property not found or you do not have permission to update it",
      );
    }

    logger.info(
      "[UPDATE PROPERTY] Property found, proceeding with temporal update",
    );

    // Format the data for temporal update (only include changed fields)
    const temporalUpdates: Record<string, any> = {};

    // Map old field names to new schema
    if (updates.name !== undefined)
      temporalUpdates.metadata = {
        ...existingProperty.metadata,
        name: updates.name,
      };
    if (updates.address !== undefined)
      temporalUpdates.street_address = updates.address;
    if (updates.type !== undefined)
      temporalUpdates.property_type = updates.type;
    if (updates.year_built !== undefined)
      temporalUpdates.year_built = updates.year_built;
    if (updates.square_feet !== undefined)
      temporalUpdates.square_footage = updates.square_feet;

    // Handle nested details in metadata
    if (updates.details) {
      temporalUpdates.metadata = {
        ...(existingProperty.metadata || {}),
        details: updates.details,
      };
    }

    logger.info("[UPDATE PROPERTY] Temporal updates:", temporalUpdates);

    // Use the working temporal update function - this creates a new version
    const { data: versionId, error } = await supabase.rpc(
      "update_property_simple",
      {
        property_id: propertyId,
        new_data: temporalUpdates,
      },
    );

    if (error) {
      logger.error("[UPDATE PROPERTY] Temporal update error", error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Failed to update property: ${error.message}`);
    }

    logger.info(
      "[UPDATE PROPERTY] Temporal update successful, new version:",
      versionId,
    );

    // Get the new current version to return
    const { data: updatedProperty, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("version_id", versionId)
      .single();

    if (fetchError) {
      logger.warn(
        "[UPDATE PROPERTY] Could not fetch updated property:",
        fetchError,
      );
    }

    revalidatePath("/dashboard/property");
    revalidatePath(`/dashboard/property/${propertyId}`);

    return {
      data: updatedProperty || { id: propertyId, version_id: versionId },
      error: null,
    };
  } catch (error) {
    logger.error("[UPDATE PROPERTY] Error updating property", error instanceof Error ? error : new Error(String(error)));
    return { data: null, error: error as Error };
  }
}

export async function createProperty({
  propertyData,
}: {
  propertyData: PropertyData;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert directly into properties (via view to core.properties)
    // Initial version will have default temporal fields set by database defaults
    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        street_address: propertyData.street_address,
        city: propertyData.city,
        state: propertyData.state || "FL",
        zip_code: propertyData.zip_code,
        county_name: propertyData.county_name,
        property_type: propertyData.property_type,
        year_built: propertyData.year_built,
        square_footage: propertyData.square_footage,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        lot_size_acres: propertyData.lot_size_acres,
        current_value: propertyData.current_value,
        purchase_price: propertyData.purchase_price,
        purchase_date: propertyData.purchase_date,
        is_current: true, // Set as current version for temporal tracking
        metadata: {}, // Initialize empty metadata
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/property");

    return { data, error: null };
  } catch (error) {
    logger.error("Error creating property", error instanceof Error ? error : new Error(String(error)));
    return { data: null, error: error as Error };
  }
}

export async function deleteProperty({ propertyId }: { propertyId: string }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // In temporal system, we don't physically delete records
    // Instead, we mark the current version as invalid by setting valid_to = now()
    const { error } = await supabase
      .from("properties")
      .update({
        valid_to: new Date().toISOString(),
        is_current: false,
      })
      .eq("id", propertyId)
      .eq("user_id", user.id) // Ensure user owns the property
      .eq("is_current", true); // Only update current version

    if (error) throw error;

    // Also need to update the materialized view for current properties
    await supabase.rpc("refresh_current_properties");

    revalidatePath("/dashboard/property");

    return { data: { success: true }, error: null };
  } catch (error) {
    logger.error("Error deleting property", error instanceof Error ? error : new Error(String(error)));
    return { data: null, error: error as Error };
  }
}
