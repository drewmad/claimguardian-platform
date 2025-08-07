/**
 * @fileMetadata
 * @purpose "NIMS Disaster Workflows API endpoint"
 * @dependencies ["@/lib/nims/disaster-workflow", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disasterWorkflowManager } from "@/lib/nims/disaster-workflow";
import { IncidentType } from "@/lib/nims/ics-integration";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const incidentType = searchParams.get("incident_type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("disaster_workflows")
      .select(
        `
        id,
        incident_id,
        workflow_name,
        incident_type,
        current_phase,
        status,
        priority_level,
        created_by,
        created_at,
        updated_at
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (incidentType) {
      query = query.eq("incident_type", incidentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch workflows:", error);
      return NextResponse.json(
        { error: "Failed to fetch workflows" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      workflows: data,
      total: data.length,
    });
  } catch (error) {
    console.error("NIMS workflows API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.incident_id || !body.incident_type) {
      return NextResponse.json(
        { error: "Missing required fields: incident_id, incident_type" },
        { status: 400 },
      );
    }

    const workflow = await disasterWorkflowManager.createWorkflow(
      body.incident_id,
      body.incident_type as IncidentType,
      body,
    );

    return NextResponse.json(
      {
        workflow,
        message: "Disaster workflow created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}
