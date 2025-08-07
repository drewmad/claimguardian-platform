/**
 * @fileMetadata
 * @purpose "Unit tests for NIMS integration modules"
 * @dependencies ["@jest/globals", "../disaster-workflow", "../emergency-communications", "../ics-integration"]
 * @owner emergency-management-team
 * @status stable
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DisasterWorkflowManager, ResponsePhase, WorkflowStatus } from '../disaster-workflow';
import { EmergencyCommunicationManager, MessagePriority, CommunicationChannel } from '../emergency-communications';
import { ICSIntegrationService, IncidentType, IncidentComplexity, ICSPosition } from '../ics-integration';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: mockIncident, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock xml2js
jest.mock('xml2js', () => ({
  parseString: jest.fn((xml, callback) => {
    callback(null, {
      alert: {
        identifier: ['test-123'],
        sender: ['test@example.com'],
        sent: ['2025-01-07T12:00:00Z'],
        status: ['Actual'],
        msgType: ['Alert'],
        scope: ['Public'],
        info: [{
          category: ['Safety'],
          event: ['Test Alert'],
          urgency: ['Immediate'],
          severity: ['Moderate'],
          certainty: ['Likely']
        }]
      }
    });
  })
}));

const mockIncident = {
  id: 'test-incident',
  incident_number: '2025-0001',
  incident_name: 'Test Hurricane',
  incident_type: IncidentType.HURRICANE,
  complexity_level: IncidentComplexity.TYPE_3,
  location: {
    lat: 27.7663,
    lng: -82.6404,
    address: 'Tampa Bay, FL',
    jurisdiction: 'Hillsborough County'
  },
  start_date: '2025-01-07T12:00:00Z',
  status: 'active',
  objectives: [],
  organization: {
    incident_commander: {
      id: 'ic-001',
      name: 'John Smith',
      position: ICSPosition.INCIDENT_COMMANDER,
      agency: 'Emergency Management',
      contact: { phone: '555-0001', radio: 'RADIO1', email: 'ic@example.com' },
      qualifications: ['ICS-400', 'Position Task Book'],
      assignments: [],
      check_in_time: '2025-01-07T08:00:00Z'
    },
    command_staff: {},
    general_staff: {}
  },
  resources: [],
  forms: [],
  operational_period: {
    start: '2025-01-07T08:00:00Z',
    end: '2025-01-07T20:00:00Z',
    period_number: 1
  },
  weather: {
    current_conditions: 'Partly cloudy, winds 15mph',
    forecast: 'Hurricane approaching from south',
    wind_speed: 15,
    temperature: 78
  },
  created_by: 'test-user',
  last_updated: '2025-01-07T12:00:00Z'
};

describe('NIMS Integration', () => {
  let disasterWorkflowManager: DisasterWorkflowManager;
  let emergencyCommunicationManager: EmergencyCommunicationManager;
  let icsIntegrationService: ICSIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    disasterWorkflowManager = new DisasterWorkflowManager();
    emergencyCommunicationManager = new EmergencyCommunicationManager();
    icsIntegrationService = new ICSIntegrationService();
  });

  describe('DisasterWorkflowManager', () => {
    it('should create workflow with proper defaults', async () => {
      const workflow = await disasterWorkflowManager.createWorkflow(
        'test-incident-id',
        IncidentType.HURRICANE,
        {
          workflow_name: 'Test Hurricane Response'
        }
      );

      expect(workflow).toMatchObject({
        incident_id: 'test-incident-id',
        workflow_name: 'Test Hurricane Response',
        incident_type: IncidentType.HURRICANE,
        current_phase: ResponsePhase.PREPAREDNESS,
        status: WorkflowStatus.INITIATED,
        priority_level: MessagePriority.IMMEDIATE
      });
      expect(workflow.id).toMatch(/^WF-\d+-[A-Z0-9]+$/);
      expect(Array.isArray(workflow.phases)).toBe(true);
    });

    it('should use hurricane workflow template', async () => {
      const workflow = await disasterWorkflowManager.createWorkflow(
        'test-incident-id',
        IncidentType.HURRICANE
      );

      expect(workflow.workflow_name).toBe('Hurricane Response Workflow');
      expect(workflow.phases.length).toBeGreaterThan(0);
      
      // Check for hurricane-specific phases
      const prepPhase = workflow.phases.find(p => p.phase === ResponsePhase.PREPAREDNESS);
      const responsePhase = workflow.phases.find(p => p.phase === ResponsePhase.RESPONSE);
      
      expect(prepPhase).toBeDefined();
      expect(responsePhase).toBeDefined();
      expect(prepPhase?.phase_name).toBe('Hurricane Preparedness');
      expect(responsePhase?.phase_name).toBe('Hurricane Response');
    });

    it('should assign resources to activities', async () => {
      const assignment = await disasterWorkflowManager.assignResourceToActivity(
        'test-workflow-id',
        'test-activity-id',
        'test-resource-id',
        'primary'
      );

      expect(assignment).toMatchObject({
        resource_id: 'test-resource-id',
        activity_id: 'test-activity-id',
        assignment_type: 'primary',
        utilization_rate: 1.0
      });
      expect(assignment.id).toMatch(/^ASN-\d+-[A-Z0-9]+$/);
    });
  });

  describe('EmergencyCommunicationManager', () => {
    it('should create emergency alert with proper CAP structure', async () => {
      const alertData = {
        sender_id: 'test-sender',
        title: 'Hurricane Warning',
        message: 'Hurricane approaching Tampa Bay area',
        priority: MessagePriority.IMMEDIATE,
        category: ['Safety', 'Met'],
        urgency: 'Immediate' as const,
        severity: 'Severe' as const,
        certainty: 'Likely' as const
      };

      const alert = await emergencyCommunicationManager.createEmergencyAlert(alertData);

      expect(alert).toMatchObject({
        sender_id: 'test-sender',
        title: 'Hurricane Warning',
        message: 'Hurricane approaching Tampa Bay area',
        priority: MessagePriority.IMMEDIATE,
        status: 'draft'
      });
      expect(alert.id).toMatch(/^ALERT-\d+-[A-Z0-9]+$/);
      expect(alert.alert_id).toMatch(/^ClaimGuardian-\d+-[A-Z0-9]+$/);
      expect(alert.cap_message).toBeDefined();
      expect(alert.edxl_distribution).toBeDefined();
    });

    it('should generate valid CAP XML', () => {
      const capMessage = {
        identifier: 'TEST-001',
        sender: 'test@example.com',
        sent: '2025-01-07T12:00:00Z',
        status: 'Actual' as const,
        msgType: 'Alert' as const,
        scope: 'Public' as const,
        info: [{
          category: ['Safety' as const],
          event: 'Test Alert',
          urgency: 'Immediate' as const,
          severity: 'Moderate' as const,
          certainty: 'Likely' as const,
          headline: 'Test Headline',
          description: 'Test Description'
        }]
      };

      const xml = emergencyCommunicationManager.generateCAPXML(capMessage);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">');
      expect(xml).toContain('<identifier>TEST-001</identifier>');
      expect(xml).toContain('<sender>test@example.com</sender>');
      expect(xml).toContain('<status>Actual</status>');
      expect(xml).toContain('<msgType>Alert</msgType>');
      expect(xml).toContain('<scope>Public</scope>');
      expect(xml).toContain('<category>Safety</category>');
      expect(xml).toContain('<event>Test Alert</event>');
    });

    it('should parse incoming CAP message correctly', () => {
      const capXML = `<?xml version="1.0" encoding="UTF-8"?>
        <alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
          <identifier>test-123</identifier>
          <sender>test@example.com</sender>
          <sent>2025-01-07T12:00:00Z</sent>
          <status>Actual</status>
          <msgType>Alert</msgType>
          <scope>Public</scope>
          <info>
            <category>Safety</category>
            <event>Test Alert</event>
            <urgency>Immediate</urgency>
            <severity>Moderate</severity>
            <certainty>Likely</certainty>
          </info>
        </alert>`;

      const parsed = emergencyCommunicationManager.parseIncomingCAP(capXML);

      expect(parsed).toMatchObject({
        identifier: 'test-123',
        sender: 'test@example.com',
        sent: '2025-01-07T12:00:00Z',
        status: 'Actual',
        msgType: 'Alert',
        scope: 'Public'
      });
      expect(parsed.info).toHaveLength(1);
      expect(parsed.info[0]).toMatchObject({
        event: 'Test Alert',
        urgency: 'Immediate',
        severity: 'Moderate',
        certainty: 'Likely'
      });
    });
  });

  describe('ICSIntegrationService', () => {
    it('should create incident with proper ICS structure', async () => {
      const incidentData = {
        incident_name: 'Test Hurricane Incident',
        incident_type: IncidentType.HURRICANE,
        complexity_level: IncidentComplexity.TYPE_3,
        location: {
          lat: 27.7663,
          lng: -82.6404,
          address: 'Tampa Bay, FL',
          jurisdiction: 'Hillsborough County'
        }
      };

      const incident = await icsIntegrationService.createIncident(incidentData);

      expect(incident).toMatchObject({
        incident_name: 'Test Hurricane Incident',
        incident_type: IncidentType.HURRICANE,
        complexity_level: IncidentComplexity.TYPE_3,
        status: 'active'
      });
      expect(incident.id).toMatch(/^INC-\d+-[A-Z0-9]+$/);
      expect(incident.incident_number).toMatch(/^\d{4}-\d{4}$/);
      expect(incident.organization.incident_commander).toBeDefined();
      expect(incident.operational_period.period_number).toBe(1);
    });

    it('should generate ICS-201 form correctly', async () => {
      const form = await icsIntegrationService.generateICS201('test-incident');

      expect(form).toMatchObject({
        form_number: 'ICS-201',
        form_name: 'Incident Briefing',
        incident_id: 'test-incident',
        status: 'draft'
      });
      expect(form.id).toMatch(/^FORM-\d+-[A-Z0-9]+$/);
      expect(form.data.incident_name).toBe('Test Hurricane');
      expect(form.data.incident_commander).toBe('John Smith');
      expect(form.data.current_situation).toContain('hurricane incident');
    });

    it('should generate ICS-202 form with objectives', async () => {
      const objectives = [{
        id: 'obj-1',
        objective_number: 1,
        description: 'Ensure public safety through evacuation',
        priority: 'high' as const,
        assigned_to: [ICSPosition.OPERATIONS_CHIEF],
        due_date: '2025-01-07T18:00:00Z',
        status: 'not_started' as const,
        progress_notes: []
      }];

      const form = await icsIntegrationService.generateICS202('test-incident', objectives);

      expect(form).toMatchObject({
        form_number: 'ICS-202',
        form_name: 'Incident Objectives',
        incident_id: 'test-incident',
        status: 'draft'
      });
      expect(form.data.objectives).toHaveLength(1);
      expect(form.data.objectives[0]).toMatchObject({
        number: 1,
        description: 'Ensure public safety through evacuation',
        responsible_assignment: 'OPS'
      });
    });

    it('should submit resource request with proper tracking', async () => {
      const requestData = {
        incident_id: 'test-incident',
        requested_by: ICSPosition.OPERATIONS_CHIEF,
        resource_type: 'Emergency Generator',
        quantity: 2,
        priority: 'high' as const,
        needed_by: '2025-01-07T16:00:00Z',
        mission: 'Power restoration for emergency shelter'
      };

      const request = await icsIntegrationService.submitResourceRequest(requestData);

      expect(request).toMatchObject({
        incident_id: 'test-incident',
        requested_by: ICSPosition.OPERATIONS_CHIEF,
        resource_type: 'Emergency Generator',
        quantity: 2,
        priority: 'high',
        status: 'open'
      });
      expect(request.id).toMatch(/^REQ-\d+-[A-Z0-9]+$/);
      expect(request.request_number).toMatch(/^RR-\d+$/);
    });
  });

  describe('Integration Testing', () => {
    it('should coordinate workflow activation with ICS incident', async () => {
      // Create ICS incident
      const incident = await icsIntegrationService.createIncident({
        incident_name: 'Hurricane Milton',
        incident_type: IncidentType.HURRICANE,
        complexity_level: IncidentComplexity.TYPE_2
      });

      // Create corresponding workflow
      const workflow = await disasterWorkflowManager.createWorkflow(
        incident.id,
        IncidentType.HURRICANE
      );

      // Create emergency alert
      const alert = await emergencyCommunicationManager.createEmergencyAlert({
        sender_id: incident.organization.incident_commander.id,
        title: `${incident.incident_name} Response Activated`,
        message: `Disaster response workflow activated for ${incident.incident_type}`,
        priority: MessagePriority.IMMEDIATE,
        category: ['Safety'],
        urgency: 'Expected',
        severity: 'Moderate',
        certainty: 'Likely'
      });

      expect(incident.id).toBe(workflow.incident_id);
      expect(workflow.incident_type).toBe(incident.incident_type);
      expect(alert.title).toContain(incident.incident_name);
      expect(alert.sender_id).toBe(incident.organization.incident_commander.id);
    });
  });
});