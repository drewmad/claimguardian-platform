import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Mock NIMS resource tracking data
    const resources = {
      timestamp: new Date().toISOString(),
      incidentType: "Type 4 - Local/Regional",
      resources: {
        personnel: {
          total: 45,
          deployed: 12,
          available: 33,
          categories: [
            { type: "Command Staff", count: 5, deployed: 2 },
            { type: "Operations", count: 20, deployed: 8 },
            { type: "Planning", count: 8, deployed: 1 },
            { type: "Logistics", count: 7, deployed: 1 },
            { type: "Finance/Admin", count: 5, deployed: 0 }
          ]
        },
        equipment: {
          total: 28,
          deployed: 8,
          available: 20,
          categories: [
            { type: "Communications", count: 10, deployed: 3 },
            { type: "Transportation", count: 8, deployed: 2 },
            { type: "Medical", count: 5, deployed: 2 },
            { type: "Shelter", count: 5, deployed: 1 }
          ]
        },
        facilities: {
          total: 6,
          activated: 2,
          standby: 4,
          types: [
            { name: "EOC - Charlotte County", status: "activated" },
            { name: "Staging Area - Port Charlotte", status: "activated" },
            { name: "Shelter - Punta Gorda", status: "standby" },
            { name: "POD - Englewood", status: "standby" },
            { name: "Medical Station - North Port", status: "standby" },
            { name: "Command Post - Mobile", status: "standby" }
          ]
        }
      },
      missions: {
        active: 3,
        completed: 12,
        pending: 5,
        recent: [
          {
            id: "M-2025-001",
            type: "Damage Assessment",
            status: "active",
            assigned: 4,
            location: "Charlotte County"
          },
          {
            id: "M-2025-002", 
            type: "Debris Removal",
            status: "active",
            assigned: 6,
            location: "Lee County"
          },
          {
            id: "M-2025-003",
            type: "Shelter Operations",
            status: "active",
            assigned: 2,
            location: "Sarasota County"
          }
        ]
      },
      compliance: {
        typing: true,
        credentialing: true,
        inventory: true,
        reporting: true,
        lastAudit: "2025-01-01T00:00:00Z"
      }
    };

    return NextResponse.json(resources);
  } catch (error) {
    console.error('NIMS resources error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve NIMS resources' },
      { status: 500 }
    );
  }
}
