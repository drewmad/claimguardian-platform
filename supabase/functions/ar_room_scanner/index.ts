import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ARScanPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  confidence: number;
}

interface ARScanData {
  points: ARScanPoint[];
  roomType: string;
  sessionId: string;
  deviceInfo: {
    hasARCore: boolean;
    hasDepthSensor: boolean;
    screenDimensions: { width: number; height: number };
  };
}

interface RoomMeasurement {
  width: number;
  height: number;
  length: number;
  area: number;
  perimeter: number;
  corners: { x: number; y: number; z: number }[];
  confidence: number;
}

interface FloorPlanData {
  rooms: {
    id: string;
    name: string;
    type: string;
    measurements: RoomMeasurement;
    position: { x: number; y: number };
    connections: string[]; // Connected room IDs
  }[];
  totalArea: number;
  scale: number;
  unit: "feet" | "meters";
  generatedAt: string;
}

// Convert AR scan points to room measurements using geometric analysis
function processARScanData(scanData: ARScanData): RoomMeasurement {
  const { points } = scanData;

  if (points.length < 4) {
    throw new Error("Insufficient scan points for room analysis");
  }

  // Filter high-confidence points
  const validPoints = points.filter((p) => p.confidence > 0.7);

  // Group points by height (floor/ceiling detection)
  const floorPoints = validPoints.filter((p) => p.y < -1.0); // Below eye level
  const wallPoints = validPoints.filter((p) => p.y >= -1.0 && p.y <= 1.0);

  // Find room boundaries using convex hull algorithm
  const boundaries = findRoomBoundaries(wallPoints);

  // Calculate room dimensions
  const corners = boundaries.corners;
  const width = Math.abs(corners[0].x - corners[1].x);
  const length = Math.abs(corners[1].z - corners[2].z);
  const height = calculateRoomHeight(floorPoints, wallPoints);

  const area = width * length;
  const perimeter = 2 * (width + length);

  // Calculate confidence based on scan coverage
  const scanCoverage = calculateScanCoverage(validPoints, area);
  const confidence = Math.min(0.95, scanCoverage * 0.8 + 0.2);

  return {
    width: Math.round(width * 3.28084 * 100) / 100, // Convert to feet
    height: Math.round(height * 3.28084 * 100) / 100,
    length: Math.round(length * 3.28084 * 100) / 100,
    area: Math.round(area * 10.7639 * 100) / 100, // Convert to sq ft
    perimeter: Math.round(perimeter * 3.28084 * 100) / 100,
    corners: corners.map((c) => ({
      x: Math.round(c.x * 3.28084 * 100) / 100,
      y: Math.round(c.y * 3.28084 * 100) / 100,
      z: Math.round(c.z * 3.28084 * 100) / 100,
    })),
    confidence,
  };
}

function findRoomBoundaries(wallPoints: ARScanPoint[]) {
  // Simplified boundary detection - in production would use more sophisticated algorithms
  const minX = Math.min(...wallPoints.map((p) => p.x));
  const maxX = Math.max(...wallPoints.map((p) => p.x));
  const minZ = Math.min(...wallPoints.map((p) => p.z));
  const maxZ = Math.max(...wallPoints.map((p) => p.z));

  // Assume rectangular room for simplicity
  const corners = [
    { x: minX, y: 0, z: minZ },
    { x: maxX, y: 0, z: minZ },
    { x: maxX, y: 0, z: maxZ },
    { x: minX, y: 0, z: maxZ },
  ];

  return { corners };
}

function calculateRoomHeight(
  floorPoints: ARScanPoint[],
  wallPoints: ARScanPoint[],
): number {
  if (floorPoints.length === 0 || wallPoints.length === 0) {
    return 2.5; // Default ceiling height in meters
  }

  const avgFloorHeight =
    floorPoints.reduce((sum, p) => sum + p.y, 0) / floorPoints.length;
  const maxWallHeight = Math.max(...wallPoints.map((p) => p.y));

  return Math.abs(maxWallHeight - avgFloorHeight) || 2.5;
}

function calculateScanCoverage(
  points: ARScanPoint[],
  roomArea: number,
): number {
  // Estimate scan coverage based on point density and distribution
  const pointDensity = points.length / Math.max(roomArea, 1);
  const normalizedDensity = Math.min(1.0, pointDensity / 10); // Assume 10 points per sq meter is good coverage

  return normalizedDensity;
}

function generateFloorPlan(
  rooms: Array<{
    measurements: RoomMeasurement;
    type: string;
    sessionId: string;
  }>,
): FloorPlanData {
  let totalArea = 0;
  const processedRooms = rooms.map((room, index) => {
    totalArea += room.measurements.area;

    return {
      id: `room_${index + 1}`,
      name: `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} ${index + 1}`,
      type: room.type,
      measurements: room.measurements,
      position: {
        x: index * (room.measurements.width + 2), // Space rooms out
        y: 0,
      },
      connections: [], // Would be calculated based on adjacency analysis
    };
  });

  return {
    rooms: processedRooms,
    totalArea: Math.round(totalArea * 100) / 100,
    scale: 20, // 20 pixels per foot
    unit: "feet",
    generatedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, scanData, sessionId, roomType } = await req.json();

    // Get current user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "process_scan") {
      // Validate scan data
      if (!scanData || !scanData.points || scanData.points.length < 4) {
        return new Response(
          JSON.stringify({ error: "Insufficient scan data" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Process AR scan data into room measurements
      const measurements = processARScanData(scanData as ARScanData);

      // Store scan session in database
      const { data: scanSession, error: scanError } = await supabase
        .from("ar_scan_sessions")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          room_type: roomType,
          scan_data: scanData,
          measurements: measurements,
          status: "completed",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (scanError) {
        return new Response(
          JSON.stringify({ error: "Failed to save scan data" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          measurements,
          scanId: scanSession.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else if (action === "generate_floorplan") {
      // Get all scan sessions for the user
      const { data: scanSessions, error: sessionsError } = await supabase
        .from("ar_scan_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (sessionsError || !scanSessions || scanSessions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No completed scans found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Generate floor plan from all scanned rooms
      const rooms = scanSessions.map((session) => ({
        measurements: session.measurements,
        type: session.room_type,
        sessionId: session.session_id,
      }));

      const floorPlan = generateFloorPlan(rooms);

      // Store generated floor plan
      const { data: savedPlan, error: planError } = await supabase
        .from("floor_plans")
        .insert({
          user_id: user.id,
          name: `Floor Plan ${new Date().toLocaleDateString()}`,
          plan_data: floorPlan,
          total_area: floorPlan.totalArea,
          room_count: floorPlan.rooms.length,
          generated_from_ar: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (planError) {
        return new Response(
          JSON.stringify({ error: "Failed to save floor plan" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          floorPlan,
          planId: savedPlan.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else if (action === "start_session") {
      // Initialize new AR scanning session
      const newSessionId = crypto.randomUUID();

      return new Response(
        JSON.stringify({
          success: true,
          sessionId: newSessionId,
          instructions: [
            "Hold your phone steady and move slowly",
            "Scan each corner and wall thoroughly",
            "Ensure good lighting for best results",
            "Keep the camera pointed at floor/wall intersection",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AR scanning error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
