#!/usr/bin/env node

/**
 * Demo Data Creation Script for ClaimGuardian
 * Creates realistic demo scenarios for stakeholder presentations
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load from .env.local file
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  config({ path: envPath })
} else {
  config()
}

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  console.error('Please ensure .env.local is configured with Supabase credentials')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('Using anon key as fallback (limited permissions)')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback to anon key
)

// Demo Scenarios
const DEMO_SCENARIOS = {
  // SCENARIO 1: Active Hurricane Response
  hurricane: {
    incident: {
      id: 'DEMO-INC-HURRICANE-2025',
      incident_number: '2025-0001',
      incident_name: 'Hurricane Maria - Florida Keys',
      incident_type: 'hurricane',
      complexity_level: 2, // Type 2 - Regional resources needed
      location: {
        lat: 24.5551,
        lng: -81.7800,
        address: 'Key West, Monroe County, FL',
        jurisdiction: 'Monroe County Emergency Management'
      },
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Started 24 hours ago
      status: 'active',
      objectives: [
        {
          id: 'OBJ-001',
          objective_number: 1,
          description: 'Ensure life safety for all residents and visitors',
          priority: 'high',
          assigned_to: ['IC', 'OPS'],
          due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          progress_notes: ['Evacuation 75% complete', 'Shelters at 60% capacity']
        },
        {
          id: 'OBJ-002',
          objective_number: 2,
          description: 'Protect critical infrastructure from storm surge',
          priority: 'high',
          assigned_to: ['OPS', 'LOG'],
          due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          progress_notes: ['Sandbagging operations underway', 'Power grid secured']
        }
      ],
      organization: {
        incident_commander: {
          id: 'DEMO-IC-001',
          name: 'Chief Maria Rodriguez',
          position: 'IC',
          agency: 'Monroe County Emergency Management',
          contact: {
            phone: '305-555-0100',
            radio: 'Command 1',
            email: 'mrodriguez@monroecounty.gov'
          },
          qualifications: ['ICS-400', 'Type 2 IC Certified'],
          assignments: [],
          check_in_time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        },
        command_staff: {
          safety_officer: {
            id: 'DEMO-SO-001',
            name: 'Captain James Wilson',
            position: 'SO',
            agency: 'Key West Fire Department',
            contact: {
              phone: '305-555-0101',
              radio: 'Safety 1',
              email: 'jwilson@kwfd.gov'
            },
            qualifications: ['Safety Officer Certified'],
            assignments: [],
            check_in_time: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
          }
        },
        general_staff: {
          operations_chief: {
            id: 'DEMO-OPS-001',
            name: 'Deputy Chief Sarah Chen',
            position: 'OPS',
            agency: 'Florida National Guard',
            contact: {
              phone: '305-555-0102',
              radio: 'Ops 1',
              email: 'schen@flng.mil'
            },
            qualifications: ['Operations Section Chief'],
            assignments: [],
            check_in_time: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
          }
        }
      },
      operational_period: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        period_number: 3
      },
      weather: {
        current_conditions: 'Category 3 Hurricane, 120mph winds',
        forecast: 'Weakening to Cat 2, landfall in 6 hours',
        wind_speed: 120,
        temperature: 78
      },
      created_by: 'demo-system',
      last_updated: new Date().toISOString()
    },
    resources: [
      {
        id: 'DEMO-RES-001',
        name: 'Search and Rescue Team Alpha',
        type: 'Damage Assessment Team',
        category: 'teams',
        capability: 'Swift water rescue, structural assessment',
        status: 'assigned',
        location: {
          lat: 24.5551,
          lng: -81.7800,
          address: 'Staging Area - Key West High School'
        },
        qualifications: ['FEMA Certified', 'Swift Water Rescue'],
        contact: {
          primary: '305-555-0200',
          radio_frequency: '155.160'
        },
        last_updated: new Date().toISOString()
      },
      {
        id: 'DEMO-RES-002',
        name: 'Emergency Power Unit 1',
        type: 'Emergency Power Generator - 20kW',
        category: 'equipment',
        capability: '20kW continuous power, automatic transfer',
        status: 'available',
        location: {
          lat: 24.5551,
          lng: -81.7800,
          address: 'Resource Depot - Marathon'
        },
        qualifications: [],
        contact: {
          primary: '305-555-0201'
        },
        last_updated: new Date().toISOString()
      },
      {
        id: 'DEMO-RES-003',
        name: 'Medical Supply Cache',
        type: 'Emergency Medical Supplies',
        category: 'supplies',
        capability: '500 person treatment capacity',
        status: 'available',
        location: {
          lat: 24.5551,
          lng: -81.7800,
          address: 'Lower Keys Medical Center'
        },
        qualifications: [],
        contact: {
          primary: '305-555-0202'
        },
        last_updated: new Date().toISOString()
      }
    ],
    alerts: [
      {
        id: 'DEMO-ALERT-001',
        alert_id: 'ClaimGuardian-2025-01-06-001',
        sender_id: 'Monroe County EOC',
        title: 'HURRICANE WARNING - IMMEDIATE EVACUATION ORDER',
        message: 'Hurricane Maria approaching Florida Keys. Category 3 storm with 120mph winds. All residents in evacuation zones A and B must evacuate immediately. Storm surge up to 12 feet expected.',
        priority: 'flash',
        category: ['Met', 'Safety'],
        urgency: 'Immediate',
        severity: 'Extreme',
        certainty: 'Observed',
        target_areas: [
          {
            areaDesc: 'Florida Keys - Monroe County',
            polygon: '24.5551,-81.7800 24.6551,-81.6800 24.5551,-81.5800',
            geocode: [{ valueName: 'FIPS', value: '12087' }]
          }
        ],
        distribution_channels: ['email', 'sms', 'emergency_broadcast'],
        effective_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent',
        delivery_receipts: [
          {
            channel: 'emergency_broadcast',
            status: 'delivered',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            recipient_count: 75000
          }
        ],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },

  // SCENARIO 2: Post-Disaster Insurance Claims
  insurance_surge: {
    properties: [
      {
        id: 'DEMO-PROP-001',
        user_id: 'demo-user-001',
        name: 'Johnson Residence - Storm Damage',
        type: 'single-family',
        address: '123 Ocean Drive, Key West, FL 33040',
        year_built: 2015,
        square_footage: 2500,
        value: 850000,
        insurance_carrier: 'Citizens Property Insurance',
        policy_number: 'FL-2025-123456',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    claims: [
      {
        id: 'DEMO-CLAIM-001',
        property_id: 'DEMO-PROP-001',
        user_id: 'demo-user-001',
        claim_number: 'CLM-2025-001',
        status: 'investigating',
        type: 'hurricane',
        description: 'Severe roof damage from Hurricane Maria. Multiple shingles missing, water intrusion in master bedroom and living room.',
        damage_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_amount: 125000,
        ai_assessment: {
          damage_severity: 8.5,
          recommended_amount: 135000,
          confidence: 0.92,
          analyzed_at: new Date().toISOString()
        },
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },

  // SCENARIO 3: Enterprise Business Continuity
  enterprise: {
    organization: {
      name: 'Florida Power & Light',
      type: 'Critical Infrastructure',
      employees: 10000,
      locations: 50,
      annual_revenue: 12000000000
    },
    workflow: {
      id: 'DEMO-WF-001',
      incident_id: 'DEMO-INC-HURRICANE-2025',
      workflow_name: 'FPL Hurricane Response Protocol',
      incident_type: 'hurricane',
      current_phase: 'response',
      status: 'active',
      priority_level: 'immediate',
      stakeholders: [
        {
          id: 'STAKE-001',
          name: 'John Martinez',
          organization: 'FPL',
          role: 'Emergency Response Director',
          contact_info: {
            phone: '561-555-0100',
            email: 'jmartinez@fpl.com'
          },
          authority_level: 'decision_maker'
        }
      ],
      created_by: 'fpl-system',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

async function createDemoData() {
  console.log('🚀 Creating demo data for ClaimGuardian...\n')

  try {
    // 1. Create Hurricane Scenario
    console.log('📌 Creating Hurricane Response Scenario...')
    
    // Insert incident
    const { error: incidentError } = await supabase
      .from('ics_incidents')
      .upsert(DEMO_SCENARIOS.hurricane.incident, { onConflict: 'id' })
    
    if (incidentError) {
      console.error('Error creating incident:', incidentError)
    } else {
      console.log('✅ Hurricane incident created')
    }

    // Insert resources
    for (const resource of DEMO_SCENARIOS.hurricane.resources) {
      const { error } = await supabase
        .from('nims_resources')
        .upsert(resource, { onConflict: 'id' })
      
      if (!error) {
        console.log(`✅ Resource created: ${resource.name}`)
      }
    }

    // Insert alerts
    for (const alert of DEMO_SCENARIOS.hurricane.alerts) {
      const { error } = await supabase
        .from('emergency_alerts')
        .upsert(alert, { onConflict: 'id' })
      
      if (!error) {
        console.log(`✅ Alert created: ${alert.title}`)
      }
    }

    // 2. Create Insurance Claims Scenario
    console.log('\n📌 Creating Insurance Claims Scenario...')
    
    for (const property of DEMO_SCENARIOS.insurance_surge.properties) {
      const { error } = await supabase
        .from('properties')
        .upsert(property, { onConflict: 'id' })
      
      if (!error) {
        console.log(`✅ Property created: ${property.name}`)
      }
    }

    for (const claim of DEMO_SCENARIOS.insurance_surge.claims) {
      const { error } = await supabase
        .from('claims')
        .upsert(claim, { onConflict: 'id' })
      
      if (!error) {
        console.log(`✅ Claim created: ${claim.claim_number}`)
      }
    }

    // 3. Create Enterprise Workflow
    console.log('\n📌 Creating Enterprise Business Continuity Scenario...')
    
    const { error: workflowError } = await supabase
      .from('disaster_workflows')
      .upsert(DEMO_SCENARIOS.enterprise.workflow, { onConflict: 'id' })
    
    if (!workflowError) {
      console.log('✅ Enterprise workflow created')
    }

    console.log('\n🎉 Demo data creation complete!')
    console.log('\n📋 Demo Credentials:')
    console.log('------------------------')
    console.log('Government Demo:')
    console.log('  - View NIMS Dashboard: /nims')
    console.log('  - Incident #: 2025-0001')
    console.log('  - Location: Monroe County, FL')
    console.log('\nConsumer Demo:')
    console.log('  - Claim #: CLM-2025-001')
    console.log('  - Damage: $125,000 hurricane damage')
    console.log('  - AI Assessment: $135,000 recommended')
    console.log('\nEnterprise Demo:')
    console.log('  - Organization: Florida Power & Light')
    console.log('  - Workflow: Active hurricane response')
    console.log('------------------------')

  } catch (error) {
    console.error('Error creating demo data:', error)
    process.exit(1)
  }
}

// Run the script
createDemoData()