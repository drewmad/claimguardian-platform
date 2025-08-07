/**
 * @fileMetadata
 * @purpose "NIMS ICS Individual Incident API endpoint"
 * @dependencies ["@/lib/nims/ics-integration", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { icsIntegrationService } from "@/lib/nims/ics-integration";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ics_incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Incident not found" },
          { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ incident: data });
  } catch (error) {
    console.error("Failed to fetch incident:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update incident using ICS integration service
    const updatedIncident = await icsIntegrationService.updateIncidentStatus(
      id,
      body,
    );

    return NextResponse.json({
      incident: updatedIncident,
      message: "Incident updated successfully",
    });
  } catch (error) {
    console.error("Failed to update incident:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Only allow deletion of closed incidents
    const { data: incident } = await supabase
      .from("ics_incidents")
      .select("status")
      .eq("id", id)
      .single();

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 });
    }

    if (incident.status !== "closed") {
      return NextResponse.json(
        { error: "Only closed incidents can be deleted" },
        { status: 400 });
    }

    const { error } = await supabase
      .from("ics_incidents")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Incident deleted successfully" });
  } catch (error) {
    console.error("Failed to delete incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 });
  }
}
