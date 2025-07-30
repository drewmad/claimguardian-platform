/**
 * @fileMetadata
 * @purpose Disaster Hub Command Center for real-time alerts, preparedness, and recovery.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "next/link"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "disaster", "emergency", "preparedness", "map"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { 
  AlertTriangle, Shield, Zap, Heart, MapPin, ExternalLink, 
  CheckCircle, Radio, Wind, Droplets, Flame, Sun
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// --- MOCK DATA (Phase 1) ---
const userProperties = [
  { id: 'prop1', name: 'Primary Residence', address: '123 Main St, Miami, FL', status: 'At Risk', disaster: 'Hurricane Leo' },
  { id: 'prop2', name: 'Beach House', address: '456 Ocean Dr, Key West, FL', status: 'All Clear', disaster: null },
]

const activeAlerts = [
  { 
    id: 'alert1', 
    disasterName: 'Hurricane Leo',
    level: 'Warning', 
    title: 'Hurricane Warning for Miami-Dade County',
    source: 'National Hurricane Center',
    lastUpdated: '15 minutes ago'
  }
]

const disasterEvent = {
  name: 'Hurricane Leo',
  type: 'Hurricane',
  category: 2,
  windSpeed: '110 mph',
  location: '25.7617° N, 80.1918° W',
}

const preparednessItems = {
  prepare: [
    { id: 'prep1', text: 'Photograph property exterior and interior', completed: true },
    { id: 'prep2', text: 'Secure outdoor furniture and loose items', completed: true },
    { id: 'prep3', text: 'Board up windows and glass doors', completed: false },
    { id: 'prep4', text: 'Assemble emergency kit (water, food, batteries)', completed: true },
    { id: 'prep5', text: 'Review insurance policy documents', completed: false },
  ],
  survive: [
    { id: 'surv1', text: 'Stay indoors and away from windows', completed: false },
    { id: 'surv2', text: 'Monitor official news and weather alerts', completed: false },
    { id: 'surv3', text: 'Conserve phone battery life', completed: false },
  ],
  recover: [
    { id: 'recov1', text: 'Wait for the "all clear" from officials', completed: false },
    { id: 'recov2', text: 'Document all property damage with photos/videos', completed: false },
    { id: 'recov3', text: 'Contact your insurance provider to start a claim', completed: false },
    { id: 'recov4', text: 'Make temporary repairs to prevent further damage', completed: false },
  ]
}

const resourceLinks = [
  { id: 'res1', name: 'National Hurricane Center', url: 'https://www.nhc.noaa.gov/' },
  { id: 'res2', name: 'Florida Division of Emergency Management', url: 'https://www.floridadisaster.org/' },
  { id: 'res3', name: 'FEMA', url: 'https://www.fema.gov/' },
  { id: 'res4', name: 'American Red Cross', url: 'https://www.redcross.org/' },
]

// --- UI Components ---

const DisasterAlertBanner = ({ alert }: { alert: typeof activeAlerts[0] }) => (
  <Card className="bg-red-900/30 border-red-500/50">
    <CardContent className="p-6 flex items-center gap-6">
      <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0" />
      <div>
        <Badge variant="destructive" className="mb-2">{alert.level}</Badge>
        <h2 className="text-2xl font-bold text-white">{alert.title}</h2>
        <p className="text-red-200 mt-1">
          Source: {alert.source} (Updated: {alert.lastUpdated})
        </p>
      </div>
    </CardContent>
  </Card>
)

const PropertyStatusCard = ({ property }: { property: typeof userProperties[0] }) => (
  <Card className="bg-panel backdrop-blur-lg border-border">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{property.name}</span>
        <Badge variant={property.status === 'At Risk' ? 'destructive' : 'default'}>
          {property.status}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-text-secondary mb-4">{property.address}</p>
      <button className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2 rounded-lg">
        Start a New Claim
      </button>
    </CardContent>
  </Card>
)

const InteractiveMapPlaceholder = ({ event }: { event: typeof disasterEvent }) => {
  const Icon = event.type === 'Hurricane' ? Wind : event.type === 'Flood' ? Droplets : Flame
  return (
    <Card className="bg-panel backdrop-blur-lg border-border h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-accent" />
          <span>{event.name} - Live Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center bg-slate-900/50 m-4 rounded-lg">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-accent mx-auto mb-4" />
          <p className="text-text-secondary">Interactive Map Coming in Phase 3</p>
          <p className="text-sm text-text-secondary/70">Category {event.category} | {event.windSpeed}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const PreparednessChecklist = () => {
  const [activeTab, setActiveTab] = useState<'prepare' | 'survive' | 'recover'>('prepare')
  const [checklist, setChecklist] = useState(preparednessItems)

  const toggleItem = (tab: 'prepare' | 'survive' | 'recover', id: string) => {
    setChecklist(prev => ({
      ...prev,
      [tab]: prev[tab].map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }))
  }

  const tabs = [
    { id: 'prepare', name: 'Prepare', icon: Shield },
    { id: 'survive', name: 'Survive', icon: Zap },
    { id: 'recover', name: 'Recover', icon: Heart },
  ] as const

  return (
    <Card className="bg-panel backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle>Preparedness Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex border-b border-border mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        <ul className="space-y-3">
          {checklist[activeTab].map(item => (
            <li key={item.id} className="flex items-center gap-3">
              <button onClick={() => toggleItem(activeTab, item.id)} className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.completed ? 'border-accent bg-accent' : 'border-border'}`}>
                  {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </button>
              <span className={`flex-grow ${item.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const ResourceLinks = () => (
  <Card className="bg-panel backdrop-blur-lg border-border">
    <CardHeader>
      <CardTitle>Official Resources</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {resourceLinks.map(link => (
          <li key={link.id}>
            <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
              <span className="font-semibold text-text-primary">{link.name}</span>
              <ExternalLink className="w-5 h-5 text-text-secondary" />
            </Link>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

function DisasterHubContent() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Disaster Hub</h1>
          <p className="text-text-secondary mt-1">Your command center for emergency preparedness and response.</p>
        </div>

        {/* Alerts */}
        {activeAlerts.map(alert => <DisasterAlertBanner key={alert.id} alert={alert} />)}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <InteractiveMapPlaceholder event={disasterEvent} />
            <PreparednessChecklist />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">My Properties</h3>
              <div className="space-y-4">
                {userProperties.map(prop => <PropertyStatusCard key={prop.id} property={prop} />)}
              </div>
            </div>
            <ResourceLinks />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DisasterHubPage() {
  return (
    <ProtectedRoute>
      <DisasterHubContent />
    </ProtectedRoute>
  )
}