/**
 * @fileMetadata
 * @purpose "Example API route with rate limiting and authentication middleware"
 * @dependencies ["@/lib","next"]
 * @owner api-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIMiddleware, APIContext } from "@/lib/api/api-middleware";
import { cacheable, CacheInvalidator } from "@/lib/cache/api-cache-middleware";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/properties - List properties for authenticated user
 */
export const GET = cacheable({ endpoint: "properties" })(
  withAPIMiddleware(async (request: NextRequest, context: APIContext) => {
    try {
      const supabase = await createClient();

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
      const offset = parseInt(searchParams.get("offset") || "0");
      const search = searchParams.get("search");

      // Build query
      let query = supabase
        .from("properties")
        .select("*")
        .eq("user_id", context.userId)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      // Add search filter if provided
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`,
        );
      }

      const { data: properties, error } = await query;

      if (error) {
        return NextResponse.json(
          { error: "Database Error", message: error.message },
          { status: 500 });
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("user_id", context.userId);

      if (countError) {
        return NextResponse.json(
          { error: "Database Error", message: countError.message },
          { status: 500 });
      }

      return NextResponse.json({
        data: properties,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      });
    } catch (error) {
      console.error("Properties API error:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        },
        { status: 500 });
    }
  }),
);

/**
 * POST /api/properties - Create a new property
 */
export const POST = cacheable({
  endpoint: "properties",
  invalidateOnMutate: true,
})(
  withAPIMiddleware(async (request: NextRequest, context: APIContext) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      // Validate required fields
      const requiredFields = ["name", "street_address", "city", "state", "zip"];
      const missingFields = requiredFields.filter((field) => !body[field]);

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: "Validation Error",
            message: `Missing required fields: ${missingFields.join(", ")}`,
          },
          { status: 400 });
      }

      // Create property
      const { data: property, error } = await supabase
        .from("properties")
        .insert({
          ...body,
          user_id: context.userId,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Database Error", message: error.message },
          { status: 500 });
      }

      // Invalidate user's property cache
      await CacheInvalidator.invalidateUserProperties(context.userId);

      return NextResponse.json({ data: property }, { status: 201 });
    } catch (error) {
      console.error("Create property API error:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        },
        { status: 500 });
    }
  }),
);
