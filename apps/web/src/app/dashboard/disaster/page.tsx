/**
 * @fileMetadata
 * @purpose "Disaster Hub Command Center for real-time alerts, preparedness, and recovery."
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "next/link", "@/actions/disasters"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "disaster", "emergency", "preparedness", "map"]
 * @status stable
 */
'use client'

import {
  AlertTriangle, Shield, Zap, Heart, MapPin, ExternalLink,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import MapGL, { Source, Layer, Marker, Popup } from 'react-map-gl/mapbox'

import { updateUserChecklist, getChecklistProgress } from '@/actions/checklist'
import { getDisasterHubData } from '@/actions/disasters'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import 'mapbox-gl/dist/mapbox-gl.css'

// --- DATA TYPES ---
interface Property {
  id: string;
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'At Risk' | 'All Clear';
  disaster: string | null;
}

interface Alert {
  id: string;
  headline: string | null;
  severity: string | null;
  sender_name: string | null;
  effective_at: string | null;
  affected_geography: unknown;
}

// --- UI Components ---

const DisasterAlertBanner = ({ alert }: { alert: Alert }) => (
  <Card className="bg-red-900/30 border-red-500/50">
    <CardContent className="p-6 flex items-center gap-6">
      <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0" />
      <div>
        <Badge variant="destructive" className="mb-2">{alert.severity || 'Alert'}</Badge>
        <h2 className="text-2xl font-bold text-white">{alert.headline}</h2>
        <p className="text-red-200 mt-1">
          Source: {alert.sender_name} (Effective: {new Date(alert.effective_at!).toLocaleString()})
        </p>
      </div>
    </CardContent>
  </Card>
)

const PropertyStatusCard = ({ property }: { property: Property }) => (
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const InteractiveMap = ({ properties, alerts }: { properties: Property[], alerts: Alert[] }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const geoJsonData = {
    type: 'FeatureCollection' as const,
    features: alerts.map(alert => ({
      type: 'Feature' as const,
      geometry: alert.affected_geography as GeoJSON.Geometry,
      properties: { id: alert.id, headline: alert.headline }
    }))
  }

  const initialViewState = {
    latitude: properties[0]?.latitude || 28.5383,
    longitude: properties[0]?.longitude || -81.3792,
    zoom: 6
  }

  return (
    <Card className="bg-panel backdrop-blur-lg border-border h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-accent" />
          <span>Live Disaster Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow m-4 rounded-lg overflow-hidden">
        <MapGL
          initialViewState={initialViewState}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <Source id="disaster-zones" type="geojson" data={geoJsonData}>
            <Layer
              id="disaster-zones-fill"
              type="fill"
              paint={{
                'fill-color': '#ff0000',
                'fill-opacity': 0.3
              }}
            />
          </Source>
          {properties.map(prop => prop.latitude && prop.longitude && (
            <Marker key={prop.id} latitude={prop.latitude} longitude={prop.longitude} onClick={() => setSelectedProperty(prop)}>
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white cursor-pointer" />
            </Marker>
          ))}
          {selectedProperty && selectedProperty.latitude && selectedProperty.longitude && (
            <Popup
              latitude={selectedProperty.latitude}
              longitude={selectedProperty.longitude}
              onClose={() => setSelectedProperty(null)}
              closeOnClick={false}
            >
              <div>
                <h3 className="font-bold">{selectedProperty.name}</h3>
                <p>{selectedProperty.address}</p>
                <button className="mt-2 w-full bg-accent text-white text-sm py-1 rounded">Start Claim</button>
              </div>
            </Popup>
          )}
        </MapGL>
      </CardContent>
    </Card>
  )
}

const PreparednessChecklist = () => {
  const [checklist, setChecklist] = useState({
    prepare: [
      { id: 'prep1', text: 'Photograph property exterior and interior', completed: false, isEvidence: true, link: '/ai-tools/evidence-organizer' },
      { id: 'prep2', text: 'Record a video walkthrough of your home\'s interior', completed: false, isEvidence: true, link: '/ai-tools/evidence-organizer' },
      { id: 'prep3', text: 'Upload photos of high-value items', completed: false, isEvidence: true, link: '/ai-tools/evidence-organizer' },
      { id: 'prep4', text: 'Secure outdoor furniture and loose items', completed: false },
      { id: 'prep5', text: 'Board up windows and glass doors', completed: false },
      { id: 'prep6', text: 'Assemble emergency kit (water, food, batteries)', completed: false },
      { id: 'prep7', text: 'Review insurance policy documents', completed: false, link: '/dashboard/policies' },
    ],
    survive: [
      { id: 'surv1', text: 'Stay indoors and away from windows', completed: false },
      { id: 'surv2', text: 'Monitor official news and weather alerts', completed: false },
      { id: 'surv3', text: 'Conserve phone battery life', completed: false },
    ],
    recover: [
      { id: 'recov1', text: 'Wait for the "all clear" from officials', completed: false },
      { id: 'recov2', text: 'Document all property damage with photos/videos', completed: false, isEvidence: true, link: '/ai-tools/evidence-organizer' },
      { id: 'recov3', text: 'Contact your insurance provider to start a claim', completed: false },
      { id: 'recov4', text: 'Make temporary repairs to prevent further damage', completed: false },
    ]
  })
  const [activeTab, setActiveTab] = useState<'prepare' | 'survive' | 'recover'>('prepare')

  useEffect(() => {
    async function loadProgress() {
      const { data, error } = await getChecklistProgress()
      if (error || !data) return

      const progressMap = new Map(data.map((item: { item_id: string; completed: boolean }) => [item.item_id, item.completed]))

      setChecklist(prev => ({
        prepare: prev.prepare.map(item => ({ ...item, completed: progressMap.get(item.id) ?? item.completed })),
        survive: prev.survive.map(item => ({ ...item, completed: progressMap.get(item.id) ?? item.completed })),
        recover: prev.recover.map(item => ({ ...item, completed: progressMap.get(item.id) ?? item.completed })),
      }))
    }
    loadProgress()
  }, [])

  const toggleItem = async (tab: 'prepare' | 'survive' | 'recover', id: string) => {
    const item = checklist[tab].find(i => i.id === id)
    if (!item) return

    const newCompletedState = !item.completed

    // Optimistically update UI
    setChecklist(prev => ({
      ...prev,
      [tab]: prev[tab].map(i =>
        i.id === id ? { ...i, completed: newCompletedState } : i
      )
    }))

    // Update backend
    await updateUserChecklist({ itemId: id, completed: newCompletedState })
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
              {'link' in item && item.link && (
                <Link href={item.link} className="text-accent hover:underline text-sm">
                  Go
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const resourceLinks = [
  { id: 'res1', name: 'National Hurricane Center', url: 'https://www.nhc.noaa.gov/' },
  { id: 'res2', name: 'Florida Division of Emergency Management', url: 'https://www.floridadisaster.org/' },
  { id: 'res3', name: 'FEMA', url: 'https://www.fema.gov/' },
  { id: 'res4', name: 'American Red Cross', url: 'https://www.redcross.org/' },
]

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
  const [properties, setProperties] = useState<Property[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDisasterHubData()
        if (data.error) {
          throw new Error(data.error)
        }
        setProperties(data.properties as Property[])
        setAlerts(data.alerts as Alert[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header Skeleton */}
          <div>
            <div className="h-8 bg-slate-700 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
          {/* Alert Skeleton */}
          <div className="h-24 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Map Skeleton */}
              <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
              {/* Checklist Skeleton */}
              <div className="h-64 bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {/* Properties Skeleton */}
              <div className="h-48 bg-slate-800 rounded-lg animate-pulse"></div>
              {/* Resources Skeleton */}
              <div className="h-48 bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Failed to load Disaster Hub data</h2>
          <p className="text-text-secondary mt-2">{error}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div id="disaster-hub-content" className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Disaster Hub</h1>
          <p className="text-text-secondary mt-1">Your command center for emergency preparedness and response.</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 ? (
          alerts.map(alert => <DisasterAlertBanner key={alert.id} alert={alert} />)
        ) : (
          <Card className="bg-green-900/30 border-green-500/50">
            <CardContent className="p-6 flex items-center gap-6">
              <CheckCircle className="w-12 h-12 text-green-400 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-white">All Clear</h2>
                <p className="text-green-200 mt-1">There are no active disaster alerts for your property locations.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <InteractiveMap properties={properties} alerts={alerts} />
            <PreparednessChecklist />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">My Properties</h3>
              <div className="space-y-4">
                {properties.length > 0 ? (
                  properties.map(prop => <PropertyStatusCard key={prop.id} property={prop} />)
                ) : (
                  <p className="text-text-secondary">No properties with location data found.</p>
                )}
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
