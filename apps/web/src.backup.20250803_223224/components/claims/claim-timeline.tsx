'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  User
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export interface TimelineEvent {
  id: string
  claimId: string
  date: string
  time?: string
  type: 'status_change' | 'document_upload' | 'communication' | 'payment' | 'inspection' | 'estimate' | 'other'
  category?: 'internal' | 'insurance' | 'contractor' | 'user'
  title: string
  description: string
  metadata?: {
    oldStatus?: string
    newStatus?: string
    amount?: number
    documentCount?: number
    contactName?: string
    contactRole?: string
    contactMethod?: 'phone' | 'email' | 'in-person' | 'portal'
  }
  createdBy?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
}

interface ClaimTimelineProps {
  claimId: string
  events?: TimelineEvent[]
  onEventAdd?: (event: TimelineEvent) => void
  allowAddEvent?: boolean
}

const EVENT_TYPE_CONFIG = {
  status_change: {
    label: 'Status Change',
    icon: CheckCircle,
    color: 'bg-blue-600'
  },
  document_upload: {
    label: 'Document Upload',
    icon: FileText,
    color: 'bg-green-600'
  },
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    color: 'bg-purple-600'
  },
  payment: {
    label: 'Payment',
    icon: DollarSign,
    color: 'bg-emerald-600'
  },
  inspection: {
    label: 'Inspection',
    icon: Home,
    color: 'bg-orange-600'
  },
  estimate: {
    label: 'Estimate',
    icon: FileText,
    color: 'bg-cyan-600'
  },
  other: {
    label: 'Other',
    icon: AlertCircle,
    color: 'bg-gray-600'
  }
}

export function ClaimTimeline({ claimId, events: initialEvents = [], onEventAdd, allowAddEvent = false }: ClaimTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    type: 'communication',
    category: 'user',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  })

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.description) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()
      
      // Create new event
      const event: TimelineEvent = {
        id: `temp-${Date.now()}`,
        claimId,
        date: newEvent.date!,
        time: newEvent.time,
        type: newEvent.type as TimelineEvent['type'],
        category: newEvent.category as TimelineEvent['category'],
        title: newEvent.title!,
        description: newEvent.description!,
        metadata: newEvent.metadata,
        createdBy: 'current-user' // In production, get from auth context
      }

      // Save to database (mock for now)
      const { error } = await supabase
        .from('claim_timeline_events')
        .insert({
          claim_id: claimId,
          ...event
        })

      if (error) {
        console.error('Error saving timeline event:', error)
        // Continue anyway for demo
      }

      // Update local state
      setEvents(prev => [event, ...prev])
      
      // Notify parent
      if (onEventAdd) {
        onEventAdd(event)
      }

      // Reset form
      setNewEvent({
        type: 'communication',
        category: 'user',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })
      setIsAddingEvent(false)
      
      toast.success('Timeline event added')
    } catch (error) {
      console.error('Error adding timeline event:', error)
      toast.error('Failed to add timeline event')
    }
  }

  const getEventIcon = (type: TimelineEvent['type']) => {
    return EVENT_TYPE_CONFIG[type]?.icon || AlertCircle
  }

  const getEventColor = (type: TimelineEvent['type']) => {
    return EVENT_TYPE_CONFIG[type]?.color || 'bg-gray-600'
  }

  const getCategoryBadgeColor = (category?: string) => {
    switch (category) {
      case 'internal': return 'bg-gray-600'
      case 'insurance': return 'bg-blue-600'
      case 'contractor': return 'bg-green-600'
      case 'user': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }


  return (
    <div className="space-y-6">
      {/* Header with Add Event */}
      {allowAddEvent && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Claim Timeline</h3>
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle>Add Timeline Event</DialogTitle>
                <DialogDescription>
                  Record an important event in your claim history
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, type: value as TimelineEvent['type'] })}
                    >
                      <SelectTrigger id="event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="event-category">Category</Label>
                    <Select
                      value={newEvent.category}
                      onValueChange={(value) => setNewEvent({ ...newEvent, category: value as TimelineEvent['category'] })}
                    >
                      <SelectTrigger id="event-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User Action</SelectItem>
                        <SelectItem value="insurance">Insurance Company</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="internal">Internal Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="event-time">Time (optional)</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEvent.time || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-title">Title</Label>
                  <Input
                    id="event-title"
                    value={newEvent.title || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Brief summary of the event"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Detailed description of what happened"
                    rows={3}
                  />
                </div>

                {/* Additional fields based on event type */}
                {newEvent.type === 'payment' && (
                  <div>
                    <Label htmlFor="payment-amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="payment-amount"
                        type="number"
                        className="pl-10"
                        placeholder="0.00"
                        onChange={(e) => setNewEvent({
                          ...newEvent,
                          metadata: {
                            ...newEvent.metadata,
                            amount: parseFloat(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                )}

                {newEvent.type === 'communication' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Contact Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Who did you speak with?"
                        onChange={(e) => setNewEvent({
                          ...newEvent,
                          metadata: {
                            ...newEvent.metadata,
                            contactName: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-method">Contact Method</Label>
                      <Select
                        onValueChange={(value) => setNewEvent({
                          ...newEvent,
                          metadata: {
                            ...newEvent.metadata,
                            contactMethod: value as 'phone' | 'email' | 'in-person' | 'portal'
                          }
                        })}
                      >
                        <SelectTrigger id="contact-method">
                          <SelectValue placeholder="How did you communicate?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                          <SelectItem value="portal">Online Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingEvent(false)}
                    className="border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEvent}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Timeline Events */}
      {sortedDates.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No timeline events yet</h3>
            <p className="text-gray-400">
              Timeline events will appear here as your claim progresses
            </p>
            {allowAddEvent && (
              <Button
                onClick={() => setIsAddingEvent(true)}
                className="mt-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date, dateIndex) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-white">{date}</h3>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              
              {/* Events for this date */}
              <div className="ml-9 space-y-4">
                {groupedEvents[date]
                  .sort((a, b) => {
                    // Sort by time if available, otherwise by creation order
                    if (a.time && b.time) {
                      return b.time.localeCompare(a.time)
                    }
                    return 0
                  })
                  .map((event, eventIndex) => {
                    const Icon = getEventIcon(event.type)
                    const isLastEvent = 
                      dateIndex === sortedDates.length - 1 && 
                      eventIndex === groupedEvents[date].length - 1
                    
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {!isLastEvent && (
                            <div className="absolute top-10 left-5 w-px h-full bg-gray-700" />
                          )}
                        </div>
                        
                        <Card className="flex-1 bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-medium text-white">{event.title}</h4>
                                  {event.category && (
                                    <Badge className={`${getCategoryBadgeColor(event.category)} text-white text-xs`}>
                                      {event.category}
                                    </Badge>
                                  )}
                                </div>
                                {event.time && (
                                  <p className="text-sm text-gray-400">{event.time}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {EVENT_TYPE_CONFIG[event.type]?.label}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-300 mb-3">{event.description}</p>
                            
                            {/* Metadata display */}
                            {event.metadata && (
                              <div className="flex flex-wrap gap-4 text-sm">
                                {event.metadata.amount && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400">
                                      ${event.metadata.amount.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                
                                {event.metadata.contactName && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-400">
                                      {event.metadata.contactName}
                                    </span>
                                  </div>
                                )}
                                
                                {event.metadata.contactMethod && (
                                  <div className="flex items-center gap-2">
                                    {event.metadata.contactMethod === 'phone' && <Phone className="w-4 h-4 text-gray-400" />}
                                    {event.metadata.contactMethod === 'email' && <Mail className="w-4 h-4 text-gray-400" />}
                                    <span className="text-gray-400">
                                      {event.metadata.contactMethod}
                                    </span>
                                  </div>
                                )}
                                
                                {event.metadata.documentCount && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-400">
                                      {event.metadata.documentCount} documents
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Attachments */}
                            {event.attachments && event.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                <p className="text-xs text-gray-400 mb-2">Attachments</p>
                                <div className="flex flex-wrap gap-2">
                                  {event.attachments.map((attachment, i) => (
                                    <a
                                      key={i}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}