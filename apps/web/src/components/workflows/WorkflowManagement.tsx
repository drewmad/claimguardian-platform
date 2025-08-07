'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Zap,
  Play,
  Pause,
  Settings,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Camera,
  Mail,
  MessageSquare,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Copy,
  Home
} from 'lucide-react';

interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual';
  event?: string;
  schedule?: string;
  conditions?: string[];
}

interface WorkflowAction {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  icon: typeof Zap;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  lastRun?: string;
  runCount: number;
  category: 'claim' | 'property' | 'maintenance' | 'communication';
}

const actionTemplates = [
  { type: 'document_capture', name: 'Capture Documents', icon: Camera },
  { type: 'ai_analysis', name: 'AI Analysis', icon: TrendingUp },
  { type: 'send_email', name: 'Send Email', icon: Mail },
  { type: 'send_sms', name: 'Send SMS', icon: MessageSquare },
  { type: 'create_task', name: 'Create Task', icon: CheckCircle },
  { type: 'update_claim', name: 'Update Claim', icon: Shield },
  { type: 'schedule_inspection', name: 'Schedule Inspection', icon: Calendar },
  { type: 'calculate_estimate', name: 'Calculate Estimate', icon: DollarSign },
  { type: 'generate_report', name: 'Generate Report', icon: FileText }
];

const workflowTemplates: Workflow[] = [
  {
    id: '1',
    name: 'New Claim Auto-Documentation',
    description: 'Automatically collect and analyze documentation when a new claim is created',
    status: 'active',
    trigger: { type: 'event', event: 'claim.created' },
    actions: [
      { id: '1', type: 'document_capture', name: 'Request Photos', config: {}, icon: Camera },
      { id: '2', type: 'ai_analysis', name: 'Analyze Damage', config: {}, icon: TrendingUp },
      { id: '3', type: 'generate_report', name: 'Create Report', config: {}, icon: FileText },
      { id: '4', type: 'send_email', name: 'Send to Adjuster', config: {}, icon: Mail }
    ],
    lastRun: '2 hours ago',
    runCount: 47,
    category: 'claim'
  },
  {
    id: '2',
    name: 'Weekly Property Check-In',
    description: 'Send property condition reminders and collect updates weekly',
    status: 'active',
    trigger: { type: 'schedule', schedule: 'Every Monday at 9:00 AM' },
    actions: [
      { id: '1', type: 'send_email', name: 'Send Reminder', config: {}, icon: Mail },
      { id: '2', type: 'create_task', name: 'Create Inspection Task', config: {}, icon: CheckCircle }
    ],
    lastRun: '3 days ago',
    runCount: 156,
    category: 'property'
  },
  {
    id: '3',
    name: 'Storm Alert Response',
    description: 'Activate emergency procedures when severe weather is detected',
    status: 'inactive',
    trigger: { type: 'event', event: 'weather.severe_alert' },
    actions: [
      { id: '1', type: 'send_sms', name: 'Alert Homeowner', config: {}, icon: MessageSquare },
      { id: '2', type: 'create_task', name: 'Pre-Storm Checklist', config: {}, icon: CheckCircle },
      { id: '3', type: 'document_capture', name: 'Pre-Storm Photos', config: {}, icon: Camera }
    ],
    runCount: 12,
    category: 'property'
  }
];

export function WorkflowManagement() {
  const [workflows, setWorkflows] = useState<Workflow[]>(workflowTemplates);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf =>
      wf.id === workflowId
        ? { ...wf, status: wf.status === 'active' ? 'inactive' : 'active' }
        : wf
    ));
    toast.success('Workflow status updated');
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    const newWorkflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      status: 'draft' as const,
      runCount: 0,
      lastRun: undefined
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    toast.success('Workflow duplicated');
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(wf => wf.id !== workflowId));
    toast.success('Workflow deleted');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'claim': return Shield;
      case 'property': return Home;
      case 'maintenance': return Settings;
      case 'communication': return MessageSquare;
      default: return Zap;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-gray-600">Automate repetitive tasks and streamline your processes</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Workflows</TabsTrigger>
          <TabsTrigger value="claim">Claims</TabsTrigger>
          <TabsTrigger value="property">Properties</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        {['all', 'claim', 'property', 'maintenance', 'communication'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {workflows
              .filter(wf => tab === 'all' || wf.category === tab)
              .map(workflow => {
                const CategoryIcon = getCategoryIcon(workflow.category);

                return (
                  <Card key={workflow.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CategoryIcon className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-lg">{workflow.name}</h3>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mb-4">{workflow.description}</p>

                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {workflow.trigger.type === 'schedule'
                                  ? workflow.trigger.schedule
                                  : workflow.trigger.event}
                              </span>
                            </div>
                            {workflow.lastRun && (
                              <div className="flex items-center space-x-1">
                                <Play className="h-4 w-4" />
                                <span>Last run: {workflow.lastRun}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>{workflow.runCount} runs</span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center space-x-2">
                            {workflow.actions.map((action, index) => {
                              const Icon = action.icon;
                              return (
                                <div key={action.id} className="flex items-center">
                                  <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded">
                                    <Icon className="h-4 w-4 text-gray-600" />
                                    <span className="text-xs">{action.name}</span>
                                  </div>
                                  {index < workflow.actions.length - 1 && (
                                    <ArrowRight className="h-4 w-4 text-gray-400 mx-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={workflow.status === 'active'}
                            onCheckedChange={() => toggleWorkflow(workflow.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicateWorkflow(workflow)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Workflow Creation Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
            <CardDescription>
              Set up automated actions for your properties and claims
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                placeholder="e.g., New Claim Auto-Documentation"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Input
                id="workflow-description"
                placeholder="What does this workflow do?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="workflow-trigger">Trigger</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claim.created">When claim is created</SelectItem>
                  <SelectItem value="claim.updated">When claim is updated</SelectItem>
                  <SelectItem value="property.added">When property is added</SelectItem>
                  <SelectItem value="schedule.daily">Daily schedule</SelectItem>
                  <SelectItem value="schedule.weekly">Weekly schedule</SelectItem>
                  <SelectItem value="weather.alert">Weather alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Actions</Label>
              <div className="mt-2 space-y-2">
                {actionTemplates.slice(0, 4).map((template) => {
                  const Icon = template.icon;
                  return (
                    <div key={template.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <span>{template.name}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Workflow created successfully');
                setIsCreating(false);
              }}>
                Create Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
